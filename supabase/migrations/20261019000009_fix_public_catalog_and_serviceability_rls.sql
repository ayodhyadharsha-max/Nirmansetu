-- ==============================================================================
-- Migration 09: Fix Public Catalog & Serviceability RLS Policies
-- Enables public/anonymous read access for active categories, brands, zones, and
-- serviceable pincodes while strictly preserving RLS security on all private data.
--
-- SAFE FOR EXECUTION:
-- 1. Idempotent: Uses DROP POLICY IF EXISTS before CREATE POLICY.
-- 2. Zero Leakage: Sensitive tables (profiles, customer_addresses, carts, orders,
--    payments, suppliers, audit_logs) REMAIN fully restricted by RLS.
-- 3. Draft Isolation: Draft products (publication_status = 'draft') remain invisible.
-- 4. Pincode Protection: Inactive pincodes (is_serviceable = false) remain invisible.
-- ==============================================================================

-- 1. CATEGORIES RLS POLICIES
DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public read active categories" ON public.categories
  FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins full manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. BRANDS RLS POLICIES
DROP POLICY IF EXISTS "Public read active brands" ON public.brands;
DROP POLICY IF EXISTS "Public can view active brands" ON public.brands;
CREATE POLICY "Public read active brands" ON public.brands
  FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage brands" ON public.brands;
DROP POLICY IF EXISTS "Admins full manage brands" ON public.brands;
CREATE POLICY "Admins manage brands" ON public.brands
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. SERVICE ZONES RLS POLICIES
DROP POLICY IF EXISTS "Public read active service zones" ON public.service_zones;
DROP POLICY IF EXISTS "Public can view active zones" ON public.service_zones;
CREATE POLICY "Public read active service zones" ON public.service_zones
  FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage service zones" ON public.service_zones;
CREATE POLICY "Admins manage service zones" ON public.service_zones
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. SERVICE PINCODES RLS POLICIES
-- Only pincodes marked is_serviceable = true are visible to anonymous users.
-- Inactive pincodes (such as current zero-delivery production seed) remain filtered out.
DROP POLICY IF EXISTS "Public read active service pincodes" ON public.service_pincodes;
DROP POLICY IF EXISTS "Public can view active pincodes" ON public.service_pincodes;
CREATE POLICY "Public read active service pincodes" ON public.service_pincodes
  FOR SELECT
  USING (is_serviceable = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage service pincodes" ON public.service_pincodes;
CREATE POLICY "Admins manage service pincodes" ON public.service_pincodes
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. EXPLICIT POSTGREST SELECT GRANTS
-- Grants SELECT permission to anon (public guests) and authenticated (logged-in customers/dealers)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.brands TO anon, authenticated;
GRANT SELECT ON public.service_zones TO anon, authenticated;
GRANT SELECT ON public.service_pincodes TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT SELECT ON public.public_catalog_view TO anon, authenticated;
