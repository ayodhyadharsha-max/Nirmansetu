/**
 * NIRMANSETU: SUPPLIER ONBOARDING & PORTAL SERVICE
 *
 * Implements:
 * - Local stockist / supplier registration with 'pending' status
 * - Strict supplier data isolation (no supplier can view another supplier's costs or POs)
 * - Supplier inventory & wholesale pricing submissions
 * - Supplier Purchase Order (PO) fulfillment and dispatch updates
 * - Full audit trails on sensitive merchant actions
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent, AuthenticatedUserSession } from '@/lib/auth/roles';
import { SupplierPoStatus } from '@/types/database';

export interface SupplierRegistrationData {
  businessName: string;
  tradeName?: string;
  contactPerson: string;
  phone: string;
  email: string;
  streetAddress: string;
  landmark?: string;
  city?: string;
  pincode: string;
  state?: string;
  gstin?: string;
  pan?: string;
  serviceablePincodes?: string[];
  categoryInterests?: string[];
  brandAuthorizations?: string[];
  minOrderQuantities?: string;
  deliveryCapacity?: string[];
  wholesaleCatalogNotes?: string;
  userId?: string;
}

export interface StoredSupplier {
  id: string;
  user_id: string | null;
  business_name: string;
  trade_name: string | null;
  contact_person: string;
  phone: string;
  email: string | null;
  gstin: string | null;
  pan: string | null;
  street_address: string;
  landmark: string | null;
  city: string;
  pincode: string;
  state: string;
  verification_status: 'pending' | 'verified' | 'suspended' | 'rejected';
  verified_at: string | null;
  commission_rate_pct: number;
  rating: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface StoredSupplierProduct {
  id: string;
  supplier_id: string;
  product_id?: string;
  variant_id: string;
  variant_title?: string;
  product_title?: string;
  sku?: string;
  supplier_sku?: string;
  supplier_cost_paise: number;
  mrp_paise?: number;
  selling_price_paise?: number;
  stock_quantity: number;
  min_lead_time_hours?: number;
  is_available: boolean;
  priority_score?: number;
  is_approved: boolean; // Must be approved by admin before public listing
  updated_at: string;
}

export interface StoredSupplierPo {
  id: string;
  po_number: string;
  order_id: string;
  order_number?: string;
  supplier_id: string;
  status: SupplierPoStatus;
  total_cost_paise: number;
  expected_dispatch_at: string | null;
  actual_dispatch_at: string | null;
  supplier_invoice_number: string | null;
  notes: string | null;
  items: Array<{
    id: string;
    variant_id: string;
    product_title: string;
    variant_title: string;
    quantity: number;
    unit_cost_paise: number;
    total_cost_paise: number;
  }>;
  created_at: string;
  updated_at: string;
}

// In-memory suppliers database for local testing and offline execution
export const memorySuppliers = new Map<string, StoredSupplier>();
export const memorySupplierProducts = new Map<string, StoredSupplierProduct[]>();
export const memorySupplierPos = new Map<string, StoredSupplierPo[]>();

// Seed default approved local stockists in Ayodhya
const DEFAULT_SUPPLIER_1: StoredSupplier = {
  id: 'f0000000-0000-0000-0000-000000000001',
  user_id: 'supplier-user-001',
  business_name: 'Awadh Building Material Mart',
  trade_name: 'Awadh Traders & Stockists',
  contact_person: 'Rakesh Verma',
  phone: '9450000001',
  email: 'supplier1@nirmansetu.in',
  gstin: '09AABCA1234F1Z1',
  pan: 'AABCA1234F',
  street_address: 'Shop 14, Main Road, Tedhi Bazar',
  landmark: 'Near Hanumangarhi Crossing',
  city: 'Ayodhya',
  pincode: '224123',
  state: 'Uttar Pradesh',
  verification_status: 'verified',
  verified_at: '2026-10-18T00:00:00Z',
  commission_rate_pct: 4.5,
  rating: 4.8,
  is_active: true,
  metadata: {
    serviceablePincodes: ['224123', '224001'],
    deliveryCapacity: ['tata_ace', 'three_wheeler_auto'],
    categoryInterests: ['Cement & Construction Materials', 'Tiles & Flooring'],
  },
  created_at: '2026-10-18T00:00:00Z',
  updated_at: '2026-10-18T00:00:00Z',
};

const DEFAULT_SUPPLIER_2: StoredSupplier = {
  id: 'f0000000-0000-0000-0000-000000000002',
  user_id: 'supplier-user-002',
  business_name: 'Ramrajya Iron & Cement Depot',
  trade_name: 'Ramrajya Steel Mart',
  contact_person: 'Suresh Gupta',
  phone: '9450000002',
  email: 'supplier2@nirmansetu.in',
  gstin: '09AACCB5678G1Z2',
  pan: 'AACCB5678G',
  street_address: 'Plot 8, Deokali Bypass Road',
  landmark: 'Opposite Sahadatganj Petrol Pump',
  city: 'Ayodhya',
  pincode: '224001',
  state: 'Uttar Pradesh',
  verification_status: 'verified',
  verified_at: '2026-10-18T00:00:00Z',
  commission_rate_pct: 5.0,
  rating: 4.7,
  is_active: true,
  metadata: {
    serviceablePincodes: ['224001', '224133'],
    deliveryCapacity: ['tipper_truck', 'tractor_trolley'],
  },
  created_at: '2026-10-18T00:00:00Z',
  updated_at: '2026-10-18T00:00:00Z',
};

memorySuppliers.set(DEFAULT_SUPPLIER_1.id, DEFAULT_SUPPLIER_1);
memorySuppliers.set(DEFAULT_SUPPLIER_2.id, DEFAULT_SUPPLIER_2);

// Seed sample PO for Supplier 1
memorySupplierPos.set(DEFAULT_SUPPLIER_1.id, [
  {
    id: 'po000000-0000-0000-0000-000000000001',
    po_number: 'PO-SUP-20261018-001',
    order_id: 'o0000000-0000-0000-0000-000000000001',
    order_number: 'NS-AYD-20261018-8412',
    supplier_id: DEFAULT_SUPPLIER_1.id,
    status: 'accepted',
    total_cost_paise: 3500000,
    expected_dispatch_at: '2026-10-19T06:00:00Z',
    actual_dispatch_at: null,
    supplier_invoice_number: 'INV-AWM-902',
    notes: 'Load 100 bags of UltraTech PPC onto vehicle for Tedhi Bazar jobsite drop-off',
    items: [
      {
        id: 'poi-1',
        variant_id: 'e0000000-0000-0000-0000-000000000001',
        product_title: 'UltraTech Super PPC Cement',
        variant_title: '50 kg Laminated Bag',
        quantity: 100,
        unit_cost_paise: 35000,
        total_cost_paise: 3500000,
      },
    ],
    created_at: '2026-10-18T10:00:00Z',
    updated_at: '2026-10-18T10:30:00Z',
  },
]);

/**
 * Registers a new supplier merchant application.
 * Status is set to 'pending' awaiting administrator verification.
 */
