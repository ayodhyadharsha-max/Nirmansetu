-- ==============================================================================
-- Migration 02: Products, Product Variants, Suppliers, and Supplier Inventory
-- ==============================================================================

DO $$ BEGIN
  CREATE TYPE supplier_verification_status AS ENUM ('pending', 'verified', 'suspended', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 1. PRODUCTS (Master Catalog)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  hsn_code VARCHAR(10),
  unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'piece', -- 'bag', 'ton', 'piece', 'bundle', 'sqft', 'litre', 'kg'
  is_bulk_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- ------------------------------------------------------------------------------
-- 2. PRODUCT VARIANTS (SKU, Size, Grade, Pack)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  barcode VARCHAR(50),
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"grade": "PPC", "weight": "50kg"}, {"diameter_mm": 12, "length_m": 12}
  min_order_qty INT NOT NULL DEFAULT 1 CHECK (min_order_qty > 0),
  max_order_qty INT CHECK (max_order_qty >= min_order_qty),
  weight_kg NUMERIC(10, 2),
  dimensions_cm JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);

-- ------------------------------------------------------------------------------
-- 3. LOCAL SUPPLIERS (Partner Merchants & Stockists in Ayodhya Region)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_name VARCHAR(200) NOT NULL,
  trade_name VARCHAR(200),
  contact_person VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  gstin VARCHAR(15) UNIQUE,
  pan VARCHAR(10),
  street_address TEXT NOT NULL,
  landmark VARCHAR(200),
  city VARCHAR(100) NOT NULL DEFAULT 'Ayodhya',
  pincode VARCHAR(6) NOT NULL REFERENCES public.service_pincodes(pincode),
  state VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  verification_status supplier_verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  commission_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 5.00 CHECK (commission_rate_pct >= 0 AND commission_rate_pct <= 100),
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_supplier_gstin CHECK (gstin IS NULL OR length(gstin) = 15)
);

CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(verification_status);
CREATE INDEX IF NOT EXISTS idx_suppliers_pincode ON public.suppliers(pincode);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);

-- ------------------------------------------------------------------------------
-- 4. SUPPLIER-PRODUCT PRICING & INVENTORY RELATIONSHIP
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  supplier_cost_paise BIGINT NOT NULL CHECK (supplier_cost_paise >= 0), -- Cost negotiated from supplier (in paise)
  mrp_paise BIGINT NOT NULL CHECK (mrp_paise >= 0), -- Maximum Retail Price on pack (in paise)
  selling_price_paise BIGINT NOT NULL CHECK (selling_price_paise >= 0), -- Selling price to customer (in paise)
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_lead_time_hours INT NOT NULL DEFAULT 2, -- e.g. ready in 2 hours for dispatch
  is_available BOOLEAN NOT NULL DEFAULT true,
  priority_score INT NOT NULL DEFAULT 10, -- Higher score preferred for dispatch assignment
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_supplier_variant UNIQUE (supplier_id, variant_id),
  CONSTRAINT check_selling_vs_mrp CHECK (selling_price_paise <= mrp_paise OR mrp_paise = 0)
);

CREATE INDEX IF NOT EXISTS idx_supplier_products_variant ON public.supplier_products(variant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON public.supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_available ON public.supplier_products(is_available, stock_quantity);

-- Triggers for updated_at
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_supplier_products_updated_at BEFORE UPDATE ON public.supplier_products FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
