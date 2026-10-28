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
import { ALL_HOMERUN_PRODUCTS } from '@/config/homerun-catalog';
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

// In-memory cache for ultra-fast, zero-delay responses (eliminates 10-20s network latency)
let cachedCategories: { data: Category[]; expiresAt: number } | null = null;
let cachedBrands: { data: Brand[]; expiresAt: number } | null = null;
const productSlugCache = new Map<string, { data: PublicCatalogItem | null; expiresAt: number }>();
const productIdCache = new Map<string, { data: PublicCatalogItem | null; expiresAt: number }>();
const listProductsCache = new Map<string, { data: PaginatedCatalogResult; expiresAt: number }>();

// Circuit breaker state to avoid waiting on slow/unreachable external database connections
let dbCircuitBreakerOpenUntil = 0;

export function isDbCircuitBreakerOpen(): boolean {
  return Date.now() < dbCircuitBreakerOpenUntil;
}

export function tripDbCircuitBreaker(durationMs = 60000): void {
  dbCircuitBreakerOpenUntil = Date.now() + durationMs;
}

export function resetDbCircuitBreaker(): void {
  dbCircuitBreakerOpenUntil = 0;
}

export function invalidateCatalogCache(): void {
  cachedCategories = null;
  cachedBrands = null;
  productSlugCache.clear();
  productIdCache.clear();
  listProductsCache.clear();
  resetDbCircuitBreaker();
}

/**
 * Timeout wrapper ensuring database network calls NEVER block longer than timeoutMs.
 * If timeout fires or network fails, trips the circuit breaker for 60 seconds.
 */
async function withQueryTimeout<T>(promise: PromiseLike<T>, timeoutMs = 350, fallbackVal: T): Promise<T> {
  let timer: NodeJS.Timeout;
  let didTimeout = false;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      didTimeout = true;
      tripDbCircuitBreaker(60000);
      resolve(fallbackVal);
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([
      Promise.resolve(promise).catch(() => {
        tripDbCircuitBreaker(60000);
        return fallbackVal;
      }),
      timeoutPromise,
    ]);
    if (!didTimeout && result !== fallbackVal) {
      resetDbCircuitBreaker();
    }
    return result;
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Lists catalog products with full filtering, search, sorting and pagination.
 */
export async function listProducts(params: CatalogFilterParams = {}): Promise<PaginatedCatalogResult> {
  const cacheKey = JSON.stringify(params);
  const now = Date.now();
  const cached = listProductsCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 12));
  const offset = (page - 1) * limit;

  if (!isDbCircuitBreakerOpen()) {
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

      const queryPromise = query.then(({ data, count, error }) => {
        if (!error && data && data.length > 0) {
          const totalCount = count !== null && count !== undefined ? count : data.length;
          return {
            items: data as PublicCatalogItem[],
            totalCount,
            page,
            limit,
            totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
            source: 'database' as const,
          };
        }
        return null;
      });

      const dbResult = await withQueryTimeout(queryPromise, 350, null);
      if (dbResult) {
        listProductsCache.set(cacheKey, { data: dbResult, expiresAt: now + 60000 });
        return dbResult;
      }
    } catch {
      tripDbCircuitBreaker(60000);
    }
  }

  // Instant resilient fallback from verified catalog items
  let fallback = [...SEED_CATALOG_ITEMS];
  if (params.categorySlug) {
    fallback = fallback.filter((i) => i.category_slug === params.categorySlug);
  }
  if (params.brandSlug) {
    fallback = fallback.filter((i) => i.brand_slug === params.brandSlug);
  }
  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    fallback = fallback.filter(
      (i) =>
        (i.product_title || '').toLowerCase().includes(q) ||
        (i.brand_name || '').toLowerCase().includes(q) ||
        (i.category_name || '').toLowerCase().includes(q)
    );
  }
  if (params.minPricePaise) {
    fallback = fallback.filter((i) => i.selling_price_paise >= params.minPricePaise!);
  }
  if (params.maxPricePaise) {
    fallback = fallback.filter((i) => i.selling_price_paise <= params.maxPricePaise!);
  }
  if (params.inStockOnly) {
    fallback = fallback.filter((i) => i.is_in_stock);
  }

  const totalCount = fallback.length;
  const paged = fallback.slice(offset, offset + limit);

  const fallbackResult: PaginatedCatalogResult = {
    items: paged,
    totalCount,
    page,
    limit,
    totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
    source: 'development_seed',
  };
  listProductsCache.set(cacheKey, { data: fallbackResult, expiresAt: now + 60000 });
  return fallbackResult;
}

