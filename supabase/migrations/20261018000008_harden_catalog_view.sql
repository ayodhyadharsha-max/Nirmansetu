-- ==============================================================================
-- Migration 08: Harden Public Catalog View (Incremental Remote Sync)
-- Ensures public catalogue ONLY aggregates prices and stock from verified, active suppliers.
-- Safe to execute against an existing database initialized with schema_full.sql.
-- ==============================================================================

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
  -- Public prices: only reflect verified active suppliers
  COALESCE(NULLIF(v.selling_price_paise, 0), MIN(CASE WHEN s.id IS NOT NULL THEN sp.selling_price_paise ELSE NULL END), 0) AS selling_price_paise,
  COALESCE(NULLIF(v.mrp_paise, 0), MAX(CASE WHEN s.id IS NOT NULL THEN sp.mrp_paise ELSE NULL END), 0) AS mrp_paise,
  -- Aggregate stock quantity across verified active local suppliers (anonymized)
  COALESCE(SUM(CASE WHEN s.id IS NOT NULL AND sp.is_available = true THEN sp.stock_quantity ELSE 0 END), 0)::INT AS total_available_stock,
  -- Availability flag: True only if approved verified supplier has positive stock
  CASE
    WHEN COALESCE(SUM(CASE WHEN s.id IS NOT NULL AND sp.is_available = true THEN sp.stock_quantity ELSE 0 END), 0) > 0 THEN true
    ELSE false
  END AS is_in_stock,
  p.created_at,
  p.updated_at
FROM public.products p
JOIN public.categories c ON c.id = p.category_id AND c.is_active = true
LEFT JOIN public.brands b ON b.id = p.brand_id AND b.is_active = true
JOIN public.product_variants v ON v.product_id = p.id AND v.is_active = true AND v.publication_status = 'published'
LEFT JOIN public.supplier_products sp ON sp.variant_id = v.id AND sp.is_available = true
LEFT JOIN public.suppliers s ON s.id = sp.supplier_id AND s.verification_status = 'verified' AND s.is_active = true
WHERE p.is_active = true AND p.publication_status = 'published'
GROUP BY
  p.id, p.title, p.slug, p.short_description, p.description, p.hsn_code,
  p.unit_of_measure, p.is_bulk_available, p.is_featured, p.specifications,
  p.images, p.tax_rate_pct, p.publication_status, c.id, c.name, c.slug,
  b.id, b.name, b.slug, b.logo_url, v.id, v.title, v.sku, v.pack_size,
  v.attributes, v.min_order_qty, v.max_order_qty, v.weight_kg, v.dimensions_cm,
  v.selling_price_paise, v.mrp_paise, p.created_at, p.updated_at;

-- Explicitly grant SELECT permission to anon and authenticated roles
GRANT SELECT ON public.public_catalog_view TO anon, authenticated, service_role;

