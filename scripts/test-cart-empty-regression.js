/**
 * NIRMANSETU: CART EMPTY & CHECKOUT RESOLUTION REGRESSION TEST SUITE
 *
 * Verifies the fix for:
 * "Your cart is empty. Please add building materials before checking out."
 *
 * Requirements:
 * 1. Electrical product COD order (v-havells-0.75sqmm, qty 1) -> successfully created with 18% GST and authoritative pricing.
 * 2. Quantity changed from 1 to 2 (v-havells-0.75sqmm, qty 2) -> saved order_items.quantity = 2 and recalculated server-side.
 * 3. Multiple products (UltraTech Cement 5 bags + Havells Wire 1 coil) -> both lines saved with correct HSN, unit price, and tax.
 * 4. Genuinely empty cart (items: []) -> rejected with HTTP 400 and exact empty cart error message.
 * 5. Invalid variant ID (items: [{ variantId: "invalid-sku-999", quantity: 1 }]) -> rejected with HTTP 400 and specific catalog error.
 * 6. Database record verification via Supabase admin client and safe cleanup.
 *
 * Usage:
 *   node --env-file=.env.local scripts/test-cart-empty-regression.js
 */

const assert = require('assert');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = process.env.TEST_APP_URL || 'http://localhost:3001';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('================================================================');
console.log('NIRMANSETU: CART EMPTY & CHECKOUT REGRESSION SUITE');
console.log(`Target API: ${BASE_URL}`);
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;
const cleanupOrderIds = [];
const cleanupUserIds = [];

function pass(msg) {
  totalTests++;
  passedTests++;
  console.log(`  [PASS] ${msg}`);
}

function fail(msg, err) {
  totalTests++;
  console.error(`  [FAIL] ${msg}`);
  if (err) console.error(`         Error: ${err.message || err}`);
}

