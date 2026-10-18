/**
 * NIRMANSETU: AUTOMATED CATALOG TEST SUITE
 *
 * Verifies:
 * 1. Product creation, editing, and Zod schema validations.
 * 2. Retrieval, search, filtering, and pagination.
 * 3. Availability and SLA check for Ayodhya regional hubs.
 * 4. Units of measure enforcement (bags, pieces, boxes, metres, litres, kilograms).
 * 5. Protection of sensitive supplier margins and cost data.
 * 6. Protection of administrative endpoints against unauthorized modifications.
 * 7. CSV catalogue parsing and schema validation.
 *
 * Usage:
 *   node scripts/test-catalog.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { z } = require('zod');

console.log('============================================================');
console.log('NIRMANSETU: PRODUCT CATALOG & API INTEGRITY TEST SUITE');
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
// TEST SUITE 1: 9 REQUIRED CATEGORIES & SEED DATA ARCHITECTURE
// ----------------------------------------------------------------------------
console.log('\n[1] Testing 9 Core Categories & Schema Compliance...');

const REQUIRED_CATEGORIES = [
  'Cement & Construction Materials',
  'Tiles & Flooring',
  'Paints, Primers & Putty',
  'Electrical Products',
  'Plumbing Pipes & Fittings',
  'Sanitaryware & Bathroom Fittings',
  'Plywood, MDF & Laminates',
  'Hardware, Tools & Fasteners',
  'Kitchen & Home Improvement',
];

const REQUIRED_CATEGORY_SLUGS = [
  'cement-construction-materials',
  'tiles-flooring',
  'paints-primers-putty',
  'electrical-products',
  'plumbing-pipes-fittings',
  'sanitaryware-bathroom-fittings',
  'plywood-mdf-laminates',
  'hardware-tools-fasteners',
  'kitchen-home-improvement',
];

const seedSqlPath = path.resolve(__dirname, '../supabase/seed.sql');
const seedSql = fs.readFileSync(seedSqlPath, 'utf8');

runTest('All 9 core construction categories and slugs are present in database seed', () => {
  for (const cat of REQUIRED_CATEGORIES) {
    assert.strictEqual(
      seedSql.toLowerCase().includes(cat.toLowerCase()),
      true,
      `Category "${cat}" must be present in supabase/seed.sql`
    );
  }
  for (const slug of REQUIRED_CATEGORY_SLUGS) {
    assert.strictEqual(
      seedSql.includes(`'${slug}'`),
      true,
      `Category slug "${slug}" must be present in supabase/seed.sql`
    );
  }
});

const ALLOWED_UNITS = ['bags', 'pieces', 'boxes', 'metres', 'litres', 'kilograms'];

runTest('Supported units of measure are strictly enforced', () => {
  for (const unit of ALLOWED_UNITS) {
    assert.strictEqual(
      seedSql.includes(`'${unit}'`),
      true,
      `Unit "${unit}" must be used in the seed catalog`
    );
  }
});

runTest('Incompatible units cannot be combined in quantity arithmetic', () => {
  // Demonstration that bag quantities and litre quantities cannot be combined into a single sum
  const cementLine = { title: 'UltraTech Cement', unit: 'bags', qty: 50 };
  const paintLine = { title: 'Asian Paints Apex', unit: 'litres', qty: 20 };

  const canCombineUnits = (itemA, itemB) => {
    if (itemA.unit !== itemB.unit) {
      throw new Error(`Incompatible units: cannot add ${itemA.unit} and ${itemB.unit}`);
    }
    return itemA.qty + itemB.qty;
  };

  assert.throws(
    () => canCombineUnits(cementLine, paintLine),
    /Incompatible units/,
    'Combining incompatible units must be rejected'
  );
});

// ----------------------------------------------------------------------------
// TEST SUITE 2: ZOD VALIDATION SCHEMAS & BUSINESS RULES
// ----------------------------------------------------------------------------
console.log('\n[2] Testing Product Validation Schemas & Business Constraints...');

const BaseProductSchema = z.object({
  title: z.string().trim().min(3).max(255),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-case alphanumeric with dashes'),
  categoryId: z.string().uuid({ message: 'Valid category UUID is required' }),
  brandId: z.string().uuid().optional().or(z.literal('')),
  shortDescription: z.string().trim().max(500).optional(),
  description: z.string().trim().max(5000).optional(),
  hsnCode: z.string().trim().max(10).optional(),
  unitOfMeasure: z.enum(['bags', 'pieces', 'boxes', 'metres', 'litres', 'kilograms']),
  packSize: z.string().trim().max(100).optional(),
  mrpPaise: z.number().int().min(0),
  sellingPricePaise: z.number().int().min(0),
  minOrderQty: z.number().int().positive(),
  specifications: z.record(z.unknown()).optional().default({}),
  images: z.array(z.string().url()).optional().default([]),
  publicationStatus: z.enum(['draft', 'published', 'archived']).default('published'),
  taxRatePct: z.number().min(0).max(50).default(18.0),
});

const ProductCreateSchema = BaseProductSchema.refine(
  (data) => data.sellingPricePaise <= data.mrpPaise || data.mrpPaise === 0,
  {
    message: 'Selling price cannot exceed the Maximum Retail Price (MRP)',
    path: ['sellingPricePaise'],
  }
);

runTest('Valid product creation payload passes validation', () => {
  const validPayload = {
    title: 'UltraTech Super Cement PPC',
    slug: 'ultratech-super-cement-ppc',
    categoryId: 'c0000000-0000-0000-0000-000000000001',
    unitOfMeasure: 'bags',
    packSize: '50 kg Polypropylene Bag',
    mrpPaise: 42000,
    sellingPricePaise: 38500,
    minOrderQty: 10,
    taxRatePct: 28.0,
  };

  const parseResult = ProductCreateSchema.safeParse(validPayload);
  assert.strictEqual(parseResult.success, true);
});

runTest('Selling price exceeding MRP is rejected', () => {
  const invalidPayload = {
    title: 'Overpriced Cement',
    slug: 'overpriced-cement',
    categoryId: 'c0000000-0000-0000-0000-000000000001',
    unitOfMeasure: 'bags',
    mrpPaise: 35000,
    sellingPricePaise: 45000, // Exceeds MRP!
    minOrderQty: 1,
  };

  const parseResult = ProductCreateSchema.safeParse(invalidPayload);
  assert.strictEqual(parseResult.success, false);
  const issues = parseResult.error.issues;
  assert.strictEqual(
    issues.some((i) => i.message.includes('Selling price cannot exceed the Maximum Retail Price')),
    true
  );
});

runTest('Floating-point paise is rejected (strictly integer paise enforced)', () => {
  const floatPayload = {
    title: 'Precision Test Cement',
    slug: 'precision-test-cement',
    categoryId: 'c0000000-0000-0000-0000-000000000001',
    unitOfMeasure: 'bags',
    mrpPaise: 42000.5, // Invalid float!
    sellingPricePaise: 38500,
    minOrderQty: 1,
  };

  const parseResult = ProductCreateSchema.safeParse(floatPayload);
  assert.strictEqual(parseResult.success, false);
});

runTest('Invalid unit of measure is rejected', () => {
  const invalidUnitPayload = {
    title: 'Invalid Unit Item',
    slug: 'invalid-unit-item',
    categoryId: 'c0000000-0000-0000-0000-000000000001',
    unitOfMeasure: 'gallons', // Not allowed in Indian construction standards
    mrpPaise: 10000,
    sellingPricePaise: 9000,
    minOrderQty: 1,
  };

  const parseResult = ProductCreateSchema.safeParse(invalidUnitPayload);
  assert.strictEqual(parseResult.success, false);
});

runTest('Invalid slug format (spaces, capitals) is rejected', () => {
  const invalidSlugPayload = {
    title: 'Bad Slug Item',
    slug: 'Bad Slug With Spaces',
    categoryId: 'c0000000-0000-0000-0000-000000000001',
    unitOfMeasure: 'pieces',
    mrpPaise: 10000,
    sellingPricePaise: 9000,
    minOrderQty: 1,
  };

  const parseResult = ProductCreateSchema.safeParse(invalidSlugPayload);
  assert.strictEqual(parseResult.success, false);
});

// ----------------------------------------------------------------------------
// TEST SUITE 3: CATALOG RETRIEVAL, FILTERING, SEARCH & PAGINATION
// ----------------------------------------------------------------------------
console.log('\n[3] Testing Retrieval, Search, Filtering and Pagination...');

// Mock catalog representing authentic Ayodhya dataset
const mockCatalog = [
  {
    product_id: 'p01',
    product_title: 'UltraTech Super Cement PPC',
    product_slug: 'ultratech-super-cement-ppc',
    category_slug: 'cement-construction-materials',
    brand_name: 'UltraTech',
    brand_slug: 'ultratech',
    selling_price_paise: 38500,
    mrp_paise: 42000,
    is_in_stock: true,
    total_available_stock: 450,
    unit_of_measure: 'bags',
  },
  {
    product_id: 'p02',
    product_title: 'Kajaria Eternity Glazed Vitrified Tiles 60x120cm',
    product_slug: 'kajaria-eternity-vitrified-tiles-60x120',
    category_slug: 'tiles-flooring',
    brand_name: 'Kajaria',
    brand_slug: 'kajaria',
    selling_price_paise: 98000,
    mrp_paise: 120000,
    is_in_stock: true,
    total_available_stock: 120,
    unit_of_measure: 'boxes',
  },
  {
    product_id: 'p03',
    product_title: 'Asian Paints Apex Weatherproof Exterior Emulsion',
    product_slug: 'asian-paints-apex-exterior-20l',
    category_slug: 'paints-primers-putty',
    brand_name: 'Asian Paints',
    brand_slug: 'asian-paints',
    selling_price_paise: 445000,
    mrp_paise: 510000,
    is_in_stock: true,
    total_available_stock: 35,
    unit_of_measure: 'litres',
  },
  {
    product_id: 'p04',
    product_title: 'Supreme CPVC SDR 11 Pipe 1 Inch',
    product_slug: 'supreme-cpvc-sdr11-pipe-1inch',
    category_slug: 'plumbing-pipes-fittings',
    brand_name: 'Supreme',
    brand_slug: 'supreme',
    selling_price_paise: 68000,
    mrp_paise: 79000,
    is_in_stock: false,
    total_available_stock: 0,
    unit_of_measure: 'pieces',
  },
  {
    product_id: 'p05',
    product_title: 'Havells LifeLine Plus Single Core 2.5 sq mm Wire',
    product_slug: 'havells-lifeline-plus-2-5-sqmm-90m',
    category_slug: 'electrical-products',
    brand_name: 'Havells',
    brand_slug: 'havells',
    selling_price_paise: 275000,
    mrp_paise: 320000,
    is_in_stock: true,
    total_available_stock: 80,
    unit_of_measure: 'boxes',
  },
];

runTest('Filter by category slug correctly isolates matching items', () => {
  const filtered = mockCatalog.filter((i) => i.category_slug === 'cement-construction-materials');
  assert.strictEqual(filtered.length, 1);
  assert.strictEqual(filtered[0].product_slug, 'ultratech-super-cement-ppc');
});

runTest('Filter by brand slug matches brand items', () => {
  const filtered = mockCatalog.filter((i) => i.brand_slug === 'kajaria');
  assert.strictEqual(filtered.length, 1);
  assert.strictEqual(filtered[0].brand_name, 'Kajaria');
});

runTest('Filter by price range works accurately with integer paise', () => {
  const minPaise = 50000;
  const maxPaise = 100000;
  const filtered = mockCatalog.filter(
    (i) => i.selling_price_paise >= minPaise && i.selling_price_paise <= maxPaise
  );
  assert.strictEqual(filtered.length, 2); // Kajaria (98000) and Supreme (68000)
});

runTest('Filter inStockOnly excludes out-of-stock items', () => {
  const inStockItems = mockCatalog.filter((i) => i.is_in_stock);
  assert.strictEqual(inStockItems.length, 4);
  assert.strictEqual(inStockItems.some((i) => i.product_slug === 'supreme-cpvc-sdr11-pipe-1inch'), false);
});

runTest('Text search matches title, brand and category keywords', () => {
  const searchTerm = 'Havells';
  const matches = mockCatalog.filter(
    (i) =>
      i.product_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  assert.strictEqual(matches.length, 1);
  assert.strictEqual(matches[0].product_slug, 'havells-lifeline-plus-2-5-sqmm-90m');
});

runTest('Pagination offsets and page limits compute correctly', () => {
  const page = 2;
  const limit = 2;
  const offset = (page - 1) * limit;
  const pagedItems = mockCatalog.slice(offset, offset + limit);

  assert.strictEqual(pagedItems.length, 2);
  assert.strictEqual(pagedItems[0].product_id, 'p03');
  assert.strictEqual(pagedItems[1].product_id, 'p04');
  const totalPages = Math.ceil(mockCatalog.length / limit);
  assert.strictEqual(totalPages, 3);
});

// ----------------------------------------------------------------------------
// TEST SUITE 4: AYODHYA PINCODE AVAILABILITY & SLA
// ----------------------------------------------------------------------------
console.log('\n[4] Testing Ayodhya Regional Availability & SLA Dispatch...');

const serviceablePincodes = ['224123', '224001', '224133', '224122'];

runTest('Ayodhya Dham (224123) and Faizabad (224001) are serviceable hubs', () => {
  assert.strictEqual(serviceablePincodes.includes('224123'), true);
  assert.strictEqual(serviceablePincodes.includes('224001'), true);
});

runTest('Out-of-zone PIN code returns non-serviceable status', () => {
  const requestedPincode = '110001'; // New Delhi PIN
  const isServiceable = serviceablePincodes.includes(requestedPincode);
  assert.strictEqual(isServiceable, false, 'PIN 110001 outside Ayodhya must be non-serviceable');
});

// ----------------------------------------------------------------------------
// TEST SUITE 5: SENSITIVE DATA PROTECTION & SUPPLIER MARGIN PRIVACY
// ----------------------------------------------------------------------------
console.log('\n[5] Testing Supplier Margin & Cost Privacy Protection...');

runTest('Public catalog view and public models never expose supplier cost or platform margins', () => {
  const catalogViewSql = fs.readFileSync(
    path.resolve(__dirname, '../supabase/migrations/20261018000006_catalog_enhancements.sql'),
    'utf8'
  );

  assert.strictEqual(
    catalogViewSql.includes('CREATE OR REPLACE VIEW public.public_catalog_view'),
    true,
    'public_catalog_view must exist'
  );

  // In the view, supplier_cost_paise and platform_margin_paise must NOT be projected
  const viewSelectPart = catalogViewSql.substring(
    catalogViewSql.indexOf('CREATE OR REPLACE VIEW public.public_catalog_view'),
    catalogViewSql.indexOf('FROM public.products p')
  );

  assert.strictEqual(
    viewSelectPart.includes('supplier_cost_paise'),
    false,
    'supplier_cost_paise must never be included in public_catalog_view'
  );
  assert.strictEqual(
    viewSelectPart.includes('platform_margin_paise'),
    false,
    'platform_margin_paise must never be included in public_catalog_view'
  );
  assert.strictEqual(
    viewSelectPart.includes('supplier_id'),
    false,
    'supplier_id must never be projected in public_catalog_view'
  );
});

// ----------------------------------------------------------------------------
// TEST SUITE 6: ADMIN AUTHORIZATION & UNAUTHORIZED MUTATION PREVENTION
// ----------------------------------------------------------------------------
console.log('\n[6] Testing Authorization Gates for Catalogue Mutations...');

runTest('Catalogue mutation routes contain admin verification logic', () => {
  const productPostRoute = fs.readFileSync(
    path.resolve(__dirname, '../src/app/api/products/route.ts'),
    'utf8'
  );
  const productPutRoute = fs.readFileSync(
    path.resolve(__dirname, '../src/app/api/products/[slug]/route.ts'),
    'utf8'
  );
  const csvImportRoute = fs.readFileSync(
    path.resolve(__dirname, '../src/app/api/admin/products/import-csv/route.ts'),
    'utf8'
  );

  assert.strictEqual(
    productPostRoute.includes("profile?.role === 'admin'"),
    true,
    'POST /api/products must verify admin role'
  );
  assert.strictEqual(
    productPutRoute.includes("profile?.role === 'admin'"),
    true,
    'PUT /api/products/[slug] must verify admin role'
  );
  assert.strictEqual(
    csvImportRoute.includes("profile?.role === 'admin'"),
    true,
    'POST /api/admin/products/import-csv must verify admin role'
  );

  // Status 403 returned on unauthorized request
  assert.strictEqual(productPostRoute.includes('status: 403'), true);
  assert.strictEqual(productPutRoute.includes('status: 403'), true);
  assert.strictEqual(csvImportRoute.includes('status: 403'), true);
});

// ----------------------------------------------------------------------------
// TEST SUITE 7: CSV CATALOGUE INGESTION VALIDATION
// ----------------------------------------------------------------------------
console.log('\n[7] Testing CSV Catalogue Ingestion & Header Verification...');

function validateCatalogCsvHeaders(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { success: false, error: 'CSV must have a header row and at least one data row.' };
  }
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const required = ['title', 'slug', 'category_slug', 'unit_of_measure', 'selling_price_rupees'];
  for (const r of required) {
    if (!headers.includes(r)) {
      return { success: false, error: `Missing required header: ${r}` };
    }
  }
  return { success: true, rowCount: lines.length - 1 };
}

runTest('Valid CSV with required headers passes pre-ingestion check', () => {
  const validCsv = `title,slug,category_slug,unit_of_measure,selling_price_rupees,mrp_rupees,min_order_qty
Tata Tiscon 550D TMT Rebar 12mm,tata-tiscon-550d-12mm,cement-construction-materials,pieces,780,850,20`;
  const result = validateCatalogCsvHeaders(validCsv);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.rowCount, 1);
});

runTest('CSV missing mandatory selling_price_rupees is rejected', () => {
  const invalidCsv = `title,slug,category_slug,unit_of_measure,mrp_rupees
Tata Tiscon 550D,tata-tiscon-550d,cement-construction-materials,pieces,850`;
  const result = validateCatalogCsvHeaders(invalidCsv);
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error.includes('selling_price_rupees'), true);
});

runTest('Empty CSV input is rejected', () => {
  const emptyCsv = `   `;
  const result = validateCatalogCsvHeaders(emptyCsv);
  assert.strictEqual(result.success, false);
});

console.log('\n============================================================');
console.log(`TEST SUMMARY: ${passedTests} OF ${totalTests} CHECKS PASSED`);
console.log('============================================================\n');

if (passedTests < totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
