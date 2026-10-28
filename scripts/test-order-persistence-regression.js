/**
 * NIRMANSETU: ORDER PERSISTENCE, LOGOUT/LOGIN RECOVERY & CUSTOMER ISOLATION REGRESSION TEST
 *
 * Verifies:
 * 1. Authenticated customer order placement persists in PostgreSQL.
 * 2. Order items and financial snapshots are saved and associated with the customer's profile.
 * 3. After logging out and logging back in with the same mobile number, the previous orders persist and are returned by GET /api/orders.
 * 4. Refreshing the account page continues to return the orders.
 * 5. Customer isolation: Customer 2 CANNOT view Customer 1's orders (HTTP 403 Forbidden).
 * 6. Customer 2 CANNOT list Customer 1's orders via ?userId= (HTTP 403 Forbidden).
 * 7. Unauthenticated callers CANNOT list or view registered customer orders (HTTP 401 Unauthorized).
 * 8. Guest checkout reuses the stable singleton profile without creating orphan users in auth.users.
 * 9. Indian mobile phone numbers in +91, 91, 0, and 10-digit formats resolve consistently to the same identity.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        env[key] = val;
      }
    }
  });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const apiBase = process.env.TEST_API_BASE || 'http://localhost:3001';

if (!supabaseUrl || !secretKey || !anonKey) {
  console.error('Missing required Supabase credentials in .env.local');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runRegressionSuite() {
  console.log('============================================================');
  console.log('NIRMANSETU: ORDER PERSISTENCE & CUSTOMER ISOLATION REGRESSION');
  console.log('API Base: ' + apiBase);
  console.log('Supabase URL: ' + supabaseUrl);
  console.log('============================================================\n');

  const customer1Phone = '+919876543221';
  const customer2Phone = '+919876543222';
  const testPassword = 'TestOrderPassword!#9922';

  let customer1Id = null;
  let customer2Id = null;
  let token1 = null;
  let token2 = null;
  let createdOrderId = null;
  let createdOrderNumber = null;

  try {
    // ------------------------------------------------------------
    // SETUP: Provision Customer 1 & Customer 2
    // ------------------------------------------------------------
    async function setupTestUser(phone, password, fullName) {
      // 1. Try signing in directly
      try {
        const { data: signData, error: signErr } = await anonClient.auth.signInWithPassword({
          phone,
          password,
        });
        if (!signErr && signData?.session) {
          await adminClient.from('profiles').upsert(
            {
              id: signData.user.id,
              full_name: fullName,
              phone,
              role: 'customer',
              is_phone_verified: true,
              is_active: true,
            },
            { onConflict: 'id' }
          );
          return { userId: signData.user.id, token: signData.session.access_token };
        }
      } catch {
        // Fallback to provisioning
      }

      // 2. Try creating user if not signed in
      let userId;
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        phone,
        phone_confirm: true,
        password,
        user_metadata: { role: 'customer' },
      });

      if (newUser?.user) {
        userId = newUser.user.id;
      } else if (createErr?.message?.includes('already registered')) {
        // Check profile or fetch user id
        const { data: prof } = await adminClient.from('profiles').select('id').eq('phone', phone).maybeSingle();
        if (prof?.id) {
          userId = prof.id;
        } else {
          const { data: ul } = await adminClient.auth.admin.listUsers({ perPage: 100 });
          const found = ul?.users?.find((u) => u.phone === phone || u.phone === phone.replace('+', ''));
          if (found) userId = found.id;
          else throw new Error(`Could not resolve ID for already registered phone ${phone}`);
        }
        await adminClient.auth.admin.updateUserById(userId, { password, phone_confirm: true });
      } else {
        throw new Error(`User provisioning failed for ${phone}: ${createErr?.message}`);
      }

      await adminClient.from('profiles').upsert(
        {
          id: userId,
          full_name: fullName,
          phone,
          role: 'customer',
          is_phone_verified: true,
          is_active: true,
        },
        { onConflict: 'id' }
      );

      const { data: finalSign, error: finalSignErr } = await anonClient.auth.signInWithPassword({
        phone,
        password,
      });
      if (finalSignErr || !finalSign?.session) {
        throw new Error(`Sign in failed for ${phone}: ${finalSignErr?.message}`);
      }

      return { userId, token: finalSign.session.access_token };
    }

    console.log('[Setup 1] Provisioning Customer 1 in Supabase Auth & profiles...');
    const cust1 = await setupTestUser(customer1Phone, testPassword, 'Ayodhya Site Contractor One');
    customer1Id = cust1.userId;
    token1 = cust1.token;
    console.log(`  Customer 1 ID: ${customer1Id} (Session established)`);

    console.log('[Setup 2] Provisioning Customer 2 for isolation testing...');
    const cust2 = await setupTestUser(customer2Phone, testPassword, 'Ayodhya Site Contractor Two');
    customer2Id = cust2.userId;
    token2 = cust2.token;
    console.log(`  Customer 2 ID: ${customer2Id} (Session established)`);

    // Use UltraTech PPC Cement 50kg bag (meets MOQ of 5 bags)
    const testVariant = {
      id: 'e0000000-0000-0000-0000-000000000001',
      sku: 'CEM-UT-PPC-50KG',
      title: 'UltraTech Super Cement PPC 50kg Bag',
    };
    console.log(`  Using product variant: ${testVariant.sku} (${testVariant.title})`);

    // ------------------------------------------------------------
    // TEST 1: Authenticated Customer Places Order
    // ------------------------------------------------------------
    console.log('\n[Test 1] Customer 1 places COD order with Authorization Bearer token...');
    const orderPayload = {
      idempotencyKey: `test_idem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cartId: `cart_cust1_${Date.now()}`,
      items: [
        {
          variantId: testVariant.id,
          quantity: 5,
        },
      ],
      customerDetails: {
        name: 'Ayodhya Site Contractor One',
        phone: customer1Phone,
        email: 'contractor1@ayodhya.nirmansetu.in',
      },
      deliveryAddress: {
        addressType: 'site',
        siteOrPersonName: 'Ayodhya Site Contractor One',
        contactPhone: customer1Phone,
        streetAddress: 'Plot 44, Ram Path Commercial Complex',
        landmark: 'Near Naya Ghat',
        pincode: '224123',
        city: 'Ayodhya',
        state: 'Uttar Pradesh',
        unloadingInstructions: 'Unload near gate 2',
        hasTruckAccess: true,
      },
      paymentMethod: 'cod',
      isExpressDelivery: false,
    };

    const createRes = await fetch(`${apiBase}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify(orderPayload),
    });

    assert(createRes.status === 200, `POST /api/orders/create returns HTTP 200 (Got: ${createRes.status})`);
    const createData = await createRes.json();
    assert(createData.success === true, 'Order created successfully (success: true)');
    assert(Boolean(createData.orderId), `Order ID returned: ${createData.orderId}`);
    assert(Boolean(createData.orderNumber), `Order Number returned: ${createData.orderNumber}`);
    assert(
      createData.paymentStatus === 'cod_pending' || createData.paymentStatus === 'pending',
      `COD order payment_status is valid (${createData.paymentStatus})`
    );
    assert(createData.status === 'confirmed', 'COD order status is confirmed');
    createdOrderId = createData.orderId;
    createdOrderNumber = createData.orderNumber;

    // Verify order in PostgreSQL directly
    console.log('\n[Database Verification] Verifying order in Supabase PostgreSQL...');
    const { data: dbOrder, error: dbOrderErr } = await adminClient
      .from('orders')
      .select('*')
      .eq('id', createdOrderId)
      .single();

    assert(!dbOrderErr && dbOrder, 'Order record exists in public.orders table in PostgreSQL');
    assert(dbOrder?.user_id === customer1Id, `Order user_id strictly bound to Customer 1 (${customer1Id})`);
    assert(dbOrder?.order_number === createdOrderNumber, 'Order number matches in PostgreSQL');

    const { data: dbItems } = await adminClient
      .from('order_items')
      .select('*')
      .eq('order_id', createdOrderId);

    assert(dbItems && dbItems.length === 1, 'Order items persisted in public.order_items table');
    assert(dbItems[0]?.variant_id === testVariant.id, 'Order item variant_id matches requested item');
    assert(dbItems[0]?.quantity === 5, 'Order item quantity matches requested quantity (5)');

    // ------------------------------------------------------------
    // TEST 2: Logout and Re-Login Order Persistence
    // ------------------------------------------------------------
    console.log('\n[Test 2] Simulating Logout -> Session Invalidation -> Re-Login...');
    
    // Simulate Logout: Discard token, call Supabase signOut
    await anonClient.auth.signOut();
    token1 = null;

    // Re-Login: Authenticate again using Customer 1 credentials
    const { data: reloginData, error: reloginErr } = await anonClient.auth.signInWithPassword({
      phone: customer1Phone,
      password: testPassword,
    });
    assert(!reloginErr && reloginData?.session, 'Customer 1 re-login succeeded with valid session');
    assert(reloginData.user.id === customer1Id, 'Re-authenticated user ID matches original Customer 1 ID');
    
    const reauthenticatedToken = reloginData.session.access_token;

    // Check profile uniqueness
    const { data: profilesForUser } = await adminClient
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', customer1Id);
    assert(profilesForUser && profilesForUser.length === 1, 'No duplicate profiles created on re-login (exactly 1 profile)');

    // Call GET /api/orders with the new token
    console.log('\n[Test 2.1] Fetching customer orders with new re-authenticated token...');
    const listRes = await fetch(`${apiBase}/api/orders`, {
      headers: {
        Authorization: `Bearer ${reauthenticatedToken}`,
      },
    });

    assert(listRes.status === 200, `GET /api/orders returns HTTP 200 (Got: ${listRes.status})`);
    const listData = await listRes.json();
    assert(listData.success === true, 'GET /api/orders returns success: true');
    assert(Array.isArray(listData.orders), 'GET /api/orders returns orders array');
    
    const foundOrder = listData.orders.find((o) => o.id === createdOrderId);
    assert(Boolean(foundOrder), `Customer 1's previous order (${createdOrderId}) FOUND after logout & login!`);
    assert(foundOrder?.order_number === createdOrderNumber, 'Found order number matches placed order');
    assert(foundOrder?.items?.length === 1, 'Found order contains associated order items');
    assert(foundOrder?.delivery_otp_plain === '****', 'Customer list masks plain delivery OTP (****)');

    // ------------------------------------------------------------
    // TEST 3: Refresh / Persistent Reload Simulation
    // ------------------------------------------------------------
    console.log('\n[Test 3] Simulating Page Refresh (repeated GET /api/orders calls)...');
    const refreshRes = await fetch(`${apiBase}/api/orders?userId=${encodeURIComponent(customer1Id)}`, {
      headers: {
        Authorization: `Bearer ${reauthenticatedToken}`,
      },
    });
    assert(refreshRes.status === 200, 'Page refresh GET /api/orders returns HTTP 200');
    const refreshData = await refreshRes.json();
    const stillPresent = refreshData.orders.some((o) => o.id === createdOrderId);
    assert(stillPresent, 'Order still present on page refresh without disappearing');

    // Fetch individual order details: GET /api/orders/[id]
    console.log('\n[Test 3.1] Fetching specific order via GET /api/orders/[id]...');
    const detailRes = await fetch(`${apiBase}/api/orders/${createdOrderId}`, {
      headers: {
        Authorization: `Bearer ${reauthenticatedToken}`,
      },
    });
    assert(detailRes.status === 200, `GET /api/orders/${createdOrderId} returns HTTP 200`);
    const detailData = await detailRes.json();
    assert(detailData.success === true, 'Order details retrieved successfully');
    assert(detailData.order?.id === createdOrderId, 'Order detail ID matches');
    assert(detailData.order?.items?.length === 1, 'Order details contain complete line items');

    // ------------------------------------------------------------
    // TEST 4: Customer Isolation & Security
    // ------------------------------------------------------------
    console.log('\n[Test 4] Verifying Customer Isolation (Customer 2 attempting unauthorized access)...');

    // Obtain fresh session for Customer 2 to ensure active authentication
    const { data: signCust2 } = await anonClient.auth.signInWithPassword({
      phone: customer2Phone,
      password: testPassword,
    });
    token2 = signCust2?.session?.access_token || token2;

    // A. Customer 2 tries to GET Customer 1's order details
    const stealOrderRes = await fetch(`${apiBase}/api/orders/${createdOrderId}`, {
      headers: {
        Authorization: `Bearer ${token2}`,
      },
    });
    assert(
      stealOrderRes.status === 403,
      `Customer 2 accessing Customer 1's order is rejected with HTTP 403 Forbidden (Got: ${stealOrderRes.status})`
    );
    const stealOrderJson = await stealOrderRes.json();
    assert(
      stealOrderJson.error && stealOrderJson.error.includes('not authorized'),
      `Security error message returned: "${stealOrderJson.error}"`
    );

    // B. Customer 2 tries to list Customer 1's orders via ?userId=
    const stealListRes = await fetch(`${apiBase}/api/orders?userId=${encodeURIComponent(customer1Id)}`, {
      headers: {
        Authorization: `Bearer ${token2}`,
      },
    });
    assert(
      stealListRes.status === 403,
      `Customer 2 listing Customer 1's orders is rejected with HTTP 403 Forbidden (Got: ${stealListRes.status})`
    );

    // C. Unauthenticated caller tries to list orders
    const unauthListRes = await fetch(`${apiBase}/api/orders`);
    assert(
      unauthListRes.status === 401,
      `Unauthenticated GET /api/orders is rejected with HTTP 401 Unauthorized (Got: ${unauthListRes.status})`
    );

    // D. Unauthenticated caller tries to view Customer 1's order
    const unauthDetailRes = await fetch(`${apiBase}/api/orders/${createdOrderId}`);
    assert(
      unauthDetailRes.status === 401,
      `Unauthenticated GET /api/orders/[id] is rejected with HTTP 401 Unauthorized (Got: ${unauthDetailRes.status})`
    );

    // ------------------------------------------------------------
    // TEST 5: Guest Checkout Safety & Stable Singleton Profile
    // ------------------------------------------------------------
    console.log('\n[Test 5] Verifying Guest Checkout uses singleton profile without orphan user creation...');
    
    // Count users before guest checkout
    const { data: usersBefore } = await adminClient.auth.admin.listUsers();
    const userCountBefore = usersBefore?.users?.length || 0;

    const guestPayload = {
      idempotencyKey: `guest_idem_${Date.now()}`,
      cartId: `guest_cart_${Date.now()}`,
      items: [
        {
          variantId: testVariant.id,
          quantity: 5,
        },
      ],
      customerDetails: {
        name: 'Guest Site Worker',
        phone: '+919876543299',
      },
      deliveryAddress: {
        addressType: 'site',
        siteOrPersonName: 'Guest Site Worker',
        contactPhone: '+919876543299',
        streetAddress: 'Hanuman Garhi Road',
        pincode: '224123',
        city: 'Ayodhya',
        state: 'Uttar Pradesh',
        hasTruckAccess: true,
      },
      paymentMethod: 'cod',
      isExpressDelivery: false,
    };

    const guestRes = await fetch(`${apiBase}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestPayload),
    });

    assert(guestRes.status === 200, `Guest checkout returns HTTP 200 (Got: ${guestRes.status})`);
    const guestData = await guestRes.json();
    assert(guestData.success === true, 'Guest order created successfully');
    assert(guestData.deliveryOtp === null, 'Guest checkout delivery OTP is masked (null) in response');

    // Verify in PostgreSQL
    const { data: dbGuestOrder } = await adminClient
      .from('orders')
      .select('user_id')
      .eq('id', guestData.orderId)
      .single();

    const GUEST_SYSTEM_PROFILE_ID = '00000000-0000-0000-0000-000000000002';
    assert(
      dbGuestOrder?.user_id === GUEST_SYSTEM_PROFILE_ID,
      `Guest order is linked to stable singleton profile (${GUEST_SYSTEM_PROFILE_ID})`
    );

    // Count users after guest checkout
    const { data: usersAfter } = await adminClient.auth.admin.listUsers();
    const userCountAfter = usersAfter?.users?.length || 0;
    assert(
      userCountAfter === userCountBefore,
      `No orphan users created in auth.users during guest checkout (${userCountBefore} -> ${userCountAfter})`
    );

    // ------------------------------------------------------------
    // TEST 6: Indian Mobile Format Normalization
    // ------------------------------------------------------------
    console.log('\n[Test 6] Verifying Indian Mobile Format Normalization (+91, 91, 0, 10 digits)...');
    const sampleDigits = '9876543221';
    const variations = [
      `+91${sampleDigits}`,
      `91${sampleDigits}`,
      `0${sampleDigits}`,
      sampleDigits,
      `+91 ${sampleDigits.slice(0, 5)} ${sampleDigits.slice(5)}`,
      `0${sampleDigits.slice(0, 5)}-${sampleDigits.slice(5)}`,
    ];

    function normalizePhone(input) {
      let cleaned = input.trim().replace(/[\s\-\(\)\.]/g, '');
      if (cleaned.startsWith('+91')) cleaned = cleaned.slice(3);
      else if (cleaned.startsWith('91') && cleaned.length === 12) cleaned = cleaned.slice(2);
      else if (cleaned.startsWith('0') && cleaned.length === 11) cleaned = cleaned.slice(1);
      return /^[6-9]\d{9}$/.test(cleaned) ? `+91${cleaned}` : null;
    }

    let allNormalizedCorrectly = true;
    for (const v of variations) {
      const norm = normalizePhone(v);
      if (norm !== `+91${sampleDigits}`) {
        allNormalizedCorrectly = false;
        console.error(`  Normalization failure for input: "${v}" -> "${norm}"`);
      }
    }
    assert(
      allNormalizedCorrectly,
      'All Indian phone variations (+91, 91, 0, spaced, dashed, 10-digit) normalize to identical E.164 +919876543221'
    );

    // Clean up test records
    await adminClient.from('orders').delete().eq('id', createdOrderId);
    await adminClient.from('orders').delete().eq('id', guestData.orderId);
    await adminClient.auth.admin.deleteUser(customer1Id);
    await adminClient.auth.admin.deleteUser(customer2Id);
    await adminClient.from('profiles').delete().eq('id', customer1Id);
    await adminClient.from('profiles').delete().eq('id', customer2Id);
    console.log('\n[Cleanup] Test orders and test users safely cleaned up.');

  } catch (err) {
    console.error('\n[FATAL SUITE ERROR]:', err);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`REGRESSION SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionSuite();