function inferPackagingAndUnit(title: string, brand?: string): { unit: string; packSize: string } {
  const t = title.toLowerCase();
  if (t.includes('cement')) {
    return { unit: '50 kg bag', packSize: '50 kg Laminated HDPE Bag' };
  }
  if (t.includes('putty')) {
    return { unit: '40 kg bag', packSize: '40 kg Weatherproof Bag' };
  }
  if (t.includes('wire') || t.includes('cable')) {
    return { unit: '90m coil', packSize: '90m ISI Certified Coil' };
  }
  if (t.includes('pipe') || t.includes('conduit')) {
    return { unit: 'piece', packSize: '3 Metre Heavy-Duty Length' };
  }
  if (t.includes('waterproofing') || t.includes('primer') || t.includes('paint') || t.includes('distemper')) {
    return { unit: 'pack', packSize: 'Commercial Bucket / Container' };
  }
  if (t.includes('adhesive') || t.includes('fevicol')) {
    return { unit: 'pack', packSize: 'Industrial Grade Pack' };
  }
  if (t.includes('tile')) {
    return { unit: 'box', packSize: 'Box of Vitrified Floor Tiles' };
  }
  if (t.includes('plywood') || t.includes('board') || t.includes('sheet')) {
    return { unit: 'sheet', packSize: '8x4 Ft Commercial Board' };
  }
  return { unit: 'piece', packSize: 'Standard Unit' };
}

/**
 * Retrieves a single product by its unique URL slug.
 */
