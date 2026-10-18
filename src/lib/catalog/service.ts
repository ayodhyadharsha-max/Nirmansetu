/**
 * NIRMANSETU: CATALOG DATA ACCESS SERVICE
 *
 * Implements centralized database operations for products, categories, brands,
 * variants, and inventory availability checks.
 *
 * PRIVACY & SECURITY:
 * - Public queries NEVER return supplier costs, supplier IDs, or platform margins.
 * - Public selling prices come from approved catalog benchmark data.
 * - Admin mutations require authorization.
 */

import { PublicCatalogItem, Category, Brand } from '@/types/database';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SEED_CATEGORIES, SEED_BRANDS, SEED_CATALOG_ITEMS } from './seed-data';
import { rupeesToPaise } from '@/lib/money';

export interface CatalogFilterParams {
  categorySlug?: string;
  brandSlug?: string;
  minPricePaise?: number;
  maxPricePaise?: number;
  inStockOnly?: boolean;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'featured' | 'name';
  page?: number;
  limit?: number;
}

export interface PaginatedCatalogResult {
  items: PublicCatalogItem[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  source: 'database' | 'development_seed';
}

/**
 * Lists catalog products with full filtering, search, sorting and pagination.
 */
export async function listProducts(params: CatalogFilterParams = {}): Promise<PaginatedCatalogResult> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 12));
  const offset = (page - 1) * limit;

  try {
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from('public_catalog_view')
      .select('*', { count: 'exact' });

    if (params.categorySlug) {
      query = query.eq('category_slug', params.categorySlug);
    }
    if (params.brandSlug) {
      query = query.eq('brand_slug', params.brandSlug);
    }
    if (params.minPricePaise !== undefined && params.minPricePaise > 0) {
      query = query.gte('selling_price_paise', params.minPricePaise);
    }
    if (params.maxPricePaise !== undefined && params.maxPricePaise > 0) {
      query = query.lte('selling_price_paise', params.maxPricePaise);
    }
    if (params.inStockOnly) {
      query = query.eq('is_in_stock', true);
    }
    if (params.search && params.search.trim()) {
      const term = params.search.trim();
      query = query.or(`product_title.ilike.%${term}%,description.ilike.%${term}%,sku.ilike.%${term}%,brand_name.ilike.%${term}%`);
    }

    // Sort
    switch (params.sortBy) {
      case 'price_asc':
        query = query.order('selling_price_paise', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('selling_price_paise', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'name':
        query = query.order('product_title', { ascending: true });
        break;
      case 'featured':
      default:
        query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
        break;
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (!error && data && data.length > 0) {
      const totalCount = count || data.length;
      return {
        items: data as PublicCatalogItem[],
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        source: 'database',
      };
    }
  } catch {
    // Fallback to validated seed dataset
  }

  // Pure filtering on curated seed data
  let filtered = [...SEED_CATALOG_ITEMS];

  if (params.categorySlug) {
    filtered = filtered.filter((i) => i.category_slug === params.categorySlug);
  }
  if (params.brandSlug) {
    filtered = filtered.filter((i) => i.brand_slug === params.brandSlug);
  }
  if (params.minPricePaise !== undefined && params.minPricePaise > 0) {
    filtered = filtered.filter((i) => i.selling_price_paise >= params.minPricePaise!);
  }
  if (params.maxPricePaise !== undefined && params.maxPricePaise > 0) {
    filtered = filtered.filter((i) => i.selling_price_paise <= params.maxPricePaise!);
  }
  if (params.inStockOnly) {
    filtered = filtered.filter((i) => i.is_in_stock);
  }
  if (params.search && params.search.trim()) {
    const s = params.search.toLowerCase().trim();
    filtered = filtered.filter(
      (i) =>
        i.product_title.toLowerCase().includes(s) ||
        (i.description && i.description.toLowerCase().includes(s)) ||
        i.sku.toLowerCase().includes(s) ||
        (i.brand_name && i.brand_name.toLowerCase().includes(s)) ||
        i.category_name.toLowerCase().includes(s)
    );
  }

  // In-memory sorting
  switch (params.sortBy) {
    case 'price_asc':
      filtered.sort((a, b) => a.selling_price_paise - b.selling_price_paise);
      break;
    case 'price_desc':
      filtered.sort((a, b) => b.selling_price_paise - a.selling_price_paise);
      break;
    case 'newest':
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'name':
      filtered.sort((a, b) => a.product_title.localeCompare(b.product_title));
      break;
    case 'featured':
    default:
      filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
      break;
  }

  const totalCount = filtered.length;
  const paginatedItems = filtered.slice(offset, offset + limit);

  return {
    items: paginatedItems,
    totalCount,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    source: 'development_seed',
  };
}

/**
 * Retrieves a single product by its unique URL slug.
 */
export async function getProductBySlug(slug: string): Promise<PublicCatalogItem | null> {
  const cleanSlug = slug.trim();
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('public_catalog_view')
      .select('*')
      .eq('product_slug', cleanSlug)
      .maybeSingle();

    if (!error && data) {
      return data as PublicCatalogItem;
    }
  } catch {
    // Fallback
  }

  return SEED_CATALOG_ITEMS.find((i) => i.product_slug === cleanSlug) || null;
}

/**
 * Retrieves a single product by its UUID.
 */
export async function getProductById(id: string): Promise<PublicCatalogItem | null> {
  const cleanId = id.trim();
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('public_catalog_view')
      .select('*')
      .eq('product_id', cleanId)
      .maybeSingle();

    if (!error && data) {
      return data as PublicCatalogItem;
    }
  } catch {
    // Fallback
  }

  return SEED_CATALOG_ITEMS.find((i) => i.product_id === cleanId) || null;
}

