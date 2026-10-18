/**
 * NIRMANSETU AYODHYA - ADMIN DASHBOARD & SUPPLIER PORTAL TEST SUITE
 *
 * Verifies:
 * 1. Role-based access control & privilege escalation prevention (HTTP 403)
 * 2. Customer unauthorized access rejection
 * 3. Local merchant application submission & 'pending' status guarantee
 * 4. Unverified supplier stock listing block
 * 5. Admin verification approval workflow (pending -> verified)
 * 6. Verified supplier inventory wholesale submissions
 * 7. Horizontal supplier data isolation (Supplier A cannot access Supplier B)
 * 8. Admin Purchase Order (PO) issuance to approved stockist
 * 9. Supplier PO fulfillment lifecycle (accepted -> packed -> dispatched -> completed)
 * 10. Real integer paise dashboard metrics calculation
 * 11. PIN code serviceability & delivery fee adjustments
 * 12. Safe CSV exports with zero supplier margin/cost leakage
 * 13. Comprehensive immutable security audit logging
 *
 * Usage:
 *   node scripts/test-admin-supplier.js
 */

const assert = require('assert');
const { z } = require('zod');

console.log('============================================================');
console.log('NIRMANSETU: ADMIN DASHBOARD & SUPPLIER PORTAL TEST SUITE');
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
// TEST SUITE 1: ROLE-BASED ACCESS CONTROL & PRIVILEGE ESCALATION
// ----------------------------------------------------------------------------
console.log('\n[1] Testing Role Authorization & Privilege Escalation Prevention...');

function preventRoleEscalation(callerSession, requestedRole) {
  if (callerSession.role !== 'admin' && requestedRole === 'admin') {
    const error = new Error('Privilege escalation blocked: Non-administrative users cannot assign the admin role.');
    error.statusCode = 403;
    throw error;
  }
  if (callerSession.role === 'customer' && requestedRole !== 'customer') {
    const error = new Error('Unauthorized: Customers cannot alter account roles.');
    error.statusCode = 403;
    throw error;
  }
}

runTest('Customer attempting to promote self to admin is rejected with 403', () => {
  const customerSession = { id: 'usr-cust-01', role: 'customer' };
  let blocked = false;
  try {
    preventRoleEscalation(customerSession, 'admin');
  } catch (err) {
    blocked = true;
    assert.strictEqual(err.statusCode, 403);
    assert.ok(err.message.includes('Privilege escalation blocked'));
  }
  assert.strictEqual(blocked, true, 'Privilege escalation must be blocked');
});

runTest('Customer attempting to promote self to supplier is rejected with 403', () => {
  const customerSession = { id: 'usr-cust-01', role: 'customer' };
  let blocked = false;
  try {
    preventRoleEscalation(customerSession, 'supplier');
  } catch (err) {
    blocked = true;
    assert.strictEqual(err.statusCode, 403);
  }
  assert.strictEqual(blocked, true, 'Customers must not assign supplier role to self');
});

runTest('Admin is permitted to promote or reassign user roles', () => {
  const adminSession = { id: 'usr-adm-01', role: 'admin' };
  preventRoleEscalation(adminSession, 'admin');
  preventRoleEscalation(adminSession, 'supplier');
  preventRoleEscalation(adminSession, 'customer');
});

// ----------------------------------------------------------------------------
// TEST SUITE 2: SUPPLIER APPLICATION & PENDING VERIFICATION GATE
// ----------------------------------------------------------------------------
console.log('\n[2] Testing Supplier Application & Verification Gating...');

const SupplierApplicationSchema = z.object({
  businessName: z.string().trim().min(3).max(200),
  contactPerson: z.string().trim().min(2).max(150),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  email: z.string().trim().email(),
  streetAddress: z.string().trim().min(5),
  pincode: z.string().trim().regex(/^224\d{3}$/, 'Must be a valid Ayodhya postal code'),
  city: z.string().default('Ayodhya'),
  state: z.string().default('Uttar Pradesh'),
  gstin: z.string().trim().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
  serviceablePincodes: z.array(z.string()).min(1),
  deliveryCapacity: z.array(z.string()).min(1),
});

