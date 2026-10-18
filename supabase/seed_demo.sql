-- ==============================================================================
-- NIRMANSETU: LOCAL DEVELOPMENT & SANDBOX DEMO SEED SCRIPT
-- Target Region: Ayodhya Dham & Faizabad, Uttar Pradesh, India
--
-- INTENDED USE:
-- For local offline development, automated testing, and UI demonstration only.
--
-- SAFETY GUARDS:
-- 1. All demo suppliers are initialized with verification_status = 'pending' (NEVER 'verified').
-- 2. Demo supplier contacts use reserved sandbox non-routable domains (.internal).
-- 3. GSTIN and PAN fields are strictly NULL (zero fake tax credentials).
-- 4. Demo products and variants are tagged with 'is_demo: true' and 'draft' status.
-- 5. Demo inventory is marked 'is_available: false' and cannot be purchased in the public store.
--
-- DO NOT EXECUTE THIS SCRIPT IN A LIVE PRODUCTION ENVIRONMENT.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SERVICE ZONES & PIN CODES (Configured for local sandbox testing)
-- ------------------------------------------------------------------------------
INSERT INTO public.service_zones (id, name, city, state, description, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Ayodhya Dham Core', 'Ayodhya', 'Uttar Pradesh', 'Ram Janmabhoomi, Naya Ghat, Tedhi Bazar, Ramkot corridor', true),
  ('a0000000-0000-0000-0000-000000000002', 'Faizabad Urban Core', 'Ayodhya', 'Uttar Pradesh', 'Civil Lines, Rikabganj, Chowk, Deokali Road', true),
  ('a0000000-0000-0000-0000-000000000003', 'Ayodhya South & Bypass Corridor', 'Ayodhya', 'Uttar Pradesh', 'Darshannagar, Sohawal, Bikapur corridor', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO public.service_pincodes (
  pincode, zone_id, area_name, city, district, state,
  is_serviceable, estimated_delivery_minutes, standard_delivery_fee_paise,
  free_delivery_threshold_paise, express_available, express_delivery_fee_paise, notes
)
VALUES
  ('224123', 'a0000000-0000-0000-0000-000000000001', '[SANDBOX] Ayodhya Dham (Ramkot, Naya Ghat)', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', true, 60, 19900, 500000, true, 39900, 'Sandbox test delivery zone'),
  ('224001', 'a0000000-0000-0000-0000-000000000002', '[SANDBOX] Faizabad Head Post Office / Civil Lines', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', true, 90, 19900, 500000, true, 34900, 'Sandbox test delivery zone'),
  ('224133', 'a0000000-0000-0000-0000-000000000003', '[SANDBOX] Darshannagar Industrial Hub', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', true, 120, 29900, 750000, false, 0, 'Sandbox test delivery zone'),
  ('224122', 'a0000000-0000-0000-0000-000000000003', '[SANDBOX] Sohawal Development Area', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', true, 150, 39900, 1000000, false, 0, 'Sandbox test delivery zone'),
  ('224229', 'a0000000-0000-0000-0000-000000000003', '[SANDBOX] Bikapur Regional Hub', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', true, 180, 49900, 1500000, false, 0, 'Sandbox test delivery zone')
ON CONFLICT (pincode) DO UPDATE SET
  area_name = EXCLUDED.area_name,
  is_serviceable = EXCLUDED.is_serviceable,
  estimated_delivery_minutes = EXCLUDED.estimated_delivery_minutes;

-- ------------------------------------------------------------------------------
-- 2. CORE CATEGORIES & VERIFIED BRANDS
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (id, parent_id, name, slug, description, image_url, display_order, default_gst_rate_pct, is_active)
VALUES
  ('c0000000-0000-0000-0000-000000000001', NULL, 'Cement & Construction Materials', 'cement-construction-materials', 'OPC, PPC cement, TMT steel rebars, kiln bricks, and structural aggregates', '/images/categories/cement.jpg', 1, 28.00, true),
  ('c0000000-0000-0000-0000-000000000002', NULL, 'Tiles & Flooring', 'tiles-flooring', 'Vitrified floor tiles, wall ceramic tiles, marble flooring, and tile adhesives', '/images/categories/tiles.jpg', 2, 18.00, true),
  ('c0000000-0000-0000-0000-000000000003', NULL, 'Paints, Primers & Putty', 'paints-primers-putty', 'Interior emulsions, exterior weather defence, acrylic wall putty, and primers', '/images/categories/paints.jpg', 3, 18.00, true),
  ('c0000000-0000-0000-0000-000000000004', NULL, 'Electrical Products', 'electrical-products', 'FR PVC copper wires, modular switchboards, conduits, and distribution boxes', '/images/categories/electrical.jpg', 4, 18.00, true),
  ('c0000000-0000-0000-0000-000000000005', NULL, 'Plumbing Pipes & Fittings', 'plumbing-pipes-fittings', 'CPVC, UPVC, SWR drainage pipes, solvent cements, and high-pressure brass valves', '/images/categories/plumbing.jpg', 5, 18.00, true),
  ('c0000000-0000-0000-0000-000000000006', NULL, 'Sanitaryware & Bathroom Fittings', 'sanitaryware-bathroom-fittings', 'Water closets, vanity basins, CP brass faucets, showers, and bathroom mixers', '/images/categories/sanitary.jpg', 6, 18.00, true),
  ('c0000000-0000-0000-0000-000000000007', NULL, 'Plywood, MDF & Laminates', 'plywood-mdf-laminates', 'IS 710 marine grade plywood, boiling water resistant boards, HDHMR, and decorative sheets', '/images/categories/plywood.jpg', 7, 18.00, true),
  ('c0000000-0000-0000-0000-000000000008', NULL, 'Hardware, Tools & Fasteners', 'hardware-tools-fasteners', 'Door locks, stainless steel hinges, power tools, impact drills, and binding wire', '/images/categories/hardware.jpg', 8, 18.00, true),
  ('c0000000-0000-0000-0000-000000000009', NULL, 'Kitchen & Home Improvement', 'kitchen-home-improvement', 'Stainless steel kitchen sinks, 3-layer overhead water storage tanks, and chimneys', '/images/categories/kitchen.jpg', 9, 18.00, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO public.brands (id, name, slug, logo_url, description, origin_country, is_featured, is_active)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'UltraTech Cement', 'ultratech-cement', '/images/brands/ultratech.png', 'Aditya Birla Group flagship cement brand', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000002', 'Tata Tiscon', 'tata-tiscon', '/images/brands/tata-tiscon.png', 'Primary Fe 550D Super Ductile TMT rebars', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000003', 'Kajaria Ceramics', 'kajaria-ceramics', '/images/brands/kajaria.png', 'India largest manufacturer of ceramic and vitrified tiles', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000004', 'Asian Paints', 'asian-paints', '/images/brands/asian-paints.png', 'Premium paints, exterior coatings and wall putty', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000005', 'Dr. Fixit (Pidilite)', 'dr-fixit', '/images/brands/dr-fixit.png', 'Integral waterproofing and structural repair chemicals', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000006', 'Havells', 'havells', '/images/brands/havells.png', 'Flame retardant electrical cables and switchgear', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000007', 'Supreme Industries', 'supreme-industries', '/images/brands/supreme.png', 'Lead-free CPVC, UPVC and drainage piping solutions', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000008', 'Jaquar', 'jaquar', '/images/brands/jaquar.png', 'Complete bathroom and sanitaryware solutions', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000009', 'Greenply', 'greenply', '/images/brands/greenply.png', 'BWP and BWR grade marine plywood', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000010', 'Godrej Locks', 'godrej-locks', '/images/brands/godrej.png', 'Architectural door hardware, deadbolts and security locks', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000011', 'Sintex', 'sintex', '/images/brands/sintex.png', '100% virgin food-grade plastic overhead water storage tanks', 'India', true, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 3. SANDBOX DEMO SUPPLIERS (Pending Verification Only - Never Verified)
-- ------------------------------------------------------------------------------
-- All demo suppliers are flagged with verification_status = 'pending' and is_active = false
-- to test admin approval queues and ensure they cannot fulfill live orders.
INSERT INTO public.suppliers (
  id, business_name, trade_name, contact_person, phone, email,
  gstin, pan, street_address, landmark, city, pincode, state,
  verification_status, commission_rate_pct, rating, is_active, metadata
)
VALUES
  (
    's0000000-0000-0000-0000-000000000001',
    '[DEMO] Awadh Materials Sandbox Stockist',
    'Awadh Demo Sandbox Depot',
    'Sandbox Test Operator',
    '+910000000001',
    'sandbox.supplier1@nirmansetu.internal',
    NULL,
    NULL,
    'Sandbox Test Facility, Tedhi Bazar',
    'Sandbox Landmark',
    'Ayodhya',
    '224123',
    'Uttar Pradesh',
    'pending', -- MUST be pending
    5.00,
    5.00,
    false,    -- Inactive for live transactions
    '{"is_demo": true, "environment": "sandbox", "purchasable": false}'::jsonb
  ),
  (
    's0000000-0000-0000-0000-000000000002',
    '[DEMO] Ramrajya Steel Sandbox Stockist',
    'Ramrajya Demo Depot',
    'Sandbox Test Operator',
    '+910000000002',
    'sandbox.supplier2@nirmansetu.internal',
    NULL,
    NULL,
    'Sandbox Test Facility, Deokali Bypass Road',
    'Sandbox Landmark',
    'Ayodhya',
    '224001',
    'Uttar Pradesh',
    'pending', -- MUST be pending
    5.00,
    5.00,
    false,    -- Inactive for live transactions
    '{"is_demo": true, "environment": "sandbox", "purchasable": false}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  verification_status = 'pending',
  is_active = false;

-- ------------------------------------------------------------------------------
-- 4. DEMO PRODUCTS & VARIANTS (Draft Status - Non-Purchasable)
-- ------------------------------------------------------------------------------
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES
  ('p0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '[DEMO] UltraTech Super PPC Cement', 'demo-ultratech-super-ppc-cement', 'Sandbox demo product template for cement.', 'Sandbox product description.', '252329', 'bags', 'draft', 28.00, '{"is_demo": true}'::jsonb, ARRAY['/images/products/ultratech-super.png']),
  ('p0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '[DEMO] Tata Tiscon 550D TMT Steel Rebars', 'demo-tata-tiscon-550d-tmt-rebars', 'Sandbox demo product template for TMT rebars.', 'Sandbox product description.', '721420', 'pieces', 'draft', 18.00, '{"is_demo": true}'::jsonb, ARRAY['/images/products/tata-tiscon.png'])
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES
  ('v0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', '[DEMO] 50 kg Bag', 'DEMO-UT-PPC-50KG', '50 kg Demo Bag', 42000, 38500, 'draft', 5, 50.00),
  ('v0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', '[DEMO] 12mm x 12m Rod', 'DEMO-TT-550D-12MM', '12mm Demo Rod', 85000, 76000, 'draft', 10, 10.65)
ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- ------------------------------------------------------------------------------
-- 5. DEMO SUPPLIER INVENTORY (Non-Purchasable - is_available = false)
-- ------------------------------------------------------------------------------
INSERT INTO public.supplier_products (id, supplier_id, variant_id, supplier_cost_paise, mrp_paise, selling_price_paise, stock_quantity, min_lead_time_hours, is_available, priority_score)
VALUES
  ('sp000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000001', 35000, 42000, 38500, 0, 2, false, 0),
  ('sp000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000002', 'v0000000-0000-0000-0000-000000000002', 68000, 85000, 76000, 0, 2, false, 0)
ON CONFLICT (supplier_id, variant_id) DO UPDATE SET
  is_available = false,
  stock_quantity = 0;