/**
 * Checks product availability and dispatch SLA for an Ayodhya PIN code.
 */
export async function checkProductAvailability(params: {
  variantId: string;
  pincode?: string;
}): Promise<{
  isAvailable: boolean;
  totalStock: number;
  pincode?: string;
  estimatedDeliveryMinutes: number;
  source: string;
}> {
  const { variantId, pincode = '224123' } = params;

  try {
    const supabase = createServerSupabaseClient();
    const { data: stockData } = await supabase
      .from('supplier_products')
      .select('stock_quantity, is_available')
      .eq('variant_id', variantId)
      .eq('is_available', true);

    const { data: pinData } = await supabase
      .from('service_pincodes')
      .select('is_serviceable, estimated_delivery_minutes')
      .eq('pincode', pincode)
      .maybeSingle();

    if (stockData && stockData.length > 0) {
      const totalStock = stockData.reduce((acc, row) => acc + (row.stock_quantity || 0), 0);
      return {
        isAvailable: totalStock > 0 && (pinData ? pinData.is_serviceable : true),
        totalStock,
        pincode,
        estimatedDeliveryMinutes: pinData?.estimated_delivery_minutes || 90,
        source: 'database',
      };
    }
  } catch {
    // Fallback
  }

  const seedMatch = SEED_CATALOG_ITEMS.find((i) => i.variant_id === variantId);
  return {
    isAvailable: seedMatch ? seedMatch.is_in_stock : false,
    totalStock: seedMatch ? seedMatch.total_available_stock : 0,
    pincode,
    estimatedDeliveryMinutes: 60,
    source: 'development_seed',
  };
}

/**
 * Returns all active categories ordered by display hierarchy.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as Category[];
    }
  } catch {
    // Fallback
  }

  return SEED_CATEGORIES;
}

/**
 * Returns a category by slug.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const clean = slug.trim();
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', clean)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && data) {
      return data as Category;
    }
  } catch {
    // Fallback
  }

  return SEED_CATEGORIES.find((c) => c.slug === clean) || null;
}

/**
 * Returns all active manufacturer brands.
 */
export async function getBrands(): Promise<Brand[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as Brand[];
    }
  } catch {
    // Fallback
  }

  return SEED_BRANDS;
}

/**
 * ADMIN: Creates a product with variant in database.
 */
