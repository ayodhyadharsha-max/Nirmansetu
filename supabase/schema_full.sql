-- ==============================================================================
-- NIRMANSETU: COMPLETE CONSOLIDATED POSTGRESQL / SUPABASE DATABASE SCHEMA
-- Target Region: Ayodhya Dham & Faizabad, Uttar Pradesh, India
-- Currency Standard: All monetary amounts stored strictly in INTEGER PAISE (1 INR = 100 Paise)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'contractor', 'supplier', 'delivery_partner', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE address_type AS ENUM ('site', 'residential', 'commercial');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE supplier_verification_status AS ENUM ('pending', 'verified', 'suspended', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE publication_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'draft', 'submitted', 'confirmed', 'supplier_assigned', 'supplier_confirmed',
    'supplier_rejected', 'processing', 'po_issued', 'materials_packed',
    'dispatched', 'out_for_delivery', 'delivered', 'failed_delivery', 'cancelled', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded', 'cod_pending');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('razorpay', 'cod', 'neft_rtgs', 'credit_line', 'bank_transfer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_paise');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE project_type AS ENUM (
    'residential_house', 'commercial_complex', 'hotel_ashram',
    'temple_infrastructure', 'government_contract', 'renovation'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE enquiry_status AS ENUM ('new', 'reviewing', 'quoted', 'converted', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'accepted', 'expired', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE supplier_po_status AS ENUM ('issued', 'accepted', 'packed', 'dispatched', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE delivery_vehicle_type AS ENUM ('three_wheeler_auto', 'tata_ace', 'tipper_truck', 'tractor_trolley', 'manual_cart');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM ('assigned', 'arrived_at_pickup', 'picked_up', 'in_transit', 'arrived_at_site', 'delivered', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('sms', 'whatsapp', 'in_app', 'email');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TIMESTAMP TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'customer',
  full_name VARCHAR(150),
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  business_name VARCHAR(200),
  gstin VARCHAR(15),
  pan VARCHAR(10),
  is_phone_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_gstin_format CHECK (gstin IS NULL OR length(gstin) = 15)
);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5. SERVICE ZONES & PIN CODES
CREATE TABLE IF NOT EXISTS public.service_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Ayodhya',
  state VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_service_zones_updated_at ON public.service_zones;
CREATE TRIGGER set_service_zones_updated_at BEFORE UPDATE ON public.service_zones FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.service_pincodes (
  pincode VARCHAR(6) PRIMARY KEY,
  zone_id UUID REFERENCES public.service_zones(id) ON DELETE SET NULL,
  area_name VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Ayodhya',
  district VARCHAR(100) NOT NULL DEFAULT 'Ayodhya (Faizabad)',
  state VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
  is_serviceable BOOLEAN NOT NULL DEFAULT true,
  estimated_delivery_minutes INT NOT NULL DEFAULT 90,
  standard_delivery_fee_paise BIGINT NOT NULL DEFAULT 19900 CHECK (standard_delivery_fee_paise >= 0),
  free_delivery_threshold_paise BIGINT NOT NULL DEFAULT 500000 CHECK (free_delivery_threshold_paise >= 0),
  express_available BOOLEAN NOT NULL DEFAULT true,
  express_delivery_fee_paise BIGINT NOT NULL DEFAULT 39900 CHECK (express_delivery_fee_paise >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_pincode_format CHECK (pincode ~ '^[1-9][0-9]{5}$')
);
CREATE INDEX IF NOT EXISTS idx_service_pincodes_zone ON public.service_pincodes(zone_id);
CREATE INDEX IF NOT EXISTS idx_service_pincodes_serviceable ON public.service_pincodes(is_serviceable);
DROP TRIGGER IF EXISTS set_service_pincodes_updated_at ON public.service_pincodes;
CREATE TRIGGER set_service_pincodes_updated_at BEFORE UPDATE ON public.service_pincodes FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 6. CUSTOMER ADDRESSES
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address_type address_type NOT NULL DEFAULT 'site',
  site_or_person_name VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  alternate_phone VARCHAR(20),
  street_address TEXT NOT NULL,
  landmark VARCHAR(200),
  pincode VARCHAR(6) NOT NULL REFERENCES public.service_pincodes(pincode),
  city VARCHAR(100) NOT NULL DEFAULT 'Ayodhya',
  state VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  unloading_instructions TEXT,
  has_truck_access BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user ON public.customer_addresses(user_id);
DROP TRIGGER IF EXISTS set_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER set_customer_addresses_updated_at BEFORE UPDATE ON public.customer_addresses FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 7. CATEGORIES & BRANDS
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  default_gst_rate_pct NUMERIC(4, 2) NOT NULL DEFAULT 18.00 CHECK (default_gst_rate_pct >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL UNIQUE,
  slug VARCHAR(150) NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  origin_country VARCHAR(100) DEFAULT 'India',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON public.brands(slug);
DROP TRIGGER IF EXISTS set_brands_updated_at ON public.brands;
CREATE TRIGGER set_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 8. PRODUCTS & VARIANTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  hsn_code VARCHAR(10),
  unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'piece',
  is_bulk_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  publication_status publication_status NOT NULL DEFAULT 'published',
  tax_rate_pct NUMERIC(4, 2) DEFAULT 18.00 CHECK (tax_rate_pct >= 0),
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_pub_status ON public.products(publication_status);
DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  barcode VARCHAR(50),
  pack_size VARCHAR(100),
  mrp_paise BIGINT NOT NULL DEFAULT 0 CHECK (mrp_paise >= 0),
  selling_price_paise BIGINT NOT NULL DEFAULT 0 CHECK (selling_price_paise >= 0),
  publication_status publication_status NOT NULL DEFAULT 'published',
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
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
CREATE INDEX IF NOT EXISTS idx_variants_pub_status ON public.product_variants(publication_status);
DROP TRIGGER IF EXISTS set_variants_updated_at ON public.product_variants;
CREATE TRIGGER set_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 9. SUPPLIERS & SUPPLIER PRODUCTS
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
DROP TRIGGER IF EXISTS set_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER set_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  supplier_cost_paise BIGINT NOT NULL CHECK (supplier_cost_paise >= 0),
  mrp_paise BIGINT NOT NULL CHECK (mrp_paise >= 0),
  selling_price_paise BIGINT NOT NULL CHECK (selling_price_paise >= 0),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_lead_time_hours INT NOT NULL DEFAULT 2,
  is_available BOOLEAN NOT NULL DEFAULT true,
  priority_score INT NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_supplier_variant UNIQUE (supplier_id, variant_id),
  CONSTRAINT check_selling_vs_mrp CHECK (selling_price_paise <= mrp_paise OR mrp_paise = 0)
);
CREATE INDEX IF NOT EXISTS idx_supplier_products_variant ON public.supplier_products(variant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON public.supplier_products(supplier_id);
DROP TRIGGER IF EXISTS set_supplier_products_updated_at ON public.supplier_products;
CREATE TRIGGER set_supplier_products_updated_at BEFORE UPDATE ON public.supplier_products FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 10. COUPONS, CARTS & CART ITEMS
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_type discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_value_paise BIGINT NOT NULL DEFAULT 0 CHECK (min_order_value_paise >= 0),
  max_discount_paise BIGINT CHECK (max_discount_paise IS NULL OR max_discount_paise >= 0),
  usage_limit INT CHECK (usage_limit IS NULL OR usage_limit > 0),
  usage_count INT NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_coupon_validity_window CHECK (valid_until > valid_from)
);
DROP TRIGGER IF EXISTS set_coupons_updated_at ON public.coupons;
CREATE TRIGGER set_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token VARCHAR(100) UNIQUE,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  delivery_pincode VARCHAR(6) REFERENCES public.service_pincodes(pincode),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_cart_owner CHECK (user_id IS NOT NULL OR session_token IS NOT NULL)
);
DROP TRIGGER IF EXISTS set_carts_updated_at ON public.carts;
CREATE TRIGGER set_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  preferred_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_cart_variant UNIQUE (cart_id, variant_id)
);
DROP TRIGGER IF EXISTS set_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER set_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 11. ORDERS, ITEMS, STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status order_status NOT NULL DEFAULT 'draft',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method payment_method NOT NULL DEFAULT 'razorpay',
  delivery_address_id UUID REFERENCES public.customer_addresses(id) ON DELETE SET NULL,
  delivery_address_snapshot JSONB NOT NULL,
  pincode VARCHAR(6) NOT NULL REFERENCES public.service_pincodes(pincode),
  subtotal_paise BIGINT NOT NULL CHECK (subtotal_paise >= 0),
  tax_paise BIGINT NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),
  delivery_fee_paise BIGINT NOT NULL DEFAULT 0 CHECK (delivery_fee_paise >= 0),
  discount_paise BIGINT NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
  total_paise BIGINT NOT NULL CHECK (total_paise >= 0),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  delivery_otp_hash VARCHAR(128),
  estimated_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  customer_notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_order_total_balance CHECK (total_paise = (subtotal_paise + tax_paise + delivery_fee_paise - discount_paise))
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  product_title_snapshot VARCHAR(255) NOT NULL,
  variant_title_snapshot VARCHAR(200) NOT NULL,
  sku_snapshot VARCHAR(100) NOT NULL,
  hsn_code_snapshot VARCHAR(10),
  unit_snapshot VARCHAR(30) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_paise BIGINT NOT NULL CHECK (unit_price_paise >= 0),
  gst_rate_pct NUMERIC(4, 2) NOT NULL DEFAULT 18.00 CHECK (gst_rate_pct >= 0),
  tax_paise BIGINT NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),
  total_paise BIGINT NOT NULL CHECK (total_paise >= 0),
  supplier_cost_paise BIGINT NOT NULL CHECK (supplier_cost_paise >= 0),
  platform_margin_paise BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status order_status,
  new_status order_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id);

