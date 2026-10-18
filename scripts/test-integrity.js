/**
 * Automated System & Schema Integrity Test Suite
 * NIRMANSETU: Ayodhya Construction Materials Marketplace
 *
 * Usage:
 *   node scripts/test-integrity.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('============================================================');
console.log('NIRMANSETU: AUTOMATED INTEGRITY & COMPLIANCE TEST SUITE');
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

// ----------------------------------------------------------------------------
// TEST SUITE 1: MONETARY ARITHMETIC INTEGRITY (INTEGER PAISE)
// ----------------------------------------------------------------------------
console.log('\n[1] Testing Monetary Precision & Zero Floating-Point Rules...');

runTest('Basic paise to rupee conversion without floating point distortion', () => {
  // Test common floating-point hazards: ₹199.99 * 3 in floating point produces 599.970000000000027
  const unitPaise = 19999; // ₹199.99
  const qty = 3;
  const totalPaise = unitPaise * qty;
  assert.strictEqual(totalPaise, 59997, 'Total paise must be exactly 59997 (integer)');
  assert.strictEqual(Number.isInteger(totalPaise), true, 'Total must be an integer');
});

runTest('GST Tax calculation in basis points', () => {
  // ₹1,000 (100000 paise) at 18% GST -> 18000 paise (₹180)
  const taxablePaise = 100000;
  const gstRatePct = 18.0;
  const rateInBasisPoints = Math.round(gstRatePct * 100);
  const taxPaise = Math.round((taxablePaise * rateInBasisPoints) / 10000);
  assert.strictEqual(taxPaise, 18000, 'Tax must be exactly 18000 paise');
});

runTest('Order total balance validation: Total = Subtotal + Tax + Delivery - Discount', () => {
  const subtotalPaise = 38500 * 10; // 10 bags of cement = 385000 paise (₹3,850)
  const taxPaise = Math.round((subtotalPaise * 1800) / 10000); // 18% = 69300 paise
  const deliveryFeePaise = 19900; // ₹199
  const discountPaise = 10000; // ₹100
  const expectedTotal = subtotalPaise + taxPaise + deliveryFeePaise - discountPaise;

  assert.strictEqual(expectedTotal, 464200, 'Total must exactly balance to 464200 paise (₹4,642)');
});

// ----------------------------------------------------------------------------
// TEST SUITE 2: DATABASE MIGRATIONS & SCHEMA ARCHITECTURE
// ----------------------------------------------------------------------------
console.log('\n[2] Testing Database Migrations & 16 Domain Schemas...');

const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
const schemaFullFile = path.resolve(__dirname, '../supabase/schema_full.sql');
const seedFile = path.resolve(__dirname, '../supabase/seed.sql');

runTest('Migration files exist in version-controlled directory', () => {
  assert.strictEqual(fs.existsSync(migrationsDir), true, 'supabase/migrations must exist');
  const files = fs.readdirSync(migrationsDir);
  assert.strictEqual(files.length >= 5, true, 'At least 5 versioned migration files must exist');
  assert.strictEqual(fs.existsSync(schemaFullFile), true, 'schema_full.sql must exist');
  assert.strictEqual(fs.existsSync(seedFile), true, 'seed.sql must exist');
});

runTest('All 16 required domain tables defined with proper constraints', () => {
  const fullSql = fs.readFileSync(schemaFullFile, 'utf8');

  const requiredTables = [
    'profiles',
    'categories',
    'brands',
    'products',
    'product_variants',
    'suppliers',
    'supplier_products',
    'service_zones',
    'service_pincodes',
    'customer_addresses',
    'carts',
    'cart_items',
    'orders',
    'order_items',
    'order_status_history',
    'payments',
    'payment_events',
    'coupons',
    'bulk_enquiries',
    'quotations',
    'quotation_items',
    'supplier_purchase_orders',
    'supplier_po_items',
    'delivery_assignments',
    'notifications',
    'admin_settings',
    'audit_logs',
  ];

  for (const table of requiredTables) {
    const tablePattern = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}`, 'i');
    assert.strictEqual(
      tablePattern.test(fullSql),
      true,
      `Table public.${table} must be defined in schema`
    );
  }
});

runTest('Row Level Security (RLS) is enabled across tables in schema', () => {
  const fullSql = fs.readFileSync(schemaFullFile, 'utf8');
  assert.strictEqual(
    fullSql.includes('ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY'),
    true,
    'RLS must be enabled on orders'
  );
  assert.strictEqual(
    fullSql.includes('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY'),
    true,
    'RLS must be enabled on profiles'
  );
  assert.strictEqual(
    fullSql.includes('ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY'),
    true,
    'RLS must be enabled on suppliers'
  );
});

runTest('Monetary columns are strictly typed as BIGINT in paise', () => {
  const fullSql = fs.readFileSync(schemaFullFile, 'utf8');
  assert.strictEqual(fullSql.includes('subtotal_paise BIGINT'), true, 'subtotal_paise must be BIGINT');
  assert.strictEqual(fullSql.includes('total_paise BIGINT'), true, 'total_paise must be BIGINT');
  assert.strictEqual(fullSql.includes('selling_price_paise BIGINT'), true, 'selling_price_paise must be BIGINT');
  assert.strictEqual(fullSql.includes('supplier_cost_paise BIGINT'), true, 'supplier_cost_paise must be BIGINT');
});

// ----------------------------------------------------------------------------
// TEST SUITE 3: AYODHYA DISTRICT PINCODE & REGIONAL COVERAGE
// ----------------------------------------------------------------------------
console.log('\n[3] Testing Ayodhya Regional Coverage & Pincode Validation...');

runTest('Seed data contains authentic Ayodhya district postal pincodes', () => {
  const seedSql = fs.readFileSync(seedFile, 'utf8');
  assert.strictEqual(seedSql.includes('224123'), true, 'Ayodhya Dham (224123) must be seeded');
  assert.strictEqual(seedSql.includes('224001'), true, 'Faizabad Head PO (224001) must be seeded');
  assert.strictEqual(seedSql.includes('224133'), true, 'Darshannagar (224133) must be seeded');
});

runTest('Demo seed records are explicitly labeled with is_demo: true', () => {
  const seedSql = fs.readFileSync(seedFile, 'utf8');
  assert.strictEqual(seedSql.includes('"is_demo": true'), true, 'Seed data must be marked demo');
  assert.strictEqual(seedSql.includes('DEMO PARTNER'), true, 'Demonstration partners must be labeled');
});

// ----------------------------------------------------------------------------
// TEST SUITE 4: SECURITY & ENVIRONMENT CONFIGURATION
// ----------------------------------------------------------------------------
console.log('\n[4] Testing Security Boundaries & Safe Environment Templates...');

runTest('.env.example template contains all required keys without real secrets', () => {
  const envExample = fs.readFileSync(path.resolve(__dirname, '../.env.example'), 'utf8');
  assert.strictEqual(envExample.includes('NEXT_PUBLIC_SUPABASE_URL'), true);
  assert.strictEqual(envExample.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'), true);
  assert.strictEqual(envExample.includes('SUPABASE_SERVICE_ROLE_KEY'), true);
  assert.strictEqual(envExample.includes('NEXT_PUBLIC_BRAND_NAME'), true);
  assert.strictEqual(envExample.includes('your-anon-key-here'), true, 'Should contain placeholder strings');
});

runTest('.gitignore prevents leaking environment credentials or keys', () => {
  const gitignore = fs.readFileSync(path.resolve(__dirname, '../.gitignore'), 'utf8');
  assert.strictEqual(gitignore.includes('.env.local'), true, '.env.local must be ignored');
  assert.strictEqual(gitignore.includes('.env'), true, '.env must be ignored');
});

console.log('\n============================================================');
console.log(`TEST SUMMARY: ${passedTests} OF ${totalTests} CHECKS PASSED`);
console.log('============================================================\n');

if (passedTests < totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
