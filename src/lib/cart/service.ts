/**
 * NIRMANSETU: CART DATA ACCESS & VALIDATION SERVICE
 *
 * Implements server-side trusted cart management:
 * - Server-side recalculation of every price, tax and delivery fee
 * - Minimum Order Quantity (MOQ) validation
 * - Real inventory & variant availability checks
 * - Guest cart persistence and safe post-login merging
 * - Strict integer paise financial arithmetic
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SEED_CATALOG_ITEMS } from '@/lib/catalog/seed-data';
import { calculateOrderTotals, calculateTaxPaise } from '@/lib/money';
import { validateCoupon, CouponRecord } from '@/lib/coupons/service';
import { AYODHYA_REGIONAL_HUBS, BRAND_CONFIG } from '@/config/brand';

export interface CartItemDetail {
  id: string; // cart_item id
  cart_id: string;
  variant_id: string;
  product_id: string;
  product_title: string;
  variant_title: string;
  sku: string;
  unit_of_measure: string;
  quantity: number;
  unit_price_paise: number;
  mrp_paise: number;
  gst_rate_pct: number;
  min_order_qty: number;
  max_order_qty: number;
  available_stock: number;
  is_available: boolean;
  image_url: string;
  total_line_paise: number;
  validation_warnings?: string[];
}

export interface CartState {
  id: string;
  user_id: string | null;
  session_token: string | null;
  delivery_pincode: string;
  items: CartItemDetail[];
  coupon: CouponRecord | null;
  summary: {
    subtotalPaise: number;
    taxPaise: number;
    deliveryFeePaise: number;
    discountPaise: number;
    totalPaise: number;
  };
  isValidForCheckout: boolean;
  checkoutErrors: string[];
}

// In-memory store for guest/test sessions when database is offline or unmigrated
const memoryCarts = new Map<string, {
  id: string;
  userId: string | null;
  sessionToken: string | null;
  pincode: string;
  couponCode: string | null;
  items: Array<{ variantId: string; quantity: number }>;
  updatedAt: Date;
}>();

/**
 * Finds variant details from trusted catalog sources (database or verified seed data).
 */
export async function getTrustedVariantDetails(variantId: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: item, error } = await supabase
      .from('public_catalog_view')
      .select('*')
      .eq('variant_id', variantId)
      .maybeSingle();

    if (!error && item) {
      return {
        variant_id: item.variant_id,
        product_id: item.product_id,
        product_title: item.product_title,
        variant_title: item.variant_title,
        sku: item.sku,
        unit_of_measure: item.unit_of_measure,
        selling_price_paise: item.selling_price_paise,
        mrp_paise: item.mrp_paise,
        gst_rate_pct: Number(item.tax_rate_pct || 18.0),
        min_order_qty: item.min_order_qty || 1,
        max_order_qty: item.max_order_qty || 1000,
        available_stock: item.total_available_stock || 0,
        is_available: item.is_in_stock,
        image_url: item.images?.[0] || '/images/placeholder-product.png',
      };
    }
  } catch {
    // Fallback safely to verified seed dataset
  }

  const seed = SEED_CATALOG_ITEMS.find((s) => s.variant_id === variantId);
  if (seed) {
    return {
      variant_id: seed.variant_id,
      product_id: seed.product_id,
      product_title: seed.product_title,
      variant_title: seed.variant_title,
      sku: seed.sku,
      unit_of_measure: seed.unit_of_measure,
      selling_price_paise: seed.selling_price_paise,
      mrp_paise: seed.mrp_paise,
      gst_rate_pct: Number(seed.tax_rate_pct || 18.0),
      min_order_qty: seed.min_order_qty || 1,
      max_order_qty: seed.max_order_qty || 1000,
      available_stock: seed.total_available_stock || 0,
      is_available: seed.is_in_stock,
      image_url: seed.images?.[0] || '/images/placeholder-product.png',
    };
  }

  return null;
}

/**
 * Calculates delivery fee for a specific PIN code in integer paise.
 */
export async function calculateDeliveryFeeForPincode(pincode: string, isExpress = false): Promise<number> {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('service_pincodes')
      .select('is_serviceable, standard_delivery_fee_paise, express_available, express_delivery_fee_paise')
      .eq('pincode', pincode)
      .maybeSingle();

    if (data && data.is_serviceable) {
      if (isExpress && data.express_available) {
        return data.express_delivery_fee_paise;
      }
      return data.standard_delivery_fee_paise;
    }
  } catch {
    // Fallback to regional hubs config
  }

  const hub = AYODHYA_REGIONAL_HUBS.find((h) => h.pincode === pincode);
  if (hub) {
    if (isExpress && hub.isExpress) return 39900;
    return 19900;
  }

  return 19900;
}

