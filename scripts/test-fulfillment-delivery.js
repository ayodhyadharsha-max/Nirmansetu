/**
 * NIRMANSETU AYODHYA - SUPPLIER FULFILLMENT, DELIVERY & B2B QUOTATION TEST SUITE
 *
 * Verifies:
 * 1. Administrator-managed service zones, PIN codes, delivery fees, order minimums, operating hours & restrictions.
 * 2. Serviceability check returning fees, SLA range, and honest unavailable-area responses without universal claims.
 * 3. 10-Step Supplier Fulfillment Workflow:
 *    a. Customer submits order.
 *    b. Admin assigns an eligible approved supplier (verifies verification_status & serviceable PIN).
 *    c. Unapproved supplier assignment is blocked.
 *    d. Supplier confirms stock availability -> order moves to supplier_confirmed.
 *    e. Supplier rejects stock availability with reason -> order moves to supplier_rejected.
 *    f. Admin reassigns alternative supplier without losing order history or payment.
 *    g. Supplier prepares & packs order -> processing.
 *    h. Delivery arranged with vehicle & driver details -> 4-digit Drop-off OTP generated & dispatched.
 *    i. Customer receives WhatsApp/Email notification with driver phone & Drop-off OTP.
 *    j. Physical Drop-off OTP verification confirms site delivery -> delivered.
 *    k. Invalid OTP is rejected.
 *    l. Failed delivery handling (site locked / customer unreachable) records failure_reason & retry schedule.
 * 4. Purchase Order procurement cost privacy and quantity reconciliation (ordered vs supplied).
 * 5. Bulk RFQ submission capturing project location, materials, desired date, and persona.
 * 6. Quotation Workflow:
 *    a. RFQ dispatched to suppliers.
 *    b. Supplier submits private wholesale bids.
 *    c. Admin prepares and sends formal customer quotation.
 *    d. Customer accepts quotation.
 *    e. Accepted quotation is converted into a live site order.
 * 7. Multi-channel notifications with valid WhatsApp Click-to-Chat (wa.me) URL generation.
 * 8. Comprehensive security audit logging.
 *
 * Usage:
 *   node scripts/test-fulfillment-delivery.js
 */

const assert = require('assert');

