const fs = require('fs');
const path = require('path');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

function checkUUID(id, context, errors) {
  if (!id) {
    errors.push(`Missing UUID in ${context}`);
    return false;
  }
  if (!UUID_REGEX.test(id)) {
    errors.push(`Invalid UUID syntax in ${context}: "${id}" (must be 8-4-4-4-12 hex digits [0-9a-f])`);
    return false;
  }
  return true;
}

function validateSeedSql(filePath) {
  console.log('Validating:', filePath);
  const sql = fs.readFileSync(filePath, 'utf8');

  // Track sets
  const serviceZones = new Set();
  const servicePincodes = new Set();
  const categories = new Map(); // id -> slug
  const categorySlugs = new Set();
  const brands = new Map(); // id -> slug
  const brandSlugs = new Set();
  const products = new Map(); // id -> product
  const productSlugs = new Set();
  const variants = new Map(); // id -> variant
  const variantSkus = new Set();
  const errors = [];

  // 1. Service zones
  const zoneRegex = /INSERT INTO public\.service_zones\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?)ON CONFLICT/i;
  const zoneMatch = sql.match(zoneRegex);
  if (zoneMatch) {
    const rows = zoneMatch[2].match(/\('([^']+)'/g);
    if (rows) {
      rows.forEach(r => {
        const id = r.replace(/['()]/g, '');
        checkUUID(id, 'service_zones.id', errors);
        if (serviceZones.has(id)) errors.push(`Duplicate service_zone id: ${id}`);
        serviceZones.add(id);
      });
    }
  }

  // 2. Service pincodes
  const pinRegex = /INSERT INTO public\.service_pincodes\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?)ON CONFLICT/i;
  const pinMatch = sql.match(pinRegex);
  if (pinMatch) {
    const pinRows = pinMatch[2].match(/\(\s*'(\d{6})',\s*'([^']+)'/g);
    if (pinRows) {
      pinRows.forEach(r => {
        const m = r.match(/\(\s*'(\d{6})',\s*'([^']+)'/);
        const pin = m[1];
        const zoneId = m[2];
        if (!PINCODE_REGEX.test(pin)) errors.push(`Invalid Indian postal pincode format: ${pin}`);
        if (servicePincodes.has(pin)) errors.push(`Duplicate pincode: ${pin}`);
        servicePincodes.add(pin);
        checkUUID(zoneId, `service_pincodes.zone_id for pincode ${pin}`, errors);
        if (!serviceZones.has(zoneId)) errors.push(`Pincode ${pin} references unknown zone_id: ${zoneId}`);
      });
    }
  }

  // 3. Categories
  const catRegex = /INSERT INTO public\.categories\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?)ON CONFLICT/i;
  const catMatch = sql.match(catRegex);
  if (catMatch) {
    const catRows = catMatch[2].match(/\(\s*'([^']+)',\s*(NULL|'[^']+'),\s*'([^']+)',\s*'([^']+)'/g);
    if (catRows) {
      catRows.forEach(r => {
        const m = r.match(/\(\s*'([^']+)',\s*(NULL|'[^']+'),\s*'([^']+)',\s*'([^']+)'/);
        const id = m[1];
        const name = m[3];
        const slug = m[4];
        checkUUID(id, `categories.id for category ${name}`, errors);
        if (categories.has(id)) errors.push(`Duplicate category id: ${id}`);
        if (categorySlugs.has(slug)) errors.push(`Duplicate category slug: ${slug}`);
        categories.set(id, slug);
        categorySlugs.add(slug);
      });
    }
  }

  // 4. Brands
  const brandRegex = /INSERT INTO public\.brands\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?)ON CONFLICT/i;
  const brandMatch = sql.match(brandRegex);
  if (brandMatch) {
    const brandRows = brandMatch[2].match(/\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'/g);
    if (brandRows) {
      brandRows.forEach(r => {
        const m = r.match(/\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'/);
        const id = m[1];
        const name = m[2];
        const slug = m[3];
        checkUUID(id, `brands.id for brand ${name}`, errors);
        if (brands.has(id)) errors.push(`Duplicate brand id: ${id}`);
        if (brandSlugs.has(slug)) errors.push(`Duplicate brand slug: ${slug}`);
        brands.set(id, slug);
        brandSlugs.add(slug);
      });
    }
  }

  // 5. Products (there can be multiple INSERT INTO public.products)
  const prodInserts = [...sql.matchAll(/INSERT INTO public\.products\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?)ON CONFLICT/gi)];
  for (const pInsert of prodInserts) {
    const lines = pInsert[2].split('\n');
    for (const line of lines) {
      const pMatch = line.match(/\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'/);
      if (pMatch) {
        const id = pMatch[1];
        const catId = pMatch[2];
        const brandId = pMatch[3];
        const title = pMatch[4];
        const slug = pMatch[5];

        checkUUID(id, `products.id for "${title}"`, errors);
        checkUUID(catId, `products.category_id for "${title}"`, errors);
        checkUUID(brandId, `products.brand_id for "${title}"`, errors);

        if (products.has(id)) errors.push(`Duplicate product id: ${id} (${title})`);
        if (productSlugs.has(slug)) errors.push(`Duplicate product slug: ${slug}`);
        if (!categories.has(catId)) errors.push(`Product ${slug} references unknown category_id: ${catId}`);
        if (!brands.has(brandId)) errors.push(`Product ${slug} references unknown brand_id: ${brandId}`);

        products.set(id, { title, slug, catId, brandId });
        productSlugs.add(slug);
      }
    }
  }

  // 6. Variants (there can be multiple INSERT INTO public.product_variants)
  const varInserts = [...sql.matchAll(/INSERT INTO public\.product_variants\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?)ON CONFLICT/gi)];
  for (const vInsert of varInserts) {
    const lines = vInsert[2].split('\n');
    for (const line of lines) {
      const vMatch = line.match(/\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'/);
      if (vMatch) {
        const id = vMatch[1];
        const prodId = vMatch[2];
        const title = vMatch[3];
        const sku = vMatch[4];

        checkUUID(id, `product_variants.id for SKU "${sku}"`, errors);
        checkUUID(prodId, `product_variants.product_id for SKU "${sku}"`, errors);

        if (variants.has(id)) errors.push(`Duplicate variant id: ${id} (SKU: ${sku})`);
        if (variantSkus.has(sku)) errors.push(`Duplicate variant SKU: ${sku}`);
        if (!products.has(prodId)) errors.push(`Variant SKU: ${sku} references unknown or missing product_id: ${prodId}`);

        variants.set(id, { title, sku, prodId });
        variantSkus.add(sku);
      }
    }
  }

  // Summary
  console.log(`Service Zones:   ${serviceZones.size}`);
  console.log(`Service Pincodes: ${servicePincodes.size}`);
  console.log(`Categories:      ${categories.size}`);
  console.log(`Brands:          ${brands.size}`);
  console.log(`Products:        ${products.size}`);
  console.log(`Variants:        ${variants.size}`);

  if (errors.length > 0) {
    console.error(`\nFound ${errors.length} validation errors:`);
    errors.forEach(e => console.error('  [ERROR]', e));
    return false;
  } else {
    console.log('\n[PASS] All UUIDs, Primary Keys, Foreign Keys, Slugs, and SKUs are 100% valid and unique!');
    return true;
  }
}

const targetFile = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : path.resolve(__dirname, '../supabase/seed_production.sql');
const success = validateSeedSql(targetFile);
process.exit(success ? 0 : 1);