-- 12. PAYMENTS & EVENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  payment_method payment_method NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'pending',
  gateway_order_id VARCHAR(100),
  gateway_payment_id VARCHAR(100),
  gateway_signature VARCHAR(255),
  idempotency_key VARCHAR(120) NOT NULL UNIQUE,
  error_code VARCHAR(50),
  error_description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  gateway_event_id VARCHAR(100) UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. BULK ENQUIRIES & QUOTATIONS
CREATE TABLE IF NOT EXISTS public.bulk_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  enquiry_number VARCHAR(50) NOT NULL UNIQUE,
  contact_name VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(255),
  company_or_firm_name VARCHAR(200),
  gstin VARCHAR(15),
  project_type project_type NOT NULL DEFAULT 'residential_house',
  project_title VARCHAR(200) NOT NULL,
  project_address TEXT NOT NULL,
  pincode VARCHAR(6) NOT NULL REFERENCES public.service_pincodes(pincode),
  estimated_budget_paise BIGINT CHECK (estimated_budget_paise IS NULL OR estimated_budget_paise >= 0),
  target_delivery_date DATE,
  material_requirements TEXT NOT NULL,
  structured_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status enquiry_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_bulk_gstin CHECK (gstin IS NULL OR length(gstin) = 15)
);
CREATE INDEX IF NOT EXISTS idx_bulk_enquiries_status ON public.bulk_enquiries(status);
DROP TRIGGER IF EXISTS set_bulk_enquiries_updated_at ON public.bulk_enquiries;
CREATE TRIGGER set_bulk_enquiries_updated_at BEFORE UPDATE ON public.bulk_enquiries FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID REFERENCES public.bulk_enquiries(id) ON DELETE SET NULL,
  quotation_number VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_name VARCHAR(150) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  client_gstin VARCHAR(15),
  delivery_address TEXT NOT NULL,
  delivery_pincode VARCHAR(6) NOT NULL REFERENCES public.service_pincodes(pincode),
  valid_until DATE NOT NULL,
  subtotal_paise BIGINT NOT NULL CHECK (subtotal_paise >= 0),
  tax_paise BIGINT NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),
  freight_paise BIGINT NOT NULL DEFAULT 0 CHECK (freight_paise >= 0),
  unloading_charges_paise BIGINT NOT NULL DEFAULT 0 CHECK (unloading_charges_paise >= 0),
  total_paise BIGINT NOT NULL CHECK (total_paise >= 0),
  terms_and_conditions TEXT NOT NULL,
  status quotation_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_quotations_updated_at ON public.quotations;