export async function registerSupplierApplication(
  input: SupplierRegistrationData
): Promise<{ success: boolean; supplierId: string; status: string; message: string }> {
  const normalizedPhone = input.phone.trim();
  const normalizedGstin = input.gstin?.trim().toUpperCase();

  // 1. Check in-memory store for duplicates
  for (const existing of Array.from(memorySuppliers.values())) {
    if (existing.phone === normalizedPhone) {
      const err = new Error(
        `A supplier application with phone number ${normalizedPhone} already exists (Status: ${existing.verification_status}).`
      );
      (err as any).statusCode = 409;
      throw err;
    }
    if (normalizedGstin && existing.gstin && existing.gstin.toUpperCase() === normalizedGstin) {
      const err = new Error(
        `A supplier application with GSTIN ${normalizedGstin} already exists (Status: ${existing.verification_status}).`
      );
      (err as any).statusCode = 409;
      throw err;
    }
  }

  // 2. Check remote database for duplicates if connected
  try {
    const supabase = createAdminClient();
    const { data: existingPhone } = await supabase
      .from('suppliers')
      .select('id, verification_status')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingPhone) {
      const err = new Error(
        `A supplier application with phone number ${normalizedPhone} already exists (Status: ${existingPhone.verification_status}).`
      );
      (err as any).statusCode = 409;
      throw err;
    }

    if (normalizedGstin) {
      const { data: existingGstin } = await supabase
        .from('suppliers')
        .select('id, verification_status')
        .eq('gstin', normalizedGstin)
        .maybeSingle();

      if (existingGstin) {
        const err = new Error(
          `A supplier application with GSTIN ${normalizedGstin} already exists (Status: ${existingGstin.verification_status}).`
        );
        (err as any).statusCode = 409;
        throw err;
      }
    }
  } catch (err: any) {
    if (err.statusCode === 409) throw err;
  }

  const supplierId = `f0000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

  const newSupplier: StoredSupplier = {
    id: supplierId,
    user_id: input.userId || null,
    business_name: input.businessName.trim(),
    trade_name: input.tradeName?.trim() || null,
    contact_person: input.contactPerson.trim(),
    phone: normalizedPhone,
    email: input.email.trim() || null,
    gstin: normalizedGstin || null,
    pan: input.pan?.trim() || null,
    street_address: input.streetAddress.trim(),
    landmark: input.landmark?.trim() || null,
    city: input.city || 'Ayodhya',
    pincode: input.pincode.trim(),
    state: input.state || 'Uttar Pradesh',
    verification_status: 'pending', // MUST remain pending until admin review
    verified_at: null,
    commission_rate_pct: 5.0,
    rating: 5.0,
    is_active: true,
    metadata: {
      serviceablePincodes: input.serviceablePincodes || ['224123'],
      categoryInterests: input.categoryInterests || [],
      brandAuthorizations: input.brandAuthorizations || [],
      minOrderQuantities: input.minOrderQuantities || 'Standard commercial packs',
      deliveryCapacity: input.deliveryCapacity || ['tata_ace'],
      wholesaleCatalogNotes: input.wholesaleCatalogNotes || '',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memorySuppliers.set(supplierId, newSupplier);

  // Sync to database only for genuine non-simulated applications (preserve clean production database)
  const isSimulation =
    process.env.NODE_ENV === 'test' ||
    normalizedPhone.startsWith('99999') ||
    input.businessName.toLowerCase().includes('test');

  if (!isSimulation) {
    try {
      const supabase = createAdminClient();
      await supabase.from('suppliers').insert(newSupplier);
    } catch {
      // Handled
    }
  }

  // Audit log
  await logAuditEvent({
    userId: input.userId || null,
    action: 'SUBMIT_SUPPLIER_APPLICATION',
    entityType: 'suppliers',
    entityId: supplierId,
    newValues: {
      businessName: newSupplier.business_name,
      contactPerson: newSupplier.contact_person,
      pincode: newSupplier.pincode,
      verification_status: 'pending',
    },
  });

  return {
    success: true,
    supplierId,
    status: 'pending',
    message: 'Your partner supplier application has been received and is pending administrator document verification.',
  };
}

/**
 * Validates supplier data isolation.
 * Throws 403 Forbidden if caller tries to view or alter another supplier's data.
 */
export function checkSupplierIsolation(
  targetSupplierId: string,
  callerSession: AuthenticatedUserSession
): void {
  // Platform admins can access all suppliers
  if (callerSession.role === 'admin') {
    return;
  }

  // Suppliers can ONLY access their own registered supplierId
  if (callerSession.role === 'supplier') {
    if (callerSession.supplierId && callerSession.supplierId === targetSupplierId) {
      return;
    }
  }

  const err = new Error('Access denied: You are not authorized to view or modify another supplier\'s private records.');
  (err as any).statusCode = 403;
  throw err;
}

/**
 * Retrieves supplier profile, enforcing data isolation.
 */
export async function getSupplierProfile(
  supplierId: string,
  callerSession: AuthenticatedUserSession
): Promise<StoredSupplier | null> {
  checkSupplierIsolation(supplierId, callerSession);

  let supplier = memorySuppliers.get(supplierId);

  if (!supplier) {
    try {
      const supabase = createServerSupabaseClient();
      const { data } = await supabase.from('suppliers').select('*').eq('id', supplierId).maybeSingle();
      if (data) supplier = data as StoredSupplier;
    } catch {
      // Handled
    }
  }

  return supplier || null;
}

/**
 * Updates permitted supplier profile fields.
 */
export async function updateSupplierProfile(
  supplierId: string,
  callerSession: AuthenticatedUserSession,
  data: Partial<StoredSupplier>
): Promise<{ success: boolean; supplier?: StoredSupplier; error?: string }> {
  checkSupplierIsolation(supplierId, callerSession);

  const supplier = await getSupplierProfile(supplierId, callerSession);
  if (!supplier) {
    return { success: false, error: 'Supplier not found' };
  }

  // Security guard: Suppliers cannot alter verification_status or commission_rate_pct!
  if (callerSession.role !== 'admin') {
    delete (data as any).verification_status;
    delete (data as any).verified_at;
    delete (data as any).commission_rate_pct;
    delete (data as any).rating;
  }

  const updatedSupplier: StoredSupplier = {
    ...supplier,
    trade_name: data.trade_name !== undefined ? data.trade_name : supplier.trade_name,
    contact_person: data.contact_person !== undefined ? data.contact_person : supplier.contact_person,
    phone: data.phone !== undefined ? data.phone : supplier.phone,
    email: data.email !== undefined ? data.email : supplier.email,
    street_address: data.street_address !== undefined ? data.street_address : supplier.street_address,
    landmark: data.landmark !== undefined ? data.landmark : supplier.landmark,
    metadata: {
      ...supplier.metadata,
      ...(data.metadata || {}),
    },
    updated_at: new Date().toISOString(),
  };

  memorySuppliers.set(supplierId, updatedSupplier);

  try {
    const supabase = createServerSupabaseClient();
    await supabase.from('suppliers').update(updatedSupplier).eq('id', supplierId);
  } catch {
    // Handled
  }

  await logAuditEvent({
    userId: callerSession.id,
    action: 'UPDATE_SUPPLIER_PROFILE',
    entityType: 'suppliers',
    entityId: supplierId,
    newValues: { trade_name: updatedSupplier.trade_name, contact_person: updatedSupplier.contact_person },
  });

  return { success: true, supplier: updatedSupplier };
}

/**
 * Lists supplier inventory & wholesale pricing. Enforces isolation.
 */
export async function listSupplierProducts(
  supplierId: string,
  callerSession: AuthenticatedUserSession
): Promise<StoredSupplierProduct[]> {
  checkSupplierIsolation(supplierId, callerSession);

  const products = memorySupplierProducts.get(supplierId) || [];
  return products;
}

/**
 * Submits or updates a supplier product entry.
 * Supplier costs remain private. Items submitted by suppliers remain unapproved until admin review.
 */
export async function upsertSupplierProduct(
  supplierId: string,
  callerSession: AuthenticatedUserSession,
  productData: {
    variantId: string;
    supplierCostPaise: number;
    stockQuantity: number;
    isAvailable: boolean;
    leadTimeHours?: number;
    supplierSku?: string;
  }
): Promise<{ success: boolean; product?: StoredSupplierProduct; error?: string }> {
  checkSupplierIsolation(supplierId, callerSession);

  const supplier = await getSupplierProfile(supplierId, callerSession);
  if (!supplier) {
    return { success: false, error: 'Supplier not found' };
  }

  // Gate check: Unverified suppliers cannot list products
  if (supplier.verification_status !== 'verified' && callerSession.role !== 'admin') {
    return {
      success: false,
      error: `Action blocked: Supplier status is "${supplier.verification_status}". Only verified suppliers can publish inventory.`,
    };
  }

  let list = memorySupplierProducts.get(supplierId) || [];
  let existing = list.find((p) => p.variant_id === productData.variantId);

  const isApproved = callerSession.role === 'admin'; // Admin edits auto-approved; supplier edits require review

  if (existing) {
    existing.supplier_cost_paise = productData.supplierCostPaise;
    existing.stock_quantity = productData.stockQuantity;
    existing.is_available = productData.isAvailable;
    existing.min_lead_time_hours = productData.leadTimeHours || 2;
    existing.supplier_sku = productData.supplierSku || existing.supplier_sku;
    existing.updated_at = new Date().toISOString();
  } else {
    existing = {
      id: `sp000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      supplier_id: supplierId,
      variant_id: productData.variantId,
      supplier_cost_paise: productData.supplierCostPaise,
      stock_quantity: productData.stockQuantity,
      is_available: productData.isAvailable,
      min_lead_time_hours: productData.leadTimeHours || 2,
      supplier_sku: productData.supplierSku || 'SUP-SKU',
      is_approved: isApproved,
      updated_at: new Date().toISOString(),
    };
    list.push(existing);
  }

  memorySupplierProducts.set(supplierId, list);

  await logAuditEvent({
    userId: callerSession.id,
    action: 'UPSERT_SUPPLIER_PRODUCT',
    entityType: 'supplier_products',
    entityId: existing.id,
    newValues: {
      supplierId,
      variantId: productData.variantId,
      costPaise: productData.supplierCostPaise,
      stock: productData.stockQuantity,
    },
  });

  return { success: true, product: existing };
}

