-- ==============================================================================
-- NIRMANSETU: SAFE SEED DATA (AYODHYA DHAM & FAIZABAD PILOT)
-- All demo records are explicitly marked with metadata '{"is_demo": true}'
-- All prices stored in INTEGER PAISE (₹1 = 100 paise)
-- ==============================================================================

-- 1. SERVICE ZONES (Ayodhya, Uttar Pradesh)
INSERT INTO public.service_zones (id, name, city, state, description, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Ayodhya Dham Core', 'Ayodhya', 'Uttar Pradesh', 'Ram Janmabhoomi, Naya Ghat, Tedhi Bazar, Ramkot, Hanumangarhi corridor', true),
  ('a0000000-0000-0000-0000-000000000002', 'Faizabad Urban Core', 'Ayodhya', 'Uttar Pradesh', 'Civil Lines, Rikabganj, Chowk, Deokali Road, Rekabganj', true),
  ('a0000000-0000-0000-0000-000000000003', 'Ayodhya South & Bypass Corridor', 'Ayodhya', 'Uttar Pradesh', 'Darshannagar, Sohawal, Bikapur, Highway NH-27 bypass', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 2. SERVICE PIN CODES (Authentic Postal PINs for Ayodhya District)
INSERT INTO public.service_pincodes (pincode, zone_id, area_name, city, district, state, is_serviceable, estimated_delivery_minutes, standard_delivery_fee_paise, free_delivery_threshold_paise, express_available, express_delivery_fee_paise, notes)
VALUES
  ('224123', 'a0000000-0000-0000-0000-000000000001', 'Ayodhya Dham (Ramkot, Naya Ghat)', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', true, 60, 19900, 500000, true, 39900, 'Express delivery within 60 minutes subject to temple corridor traffic timings'),
  ('224001', 'a0000000-0000-0000-0000-000000000002', 'Faizabad Head Post Office / Civil Lines / Chowk', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', true, 90, 19900, 500000, true, 34900, 'Commercial and residential hub'),
  ('224133', 'a0000000-0000-0000-0000-000000000003', 'Darshannagar', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', true, 120, 29900, 750000, false, 0, 'Heavy construction zone near medical college and railway station'),
  ('224122', 'a0000000-0000-0000-0000-000000000003', 'Sohawal', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', true, 150, 39900, 1000000, false, 0, 'Industrial & residential development cluster'),
  ('224229', 'a0000000-0000-0000-0000-000000000003', 'Bikapur', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', true, 180, 49900, 1500000, false, 0, 'Semi-urban construction delivery')
ON CONFLICT (pincode) DO UPDATE SET
  area_name = EXCLUDED.area_name,
  is_serviceable = EXCLUDED.is_serviceable,
  estimated_delivery_minutes = EXCLUDED.estimated_delivery_minutes;

-- 3. CATEGORIES
INSERT INTO public.categories (id, parent_id, name, slug, description, image_url, display_order, default_gst_rate_pct, is_active)
VALUES
  ('c0000000-0000-0000-0000-000000000001', NULL, 'Cement & Structural Concrete', 'cement-structural-concrete', 'OPC, PPC, and rapid-hardening structural cements', '/images/categories/cement.jpg', 1, 28.00, true),
  ('c0000000-0000-0000-0000-000000000002', NULL, 'Steel & TMT Rebars', 'steel-tmt-rebars', 'Fe 550D primary and secondary TMT rebar rods and binding wire', '/images/categories/steel.jpg', 2, 18.00, true),
  ('c0000000-0000-0000-0000-000000000003', NULL, 'Sand, Aggregates & Bricks', 'sand-aggregates-bricks', 'M-Sand, river sand, blue metal aggregates, red clay bricks & AAC blocks', '/images/categories/aggregates.jpg', 3, 5.00, true),
  ('c0000000-0000-0000-0000-000000000004', NULL, 'Waterproofing & Chemicals', 'waterproofing-chemicals', 'Integral waterproofing, bonding agents, tile adhesives & grouts', '/images/categories/waterproofing.jpg', 4, 18.00, true),
  ('c0000000-0000-0000-0000-000000000005', NULL, 'Plumbing & Water Tanks', 'plumbing-water-tanks', 'CPVC, UPVC, SWR pipes, fittings and 3-layer overhead storage tanks', '/images/categories/plumbing.jpg', 5, 18.00, true),
  ('c0000000-0000-0000-0000-000000000006', NULL, 'Electrical & Wiring', 'electrical-wiring', 'FR PVC insulated copper wires, conduit pipes, modular switchgear', '/images/categories/electrical.jpg', 6, 18.00, true),
  ('c0000000-0000-0000-0000-000000000007', NULL, 'Paints & Wall Finishes', 'paints-wall-finishes', 'Wall putty, acrylic primers, exterior weather-coat & interior emulsions', '/images/categories/paints.jpg', 7, 18.00, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 4. BRANDS
INSERT INTO public.brands (id, name, slug, logo_url, description, origin_country, is_featured, is_active)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'UltraTech Cement', 'ultratech-cement', '/images/brands/ultratech.png', 'The Engineer Choice - flagship Aditya Birla Group cement', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000002', 'Ambuja Cement', 'ambuja-cement', '/images/brands/ambuja.png', 'Giant compressive strength Portland Pozzolana Cement', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000003', 'Tata Tiscon', 'tata-tiscon', '/images/brands/tata-tiscon.png', 'India primary Super Ductile (SD) Fe 550D TMT rebars', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000004', 'Kamdhenu Steel', 'kamdhenu-steel', '/images/brands/kamdhenu.png', 'High corrosion resistance earthquake resistant TMT', 'India', false, true),
  ('b0000000-0000-0000-0000-000000000005', 'Dr. Fixit (Pidilite)', 'dr-fixit', '/images/brands/dr-fixit.png', 'Comprehensive building repair and waterproofing solutions', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000006', 'Supreme Pipes', 'supreme-pipes', '/images/brands/supreme.png', 'CPVC and UPVC piping and sanitary systems', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000007', 'Havells', 'havells', '/images/brands/havells.png', 'Flame retardant electrical cables and distribution gear', 'India', true, true),
  ('b0000000-0000-0000-0000-000000000008', 'Asian Paints', 'asian-paints', '/images/brands/asian-paints.png', 'Waterproof wall putty and exterior weather defense paints', 'India', true, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 5. DEMO SUPPLIERS (Model Partner Profiles - Explicitly Labeled DEMO)
INSERT INTO public.suppliers (id, business_name, trade_name, contact_person, phone, email, gstin, pan, street_address, landmark, city, pincode, state, verification_status, commission_rate_pct, rating, is_active, metadata)
VALUES
  ('s0000000-0000-0000-0000-000000000001', 'Awadh Building Material Mart (DEMO PARTNER)', 'DEMO: Awadh Building Traders', 'DEMO: Rakesh Kumar Verma', '+919450000001', 'supplier1.demo@nirmansetu.in', '09AABCA1234F1Z1', 'AABCA1234F', 'Shop 14, Main Road, Tedhi Bazar', 'Near Hanumangarhi Crossing', 'Ayodhya', '224123', 'Uttar Pradesh', 'verified', 4.50, 4.80, true, '{"is_demo": true, "note": "Demonstration partner profile for Ayodhya Dham core"}'::jsonb),
  ('s0000000-0000-0000-0000-000000000002', 'Ramrajya Iron & Cement Depot (DEMO PARTNER)', 'DEMO: Ramrajya Steel Traders', 'DEMO: Suresh Gupta', '+919450000002', 'supplier2.demo@nirmansetu.in', '09AACCB5678G1Z2', 'AACCB5678G', 'Plot 8, Deokali Bypass Road', 'Opposite Sahadatganj Petrol Pump', 'Ayodhya', '224001', 'Uttar Pradesh', 'verified', 5.00, 4.70, true, '{"is_demo": true, "note": "Demonstration partner profile for Faizabad structural materials"}'::jsonb),
  ('s0000000-0000-0000-0000-000000000003', 'Sarayu Hardware & Electrical Store (DEMO PARTNER)', 'DEMO: Sarayu Hardware Mart', 'DEMO: Amit Mishra', '+919450000003', 'supplier3.demo@nirmansetu.in', '09AACCD9012H1Z3', 'AACCD9012H', 'Station Road, Darshannagar', 'Near Darshannagar Railway Crossing', 'Ayodhya', '224133', 'Uttar Pradesh', 'verified', 6.00, 4.90, true, '{"is_demo": true, "note": "Demonstration partner profile for plumbing, electrical & hardware"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  verification_status = EXCLUDED.verification_status;

-- 6. PRODUCTS & VARIANTS (Structured Construction Catalog)
-- Product 1: UltraTech Super Cement
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, is_bulk_available, is_featured, is_active, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'UltraTech Super PPC Cement (50kg Bag)',
  'ultratech-super-ppc-cement-50kg',
  'Engineered Portland Pozzolana Cement offering superior compressive strength for slab, column and plastering.',
  'UltraTech Super is a finely blended Portland Pozzolana Cement manufactured with high reactive fly ash. It creates dense, impermeable concrete with high resistance to chemical attacks, making it ideal for foundations, slabs, and exterior brickwork in UP climate.',
  '252329',
  'bag',
  true,
  true,
  true,
  '{"grade": "PPC", "bag_weight_kg": 50, "standard": "IS 1489 Part 1", "setting_time_initial_mins": 30, "curing_days_recommended": 14}'::jsonb,
  ARRAY['/images/products/ultratech-super.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, attributes, min_order_qty, max_order_qty, weight_kg, dimensions_cm, is_active)
VALUES (
  'v0000000-0000-0000-0000-000000000001',
  'p0000000-0000-0000-0000-000000000001',
  '50 kg Laminated Polypropylene Bag',
  'UT-PPC-50KG-BAG',
  '{"pack_type": "HDPE/PP Laminated", "weight_kg": 50}'::jsonb,
  5, -- Minimum 5 bags
  500,
  50.00,
  '{"length": 65, "width": 45, "height": 18}'::jsonb,
  true
) ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- Product 2: Tata Tiscon 550D TMT Steel
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, is_bulk_available, is_featured, is_active, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  'Tata Tiscon 550D High Ductility TMT Rebars',
  'tata-tiscon-550d-tmt-rebars',
  'Primary Fe 550D grade high-strength earthquake-resistant thermo-mechanically treated steel rods.',
  'Tata Tiscon 550D rebars are manufactured using pristine iron ore and advanced primary steelmaking technology. Engineered with high ductility and superior bendability to withstand heavy structural loads.',
  '721420',
  'piece',
  true,
  true,
  true,
  '{"grade": "Fe 550D", "yield_strength_mpa": 550, "elongation_pct": 16, "length_per_rod_meters": 12, "standard": "IS 1786:2008"}'::jsonb,
  ARRAY['/images/products/tata-tiscon.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, attributes, min_order_qty, max_order_qty, weight_kg, dimensions_cm, is_active)
VALUES
  ('v0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', '12mm Diameter (12m Rod)', 'TT-550D-12MM-12M', '{"diameter_mm": 12, "length_m": 12}'::jsonb, 10, 1000, 10.65, '{"length": 1200, "diameter": 1.2}'::jsonb, true),
  ('v0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000002', '16mm Diameter (12m Rod)', 'TT-550D-16MM-12M', '{"diameter_mm": 16, "length_m": 12}'::jsonb, 5, 800, 18.96, '{"length": 1200, "diameter": 1.6}'::jsonb, true),
  ('v0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000002', '10mm Diameter (12m Rod)', 'TT-550D-10MM-12M', '{"diameter_mm": 10, "length_m": 12}'::jsonb, 10, 1200, 7.40, '{"length": 1200, "diameter": 1.0}'::jsonb, true)
ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- Product 3: Red Kiln First-Class Clay Bricks
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, is_bulk_available, is_featured, is_active, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000003',
  NULL,
  'Standard First-Class Red Kiln Bricks (Avadh No. 1)',
  'standard-first-class-red-kiln-bricks',
  'Evenly fired kiln red bricks with sharp edges and ringing sound for load-bearing walls.',
  'Locally manufactured high-density red clay bricks fired in Hoffmann kilns in the Sarayu basin. Excellent thermal insulation and load-bearing compressive strength for structural masonry.',
  '690100',
  'piece',
  true,
  true,
  true,
  '{"brick_class": "1st Class", "dimensions_inches": "9 x 4.25 x 2.75", "compressive_strength_psi": 1200, "water_absorption_max_pct": 18}'::jsonb,
  ARRAY['/images/products/red-bricks.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, attributes, min_order_qty, max_order_qty, weight_kg, dimensions_cm, is_active)
VALUES (
  'v0000000-0000-0000-0000-000000000005',
  'p0000000-0000-0000-0000-000000000003',
  'Truckload Batch of 1,000 Bricks',
  'BRICK-AVADH-1K-BATCH',
  '{"lot_size": 1000, "unit": "pieces"}'::jsonb,
  1,
  50,
  3200.00,
  '{"lot_volume_cft": 100}'::jsonb,
  true
) ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- Product 4: Dr. Fixit LW+ Waterproofing Compound
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, is_bulk_available, is_featured, is_active, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000005',
  'Dr. Fixit Pidiproof LW+ Integral Liquid Waterproofing',
  'dr-fixit-pidiproof-lw-plus',
  'Specially formulated integral liquid waterproofing compound for concrete and mortar.',
  'Dr. Fixit Pidiproof LW+ improves the cohesion of concrete mixes, prevents segregation and bleeding, and fills micro-capillaries to stop dampness and efflorescence in plaster and slab casting.',
  '382440',
  'litre',
  true,
  true,
  true,
  '{"dosage": "200ml per 50kg cement bag", "ph": "8.5 - 9.5", "chloride_content": "Nil"}'::jsonb,
  ARRAY['/images/products/dr-fixit-lw.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, attributes, min_order_qty, max_order_qty, weight_kg, dimensions_cm, is_active)
VALUES
  ('v0000000-0000-0000-0000-000000000006', 'p0000000-0000-0000-0000-000000000004', '5 Litre Jerry Can', 'DF-LWPLUS-5L', '{"pack_size_litres": 5}'::jsonb, 1, 100, 5.2, '{"height": 30, "width": 20, "depth": 15}'::jsonb, true),
  ('v0000000-0000-0000-0000-000000000007', 'p0000000-0000-0000-0000-000000000004', '20 Litre Drum', 'DF-LWPLUS-20L', '{"pack_size_litres": 20}'::jsonb, 1, 50, 20.8, '{"height": 45, "diameter": 32}'::jsonb, true)
ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- Product 5: Supreme Lifeline CPVC Pipe
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, is_bulk_available, is_featured, is_active, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000005',
  'c0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000006',
  'Supreme Lifeline CPVC Hot & Cold Water Pipe (SDR 11, 3m)',
  'supreme-lifeline-cpvc-pipe-sdr11',
  'Lead-free hot and cold potable water plumbing pipe certified to NSF 14/61 and IS 15778.',
  'Supreme Lifeline CPVC pipes are designed to handle temperatures up to 93°C without corrosion, scale formation or bacteriological contamination. Ideal for luxury residences, commercial complexes, and ashrams.',
  '391723',
  'piece',
  true,
  false,
  true,
  '{"sdr": "SDR 11", "length_meters": 3, "temperature_rating_c": 93, "standards": "IS 15778 / ASTM D2846"}'::jsonb,
  ARRAY['/images/products/supreme-cpvc.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, attributes, min_order_qty, max_order_qty, weight_kg, dimensions_cm, is_active)
VALUES
  ('v0000000-0000-0000-0000-000000000008', 'p0000000-0000-0000-0000-000000000005', '3/4 inch (20mm) - 3 Meter Pipe', 'SUP-CPVC-20MM-3M', '{"diameter_inch": "3/4", "diameter_mm": 20}'::jsonb, 5, 200, 0.72, '{"length": 300, "diameter": 2}'::jsonb, true),
  ('v0000000-0000-0000-0000-000000000009', 'p0000000-0000-0000-0000-000000000005', '1 inch (25mm) - 3 Meter Pipe', 'SUP-CPVC-25MM-3M', '{"diameter_inch": "1", "diameter_mm": 25}'::jsonb, 5, 200, 1.15, '{"length": 300, "diameter": 2.5}'::jsonb, true)
ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- 7. SUPPLIER PRODUCT PRICING & INVENTORY (All values in INTEGER PAISE)
INSERT INTO public.supplier_products (id, supplier_id, variant_id, supplier_cost_paise, mrp_paise, selling_price_paise, stock_quantity, min_lead_time_hours, is_available, priority_score)
VALUES
  -- UltraTech Cement from Awadh Traders: Cost ₹350 (35000p), MRP ₹420 (42000p), Selling ₹385 (38500p)
  ('sp000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000001', 35000, 42000, 38500, 450, 2, true, 10),
  -- Tata Tiscon 12mm from Ramrajya Depot: Cost ₹680 (68000p), MRP ₹850 (85000p), Selling ₹760 (76000p)
  ('sp000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000002', 'v0000000-0000-0000-0000-000000000002', 68000, 85000, 76000, 300, 2, true, 10),
  -- Tata Tiscon 16mm from Ramrajya Depot: Cost ₹1210 (121000p), MRP ₹1500 (150000p), Selling ₹1350 (135000p)
  ('sp000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000002', 'v0000000-0000-0000-0000-000000000003', 121000, 150000, 135000, 180, 2, true, 10),
  -- Tata Tiscon 10mm from Ramrajya Depot: Cost ₹470 (47000p), MRP ₹600 (60000p), Selling ₹530 (53000p)
  ('sp000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000002', 'v0000000-0000-0000-0000-000000000004', 47000, 60000, 53000, 250, 2, true, 10),
  -- Red Bricks (1k batch) from Awadh Traders: Cost ₹6800 (680000p), MRP ₹8500 (850000p), Selling ₹7500 (750000p)
  ('sp000000-0000-0000-0000-000000000005', 's0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000005', 680000, 850000, 750000, 25, 4, true, 10),
  -- Dr Fixit LW+ 5L from Sarayu Store: Cost ₹720 (72000p), MRP ₹980 (98000p), Selling ₹840 (84000p)
  ('sp000000-0000-0000-0000-000000000006', 's0000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000006', 72000, 98000, 84000, 60, 1, true, 10),
  -- Dr Fixit LW+ 20L from Sarayu Store: Cost ₹2550 (255000p), MRP ₹3400 (340000p), Selling ₹2950 (295000p)
  ('sp000000-0000-0000-0000-000000000007', 's0000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000007', 255000, 340000, 295000, 25, 1, true, 10),
  -- Supreme CPVC 20mm from Sarayu Store: Cost ₹190 (19000p), MRP ₹280 (28000p), Selling ₹235 (23500p)
  ('sp000000-0000-0000-0000-000000000008', 's0000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000008', 19000, 28000, 23500, 150, 1, true, 10),
  -- Supreme CPVC 25mm from Sarayu Store: Cost ₹310 (31000p), MRP ₹440 (44000p), Selling ₹375 (37500p)
  ('sp000000-0000-0000-0000-000000000009', 's0000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000009', 31000, 44000, 37500, 120, 1, true, 10)
ON CONFLICT (supplier_id, variant_id) DO UPDATE SET
  selling_price_paise = EXCLUDED.selling_price_paise,
  stock_quantity = EXCLUDED.stock_quantity;

-- 8. DEMO PROMOTIONAL COUPONS
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_value_paise, max_discount_paise, usage_limit, usage_count, valid_from, valid_until, is_active)
VALUES
  ('cp000000-0000-0000-0000-000000000001', 'AYODHYA100', 'Get ₹100 instant discount on your first construction materials order above ₹2,000', 'fixed_paise', 10000, 200000, 10000, 500, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', true),
  ('cp000000-0000-0000-0000-000000000002', 'BUILDAVADH', '5% discount on bulk orders above ₹20,000 up to ₹2,500 off', 'percentage', 5.00, 2000000, 250000, 200, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '60 days', true)
ON CONFLICT (code) DO NOTHING;

-- 9. ADMIN SETTINGS (Platform Parameters)
INSERT INTO public.admin_settings (key, value, description, is_public)
VALUES
  ('brand_configuration', '{"brand_name": "NirmanSetu", "tagline": "Ayodhya On-Demand Building Materials Marketplace", "support_phone": "+91 94500 00000", "support_email": "support@nirmansetu.in", "gst_registered": false, "hq": "Ayodhya Dham, Uttar Pradesh"}'::jsonb, 'Public marketplace branding settings', true),
  ('delivery_parameters', '{"base_delivery_fee_paise": 19900, "free_delivery_threshold_paise": 500000, "express_delivery_fee_paise": 39900, "operating_hours": "08:00 - 20:00"}'::jsonb, 'Delivery fees, thresholds, and dispatch operational hours', true),
  ('supplier_commission_defaults', '{"default_commission_pct": 5.00, "cement_margin_pct": 4.00, "steel_margin_pct": 3.50, "payout_frequency_days": 7}'::jsonb, 'Internal supplier margin guidelines and payout cycle', false)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value;