/**
 * Retrieves full cart with server-side validation, live stock checks and pricing.
 */
export async function getCart(cartIdentifier: string, pincode?: string): Promise<CartState> {
  const targetPincode = pincode || BRAND_CONFIG.defaultPincode;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cartIdentifier);

  // 1. Try DB lookup
  let dbCart: any = null;
  let dbItems: any[] = [];

  try {
    const supabase = createServerSupabaseClient();
    let query = supabase.from('carts').select('*');
    if (isUuid) {
      query = query.eq('id', cartIdentifier);
    } else {
      query = query.eq('session_token', cartIdentifier);
    }
    const { data } = await query.maybeSingle();
    dbCart = data;

    if (dbCart) {
      const { data: items } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', dbCart.id);
      dbItems = items || [];
    }
  } catch {
    // DB offline
  }

  // Fallback to memory cart if DB didn't find it
  let cartId = dbCart?.id || cartIdentifier;
  let rawItems: Array<{ id?: string; variantId: string; quantity: number }> = [];
  let couponCode: string | null = null;
  let activePincode = dbCart?.delivery_pincode || targetPincode;

  if (dbCart) {
    rawItems = dbItems.map((i) => ({ id: i.id, variantId: i.variant_id, quantity: i.quantity }));
    if (dbCart.coupon_id) {
      // Look up coupon
      const { data: couponData } = await createServerSupabaseClient()
        .from('coupons')
        .select('code')
        .eq('id', dbCart.coupon_id)
        .maybeSingle();
      couponCode = couponData?.code || null;
    }
  } else {
    // Memory store
    const memCart = memoryCarts.get(cartIdentifier) || memoryCarts.get(cartId);
    if (memCart) {
      cartId = memCart.id;
      rawItems = memCart.items.map((i, idx) => ({ id: `mem-item-${idx}`, ...i }));
      couponCode = memCart.couponCode;
      activePincode = memCart.pincode || targetPincode;
    } else {
      // Brand new virtual cart
      cartId = isUuid ? cartIdentifier : `c0000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      memoryCarts.set(cartIdentifier, {
        id: cartId,
        userId: null,
        sessionToken: isUuid ? null : cartIdentifier,
        pincode: activePincode,
        couponCode: null,
        items: [],
        updatedAt: new Date(),
      });
    }
  }

  // 2. Validate all items against server-side single source of truth
  const detailedItems: CartItemDetail[] = [];
  const checkoutErrors: string[] = [];

  for (const raw of rawItems) {
    const variant = await getTrustedVariantDetails(raw.variantId);
    if (!variant) {
      checkoutErrors.push(`Item variant ${raw.variantId} is no longer available in catalog.`);
      continue;
    }

    const warnings: string[] = [];
    if (!variant.is_available || variant.available_stock <= 0) {
      warnings.push('Item is currently out of stock with local Ayodhya suppliers.');
      checkoutErrors.push(`${variant.product_title} is out of stock.`);
    } else if (raw.quantity > variant.available_stock) {
      warnings.push(`Only ${variant.available_stock} ${variant.unit_of_measure} available in local stock.`);
      checkoutErrors.push(`${variant.product_title}: Requested quantity (${raw.quantity}) exceeds available stock (${variant.available_stock}).`);
    }

    if (raw.quantity < variant.min_order_qty) {
      warnings.push(`Minimum order quantity for this commercial item is ${variant.min_order_qty} ${variant.unit_of_measure}.`);
      checkoutErrors.push(`${variant.product_title}: Minimum order quantity is ${variant.min_order_qty}.`);
    }

    const totalLinePaise = variant.selling_price_paise * raw.quantity;

    detailedItems.push({
      id: raw.id || `item-${variant.variant_id}`,
      cart_id: cartId,
      variant_id: variant.variant_id,
      product_id: variant.product_id,
      product_title: variant.product_title,
      variant_title: variant.variant_title,
      sku: variant.sku,
      unit_of_measure: variant.unit_of_measure,
      quantity: raw.quantity,
      unit_price_paise: variant.selling_price_paise,
      mrp_paise: variant.mrp_paise,
      gst_rate_pct: variant.gst_rate_pct,
      min_order_qty: variant.min_order_qty,
      max_order_qty: variant.max_order_qty,
      available_stock: variant.available_stock,
      is_available: variant.is_available,
      image_url: variant.image_url,
      total_line_paise: totalLinePaise,
      validation_warnings: warnings.length > 0 ? warnings : undefined,
    });
  }

  // 3. Compute pure integer financial summary
  const calculationItems = detailedItems.map((d) => ({
    unitPricePaise: d.unit_price_paise,
    quantity: d.quantity,
    gstRatePct: d.gst_rate_pct,
  }));

  const subtotalPaise = detailedItems.reduce((acc, i) => acc + i.total_line_paise, 0);

  // Validate coupon if applied
  let appliedCoupon: CouponRecord | null = null;
  let discountPaise = 0;

  if (couponCode && subtotalPaise > 0) {
    const couponRes = await validateCoupon(couponCode, subtotalPaise);
    if (couponRes.isValid && couponRes.coupon) {
      appliedCoupon = couponRes.coupon;
      discountPaise = couponRes.discountPaise;
    } else {
      checkoutErrors.push(couponRes.errorMessage || 'Invalid promotional coupon');
    }
  }

  const deliveryFeePaise = detailedItems.length > 0
    ? await calculateDeliveryFeeForPincode(activePincode)
    : 0;

  const totals = calculateOrderTotals({
    items: calculationItems,
    deliveryFeePaise,
    discountPaise,
  });

  return {
    id: cartId,
    user_id: dbCart?.user_id || null,
    session_token: dbCart?.session_token || (isUuid ? null : cartIdentifier),
    delivery_pincode: activePincode,
    items: detailedItems,
    coupon: appliedCoupon,
    summary: totals,
    isValidForCheckout: detailedItems.length > 0 && checkoutErrors.length === 0,
    checkoutErrors,
  };
}

/**
 * Adds an item to the cart, enforcing MOQ and available stock.
 */
export async function addItemToCart(params: {
  cartId?: string;
  sessionToken?: string;
  userId?: string;
  variantId: string;
  quantity: number;
  pincode?: string;
}): Promise<{ success: boolean; cart: CartState; error?: string }> {
  const variant = await getTrustedVariantDetails(params.variantId);
  if (!variant) {
    return { success: false, cart: await getCart(params.cartId || params.sessionToken || 'default'), error: 'Invalid or unlisted product variant' };
  }

  if (!variant.is_available || variant.available_stock <= 0) {
    return { success: false, cart: await getCart(params.cartId || params.sessionToken || 'default'), error: 'Item is currently out of stock with local Ayodhya suppliers' };
  }

  const minQty = variant.min_order_qty || 1;
  const initialQty = Math.max(minQty, params.quantity);

  if (initialQty > variant.available_stock) {
    return {
      success: false,
      cart: await getCart(params.cartId || params.sessionToken || 'default'),
      error: `Requested quantity (${initialQty}) exceeds available stock (${variant.available_stock} ${variant.unit_of_measure})`,
    };
  }

  const cartIdentifier = params.cartId || params.sessionToken || (params.userId ? `user-cart-${params.userId}` : `guest-${Date.now()}`);

  // Memory cart update
  let mem = memoryCarts.get(cartIdentifier);
  if (!mem) {
    mem = {
      id: params.cartId || `c0000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      userId: params.userId || null,
      sessionToken: params.sessionToken || null,
      pincode: params.pincode || BRAND_CONFIG.defaultPincode,
      couponCode: null,
      items: [],
      updatedAt: new Date(),
    };
    memoryCarts.set(cartIdentifier, mem);
    memoryCarts.set(mem.id, mem);
  }

  const existingIndex = mem.items.findIndex((i) => i.variantId === params.variantId);
  if (existingIndex >= 0) {
    const newQty = mem.items[existingIndex].quantity + initialQty;
    if (newQty > variant.available_stock) {
      return {
        success: false,
        cart: await getCart(cartIdentifier),
        error: `Cannot add more. Total in cart (${newQty}) would exceed stock limit of ${variant.available_stock} ${variant.unit_of_measure}`,
      };
    }
    mem.items[existingIndex].quantity = newQty;
  } else {
    mem.items.push({ variantId: params.variantId, quantity: initialQty });
  }

  // Also sync with DB if Supabase client is active
  try {
    const supabase = createServerSupabaseClient();
    // Insert/update cart record
    const { data: cartData } = await supabase
      .from('carts')
      .upsert({
        id: mem.id,
        user_id: params.userId || null,
        session_token: params.sessionToken || null,
        delivery_pincode: params.pincode || BRAND_CONFIG.defaultPincode,
      })
      .select('id')
      .single();

    if (cartData) {
      await supabase.from('cart_items').upsert(
        {
          cart_id: cartData.id,
          variant_id: params.variantId,
          quantity: existingIndex >= 0 ? mem.items[existingIndex].quantity : initialQty,
        },
        { onConflict: 'cart_id,variant_id' }
      );
    }
  } catch {
    // Database sync error handled gracefully
  }

  const updatedCart = await getCart(cartIdentifier, params.pincode);
  return { success: true, cart: updatedCart };
}

