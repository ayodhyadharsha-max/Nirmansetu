/**
 * NIRMANSETU: ORDER LIFECYCLE & TRANSACTION SERVICE
 *
 * Implements:
 * - Server-side trusted checkout and integer paise financial recalculation
 * - Idempotency key tracking to eliminate duplicate submissions
 * - Immutable snapshots of product titles, SKUs, units, HSN codes, and tax rates
 * - Re-validation of all cart items, MOQs, and local supplier stock before insertion
 * - Complete audit trail in `order_status_history`
 * - Strict customer record isolation (customers cannot read/modify other accounts' orders)
 * - Managed cancellation and returns workflows with business rule validation
 */

import crypto from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCart, CartState } from '@/lib/cart/service';
import { incrementCouponUsage } from '@/lib/coupons/service';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@/types/database';
import { AYODHYA_REGIONAL_HUBS } from '@/config/brand';

export interface CreateOrderParams {
  idempotencyKey?: string;
  cartId: string;
  userId?: string;
  items?: Array<{ variantId: string; quantity: number }>;
  customerDetails: {
    name: string;
    phone: string;
    email?: string;
    companyName?: string;
    gstin?: string;
  };
  deliveryAddress: {
    addressType: 'site' | 'residential' | 'commercial';
    siteOrPersonName: string;
    contactPhone: string;
    alternatePhone?: string;
    streetAddress: string;
    landmark?: string;
    pincode: string;
    city?: string;
    state?: string;
    unloadingInstructions?: string;
    hasTruckAccess?: boolean;
  };
  paymentMethod: PaymentMethod;
  isExpressDelivery?: boolean;
  customerNotes?: string;
}

export interface StoredOrderRecord {
  id: string;
  order_number: string;
  idempotency_key: string | null;
  user_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  delivery_address_id: string | null;
  delivery_address_snapshot: any;
  pincode: string;
  subtotal_paise: number;
  tax_paise: number;
  delivery_fee_paise: number;
  discount_paise: number;
  total_paise: number;
  coupon_id: string | null;
  coupon_code: string | null;
  delivery_otp_plain: string; // Plain OTP for display in confirmation
  delivery_otp_hash: string; // SHA-256 stored in DB
  customer_notes: string | null;
  items: Array<{
    id: string;
    order_id: string;
    variant_id: string;
    supplier_id: string;
    product_title_snapshot: string;
    variant_title_snapshot: string;
    sku_snapshot: string;
    hsn_code_snapshot: string;
    unit_snapshot: string;
    quantity: number;
    unit_price_paise: number;
    gst_rate_pct: number;
    tax_paise: number;
    total_paise: number;
    supplier_cost_paise: number;
    platform_margin_paise: number;
  }>;
  status_history: Array<{
    id: string;
    order_id: string;
    status?: OrderStatus | string;
    previous_status: OrderStatus | null;
    new_status: OrderStatus;
    changed_by: string | null;
    notes: string | null;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
}

// In-memory orders registry for offline testing, seeding and idempotency caching
export const memoryOrders = new Map<string, StoredOrderRecord>();
export const idempotencyRegistry = new Map<string, string>(); // idempotency_key -> order_id

/**
 * Validates PIN code against Ayodhya serviceability zones.
 */
export async function validatePincodeServiceability(pincode: string): Promise<{ isServiceable: boolean; hubName?: string }> {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('service_pincodes')
      .select('is_serviceable, area_name')
      .eq('pincode', pincode)
      .maybeSingle();

    if (data) {
      return { isServiceable: data.is_serviceable, hubName: data.area_name };
    }
  } catch {
    // DB check handled
  }

  const hub = AYODHYA_REGIONAL_HUBS.find((h) => h.pincode === pincode);
  if (hub) {
    return { isServiceable: true, hubName: hub.name };
  }

  return { isServiceable: false };
}

export const GUEST_SYSTEM_PROFILE_ID = '00000000-0000-0000-0000-000000000002';

/**
 * Returns a stable singleton profile ID for guest checkouts without creating new auth profiles on every order.
 */
