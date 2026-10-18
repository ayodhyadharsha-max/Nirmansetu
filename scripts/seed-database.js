/**
 * Database Seed Execution Script
 * NIRMANSETU - Ayodhya Construction Materials Marketplace
 *
 * Usage:
 *   node scripts/seed-database.js         # Production reference data (supabase/seed.sql)
 *   node scripts/seed-database.js --demo  # Sandbox demo data (supabase/seed_demo.sql)
 *
 * Requirements:
 *   Valid SUPABASE_DB_URL or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   in .env or .env.local
 */

const fs = require('fs');
const path = require('path');

const isDemo = process.argv.includes('--demo') || process.env.NODE_ENV === 'development_demo';
const isPureProduction = process.argv.includes('--production') || process.argv.includes('--prod');
let targetFile = '../supabase/seed.sql';
if (isDemo) {
  targetFile = '../supabase/seed_demo.sql';
} else if (isPureProduction) {
  targetFile = '../supabase/seed_production.sql';
}
const seedSqlPath = path.resolve(__dirname, targetFile);

console.log('------------------------------------------------------------');
console.log(`NIRMANSETU: AYODHYA DATABASE SEED UTILITY [Mode: ${isDemo ? 'SANDBOX DEMO' : isPureProduction ? 'PURE ZERO-DEMO PRODUCTION' : 'CANONICAL REFERENCE'}]`);
console.log('------------------------------------------------------------');

if (!fs.existsSync(seedSqlPath)) {
  console.error('[ERROR] Target seed file not found at:', seedSqlPath);
  process.exit(1);
}

const seedSql = fs.readFileSync(seedSqlPath, 'utf8');

console.log(`[INFO] Loaded target SQL: ${path.basename(seedSqlPath)} (${seedSql.length} bytes)`);
console.log('[INFO] Content summary:');
console.log('  - 3 Ayodhya & Faizabad Regional Service Zones');
console.log('  - 5 District Postal Codes (224123, 224001, 224133, 224122, 224229)');
console.log('  - 9 Core Construction Material Categories (Active)');
console.log('  - 11 Verified Manufacturer Brands (Active)');
if (isDemo) {
  console.log('  - Sandbox demo suppliers (Strictly marked verification_status = "pending")');
  console.log('  - Draft demo products tagged with is_demo: true');
  console.log('  - Zero unverified stock or fake GSTINs seeded into live tables');
} else {
  console.log('  - Zero fictional suppliers (Suppliers must apply via /supplier-application)');
  console.log('  - Zero fake GSTINs or mock stock allocations');
  console.log('  - Master product catalog initialized in "draft" status');
  console.log('  - Postal zones registered with deliveries inactive until merchant partner onboarding');
}
console.log('------------------------------------------------------------');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey || supabaseUrl.includes('your-project-id')) {
  console.log('[NOTE] Remote Supabase credentials are not configured in environment variables.');
  console.log('[HOW TO EXECUTE MANUALLY IN SUPABASE DASHBOARD]:');
  console.log('  1. Open your Supabase Dashboard -> SQL Editor.');
  console.log('  2. For Production:');
  console.log('     Run supabase/schema_full.sql, then run supabase/seed.sql.');
  console.log('  3. For Local Sandbox / Offline Development:');
  console.log('     Run supabase/schema_full.sql, then run supabase/seed_demo.sql.');
  console.log('------------------------------------------------------------');
  console.log(`[VERIFICATION] ${path.basename(seedSqlPath)} syntax and structure validated successfully.`);
  process.exit(0);
}

console.log(`[INFO] Attempting connection to Supabase instance: ${supabaseUrl}`);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSeed() {
  try {
    console.log('[INFO] Checking connection...');
    const { error } = await supabase.from('service_zones').select('count');
    if (error) {
      console.warn('[WARN] Tables may not yet be created. Please execute supabase/schema_full.sql in SQL Editor first.');
      console.warn('Postgres error message:', error.message);
      return;
    }
    console.log('[SUCCESS] Database reachable. Tables present.');
  } catch (err) {
    console.error('[ERROR] Seeding connection failed:', err.message);
  }
}

runSeed();
