-- ==============================================================================
-- Migration 03: Coupons, Carts, Orders, Status History, and Payments
-- ==============================================================================

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'draft',
    'submitted',
    'confirmed',
    'po_issued',
    'materials_packed',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending',
    'authorized',
    'paid',
    'failed',
    'refunded',
    'cod_pending'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'razorpay',
    'cod',
    'neft_rtgs',
    'credit_line'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_paise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 1. PROMOTIONAL COUPONS & CASHBACK DISCOUNTS
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active, valid_until);

-- ------------------------------------------------------------------------------
-- 2. CARTS & CART ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token VARCHAR(100) UNIQUE, -- For guest sessions
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  delivery_pincode VARCHAR(6) REFERENCES public.service_pincodes(pincode),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_cart_owner CHECK (user_id IS NOT NULL OR session_token IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_carts_user ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session ON public.carts(session_token);

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

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);

-- ------------------------------------------------------------------------------
-- 3. ORDERS (Single Source of Truth for Customer Transactions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE, -- Human-readable, e.g. NS-AYD-20261018-0012
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status order_status NOT NULL DEFAULT 'draft',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method payment_method NOT NULL DEFAULT 'razorpay',
  delivery_address_id UUID REFERENCES public.customer_addresses(id) ON DELETE SET NULL,
  delivery_address_snapshot JSONB NOT NULL, -- Immutable record of delivery coordinates, street, landmark, instructions
  pincode VARCHAR(6) NOT NULL REFERENCES public.service_pincodes(pincode),
  
  -- Financial calculations stored strictly in INTEGER PAISE (1 INR = 100 paise)
  subtotal_paise BIGINT NOT NULL CHECK (subtotal_paise >= 0),
  tax_paise BIGINT NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),
  delivery_fee_paise BIGINT NOT NULL DEFAULT 0 CHECK (delivery_fee_paise >= 0),
  discount_paise BIGINT NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
  total_paise BIGINT NOT NULL CHECK (total_paise >= 0),
  
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  delivery_otp_hash VARCHAR(128), -- SHA256 of 4-digit dropoff confirmation PIN
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
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_pincode ON public.orders(pincode);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. ORDER ITEMS (Immutable snapshots of purchased variants & supplier assignments)
-- ------------------------------------------------------------------------------
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
CREATE INDEX IF NOT EXISTS idx_order_items_supplier ON public.order_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON public.order_items(variant_id);

-- ------------------------------------------------------------------------------
-- 5. ORDER STATUS HISTORY (Immutable audit trail)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 6. PAYMENTS & WEBHOOK PAYMENT EVENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  payment_method payment_method NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'pending',
  gateway_order_id VARCHAR(100), -- Razorpay order_id (e.g. order_xyz123)
  gateway_payment_id VARCHAR(100), -- Razorpay payment_id (e.g. pay_xyz456)
  gateway_signature VARCHAR(255),
  idempotency_key VARCHAR(120) NOT NULL UNIQUE,
  error_code VARCHAR(50),
  error_description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order ON public.payments(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment ON public.payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON public.payments(idempotency_key);

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  gateway_event_id VARCHAR(100) UNIQUE,
  event_type VARCHAR(100) NOT NULL, -- e.g. 'payment.authorized', 'payment.captured', 'payment.failed'
  payload JSONB NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment ON public.payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_type ON public.payment_events(event_type);

-- Triggers for updated_at
CREATE TRIGGER set_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