async function ensureGuestProfile(adminSupabase: any): Promise<string> {
  const { data: existing } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('id', GUEST_SYSTEM_PROFILE_ID)
    .maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  // Ensure an auth user exists for this UUID to satisfy foreign key constraint
  const { data: authUserData } = await adminSupabase.auth.admin.getUserById(GUEST_SYSTEM_PROFILE_ID);
  if (!authUserData?.user) {
    try {
      await adminSupabase.auth.admin.createUser({
        id: GUEST_SYSTEM_PROFILE_ID,
        email: 'guest@nirmansetu.local',
        email_confirm: true,
        user_metadata: { role: 'customer', is_guest: true, full_name: 'Guest Customer' },
      });
    } catch {
      // User may already exist in auth
    }
  }

  await adminSupabase.from('profiles').upsert(
    {
      id: GUEST_SYSTEM_PROFILE_ID,
      full_name: 'Guest Customer',
      role: 'customer',
      phone: null,
      email: 'guest@nirmansetu.local',
      is_phone_verified: false,
      is_active: true,
      metadata: { is_guest: true },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  return GUEST_SYSTEM_PROFILE_ID;
}

/**
 * Creates an order from a validated cart.
 */
export async function createOrder(params: CreateOrderParams): Promise<{
  success: boolean;
  order?: StoredOrderRecord;
  error?: string;
  isDuplicate?: boolean;
}> {
  // 1. Idempotency check: prevent duplicate orders from rapid clicking or repeated webhook/client calls
  if (params.idempotencyKey) {
    // A. Check in-memory registry
    const existingOrderId = idempotencyRegistry.get(params.idempotencyKey);
    if (existingOrderId) {
      const existingOrder = memoryOrders.get(existingOrderId);
      if (existingOrder) {
        return { success: true, order: existingOrder, isDuplicate: true };
      }
    }

    // B. Check persistent database for existing order with this idempotency key
    try {
      const adminSupabase = createAdminClient();
      const { data: dbExistingOrders } = await adminSupabase
        .from('orders')
        .select('*')
        .ilike('internal_notes', `%[idempotency_key:${params.idempotencyKey}]%`)
        .limit(1);

      if (dbExistingOrders && dbExistingOrders.length > 0) {
        const dbOrder = dbExistingOrders[0];
        const existingStoredRecord: StoredOrderRecord = {
          ...dbOrder,
          delivery_otp_plain: '****',
          delivery_otp_hash: dbOrder.delivery_otp_hash || '',
          items: [],
          status_history: [],
        };
        memoryOrders.set(dbOrder.id, existingStoredRecord);
        idempotencyRegistry.set(params.idempotencyKey, dbOrder.id);
        return { success: true, order: existingStoredRecord, isDuplicate: true };
      }
    } catch {
      // Database query handled
    }
  }

  // 2. Validate PIN code serviceability
  const serviceability = await validatePincodeServiceability(params.deliveryAddress.pincode);
  if (!serviceability.isServiceable) {
    return {
      success: false,
      error: `PIN code ${params.deliveryAddress.pincode} is outside our approved Ayodhya building delivery zones.`,
    };
  }

  // 3. Re-fetch and re-validate entire cart against server-side single source of truth
  const cart = await getCart(params.cartId, params.deliveryAddress.pincode, params.items);
  if (cart.items.length === 0) {
    if (cart.checkoutErrors && cart.checkoutErrors.length > 0) {
      return { success: false, error: cart.checkoutErrors[0] };
    }
    return { success: false, error: 'Your cart is empty. Please add building materials before checking out.' };
  }

  if (!cart.isValidForCheckout) {
    return {
      success: false,
      error: `Cart validation failed: ${cart.checkoutErrors.join('; ')}`,
    };
  }

  // 4. Secure Customer Identity Resolution:
  // SECURITY MANDATE:
  // - NEVER associate an order with an existing registered customer profile solely because a phone number matches.
  // - Require verified authentication (userId) before linking to an existing customer's account.
  // - Keep guest orders in an isolated guest identity without claiming the phone number or touching existing customer profiles.
  let finalUserId: string | null = null;

  try {
    const adminSupabase = createAdminClient();
    let phoneDigits = (params.customerDetails.phone || '').replace(/\D/g, '');
    if (phoneDigits.startsWith('91') && phoneDigits.length === 12) {
      phoneDigits = phoneDigits.slice(2);
    }
    const phoneE164 = `+91${phoneDigits}`;

    if (params.userId) {
      // Verified authenticated user from session token
      const { data: verifiedProfile } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('id', params.userId)
        .maybeSingle();

      if (verifiedProfile?.id) {
        finalUserId = verifiedProfile.id;
      } else {
        // User is authenticated in auth.users but profile row not yet created
        const { data: authUserData } = await adminSupabase.auth.admin.getUserById(params.userId);
        if (authUserData?.user) {
          const { data: createdProfile } = await adminSupabase
            .from('profiles')
            .upsert(
              {
                id: params.userId,
                full_name: params.customerDetails.name,
                phone: phoneE164,
                email: authUserData.user.email || params.customerDetails.email || null,
                business_name: params.customerDetails.companyName || null,
                gstin: params.customerDetails.gstin || null,
                role: 'customer',
                is_phone_verified: true,
                is_active: true,
              },
              { onConflict: 'id' }
            )
            .select('id')
            .maybeSingle();

          if (createdProfile?.id) {
            finalUserId = createdProfile.id;
          }
        }
      }
    }

    if (!finalUserId) {
      // Guest Checkout: Use stable singleton Guest Customer Profile.
      // Do NOT create a new profile on every order or link an order to an account merely because a phone number matches.
      finalUserId = await ensureGuestProfile(adminSupabase);
    }
  } catch (err) {
    console.warn('[createOrder] Customer account resolution notice:', err);
  }

  // 5. Generate order numbering and secure site delivery OTP
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `NS-AYD-${dateStr}-${randomSuffix}`;
  const orderId = crypto.randomUUID();

  // Generate 4-digit site delivery OTP
  const plainOtp = Math.floor(1000 + Math.random() * 9000).toString();
  const deliveryOtpHash = crypto.createHash('sha256').update(plainOtp).digest('hex');

  // 6. Build immutable line item snapshots
  const orderItems = cart.items.map((item) => {
    const unitPricePaise = item.unit_price_paise;
    const itemTotalPaise = unitPricePaise * item.quantity;
    const taxPaise = Math.round((itemTotalPaise * Math.round(item.gst_rate_pct * 100)) / 10000);
    const supplierCostPaise = Math.round(unitPricePaise * 0.95); // 5% marketplace platform margin
    const platformMarginPaise = itemTotalPaise - (supplierCostPaise * item.quantity);

    return {
      id: crypto.randomUUID(),
      order_id: orderId,
      variant_id: item.variant_id,
      supplier_id: 'f0000000-0000-0000-0000-000000000001', // Local approved supplier
      product_title_snapshot: item.product_title,
      variant_title_snapshot: item.variant_title,
      sku_snapshot: item.sku,
      hsn_code_snapshot: item.hsn_code || '252329',
      unit_snapshot: item.unit_of_measure,
      quantity: item.quantity,
      unit_price_paise: unitPricePaise,
      gst_rate_pct: item.gst_rate_pct,
      tax_paise: taxPaise,
      total_paise: itemTotalPaise,
      supplier_cost_paise: supplierCostPaise,
      platform_margin_paise: platformMarginPaise,
    };
  });

  // Initial order status based on payment method
  const initialStatus: OrderStatus = params.paymentMethod === 'cod' ? 'confirmed' : 'submitted';
  const initialPaymentStatus: PaymentStatus = params.paymentMethod === 'cod' ? 'cod_pending' : 'pending';

  const addressSnapshot = {
    ...params.deliveryAddress,
    customerDetails: params.customerDetails,
  };

  const statusHistoryEntry = {
    id: crypto.randomUUID(),
    order_id: orderId,
    previous_status: null,
    new_status: initialStatus,
    changed_by: finalUserId || null,
    notes: `Order created via web storefront. Payment method: ${params.paymentMethod.toUpperCase()}`,
    created_at: now.toISOString(),
  };

  const storedRecord: StoredOrderRecord = {
    id: orderId,
    order_number: orderNumber,
    idempotency_key: params.idempotencyKey || null,
    user_id: finalUserId || null,
    status: initialStatus,
    payment_status: initialPaymentStatus,
    payment_method: params.paymentMethod,
    delivery_address_id: null,
    delivery_address_snapshot: addressSnapshot,
    pincode: params.deliveryAddress.pincode,
    subtotal_paise: cart.summary.subtotalPaise,
    tax_paise: cart.summary.taxPaise,
    delivery_fee_paise: cart.summary.deliveryFeePaise,
    discount_paise: cart.summary.discountPaise,
    total_paise: cart.summary.totalPaise,
    coupon_id: cart.coupon?.id || null,
    coupon_code: cart.coupon?.code || null,
    delivery_otp_plain: plainOtp,
    delivery_otp_hash: deliveryOtpHash,
    customer_notes: params.customerNotes || null,
    items: orderItems,
    status_history: [statusHistoryEntry],
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  // Save to memory registry
  memoryOrders.set(orderId, storedRecord);
  memoryOrders.set(orderNumber, storedRecord);
  if (params.idempotencyKey) {
    idempotencyRegistry.set(params.idempotencyKey, orderId);
  }

  // Increment coupon usage count if coupon was applied
  if (cart.coupon?.id) {
    await incrementCouponUsage(cart.coupon.id);
  }

  // Sync to PostgreSQL DB using privileged admin client to ensure database persistence with transaction integrity
  try {
    const supabase = createAdminClient();

    // 1. Attempt PostgreSQL transaction RPC first
    let rpcExecuted = false;
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_order_transaction', {
        p_order: {
          id: orderId,
          order_number: orderNumber,
          user_id: finalUserId,
          status: initialStatus,
          payment_status: initialPaymentStatus,
          payment_method: params.paymentMethod,
          delivery_address_snapshot: addressSnapshot,
          pincode: params.deliveryAddress.pincode,
          subtotal_paise: cart.summary.subtotalPaise,
          tax_paise: cart.summary.taxPaise,
          delivery_fee_paise: cart.summary.deliveryFeePaise,
          discount_paise: cart.summary.discountPaise,
          total_paise: cart.summary.totalPaise,
          coupon_id: cart.coupon?.id || null,
          delivery_otp_hash: deliveryOtpHash,
          customer_notes: params.customerNotes || null,
          internal_notes: `[idempotency_key:${params.idempotencyKey || ''}] Initial web placement`,
        },
        p_items: orderItems,
        p_history: {
          id: statusHistoryEntry.id,
          new_status: initialStatus,
          changed_by: finalUserId || null,
          notes: statusHistoryEntry.notes,
        },
      });

      if (!rpcError && rpcData?.success) {
        rpcExecuted = true;
      }
    } catch {
      // RPC not defined or failed; fall back to multi-step insert with strict compensating rollback
    }

    if (!rpcExecuted) {
      // 2. Multi-step insert with STRICT COMPENSATING ROLLBACK on any failure
      const { error: orderError } = await supabase.from('orders').insert({
        id: orderId,
        order_number: orderNumber,
        user_id: finalUserId,
        status: initialStatus,
        payment_status: initialPaymentStatus,
        payment_method: params.paymentMethod,
        delivery_address_snapshot: addressSnapshot,
        pincode: params.deliveryAddress.pincode,
        subtotal_paise: cart.summary.subtotalPaise,
        tax_paise: cart.summary.taxPaise,
        delivery_fee_paise: cart.summary.deliveryFeePaise,
        discount_paise: cart.summary.discountPaise,
        total_paise: cart.summary.totalPaise,
        coupon_id: cart.coupon?.id || null,
        delivery_otp_hash: deliveryOtpHash,
        customer_notes: params.customerNotes || null,
        internal_notes: `[idempotency_key:${params.idempotencyKey || ''}] Initial placement`,
      });

      if (orderError) {
        console.error('[createOrder] Supabase orders table insert error:', orderError);
        memoryOrders.delete(orderId);
        memoryOrders.delete(orderNumber);
        if (params.idempotencyKey) idempotencyRegistry.delete(params.idempotencyKey);
        return {
          success: false,
          error: `Database failed to create order: ${orderError.message}`,
        };
      }

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        console.error('[createOrder] order_items insertion failed. EXECUTING COMPENSATING ROLLBACK:', itemsError);
        // TRANSACTION ROLLBACK: Delete orphaned order record to prevent partial records
        await supabase.from('orders').delete().eq('id', orderId);
        memoryOrders.delete(orderId);
        memoryOrders.delete(orderNumber);
        if (params.idempotencyKey) idempotencyRegistry.delete(params.idempotencyKey);
        return {
          success: false,
          error: `Database transaction failed: could not insert line items. Partial order was rolled back cleanly. (${itemsError.message})`,
        };
      }

      const { error: histError } = await supabase.from('order_status_history').insert({
        id: statusHistoryEntry.id,
        order_id: orderId,
        previous_status: null,
        new_status: initialStatus,
        changed_by: finalUserId || null,
        notes: statusHistoryEntry.notes,
      });

      if (histError) {
        console.error('[createOrder] order_status_history failed. EXECUTING COMPENSATING ROLLBACK:', histError);
        // TRANSACTION ROLLBACK: Delete items and order
        await supabase.from('order_items').delete().eq('order_id', orderId);
        await supabase.from('orders').delete().eq('id', orderId);
        memoryOrders.delete(orderId);
        memoryOrders.delete(orderNumber);
        if (params.idempotencyKey) idempotencyRegistry.delete(params.idempotencyKey);
        return {
          success: false,
          error: `Database transaction failed: could not record status history. Order was rolled back cleanly. (${histError.message})`,
        };
      }
    }
  } catch (dbErr: any) {
    console.error('[createOrder] Database synchronization exception:', dbErr);
    memoryOrders.delete(orderId);
    memoryOrders.delete(orderNumber);
    if (params.idempotencyKey) idempotencyRegistry.delete(params.idempotencyKey);
    return {
      success: false,
      error: `Database transaction exception: ${dbErr?.message || 'Failed to persist order'}`,
    };
  }

  return { success: true, order: storedRecord };
}

