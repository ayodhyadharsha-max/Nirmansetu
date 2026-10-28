/**
 * NIRMANSETU: COMPREHENSIVE END-TO-END REGISTRATION & AUTHENTICATION AUDIT
 *
 * Executes both Positive and Negative E2E flows against the live Next.js API server
 * and the hosted Supabase instance.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
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

async function runAudit() {
  console.log('============================================================');
  console.log('NIRMANSETU: POSITIVE & NEGATIVE REGISTRATION E2E AUDIT');
  console.log('Target API: ' + apiBase);
  console.log('Hosted Supabase: ' + supabaseUrl);
  console.log('============================================================\n');

  const testPhone = '+919839999966';
  const testPassword = 'TestAuthPassword9988!#';
  let createdUserId = null;
  let sessionToken = null;

  try {
    // ------------------------------------------------------------
    // SETUP: Clean up previous test users and provision a dedicated test user
    // ------------------------------------------------------------
    console.log('[Setup] Preparing dedicated test account in Supabase Auth...');
    const { data: userList } = await adminClient.auth.admin.listUsers();
    if (userList?.users) {
      for (const u of userList.users) {
        if (u.phone === testPhone || u.phone === testPhone.replace('+', '')) {
          await adminClient.from('profiles').delete().eq('id', u.id);
          await adminClient.auth.admin.deleteUser(u.id);
        }
      }
    }

    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      phone: testPhone,
      phone_confirm: true,
      password: testPassword,
      user_metadata: { role: 'customer' },
    });
    if (createErr || !newUser.user) {
      throw new Error('Failed to create test user: ' + createErr?.message);
    }
    createdUserId = newUser.user.id;
    console.log(`  Dedicated Test User ID: ${createdUserId} (Phone: ${newUser.user.phone})`);

    // ------------------------------------------------------------
    // POSITIVE TEST 1: Obtain a real session from client authentication
    // ------------------------------------------------------------
    console.log('\n[Positive 1] Authenticating customer to obtain valid session...');
    const { data: signData, error: signErr } = await anonClient.auth.signInWithPassword({
      phone: testPhone,
      password: testPassword,
    });
    assert(!signErr && signData?.session, 'Client successfully signed in and obtained session');
    assert(Boolean(signData?.session?.access_token), 'Session contains valid access_token string');
    assert(signData?.user?.id === createdUserId, `Session user ID matches created user: ${createdUserId}`);
    assert(signData?.session?.token_type?.toLowerCase() === 'bearer', 'Token type is standard Bearer');
    sessionToken = signData.session.access_token;

    // ------------------------------------------------------------
    // POSITIVE TEST 2: Submit customer profile to Next.js POST /api/auth/profile
    // ------------------------------------------------------------
    console.log('\n[Positive 2] Submitting customer registration profile with Bearer token...');
    const profilePayload = {
      userId: createdUserId,
      fullName: 'Shri Ram Builders Ayodhya',
      email: 'builder.ayodhya@nirmansetu.in',
      businessName: 'Shri Ram Constructions Pvt Ltd',
      gstin: '09AAACS1429B1ZB',
    };

    const postRes = await fetch(`${apiBase}/api/auth/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(profilePayload),
    });

    assert(postRes.status === 200, `POST /api/auth/profile returns HTTP 200 (Got: ${postRes.status})`);
    const postJson = await postRes.json();
    assert(postJson.success === true, 'POST /api/auth/profile returns success: true');
    assert(postJson.profile?.full_name === 'Shri Ram Builders Ayodhya', 'Profile full_name matches submitted name');
    assert(postJson.profile?.business_name === 'Shri Ram Constructions Pvt Ltd', 'Profile business_name matches');
    assert(postJson.profile?.gstin === '09AAACS1429B1ZB', 'Profile GSTIN matches');
    assert(postJson.profile?.id === createdUserId, 'Profile owner ID strictly bound to authenticated user ID');

    // ------------------------------------------------------------
    // POSITIVE TEST 3: Verify profile was saved directly in Supabase database
    // ------------------------------------------------------------
    console.log('\n[Positive 3] Direct Supabase Database Verification...');
    const { data: dbProfile, error: dbErr } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', createdUserId)
      .single();

    assert(!dbErr && dbProfile, 'Profile record verified in Supabase public.profiles table');
    assert(dbProfile.id === createdUserId, 'Database profile ID is verified user ID');
    assert(dbProfile.full_name === 'Shri Ram Builders Ayodhya', 'Database full_name verified');
    assert(dbProfile.business_name === 'Shri Ram Constructions Pvt Ltd', 'Database business_name verified');
    assert(dbProfile.is_phone_verified === true, 'Database is_phone_verified is true');

    // Exactly 1 record exists (no duplicate accounts)
    const { data: allUserProfiles } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', createdUserId);
    assert(allUserProfiles?.length === 1, 'Exactly 1 profile record exists in database (unique constraint)');

    // ------------------------------------------------------------
    // POSITIVE TEST 4: Load profile via GET /api/auth/profile
    // ------------------------------------------------------------
    console.log('\n[Positive 4] Loading Profile via GET /api/auth/profile (Returning User Flow)...');
    const getRes = await fetch(`${apiBase}/api/auth/profile?userId=${encodeURIComponent(createdUserId)}`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    assert(getRes.status === 200, `GET /api/auth/profile returns HTTP 200 (Got: ${getRes.status})`);
    const getJson = await getRes.json();
    assert(getJson.success === true, 'GET /api/auth/profile returns success: true');
    assert(Boolean(getJson.profile?.full_name), 'Profile returns full_name -> skips registration on next visit');
    assert(getJson.profile?.company_name === 'Shri Ram Constructions Pvt Ltd', 'UI-compatible company_name mapped');

    // ------------------------------------------------------------
    // NEGATIVE TEST 1: Unauthenticated request returns 401
    // ------------------------------------------------------------
    console.log('\n[Negative 1] Testing Unauthenticated Request Handling...');
    const unauthRes = await fetch(`${apiBase}/api/auth/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Unauthenticated Attacker' }),
    });
    assert(unauthRes.status === 401, `Unauthenticated request rejected with HTTP 401 (Got: ${unauthRes.status})`);
    const unauthJson = await unauthRes.json();
    assert(
      unauthJson.error === 'Authentication required. Please verify your mobile number first.',
      'Returns expected error message for unauthenticated request'
    );

    // ------------------------------------------------------------
    // NEGATIVE TEST 2: Forged / Invalid Token returns 401
    // ------------------------------------------------------------
    console.log('\n[Negative 2] Testing Forged / Invalid Bearer Token...');
    const forgedRes = await fetch(`${apiBase}/api/auth/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.fake.forged.jwt.token',
      },
      body: JSON.stringify({ fullName: 'Forged Token Attacker' }),
    });
    assert(forgedRes.status === 401, `Forged Bearer token rejected with HTTP 401 (Got: ${forgedRes.status})`);

    // ------------------------------------------------------------
    // NEGATIVE TEST 3: User ID Mismatch (Tampering) returns 403
    // ------------------------------------------------------------
    console.log('\n[Negative 3] Testing User ID Impersonation / Tampering...');
    const mismatchRes = await fetch(`${apiBase}/api/auth/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000099', // Mismatched ID
        fullName: 'Impersonation Attacker',
      }),
    });
    assert(mismatchRes.status === 403, `User ID mismatch blocked with HTTP 403 Forbidden (Got: ${mismatchRes.status})`);
    const mismatchJson = await mismatchRes.json();
    assert(mismatchJson.error === 'Unauthorized user mismatch.', 'Returns unauthorized user mismatch error');

    // ------------------------------------------------------------
    // NEGATIVE TEST 4: Blank Full Name rejected with 400
    // ------------------------------------------------------------
    console.log('\n[Negative 4] Testing Blank Full Name Validation...');
    const blankNameRes = await fetch(`${apiBase}/api/auth/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        fullName: '  ',
      }),
    });
    assert(blankNameRes.status === 400, `Blank Full Name rejected with HTTP 400 (Got: ${blankNameRes.status})`);
    const blankNameJson = await blankNameRes.json();
    assert(blankNameJson.error.includes('Full Name is required'), 'Returns validation error for empty Full Name');

    // ------------------------------------------------------------
    // NEGATIVE TEST 5: Non-Destructive Update (Blank fields do NOT erase valid data)
    // ------------------------------------------------------------
    console.log('\n[Negative 5] Testing Non-Destructive Blank Field Handling...');
    const updateRes = await fetch(`${apiBase}/api/auth/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        fullName: 'Shri Ram Master Builder Ayodhya',
        email: '', // Blank
        businessName: '', // Blank
        gstin: '', // Blank
      }),
    });

    assert(updateRes.status === 200, `Non-destructive update returns HTTP 200 (Got: ${updateRes.status})`);
    const updateJson = await updateRes.json();
    assert(updateJson.profile?.full_name === 'Shri Ram Master Builder Ayodhya', 'Full Name was successfully updated');
    assert(
      updateJson.profile?.business_name === 'Shri Ram Constructions Pvt Ltd',
      'Existing business_name was NOT overwritten by blank submission'
    );
    assert(
      updateJson.profile?.gstin === '09AAACS1429B1ZB',
      'Existing GSTIN was NOT overwritten by blank submission'
    );

    // ------------------------------------------------------------
    // NEGATIVE TEST 6: Cross-Customer Profile Lookup Prevention in GET
    // ------------------------------------------------------------
    console.log('\n[Negative 6] Testing Cross-Customer Isolation in GET /api/auth/profile...');
    const crossRes = await fetch(
      `${apiBase}/api/auth/profile?userId=00000000-0000-0000-0000-000000000001`,
      {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      }
    );
    assert(crossRes.status === 403, `Cross-customer profile lookup blocked with HTTP 403 (Got: ${crossRes.status})`);
    const crossJson = await crossRes.json();
    assert(
      crossJson.error === 'Access denied: You cannot view another customer profile.',
      'Returns expected access denied message'
    );
  } catch (err) {
    console.error('Audit exception caught:', err.message);
    failed++;
  } finally {
    // ------------------------------------------------------------
    // CLEANUP: Clean up test user from database
    // ------------------------------------------------------------
    if (createdUserId) {
      console.log('\n[Cleanup] Cleaning up test customer from Supabase database...');
      await adminClient.from('profiles').delete().eq('id', createdUserId);
      await adminClient.auth.admin.deleteUser(createdUserId);
      console.log(`  Deleted test user ${createdUserId}`);
    }
  }

  console.log('\n============================================================');
  console.log(`AUDIT FINISHED: ${passed} / ${passed + failed} assertions passed.`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit();