export async function getProductBySlug(slug: string): Promise<PublicCatalogItem | null> {
  const cleanSlug = slug.trim();
  const now = Date.now();
  const cached = productSlugCache.get(cleanSlug);
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  let item: PublicCatalogItem | null = null;
  if (!isDbCircuitBreakerOpen()) {
    try {
      const supabase = createServerSupabaseClient();
      const queryPromise = supabase
        .from('public_catalog_view')
        .select('*')
        .eq('product_slug', cleanSlug)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data) {
            return data as PublicCatalogItem;
          }
          return null;
        });

      item = await withQueryTimeout(queryPromise, 350, null);
      if (item) {
        productSlugCache.set(cleanSlug, { data: item, expiresAt: now + 60000 });
        return item;
      }
    } catch {
      tripDbCircuitBreaker(60000);
    }
  }

  // Check authoritative seed catalog items first for valid UUIDs & statutory HSN
  const seedItem = SEED_CATALOG_ITEMS.find(
    (s) => s.product_slug === cleanSlug || s.product_id === cleanSlug || s.variant_id === cleanSlug
  );
  if (seedItem) {
    productSlugCache.set(cleanSlug, { data: seedItem, expiresAt: now + 60000 });
    return seedItem;
  }

  // Check seed items with fuzzy/relaxed word matching
  const relaxedSeed = SEED_CATALOG_ITEMS.find((s) => {
    const sTokens = s.product_slug.split('-').filter(Boolean);
    const cTokens = cleanSlug.split('-').filter(Boolean);
    const overlap = sTokens.filter((t) => cTokens.includes(t));
    return (
      s.product_slug.startsWith(cleanSlug) ||
      cleanSlug.startsWith(s.product_slug) ||
      (overlap.length >= 3 && sTokens[0] === cTokens[0])
    );
  });
  if (relaxedSeed) {
    productSlugCache.set(cleanSlug, { data: relaxedSeed, expiresAt: now + 60000 });
    return relaxedSeed;
  }

  const catItem = ALL_HOMERUN_PRODUCTS.find(
    (p) => p.slug === cleanSlug || p.id === cleanSlug || p.altSlugs?.includes(cleanSlug)
  );
  if (catItem) {
    // If this homerun product maps to an authoritative seed item, use that instead
    const correspondingSeed = SEED_CATALOG_ITEMS.find(
      (s) => s.product_slug === catItem.slug || s.product_id === catItem.id
    );
    if (correspondingSeed) {
      productSlugCache.set(cleanSlug, { data: correspondingSeed, expiresAt: now + 60000 });
      return correspondingSeed;
    }

    const { unit, packSize } = inferPackagingAndUnit(catItem.title, catItem.brand);
    item = {
      product_id: catItem.id,
      product_title: catItem.title,
      product_slug: catItem.slug,
      short_description: catItem.title,
      description: `${catItem.title}. Quality-verified materials available for jobsite delivery across Ayodhya Dham & nearby hubs.`,
      hsn_code: '2523',
      unit_of_measure: unit,
      is_bulk_available: true,
      is_featured: true,
      specifications: {
        Brand: catItem.brand,
        Quality: 'Standard Grade • Site Inspection on Delivery',
        SLA: 'Scheduled Jobsite Delivery',
        Packaging: packSize,
      },
      images: [catItem.imageUrl],
      tax_rate_pct: 18,
      product_status: 'published' as const,
      category_id: 'c0000000-0000-0000-0000-000000000001',
      category_name: 'Civil & Interiors',
      category_slug: 'tiling',
      brand_id: 'b0000000-0000-0000-0000-000000000001',
      brand_name: catItem.brand,
      brand_slug: catItem.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand_logo: catItem.imageUrl,
      variant_id: `v-${catItem.id}`,
      variant_title: packSize,
      sku: `SKU-${catItem.id}`,
      pack_size: packSize,
      attributes: {},
      min_order_qty: 1,
      max_order_qty: 500,
      weight_kg: 10,
      dimensions_cm: { length: 30, width: 20, height: 10 },
      selling_price_paise: catItem.price * 100,
      mrp_paise: catItem.mrp * 100,
      total_available_stock: 500,
      is_in_stock: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    productSlugCache.set(cleanSlug, { data: item, expiresAt: now + 60000 });
    return item;
  }

  // Relaxed fallback
  const relaxedItem = ALL_HOMERUN_PRODUCTS.find(
    (p) => p.slug.startsWith(cleanSlug) || cleanSlug.startsWith(p.slug)
  );
  if (relaxedItem) {
    const { unit, packSize } = inferPackagingAndUnit(relaxedItem.title, relaxedItem.brand);
    item = {
      product_id: relaxedItem.id,
      product_title: relaxedItem.title,
      product_slug: relaxedItem.slug,
      short_description: relaxedItem.title,
      description: `${relaxedItem.title}. Quality-verified materials available for jobsite delivery across Ayodhya Dham & nearby hubs.`,
      hsn_code: '2523',
      unit_of_measure: unit,
      is_bulk_available: true,
      is_featured: true,
      specifications: {
        Brand: relaxedItem.brand,
        Quality: 'Standard Grade • Site Inspection on Delivery',
        SLA: 'Scheduled Jobsite Delivery',
        Packaging: packSize,
      },
      images: [relaxedItem.imageUrl],
      tax_rate_pct: 18,
      product_status: 'published' as const,
      category_id: 'c0000000-0000-0000-0000-000000000001',
      category_name: 'Civil & Interiors',
      category_slug: 'tiling',
      brand_id: 'b0000000-0000-0000-0000-000000000001',
      brand_name: relaxedItem.brand,
      brand_slug: relaxedItem.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand_logo: relaxedItem.imageUrl,
      variant_id: `v-${relaxedItem.id}`,
      variant_title: packSize,
      sku: `SKU-${relaxedItem.id}`,
      pack_size: packSize,
      attributes: {},
      min_order_qty: 1,
      max_order_qty: 500,
      weight_kg: 10,
      dimensions_cm: { length: 30, width: 20, height: 10 },
      selling_price_paise: relaxedItem.price * 100,
      mrp_paise: relaxedItem.mrp * 100,
      total_available_stock: 500,
      is_in_stock: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    productSlugCache.set(cleanSlug, { data: item, expiresAt: now + 60000 });
    return item;
  }

  productSlugCache.set(cleanSlug, { data: null, expiresAt: now + 15000 });
  return null;
}

/**
 * Retrieves a single product by its UUID.
 */
export async function getProductById(id: string): Promise<PublicCatalogItem | null> {
  const cleanId = id.trim();
  const now = Date.now();
  const cached = productIdCache.get(cleanId);
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  let item: PublicCatalogItem | null = null;
  if (!isDbCircuitBreakerOpen()) {
    try {
      const supabase = createServerSupabaseClient();
      const queryPromise = supabase
        .from('public_catalog_view')
        .select('*')
        .eq('product_id', cleanId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data) {
            return data as PublicCatalogItem;
          }
          return null;
        });

      item = await withQueryTimeout(queryPromise, 350, null);
      if (item) {
        productIdCache.set(cleanId, { data: item, expiresAt: now + 60000 });
        return item;
      }
    } catch {
      tripDbCircuitBreaker(60000);
    }
  }

  // Check authoritative seed catalog items first
  const seedItem = SEED_CATALOG_ITEMS.find(
    (s) => s.product_id === cleanId || s.variant_id === cleanId || s.product_slug === cleanId
  );
  if (seedItem) {
    productIdCache.set(cleanId, { data: seedItem, expiresAt: now + 60000 });
    return seedItem;
  }

  const catItem = ALL_HOMERUN_PRODUCTS.find((p) => p.id === cleanId || p.slug === cleanId);
  if (catItem) {
    const correspondingSeed = SEED_CATALOG_ITEMS.find(
      (s) => s.product_slug === catItem.slug || s.product_id === catItem.id
    );
    if (correspondingSeed) {
      productIdCache.set(cleanId, { data: correspondingSeed, expiresAt: now + 60000 });
      return correspondingSeed;
    }

    const { unit, packSize } = inferPackagingAndUnit(catItem.title, catItem.brand);
    item = {
      product_id: catItem.id,
      product_title: catItem.title,
      product_slug: catItem.slug,
      short_description: catItem.title,
      description: `${catItem.title}. Quality-verified materials available for jobsite delivery across Ayodhya Dham & nearby hubs.`,
      hsn_code: '2523',
      unit_of_measure: unit,
      is_bulk_available: true,
      is_featured: true,
      specifications: {
        Brand: catItem.brand,
        Quality: 'Standard Grade • Site Inspection on Delivery',
        SLA: 'Scheduled Jobsite Delivery',
        Packaging: packSize,
      },
      images: [catItem.imageUrl],
      tax_rate_pct: 18,
      product_status: 'published' as const,
      category_id: 'c0000000-0000-0000-0000-000000000001',
      category_name: 'Civil & Interiors',
      category_slug: 'tiling',
      brand_id: 'b0000000-0000-0000-0000-000000000001',
      brand_name: catItem.brand,
      brand_slug: catItem.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand_logo: catItem.imageUrl,
      variant_id: `v-${catItem.id}`,
      variant_title: packSize,
      sku: `SKU-${catItem.id}`,
      pack_size: packSize,
      attributes: {},
      min_order_qty: 1,
      max_order_qty: 500,
      weight_kg: 10,
      dimensions_cm: { length: 30, width: 20, height: 10 },
      selling_price_paise: catItem.price * 100,
      mrp_paise: catItem.mrp * 100,
      total_available_stock: 500,
      is_in_stock: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    productIdCache.set(cleanId, { data: item, expiresAt: now + 60000 });
    return item;
  }

  productIdCache.set(cleanId, { data: null, expiresAt: now + 15000 });
  return null;
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

    const isPinServiceable = pinData ? Boolean(pinData.is_serviceable) : false;

    if (stockData && stockData.length > 0) {
      const totalStock = stockData.reduce((acc, row) => acc + (row.stock_quantity || 0), 0);
      return {
        isAvailable: totalStock > 0 && isPinServiceable,
        totalStock,
        pincode,
        estimatedDeliveryMinutes: pinData?.estimated_delivery_minutes || 90,
        source: 'database',
      };
    }

    return {
      isAvailable: false,
      totalStock: 0,
      pincode,
      estimatedDeliveryMinutes: pinData?.estimated_delivery_minutes || 0,
      source: 'database',
    };
  } catch {
    return {
      isAvailable: false,
      totalStock: 0,
      pincode,
      estimatedDeliveryMinutes: 0,
      source: 'database',
    };
  }
}

