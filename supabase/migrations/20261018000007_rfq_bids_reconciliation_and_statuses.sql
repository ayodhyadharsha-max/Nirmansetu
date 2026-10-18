-- ==============================================================================
-- Migration 07: Supplier RFQ Bids, PO Reconciliation, and Extended Fulfillment Statuses
-- ==============================================================================

-- 1. Extend order_status enum with local supplier fulfillment lifecycle states
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'supplier_assigned';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'supplier_confirmed';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'supplier_rejected';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'dispatched';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'failed_delivery';

-- 2. Extend payment_method enum with B2B bank transfer invoice method
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'bank_transfer';

-- 3. Supplier Wholesale Bids Table (Private Wholesale Quotations for Bulk RFQs)
CREATE TABLE IF NOT EXISTS public.supplier_rfq_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES public.bulk_enquiries(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of [{title, unit_cost_paise, available_qty, lead_time_hours, notes}]
  total_procurement_cost_paise BIGINT NOT NULL CHECK (total_procurement_cost_paise >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_rfq_bids_enquiry ON public.supplier_rfq_bids(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_supplier_rfq_bids_supplier ON public.supplier_rfq_bids(supplier_id);

-- 4. Purchase Order Reconciliation Items (Deficit, Overage, Damaged Bags Audit)
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

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.supplier_rfq_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_reconciliation_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for supplier_rfq_bids
-- Platform Admins can inspect and manage all supplier bids
DROP POLICY IF EXISTS admin_manage_supplier_rfq_bids ON public.supplier_rfq_bids;
CREATE POLICY admin_manage_supplier_rfq_bids ON public.supplier_rfq_bids
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Approved Suppliers can view and submit their own bids only
DROP POLICY IF EXISTS supplier_manage_own_rfq_bids ON public.supplier_rfq_bids;
CREATE POLICY supplier_manage_own_rfq_bids ON public.supplier_rfq_bids
  FOR ALL
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM public.suppliers
      WHERE user_id = auth.uid() AND verification_status = 'verified' AND is_active = true
    )
  )
  WITH CHECK (
    supplier_id IN (
      SELECT id FROM public.suppliers
      WHERE user_id = auth.uid() AND verification_status = 'verified' AND is_active = true
    )
  );

-- STRICT PRIVACY: Customers CANNOT read supplier_rfq_bids (Customer view is completely blocked)

-- 7. RLS Policies for po_reconciliation_items
-- Platform Admins can manage all PO reconciliations
DROP POLICY IF EXISTS admin_manage_po_reconciliations ON public.po_reconciliation_items;
CREATE POLICY admin_manage_po_reconciliations ON public.po_reconciliation_items
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Suppliers can view reconciliation discrepancies on POs issued to them
DROP POLICY IF EXISTS supplier_view_own_po_reconciliations ON public.po_reconciliation_items;
CREATE POLICY supplier_view_own_po_reconciliations ON public.po_reconciliation_items
  FOR SELECT
  TO authenticated
  USING (
    po_id IN (
      SELECT spo.id FROM public.supplier_purchase_orders spo
      JOIN public.suppliers s ON s.id = spo.supplier_id
      WHERE s.user_id = auth.uid()
    )
  );
