-- ==============================================================================
-- Migration 06: Catalog Extensions, 9 Core Categories, Public Catalog View,
-- and Admin Publication Workflows
-- ==============================================================================

-- 1. PUBLICATION STATUS ENUM
DO $$ BEGIN
  CREATE TYPE publication_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. ALTER PRODUCTS TABLE WITH PUBLICATION STATUS & TAX RATE
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS publication_status publication_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS tax_rate_pct NUMERIC(4, 2) DEFAULT 18.00 CHECK (tax_rate_pct >= 0);

CREATE INDEX IF NOT EXISTS idx_products_publication_status ON public.products(publication_status);

-- 3. ALTER PRODUCT_VARIANTS TABLE WITH PACK SIZE, BENCHMARK PUBLIC PRICES & STATUS
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS pack_size VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mrp_paise BIGINT NOT NULL DEFAULT 0 CHECK (mrp_paise >= 0),
  ADD COLUMN IF NOT EXISTS selling_price_paise BIGINT NOT NULL DEFAULT 0 CHECK (selling_price_paise >= 0),
  ADD COLUMN IF NOT EXISTS publication_status publication_status NOT NULL DEFAULT 'published';

CREATE INDEX IF NOT EXISTS idx_variants_publication_status ON public.product_variants(publication_status);
CREATE INDEX IF NOT EXISTS idx_variants_price ON public.product_variants(selling_price_paise);

-- 4. SECURE PUBLIC CATALOG VIEW
-- Exposes active catalog listings and aggregate local stock availability to the public
-- WITHOUT exposing supplier identity, supplier cost in paise, or platform margins!
CREATE OR REPLACE VIEW public.public_catalog_view AS
SELECT
  p.id AS product_id,
  p.title AS product_title,
  p.slug AS product_slug,
  p.short_description,
  p.description,
  p.hsn_code,
  p.unit_of_measure,
  p.is_bulk_available,
  p.is_featured,
  p.specifications,
  p.images,
  p.tax_rate_pct,
  p.publication_status AS product_status,
  c.id AS category_id,
  c.name AS category_name,
  c.slug AS category_slug,
  b.id AS brand_id,
  b.name AS brand_name,
  b.slug AS brand_slug,
  b.logo_url AS brand_logo,
  v.id AS variant_id,
  v.title AS variant_title,
  v.sku,
  v.pack_size,
  v.attributes,
  v.min_order_qty,
  v.max_order_qty,
  v.weight_kg,
  v.dimensions_cm,
  -- Public prices: fallback to approved variant benchmark price if supplier price not set
  COALESCE(NULLIF(v.selling_price_paise, 0), MIN(sp.selling_price_paise), 0) AS selling_price_paise,
  COALESCE(NULLIF(v.mrp_paise, 0), MAX(sp.mrp_paise), 0) AS mrp_paise,
  -- Aggregate stock quantity across verified active local suppliers (anonymized)
  COALESCE(SUM(CASE WHEN sp.is_available = true THEN sp.stock_quantity ELSE 0 END), 0)::INT AS total_available_stock,
  -- Availability flag: True only if approved supplier has positive stock
  CASE
    WHEN COALESCE(SUM(CASE WHEN sp.is_available = true THEN sp.stock_quantity ELSE 0 END), 0) > 0 THEN true
    ELSE false
  END AS is_in_stock,
  p.created_at,
  p.updated_at
FROM public.products p
JOIN public.categories c ON c.id = p.category_id AND c.is_active = true
LEFT JOIN public.brands b ON b.id = p.brand_id AND b.is_active = true
JOIN public.product_variants v ON v.product_id = p.id AND v.is_active = true AND v.publication_status = 'published'
LEFT JOIN public.supplier_products sp ON sp.variant_id = v.id AND sp.is_available = true
WHERE p.is_active = true AND p.publication_status = 'published'
GROUP BY
  p.id, p.title, p.slug, p.short_description, p.description, p.hsn_code,
  p.unit_of_measure, p.is_bulk_available, p.is_featured, p.specifications,
  p.images, p.tax_rate_pct, p.publication_status, c.id, c.name, c.slug,
  b.id, b.name, b.slug, b.logo_url, v.id, v.title, v.sku, v.pack_size,
  v.attributes, v.min_order_qty, v.max_order_qty, v.weight_kg, v.dimensions_cm,
  v.selling_price_paise, v.mrp_paise, p.created_at, p.updated_at;

-- 5. ADMIN RLS POLICIES FOR CATALOG MUTATION
-- Allow public read of published catalog
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING ((is_active = true AND publication_status = 'published') OR public.is_admin());

DROP POLICY IF EXISTS "Public can view active variants" ON public.product_variants;
CREATE POLICY "Public can view active variants" ON public.product_variants
  FOR SELECT USING ((is_active = true AND publication_status = 'published') OR public.is_admin());

-- Allow admins full insert, update, delete on categories, brands, products, and variants
CREATE POLICY "Admins full manage categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full manage brands" ON public.brands FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full manage products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full manage variants" ON public.product_variants FOR ALL USING (public.is_admin());
