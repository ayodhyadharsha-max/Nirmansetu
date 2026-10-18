/**
 * NIRMANSETU AYODHYA - SUPPLIER FULFILLMENT & SITE DELIVERY ENGINE
 *
 * Implements the complete 10-step local merchant fulfillment lifecycle:
 * 1. Order submission & validation.
 * 2. Admin assigns an eligible approved local Ayodhya supplier.
 * 3. Supplier confirms or rejects stock availability.
 * 4. Admin alternative supplier reassignment without losing history.
 * 5. Supplier prepares & packs the order.
 * 6. Delivery vehicle & driver dispatch with secure 4-digit Drop-off OTP.
 * 7. Live milestone tracking and customer WhatsApp/Email notifications.
 * 8. Site delivery confirmation via physical OTP verification.
 * 9. Failed delivery handling with failure reason recording and retry scheduling.
 * 10. Purchase Order procurement cost privacy and quantity reconciliation.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logAuditEvent, AuthenticatedUserSession } from '@/lib/auth/roles';
import { memoryOrders, StoredOrderRecord } from '@/lib/orders/service';
import {
  memorySuppliers,
  memorySupplierPos,
  checkSupplierIsolation,
  StoredSupplierPo,
} from '@/lib/suppliers/service';
import {
  notifySupplierConfirmed,
  notifyVehicleDispatched,
  notifyDeliveryCompleted,
} from '@/lib/notifications/service';

export interface DeliveryAssignmentRecord {
  id: string;
  order_id: string;
  po_id: string | null;
  driver_name: string;
  driver_phone: string;
  vehicle_type: 'three_wheeler_auto' | 'tata_ace' | 'tata_407' | 'tipper_truck' | 'tractor_trolley';
  vehicle_registration_number: string;
  delivery_instructions: string | null;
  status: 'assigned' | 'in_transit' | 'arrived_at_site' | 'delivered' | 'failed';
  delivery_otp: string;
  is_delivery_verified: boolean;
  picked_up_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PoReconciliationItem {
  variant_id: string;
  ordered_quantity: number;
  supplied_quantity: number;
  unit_cost_paise: number;
  reconciliation_notes?: string;
}

// In-memory registry for delivery assignments
export const memoryDeliveryAssignments = new Map<string, DeliveryAssignmentRecord>(); // order_id -> DeliveryAssignmentRecord

// ==============================================================================
// 1. ADMIN ASSIGNS SUPPLIER
// ==============================================================================

export async function assignSupplierToOrder(
  orderId: string,
  supplierId: string,
  adminSession: AuthenticatedUserSession
): Promise<{ success: boolean; order?: StoredOrderRecord; po?: StoredSupplierPo; error?: string }> {
  if (adminSession.role !== 'admin') {
    const err = new Error('Unauthorized: Only administrators can assign suppliers for fulfillment.');
    (err as any).statusCode = 403;
    throw err;
  }

  const order = memoryOrders.get(orderId);
  if (!order) {
    return { success: false, error: 'Order not found.' };
  }

  const supplier = memorySuppliers.get(supplierId);
  if (!supplier) {
    return { success: false, error: 'Supplier not found.' };
  }

  // Safety gate: Supplier must be verified by admin
  if (supplier.verification_status !== 'verified') {
    return {
      success: false,
      error: `Cannot assign order: Supplier "${supplier.business_name}" is currently in "${supplier.verification_status}" status. Only verified suppliers can fulfill orders.`,
    };
  }

  // Safety gate: Supplier must serve the order's postal PIN code
  const serviceablePins = (supplier.metadata?.serviceablePincodes as string[]) || [supplier.pincode];
  if (!serviceablePins.includes(order.pincode)) {
    return {
      success: false,
      error: `Supplier "${supplier.business_name}" does not service PIN code ${order.pincode} (Serves: ${serviceablePins.join(', ')}).`,
    };
  }

  // Generate or retrieve Purchase Order
  const poId = `po000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const poNumber = `PO-SUP-${dateStr}-${randomSuffix}`;

  const poItems = (order.items || []).map((i: any, idx: number) => ({
    id: `poi-${idx}`,
    variant_id: i.variant_id,
    product_title: i.product_title_snapshot || i.product_title || 'Material',
    variant_title: i.variant_title_snapshot || i.variant_title || 'Standard',
    quantity: i.quantity,
    unit_cost_paise: i.supplier_cost_paise || Math.round((i.unit_price_paise || 35000) * 0.85),
    total_cost_paise:
      (i.supplier_cost_paise || Math.round((i.unit_price_paise || 35000) * 0.85)) * i.quantity,
  }));

  const totalCostPaise = poItems.reduce((acc: number, i: any) => acc + i.total_cost_paise, 0);

  const po: StoredSupplierPo = {
    id: poId,
    po_number: poNumber,
    order_id: order.id,
    order_number: order.order_number,
    supplier_id: supplier.id,
    status: 'issued',
    total_cost_paise: totalCostPaise,
    expected_dispatch_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    actual_dispatch_at: null,
    supplier_invoice_number: null,
    notes: `Assigned by admin to ${supplier.business_name} for Ayodhya PIN ${order.pincode}`,
    items: poItems,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supplierPos = memorySupplierPos.get(supplier.id) || [];
  supplierPos.push(po);
  memorySupplierPos.set(supplier.id, supplierPos);

  // Update order record
  const prevStatus = order.status;
  order.status = 'supplier_assigned';
  order.status_history.push({
    id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    order_id: order.id,
    previous_status: prevStatus,
    new_status: 'supplier_assigned',
    status: 'supplier_assigned',
    changed_by: adminSession.id,
    notes: `Assigned to approved stockist "${supplier.business_name}" (${po.po_number})`,
    created_at: new Date().toISOString(),
  });
  memoryOrders.set(order.id, order);

  await logAuditEvent({
    userId: adminSession.id,
    action: 'ASSIGN_SUPPLIER_TO_ORDER',
    entityType: 'orders',
    entityId: order.id,
    oldValues: { status: prevStatus },
    newValues: { status: 'supplier_assigned', supplierId, poNumber: po.po_number },
  });

  return { success: true, order, po };
}

// ==============================================================================
// 2. SUPPLIER CONFIRMS OR REJECTS STOCK
// ==============================================================================

export async function supplierRespondToAssignment(
  orderId: string,
  poId: string,
  supplierId: string,
  action: 'confirm' | 'reject',
  notes: string,
  callerSession: AuthenticatedUserSession
): Promise<{ success: boolean; po?: StoredSupplierPo; order?: StoredOrderRecord; error?: string }> {
  checkSupplierIsolation(supplierId, callerSession);

  const order = memoryOrders.get(orderId);
  if (!order) return { success: false, error: 'Order not found.' };

  const supplier = memorySuppliers.get(supplierId);
  if (!supplier) return { success: false, error: 'Supplier not found.' };

  const poList = memorySupplierPos.get(supplierId) || [];
  const po = poList.find((p) => p.id === poId);
  if (!po) return { success: false, error: 'Purchase Order not found.' };

  if (action === 'confirm') {
    po.status = 'accepted';
    po.notes = notes || 'Stock availability confirmed by depot manager.';
    po.updated_at = new Date().toISOString();

    const prevStatus = order.status;
    order.status = 'supplier_confirmed';
    order.status_history.push({
      id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      order_id: order.id,
      previous_status: prevStatus,
      new_status: 'supplier_confirmed',
      status: 'supplier_confirmed',
      changed_by: callerSession.id,
      notes: `Stock confirmed by ${supplier.business_name}. Preparation underway.`,
      created_at: new Date().toISOString(),
    });

    // Notify customer
    await notifySupplierConfirmed({
      id: order.id,
      orderNumber: order.order_number,
      customerName:
        order.delivery_address_snapshot?.customerDetails?.name ||
        order.delivery_address_snapshot?.siteOrPersonName ||
        'Valued Customer',
      customerPhone:
        order.delivery_address_snapshot?.customerDetails?.phone ||
        order.delivery_address_snapshot?.contactPhone ||
        '9450000000',
      supplierName: supplier.business_name,
    });
  } else {
    // REJECTION WORKFLOW
    po.status = 'cancelled';
    po.notes = `Stock rejected by supplier: ${notes || 'Stock depleted / Yard unable to fulfill'}`;
    po.updated_at = new Date().toISOString();

    const prevStatus = order.status;
    order.status = 'supplier_rejected';
    order.status_history.push({
      id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      order_id: order.id,
      previous_status: prevStatus,
      new_status: 'supplier_rejected',
      status: 'supplier_rejected',
      changed_by: callerSession.id,
      notes: `Rejected by ${supplier.business_name}. Reason: ${notes || 'Stock depleted'}. Awaiting admin reassignment.`,
      created_at: new Date().toISOString(),
    });
  }

  memoryOrders.set(order.id, order);

  await logAuditEvent({
    userId: callerSession.id,
    action: action === 'confirm' ? 'SUPPLIER_CONFIRM_STOCK' : 'SUPPLIER_REJECT_STOCK',
    entityType: 'supplier_purchase_orders',
    entityId: po.id,
    newValues: { status: po.status, notes },
  });

  return { success: true, po, order };
}

// ==============================================================================
// 3. ADMIN REASSIGNS ALTERNATIVE SUPPLIER
// ==============================================================================

export async function reassignAlternativeSupplier(
  orderId: string,
  newSupplierId: string,
  adminSession: AuthenticatedUserSession,
  reason: string
): Promise<{ success: boolean; order?: StoredOrderRecord; po?: StoredSupplierPo; error?: string }> {
  if (adminSession.role !== 'admin') {
    const err = new Error('Unauthorized');
    (err as any).statusCode = 403;
    throw err;
  }

  const order = memoryOrders.get(orderId);
  if (!order) return { success: false, error: 'Order not found.' };

  order.status_history.push({
    id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    order_id: order.id,
    previous_status: order.status,
    new_status: 'supplier_assigned',
    status: 'supplier_assigned',
    changed_by: adminSession.id,
    notes: `Reassigned to alternative merchant. Justification: ${reason}`,
    created_at: new Date().toISOString(),
  });

  return assignSupplierToOrder(orderId, newSupplierId, adminSession);
}

// ==============================================================================
// 4. SUPPLIER PREPARES ORDER
// ==============================================================================

export async function supplierPrepareOrder(
  orderId: string,
  poId: string,
  supplierId: string,
  callerSession: AuthenticatedUserSession
): Promise<{ success: boolean; po?: StoredSupplierPo; order?: StoredOrderRecord; error?: string }> {
  checkSupplierIsolation(supplierId, callerSession);

  const order = memoryOrders.get(orderId);
  if (!order) return { success: false, error: 'Order not found.' };

  const poList = memorySupplierPos.get(supplierId) || [];
  const po = poList.find((p) => p.id === poId);
  if (!po) return { success: false, error: 'PO not found.' };

  po.status = 'packed';
  po.updated_at = new Date().toISOString();

  const prevStatus = order.status;
  order.status = 'processing';
  order.status_history.push({
    id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    order_id: order.id,
    previous_status: prevStatus,
    new_status: 'processing',
    status: 'processing',
    changed_by: callerSession.id,
    notes: 'Order materials packed and ready for transport loading.',
    created_at: new Date().toISOString(),
  });

  memoryOrders.set(order.id, order);

  await logAuditEvent({
    userId: callerSession.id,
    action: 'SUPPLIER_PACK_ORDER',
    entityType: 'supplier_purchase_orders',
    entityId: po.id,
    newValues: { status: 'packed' },
  });

  return { success: true, po, order };
}

// ==============================================================================
// 5. DISPATCH DELIVERY WITH 4-DIGIT DROP-OFF OTP
// ==============================================================================

export interface DispatchDetails {
  driverName: string;
  driverPhone: string;
  vehicleType: DeliveryAssignmentRecord['vehicle_type'];
  vehicleRegistrationNumber: string;
  deliveryInstructions?: string;
}

export async function dispatchOrderWithDelivery(
  orderId: string,
  poId: string,
  dispatch: DispatchDetails,
  callerSession: AuthenticatedUserSession
): Promise<{ success: boolean; delivery?: DeliveryAssignmentRecord; order?: StoredOrderRecord; error?: string }> {
  const order = memoryOrders.get(orderId);
  if (!order) return { success: false, error: 'Order not found.' };

  // Generate secure 4-digit site drop-off OTP
  const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

  const deliveryRecord: DeliveryAssignmentRecord = {
    id: `del00000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    order_id: order.id,
    po_id: poId || null,
    driver_name: dispatch.driverName.trim(),
    driver_phone: dispatch.driverPhone.trim(),
    vehicle_type: dispatch.vehicleType,
    vehicle_registration_number: dispatch.vehicleRegistrationNumber.trim().toUpperCase(),
    delivery_instructions: dispatch.deliveryInstructions?.trim() || null,
    status: 'in_transit',
    delivery_otp: deliveryOtp,
    is_delivery_verified: false,
    picked_up_at: new Date().toISOString(),
    delivered_at: null,
    failed_at: null,
    failure_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryDeliveryAssignments.set(order.id, deliveryRecord);

  // Update order status
  const prevDispatchStatus = order.status;
  order.status = 'dispatched';
  order.status_history.push({
    id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    order_id: order.id,
    previous_status: prevDispatchStatus,
    new_status: 'dispatched',
    status: 'dispatched',
    changed_by: callerSession.id,
    notes: `Vehicle en route: ${dispatch.driverName} (${dispatch.vehicleRegistrationNumber}). Drop-off OTP generated.`,
    created_at: new Date().toISOString(),
  });
  memoryOrders.set(order.id, order);

  // Dispatch customer notification
  await notifyVehicleDispatched({
    id: order.id,
    orderNumber: order.order_number,
    customerName:
      order.delivery_address_snapshot?.customerDetails?.name ||
      order.delivery_address_snapshot?.siteOrPersonName ||
      'Customer',
    customerPhone:
      order.delivery_address_snapshot?.customerDetails?.phone ||
      order.delivery_address_snapshot?.contactPhone ||
      '9450000000',
    driverName: dispatch.driverName,
    driverPhone: dispatch.driverPhone,
    vehicleType: dispatch.vehicleType.replace(/_/g, ' '),
    vehicleNumber: dispatch.vehicleRegistrationNumber,
    deliveryOtp,
  });

  await logAuditEvent({
    userId: callerSession.id,
    action: 'DISPATCH_ORDER_DELIVERY',
    entityType: 'delivery_assignments',
    entityId: deliveryRecord.id,
    newValues: {
      orderId: order.id,
      driverName: dispatch.driverName,
      vehicleRegistration: dispatch.vehicleRegistrationNumber,
      deliveryOtp,
    },
  });

  return { success: true, delivery: deliveryRecord, order };
}

// ==============================================================================
// 6. RECORD DELIVERY COMPLETION VIA OTP VERIFICATION
// ==============================================================================

export async function recordDeliveryCompletion(
  orderId: string,
  enteredOtp: string,
  completionNotes: string | undefined,
  callerSession: AuthenticatedUserSession
): Promise<{ success: boolean; delivery?: DeliveryAssignmentRecord; order?: StoredOrderRecord; error?: string }> {
  const order = memoryOrders.get(orderId);
  if (!order) return { success: false, error: 'Order not found.' };

  const delivery = memoryDeliveryAssignments.get(orderId);
  if (!delivery) {
    return { success: false, error: 'No active delivery dispatch record found for this order.' };
  }

  // Verify OTP
  if (delivery.delivery_otp !== enteredOtp.trim()) {
    return {
      success: false,
      error: 'Invalid Drop-off OTP. Customer must physically inspect goods and provide the correct 4-digit code.',
    };
  }

  delivery.status = 'delivered';
  delivery.is_delivery_verified = true;
  delivery.delivered_at = new Date().toISOString();
  delivery.updated_at = new Date().toISOString();
  memoryDeliveryAssignments.set(orderId, delivery);

  const prevDeliveredStatus = order.status;
  order.status = 'delivered';
  order.delivered_at = new Date().toISOString();
  order.status_history.push({
    id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    order_id: order.id,
    previous_status: prevDeliveredStatus,
    new_status: 'delivered',
    status: 'delivered',
    changed_by: callerSession.id,
    notes: `Material inspection passed & 4-digit OTP verified at site. ${completionNotes || ''}`,
    created_at: new Date().toISOString(),
  });
  memoryOrders.set(order.id, order);

  await notifyDeliveryCompleted({
    id: order.id,
    orderNumber: order.order_number,
    customerName:
      order.delivery_address_snapshot?.customerDetails?.name ||
      order.delivery_address_snapshot?.siteOrPersonName ||
      'Customer',
    customerPhone:
      order.delivery_address_snapshot?.customerDetails?.phone ||
      order.delivery_address_snapshot?.contactPhone ||
      '9450000000',
  });

  await logAuditEvent({
    userId: callerSession.id,
    action: 'COMPLETE_SITE_DELIVERY',
    entityType: 'delivery_assignments',
    entityId: delivery.id,
    newValues: { orderId: order.id, status: 'delivered', verifiedAt: delivery.delivered_at },
  });

  return { success: true, delivery, order };
}

// ==============================================================================
// 7. RECORD FAILED DELIVERY & RESCHEDULE
// ==============================================================================

export async function recordDeliveryFailure(
  orderId: string,
  failureReason: string,
  retryScheduledAt: string | undefined,
  callerSession: AuthenticatedUserSession
): Promise<{ success: boolean; delivery?: DeliveryAssignmentRecord; order?: StoredOrderRecord; error?: string }> {
  const order = memoryOrders.get(orderId);
  if (!order) return { success: false, error: 'Order not found.' };

  const delivery = memoryDeliveryAssignments.get(orderId);
  if (!delivery) return { success: false, error: 'Delivery record not found.' };

  delivery.status = 'failed';
  delivery.failed_at = new Date().toISOString();
  delivery.failure_reason = failureReason.trim();
  delivery.updated_at = new Date().toISOString();
  memoryDeliveryAssignments.set(orderId, delivery);

  const prevFailedStatus = order.status;
  order.status = 'failed_delivery';
  order.status_history.push({
    id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    order_id: order.id,
    previous_status: prevFailedStatus,
    new_status: 'failed_delivery',
    status: 'failed_delivery',
    changed_by: callerSession.id,
    notes: `Site drop-off failed: ${failureReason}. Retry scheduled: ${retryScheduledAt || 'Contacting contractor'}`,
    created_at: new Date().toISOString(),
  });
  memoryOrders.set(order.id, order);

  await logAuditEvent({
    userId: callerSession.id,
    action: 'RECORD_DELIVERY_FAILURE',
    entityType: 'delivery_assignments',
    entityId: delivery.id,
    newValues: { orderId: order.id, failureReason, retryScheduledAt },
  });

  return { success: true, delivery, order };
}

// ==============================================================================
// 8. PURCHASE ORDER QUANTITY RECONCILIATION
// ==============================================================================

export async function reconcilePoQuantities(
  poId: string,
  reconciliations: PoReconciliationItem[],
  supplierInvoiceNumber: string,
  adminSession: AuthenticatedUserSession
): Promise<{ success: boolean; discrepancyFound: boolean; discrepancies: any[]; error?: string }> {
  if (adminSession.role !== 'admin') {
    const err = new Error('Unauthorized');
    (err as any).statusCode = 403;
    throw err;
  }

  let targetPo: StoredSupplierPo | undefined;
  for (const list of Array.from(memorySupplierPos.values())) {
    const found = list.find((p: StoredSupplierPo) => p.id === poId);
    if (found) {
      targetPo = found;
      break;
    }
  }

  if (!targetPo) {
    return { success: false, discrepancyFound: false, discrepancies: [], error: 'Purchase Order not found.' };
  }

  targetPo.supplier_invoice_number = supplierInvoiceNumber.trim();
  targetPo.updated_at = new Date().toISOString();

  const discrepancies: any[] = [];
  reconciliations.forEach((item) => {
    const diff = item.supplied_quantity - item.ordered_quantity;
    if (diff !== 0) {
      discrepancies.push({
        variant_id: item.variant_id,
        ordered: item.ordered_quantity,
        supplied: item.supplied_quantity,
        shortageOrOverage: diff,
        notes: item.reconciliation_notes,
      });
    }
  });

  await logAuditEvent({
    userId: adminSession.id,
    action: 'RECONCILE_PO_QUANTITIES',
    entityType: 'supplier_purchase_orders',
    entityId: poId,
    newValues: {
      supplierInvoiceNumber,
      discrepancyCount: discrepancies.length,
      discrepancies,
    },
  });

  return {
    success: true,
    discrepancyFound: discrepancies.length > 0,
    discrepancies,
  };
}