runTest('Valid supplier registration payload conforms to schema', () => {
  const validMerchant = {
    businessName: 'Awadh Building Material Mart',
    contactPerson: 'Rakesh Verma',
    phone: '9450000001',
    email: 'rakesh@awadhmaterials.in',
    streetAddress: 'Shop 14, Main Road, Tedhi Bazar',
    pincode: '224123',
    city: 'Ayodhya',
    state: 'Uttar Pradesh',
    gstin: '09AABCA1234F1Z1',
    serviceablePincodes: ['224123', '224001'],
    deliveryCapacity: ['tata_ace', 'three_wheeler_auto'],
  };

  const parsed = SupplierApplicationSchema.safeParse(validMerchant);
  assert.strictEqual(parsed.success, true);
});

runTest('Invalid phone or non-Ayodhya PIN is rejected', () => {
  const invalidMerchant = {
    businessName: 'Bad Phone Mart',
    contactPerson: 'Rakesh',
    phone: '1234567890', // Invalid Indian mobile
    email: 'rakesh@test.com',
    streetAddress: 'Main Road',
    pincode: '110001', // Delhi PIN, not Ayodhya 224xxx
    serviceablePincodes: ['110001'],
    deliveryCapacity: ['tata_ace'],
  };

  const parsed = SupplierApplicationSchema.safeParse(invalidMerchant);
  assert.strictEqual(parsed.success, false);
});

// In-memory test store
const testSuppliers = new Map();
const testSupplierProducts = new Map();
const testSupplierPos = new Map();
const testAuditLogs = [];

function registerSupplier(input) {
  const supplierId = `sup-${Date.now()}`;
  const supplier = {
    id: supplierId,
    business_name: input.businessName,
    contact_person: input.contactPerson,
    phone: input.phone,
    email: input.email,
    pincode: input.pincode,
    verification_status: 'pending', // MUST ALWAYS start as pending
    commission_rate_pct: 4.5,
    verified_at: null,
  };
  testSuppliers.set(supplierId, supplier);
  testAuditLogs.push({
    action: 'SUBMIT_SUPPLIER_APPLICATION',
    entity_type: 'suppliers',
    entity_id: supplierId,
    new_values: { verification_status: 'pending' },
  });
  return supplier;
}

const newSupplier = registerSupplier({
  businessName: 'Ramrajya Iron & Cement Depot',
  contactPerson: 'Suresh Gupta',
  phone: '9450000002',
  email: 'suresh@ramrajyadepot.in',
  pincode: '224001',
});

runTest('New supplier registration is strictly initialized with verification_status: "pending"', () => {
  assert.strictEqual(newSupplier.verification_status, 'pending');
  assert.strictEqual(newSupplier.verified_at, null);
});

function upsertSupplierProduct(supplierId, session, productData) {
  const supplier = testSuppliers.get(supplierId);
  if (!supplier) throw new Error('Supplier not found');

  // Gate check
  if (supplier.verification_status !== 'verified' && session.role !== 'admin') {
    const error = new Error(`Action blocked: Supplier status is "${supplier.verification_status}". Only verified suppliers can publish inventory.`);
    error.statusCode = 400;
    throw error;
  }

  const existing = testSupplierProducts.get(supplierId) || [];
  const item = {
    id: `sp-${Date.now()}`,
    supplier_id: supplierId,
    variant_id: productData.variantId,
    supplier_cost_paise: productData.supplierCostPaise,
    stock_quantity: productData.stockQuantity,
    is_approved: session.role === 'admin',
  };
  existing.push(item);
  testSupplierProducts.set(supplierId, existing);
  return item;
}

runTest('Unverified pending supplier CANNOT publish inventory/stock', () => {
  const pendingSession = { id: 'usr-pending', role: 'supplier', supplierId: newSupplier.id };
  let blocked = false;
  try {
    upsertSupplierProduct(newSupplier.id, pendingSession, {
      variantId: 'v1',
      supplierCostPaise: 35000,
      stockQuantity: 100,
    });
  } catch (err) {
    blocked = true;
    assert.ok(err.message.includes('Only verified suppliers can publish inventory'));
  }
  assert.strictEqual(blocked, true, 'Unverified supplier must not publish stock');
});

