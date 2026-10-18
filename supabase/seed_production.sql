-- ==============================================================================
-- NIRMANSETU: PURE PRODUCTION INITIALIZATION SCRIPT (CANONICAL ZERO-DEMO REFERENCE)
-- Target Region: Ayodhya Dham & Faizabad, Uttar Pradesh, India
--
-- STRICT PRODUCTION COMPLIANCE:
-- 1. ZERO demo suppliers, ZERO mock records, ZERO placeholder partners.
-- 2. ZERO fictional GSTINs, phone numbers, or dummy contact details.
-- 3. Product catalog records are seeded in 'draft' status awaiting real stockist assignment.
-- 4. Pincode delivery serviceability is initialized to 'false' until local logistics are operational.
-- 5. Safe for repeated execution via ON CONFLICT clauses.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SERVICE ZONES (Ayodhya & Faizabad Regional Clusters)
-- ------------------------------------------------------------------------------
INSERT INTO public.service_zones (id, name, city, state, description, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Ayodhya Dham Core', 'Ayodhya', 'Uttar Pradesh', 'Ram Janmabhoomi, Naya Ghat, Tedhi Bazar, Ramkot, Hanumangarhi corridor', true),
  ('a0000000-0000-0000-0000-000000000002', 'Faizabad Urban Core', 'Ayodhya', 'Uttar Pradesh', 'Civil Lines, Rikabganj, Chowk, Deokali Road, Rekabganj', true),
  ('a0000000-0000-0000-0000-000000000003', 'Ayodhya South & Bypass Corridor', 'Ayodhya', 'Uttar Pradesh', 'Darshannagar, Sohawal, Bikapur, Highway NH-27 bypass', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ------------------------------------------------------------------------------
-- 2. SERVICE PIN CODES (Authentic Postal PINs - Inactive until logistics operational)
-- ------------------------------------------------------------------------------
INSERT INTO public.service_pincodes (
  pincode, zone_id, area_name, city, district, state,
  is_serviceable, estimated_delivery_minutes, standard_delivery_fee_paise,
  free_delivery_threshold_paise, express_available, express_delivery_fee_paise, notes
)
VALUES
  ('224123', 'a0000000-0000-0000-0000-000000000001', 'Ayodhya Dham (Ramkot, Naya Ghat)', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', false, 60, 19900, 500000, false, 39900, 'Service zone registered. Delivery activation pending local logistics partner onboarding.'),
  ('224001', 'a0000000-0000-0000-0000-000000000002', 'Faizabad Head Post Office / Civil Lines / Chowk', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', false, 90, 19900, 500000, false, 34900, 'Service zone registered. Delivery activation pending local logistics partner onboarding.'),
  ('224133', 'a0000000-0000-0000-0000-000000000003', 'Darshannagar', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', false, 120, 29900, 750000, false, 0, 'Service zone registered. Delivery activation pending local logistics partner onboarding.'),
  ('224122', 'a0000000-0000-0000-0000-000000000003', 'Sohawal', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', false, 150, 39900, 1000000, false, 0, 'Service zone registered. Delivery activation pending local logistics partner onboarding.'),
  ('224229', 'a0000000-0000-0000-0000-000000000003', 'Bikapur', 'Ayodhya', 'Ayodhya (Faizabad)', 'Uttar Pradesh', false, 180, 49900, 1500000, false, 0, 'Service zone registered. Delivery activation pending local logistics partner onboarding.')
ON CONFLICT (pincode) DO UPDATE SET
  area_name = EXCLUDED.area_name,
  district = EXCLUDED.district,
  notes = EXCLUDED.notes;

-- ------------------------------------------------------------------------------
-- 3. THE 9 CORE CONSTRUCTION CATEGORIES (Active Master Taxonomy)
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
  description = EXCLUDED.description,
  default_gst_rate_pct = EXCLUDED.default_gst_rate_pct,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- ------------------------------------------------------------------------------
-- 4. VERIFIED MANUFACTURER BRANDS (Active Master Reference)
-- ------------------------------------------------------------------------------
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
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active;

-- ------------------------------------------------------------------------------
-- 5. MASTER PRODUCT CATALOGUE TEMPLATES (Draft Status - Awaiting Merchant Stock)
-- ------------------------------------------------------------------------------
-- Note: Products are placed in 'draft' status so they cannot be purchased until
-- real stock and prices are configured by an approved stockist.

-- Category 1: Cement & Construction Materials (Unit: bags, pieces, kilograms)
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES
  ('p0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'UltraTech Super PPC Cement', 'ultratech-super-ppc-cement', 'Engineered Portland Pozzolana Cement for structural concrete and slab casting.', 'Manufactured with high reactive fly ash ensuring dense, impermeable concrete.', '252329', 'bags', 'draft', 28.00, '{"standard": "IS 1489 Part 1", "grade": "PPC", "bag_weight_kg": 50}'::jsonb, ARRAY['/images/products/ultratech-super.png']),
  ('p0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Tata Tiscon 550D TMT Steel Rebars', 'tata-tiscon-550d-tmt-rebars', 'Primary Fe 550D grade Super Ductile earthquake-resistant TMT rods.', 'Pure virgin iron ore steel with superior bendability and corrosion resistance.', '721420', 'pieces', 'draft', 18.00, '{"grade": "Fe 550D", "length_m": 12, "standard": "IS 1786:2008"}'::jsonb, ARRAY['/images/products/tata-tiscon.png']),
  ('p0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000002', 'Tata Wiron 18-Gauge Annealed GI Binding Wire', 'tata-wiron-18-gauge-binding-wire', 'Soft annealed corrosion-resistant galvanized iron binding wire for structural reinforcement.', 'High ductility 18-gauge wire engineered for effortless tying of TMT rebars.', '721720', 'kilograms', 'draft', 18.00, '{"gauge": "18 SWG", "finish": "Bright Annealed"}'::jsonb, ARRAY['/images/products/tata-wiron.png'])
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES
  ('v0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', '50 kg Laminated Bag', 'UT-PPC-50KG-BAG', '50 kg Laminated PP Bag', 0, 0, 'draft', 5, 50.00),
  ('v0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', '12mm Diameter (12m Rod)', 'TT-550D-12MM-12M', '12mm x 12m Standard Rod', 0, 0, 'draft', 10, 10.65),
  ('v0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000002', '16mm Diameter (12m Rod)', 'TT-550D-16MM-12M', '16mm x 12m Heavy Column Rod', 0, 0, 'draft', 5, 18.96),
  ('v0000000-0000-0000-0000-000000000012', 'p0000000-0000-0000-0000-000000000011', '25 kg Bundle Coil', 'TATA-WIRON-18G-25KG', '25 kg Bundle Coil', 0, 0, 'draft', 1, 25.00)
ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- Category 2: Tiles & Flooring (Unit: boxes)
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES
  ('p0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'Kajaria Eternity Glazed Vitrified Floor Tiles (600x600mm)', 'kajaria-eternity-vitrified-floor-tiles', 'Premium double-charge glazed vitrified tiles with high stain resistance.', 'Nano-polished vitrified tiles designed to withstand heavy domestic traffic.', '690721', 'boxes', 'draft', 18.00, '{"size_mm": "600 x 600", "pieces_per_box": 4}'::jsonb, ARRAY['/images/products/kajaria-tiles.png'])
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES
  ('v0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000003', 'Box of 4 Tiles (15.5 Sq Ft Coverage)', 'KAJ-GVT-600X600-BOX', 'Box of 4 Tiles (15.5 Sq Ft)', 0, 0, 'draft', 2, 28.00)
ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- Category 3: Paints, Primers & Putty (Unit: litres)
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES
  ('p0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'Asian Paints Apex WeatherProof Exterior Emulsion', 'asian-paints-apex-exterior-emulsion', 'Modified acrylic exterior wall paint with silicon additives providing 5-year weather defence.', 'Resists extreme summer heat and monsoons in UP.', '320910', 'litres', 'draft', 18.00, '{"warranty_years": 5}'::jsonb, ARRAY['/images/products/asian-paints-apex.png'])
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES
  ('v0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000004', '20 Litre Sealed Drum', 'AP-APEX-EXT-20L', '20 Litre Drum', 0, 0, 'draft', 1, 24.50)
ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- Category 4: Electrical Products (Unit: metres)
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES
  ('p0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000006', 'Havells LifeLine Plus 2.5 sq mm FR PVC Insulated Copper Wire', 'havells-lifeline-plus-25-wire', '100% electrolytic oxygen-free high conductivity copper wire with heat-resistant flame retardant insulation.', 'Certified to IS 694 standards.', '854449', 'metres', 'draft', 18.00, '{"cross_section_sq_mm": 2.5, "length_meters": 90}'::jsonb, ARRAY['/images/products/havells-wire.png'])
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES
  ('v0000000-0000-0000-0000-000000000006', 'p0000000-0000-0000-0000-000000000005', '90 Meter Box Coil (Red)', 'HAV-LLP-25-RED-90M', '90 Meter Sealed Coil Box', 0, 0, 'draft', 1, 3.20)
ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- Category 5: Plumbing Pipes & Fittings (Unit: pieces)
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES
  ('p0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000007', 'Supreme Lifeline CPVC Hot & Cold Water Pipe', 'supreme-lifeline-cpvc-pipe', 'Lead-free hot and cold potable water plumbing pipe certified to NSF 14/61 and IS 15778.', 'Handles temperatures up to 93°C without calcification.', '391723', 'pieces', 'draft', 18.00, '{"sdr": "SDR 11", "length_meters": 3}'::jsonb, ARRAY['/images/products/supreme-cpvc.png'])
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES
  ('v0000000-0000-0000-0000-000000000007', 'p0000000-0000-0000-0000-000000000006', '3/4 inch (20mm) - 3 Meter Pipe', 'SUP-CPVC-20MM-3M', '20mm x 3 Meter Pipe', 0, 0, 'draft', 5, 0.72)
ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- Category 6: Sanitaryware & Bathroom Fittings (Unit: pieces)
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES
  ('p0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000008', 'Jaquar Florentine Single Lever Basin Mixer', 'jaquar-florentine-basin-mixer', 'Solid brass chrome finish single lever basin faucet with ceramic disc cartridge.', 'Tested for over 500,000 operating cycles.', '848180', 'pieces', 'draft', 18.00, '{"material": "Solid Brass", "warranty_years": 10}'::jsonb, ARRAY['/images/products/jaquar-mixer.png'])
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES
  ('v0000000-0000-0000-0000-000000000008', 'p0000000-0000-0000-0000-000000000007', 'Chrome Finish Standard Mixer', 'JAQ-FLOR-BM-CHR', 'Individual Boxed Fixture', 0, 0, 'draft', 1, 1.65)
ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- Category 7: Plywood, MDF & Laminates (Unit: pieces)
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES
  ('p0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000009', 'Greenply 710 Marine Grade BWP Plywood (8x4 Ft)', 'greenply-710-marine-bwp-plywood', 'Boiling Water Proof marine plywood bonded with phenol formaldehyde resin.', 'Borer and termite proof with 300-hour boiling water resistance.', '441233', 'pieces', 'draft', 18.00, '{"standard": "IS 710 Marine Grade", "dimensions_ft": "8 x 4"}'::jsonb, ARRAY['/images/products/greenply-bwp.png'])
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES
  ('v0000000-0000-0000-0000-000000000009', 'p0000000-0000-0000-0000-000000000008', '19mm Thickness Sheet (8ft x 4ft)', 'GP-BWP710-19MM-8X4', '8ft x 4ft x 19mm Full Sheet', 0, 0, 'draft', 2, 38.00)
ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- Category 8: Hardware, Tools & Fasteners (Unit: pieces)
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES
  ('p0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000010', 'Godrej Ultra Tribolt Main Door Deadbolt Lock', 'godrej-ultra-tribolt-door-lock', 'High-security 3-bolt antique brass finish main door rim lock.', 'High pull-resistance brass deadbolts with scratch-resistant powder coated body.', '830140', 'pieces', 'draft', 18.00, '{"bolts": "3 Solid Brass Bolts"}'::jsonb, ARRAY['/images/products/godrej-lock.png'])
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES
  ('v0000000-0000-0000-0000-000000000010', 'p0000000-0000-0000-0000-000000000009', 'Antique Brass Rim Lock Kit', 'GOD-TRIBOLT-AB-SET', 'Complete Lock Kit with 4 Keys', 0, 0, 'draft', 1, 1.40)
ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- Category 9: Kitchen & Home Improvement (Unit: pieces)
INSERT INTO public.products (id, category_id, brand_id, title, slug, short_description, description, hsn_code, unit_of_measure, publication_status, tax_rate_pct, specifications, images)
VALUES
  ('p0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000011', 'Sintex 1000 Litre 3-Layer Antimicrobial Overhead Water Storage Tank', 'sintex-1000l-water-tank', '100% virgin food-grade polyethylene water tank with UV protection.', 'Engineered with extra ribs for structural rigidity under harsh sun exposure.', '392510', 'pieces', 'draft', 18.00, '{"capacity_litres": 1000, "layers": 3}'::jsonb, ARRAY['/images/products/sintex-tank.png'])
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.product_variants (id, product_id, title, sku, pack_size, mrp_paise, selling_price_paise, publication_status, min_order_qty, weight_kg)
VALUES
  ('v0000000-0000-0000-0000-000000000011', 'p0000000-0000-0000-0000-000000000010', '1000 Litre 3-Layer Black/White Tank', 'SINT-1000L-3LAY', '1000 Litre Unit with Threaded Lid', 0, 0, 'draft', 1, 28.00)
ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title;

-- ------------------------------------------------------------------------------
-- 6. SUPPLIERS & INVENTORY
-- ------------------------------------------------------------------------------
-- ZERO suppliers, ZERO inventory records, and ZERO unverified prices seeded into production.
-- Real suppliers must submit an application via /supplier-application and undergo
-- KYC document verification by a platform administrator before inventory can be published.