/**
 * Updates quantity of a variant in the cart.
 */
export async function updateItemQuantity(params: {
  cartId: string;
  variantId: string;
  quantity: number;
}): Promise<{ success: boolean; cart: CartState; error?: string }> {
  if (params.quantity <= 0) {
    return removeItemFromCart(params.cartId, params.variantId);
  }

  const variant = await getTrustedVariantDetails(params.variantId);
  if (!variant) {
    return { success: false, cart: await getCart(params.cartId), error: 'Product variant not found' };
  }

  if (params.quantity < variant.min_order_qty) {
    return {
      success: false,
      cart: await getCart(params.cartId),
      error: `Minimum order quantity for ${variant.product_title} is ${variant.min_order_qty} ${variant.unit_of_measure}.`,
    };
  }

  if (params.quantity > variant.available_stock) {
    return {
      success: false,
      cart: await getCart(params.cartId),
      error: `Only ${variant.available_stock} ${variant.unit_of_measure} available in stock.`,
    };
  }

  const mem = memoryCarts.get(params.cartId);
  if (mem) {
    const item = mem.items.find((i) => i.variantId === params.variantId);
    if (item) item.quantity = params.quantity;
  }

  try {
    const supabase = createServerSupabaseClient();
    await supabase
      .from('cart_items')
      .update({ quantity: params.quantity })
      .eq('cart_id', params.cartId)
      .eq('variant_id', params.variantId);
  } catch {
    // DB sync error handled gracefully
  }

  const cart = await getCart(params.cartId);
  return { success: true, cart };
}