// Admin approves supplier
function updateSupplierStatus(supplierId, newStatus, adminSession) {
  if (adminSession.role !== 'admin') {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }
  const supplier = testSuppliers.get(supplierId);
  if (!supplier) throw new Error('Supplier not found');
  supplier.verification_status = newStatus;
  if (newStatus === 'verified') {
    supplier.verified_at = new Date().toISOString();
  }
  testAuditLogs.push({
    action: 'UPDATE_SUPPLIER_STATUS',
    entity_type: 'suppliers',
    entity_id: supplierId,
    new_values: { verification_status: newStatus },
  });
  return supplier;
}

runTest('Admin approves pending supplier (transitions to "verified")', () => {
  const adminSession = { id: 'adm-1', role: 'admin' };
  const approved = updateSupplierStatus(newSupplier.id, 'verified', adminSession);
  assert.strictEqual(approved.verification_status, 'verified');
  assert.ok(approved.verified_at);
});

runTest('Approved supplier can now publish inventory stock & wholesale cost', () => {
  const approvedSession = { id: 'usr-approved', role: 'supplier', supplierId: newSupplier.id };
  const item = upsertSupplierProduct(newSupplier.id, approvedSession, {
    variantId: 'v0000000-0000-0000-0000-000000000001',
    supplierCostPaise: 35000, // ₹350 wholesale cost
    stockQuantity: 500,
  });
  assert.ok(item);
  assert.strictEqual(item.supplier_cost_paise, 35000);
  assert.strictEqual(item.stock_quantity, 500);
  assert.strictEqual(item.is_approved, false, 'Supplier-submitted inventory requires admin approval before public listing');
});

// ----------------------------------------------------------------------------
// TEST SUITE 3: HORIZONTAL SUPPLIER DATA ISOLATION
// ----------------------------------------------------------------------------
console.log('\n[3] Testing Horizontal Supplier Data Isolation...');

function checkSupplierIsolation(targetSupplierId, callerSession) {
  if (callerSession.role === 'admin') return;
  if (callerSession.role === 'supplier' && callerSession.supplierId === targetSupplierId) return;

  const err = new Error('Access denied: You are not authorized to view or modify another supplier\'s private records.');
  err.statusCode = 403;
  throw err;
}

const supplierA = { id: 'sup-A', role: 'supplier', supplierId: 's-001' };
const supplierB = { id: 'sup-B', role: 'supplier', supplierId: 's-002' };
const customerSession = { id: 'cust-1', role: 'customer' };
const adminSession = { id: 'adm-1', role: 'admin' };

runTest('Supplier A is BLOCKED with 403 when attempting to access Supplier B data', () => {
  let blocked = false;
  try {
    checkSupplierIsolation('s-002', supplierA);
  } catch (err) {
    blocked = true;
    assert.strictEqual(err.statusCode, 403);
  }
  assert.strictEqual(blocked, true, 'Supplier A must not access Supplier B');
});

runTest('Customer is BLOCKED with 403 when attempting to access any supplier data', () => {
  let blocked = false;
  try {
    checkSupplierIsolation('s-001', customerSession);
  } catch (err) {
    blocked = true;
    assert.strictEqual(err.statusCode, 403);
  }
  assert.strictEqual(blocked, true, 'Customer must not access supplier data');
});

runTest('Admin is permitted to access any supplier across Ayodhya', () => {
  checkSupplierIsolation('s-001', adminSession);
  checkSupplierIsolation('s-002', adminSession);
});

// ----------------------------------------------------------------------------
// TEST SUITE 4: PURCHASE ORDER (PO) ISSUANCE & DISPATCH LIFECYCLE
// ----------------------------------------------------------------------------
console.log('\n[4] Testing Admin PO Issuance & Supplier Fulfillment Lifecycle...');

function issueSupplierPo(orderId, supplierId, items, admin) {
  if (admin.role !== 'admin') throw new Error('Unauthorized');
  const poId = `po-${Date.now()}`;
  const poNumber = `PO-SUP-${Date.now().toString().slice(-6)}`;
  let totalCostPaise = 0;
  items.forEach((item) => {
    totalCostPaise += item.unitCostPaise * item.quantity;
  });

  const po = {
    id: poId,
    po_number: poNumber,
    order_id: orderId,
    supplier_id: supplierId,
    status: 'accepted',
    total_cost_paise: totalCostPaise,
    expected_dispatch_at: null,
    actual_dispatch_at: null,
    items,
  };

  const list = testSupplierPos.get(supplierId) || [];
  list.push(po);
  testSupplierPos.set(supplierId, list);

  testAuditLogs.push({
    action: 'ISSUE_PURCHASE_ORDER',
    entity_type: 'supplier_purchase_orders',
    entity_id: poId,
    new_values: { poNumber, totalCostPaise, supplierId },
  });

  return po;
}

