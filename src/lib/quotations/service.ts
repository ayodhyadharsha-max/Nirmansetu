/**
 * NIRMANSETU AYODHYA - B2B BULK RFQ & COMMERCIAL QUOTATION SERVICE
 *
 * Implements the complete quotation lifecycle:
 * 1. Customer submits a construction project enquiry / RFQ.
 * 2. Admin reviews requirements and dispatches price requests to approved suppliers.
 * 3. Suppliers submit private wholesale bids / procurement costs.
 * 4. Admin prepares and issues formal customer quotations with locked rates.
 * 5. Customer accepts or declines the quotation.
 * 6. An accepted quotation is seamlessly converted into a live customer order for fulfillment.
 * 7. Business-sensitive supplier costs are protected from public exposure.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logAuditEvent, AuthenticatedUserSession } from '@/lib/auth/roles';
import { memoryOrders, StoredOrderRecord } from '@/lib/orders/service';
import { memorySuppliers, checkSupplierIsolation } from '@/lib/suppliers/service';

export interface StoredBulkEnquiry {
  id: string;
  enquiry_number: string;
  user_id: string | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  company_or_firm_name: string | null;
  gstin: string | null;
  project_type: 'residential_house' | 'commercial_complex' | 'hotel_ashram' | 'temple_infrastructure' | 'government_contract' | 'renovation';
  project_title: string;
  project_address: string;
  pincode: string;
  estimated_budget_paise: number | null;
  target_delivery_date: string | null;
  material_requirements: string;
  structured_items: Array<{ category?: string; title: string; approx_qty: number; unit: string }>;
  status: 'new' | 'reviewing' | 'quoted' | 'converted' | 'rejected';
  assigned_to?: string | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierRfqBid {
  id: string;
  enquiry_id: string;
  supplier_id: string;
  supplier_name: string;
  items: Array<{
    title: string;
    unit_cost_paise: number;
    available_qty: number;
    lead_time_hours?: number;
    notes?: string;
  }>;
  total_procurement_cost_paise: number;
  submitted_at: string;
}

export interface QuotationLineItem {
  id: string;
  item_title: string;
  unit: string;
  quantity: number;
  unit_rate_paise: number;
  gst_rate_pct: number;
  tax_paise: number;
  total_paise: number;
}

export interface StoredQuotation {
  id: string;
  quotation_number: string;
  enquiry_id: string;
  user_id: string | null;
  client_name: string;
  client_phone: string;
  client_email?: string | null;
  client_gstin?: string | null;
  delivery_address: string;
  delivery_pincode: string;
  valid_until: string;
  items: QuotationLineItem[];
  subtotal_paise: number;
  tax_paise: number;
  freight_paise: number;
  unloading_charges_paise: number;
  total_paise: number;
  terms_and_conditions: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted';
  created_at: string;
  updated_at: string;
}

// In-memory registries for development and offline testing
export const memoryEnquiries = new Map<string, StoredBulkEnquiry>();
export const memorySupplierBids = new Map<string, SupplierRfqBid[]>(); // enquiry_id -> SupplierRfqBid[]
export const memoryQuotations = new Map<string, StoredQuotation>();

// Seed sample RFQ for Tedhi Bazar commercial site
const SEED_RFQ_1: StoredBulkEnquiry = {
  id: 'enq-ayd-2026-001',
  enquiry_number: 'RFQ-AYD-2026-0042',
  user_id: 'cust-usr-101',
  contact_name: 'Rajesh Agrawal',
  contact_phone: '9451100223',
  contact_email: 'rajesh@agrawalbuilders.com',
  company_or_firm_name: 'Agrawal Buildcon Ayodhya',
  gstin: '09AAACA1122B1Z3',
  project_type: 'hotel_ashram',
  project_title: 'Sita Ram Pilgrim Ashram & Dharamshala',
  project_address: 'Plot 4, Tedhi Bazar Bypass Road',
  pincode: '224123',
  estimated_budget_paise: 250000000, // ₹25 Lakhs
  target_delivery_date: '2026-11-01',
  material_requirements: '2000 bags UltraTech PPC Cement; 25 MT Tata Tiscon 550D TMT rebars; 5000 sq ft Vitrified Floor Tiles.',
  structured_items: [
    { category: 'Cement', title: 'UltraTech PPC Cement', approx_qty: 2000, unit: 'bags' },
    { category: 'TMT Steel', title: 'Tata Tiscon 550D 12mm Rebar', approx_qty: 25, unit: 'tons' },
  ],
  status: 'new',
  created_at: '2026-10-18T12:00:00Z',
  updated_at: '2026-10-18T12:00:00Z',
};

memoryEnquiries.set(SEED_RFQ_1.id, SEED_RFQ_1);

// ==============================================================================
// 1. LIST & SUBMIT BULK ENQUIRIES
// ==============================================================================

export async function submitBulkEnquiry(
  input: Omit<StoredBulkEnquiry, 'id' | 'enquiry_number' | 'status' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; enquiryId: string; enquiryNumber: string }> {
  const id = `enq-ayd-${Date.now()}`;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
  const enquiryNumber = `RFQ-AYD-${dateStr}-${randomHex}`;

  const enquiry: StoredBulkEnquiry = {
    ...input,
    id,
    enquiry_number: enquiryNumber,
    status: 'new',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  memoryEnquiries.set(id, enquiry);

  // Sync to database if available
  try {
    const supabase = createServerSupabaseClient();
    await supabase.from('bulk_enquiries').insert({
      id: enquiry.id,
      enquiry_number: enquiry.enquiry_number,
      user_id: enquiry.user_id,
      contact_name: enquiry.contact_name,
      contact_phone: enquiry.contact_phone,
      contact_email: enquiry.contact_email,
      company_or_firm_name: enquiry.company_or_firm_name,
      gstin: enquiry.gstin,
      project_type: enquiry.project_type,
      project_title: enquiry.project_title,
      project_address: enquiry.project_address,
      pincode: enquiry.pincode,
      estimated_budget_paise: enquiry.estimated_budget_paise,
      target_delivery_date: enquiry.target_delivery_date,
      material_requirements: enquiry.material_requirements,
      structured_items: enquiry.structured_items,
      status: 'new',
    });
  } catch {
    // Handled
  }

  await logAuditEvent({
    userId: input.user_id,
    action: 'SUBMIT_BULK_ENQUIRY',
    entityType: 'bulk_enquiries',
    entityId: id,
    newValues: {
      enquiryNumber,
      contactName: enquiry.contact_name,
      pincode: enquiry.pincode,
      projectType: enquiry.project_type,
    },
  });

  return { success: true, enquiryId: id, enquiryNumber };
}

export async function listBulkEnquiries(
  session: AuthenticatedUserSession
): Promise<StoredBulkEnquiry[]> {
  if (session.role === 'admin') {
    return Array.from(memoryEnquiries.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Customers only see their own enquiries
  return Array.from(memoryEnquiries.values())
    .filter((e) => e.user_id === session.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ==============================================================================
// 2. DISPATCH RFQ & RECORD PRIVATE SUPPLIER BIDS
// ==============================================================================

export async function recordSupplierRfqBid(
  enquiryId: string,
  supplierId: string,
  bids: SupplierRfqBid['items'],
  callerSession: AuthenticatedUserSession
): Promise<{ success: boolean; bid?: SupplierRfqBid; error?: string }> {
  checkSupplierIsolation(supplierId, callerSession);

  const enquiry = memoryEnquiries.get(enquiryId);
  if (!enquiry) return { success: false, error: 'Enquiry not found.' };

  const supplier = memorySuppliers.get(supplierId);
  if (!supplier) return { success: false, error: 'Supplier not found.' };

  let totalCost = 0;
  bids.forEach((b) => {
    totalCost += b.unit_cost_paise * b.available_qty;
  });

  const bid: SupplierRfqBid = {
    id: `bid-${Date.now()}`,
    enquiry_id: enquiryId,
    supplier_id: supplierId,
    supplier_name: supplier.business_name,
    items: bids,
    total_procurement_cost_paise: totalCost,
    submitted_at: new Date().toISOString(),
  };

  const list = memorySupplierBids.get(enquiryId) || [];
  list.push(bid);
  memorySupplierBids.set(enquiryId, list);

  enquiry.status = 'reviewing';
  enquiry.updated_at = new Date().toISOString();
  memoryEnquiries.set(enquiryId, enquiry);

  await logAuditEvent({
    userId: callerSession.id,
    action: 'RECORD_SUPPLIER_RFQ_BID',
    entityType: 'bulk_enquiries',
    entityId: enquiryId,
    newValues: { supplierId, totalProcurementCost: totalCost },
  });

  return { success: true, bid };
}

export async function listSupplierBidsAdmin(
  enquiryId: string,
  adminSession: AuthenticatedUserSession
): Promise<SupplierRfqBid[]> {
  if (adminSession.role !== 'admin') {
    const err = new Error('Unauthorized: Supplier bids contain private wholesale costs.');
    (err as any).statusCode = 403;
    throw err;
  }
  return memorySupplierBids.get(enquiryId) || [];
}

// ==============================================================================
// 3. ADMIN PREPARES & ISSUES FORMAL CUSTOMER QUOTATION
// ==============================================================================

export interface CreateQuotationInput {
  enquiryId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientGstin?: string;
  deliveryAddress: string;
  deliveryPincode: string;
  validityDays: number;
  items: Array<{
    itemTitle: string;
    unit: string;
    quantity: number;
    unitRatePaise: number;
    gstRatePct: number;
  }>;
  freightPaise: number;
  unloadingChargesPaise: number;
  termsAndConditions: string;
}

export async function createCustomerQuotation(
  input: CreateQuotationInput,
  adminSession: AuthenticatedUserSession
): Promise<{ success: boolean; quotation?: StoredQuotation; error?: string }> {
  if (adminSession.role !== 'admin') {
    const err = new Error('Unauthorized');
    (err as any).statusCode = 403;
    throw err;
  }

  const enquiry = memoryEnquiries.get(input.enquiryId);
  const quotationId = `qt000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const quotationNumber = `QT-AYD-${dateStr}-${randomSuffix}`;

  let subtotalPaise = 0;
  let taxPaise = 0;

  const quotationItems: QuotationLineItem[] = input.items.map((i, idx) => {
    const lineSubtotal = i.quantity * i.unitRatePaise;
    const lineTax = Math.round((lineSubtotal * Math.round(i.gstRatePct * 100)) / 10000);
    const lineTotal = lineSubtotal + lineTax;

    subtotalPaise += lineSubtotal;
    taxPaise += lineTax;

    return {
      id: `qti-${idx}`,
      item_title: i.itemTitle,
      unit: i.unit,
      quantity: i.quantity,
      unit_rate_paise: i.unitRatePaise,
      gst_rate_pct: i.gstRatePct,
      tax_paise: lineTax,
      total_paise: lineTotal,
    };
  });

  const totalPaise = subtotalPaise + taxPaise + input.freightPaise + input.unloadingChargesPaise;
  const validUntil = new Date(Date.now() + (input.validityDays || 7) * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const quotation: StoredQuotation = {
    id: quotationId,
    quotation_number: quotationNumber,
    enquiry_id: input.enquiryId,
    user_id: enquiry?.user_id || null,
    client_name: input.clientName,
    client_phone: input.clientPhone,
    client_email: input.clientEmail || null,
    client_gstin: input.clientGstin || null,
    delivery_address: input.deliveryAddress,
    delivery_pincode: input.deliveryPincode,
    valid_until: validUntil,
    items: quotationItems,
    subtotal_paise: subtotalPaise,
    tax_paise: taxPaise,
    freight_paise: input.freightPaise,
    unloading_charges_paise: input.unloadingChargesPaise,
    total_paise: totalPaise,
    terms_and_conditions:
      input.termsAndConditions ||
      'Prices inclusive of GST. Unloading at ground level. Transit insurance covered. Payment via RTGS/NEFT or Online Payment Gateway.',
    status: 'sent',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryQuotations.set(quotationId, quotation);

  if (enquiry) {
    enquiry.status = 'quoted';
    enquiry.updated_at = new Date().toISOString();
    memoryEnquiries.set(enquiry.id, enquiry);
  }

  await logAuditEvent({
    userId: adminSession.id,
    action: 'CREATE_CUSTOMER_QUOTATION',
    entityType: 'quotations',
    entityId: quotationId,
    newValues: {
      quotationNumber,
      clientName: input.clientName,
      totalPaise,
      validUntil,
    },
  });

  return { success: true, quotation };
}

// ==============================================================================
// 4. CUSTOMER RESPONDS & ACCEPTS/DECLINES QUOTATION
// ==============================================================================

export async function customerRespondToQuotation(
  quotationId: string,
  action: 'accept' | 'decline',
  callerSession: AuthenticatedUserSession
): Promise<{ success: boolean; quotation?: StoredQuotation; error?: string }> {
  const quotation = memoryQuotations.get(quotationId);
  if (!quotation) {
    return { success: false, error: 'Quotation not found.' };
  }

  if (quotation.status !== 'sent') {
    return {
      success: false,
      error: `Quotation is in "${quotation.status}" state and cannot be modified.`,
    };
  }

  quotation.status = action === 'accept' ? 'accepted' : 'declined';
  quotation.updated_at = new Date().toISOString();
  memoryQuotations.set(quotationId, quotation);

  await logAuditEvent({
    userId: callerSession.id,
    action: action === 'accept' ? 'ACCEPT_QUOTATION' : 'DECLINE_QUOTATION',
    entityType: 'quotations',
    entityId: quotation.id,
    newValues: { status: quotation.status },
  });

  return { success: true, quotation };
}

// ==============================================================================
// 5. CONVERT ACCEPTED QUOTATION TO LIVE ORDER
// ==============================================================================

export async function convertQuotationToOrder(
  quotationId: string,
  callerSession: AuthenticatedUserSession
): Promise<{ success: boolean; order?: StoredOrderRecord; error?: string }> {
  const quotation = memoryQuotations.get(quotationId);
  if (!quotation) {
    return { success: false, error: 'Quotation not found.' };
  }

  if (quotation.status !== 'accepted') {
    return {
      success: false,
      error: `Cannot convert quotation to order: Quotation status is "${quotation.status}". Only accepted quotations can be converted.`,
    };
  }

  const orderId = `o0000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `NS-QT-${dateStr}-${randomSuffix}`;

  const orderItems = quotation.items.map((qi, idx) => ({
    id: `oi-${idx}`,
    order_id: orderId,
    variant_id: `v-qt-${idx}`,
    supplier_id: (quotation as any).supplier_bids_summary?.[0]?.supplier_id || 's0000000-0000-0000-0000-000000000001',
    product_title_snapshot: qi.item_title,
    variant_title_snapshot: `${qi.quantity} ${qi.unit}`,
    sku_snapshot: `SKU-QT-${idx}`,
    hsn_code_snapshot: '6810',
    unit_snapshot: qi.unit,
    quantity: qi.quantity,
    unit_price_paise: qi.unit_rate_paise,
    supplier_cost_paise: Math.round(qi.unit_rate_paise * 0.88),
    platform_margin_paise: Math.round(qi.unit_rate_paise * 0.12),
    gst_rate_pct: qi.gst_rate_pct,
    tax_paise: qi.tax_paise,
    total_paise: qi.total_paise,
  }));

  const order: StoredOrderRecord = {
    id: orderId,
    order_number: orderNumber,
    idempotency_key: null,
    user_id: quotation.user_id || callerSession.id,
    status: 'confirmed',
    payment_status: 'paid', // B2B converted quotation
    payment_method: 'bank_transfer',
    delivery_address_id: null,
    subtotal_paise: quotation.subtotal_paise,
    tax_paise: quotation.tax_paise,
    delivery_fee_paise: quotation.freight_paise + quotation.unloading_charges_paise,
    discount_paise: 0,
    total_paise: quotation.total_paise,
    pincode: quotation.delivery_pincode,
    coupon_id: null,
    coupon_code: null,
    delivery_otp_plain: '1234',
    delivery_otp_hash: 'converted_quotation_otp',
    customer_notes: quotation.terms_and_conditions || null,
    delivery_address_snapshot: {
      customerDetails: {
        name: quotation.client_name,
        phone: quotation.client_phone,
        email: quotation.client_email || '',
      },
      streetAddress: quotation.delivery_address,
      pincode: quotation.delivery_pincode,
      city: 'Ayodhya',
      state: 'Uttar Pradesh',
    },
    items: orderItems,
    status_history: [
      {
        id: `sh-${Date.now()}`,
        order_id: orderId,
        previous_status: null,
        new_status: 'confirmed',
        status: 'confirmed',
        changed_by: callerSession.id,
        notes: `Converted from accepted formal quotation ${quotation.quotation_number}`,
        created_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryOrders.set(orderId, order);

  quotation.status = 'converted';
  quotation.updated_at = new Date().toISOString();
  memoryQuotations.set(quotationId, quotation);

  await logAuditEvent({
    userId: callerSession.id,
    action: 'CONVERT_QUOTATION_TO_ORDER',
    entityType: 'orders',
    entityId: orderId,
    newValues: {
      quotationNumber: quotation.quotation_number,
      orderNumber,
      totalPaise: order.total_paise,
    },
  });

  return { success: true, order };
}