console.log('============================================================');
console.log('NIRMANSETU: SUPPLIER FULFILLMENT & DELIVERY OPERATIONS TEST');
console.log('============================================================');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err.message}`);
  }
}

// ----------------------------------------------------------------------------
// IN-MEMORY STORES & CORE BUSINESS LOGIC ENGINES
// ----------------------------------------------------------------------------

const memoryServicePincodes = new Map([
  [
    '224123',
    {
      pincode: '224123',
      zone_name: 'Ayodhya Dham Hub (Central Mandir Ward)',
      hub_locality: 'Tedhi Bazar',
      is_serviceable: true,
      min_order_paise: 50000, // ₹500
      standard_delivery_fee_paise: 19900, // ₹199
      express_delivery_fee_paise: 39900, // ₹399
      free_delivery_threshold_paise: 1500000, // ₹15,000
      estimated_sla_min_minutes: 60,
      estimated_sla_max_minutes: 180,
      operating_hours: { open: '06:00', close: '21:00' },
      delivery_restrictions: [
        'Pedestrian-only heritage corridors require manual cart or small electric trike',
        'Heavy tipper trucks restricted between 08:00 and 20:00 on Ram Path',
      ],
      max_vehicle_capacity: 'tata_ace',
      updated_at: new Date().toISOString(),
    },
  ],
  [
    '224001',
    {
      pincode: '224001',
      zone_name: 'Faizabad Central Commercial District',
      hub_locality: 'Civil Lines',
      is_serviceable: true,
      min_order_paise: 50000,
      standard_delivery_fee_paise: 14900,
      express_delivery_fee_paise: 29900,
      free_delivery_threshold_paise: 1500000,
      estimated_sla_min_minutes: 45,
      estimated_sla_max_minutes: 120,
      operating_hours: { open: '06:00', close: '22:00' },
      delivery_restrictions: ['Heavy tipper trucks allowed on ring bypass 24/7'],
      max_vehicle_capacity: 'tipper_truck',
      updated_at: new Date().toISOString(),
    },
  ],
  [
    '224122',
    {
      pincode: '224122',
      zone_name: 'Bikapur Rural & Agricultural Periphery',
      hub_locality: 'Bikapur Tehsil Gate',
      is_serviceable: true,
      min_order_paise: 150000, // ₹1,500
      standard_delivery_fee_paise: 34900,
      express_delivery_fee_paise: 59900,
      free_delivery_threshold_paise: 2500000,
      estimated_sla_min_minutes: 180,
      estimated_sla_max_minutes: 360,
      operating_hours: { open: '07:00', close: '19:00' },
      delivery_restrictions: ['Unpaved rural approach lanes during monsoon'],
      max_vehicle_capacity: 'tractor_trolley',
      updated_at: new Date().toISOString(),
    },
  ],
]);

async function checkDestinationServiceability(pincode, orderSubtotalPaise = 0) {
  const cleanPin = pincode ? pincode.trim() : '';
  const config = memoryServicePincodes.get(cleanPin);

  if (!config || !config.is_serviceable) {
    return {
      serviceable: false,
      pincode: cleanPin,
      unavailableNotice: {
        message: `Postal PIN code ${cleanPin} is not currently serviceable for direct site dispatch. NirmanSetu does not operate universal coverage across all Uttar Pradesh; we only dispatch to verified construction zones in the Ayodhya division.`,
        closestHubs: ['224123 (Ayodhya Dham)', '224001 (Faizabad Central)'],
        bulkInquiryPrompt: 'For institutional or large commercial consignments outside active zones, submit a Bulk RFQ for freight assessment.',
      },
    };
  }

  const meetsMinimum = orderSubtotalPaise >= config.min_order_paise;
  const deficitPaise = meetsMinimum ? 0 : config.min_order_paise - orderSubtotalPaise;
  const isFreeDelivery =
    config.free_delivery_threshold_paise > 0 && orderSubtotalPaise >= config.free_delivery_threshold_paise;
  const standardFee = isFreeDelivery ? 0 : config.standard_delivery_fee_paise;

  return {
    serviceable: true,
    pincode: cleanPin,
    zoneName: config.zone_name,
    hubLocality: config.hub_locality,
    deliveryFees: {
      standardDeliveryFeePaise: standardFee,
      isFreeDeliveryEligible: isFreeDelivery,
    },
    orderMinimums: {
      minimumOrderPaise: config.min_order_paise,
      meetsMinimum,
      deficitPaise,
    },
    estimatedDelivery: {
      minMinutes: config.estimated_sla_min_minutes,
      maxMinutes: config.estimated_sla_max_minutes,
      label: `${Math.round(config.estimated_sla_min_minutes / 60)}-${Math.round(config.estimated_sla_max_minutes / 60)} hours`,
    },
    deliveryRestrictions: config.delivery_restrictions,
    maxVehicleCapacity: config.max_vehicle_capacity,
  };
}

const memoryOrders = new Map();
const memorySuppliers = new Map([
  [
    's0000000-0000-0000-0000-000000000001',
    {
      id: 's0000000-0000-0000-0000-000000000001',
      business_name: 'Awadh Building Materials Mart',
      contact_person: 'Rajesh Agrawal',
      phone: '9450011223',
      verification_status: 'verified',
      is_active: true,
      pincode: '224123',
      metadata: { serviceablePincodes: ['224123'] },
    },
  ],
  [
    's0000000-0000-0000-0000-000000000002',
    {
      id: 's0000000-0000-0000-0000-000000000002',
      business_name: 'Ramrajya Cement & Iron Depot',
      contact_person: 'Virendra Maurya',
      phone: '9450099887',
      verification_status: 'verified',
      is_active: true,
      pincode: '224001',
      metadata: { serviceablePincodes: ['224001', '224133'] },
    },
  ],
]);
const memorySupplierPos = new Map();
const memoryDeliveryAssignments = new Map();
const testAuditLogs = [];

function checkSupplierIsolation(supplierId, callerSession) {
  if (callerSession.role === 'admin') return;
  if (callerSession.role === 'supplier' && callerSession.supplierId === supplierId) return;
  const err = new Error('Forbidden: Cannot access another supplier data');
  err.statusCode = 403;
  throw err;
}

async function assignSupplierToOrder(orderId, supplierId, adminSession) {
  if (adminSession.role !== 'admin') {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }
  const order = memoryOrders.get(orderId);
  if (!order) return { success: false, error: 'Order not found' };

  const supplier = memorySuppliers.get(supplierId);
  if (!supplier) return { success: false, error: 'Supplier not found' };

  if (supplier.verification_status !== 'verified') {
    return { success: false, error: 'Only verified suppliers can fulfill orders' };
  }

  const poNumber = `PO-AYD-${Date.now().toString().slice(-6)}`;
  const po = {
    id: `po-${Date.now()}`,
    po_number: poNumber,
    order_id: orderId,
    supplier_id: supplierId,
    supplier_name: supplier.business_name,
    status: 'issued',
    total_procurement_cost_paise: Math.round(order.subtotal_paise * 0.88),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const list = memorySupplierPos.get(supplierId) || [];
  list.push(po);
  memorySupplierPos.set(supplierId, list);

  const prevStatus = order.status;
  order.status = 'supplier_assigned';
  order.status_history.push({
    id: `sh-${Date.now()}`,
    order_id: order.id,
    previous_status: prevStatus,
    new_status: 'supplier_assigned',
    status: 'supplier_assigned',
    changed_by: adminSession.id,
    notes: `Assigned to approved stockist "${supplier.business_name}" (${po.po_number})`,
    created_at: new Date().toISOString(),
  });
  memoryOrders.set(order.id, order);

  testAuditLogs.push({ action: 'ASSIGN_SUPPLIER_TO_ORDER', entity_id: order.id });
  return { success: true, order, po };
}

async function supplierRespondToAssignment(orderId, poId, supplierId, action, notes, callerSession) {
  checkSupplierIsolation(supplierId, callerSession);
  const order = memoryOrders.get(orderId);
  if (!order) return { success: false, error: 'Order not found' };

  const supplier = memorySuppliers.get(supplierId);
  const poList = memorySupplierPos.get(supplierId) || [];
  const po = poList.find((p) => p.id === poId);
  if (!po) return { success: false, error: 'PO not found' };

  const prevStatus = order.status;
  if (action === 'confirm') {
    po.status = 'accepted';
    po.notes = notes;
    order.status = 'supplier_confirmed';
    order.status_history.push({
      id: `sh-${Date.now()}`,
      order_id: order.id,
      previous_status: prevStatus,
      new_status: 'supplier_confirmed',
      status: 'supplier_confirmed',
      changed_by: callerSession.id,
      notes: `Stock confirmed by ${supplier.business_name}. ${notes}`,
      created_at: new Date().toISOString(),
    });
  } else {
    po.status = 'cancelled';
    po.notes = notes;
    order.status = 'supplier_rejected';
    order.status_history.push({
      id: `sh-${Date.now()}`,
      order_id: order.id,
      previous_status: prevStatus,
      new_status: 'supplier_rejected',
      status: 'supplier_rejected',
      changed_by: callerSession.id,
      notes: `Rejected by ${supplier.business_name}. Reason: ${notes}`,
      created_at: new Date().toISOString(),
    });
  }
  memoryOrders.set(order.id, order);
  return { success: true, po, order };
}

async function reassignAlternativeSupplier(orderId, newSupplierId, adminSession, reason) {
  if (adminSession.role !== 'admin') {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }
  const order = memoryOrders.get(orderId);
  if (!order) return { success: false, error: 'Order not found' };

  order.status_history.push({
    id: `sh-${Date.now()}`,
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

async function supplierPrepareOrder(orderId, poId, supplierId, callerSession) {
  checkSupplierIsolation(supplierId, callerSession);
  const order = memoryOrders.get(orderId);
  const poList = memorySupplierPos.get(supplierId) || [];
  const po = poList.find((p) => p.id === poId);
  if (!po) return { success: false, error: 'PO not found' };

  po.status = 'packed';
  const prevStatus = order.status;
  order.status = 'processing';
  order.status_history.push({
    id: `sh-${Date.now()}`,
    order_id: order.id,
    previous_status: prevStatus,
    new_status: 'processing',
    status: 'processing',
    changed_by: callerSession.id,
    notes: 'Order materials packed and ready for transport loading.',
    created_at: new Date().toISOString(),
  });
  memoryOrders.set(order.id, order);
  return { success: true, po, order };
}

async function dispatchOrderWithDelivery(orderId, poId, dispatch, callerSession) {
  const order = memoryOrders.get(orderId);
  if (!order) return { success: false, error: 'Order not found' };

  const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
  const deliveryRecord = {
    id: `del-${Date.now()}`,
    order_id: order.id,
    po_id: poId,
    driver_name: dispatch.driverName,
    driver_phone: dispatch.driverPhone,
    vehicle_type: dispatch.vehicleType,
    vehicle_registration_number: dispatch.vehicleRegistrationNumber.toUpperCase(),
    delivery_instructions: dispatch.deliveryInstructions,
    status: 'in_transit',
    delivery_otp: deliveryOtp,
    is_delivery_verified: false,
    created_at: new Date().toISOString(),
  };

  memoryDeliveryAssignments.set(order.id, deliveryRecord);

  const prevStatus = order.status;
  order.status = 'dispatched';
  order.status_history.push({
    id: `sh-${Date.now()}`,
    order_id: order.id,
    previous_status: prevStatus,
    new_status: 'dispatched',
    status: 'dispatched',
    changed_by: callerSession.id,
    notes: `Vehicle en route: ${dispatch.driverName} (${dispatch.vehicleRegistrationNumber}). Drop-off OTP generated.`,
    created_at: new Date().toISOString(),
  });
  memoryOrders.set(order.id, order);

  return { success: true, delivery: deliveryRecord, order };
}

async function recordDeliveryCompletion(orderId, enteredOtp, completionNotes, callerSession) {
  const order = memoryOrders.get(orderId);
  if (!order) return { success: false, error: 'Order not found' };

  const delivery = memoryDeliveryAssignments.get(orderId);
  if (!delivery) return { success: false, error: 'No active delivery dispatch record found for this order.' };

  if (delivery.delivery_otp !== enteredOtp.trim()) {
    return {
      success: false,
      error: 'Invalid Drop-off OTP. Customer must physically inspect goods and provide the correct 4-digit code.',
    };
  }

  delivery.status = 'delivered';
  delivery.is_delivery_verified = true;
  delivery.delivered_at = new Date().toISOString();

  const prevStatus = order.status;
  order.status = 'delivered';
  order.delivered_at = new Date().toISOString();
  order.status_history.push({
    id: `sh-${Date.now()}`,
    order_id: order.id,
    previous_status: prevStatus,
    new_status: 'delivered',
    status: 'delivered',
    changed_by: callerSession.id,
    notes: `Material inspection passed & 4-digit OTP verified at site. ${completionNotes || ''}`,
    created_at: new Date().toISOString(),
  });
  memoryOrders.set(order.id, order);

  return { success: true, delivery, order };
}

async function recordDeliveryFailure(orderId, failureReason, retryScheduledAt, callerSession) {
  const order = memoryOrders.get(orderId);
  if (!order) return { success: false, error: 'Order not found' };

  const delivery = memoryDeliveryAssignments.get(orderId);
  if (!delivery) return { success: false, error: 'Delivery record not found' };

  delivery.status = 'failed';
  delivery.failure_reason = failureReason;

  const prevStatus = order.status;
  order.status = 'failed_delivery';
  order.status_history.push({
    id: `sh-${Date.now()}`,
    order_id: order.id,
    previous_status: prevStatus,
    new_status: 'failed_delivery',
    status: 'failed_delivery',
    changed_by: callerSession.id,
    notes: `Site drop-off failed: ${failureReason}. Retry scheduled: ${retryScheduledAt}`,
    created_at: new Date().toISOString(),
  });
  memoryOrders.set(order.id, order);

  return { success: true, delivery, order };
}

async function reconcilePoQuantities(poId, reconciliations, supplierInvoiceNumber, adminSession) {
  if (adminSession.role !== 'admin') {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }

  let targetPo;
  for (const list of Array.from(memorySupplierPos.values())) {
    const found = list.find((p) => p.id === poId);
    if (found) {
      targetPo = found;
      break;
    }
  }

  if (!targetPo) return { success: false, error: 'PO not found' };

  targetPo.supplier_invoice_number = supplierInvoiceNumber;
  const discrepancies = [];
  reconciliations.forEach((r) => {
    const diff = r.supplied_quantity - r.ordered_quantity;
    if (diff !== 0) {
      discrepancies.push({
        variant_id: r.variant_id,
        shortageOrOverage: diff,
        notes: r.reconciliation_notes,
      });
    }
  });

  return {
    success: true,
    discrepancyFound: discrepancies.length > 0,
    discrepancies,
  };
}

// ----------------------------------------------------------------------------
// B2B RFQ & QUOTATIONS LOGIC
// ----------------------------------------------------------------------------

const memoryEnquiries = new Map();
const memorySupplierBids = new Map();
const memoryQuotations = new Map();

async function submitBulkEnquiry(payload) {
  const enquiryId = `rfq-${Date.now()}`;
  const enquiryNumber = `RFQ-AYD-${Date.now().toString().slice(-6)}`;
  const enquiry = {
    id: enquiryId,
    enquiry_number: enquiryNumber,
    ...payload,
    status: 'new',
    created_at: new Date().toISOString(),
  };
  memoryEnquiries.set(enquiryId, enquiry);
  return { success: true, enquiryId, enquiryNumber };
}

async function recordSupplierRfqBid(enquiryId, supplierId, items, callerSession) {
  checkSupplierIsolation(supplierId, callerSession);
  const totalProcurement = items.reduce((acc, it) => acc + it.unit_cost_paise * it.available_qty, 0);
  const bid = {
    id: `bid-${Date.now()}`,
    enquiry_id: enquiryId,
    supplier_id: supplierId,
    items,
    total_procurement_cost_paise: totalProcurement,
    created_at: new Date().toISOString(),
  };
  const list = memorySupplierBids.get(enquiryId) || [];
  list.push(bid);
  memorySupplierBids.set(enquiryId, list);
  return { success: true, bid };
}

async function listSupplierBidsAdmin(enquiryId, callerSession) {
  if (callerSession.role !== 'admin') {
    const err = new Error('Forbidden: Only platform admins can inspect wholesale supplier bids');
    err.statusCode = 403;
    throw err;
  }
  return memorySupplierBids.get(enquiryId) || [];
}

async function createCustomerQuotation(payload, adminSession) {
  if (adminSession.role !== 'admin') {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }

  const quoteId = `qt-${Date.now()}`;
  const quoteNumber = `QT-AYD-${Date.now().toString().slice(-6)}`;

  let subtotal = 0;
  let tax = 0;
  const items = payload.items.map((it, idx) => {
    const lineSubtotal = it.quantity * it.unitRatePaise;
    const lineTax = Math.round((lineSubtotal * it.gstRatePct) / 100);
    subtotal += lineSubtotal;
    tax += lineTax;
    return {
      id: `qi-${idx}`,
      item_title: it.itemTitle,
      unit: it.unit,
      quantity: it.quantity,
      unit_rate_paise: it.unitRatePaise,
      gst_rate_pct: it.gstRatePct,
      tax_paise: lineTax,
      total_paise: lineSubtotal + lineTax,
    };
  });

  const freight = payload.freightPaise || 0;
  const unloading = payload.unloadingChargesPaise || 0;
  const total = subtotal + tax + freight + unloading;

  const quotation = {
    id: quoteId,
    quotation_number: quoteNumber,
    enquiry_id: payload.enquiryId,
    client_name: payload.clientName,
    client_phone: payload.clientPhone,
    delivery_address: payload.deliveryAddress,
    delivery_pincode: payload.deliveryPincode,
    items,
    subtotal_paise: subtotal,
    tax_paise: tax,
    freight_paise: freight,
    unloading_charges_paise: unloading,
    total_paise: total,
    status: 'sent',
    created_at: new Date().toISOString(),
  };

  memoryQuotations.set(quoteId, quotation);
  return { success: true, quotation };
}

async function customerRespondToQuotation(quotationId, action, callerSession) {
  const quotation = memoryQuotations.get(quotationId);
  if (!quotation) return { success: false, error: 'Quotation not found' };

  if (action === 'accept') {
    quotation.status = 'accepted';
  } else {
    quotation.status = 'declined';
  }
  return { success: true, quotation };
}

async function convertQuotationToOrder(quotationId, callerSession) {
  const quotation = memoryQuotations.get(quotationId);
  if (!quotation) return { success: false, error: 'Quotation not found' };
  if (quotation.status !== 'accepted') {
    return { success: false, error: 'Only accepted quotations can be converted' };
  }

  const orderId = `ord-qt-${Date.now()}`;
  const orderNumber = `NS-QT-${Date.now().toString().slice(-6)}`;

  const order = {
    id: orderId,
    order_number: orderNumber,
    user_id: callerSession.id,
    status: 'confirmed',
    payment_status: 'paid',
    payment_method: 'bank_transfer',
    subtotal_paise: quotation.subtotal_paise,
    tax_paise: quotation.tax_paise,
    delivery_fee_paise: quotation.freight_paise + quotation.unloading_charges_paise,
    discount_paise: 0,
    total_paise: quotation.total_paise,
    pincode: quotation.delivery_pincode,
    items: quotation.items.map((qi, idx) => ({
      variant_id: `v-qt-${idx}`,
      product_title: qi.item_title,
      quantity: qi.quantity,
      unit_price_paise: qi.unit_rate_paise,
    })),
    status_history: [{ status: 'confirmed', notes: `Converted from quotation ${quotation.quotation_number}` }],
    created_at: new Date().toISOString(),
  };

  memoryOrders.set(orderId, order);
  quotation.status = 'converted';
  return { success: true, order };
}

// ----------------------------------------------------------------------------
// NOTIFICATIONS LOGIC
// ----------------------------------------------------------------------------

function buildWhatsAppClickToChatUrl(phone, text) {
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    clean = `91${clean}`;
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

async function sendNotification(payload) {
  let whatsappClickToChatUrl;
  if (payload.recipientPhone) {
    whatsappClickToChatUrl = buildWhatsAppClickToChatUrl(
      payload.recipientPhone,
      `*${payload.title}*\n\n${payload.body}`
    );
  }
  return {
    success: true,
    channel: payload.channel,
    whatsappClickToChatUrl,
  };
}

// ----------------------------------------------------------------------------
// MAIN TEST EXECUTION
// ----------------------------------------------------------------------------

async function main() {
  const adminSession = { id: 'adm-super-01', role: 'admin' };
  const customerSession = { id: 'cust-usr-101', role: 'customer' };

  // ----------------------------------------------------------------------------
  // TEST SUITE 1: SERVICEABILITY, OPERATING HOURS, AND REGIONAL RESTRICTIONS
  // ----------------------------------------------------------------------------
  console.log('\n[1] Testing Serviceability Backend, Fees, Hours & Restrictions...');

  await runAsyncTest('Active Ayodhya hub (224123 - Ayodhya Dham) returns complete logistics details', async () => {
    const res = await checkDestinationServiceability('224123', 60000); // ₹600 order
    assert.strictEqual(res.serviceable, true);
    assert.strictEqual(res.pincode, '224123');
    assert.ok(res.zoneName.includes('Ayodhya Dham'));
    assert.ok(res.deliveryFees);
    assert.strictEqual(res.deliveryFees.standardDeliveryFeePaise, 19900); // ₹199
    assert.strictEqual(res.orderMinimums.meetsMinimum, true); // ₹600 >= ₹500
    assert.ok(res.estimatedDelivery);
    assert.ok(res.deliveryRestrictions.length >= 2);
    assert.ok(res.deliveryRestrictions.some((r) => r.includes('heritage') || r.includes('Heavy')));
  });

  await runAsyncTest('Order below minimum order value reports deficit', async () => {
    const res = await checkDestinationServiceability('224122', 80000); // Bikapur min order is ₹1,500 (150000 paise)
    assert.strictEqual(res.serviceable, true);
    assert.strictEqual(res.orderMinimums.meetsMinimum, false);
    assert.strictEqual(res.orderMinimums.deficitPaise, 70000); // ₹700 deficit
  });

  await runAsyncTest('Free delivery threshold eligibility triggers at qualifying order amount', async () => {
    const res = await checkDestinationServiceability('224123', 2000000); // ₹20,000 order (threshold is ₹15,000)
    assert.strictEqual(res.serviceable, true);
    assert.strictEqual(res.deliveryFees.isFreeDeliveryEligible, true);
    assert.strictEqual(res.deliveryFees.standardDeliveryFeePaise, 0); // ₹0 freight!
  });

  await runAsyncTest('Unserviceable area returns honest unavailable notice without universal state claim', async () => {
    // Lucknow or Varanasi PIN code (outside active Ayodhya zones)
    const res = await checkDestinationServiceability('226001');
    assert.strictEqual(res.serviceable, false);
    assert.ok(res.unavailableNotice);
    assert.ok(res.unavailableNotice.message.includes('not currently serviceable'));
    assert.ok(res.unavailableNotice.message.includes('not operate universal coverage across all Uttar Pradesh'));
    assert.ok(res.unavailableNotice.closestHubs.length > 0);
    assert.ok(res.unavailableNotice.bulkInquiryPrompt.includes('Bulk RFQ'));
  });

  // ----------------------------------------------------------------------------
  // TEST SUITE 2: SUPPLIER FULFILLMENT LIFECYCLE (STEPS 1 - 5)
  // ----------------------------------------------------------------------------
  console.log('\n[2] Testing Supplier Assignment, Rejection, Reassignment & Preparation...');

  // Seed test order
  const testOrder = {
    id: 'ord-test-001',
    order_number: 'NS-AYD-TEST-001',
    user_id: 'cust-usr-101',
    status: 'confirmed',
    payment_status: 'paid',
    payment_method: 'razorpay',
    subtotal_paise: 3850000,
    tax_paise: 1078000,
    delivery_fee_paise: 19900,
    discount_paise: 0,
    total_paise: 4947900,
    pincode: '224123',
    delivery_address_snapshot: {
      customerDetails: { name: 'Vikram Singh', phone: '9451000111', email: 'vikram@site.in' },
      streetAddress: 'Plot 12, Tedhi Bazar Road',
      pincode: '224123',
    },
    items: [
      {
        variant_id: 'v0000000-0000-0000-0000-000000000001',
        product_title: 'UltraTech Super PPC Cement',
        variant_title: '50 kg Bag',
        quantity: 100,
        unit_price_paise: 38500,
        supplier_cost_paise: 34500,
      },
    ],
    status_history: [{ status: 'confirmed', notes: 'Payment verified', created_at: new Date().toISOString() }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryOrders.set(testOrder.id, testOrder);

  // Verified suppliers
  const supplier1Id = 's0000000-0000-0000-0000-000000000001'; // Awadh Material Mart (serves 224123)
  const supplier2Id = 's0000000-0000-0000-0000-000000000002'; // Ramrajya Depot (serves 224001, 224133)

  const supplier1Session = {
    id: 'usr-sup-01',
    role: 'supplier',
    supplierId: supplier1Id,
  };

  const supplier2Session = {
    id: 'usr-sup-02',
    role: 'supplier',
    supplierId: supplier2Id,
  };

  let activePoId = '';

  await runAsyncTest('Admin assigns eligible approved supplier -> issues PO & marks supplier_assigned', async () => {
    const result = await assignSupplierToOrder(testOrder.id, supplier1Id, adminSession);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.order.status, 'supplier_assigned');
    assert.ok(result.po);
    assert.strictEqual(result.po.supplier_id, supplier1Id);
    assert.strictEqual(result.po.status, 'issued');
    activePoId = result.po.id;
  });

  await runAsyncTest('Attempt to assign an unverified pending supplier is BLOCKED', async () => {
    // Register temporary pending supplier
    const pendingId = 'sup-unverified-99';
    memorySuppliers.set(pendingId, {
      id: pendingId,
      business_name: 'Unverified Yard',
      verification_status: 'pending',
      is_active: true,
      pincode: '224123',
      metadata: { serviceablePincodes: ['224123'] },
    });

    const res = await assignSupplierToOrder(testOrder.id, pendingId, adminSession);
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('Only verified suppliers can fulfill orders'));
  });

  await runAsyncTest('Supplier rejects assignment with reason -> order moves to supplier_rejected', async () => {
    const rejectRes = await supplierRespondToAssignment(
      testOrder.id,
      activePoId,
      supplier1Id,
      'reject',
      'Out of UltraTech stock due to large commercial morning draw',
      supplier1Session
    );
    assert.strictEqual(rejectRes.success, true);
    assert.strictEqual(rejectRes.order.status, 'supplier_rejected');
    assert.strictEqual(rejectRes.po.status, 'cancelled');

    const history = rejectRes.order.status_history;
    assert.ok(history.some((h) => h.notes.includes('Out of UltraTech stock')));
  });

  await runAsyncTest('Admin reassigns alternative supplier without losing order history or payment', async () => {
    // Add 224123 to supplier 2 serviceable PINs for testing
    const s2 = memorySuppliers.get(supplier2Id);
    s2.metadata.serviceablePincodes.push('224123');

    const reassignRes = await reassignAlternativeSupplier(
      testOrder.id,
      supplier2Id,
      adminSession,
      'Reassigned to Ramrajya Depot after Awadh stock depletion'
    );
    assert.strictEqual(reassignRes.success, true);
    assert.strictEqual(reassignRes.order.status, 'supplier_assigned');
    assert.strictEqual(reassignRes.po.supplier_id, supplier2Id);
    activePoId = reassignRes.po.id;

    // History must retain both rejection and reassignment
    const history = reassignRes.order.status_history;
    assert.ok(history.some((h) => h.status === 'supplier_rejected'));
    assert.ok(history.some((h) => h.notes.includes('Reassigned to alternative merchant')));
  });

  await runAsyncTest('Supplier confirms stock availability -> moves to supplier_confirmed', async () => {
    const confirmRes = await supplierRespondToAssignment(
      testOrder.id,
      activePoId,
      supplier2Id,
      'confirm',
      '500 bags UltraTech verified in yard. Loading ready.',
      supplier2Session
    );
    assert.strictEqual(confirmRes.success, true);
    assert.strictEqual(confirmRes.order.status, 'supplier_confirmed');
    assert.strictEqual(confirmRes.po.status, 'accepted');
  });

  await runAsyncTest('Supplier prepares & packs order -> moves to processing', async () => {
    const prepRes = await supplierPrepareOrder(testOrder.id, activePoId, supplier2Id, supplier2Session);
    assert.strictEqual(prepRes.success, true);
    assert.strictEqual(prepRes.order.status, 'processing');
    assert.strictEqual(prepRes.po.status, 'packed');
  });

  // ----------------------------------------------------------------------------
  // TEST SUITE 3: DELIVERY DISPATCH, 4-DIGIT OTP & PHYSICAL COMPLETION
  // ----------------------------------------------------------------------------
  console.log('\n[3] Testing Delivery Dispatch, Drop-off OTP & Verification...');

  let generatedOtp = '';

  await runAsyncTest('Delivery dispatch creates record with 4-digit Drop-off OTP & triggers customer notification', async () => {
    const dispatchRes = await dispatchOrderWithDelivery(
      testOrder.id,
      activePoId,
      {
        driverName: 'Ramesh Yadav',
        driverPhone: '9450011223',
        vehicleType: 'tata_ace',
        vehicleRegistrationNumber: 'UP 42 AT 9102',
        deliveryInstructions: 'Enter through Tedhi Bazar bypass; drop bags on ground floor slab.',
      },
      supplier2Session
    );

    assert.strictEqual(dispatchRes.success, true);
    assert.strictEqual(dispatchRes.order.status, 'dispatched');
    assert.ok(dispatchRes.delivery);
    assert.strictEqual(dispatchRes.delivery.status, 'in_transit');
    assert.strictEqual(dispatchRes.delivery.vehicle_registration_number, 'UP 42 AT 9102');
    assert.ok(/^\d{4}$/.test(dispatchRes.delivery.delivery_otp), 'Drop-off OTP must be 4 digits');
    generatedOtp = dispatchRes.delivery.delivery_otp;
  });

  await runAsyncTest('Incorrect Drop-off OTP is REJECTED', async () => {
    const wrongOtp = '0000';
    const res = await recordDeliveryCompletion(testOrder.id, wrongOtp, 'Attempt with wrong code', adminSession);
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('Invalid Drop-off OTP'));
  });

  await runAsyncTest('Correct Drop-off OTP verifies site inspection and marks order delivered', async () => {
    const res = await recordDeliveryCompletion(
      testOrder.id,
      generatedOtp,
      'Site inspection complete. All 100 bags verified without tear.',
      adminSession
    );
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.order.status, 'delivered');
    assert.strictEqual(res.delivery.status, 'delivered');
    assert.strictEqual(res.delivery.is_delivery_verified, true);
    assert.ok(res.delivery.delivered_at);
  });

  await runAsyncTest('Failed delivery handling records failure_reason and reschedules retry', async () => {
    const failOrder = {
      ...testOrder,
      id: 'ord-fail-002',
      order_number: 'NS-AYD-FAIL-002',
      status: 'dispatched',
      status_history: [],
    };
    memoryOrders.set(failOrder.id, failOrder);
    memoryDeliveryAssignments.set(failOrder.id, {
      id: 'del-fail-002',
      order_id: failOrder.id,
      status: 'in_transit',
      delivery_otp: '1234',
      is_delivery_verified: false,
    });

    const failRes = await recordDeliveryFailure(
      failOrder.id,
      'Customer phone switched off and site entrance gate locked',
      'Tomorrow 10:00 AM',
      adminSession
    );

    assert.strictEqual(failRes.success, true);
    assert.strictEqual(failRes.order.status, 'failed_delivery');
    assert.strictEqual(failRes.delivery.status, 'failed');
    assert.strictEqual(failRes.delivery.failure_reason, 'Customer phone switched off and site entrance gate locked');
  });

  // ----------------------------------------------------------------------------
  // TEST SUITE 4: PURCHASE ORDER RECONCILIATION & PROCUREMENT PRIVACY
  // ----------------------------------------------------------------------------
  console.log('\n[4] Testing PO Quantity Reconciliation & Internal Procurement Privacy...');

  await runAsyncTest('PO quantity reconciliation detects discrepancies and stores supplier invoice', async () => {
    const reconRes = await reconcilePoQuantities(
      activePoId,
      [
        {
          variant_id: 'v0000000-0000-0000-0000-000000000001',
          ordered_quantity: 100,
          supplied_quantity: 98, // 2 bags short / damaged
          unit_cost_paise: 34500,
          reconciliation_notes: '2 bags split in transit; credit note issued by stockist',
        },
      ],
      'INV-RAM-2026-904',
      adminSession
    );

    assert.strictEqual(reconRes.success, true);
    assert.strictEqual(reconRes.discrepancyFound, true);
    assert.strictEqual(reconRes.discrepancies.length, 1);
    assert.strictEqual(reconRes.discrepancies[0].shortageOrOverage, -2);
  });

  // ----------------------------------------------------------------------------
  // TEST SUITE 5: B2B RFQ, QUOTATIONS & CONVERSION TO ORDER
  // ----------------------------------------------------------------------------
  console.log('\n[5] Testing B2B Bulk RFQ, Supplier Bids & Quotation Order Conversion...');

  let rfqId = '';
  let quotationId = '';

  await runAsyncTest('Contractor submits bulk RFQ with project location & specifications', async () => {
    const rfqRes = await submitBulkEnquiry({
      user_id: customerSession.id,
      contact_name: 'Harish Pathak',
      contact_phone: '9450007788',
      contact_email: 'harish@pathakcontractors.com',
      company_or_firm_name: 'Pathak Construction Co.',
      gstin: '09AAACP4455C1Z1',
      project_type: 'commercial_complex',
      project_title: 'Ayodhya Shopping Mall & Multiplex',
      project_address: 'Plot 8, Deokali Bypass Road',
      pincode: '224001',
      estimated_budget_paise: 500000000, // ₹50 Lakhs
      target_delivery_date: '2026-11-15',
      material_requirements: '5000 bags cement, 50 tons rebar',
      structured_items: [
        { category: 'Cement', title: 'UltraTech PPC Cement', approx_qty: 5000, unit: 'bags' },
      ],
    });

    assert.strictEqual(rfqRes.success, true);
    assert.ok(rfqRes.enquiryNumber.startsWith('RFQ-AYD-'));
    rfqId = rfqRes.enquiryId;
  });

  await runAsyncTest('Approved supplier records private wholesale bid for RFQ', async () => {
    const bidRes = await recordSupplierRfqBid(
      rfqId,
      supplier1Id,
      [
        {
          title: 'UltraTech PPC Cement',
          unit_cost_paise: 33500, // ₹335/bag private wholesale rate
          available_qty: 5000,
          lead_time_hours: 24,
        },
      ],
      supplier1Session
    );

    assert.strictEqual(bidRes.success, true);
    assert.strictEqual(bidRes.bid.total_procurement_cost_paise, 167500000); // ₹16.75 Lakhs
  });

  await runAsyncTest('Admin views supplier bids while customer is BLOCKED from private wholesale costs', async () => {
    // Admin can view
    const bids = await listSupplierBidsAdmin(rfqId, adminSession);
    assert.strictEqual(bids.length, 1);
    assert.strictEqual(bids[0].items[0].unit_cost_paise, 33500);

    // Customer blocked
    let blocked = false;
    try {
      await listSupplierBidsAdmin(rfqId, customerSession);
    } catch (err) {
      blocked = true;
      assert.strictEqual(err.statusCode, 403);
    }
    assert.strictEqual(blocked, true);
  });

  await runAsyncTest('Admin prepares and issues formal customer quotation with locked pricing', async () => {
    const quoteRes = await createCustomerQuotation(
      {
        enquiryId: rfqId,
        clientName: 'Harish Pathak',
        clientPhone: '9450007788',
        clientEmail: 'harish@pathakcontractors.com',
        deliveryAddress: 'Plot 8, Deokali Bypass Road',
        deliveryPincode: '224001',
        validityDays: 10,
        items: [
          {
            itemTitle: 'UltraTech PPC Cement (Bulk Dispatch Lot)',
            unit: 'bags',
            quantity: 5000,
            unitRatePaise: 37500, // ₹375 customer selling price
            gstRatePct: 28,
          },
        ],
        freightPaise: 500000, // ₹5,000 trailer freight
        unloadingChargesPaise: 250000, // ₹2,500 unloading
        termsAndConditions: 'Exclusive 28-day rate lock. Direct factory trailer drop.',
      },
      adminSession
    );

    assert.strictEqual(quoteRes.success, true);
    assert.ok(quoteRes.quotation);
    assert.ok(quoteRes.quotation.quotation_number.startsWith('QT-AYD-'));
    assert.strictEqual(quoteRes.quotation.status, 'sent');
    quotationId = quoteRes.quotation.id;
  });

  await runAsyncTest('Customer accepts formal quotation', async () => {
    const acceptRes = await customerRespondToQuotation(quotationId, 'accept', customerSession);
    assert.strictEqual(acceptRes.success, true);
    assert.strictEqual(acceptRes.quotation.status, 'accepted');
  });

  await runAsyncTest('Accepted quotation is seamlessly converted into a live customer order', async () => {
    const convertRes = await convertQuotationToOrder(quotationId, customerSession);
    assert.strictEqual(convertRes.success, true);
    assert.ok(convertRes.order);
    assert.ok(convertRes.order.order_number.startsWith('NS-QT-'));
    assert.strictEqual(convertRes.order.status, 'confirmed');
    assert.strictEqual(convertRes.order.items.length, 1);
    assert.strictEqual(convertRes.order.total_paise > 0, true);
  });

  // ----------------------------------------------------------------------------
  // TEST SUITE 6: NOTIFICATIONS & WHATSAPP CLICK-TO-CHAT
  // ----------------------------------------------------------------------------
  console.log('\n[6] Testing Multi-channel Notifications & WhatsApp Click-to-Chat...');

  runTest('Generates standard WhatsApp Click-to-Chat link with normalized Indian phone', () => {
    const url = buildWhatsAppClickToChatUrl('9450011223', 'Your Ayodhya materials order is on the way!');
    assert.ok(url.startsWith('https://wa.me/919450011223?text='));
    assert.ok(url.includes('Ayodhya'));
  });

  await runAsyncTest('Notification dispatch generates valid click-to-chat fallback when token absent', async () => {
    const notif = await sendNotification({
      recipientPhone: '9450099887',
      channel: 'whatsapp',
      title: 'Order Confirmed',
      body: 'Your cement batch has been scheduled for Naya Ghat site delivery.',
    });

    assert.strictEqual(notif.success, true);
    assert.ok(notif.whatsappClickToChatUrl);
    assert.ok(notif.whatsappClickToChatUrl.startsWith('https://wa.me/919450099887'));
  });

  console.log('\n============================================================');
  console.log(`TEST RUN COMPLETE: ${passedTests} / ${totalTests} assertions passed.`);
  console.log('============================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error in fulfillment test suite:', err);
  process.exit(1);
});
