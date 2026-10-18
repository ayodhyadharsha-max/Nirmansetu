-- ==============================================================================
-- NIRMANSETU: SAFE SEED DATA (AYODHYA DHAM & FAIZABAD 9 CATEGORIES PILOT)
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

-- 3. THE 9 CORE CATEGORIES
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
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- 4. VERIFIED BRANDS
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

-- 5. DEMO SUPPLIERS (Approved Local Merchants)
INSERT INTO public.suppliers (id, business_name, trade_name, contact_person, phone, email, gstin, pan, street_address, landmark, city, pincode, state, verification_status, commission_rate_pct, rating, is_active, metadata)
VALUES
  ('s0000000-0000-0000-0000-000000000001', 'Awadh Building Material Mart (DEMO PARTNER)', 'DEMO: Awadh Building Traders', 'DEMO: Rakesh Kumar Verma', '+919450000001', 'supplier1.demo@nirmansetu.in', '09AABCA1234F1Z1', 'AABCA1234F', 'Shop 14, Main Road, Tedhi Bazar', 'Near Hanumangarhi Crossing', 'Ayodhya', '224123', 'Uttar Pradesh', 'verified', 4.50, 4.80, true, '{"is_demo": true}'::jsonb),
  ('s0000000-0000-0000-0000-000000000002', 'Ramrajya Iron & Cement Depot (DEMO PARTNER)', 'DEMO: Ramrajya Steel Traders', 'DEMO: Suresh Gupta', '+919450000002', 'supplier2.demo@nirmansetu.in', '09AACCB5678G1Z2', 'AACCB5678G', 'Plot 8, Deokali Bypass Road', 'Opposite Sahadatganj Petrol Pump', 'Ayodhya', '224001', 'Uttar Pradesh', 'verified', 5.00, 4.70, true, '{"is_demo": true}'::jsonb),
  ('s0000000-0000-0000-0000-000000000003', 'Sarayu Hardware & Electrical Store (DEMO PARTNER)', 'DEMO: Sarayu Hardware Mart', 'DEMO: Amit Mishra', '+919450000003', 'supplier3.demo@nirmansetu.in', '09AACCD9012H1Z3', 'AACCD9012H', 'Station Road, Darshannagar', 'Near Darshannagar Railway Crossing', 'Ayodhya', '224133', 'Uttar Pradesh', 'verified', 6.00, 4.90, true, '{"is_demo": true}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  verification_status = EXCLUDED.verification_status;

-- 6. PRODUCTS & VARIANTS (Curated across 9 Categories with approved public prices)

-- Category 1: Cement & Construction Materials
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'UltraTech Super PPC Cement',
  'ultratech-super-ppc-cement',
  'Engineered Portland Pozzolana Cement for heavy structural concrete and slab casting.',
  'Manufactured with high reactive fly ash ensuring dense, impermeable concrete with high resistance to dampness in the Gangetic plain climate.',
  '252329',
  'bags',
  'published',
  28.00,
  '{"standard": "IS 1489 Part 1", "grade": "PPC", "bag_weight_kg": 50, "curing_days": 14}'::jsonb,
  ARRAY['/images/products/ultratech-super.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES (
  'v0000000-0000-0000-0000-000000000001',
  'p0000000-0000-0000-0000-000000000001',
  '50 kg Laminated Bag',
  'UT-PPC-50KG-BAG',
  '50 kg Laminated PP Bag',
  42000, -- MRP ₹420
  38500, -- Selling ₹385
  'published',
  5,
  50.00
) ON CONFLICT (sku) DO UPDATE SET selling_price_paise = EXCLUDED.selling_price_paise;

INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'Tata Tiscon 550D TMT Steel Rebars',
  'tata-tiscon-550d-tmt-rebars',
  'Primary Fe 550D grade Super Ductile earthquake-resistant TMT rods.',
  'Pure virgin iron ore steel with superior bendability and corrosion resistance.',
  '721420',
  'pieces',
  'published',
  18.00,
  '{"grade": "Fe 550D", "length_m": 12, "standard": "IS 1786:2008"}'::jsonb,
  ARRAY['/images/products/tata-tiscon.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES
  ('v0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', '12mm Diameter (12m Rod)', 'TT-550D-12MM-12M', '12mm x 12m Standard Rod', 85000, 76000, 'published', 10, 10.65),
  ('v0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000002', '16mm Diameter (12m Rod)', 'TT-550D-16MM-12M', '16mm x 12m Heavy Column Rod', 150000, 135000, 'published', 5, 18.96)
ON CONFLICT (sku) DO UPDATE SET selling_price_paise = EXCLUDED.selling_price_paise;

-- Category 2: Tiles & Flooring
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  'Kajaria Eternity Glazed Vitrified Floor Tiles (600x600mm)',
  'kajaria-eternity-vitrified-floor-tiles',
  'Premium double-charge glazed vitrified tiles with high stain resistance for living and bedroom floors.',
  'Stain-resistant nano-polished vitrified tiles designed to withstand heavy domestic traffic with zero water absorption.',
  '690721',
  'boxes',
  'published',
  18.00,
  '{"finish": "Glossy Nano Polished", "size_mm": "600 x 600", "pieces_per_box": 4, "coverage_sqft_per_box": 15.5}'::jsonb,
  ARRAY['/images/products/kajaria-tiles.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES (
  'v0000000-0000-0000-0000-000000000004',
  'p0000000-0000-0000-0000-000000000003',
  'Box of 4 Tiles (15.5 Sq Ft Coverage)',
  'KAJ-GVT-600X600-BOX',
  'Box of 4 Tiles (15.5 Sq Ft)',
  125000, -- MRP ₹1,250
  105000, -- Selling ₹1,050
  'published',
  2,
  28.00
) ON CONFLICT (sku) DO UPDATE SET selling_price_paise = EXCLUDED.selling_price_paise;

-- Category 3: Paints, Primers & Putty
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000004',
  'Asian Paints Apex WeatherProof Exterior Emulsion',
  'asian-paints-apex-exterior-emulsion',
  'Modified acrylic exterior wall paint with silicon additives providing 5-year weather defence.',
  'Resists extreme summer heat and monsoons in UP. Prevents fungal growth and algae buildup on facade walls.',
  '320910',
  'litres',
  'published',
  18.00,
  '{"warranty_years": 5, "coverage_sqft_per_litre": 60, "sheen": "Soft Sheen", "dilution_water_pct": 40}'::jsonb,
  ARRAY['/images/products/asian-paints-apex.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES (
  'v0000000-0000-0000-0000-000000000005',
  'p0000000-0000-0000-0000-000000000004',
  '20 Litre Sealed Drum',
  'AP-APEX-EXT-20L',
  '20 Litre Drum',
  640000, -- MRP ₹6,400
  528000, -- Selling ₹5,280
  'published',
  1,
  24.50
) ON CONFLICT (sku) DO UPDATE SET selling_price_paise = EXCLUDED.selling_price_paise;

-- Category 4: Electrical Products
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000005',
  'c0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000006',
  'Havells LifeLine Plus 2.5 sq mm FR PVC Insulated Copper Wire',
  'havells-lifeline-plus-25-wire',
  '100% electrolytic oxygen-free high conductivity copper wire with heat-resistant flame retardant insulation.',
  'Certified to IS 694 standards. Certified 101% conductivity to prevent power loss and heating in residential wiring.',
  '854449',
  'metres',
  'published',
  18.00,
  '{"cross_section_sq_mm": 2.5, "length_meters": 90, "voltage_grade_v": 1100, "conductor": "Pure Copper"}'::jsonb,
  ARRAY['/images/products/havells-wire.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES (
  'v0000000-0000-0000-0000-000000000006',
  'p0000000-0000-0000-0000-000000000005',
  '90 Meter Box Coil (Red)',
  'HAV-LLP-25-RED-90M',
  '90 Meter Sealed Coil Box',
  315000, -- MRP ₹3,150
  258000, -- Selling ₹2,580
  'published',
  1,
  3.20
) ON CONFLICT (sku) DO UPDATE SET selling_price_paise = EXCLUDED.selling_price_paise;

-- Category 5: Plumbing Pipes & Fittings
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000006',
  'c0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000007',
  'Supreme Lifeline CPVC Hot & Cold Water Pipe',
  'supreme-lifeline-cpvc-pipe',
  'Lead-free hot and cold potable water plumbing pipe certified to NSF 14/61 and IS 15778.',
  'Handles temperatures up to 93°C without calcification, scale formation, or bacteriological contamination.',
  '391723',
  'pieces',
  'published',
  18.00,
  '{"sdr": "SDR 11", "length_meters": 3, "temperature_rating_c": 93}'::jsonb,
  ARRAY['/images/products/supreme-cpvc.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES (
  'v0000000-0000-0000-0000-000000000007',
  'p0000000-0000-0000-0000-000000000006',
  '3/4 inch (20mm) - 3 Meter Pipe',
  'SUP-CPVC-20MM-3M',
  '20mm x 3 Meter Pipe',
  28000, -- MRP ₹280
  23500, -- Selling ₹235
  'published',
  5,
  0.72
) ON CONFLICT (sku) DO UPDATE SET selling_price_paise = EXCLUDED.selling_price_paise;

-- Category 6: Sanitaryware & Bathroom Fittings
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000007',
  'c0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000008',
  'Jaquar Florentine Single Lever Basin Mixer',
  'jaquar-florentine-basin-mixer',
  'Solid brass chrome finish single lever basin faucet with ceramic disc cartridge.',
  'Tested for over 500,000 operating cycles. Smooth hot and cold temperature blending with water-saving aerator.',
  '848180',
  'pieces',
  'published',
  18.00,
  '{"material": "Solid Brass", "finish": "Chrome Plated", "warranty_years": 10, "cartridge_size_mm": 35}'::jsonb,
  ARRAY['/images/products/jaquar-mixer.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES (
  'v0000000-0000-0000-0000-000000000008',
  'p0000000-0000-0000-0000-000000000007',
  'Chrome Finish Standard Mixer',
  'JAQ-FLOR-BM-CHR',
  'Individual Boxed Fixture',
  460000, -- MRP ₹4,600
  389000, -- Selling ₹3,890
  'published',
  1,
  1.65
) ON CONFLICT (sku) DO UPDATE SET selling_price_paise = EXCLUDED.selling_price_paise;

-- Category 7: Plywood, MDF & Laminates
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000008',
  'c0000000-0000-0000-0000-000000000007',
  'b0000000-0000-0000-0000-000000000009',
  'Greenply 710 Marine Grade BWP Plywood (8x4 Ft)',
  'greenply-710-marine-bwp-plywood',
  'Boiling Water Proof marine plywood bonded with unextended phenol formaldehyde resin.',
  'Borer and termite proof with 300-hour boiling water resistance. Designed for kitchen cabinets and wardrobes.',
  '441233',
  'pieces',
  'published',
  18.00,
  '{"standard": "IS 710 Marine Grade", "dimensions_ft": "8 x 4", "preservative_treatment": "ACC vacuum pressure"}'::jsonb,
  ARRAY['/images/products/greenply-bwp.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES (
  'v0000000-0000-0000-0000-000000000009',
  'p0000000-0000-0000-0000-000000000008',
  '19mm Thickness Sheet (8ft x 4ft)',
  'GP-BWP710-19MM-8X4',
  '8ft x 4ft x 19mm Full Sheet',
  485000, -- MRP ₹4,850
  415000, -- Selling ₹4,150
  'published',
  2,
  38.00
) ON CONFLICT (sku) DO UPDATE SET selling_price_paise = EXCLUDED.selling_price_paise;

-- Category 8: Hardware, Tools & Fasteners
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000009',
  'c0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000010',
  'Godrej Ultra Tribolt Main Door Deadbolt Lock',
  'godrej-ultra-tribolt-door-lock',
  'High-security 3-bolt antique brass finish main door rim lock with 14-pin Ultra key technology.',
  'High pull-resistance brass deadbolts with scratch-resistant powder coated body and inside privacy knob.',
  '830140',
  'pieces',
  'published',
  18.00,
  '{"bolts": "3 Solid Brass Bolts", "keys_included": 4, "door_thickness_mm": "32 - 45", "technology": "14-pin Dimple Key"}'::jsonb,
  ARRAY['/images/products/godrej-lock.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES (
  'v0000000-0000-0000-0000-000000000010',
  'p0000000-0000-0000-0000-000000000009',
  'Antique Brass Rim Lock Kit',
  'GOD-TRIBOLT-AB-SET',
  'Complete Lock Kit with 4 Keys',
  289000, -- MRP ₹2,890
  245000, -- Selling ₹2,450
  'published',
  1,
  1.40
) ON CONFLICT (sku) DO UPDATE SET selling_price_paise = EXCLUDED.selling_price_paise;

INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000011',
  'c0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000002',
  'Tata Wiron 18-Gauge Annealed GI Binding Wire',
  'tata-wiron-18-gauge-binding-wire',
  'Soft annealed corrosion-resistant galvanized iron binding wire for structural reinforcement tying.',
  'High ductility 18-gauge wire engineered for effortless manual tying of TMT rebars without snapping or surface rust.',
  '721720',
  'kilograms',
  'published',
  18.00,
  '{"gauge": "18 SWG", "material": "Hot Dip Galvanized Iron", "finish": "Bright Annealed", "yield_strength_mpa": 350}'::jsonb,
  ARRAY['/images/products/tata-wiron.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES (
  'v0000000-0000-0000-0000-000000000012',
  'p0000000-0000-0000-0000-000000000011',
  '25 kg Bundle Coil',
  'TATA-WIRON-18G-25KG',
  '25 kg Bundle Coil',
  240000, -- MRP ₹2,400
  215000, -- Selling ₹2,150
  'published',
  1,
  25.00
) ON CONFLICT (sku) DO UPDATE SET selling_price_paise = EXCLUDED.selling_price_paise;

INSERT INTO public.supplier_products (id, supplier_id, product_id, variant_id, supplier_sku, supplier_cost_paise, is_available, stock_quantity, lead_time_hours)
VALUES (
  'sp000000-0000-0000-0000-000000000012',
  's0000000-0000-0000-0000-000000000001',
  'p0000000-0000-0000-0000-000000000011',
  'v0000000-0000-0000-0000-000000000012',
  'SUP-TATA-WIRON-25KG',
  195000, -- Private cost ₹1,950
  true,
  150,
  2
) ON CONFLICT (supplier_id, variant_id) DO NOTHING;

-- Category 9: Kitchen & Home Improvement
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES (
  'p0000000-0000-0000-0000-000000000010',
  'c0000000-0000-0000-0000-000000000009',
  'b0000000-0000-0000-0000-000000000011',
  'Sintex 1000 Litre 3-Layer Antimicrobial Overhead Water Storage Tank',
  'sintex-1000l-water-tank',
  '100% virgin food-grade polyethylene water tank with UV protection and antimicrobial inner layer.',
  'Engineered with extra ribs for structural rigidity under harsh sun exposure in Uttar Pradesh summers.',
  '392510',
  'pieces',
  'published',
  18.00,
  '{"capacity_litres": 1000, "layers": 3, "material": "Food Grade LLDPE", "diameter_mm": 1100, "height_mm": 1250}'::jsonb,
  ARRAY['/images/products/sintex-tank.png']
) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES (
  'v0000000-0000-0000-0000-000000000011',
  'p0000000-0000-0000-0000-000000000010',
  '1000 Litre 3-Layer Black/White Tank',
  'SINT-1000L-3LAY',
  '1000 Litre Unit with Threaded Lid',
  750000, -- MRP ₹7,500
  620000, -- Selling ₹6,200
  'published',
  1,
  28.00
) ON CONFLICT (sku) DO UPDATE SET selling_price_paise = EXCLUDED.selling_price_paise;

-- 7. SUPPLIER INVENTORY ALLOCATION (Local stock in Ayodhya)
INSERT INTO public.supplier_products (id, supplier_id, variant_id, supplier_cost_paise, mrp_paise, selling_price_paise, stock_quantity, min_lead_time_hours, is_available, priority_score)
VALUES
  ('sp000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000001', 35000, 42000, 38500, 450, 2, true, 10),
  ('sp000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000002', 'v0000000-0000-0000-0000-000000000002', 68000, 85000, 76000, 300, 2, true, 10),
  ('sp000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000002', 'v0000000-0000-0000-0000-000000000003', 121000, 150000, 135000, 180, 2, true, 10),
  ('sp000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000004', 92000, 125000, 105000, 80, 2, true, 10),
  ('sp000000-0000-0000-0000-000000000005', 's0000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000005', 475000, 640000, 528000, 35, 1, true, 10),
  ('sp000000-0000-0000-0000-000000000006', 's0000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000006', 225000, 315000, 258000, 110, 1, true, 10),
  ('sp000000-0000-0000-0000-000000000007', 's0000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000007', 19000, 28000, 23500, 150, 1, true, 10),
  ('sp000000-0000-0000-0000-000000000008', 's0000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000008', 340000, 460000, 389000, 25, 2, true, 10),
  ('sp000000-0000-0000-0000-000000000009', 's0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000009', 365000, 485000, 415000, 65, 3, true, 10),
  ('sp000000-0000-0000-0000-000000000010', 's0000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000010', 215000, 289000, 245000, 40, 1, true, 10),
  ('sp000000-0000-0000-0000-000000000011', 's0000000-0000-0000-0000-000000000002', 'v0000000-0000-0000-0000-000000000011', 545000, 750000, 620000, 20, 2, true, 10)
ON CONFLICT (supplier_id, variant_id) DO UPDATE SET
  selling_price_paise = EXCLUDED.selling_price_paise,
  stock_quantity = EXCLUDED.stock_quantity;