export async function createProductAdmin(payload: {
  title: string;
  slug: string;
  categoryId: string;
  brandId?: string;
  shortDescription?: string;
  description?: string;
  hsnCode?: string;
  unitOfMeasure: string;
  packSize?: string;
  mrpPaise: number;
  sellingPricePaise: number;
  minOrderQty: number;
  specifications?: Record<string, unknown>;
  images?: string[];
  publicationStatus?: 'draft' | 'published' | 'archived';
  taxRatePct?: number;
}) {
  const supabase = createAdminClient();

  const { data: product, error: pError } = await supabase
    .from('products')
    .insert({
      title: payload.title,
      slug: payload.slug,
      category_id: payload.categoryId,
      brand_id: payload.brandId || null,
      short_description: payload.shortDescription || null,
      description: payload.description || null,
      hsn_code: payload.hsnCode || null,
      unit_of_measure: payload.unitOfMeasure,
      publication_status: payload.publicationStatus || 'published',
      tax_rate_pct: payload.taxRatePct || 18.0,
      specifications: payload.specifications || {},
      images: payload.images || [],
    })
    .select('id, slug, title')
    .single();

  if (pError) {
    throw new Error(`Product creation failed: ${pError.message}`);
  }

  // Create default variant
  const sku = `${payload.slug.toUpperCase().slice(0, 8)}-STD`;
  const { data: variant, error: vError } = await supabase
    .from('product_variants')
    .insert({
      product_id: product.id,
      title: `${payload.title} Standard`,
      sku,
      pack_size: payload.packSize || `Standard ${payload.unitOfMeasure}`,
      mrp_paise: payload.mrpPaise,
      selling_price_paise: payload.sellingPricePaise,
      min_order_qty: payload.minOrderQty,
      publication_status: payload.publicationStatus || 'published',
    })
    .select('id, sku')
    .single();

  if (vError) {
    throw new Error(`Variant creation failed: ${vError.message}`);
  }

  return { product, variant };
}

/**
 * ADMIN: Secure CSV Catalog Importer
 * Validates columns, types, prices, and handles batch ingestion.
 */
export async function importCatalogCsvAdmin(csvText: string): Promise<{
  success: boolean;
  totalRows: number;
  importedCount: number;
  errors: string[];
}> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { success: false, totalRows: 0, importedCount: 0, errors: ['CSV must have a header row and at least one data row.'] };
  }

  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().toLowerCase());

  const requiredHeaders = ['title', 'slug', 'category_slug', 'unit_of_measure', 'selling_price_rupees'];
  for (const req of requiredHeaders) {
    if (!headers.includes(req)) {
      return {
        success: false,
        totalRows: lines.length - 1,
        importedCount: 0,
        errors: [`Missing required header: "${req}". Required headers: ${requiredHeaders.join(', ')}`],
      };
    }
  }

  const errors: string[] = [];
  let importedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((c) => c.trim());
    if (row.length !== headers.length) {
      errors.push(`Row ${i}: Column count mismatch (expected ${headers.length}, got ${row.length})`);
      continue;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = row[idx];
    });

    const priceRupees = parseFloat(rowObj['selling_price_rupees']);
    if (isNaN(priceRupees) || priceRupees < 0) {
      errors.push(`Row ${i}: Invalid selling_price_rupees "${rowObj['selling_price_rupees']}"`);
      continue;
    }

    const mrpRupees = parseFloat(rowObj['mrp_rupees'] || rowObj['selling_price_rupees']);
    const sellingPricePaise = rupeesToPaise(priceRupees);
    const mrpPaise = rupeesToPaise(mrpRupees);

    try {
      // Find category
      const cat = await getCategoryBySlug(rowObj['category_slug']);
      if (!cat) {
        errors.push(`Row ${i}: Category slug "${rowObj['category_slug']}" not found`);
        continue;
      }

      await createProductAdmin({
        title: rowObj['title'],
        slug: rowObj['slug'],
        categoryId: cat.id,
        shortDescription: rowObj['short_description'] || `Genuine ${rowObj['title']}`,
        description: rowObj['description'] || rowObj['title'],
        hsnCode: rowObj['hsn_code'] || '2523',
        unitOfMeasure: rowObj['unit_of_measure'],
        packSize: rowObj['pack_size'] || `Standard ${rowObj['unit_of_measure']}`,
        mrpPaise,
        sellingPricePaise,
        minOrderQty: parseInt(rowObj['min_order_qty'] || '1', 10),
      });

      importedCount++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Row insert error';
      errors.push(`Row ${i} (${rowObj['title']}): ${msg}`);
    }
  }

  return {
    success: errors.length === 0,
    totalRows: lines.length - 1,
    importedCount,
    errors,
  };
}
