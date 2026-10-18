-- ==============================================================================
-- Migration 04: B2B RFQ Quotations, Supplier POs, and Site Delivery Logistics
-- ==============================================================================

DO $$ BEGIN
  CREATE TYPE project_type AS ENUM (
    'residential_house',
    'commercial_complex',
    'hotel_ashram',
    'temple_infrastructure',
    'government_contract',
    'renovation'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enquiry_status AS ENUM ('new', 'reviewing', 'quoted', 'converted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'accepted', 'expired', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE supplier_po_status AS ENUM (
    'issued',
    'accepted',
    'packed',
    'dispatched',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE delivery_vehicle_type AS ENUM (
    'three_wheeler_auto',
    'tata_ace',
    'tipper_truck',
    'tractor_trolley',
    'manual_cart'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM (
    'assigned',
    'arrived_at_pickup',
    'picked_up',
    'in_transit',
    'arrived_at_site',
    'delivered',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 1. BULK ENQUIRIES & CONTRACTOR RFQ
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bulk_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  enquiry_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. RFQ-AYD-2026-0042
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
  material_requirements TEXT NOT NULL, -- Freeform notes or bill of quantities
  structured_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of [{category, title, approx_qty, unit}]
  status enquiry_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Sales/Operations executive
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_bulk_gstin CHECK (gstin IS NULL OR length(gstin) = 15)
);

CREATE INDEX IF NOT EXISTS idx_bulk_enquiries_status ON public.bulk_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_bulk_enquiries_pincode ON public.bulk_enquiries(pincode);
CREATE INDEX IF NOT EXISTS idx_bulk_enquiries_user ON public.bulk_enquiries(user_id);

-- ------------------------------------------------------------------------------
-- 2. FORMAL COMMERCIAL QUOTATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID REFERENCES public.bulk_enquiries(id) ON DELETE SET NULL,
  quotation_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. QT-AYD-2026-0089
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

CREATE INDEX IF NOT EXISTS idx_quotations_enquiry ON public.quotations(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);

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

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON public.quotation_items(quotation_id);

-- ------------------------------------------------------------------------------
-- 3. SUPPLIER PURCHASE ORDERS (Fulfillment Orchestration)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supplier_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. PO-SUP-20261018-001
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

CREATE INDEX IF NOT EXISTS idx_supplier_pos_order ON public.supplier_purchase_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_pos_supplier ON public.supplier_purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_pos_status ON public.supplier_purchase_orders(status);

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

CREATE INDEX IF NOT EXISTS idx_supplier_po_items_po ON public.supplier_po_items(po_id);

-- ------------------------------------------------------------------------------
-- 4. DELIVERY ASSIGNMENTS (Fleet & Driver Dispatch)
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON public.delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON public.delivery_assignments(status);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_driver ON public.delivery_assignments(driver_profile_id);

-- Triggers for updated_at
CREATE TRIGGER set_bulk_enquiries_updated_at BEFORE UPDATE ON public.bulk_enquiries FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_supplier_pos_updated_at BEFORE UPDATE ON public.supplier_purchase_orders FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_delivery_assignments_updated_at BEFORE UPDATE ON public.delivery_assignments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
