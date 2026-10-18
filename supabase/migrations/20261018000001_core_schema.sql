-- ==============================================================================
-- Migration 01: Core Extensions, Enums, Profiles, Addresses, and Localization
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'contractor', 'supplier', 'delivery_partner', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE address_type AS ENUM ('site', 'residential', 'commercial');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Extends Supabase auth.users)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 2. SERVICE ZONES & AYODHYA PIN CODES
-- ------------------------------------------------------------------------------
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

CREATE TABLE IF NOT EXISTS public.service_pincodes (
  pincode VARCHAR(6) PRIMARY KEY,
  zone_id UUID REFERENCES public.service_zones(id) ON DELETE SET NULL,
  area_name VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Ayodhya',
  district VARCHAR(100) NOT NULL DEFAULT 'Ayodhya (Faizabad)',
  state VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
  is_serviceable BOOLEAN NOT NULL DEFAULT true,
  estimated_delivery_minutes INT NOT NULL DEFAULT 90, -- 60 to 180 min SLA
  standard_delivery_fee_paise BIGINT NOT NULL DEFAULT 19900 CHECK (standard_delivery_fee_paise >= 0), -- ₹199 in paise
  free_delivery_threshold_paise BIGINT NOT NULL DEFAULT 500000 CHECK (free_delivery_threshold_paise >= 0), -- ₹5000 in paise
  express_available BOOLEAN NOT NULL DEFAULT true,
  express_delivery_fee_paise BIGINT NOT NULL DEFAULT 39900 CHECK (express_delivery_fee_paise >= 0), -- ₹399 in paise
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_pincode_format CHECK (pincode ~ '^[1-9][0-9]{5}$')
);

CREATE INDEX IF NOT EXISTS idx_service_pincodes_zone ON public.service_pincodes(zone_id);
CREATE INDEX IF NOT EXISTS idx_service_pincodes_serviceable ON public.service_pincodes(is_serviceable);

-- ------------------------------------------------------------------------------
-- 3. CUSTOMER DELIVERY ADDRESSES (Sites & Offices)
-- ------------------------------------------------------------------------------
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
  unloading_instructions TEXT, -- e.g. "narrow lane, require small tempo, unload near foundation pit"
  has_truck_access BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user ON public.customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_pincode ON public.customer_addresses(pincode);

-- ------------------------------------------------------------------------------
-- 4. CATEGORIES & BRANDS HIERARCHY
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(display_order);

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
CREATE INDEX IF NOT EXISTS idx_brands_featured ON public.brands(is_featured);

-- Auto-update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_service_zones_updated_at BEFORE UPDATE ON public.service_zones FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_service_pincodes_updated_at BEFORE UPDATE ON public.service_pincodes FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_customer_addresses_updated_at BEFORE UPDATE ON public.customer_addresses FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