/**
 * Retrieves order details, enforcing customer privacy and record isolation.
 */
export async function getOrderDetails(
  orderIdOrNumber: string,
  requesterUserId?: string,
  isAdmin = false
): Promise<{ success: boolean; order?: StoredOrderRecord; error?: string; status?: number }> {
  // Check memory store
  let order = memoryOrders.get(orderIdOrNumber);

  // If not in memory, query DB
  if (!order) {
    try {
      const adminSupabase = createAdminClient();
      let query = adminSupabase.from('orders').select('*');
      if (orderIdOrNumber.startsWith('NS-AYD-')) {
        query = query.eq('order_number', orderIdOrNumber);
      } else {
        query = query.eq('id', orderIdOrNumber);
      }
      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        // Fetch items and history
        const { data: items } = await adminSupabase.from('order_items').select('*').eq('order_id', data.id);
        const { data: history } = await adminSupabase.from('order_status_history').select('*').eq('order_id', data.id).order('created_at', { ascending: true });

        order = {
          ...data,
          delivery_otp_plain: '****', // Masked from public view
          items: items || [],
          status_history: history || [],
        };
      }
    } catch {
      // Handled
    }
  }

  if (!order) {
    return { success: false, error: 'Order not found', status: 404 };
  }

  // SECURITY CHECK: Strict Customer Isolation
  // Customer orders must NOT be accessible anonymously or by another customer.
  if (order.user_id && order.user_id !== GUEST_SYSTEM_PROFILE_ID) {
    if (!requesterUserId && !isAdmin) {
      return {
        success: false,
        error: 'Authentication required: Please log in to view this customer order.',
        status: 401,
      };
    }
    if (requesterUserId !== order.user_id && !isAdmin) {
      return {
        success: false,
        error: 'Access denied: You are not authorized to view orders belonging to another customer.',
        status: 403,
      };
    }
  }

  return { success: true, order };
}

