-- ==============================================================================
-- Migration 12: Atomic Order Creation Transaction RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_order_transaction(
  p_order jsonb,
  p_items jsonb,
  p_history jsonb
) RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
BEGIN
  -- 1. Insert Order atomically
  INSERT INTO public.orders (
    id,
    order_number,
    user_id,
    status,
    payment_status,
    payment_method,
    delivery_address_snapshot,
    pincode,
    subtotal_paise,
    tax_paise,
    delivery_fee_paise,
    discount_paise,
    total_paise,
    coupon_id,
    delivery_otp_hash,
    customer_notes,
    internal_notes
  ) VALUES (
    (p_order->>'id')::uuid,
    p_order->>'order_number',
    (p_order->>'user_id')::uuid,
    (p_order->>'status')::order_status,
    (p_order->>'payment_status')::payment_status,
    (p_order->>'payment_method')::payment_method,
    p_order->'delivery_address_snapshot',
    p_order->>'pincode',
    (p_order->>'subtotal_paise')::bigint,
    (p_order->>'tax_paise')::bigint,
    (p_order->>'delivery_fee_paise')::bigint,
    (p_order->>'discount_paise')::bigint,
    (p_order->>'total_paise')::bigint,
    (p_order->>'coupon_id')::uuid,
    p_order->>'delivery_otp_hash',
    p_order->>'customer_notes',
    p_order->>'internal_notes'
  ) RETURNING id INTO v_order_id;

  -- 2. Insert Order Items atomically
  INSERT INTO public.order_items (
    id,
    order_id,
    variant_id,
    supplier_id,
    product_title_snapshot,
    variant_title_snapshot,
    sku_snapshot,
    hsn_code_snapshot,
    unit_snapshot,
    quantity,
    unit_price_paise,
    gst_rate_pct,
    tax_paise,
    total_paise,
    supplier_cost_paise,
    platform_margin_paise
  )
  SELECT
    (item->>'id')::uuid,
    v_order_id,
    (item->>'variant_id')::uuid,
    (item->>'supplier_id')::uuid,
    item->>'product_title_snapshot',
    item->>'variant_title_snapshot',
    item->>'sku_snapshot',
    item->>'hsn_code_snapshot',
    item->>'unit_snapshot',
    (item->>'quantity')::int,
    (item->>'unit_price_paise')::bigint,
    (item->>'gst_rate_pct')::numeric,
    (item->>'tax_paise')::bigint,
    (item->>'total_paise')::bigint,
    (item->>'supplier_cost_paise')::bigint,
    (item->>'platform_margin_paise')::bigint
  FROM jsonb_array_elements(p_items) AS item;

  -- 3. Insert Audit Status History atomically
  INSERT INTO public.order_status_history (
    id,
    order_id,
    previous_status,
    new_status,
    changed_by,
    notes
  ) VALUES (
    (p_history->>'id')::uuid,
    v_order_id,
    NULL,
    (p_history->>'new_status')::order_status,
    (p_history->>'changed_by')::uuid,
    p_history->>'notes'
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', p_order->>'order_number'
  );
EXCEPTION WHEN OTHERS THEN
  -- Re-throw exception: PostgreSQL automatically rolls back the entire block
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.create_order_transaction(jsonb, jsonb, jsonb) TO service_role;