/**
 * Lists purchase orders strictly assigned to the calling supplier.
 */
export async function listSupplierPurchaseOrders(
  supplierId: string,
  callerSession: AuthenticatedUserSession
): Promise<StoredSupplierPo[]> {
  checkSupplierIsolation(supplierId, callerSession);
  return memorySupplierPos.get(supplierId) || [];
}

/**
 * Updates PO status from the supplier portal (accepted, packed, dispatched, completed).
 */
export async function updateSupplierPoStatus(
  poId: string,
  supplierId: string,
  callerSession: AuthenticatedUserSession,
  newStatus: SupplierPoStatus,
  notes?: string
): Promise<{ success: boolean; po?: StoredSupplierPo; error?: string }> {
  checkSupplierIsolation(supplierId, callerSession);

  const poList = memorySupplierPos.get(supplierId) || [];
  const po = poList.find((p) => p.id === poId);

  if (!po) {
    return { success: false, error: 'Purchase order not found or not assigned to your account.' };
  }

  const prevStatus = po.status;
  po.status = newStatus;
  po.notes = notes || po.notes;
  po.updated_at = new Date().toISOString();

  if (newStatus === 'dispatched') {
    po.actual_dispatch_at = new Date().toISOString();
  }

  await logAuditEvent({
    userId: callerSession.id,
    action: 'UPDATE_SUPPLIER_PO_STATUS',
    entityType: 'supplier_purchase_orders',
    entityId: po.id,
    oldValues: { status: prevStatus },
    newValues: { status: newStatus, notes },
  });

  return { success: true, po };
}