async function runRegressionSuite() {
  const commonDeliveryAddress = {
    receiverName: 'Ayodhya Site Incharge',
    receiverPhone: '9876543210',
    streetAddress: 'Ram Janmabhoomi Path, Near Gate 3',
    city: 'Ayodhya',
    state: 'Uttar Pradesh',
    pincode: '224123',
    landmark: 'Near Hanuman Garhi Road',
  };

  const commonCustomerDetails = {
    name: 'Ramesh Electrical Contractor',
    phone: '9876543210',
    email: 'ramesh.contractor@nirmansetu-test.in',
    companyName: 'Ramesh Electrical Works',
    gstin: '09AAACH7409R1ZZ',
  };

  // --------------------------------------------------------------------------
  // TEST 1: Electrical product COD order (v-havells-0.75sqmm, qty 1)
  // --------------------------------------------------------------------------
  console.log('[Test 1] Testing single electrical product checkout (v-havells-0.75sqmm, qty 1)...');
  try {
    const payload = {
      cartId: `cart-reg-${Date.now()}-1`,
      customerDetails: commonCustomerDetails,
      deliveryAddress: commonDeliveryAddress,
      paymentMethod: 'cod',
      items: [
        {
          variantId: 'v-havells-0.75sqmm',
          quantity: 1,
        },
      ],
      idempotencyKey: `idem-reg-1-${Date.now()}`,
    };

    const res = await fetch(`${BASE_URL}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}: ${JSON.stringify(body)}`);
    assert.strictEqual(body.success, true, 'Order creation should succeed');
    assert.ok(body.orderId, 'Order ID must be present');
    assert.ok(body.orderNumber, 'Order number must be present');

    // Expected integer-paise math:
    // Subtotal: 118000 paise (₹1,180.00)
    // Tax (18%): 21240 paise (₹212.40)
    // Freight: 19900 paise (₹199.00)
    // Total: 159140 paise (₹1,591.40)
    assert.strictEqual(body.totalPaise, 159140, `Expected total 159140 paise, got ${body.totalPaise}`);

    cleanupOrderIds.push(body.orderId);

    // Verify database record in public.orders
    const { data: dbOrder, error: dbOrderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', body.orderId)
      .single();

    assert.ifError(dbOrderErr);
    assert.strictEqual(dbOrder.subtotal_paise, 118000, `DB subtotal mismatch: ${dbOrder.subtotal_paise}`);
    assert.strictEqual(dbOrder.tax_paise, 21240, `DB tax mismatch: ${dbOrder.tax_paise}`);
    assert.strictEqual(dbOrder.delivery_fee_paise, 19900, `DB freight mismatch: ${dbOrder.delivery_fee_paise}`);
    assert.strictEqual(dbOrder.total_paise, 159140, `DB total mismatch: ${dbOrder.total_paise}`);
    if (dbOrder.user_id) cleanupUserIds.push(dbOrder.user_id);

    // Verify database record in public.order_items
    const { data: dbItems, error: dbItemsErr } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', body.orderId);

    assert.ifError(dbItemsErr);
    assert.strictEqual(dbItems.length, 1, 'Expected 1 saved order_item');
    assert.strictEqual(dbItems[0].quantity, 1, 'Item quantity should be 1');
    assert.strictEqual(dbItems[0].unit_price_paise, 118000, 'Unit price should be 118000 paise');
    assert.strictEqual(dbItems[0].hsn_code_snapshot, '854449', 'HSN should be 854449 for electrical wire');
    assert.strictEqual(dbItems[0].gst_rate_pct, 18, 'GST rate should be 18%');
    assert.strictEqual(dbItems[0].variant_id, 'e0000000-0000-0000-0000-000000000006', 'Variant ID should map to valid UUID');

    pass('Single electrical product (v-havells-0.75sqmm, qty 1) successfully placed with 18% GST and verified in DB.');
  } catch (err) {
    fail('Single electrical product checkout failed', err);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Quantity changed from 1 to 2 (v-havells-0.75sqmm, qty 2)
  // --------------------------------------------------------------------------
  console.log('[Test 2] Testing quantity change from 1 to 2 (v-havells-0.75sqmm, qty 2)...');
  try {
    const payload = {
      cartId: `cart-reg-${Date.now()}-2`,
      customerDetails: commonCustomerDetails,
      deliveryAddress: commonDeliveryAddress,
      paymentMethod: 'cod',
      items: [
        {
          variantId: 'v-havells-0.75sqmm',
          quantity: 2,
        },
      ],
      idempotencyKey: `idem-reg-2-${Date.now()}`,
    };

    const res = await fetch(`${BASE_URL}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}: ${JSON.stringify(body)}`);
    assert.strictEqual(body.success, true, 'Order creation should succeed');

    // Expected integer-paise math:
    // Subtotal: 2 * 118000 = 236000 paise (₹2,360.00)
    // Tax (18%): 42480 paise (₹424.80)
    // Freight: 19900 paise (₹199.00)
    // Total: 298380 paise (₹2,983.80)
    assert.strictEqual(body.totalPaise, 298380, `Expected total 298380 paise, got ${body.totalPaise}`);

    cleanupOrderIds.push(body.orderId);

    // Verify DB
    const { data: dbItems, error: dbItemsErr } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', body.orderId);

    assert.ifError(dbItemsErr);
    assert.strictEqual(dbItems.length, 1, 'Expected 1 saved order_item');
    assert.strictEqual(dbItems[0].quantity, 2, 'Item quantity should be 2');
    assert.strictEqual(dbItems[0].total_paise, 236000, 'Total line paise should be 236000');
    assert.strictEqual(dbItems[0].tax_paise, 42480, 'Tax paise should be 42480');

    pass('Updated quantity (qty: 2) recalculated server-side and saved accurately in DB.');
  } catch (err) {
    fail('Quantity change test failed', err);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Multiple products (UltraTech Cement 5 bags + Havells Wire 1 coil)
  // --------------------------------------------------------------------------
  console.log('[Test 3] Testing multiple products checkout (UltraTech Cement + Havells Wire)...');
  try {
    const payload = {
      cartId: `cart-reg-${Date.now()}-3`,
      customerDetails: commonCustomerDetails,
      deliveryAddress: commonDeliveryAddress,
      paymentMethod: 'cod',
      items: [
        {
          variantId: 'e0000000-0000-0000-0000-000000000001', // UltraTech PPC Cement (50kg bag)
          quantity: 5,
        },
        {
          variantId: 'v-havells-0.75sqmm', // Havells 0.75 sq mm wire
          quantity: 1,
        },
      ],
      idempotencyKey: `idem-reg-3-${Date.now()}`,
    };

    const res = await fetch(`${BASE_URL}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}: ${JSON.stringify(body)}`);
    assert.strictEqual(body.success, true, 'Order creation should succeed');

    // Expected integer-paise math:
    // Cement: 5 * 38500 = 192500 paise, Tax (18%) = 34650 paise
    // Wire: 1 * 118000 = 118000 paise, Tax (18%) = 21240 paise
    // Subtotal: 192500 + 118000 = 310500 paise (₹3,105.00)
    // Tax: 34650 + 21240 = 55890 paise (₹558.90)
    // Freight: 19900 paise (₹199.00)
    // Total: 386290 paise (₹3,862.90)
    assert.strictEqual(body.subtotalPaise, 310500, `Expected subtotal 310500, got ${body.subtotalPaise}`);
    assert.strictEqual(body.taxPaise, 55890, `Expected tax 55890, got ${body.taxPaise}`);
    assert.strictEqual(body.totalPaise, 386290, `Expected total 386290, got ${body.totalPaise}`);

    cleanupOrderIds.push(body.orderId);

    // Verify DB items
    const { data: dbItems, error: dbItemsErr } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', body.orderId)
      .order('unit_price_paise', { ascending: true });

    assert.ifError(dbItemsErr);
    assert.strictEqual(dbItems.length, 2, 'Expected 2 saved order_items');

    // Item 1: Cement
    const cementItem = dbItems.find((i) => i.hsn_code_snapshot === '252329');
    assert.ok(cementItem, 'Cement order item must be present');
    assert.strictEqual(cementItem.quantity, 5, 'Cement quantity must be 5');
    assert.strictEqual(cementItem.unit_price_paise, 38500, 'Cement unit price must be 38500 paise');
    assert.strictEqual(cementItem.tax_paise, 34650, 'Cement tax must be 34650 paise');

    // Item 2: Wire
    const wireItem = dbItems.find((i) => i.hsn_code_snapshot === '854449');
    assert.ok(wireItem, 'Wire order item must be present');
    assert.strictEqual(wireItem.quantity, 1, 'Wire quantity must be 1');
    assert.strictEqual(wireItem.unit_price_paise, 118000, 'Wire unit price must be 118000 paise');
    assert.strictEqual(wireItem.tax_paise, 21240, 'Wire tax must be 21240 paise');

    pass('Multiple products (UltraTech cement 5 bags + Havells wire 1 coil) saved with authoritative pricing & HSN.');
  } catch (err) {
    fail('Multiple products checkout failed', err);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Genuinely empty cart (items: [])
  // --------------------------------------------------------------------------
  console.log('[Test 4] Testing genuinely empty cart submission (items: [])...');
  try {
    const payload = {
      cartId: `cart-reg-empty-${Date.now()}`,
      customerDetails: commonCustomerDetails,
      deliveryAddress: commonDeliveryAddress,
      paymentMethod: 'cod',
      items: [],
      idempotencyKey: `idem-reg-empty-${Date.now()}`,
    };

    const res = await fetch(`${BASE_URL}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 400, `Expected 400 Bad Request, got ${res.status}`);
    assert.strictEqual(body.success, false, 'Expected success: false');
    assert.strictEqual(
      body.error,
      'Your cart is empty. Please add building materials before checking out.',
      `Expected empty cart message, got: ${body.error}`
    );

    pass('Genuinely empty cart rejected with HTTP 400 and exact empty cart error message.');
  } catch (err) {
    fail('Empty cart rejection test failed', err);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Invalid variant ID (items: [{ variantId: "invalid-sku-999", quantity: 1 }])
  // --------------------------------------------------------------------------
  console.log('[Test 5] Testing invalid variant ID submission...');
  try {
    const payload = {
      cartId: `cart-reg-invalid-${Date.now()}`,
      customerDetails: commonCustomerDetails,
      deliveryAddress: commonDeliveryAddress,
      paymentMethod: 'cod',
      items: [
        {
          variantId: 'invalid-sku-999',
          quantity: 1,
        },
      ],
      idempotencyKey: `idem-reg-invalid-${Date.now()}`,
    };

    const res = await fetch(`${BASE_URL}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 400, `Expected 400 Bad Request, got ${res.status}`);
    assert.strictEqual(body.success, false, 'Expected success: false');
    assert.strictEqual(
      body.error,
      'Item variant "invalid-sku-999" is no longer available in catalog.',
      `Expected specific catalog error, got: ${body.error}`
    );

    pass('Invalid variant ID safely rejected with specific catalog error instead of empty cart message.');
  } catch (err) {
    fail('Invalid variant rejection test failed', err);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Cleanup & Database State Verification
  // --------------------------------------------------------------------------
  console.log('\n[Test 6] Cleaning up test records from database...');
  try {
    for (const orderId of cleanupOrderIds) {
      await supabase.from('order_status_history').delete().eq('order_id', orderId);
      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('orders').delete().eq('id', orderId);
    }
    for (const userId of cleanupUserIds) {
      await supabase.from('profiles').delete().eq('id', userId);
      await supabase.auth.admin.deleteUser(userId);
    }
    pass(`Cleaned up ${cleanupOrderIds.length} test order(s) and associated records.`);
  } catch (cleanupErr) {
    console.warn('Warning during cleanup:', cleanupErr.message);
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`REGRESSION SUITE COMPLETED: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests < totalTests) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});