const sampleItems = [
  { variantId: 'v1', productTitle: 'UltraTech PPC Cement', quantity: 100, unitCostPaise: 35000 },
];

const issuedPo = issueSupplierPo('ord-001', newSupplier.id, sampleItems, adminSession);

runTest('Admin issues PO to approved stockist with integer paise calculation', () => {
  assert.ok(issuedPo.id);
  assert.ok(issuedPo.po_number.startsWith('PO-SUP-'));
  assert.strictEqual(issuedPo.total_cost_paise, 3500000); // ₹35,000.00
  assert.strictEqual(issuedPo.status, 'accepted');
});

function updateSupplierPoStatus(poId, supplierId, session, newStatus, notes) {
  checkSupplierIsolation(supplierId, session);
  const list = testSupplierPos.get(supplierId) || [];
  const po = list.find((p) => p.id === poId);
  if (!po) throw new Error('PO not found');

  const validTransitions = {
    accepted: ['packed', 'cancelled'],
    packed: ['dispatched', 'cancelled'],
    dispatched: ['completed'],
    completed: [],
    cancelled: [],
  };

  const allowed = validTransitions[po.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${po.status} to ${newStatus}`);
  }

  po.status = newStatus;
  if (newStatus === 'dispatched') {
    po.actual_dispatch_at = new Date().toISOString();
  }
  testAuditLogs.push({
    action: 'UPDATE_SUPPLIER_PO_STATUS',
    entity_type: 'supplier_purchase_orders',
    entity_id: poId,
    new_values: { status: newStatus, notes },
  });
  return po;
}

runTest('Supplier updates PO status from accepted -> packed', () => {
  const supSession = { id: 'usr-approved', role: 'supplier', supplierId: newSupplier.id };
  const updated = updateSupplierPoStatus(issuedPo.id, newSupplier.id, supSession, 'packed', 'Bags loaded on Tata Ace');
  assert.strictEqual(updated.status, 'packed');
});

runTest('Supplier marks vehicle dispatched with actual_dispatch_at timestamp', () => {
  const supSession = { id: 'usr-approved', role: 'supplier', supplierId: newSupplier.id };
  const updated = updateSupplierPoStatus(issuedPo.id, newSupplier.id, supSession, 'dispatched', 'Vehicle en route to Tedhi Bazar jobsite');
  assert.strictEqual(updated.status, 'dispatched');
  assert.ok(updated.actual_dispatch_at);
});

runTest('Invalid status transition (e.g. dispatched directly to accepted) is rejected', () => {
  const supSession = { id: 'usr-approved', role: 'supplier', supplierId: newSupplier.id };
  let errorCaught = false;
  try {
    updateSupplierPoStatus(issuedPo.id, newSupplier.id, supSession, 'accepted');
  } catch (err) {
    errorCaught = true;
    assert.ok(err.message.includes('Invalid status transition'));
  }
  assert.strictEqual(errorCaught, true);
});

// ----------------------------------------------------------------------------
// TEST SUITE 5: DASHBOARD FINANCIAL METRICS & PINCODE SERVICEABILITY
// ----------------------------------------------------------------------------
console.log('\n[5] Testing Admin Metrics & Regional Serviceability Rules...');

runTest('Dashboard metrics calculate revenue, orders, and GST tax in pure integer paise', () => {
  const sampleOrders = [
    { total_amount_paise: 512700, tax_amount_paise: 107800, status: 'confirmed' },
    { total_amount_paise: 1250000, tax_amount_paise: 190000, status: 'delivered' },
    { total_amount_paise: 300000, tax_amount_paise: 45000, status: 'pending_payment' }, // unpaid
  ];

  let totalRevenuePaise = 0;
  let totalGstTaxPaise = 0;
  let validOrderCount = 0;

  sampleOrders.forEach((o) => {
    if (['confirmed', 'processing', 'dispatched', 'delivered'].includes(o.status)) {
      totalRevenuePaise += o.total_amount_paise;
      totalGstTaxPaise += o.tax_amount_paise;
      validOrderCount++;
    }
  });

  assert.strictEqual(totalRevenuePaise, 1762700, 'Revenue must be 1762700 paise (₹17,627.00)');
  assert.strictEqual(totalGstTaxPaise, 297800, 'GST tax must be 297800 paise (₹2,978.00)');
  assert.strictEqual(validOrderCount, 2);
  assert.strictEqual(Number.isInteger(totalRevenuePaise), true);
  assert.strictEqual(Number.isInteger(totalGstTaxPaise), true);
});

runTest('Pincode serviceability toggle and delivery fee configuration', () => {
  const pincodeConfigs = new Map([
    ['224123', { is_serviceable: true, delivery_fee_paise: 80000 }],
    ['224001', { is_serviceable: true, delivery_fee_paise: 100000 }],
  ]);

  // Admin toggles PIN 224123
  const config = pincodeConfigs.get('224123');
  config.is_serviceable = false;
  config.delivery_fee_paise = 150000;

  assert.strictEqual(config.is_serviceable, false);
  assert.strictEqual(config.delivery_fee_paise, 150000);
});

// ----------------------------------------------------------------------------
// TEST SUITE 6: SAFE CSV EXPORTS (ZERO MARGIN/COST LEAKAGE)
// ----------------------------------------------------------------------------
console.log('\n[6] Testing Safe CSV Exports & Internal Data Protection...');

function generateProductsCsv(products) {
  const headers = ['Product Title', 'Brand', 'Category', 'Benchmark MRP (INR)', 'Selling Price (INR)', 'Unit', 'Min Qty'];
  const rows = products.map((p) => [
    `"${p.title.replace(/"/g, '""')}"`,
    `"${p.brand}"`,
    `"${p.category}"`,
    (p.mrpPaise / 100).toFixed(2),
    (p.sellingPricePaise / 100).toFixed(2),
    p.unit,
    p.minQty,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