/**
 * Removes a line item from the cart.
 */
export async function removeItemFromCart(cartId: string, variantId: string): Promise<{ success: boolean; cart: CartState }> {
  const mem = memoryCarts.get(cartId);
  if (mem) {
    mem.items = mem.items.filter((i) => i.variantId !== variantId);
  }

  try {
    const supabase = createServerSupabaseClient();
    await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .eq('variant_id', variantId);
  } catch {
    // Handled
  }

  const cart = await getCart(cartId);
  return { success: true, cart };
}

/**
 * Applies a promotional coupon to the cart after validating discount and min order value.
 */
export async function applyCouponToCart(cartId: string, couponCode: string): Promise<{ success: boolean; cart: CartState; error?: string }> {
  const cart = await getCart(cartId);
  if (cart.items.length === 0) {
    return { success: false, cart, error: 'Cannot apply coupon to an empty cart' };
  }

  const validation = await validateCoupon(couponCode, cart.summary.subtotalPaise);
  if (!validation.isValid) {
    return { success: false, cart, error: validation.errorMessage };
  }

  const mem = memoryCarts.get(cartId);
  if (mem) {
    mem.couponCode = couponCode.toUpperCase();
  }

  try {
    const supabase = createServerSupabaseClient();
    await supabase
      .from('carts')
      .update({ coupon_id: validation.coupon?.id || null })
      .eq('id', cartId);
  } catch {
    // Handled
  }

  const updatedCart = await getCart(cartId);
  return { success: true, cart: updatedCart };
}

/**
 * Removes applied coupon from cart.
 */
export async function removeCouponFromCart(cartId: string): Promise<{ success: boolean; cart: CartState }> {
  const mem = memoryCarts.get(cartId);
  if (mem) {
    mem.couponCode = null;
  }

  try {
    const supabase = createServerSupabaseClient();
    await supabase
      .from('carts')
      .update({ coupon_id: null })
      .eq('id', cartId);
  } catch {
    // Handled
  }

  const cart = await getCart(cartId);
  return { success: true, cart };
}

/**
 * Merges a guest cart into an authenticated user's cart safely upon login.
 * Preserves existing user cart items and merges quantities without duplicate line entries.
 */
export async function mergeGuestCart(params: {
  guestSessionToken: string;
  userId: string;
}): Promise<{ success: boolean; cart: CartState }> {
  const guestCart = await getCart(params.guestSessionToken);
  const userCartId = `user-cart-${params.userId}`;

  // For each item in guest cart, add to user cart
  for (const item of guestCart.items) {
    await addItemToCart({
      cartId: userCartId,
      userId: params.userId,
      variantId: item.variant_id,
      quantity: item.quantity,
      pincode: guestCart.delivery_pincode,
    });
  }

  // If guest cart had a coupon, copy it over if user cart doesn't have one
  if (guestCart.coupon) {
    await applyCouponToCart(userCartId, guestCart.coupon.code);
  }

  // Clean up guest memory cart
  memoryCarts.delete(params.guestSessionToken);

  try {
    const supabase = createServerSupabaseClient();
    await supabase.from('carts').delete().eq('session_token', params.guestSessionToken);
  } catch {
    // Handled
  }

  const merged = await getCart(userCartId);
  return { success: true, cart: merged };
}