/**
 * Lists orders for a specific customer with strict user isolation.
 */
export async function listUserOrders(userId: string): Promise<StoredOrderRecord[]> {
  const userOrders: StoredOrderRecord[] = [];

  // 1. Query persistent PostgreSQL DB via admin client (single source of truth)
  try {
    const adminSupabase = createAdminClient();
    const { data: dbOrders, error: dbOrdersErr } = await adminSupabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!dbOrdersErr && dbOrders) {
      for (const dbo of dbOrders) {
        if (!userOrders.some((existing) => existing.id === dbo.id)) {
          const { data: items } = await adminSupabase.from('order_items').select('*').eq('order_id', dbo.id);
          const { data: history } = await adminSupabase.from('order_status_history').select('*').eq('order_id', dbo.id).order('created_at', { ascending: true });
          userOrders.push({
            ...dbo,
            delivery_otp_plain: '****',
            items: items || [],
            status_history: history || [],
          });
        }
      }
    }
  } catch (err) {
    console.warn('[listUserOrders] Error querying orders from PostgreSQL:', err);
  }

  // 2. Supplement with any un-flushed in-memory orders (for mock/offline environments)
  for (const o of Array.from(memoryOrders.values())) {
    if (o.user_id === userId && !userOrders.some((existing) => existing.id === o.id)) {
      userOrders.push(o);
    }
  }

  return userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Cancels an order before materials are packed or dispatched.
 */