CREATE TRIGGER set_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  item_title VARCHAR(255) NOT NULL,
  specification_description TEXT,
  hsn_code VARCHAR(10),
  unit VARCHAR(30) NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  unit_rate_paise BIGINT NOT NULL CHECK (unit_rate_paise >= 0),
  gst_rate_pct NUMERIC(4, 2) NOT NULL DEFAULT 18.00,
  tax_paise BIGINT NOT NULL DEFAULT 0,
  total_paise BIGINT NOT NULL CHECK (total_paise >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. SUPPLIER POs & DELIVERY ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.supplier_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  status supplier_po_status NOT NULL DEFAULT 'issued',
  total_cost_paise BIGINT NOT NULL CHECK (total_cost_paise >= 0),
  expected_dispatch_at TIMESTAMPTZ,
  actual_dispatch_at TIMESTAMPTZ,
  supplier_invoice_number VARCHAR(100),
  supplier_invoice_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_supplier_pos_updated_at ON public.supplier_purchase_orders;
CREATE TRIGGER set_supplier_pos_updated_at BEFORE UPDATE ON public.supplier_purchase_orders FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.supplier_po_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES public.supplier_purchase_orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_cost_paise BIGINT NOT NULL CHECK (unit_cost_paise >= 0),
  total_cost_paise BIGINT NOT NULL CHECK (total_cost_paise >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  po_id UUID REFERENCES public.supplier_purchase_orders(id) ON DELETE SET NULL,
  driver_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  driver_name VARCHAR(150) NOT NULL,
  driver_phone VARCHAR(20) NOT NULL,
  vehicle_type delivery_vehicle_type NOT NULL DEFAULT 'tata_ace',
  vehicle_registration_number VARCHAR(50) NOT NULL,
  status delivery_status NOT NULL DEFAULT 'assigned',
  pickup_otp VARCHAR(6),
  is_pickup_verified BOOLEAN NOT NULL DEFAULT false,
  delivery_otp VARCHAR(6),
  is_delivery_verified BOOLEAN NOT NULL DEFAULT false,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_latitude NUMERIC(10, 7),
  dropoff_longitude NUMERIC(10, 7),
  current_latitude NUMERIC(10, 7),
  current_longitude NUMERIC(10, 7),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  driver_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_delivery_assignments_updated_at ON public.delivery_assignments;
CREATE TRIGGER set_delivery_assignments_updated_at BEFORE UPDATE ON public.delivery_assignments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 15. NOTIFICATIONS, ADMIN SETTINGS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(255),
  channel notification_channel NOT NULL DEFAULT 'in_app',
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status notification_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER set_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. RLS FUNCTIONS & ENABLEMENT
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pincodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 17. SECURE PUBLIC CATALOG VIEW
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
  COALESCE(NULLIF(v.selling_price_paise, 0), MIN(CASE WHEN s.id IS NOT NULL THEN sp.selling_price_paise ELSE NULL END), 0) AS selling_price_paise,
  COALESCE(NULLIF(v.mrp_paise, 0), MAX(CASE WHEN s.id IS NOT NULL THEN sp.mrp_paise ELSE NULL END), 0) AS mrp_paise,
  COALESCE(SUM(CASE WHEN s.id IS NOT NULL AND sp.is_available = true THEN sp.stock_quantity ELSE 0 END), 0)::INT AS total_available_stock,
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

-- 18. CATALOG ADMIN MUTATION RLS POLICIES
CREATE POLICY "Public read published products" ON public.products
  FOR SELECT USING ((is_active = true AND publication_status = 'published') OR public.is_admin());
CREATE POLICY "Public read published variants" ON public.product_variants
  FOR SELECT USING ((is_active = true AND publication_status = 'published') OR public.is_admin());
CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage product_variants" ON public.product_variants FOR ALL USING (public.is_admin());

-- 19. SUPPLIER RFQ BIDS & PO RECONCILIATION TABLES
CREATE TABLE IF NOT EXISTS public.supplier_rfq_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES public.bulk_enquiries(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_procurement_cost_paise BIGINT NOT NULL CHECK (total_procurement_cost_paise >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_rfq_bids_enquiry ON public.supplier_rfq_bids(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_supplier_rfq_bids_supplier ON public.supplier_rfq_bids(supplier_id);

CREATE TABLE IF NOT EXISTS public.po_reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES public.supplier_purchase_orders(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  ordered_quantity INT NOT NULL CHECK (ordered_quantity > 0),
  supplied_quantity INT NOT NULL CHECK (supplied_quantity >= 0),
  unit_cost_paise BIGINT NOT NULL CHECK (unit_cost_paise >= 0),
  discrepancy_quantity INT GENERATED ALWAYS AS (supplied_quantity - ordered_quantity) STORED,
  reconciliation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_reconciliation_items_po ON public.po_reconciliation_items(po_id);

ALTER TABLE public.supplier_rfq_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_reconciliation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage supplier_rfq_bids" ON public.supplier_rfq_bids
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Suppliers manage own rfq bids" ON public.supplier_rfq_bids
  FOR ALL TO authenticated
  USING (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid() AND verification_status = 'verified' AND is_active = true))
  WITH CHECK (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid() AND verification_status = 'verified' AND is_active = true));

CREATE POLICY "Admins manage po_reconciliations" ON public.po_reconciliation_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Suppliers view own po reconciliations" ON public.po_reconciliation_items
  FOR SELECT TO authenticated
  USING (po_id IN (SELECT spo.id FROM public.supplier_purchase_orders spo JOIN public.suppliers s ON s.id = spo.supplier_id WHERE s.user_id = auth.uid()));


