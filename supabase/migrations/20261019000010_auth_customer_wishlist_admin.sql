-- ==============================================================================
-- Migration 10: Customer Wishlist, Profile Auth Hooks, Invoices & Orders Extensions
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CUSTOMER WISHLIST TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_customer_wishlist_product UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_wishlist_user ON public.customer_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_wishlist_created ON public.customer_wishlist(created_at DESC);

-- Enable RLS on customer_wishlist
ALTER TABLE public.customer_wishlist ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Customers can select own wishlist items" ON public.customer_wishlist;
  CREATE POLICY "Customers can select own wishlist items"
    ON public.customer_wishlist FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Customers can insert own wishlist items" ON public.customer_wishlist;
  CREATE POLICY "Customers can insert own wishlist items"
    ON public.customer_wishlist FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Customers can delete own wishlist items" ON public.customer_wishlist;
  CREATE POLICY "Customers can delete own wishlist items"
    ON public.customer_wishlist FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. ORDERS EXTENSIONS: INVOICES & RETURN REQUESTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS return_reason TEXT,
  ADD COLUMN IF NOT EXISTS return_status VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_invoice ON public.orders(invoice_number);

-- ------------------------------------------------------------------------------
-- 3. PROFILES EXTENSIONS & SECURE HELPER
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20);

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