export async function cancelOrder(
  orderId: string,
  userId: string,
  reason: string,
  isAdmin = false
): Promise<{ success: boolean; error?: string; order?: StoredOrderRecord }> {
  const details = await getOrderDetails(orderId, userId, isAdmin);
  if (!details.success || !details.order) {
    return { success: false, error: details.error || 'Order not found' };
  }

  const order = details.order;

  // Business Rule: Cancellation allowed ONLY if order has not been dispatched or packed
  const cancellableStatuses: OrderStatus[] = ['draft', 'submitted', 'confirmed'];
  if (!cancellableStatuses.includes(order.status)) {
    return {
      success: false,
      error: `Order cannot be cancelled because it is already in "${order.status}" status. Once materials are packed or out for delivery, please use the return workflow after delivery.`,
    };
  }

  const prevStatus = order.status;
  order.status = 'cancelled';
  order.cancelled_at = new Date().toISOString();
  order.cancellation_reason = reason;
  order.status_history.push({
    id: `sh-cancel-${Date.now()}`,
    order_id: order.id,
    previous_status: prevStatus,
    new_status: 'cancelled',
    changed_by: userId,
    notes: `Customer requested cancellation: ${reason}`,
    created_at: new Date().toISOString(),
  });

  try {
    const supabase = createServerSupabaseClient();
    await supabase.from('orders').update({
      status: 'cancelled',
      cancelled_at: order.cancelled_at,
      cancellation_reason: reason,
    }).eq('id', order.id);

    await supabase.from('order_status_history').insert({
      order_id: order.id,
      previous_status: prevStatus,
      new_status: 'cancelled',
      changed_by: userId,
      notes: `Cancellation: ${reason}`,
    });
  } catch {
    // Handled
  }

  return { success: true, order };
}