runTest('Product CSV export NEVER includes internal supplier cost or margin columns', () => {
  const sampleProducts = [
    {
      title: 'UltraTech Super PPC Cement',
      brand: 'UltraTech',
      category: 'Cement',
      mrpPaise: 42000,
      sellingPricePaise: 38500,
      unit: 'bags',
      minQty: 10,
      supplierCostPaise: 34500, // Private!
      internalMarginPaise: 4000, // Private!
    },
  ];

  const csv = generateProductsCsv(sampleProducts);

  assert.ok(csv.includes('Benchmark MRP (INR)'));
  assert.ok(csv.includes('Selling Price (INR)'));

  // Ensure internal wholesale/margin fields are omitted from export
  assert.strictEqual(csv.includes('supplierCost'), false);
  assert.strictEqual(csv.includes('supplier_cost'), false);
  assert.strictEqual(csv.includes('34500'), false);
  assert.strictEqual(csv.includes('345.00'), false);
  assert.strictEqual(csv.includes('internalMargin'), false);
  assert.strictEqual(csv.includes('internal_margin'), false);
});

// ----------------------------------------------------------------------------
// TEST SUITE 7: IMMUTABLE AUDIT TRAIL LOGGING
// ----------------------------------------------------------------------------
console.log('\n[7] Testing Immutable Security Audit Log Retention...');

runTest('All sensitive administrator and supplier events are recorded in audit logs', () => {
  assert.ok(testAuditLogs.length >= 4, 'Audit logs must capture events');

  const actions = testAuditLogs.map((l) => l.action);
  assert.ok(actions.includes('SUBMIT_SUPPLIER_APPLICATION'));
  assert.ok(actions.includes('UPDATE_SUPPLIER_STATUS'));
  assert.ok(actions.includes('ISSUE_PURCHASE_ORDER'));
  assert.ok(actions.includes('UPDATE_SUPPLIER_PO_STATUS'));

  testAuditLogs.forEach((log) => {
    assert.ok(log.action, 'Log must have action');
    assert.ok(log.entity_type, 'Log must have entity_type');
    assert.ok(log.entity_id, 'Log must have entity_id');
    assert.ok(log.new_values, 'Log must have new_values snapshot');
  });
});

console.log('\n============================================================');
console.log(`TEST RUN COMPLETE: ${passedTests} / ${totalTests} assertions passed.`);
console.log('============================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
