-- ==============================================================================
-- Migration 05: Notifications, Admin Settings, Audit Logs, and Row Level Security (RLS)
-- ==============================================================================

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('sms', 'whatsapp', 'in_app', 'email');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 1. NOTIFICATIONS
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);

-- ------------------------------------------------------------------------------
-- 2. ADMIN SETTINGS (Dynamic Key-Value Platform Configuration)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. AUDIT LOGS (Security, Compliance & Fraud Prevention)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- e.g. 'UPDATE_SUPPLIER_STATUS', 'APPROVE_QUOTATION'
  entity_type VARCHAR(100) NOT NULL, -- e.g. 'suppliers', 'orders', 'admin_settings'
  entity_id VARCHAR(100) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Trigger for admin_settings
CREATE TRIGGER set_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Helper function to check if the authenticated user has an 'admin' role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to fetch current authenticated user's role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 5. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 6. RLS POLICIES
-- ------------------------------------------------------------------------------

-- Profiles: Users can view and edit their own profile; Admins full access
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins full manage profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Public Catalog: Anyone (including unauthenticated guests) can view active categories, brands, products, variants, service areas
CREATE POLICY "Public can view active zones" ON public.service_zones FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Public can view active pincodes" ON public.service_pincodes FOR SELECT USING (is_serviceable = true OR public.is_admin());
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Public can view active brands" ON public.brands FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Public can view active variants" ON public.product_variants FOR SELECT USING (is_active = true OR public.is_admin());

-- Public can view active coupons
CREATE POLICY "Public can view active coupons" ON public.coupons FOR SELECT USING (is_active = true AND valid_until > NOW());

-- Supplier Products: Public can view available prices; Supplier can edit own products; Admins full access
CREATE POLICY "Public view available supplier prices" ON public.supplier_products FOR SELECT USING (is_available = true OR public.is_admin());
CREATE POLICY "Suppliers manage own products" ON public.supplier_products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_products.supplier_id AND s.user_id = auth.uid()) OR public.is_admin()
);

-- Suppliers: Public can view verified supplier names; Suppliers view own profile; Admins full access
CREATE POLICY "Public view verified suppliers" ON public.suppliers FOR SELECT USING (verification_status = 'verified' OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Suppliers manage own profile" ON public.suppliers FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage all suppliers" ON public.suppliers FOR ALL USING (public.is_admin());

-- Customer Addresses: Users manage own addresses; Admins full access
CREATE POLICY "Users manage own addresses" ON public.customer_addresses FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- Carts & Cart Items: Users manage own carts; Sessions matched by token
CREATE POLICY "Users manage own carts" ON public.carts FOR ALL USING (user_id = auth.uid() OR session_token IS NOT NULL);
CREATE POLICY "Users manage own cart items" ON public.cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND (c.user_id = auth.uid() OR c.session_token IS NOT NULL))
);

-- Orders & Order Items: Users view own orders; Admins full access
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users insert own orders" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE USING (public.is_admin());

CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()) OR public.is_admin()
);

-- Order Status History: Users view for own orders; Admins full access
CREATE POLICY "Users view order history" ON public.order_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_status_history.order_id AND o.user_id = auth.uid()) OR public.is_admin()
);

-- Payments: Users view payments for their orders; Privileged system handles insertion
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payments.order_id AND o.user_id = auth.uid()) OR public.is_admin()
);

-- Bulk Enquiries: Users manage own enquiries; Admins full access
CREATE POLICY "Users manage own enquiries" ON public.bulk_enquiries FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- Quotations: Users view their quotations; Admins create and manage
CREATE POLICY "Users view own quotations" ON public.quotations FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users view quotation items" ON public.quotation_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Admins manage quotations" ON public.quotations FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage quotation items" ON public.quotation_items FOR ALL USING (public.is_admin());

-- Supplier POs: Supplier views assigned POs; Admins full access
CREATE POLICY "Suppliers view assigned POs" ON public.supplier_purchase_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_purchase_orders.supplier_id AND s.user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Suppliers view assigned PO items" ON public.supplier_po_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.supplier_purchase_orders po JOIN public.suppliers s ON s.id = po.supplier_id WHERE po.id = supplier_po_items.po_id AND s.user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Admins manage all POs" ON public.supplier_purchase_orders FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage all PO items" ON public.supplier_po_items FOR ALL USING (public.is_admin());

-- Delivery Assignments: Drivers view assigned drops; Customers view tracking for their order; Admins full access
CREATE POLICY "Drivers view assigned deliveries" ON public.delivery_assignments FOR SELECT USING (driver_profile_id = auth.uid() OR public.is_admin());
CREATE POLICY "Drivers update assigned status" ON public.delivery_assignments FOR UPDATE USING (driver_profile_id = auth.uid() OR public.is_admin());
CREATE POLICY "Customers view tracking for own order" ON public.delivery_assignments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = delivery_assignments.order_id AND o.user_id = auth.uid())
);
CREATE POLICY "Admins manage delivery assignments" ON public.delivery_assignments FOR ALL USING (public.is_admin());

-- Notifications: Users view and update read status of own notifications
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- Admin Settings: Public can read public settings; Admins manage all
CREATE POLICY "Public read public settings" ON public.admin_settings FOR SELECT USING (is_public = true OR public.is_admin());
CREATE POLICY "Admins manage all settings" ON public.admin_settings FOR ALL USING (public.is_admin());

-- Audit Logs: Admin only read; insert via triggers/server
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