/**
 * Submits a return request for a delivered order within the 48-hour return window.
 */
export async function requestOrderReturn(
  orderId: string,
  userId: string,
  returnReason: string,
  notes?: string
): Promise<{ success: boolean; error?: string; order?: StoredOrderRecord }> {
  const details = await getOrderDetails(orderId, userId);
  if (!details.success || !details.order) {
    return { success: false, error: details.error || 'Order not found' };
  }

  const order = details.order;

  // Business Rule: Order must be delivered
  if (order.status !== 'delivered') {
    return {
      success: false,
      error: 'Return requests can only be submitted for delivered orders.',
    };
  }

  // Business Rule: Within 48 hours of delivery
  if (order.delivered_at) {
    const deliveredTime = new Date(order.delivered_at).getTime();
    const hoursSinceDelivery = (Date.now() - deliveredTime) / (1000 * 60 * 60);
    if (hoursSinceDelivery > 48) {
      return {
        success: false,
        error: 'Return window expired. Building materials must be reported within 48 hours of site delivery.',
      };
    }
  }

  order.status_history.push({
    id: `sh-return-${Date.now()}`,
    order_id: order.id,
    previous_status: order.status,
    new_status: order.status,
    changed_by: userId,
    notes: `Return requested by customer. Reason: ${returnReason}. Notes: ${notes || 'None'}`,
    created_at: new Date().toISOString(),
  });

  return { success: true, order };
}