/**
 * Returns all active categories ordered by display hierarchy.
 * Cached in-memory with fast timeout for instantaneous navigation.
 */
export async function getCategories(): Promise<Category[]> {
  const now = Date.now();
  if (cachedCategories && now < cachedCategories.expiresAt) {
    return cachedCategories.data;
  }

  if (!isDbCircuitBreakerOpen()) {
    try {
      const supabase = createServerSupabaseClient();
      const queryPromise = supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            return data as Category[];
          }
          return SEED_CATEGORIES;
        });

      const categories = await withQueryTimeout(queryPromise, 350, SEED_CATEGORIES);
      cachedCategories = {
        data: categories,
        expiresAt: now + (categories !== SEED_CATEGORIES ? 60000 : 15000),
      };
      return categories;
    } catch {
      tripDbCircuitBreaker(60000);
      cachedCategories = { data: SEED_CATEGORIES, expiresAt: now + 15000 };
      return SEED_CATEGORIES;
    }
  }

  cachedCategories = { data: SEED_CATEGORIES, expiresAt: now + 15000 };
  return SEED_CATEGORIES;
}

/**
 * Returns a category by slug.
 * Instant lookup from memory cache (0ms).
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const clean = slug.trim().toLowerCase();
  const allCats = await getCategories();
  const match = allCats.find((c) => c.slug === clean || c.id === clean);
  if (match) return match;
  return SEED_CATEGORIES.find((c) => c.slug === clean) || null;
}

/**
 * Returns all active manufacturer brands.
 * Cached in-memory with fast timeout.
 */
export async function getBrands(): Promise<Brand[]> {
  const now = Date.now();
  if (cachedBrands && now < cachedBrands.expiresAt) {
    return cachedBrands.data;
  }

  if (!isDbCircuitBreakerOpen()) {
    try {
      const supabase = createServerSupabaseClient();
      const queryPromise = supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            return data as Brand[];
          }
          return SEED_BRANDS;
        });

      const brands = await withQueryTimeout(queryPromise, 350, SEED_BRANDS);
      cachedBrands = {
        data: brands,
        expiresAt: now + (brands !== SEED_BRANDS ? 60000 : 15000),
      };
      return brands;
    } catch {
      tripDbCircuitBreaker(60000);
      cachedBrands = { data: SEED_BRANDS, expiresAt: now + 15000 };
      return SEED_BRANDS;
    }
  }

  cachedBrands = { data: SEED_BRANDS, expiresAt: now + 15000 };
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
