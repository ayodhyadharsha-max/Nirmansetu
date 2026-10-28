export interface HomeRunCategoryItem {
  id: string;
  title: string;
  slug: string;
  badge?: string; // e.g. "Bulk Prices"
  imageUrl: string;
}

export interface ProductOptionItem {
  id: string;
  title: string;
  name?: string;
  packSize?: string;
  mrp?: number;
  price: number;
  discountPct?: number;
  imageUrl?: string;
  inStock?: boolean;
}

export interface HomeRunProductItem {
  id: string;
  title: string;
  slug: string;
  altSlugs?: string[];
  brand: string;
  mrp: number;
  price: number;
  discountPct: number;
  cashbackText?: string;
  bulkPriceText?: string;
  optionsCount?: number; // e.g. 7 Options, 4 Options
  options?: ProductOptionItem[];
  badges: string[]; // e.g. ["Site Delivery", "Pay on Delivery"]
  subBadge?: string; // e.g. "QR Code Original Checked"
  extraTags?: string[];
  imageUrl: string;
  inStock: boolean;
}

// 24 Category Squircles matching home-run.co screenshots
export const HOMERUN_CATEGORIES: HomeRunCategoryItem[] = [
  // Row 1
  {
    id: 'cement',
    title: 'Cement',
    slug: 'cement-construction-materials',
    imageUrl: '/images/categories/cement.png',
  },
  {
    id: 'tiling',
    title: 'Tiling',
    slug: 'tiles-flooring',
    imageUrl: '/images/categories/tiling.png',
  },
  {
    id: 'painting',
    title: 'Painting',
    slug: 'paints-primers-putty',
    imageUrl: '/images/categories/painting.png',
  },
  {
    id: 'water-proofing',
    title: 'Water Proofing',
    slug: 'paints-primers-putty',
    imageUrl: '/images/categories/water_proofing.png',
  },
  {
    id: 'plywood',
    title: 'Plywood, MDF & HDHMR',
    slug: 'plywood-mdf-laminates',
    imageUrl: '/images/categories/plywood.png',
  },
  {
    id: 'fevicol',
    title: 'Fevicol & Adhesives',
    slug: 'hardware-tools-fasteners',
    imageUrl: '/images/categories/fevicol.png',
  },

  // Row 2
  {
    id: 'wires-mcb',
    title: 'Wires, MCB & Distribution Boards',
    slug: 'electrical-products',
    imageUrl: '/images/categories/wires.png',
  },
  {
    id: 'kitchen-sinks',
    title: 'Kitchen Sinks & Faucets',
    slug: 'kitchen-home-improvement',
    imageUrl: '/images/categories/sinks.jpg',
  },
  {
    id: 'sanitary-bath',
    title: 'Sanitary & Bath Fittings',
    slug: 'sanitaryware-bathroom-fittings',
    imageUrl: '/images/categories/sanitary.png',
  },
  {
    id: 'switches-sockets',
    title: 'Switches & Sockets',
    slug: 'electrical-products',
    imageUrl: '/images/categories/switches.png',
  },
  {
    id: 'hinges-channels',
    title: 'Hinges, Channels & Handles',
    slug: 'hardware-tools-fasteners',
    imageUrl: '/images/categories/hinges.png',
  },
  {
    id: 'kitchen-systems',
    title: 'Kitchen Systems & Accessories',
    slug: 'kitchen-home-improvement',
    imageUrl: '/images/categories/kitchen_systems.png',
  },

  // Row 3
  {
    id: 'wardrobe-bed',
    title: 'Wardrobe & Bed Fittings',
    slug: 'hardware-tools-fasteners',
    imageUrl: '/images/categories/wardrobe.png',
  },
  {
    id: 'door-locks',
    title: 'Door Locks & Hardware',
    slug: 'hardware-tools-fasteners',
    imageUrl: '/images/categories/locks.png',
  },
  {
    id: 'conduits-boxes',
    title: 'Conduits & GI Boxes',
    slug: 'electrical-products',
    imageUrl: '/images/categories/conduits.png',
  },
  {
    id: 'lighting',
    title: 'Lighting',
    slug: 'electrical-products',
    imageUrl: '/images/categories/lighting.png',
  },
  {
    id: 'cpvc-tanks',
    title: 'CPVC Pipes & Overhead Tanks',
    slug: 'plumbing-pipes-fittings',
    imageUrl: '/images/categories/cpvc.png',
  },
  {
    id: 'ceiling-fans',
    title: 'Ceiling Fans & Exhaust',
    slug: 'electrical-products',
    imageUrl: '/images/categories/ceiling_fans.png',
  },

  // Row 4
  {
    id: 'power-tools',
    title: 'Power Tools & Accessories',
    slug: 'hardware-tools-fasteners',
    imageUrl: '/images/categories/power_tools.png',
  },
  {
    id: 'cctv-surveillance',
    title: 'CCTV & Surveillance',
    slug: 'electrical-products',
    imageUrl: '/images/categories/cctv_surveillance.png',
  },
  {
    id: 'home-appliances',
    title: 'Home Appliances & Power Backup',
    slug: 'electrical-products',
    imageUrl: '/images/categories/home_appliances.png',
  },
  {
    id: 'general-hardware',
    title: 'General Hardware & Tools',
    slug: 'hardware-tools-fasteners',
    imageUrl: '/images/categories/general_hardware.png',
  },
  {
    id: 'safety-tools',
    title: 'Safety Tool & Workwear',
    slug: 'hardware-tools-fasteners',
    imageUrl: '/images/categories/safety_tools.png',
  },
  {
    id: 'glass-hardware',
    title: 'Glass Door Hardware',
    slug: 'hardware-tools-fasteners',
    imageUrl: '/images/categories/glass_hardware.png',
  },
];

// 1. Deals of the Week (8 items for full carousel pagination)
export const DEALS_OF_THE_WEEK: HomeRunProductItem[] = [
  {
    id: 'deal-1',
    title: 'Ultratech PPC Cement, 50 Kg Bag',
    slug: 'ultratech-super-ppc-cement',
    altSlugs: ['ultratech-super-cement-50kg', 'ultratech-super-ppc-cement-50kg', 'ultratech-ppc-cement-50kg', 'ultratech-cement'],
    brand: 'UltraTech Cement',
    mrp: 450,
    price: 425,
    discountPct: 6,
    bulkPriceText: 'Unlock Bulk Prices of ₹395',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/ultratech_cement.png',
    inStock: true,
  },
  {
    id: 'asian-paints-putty-40kg',
    title: 'Asian Paints TruCare Acrylic Exterior Wall Putty 40 Kg Waterproof Base',
    slug: 'asian-paints-trucare-wall-putty-40kg',
    altSlugs: ['asian-paints-trucare-acrylic-exterior-wall-putty-40kg', 'asian-paints-trucare-putty', 'asian-paints-trucare-putty-40kg'],
    brand: 'Asian Paints',
    mrp: 1150,
    price: 980,
    discountPct: 15,
    bulkPriceText: 'Guaranteed Lowest Rates',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/asian_paints_primer.png',
    inStock: true,
  },
  {
    id: 'deal-2',
    title: "Action Tesa HDHMR Board, Plain, 8' X 4'",
    slug: 'action-tesa-hdhmr-board-plain-8x4',
    brand: 'Action Tesa',
    mrp: 729,
    price: 514,
    discountPct: 29,
    subBadge: 'QR Code Original Checked',
    optionsCount: 7,
    options: [
      {
        id: 'action-tesa-5.5mm',
        title: "5.5 mm (8' x 4')",
        mrp: 780,
        price: 514,
        imageUrl: '/images/products/action_tesa.png',
      },
      {
        id: 'action-tesa-8mm',
        title: "8 mm (8' x 4')",
        mrp: 1050,
        price: 760,
        imageUrl: '/images/products/action_tesa.png',
      },
      {
        id: 'action-tesa-12mm',
        title: "12 mm (8' x 4')",
        mrp: 1480,
        price: 1120,
        imageUrl: '/images/products/action_tesa.png',
      },
      {
        id: 'action-tesa-16mm',
        title: "16 mm (8' x 4')",
        mrp: 1890,
        price: 1450,
        imageUrl: '/images/products/action_tesa.png',
      },
      {
        id: 'action-tesa-18mm',
        title: "18 mm (8' x 4')",
        mrp: 2150,
        price: 1680,
        imageUrl: '/images/products/action_tesa.png',
      },
      {
        id: 'action-tesa-25mm',
        title: "25 mm (8' x 4')",
        mrp: 2950,
        price: 2350,
        imageUrl: '/images/products/action_tesa.png',
      },
      {
        id: 'action-tesa-30mm',
        title: "30 mm (8' x 4')",
        mrp: 3550,
        price: 2890,
        imageUrl: '/images/products/action_tesa.png',
      },
    ],
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/action_tesa.png',
    inStock: true,
  },
  {
    id: 'deal-3',
    title: 'Asian Paints SmartCare Damp Sheath Interior Advanced Waterproofing Primer, 20L',
    slug: 'asian-paints-apex-exterior-emulsion',
    brand: 'Asian Paints',
    mrp: 3500,
    price: 3190,
    discountPct: 9,
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/asian_paints_primer.png',
    inStock: true,
  },
  {
    id: 'deal-4',
    title: 'KEI Homecab FR Wire, 90m',
    slug: 'kei-homecab-fr-wire-90m',
    brand: 'KEI Wires',
    mrp: 3811,
    price: 1906,
    discountPct: 50,
    optionsCount: 6,
    options: [
      {
        id: 'kei-0.75sqmm',
        title: '0.75 sq mm (90m Coil)',
        mrp: 1350,
        price: 980,
        imageUrl: '/images/products/kei_wire.png',
      },
      {
        id: 'kei-1.0sqmm',
        title: '1.0 sq mm (90m Coil)',
        mrp: 1850,
        price: 1390,
        imageUrl: '/images/products/kei_wire.png',
      },
      {
        id: 'kei-1.5sqmm',
        title: '1.5 sq mm (90m Coil)',
        mrp: 2580,
        price: 1906,
        imageUrl: '/images/products/kei_wire.png',
      },
      {
        id: 'kei-2.5sqmm',
        title: '2.5 sq mm (90m Coil)',
        mrp: 4150,
        price: 3150,
        imageUrl: '/images/products/kei_wire.png',
      },
      {
        id: 'kei-4.0sqmm',
        title: '4.0 sq mm (90m Coil)',
        mrp: 6300,
        price: 4890,
        imageUrl: '/images/products/kei_wire.png',
      },
      {
        id: 'kei-6.0sqmm',
        title: '6.0 sq mm (90m Coil)',
        mrp: 9400,
        price: 7350,
        imageUrl: '/images/products/kei_wire.png',
      },
    ],
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/kei_wire.png',
    inStock: true,
  },
  {
    id: 'deal-5',
    title: 'Dongcheng Angle Grinder 100mm, 13000 RPM',
    slug: 'dongcheng-angle-grinder-100mm',
    brand: 'Dongcheng Tools',
    mrp: 2899,
    price: 2159,
    discountPct: 26,
    optionsCount: 2,
    options: [
      {
        id: 'dongcheng-100mm',
        title: '100 mm (850W Spindle)',
        mrp: 2899,
        price: 2159,
        imageUrl: '/images/products/dongcheng_grinder.png',
      },
      {
        id: 'dongcheng-125mm',
        title: '125 mm (1050W Heavy Spindle)',
        mrp: 3699,
        price: 2890,
        imageUrl: '/images/products/dongcheng_grinder.png',
      },
    ],
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/dongcheng_grinder.png',
    inStock: true,
  },
  {
    id: 'deal-6',
    title: 'Tata Tiscon 550D TMT Rebar 12mm Primary Super Ductile Steel',
    slug: 'tata-tiscon-550d-tmt-rebars-12mm',
    brand: 'Tata Tiscon',
    mrp: 76,
    price: 68,
    discountPct: 11,
    bulkPriceText: 'Unlock Mill Rates of ₹64/kg',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/tata_tiscon.png',
    inStock: true,
  },
  {
    id: 'deal-7',
    title: 'Supreme Lifeline CPVC High Pressure Pipe 1 Inch, 3m',
    slug: 'supreme-lifeline-cpvc-pipe',
    brand: 'Supreme Industries',
    mrp: 520,
    price: 440,
    discountPct: 15,
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/supreme_cpvc.png',
    inStock: true,
  },
  {
    id: 'deal-8',
    title: 'Kajaria Eternity Vitrified Floor Tiles, 600mm x 1200mm Premium Finish',
    slug: 'kajaria-eternity-vitrified-floor-tiles',
    brand: 'Kajaria Ceramics',
    mrp: 850,
    price: 720,
    discountPct: 15,
    optionsCount: 4,
    options: [
      {
        id: 'kajaria-statuario',
        title: 'Statuario White (600x1200 mm)',
        mrp: 950,
        price: 780,
        imageUrl: '/images/products/kajaria_tiles.png',
      },
      {
        id: 'kajaria-royal-marfil',
        title: 'Royal Marfil Beige (600x1200 mm)',
        mrp: 920,
        price: 760,
        imageUrl: '/images/products/kajaria_tiles.png',
      },
      {
        id: 'kajaria-armani-bronze',
        title: 'Armani Bronze Matt (600x1200 mm)',
        mrp: 890,
        price: 740,
        imageUrl: '/images/products/kajaria_tiles.png',
      },
      {
        id: 'kajaria-nero-black',
        title: 'Nero Black Polished (600x1200 mm)',
        mrp: 980,
        price: 820,
        imageUrl: '/images/products/kajaria_tiles.png',
      },
    ],
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/kajaria_tiles.png',
    inStock: true,
  },
];

// 2. Popular Construction Materials (8 items)
export const POPULAR_CONSTRUCTION_MATERIALS: HomeRunProductItem[] = [
  {
    id: 'pop-1',
    title: 'Tata Tiscon Fe 550D TMT Rebar Bundle, 12mm Standard Commercial Length',
    slug: 'tata-tiscon-550d-tmt-rebars-12mm',
    brand: 'Tata Tiscon',
    mrp: 41000,
    price: 36500,
    discountPct: 11,
    bulkPriceText: 'Unlock Truckload Rates',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/tata_tiscon.png',
    inStock: true,
  },
  {
    id: 'pop-2',
    title: 'UltraTech Super PPC Cement Bag, 50 Kg Moisture Protected Packaging',
    slug: 'ultratech-super-ppc-cement',
    brand: 'UltraTech Cement',
    mrp: 460,
    price: 435,
    discountPct: 5,
    bulkPriceText: 'Unlock 100+ Bag Pricing',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/ultratech_cement.png',
    inStock: true,
  },
  {
    id: 'pop-3',
    title: 'Dr. Fixit 101 LW+ Integral Liquid Waterproofing Compound, 20L Drum',
    slug: 'dr-fixit-101-lw-waterproofing',
    brand: 'Dr. Fixit',
    mrp: 3300,
    price: 2850,
    discountPct: 14,
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/dr_fixit.png',
    inStock: true,
  },
  {
    id: 'pop-4',
    title: 'Fevicol Marine Waterproof Synthetic Resin Adhesive, 50 Kg Pail',
    slug: 'fevicol-marine-adhesive-50kg',
    brand: 'Fevicol',
    mrp: 12500,
    price: 11200,
    discountPct: 10,
    optionsCount: 4,
    options: [
      {
        id: 'fevicol-50kg',
        title: '50 Kg Pail',
        mrp: 12500,
        price: 11200,
        imageUrl: '/images/products/fevicol.png',
      },
      {
        id: 'fevicol-20kg',
        title: '20 Kg Bucket',
        mrp: 5400,
        price: 4850,
        imageUrl: '/images/products/fevicol.png',
      },
      {
        id: 'fevicol-10kg',
        title: '10 Kg Bucket',
        mrp: 2850,
        price: 2550,
        imageUrl: '/images/products/fevicol.png',
      },
      {
        id: 'fevicol-5kg',
        title: '5 Kg Bucket',
        mrp: 1550,
        price: 1380,
        imageUrl: '/images/products/fevicol.png',
      },
    ],
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/fevicol.png',
    inStock: true,
  },
  {
    id: 'pop-5',
    title: 'Greenply 710 Marine Grade BWP Plywood 8ft x 4ft x 19mm',
    slug: 'greenply-710-marine-bwp-plywood',
    brand: 'Greenply',
    mrp: 2800,
    price: 2450,
    discountPct: 13,
    subBadge: 'IS 710 Certified',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/greenply_plywood.png',
    inStock: true,
  },
  {
    id: 'pop-6',
    title: 'Havells LifeLine Plus Single Core FR PVC Insulated Industrial Cable 2.5 sq mm',
    slug: 'havells-lifeline-plus-25-wire',
    brand: 'Havells',
    mrp: 3250,
    price: 2780,
    discountPct: 14,
    optionsCount: 6,
    options: [
      {
        id: 'havells-0.75sqmm',
        title: '0.75 sq mm (90m Coil)',
        mrp: 1450,
        price: 1180,
        imageUrl: '/images/products/havells_wire.png',
      },
      {
        id: 'havells-1.0sqmm',
        title: '1.0 sq mm (90m Coil)',
        mrp: 1980,
        price: 1620,
        imageUrl: '/images/products/havells_wire.png',
      },
      {
        id: 'havells-1.5sqmm',
        title: '1.5 sq mm (90m Coil)',
        mrp: 2750,
        price: 2240,
        imageUrl: '/images/products/havells_wire.png',
      },
      {
        id: 'havells-2.5sqmm',
        title: '2.5 sq mm (90m Coil)',
        mrp: 4350,
        price: 3560,
        imageUrl: '/images/products/havells_wire.png',
      },
      {
        id: 'havells-4.0sqmm',
        title: '4.0 sq mm (90m Coil)',
        mrp: 6600,
        price: 5420,
        imageUrl: '/images/products/havells_wire.png',
      },
      {
        id: 'havells-6.0sqmm',
        title: '6.0 sq mm (90m Coil)',
        mrp: 9850,
        price: 8150,
        imageUrl: '/images/products/havells_wire.png',
      },
    ],
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/havells_wire.png',
    inStock: true,
  },
  {
    id: 'pop-7',
    title: 'Supreme High-Pressure CPVC 90-Degree Elbows Pack (25mm x 50 Pcs)',
    slug: 'supreme-cpvc-elbow-fittings',
    brand: 'Supreme Industries',
    mrp: 1700,
    price: 1450,
    discountPct: 15,
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/supreme_cpvc.png',
    inStock: true,
  },
  {
    id: 'pop-8',
    title: 'Jaquar Florentine Chrome Plated Single Lever Basin Mixer with Pop-up Waste',
    slug: 'jaquar-florentine-basin-mixer',
    brand: 'Jaquar',
    mrp: 4200,
    price: 3690,
    discountPct: 12,
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/jaquar_mixer.png',
    inStock: true,
  },
];

// 3. Newly Launched Products (8 items)
export const SEARCH_NEW_LAUNCHES: HomeRunProductItem[] = [
  {
    id: 'gyproc-xpert-plaster-25kg',
    title: 'Saint-Gobain Gyproc Xpert+ Gypsum Punning Plaster, 25 Kg',
    slug: 'saint-gobain-gyproc-xpert-gypsum-punning-plaster-25-kg',
    brand: 'Saint-Gobain',
    mrp: 440,
    price: 395,
    discountPct: 10,
    cashbackText: '5% Cashback on 1 Lakh+ orders',
    bulkPriceText: 'Unlock Bulk Prices of ₹375',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/gyproc_plaster.png',
    inStock: true,
  },
  {
    id: 'priya-opc-53-cement-50kg',
    title: 'Priya OPC 53 Grade Cement, 50 Kg Bag',
    slug: 'priya-opc-53-grade-cement-50-kg-bag',
    brand: 'Priya Cement',
    mrp: 410,
    price: 390,
    discountPct: 5,
    cashbackText: '5% Cashback on 1 Lakh+ orders',
    bulkPriceText: 'Unlock Bulk Prices of ₹375',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/priya_cement.png',
    inStock: true,
  },
  {
    id: 'jsw-block-grip-aac-adhesive-40kg',
    title: 'JSW Block Grip AAC Block Jointing Mortar/Adhesive, 40 Kg Bag',
    slug: 'jsw-block-grip-aac-block-jointing-mortar-adhesive-40-kg',
    brand: 'JSW Cement',
    mrp: 450,
    price: 415,
    discountPct: 8,
    cashbackText: '5% Cashback on 1 Lakh+ orders',
    bulkPriceText: 'Unlock Bulk Prices of ₹395',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/jsw_blockgrip.png',
    inStock: true,
  },
  {
    id: 'maha-cement-53-grade-50kg',
    title: 'Maha Cement 53 Grade OPC High Early Strength Cement, 50 Kg Bag',
    slug: 'maha-cement-53-grade-50-kg-bag',
    brand: 'Maha Cement',
    mrp: 430,
    price: 390,
    discountPct: 9,
    cashbackText: '5% Cashback on 1 Lakh+ orders',
    bulkPriceText: 'Unlock Bulk Prices of ₹375',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/priya_cement.png',
    inStock: true,
  },
];

export const NEWLY_LAUNCHED_PRODUCTS: HomeRunProductItem[] = [
  ...SEARCH_NEW_LAUNCHES,
  {
    id: 'new-rack-1',
    title: 'Powder Coated 5 Shelf Slotted Angle Storage Rack, 6ft x 3ft x 1ft, Mild Steel, Orange & White',
    slug: 'powder-coated-5-shelf-slotted-angle-storage-rack',
    brand: 'SteelCraft',
    mrp: 6999,
    price: 3979,
    discountPct: 43,
    optionsCount: 3,
    options: [
      {
        id: 'rack-5-shelf',
        title: '5 Shelves (6ft x 3ft x 1ft)',
        mrp: 6999,
        price: 3979,
        imageUrl: '/images/products/slotted_rack.png',
      },
      {
        id: 'rack-4-shelf',
        title: '4 Shelves (5ft x 3ft x 1ft)',
        mrp: 5499,
        price: 3299,
        imageUrl: '/images/products/slotted_rack.png',
      },
      {
        id: 'rack-6-shelf',
        title: '6 Shelves (7ft x 3ft x 1.5ft)',
        mrp: 8999,
        price: 5299,
        imageUrl: '/images/products/slotted_rack.png',
      },
    ],
    bulkPriceText: 'Unlock Bulk Prices of ₹3759',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/slotted_rack.png',
    inStock: true,
  },
  {
    id: 'new-gm-geyser',
    title: 'GM Modular Aeris Plus 15L Vertical Storage Water Heater (Geyser) | BEE 5-Star Rated',
    slug: 'gm-modular-aeris-plus-15l-geyser',
    brand: 'GM Modular',
    mrp: 15750,
    price: 6449,
    discountPct: 59,
    subBadge: 'Free Installation on 15L Model',
    extraTags: ['Free Installation', '2-Year Warranty'],
    optionsCount: 4,
    options: [
      {
        id: 'gm-geyser-15l',
        title: '15 Litres (Vertical 5-Star)',
        mrp: 15750,
        price: 6449,
        imageUrl: '/images/products/gm_modular_geyser.png',
      },
      {
        id: 'gm-geyser-10l',
        title: '10 Litres (Vertical 5-Star)',
        mrp: 13500,
        price: 5699,
        imageUrl: '/images/products/gm_modular_geyser.png',
      },
      {
        id: 'gm-geyser-25l',
        title: '25 Litres (Vertical 5-Star)',
        mrp: 18900,
        price: 7899,
        imageUrl: '/images/products/gm_modular_geyser.png',
      },
      {
        id: 'gm-geyser-6l',
        title: '6 Litres (Compact Storage)',
        mrp: 9800,
        price: 4299,
        imageUrl: '/images/products/gm_modular_geyser.png',
      },
    ],
    bulkPriceText: 'Unlock Bulk Prices of ₹6399',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/gm_modular_geyser.png',
    inStock: true,
  },
  {
    id: 'new-aristo-bin',
    title: 'Aristo Wheel Waste Bin with Pedal 65L Heavy Duty Polypropylene',
    slug: 'aristo-wheel-waste-bin-with-pedal-65l',
    brand: 'Aristo Plastics',
    mrp: 2499,
    price: 2185,
    discountPct: 12,
    optionsCount: 4,
    options: [
      {
        id: 'aristo-65l',
        title: '65 Litres (Pedal Operated)',
        mrp: 2499,
        price: 2185,
        imageUrl: '/images/products/aristo_bin.png',
      },
      {
        id: 'aristo-80l',
        title: '80 Litres (Mobile Bin)',
        mrp: 3299,
        price: 2850,
        imageUrl: '/images/products/aristo_bin.png',
      },
      {
        id: 'aristo-120l',
        title: '120 Litres (Commercial Lot)',
        mrp: 4599,
        price: 3950,
        imageUrl: '/images/products/aristo_bin.png',
      },
      {
        id: 'aristo-240l',
        title: '240 Litres (Industrial Mobile)',
        mrp: 7499,
        price: 6450,
        imageUrl: '/images/products/aristo_bin.png',
      },
    ],
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/aristo_bin.png',
    inStock: true,
  },
  {
    id: 'new-ao-smith',
    title: 'AO Smith Elegance Prime Neo Vertical Water Heater - 15L Blue Diamond Glass Lined',
    slug: 'ao-smith-elegance-prime-neo-15l',
    brand: 'AO Smith',
    mrp: 11900,
    price: 8129,
    discountPct: 32,
    subBadge: 'Free Installation on 15L Model',
    optionsCount: 4,
    options: [
      {
        id: 'ao-smith-15l',
        title: '15L (Vertical Blue Diamond)',
        name: '15L (Vertical Blue Diamond)',
        packSize: '15L',
        price: 8129,
        mrp: 11900,
        discountPct: 32,
        inStock: true,
        imageUrl: '/images/products/ao_smith_geyser.png',
      },
      {
        id: 'ao-smith-25l',
        title: '25L (Vertical Blue Diamond)',
        name: '25L (Vertical Blue Diamond)',
        packSize: '25L',
        price: 9499,
        mrp: 13800,
        discountPct: 31,
        inStock: true,
        imageUrl: '/images/products/ao_smith_geyser.png',
      },
      {
        id: 'ao-smith-10l',
        title: '10L (Vertical Blue Diamond)',
        name: '10L (Vertical Blue Diamond)',
        packSize: '10L',
        price: 6899,
        mrp: 9999,
        discountPct: 31,
        inStock: true,
        imageUrl: '/images/products/ao_smith_geyser.png',
      },
      {
        id: 'ao-smith-6l',
        title: '6L (Vertical Blue Diamond)',
        name: '6L (Vertical Blue Diamond)',
        packSize: '6L',
        price: 5499,
        mrp: 7999,
        discountPct: 31,
        inStock: true,
        imageUrl: '/images/products/ao_smith_geyser.png',
      },
    ],
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/ao_smith_geyser.png',
    inStock: true,
  },
  {
    id: 'new-cp-plus',
    title: 'CP Plus 2MP IP Bullet Camera with Audio, 3.6mm Lens UNC-TA21L3C-Q-0360',
    slug: 'cp-plus-2mp-ip-bullet-camera',
    brand: 'CP Plus',
    mrp: 4550,
    price: 3555,
    discountPct: 22,
    bulkPriceText: 'Unlock Bulk Prices of ₹3430',
    optionsCount: 3,
    options: [
      {
        id: 'cp-plus-3-6mm',
        title: '3.6mm Lens (Standard Angle)',
        name: '3.6mm Lens (Standard Angle)',
        packSize: '3.6mm Lens',
        price: 3555,
        mrp: 4550,
        discountPct: 22,
        inStock: true,
        imageUrl: '/images/products/cp_plus_camera.png',
      },
      {
        id: 'cp-plus-6mm',
        title: '6.0mm Lens (Long Range)',
        name: '6.0mm Lens (Long Range)',
        packSize: '6.0mm Lens',
        price: 3699,
        mrp: 4750,
        discountPct: 22,
        inStock: true,
        imageUrl: '/images/products/cp_plus_camera.png',
      },
      {
        id: 'cp-plus-2-8mm',
        title: '2.8mm Lens (Wide Angle)',
        name: '2.8mm Lens (Wide Angle)',
        packSize: '2.8mm Lens',
        price: 3599,
        mrp: 4650,
        discountPct: 23,
        inStock: true,
        imageUrl: '/images/products/cp_plus_camera.png',
      },
    ],
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/cp_plus_camera.png',
    inStock: true,
  },
  {
    id: 'new-bosch-grinder',
    title: 'Bosch Professional Angle Grinder, 100mm',
    slug: 'bosch-professional-angle-grinder-100mm',
    altSlugs: ['stanley-impact-drill-kit-650w'],
    brand: 'Bosch',
    mrp: 4200,
    price: 2999,
    discountPct: 29,
    optionsCount: 3,
    options: [
      {
        id: 'bosch-100mm',
        title: '100mm (4 Inch) 670W GWS 600',
        name: '100mm (4 Inch) 670W GWS 600',
        packSize: '100mm (4 Inch)',
        price: 2999,
        mrp: 4200,
        discountPct: 29,
        inStock: true,
        imageUrl: '/images/products/bosch_grinder.png',
      },
      {
        id: 'bosch-125mm',
        title: '125mm (5 Inch) 900W GWS 900',
        name: '125mm (5 Inch) 900W GWS 900',
        packSize: '125mm (5 Inch)',
        price: 3899,
        mrp: 5450,
        discountPct: 28,
        inStock: true,
        imageUrl: '/images/products/bosch_grinder.png',
      },
      {
        id: 'bosch-100mm-discs',
        title: '100mm with 5 Cutting Discs Kit',
        name: '100mm with 5 Cutting Discs Kit',
        packSize: '100mm + 5 Discs',
        price: 3299,
        mrp: 4600,
        discountPct: 28,
        inStock: true,
        imageUrl: '/images/products/bosch_grinder.png',
      },
    ],
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/bosch_grinder.png',
    inStock: true,
  },
  {
    id: 'new-godrej',
    title: 'Godrej Ultra Tribolt High-Security Rim Door Lock with 3 Brass Keys',
    slug: 'godrej-ultra-tribolt-door-lock',
    brand: 'Godrej Locks',
    mrp: 2690,
    price: 2250,
    discountPct: 16,
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/godrej_lock.png',
    inStock: true,
  },
];

// 4. Contractor Bulk Buys (6 commercial wholesale packs)
export const CONTRACTOR_BULK_BUYS: HomeRunProductItem[] = [
  {
    id: 'bulk-1',
    title: 'Trailer Direct Tata Tiscon Fe 550D TMT Rebar (10 Metric Tons Wholesale Lot)',
    slug: 'tata-tiscon-550d-tmt-rebars-12mm',
    brand: 'Tata Tiscon',
    mrp: 680000,
    price: 640000,
    discountPct: 6,
    bulkPriceText: 'Wholesale Sourcing with Test MTC',
    badges: ['Trailer Delivery', 'GST Invoiced'],
    imageUrl: '/images/products/tata_tiscon.png',
    inStock: true,
  },
  {
    id: 'bulk-2',
    title: 'Full Truckload UltraTech PPC Cement (300 Bags Mill Dispatch)',
    slug: 'ultratech-super-ppc-cement',
    brand: 'UltraTech Cement',
    mrp: 135000,
    price: 118500,
    discountPct: 12,
    bulkPriceText: 'Quality Inspected Fresh Stock',
    badges: ['Truckload', 'Pay on Delivery'],
    imageUrl: '/images/products/ultratech_cement.png',
    inStock: true,
  },
  {
    id: 'bulk-3',
    title: 'Pallet Pack Kajaria Vitrified Floor Tiles (40 Crate Commercial Lot)',
    slug: 'kajaria-eternity-vitrified-floor-tiles',
    brand: 'Kajaria Ceramics',
    mrp: 34000,
    price: 28800,
    discountPct: 15,
    bulkPriceText: 'Zero Breakage Guarantee',
    badges: ['Palletized', 'GST Invoiced'],
    imageUrl: '/images/products/kajaria_tiles.png',
    inStock: true,
  },
  {
    id: 'bulk-4',
    title: 'Commercial Plumbing Lot: Supreme CPVC Pipes & Fittings Wholesale Pack',
    slug: 'supreme-lifeline-cpvc-pipe',
    brand: 'Supreme Industries',
    mrp: 48000,
    price: 39500,
    discountPct: 18,
    bulkPriceText: 'Lead-Free Heavy Duty Standard',
    badges: ['Contractor Lot', 'Pay on Delivery'],
    imageUrl: '/images/products/supreme_cpvc.png',
    inStock: true,
  },
  {
    id: 'bulk-5',
    title: 'Dr. Fixit URP 50 Kg Structural Repair & Waterproofing Drum Commercial Lot',
    slug: 'dr-fixit-101-lw-waterproofing',
    brand: 'Dr. Fixit',
    mrp: 16500,
    price: 13900,
    discountPct: 16,
    bulkPriceText: 'SBR Latex Structural Grade',
    badges: ['Commercial Drum', 'Pay on Delivery'],
    imageUrl: '/images/products/dr_fixit.png',
    inStock: true,
  },
  {
    id: 'bulk-6',
    title: 'Havells Fire Retardant Wire Commercial Spool Pack (10 Rolls x 90m)',
    slug: 'havells-lifeline-plus-25-wire',
    brand: 'Havells',
    mrp: 32500,
    price: 27500,
    discountPct: 15,
    bulkPriceText: '100% Electrolytic Copper',
    badges: ['Contractor Lot', 'GST Invoiced'],
    imageUrl: '/images/products/havells_wire.png',
    inStock: true,
  },
];

export const SEARCH_TOP_CATEGORIES: HomeRunCategoryItem[] = [
  {
    id: 'cement',
    title: 'Cement',
    slug: 'cement-construction-materials',
    imageUrl: '/images/categories/cement.png',
  },
  {
    id: 'tiling',
    title: 'Tiling',
    slug: 'tiles-flooring',
    imageUrl: '/images/categories/tiling.png',
  },
  {
    id: 'painting',
    title: 'Painting',
    slug: 'paints-primers-putty',
    imageUrl: '/images/categories/painting.png',
  },
  {
    id: 'fevicol',
    title: 'Fevicol',
    slug: 'hardware-tools-fasteners',
    imageUrl: '/images/categories/fevicol.png',
  },
  {
    id: 'wires',
    title: 'Wires',
    slug: 'electrical-products',
    imageUrl: '/images/categories/wires.png',
  },
  {
    id: 'lighting',
    title: 'Lighting',
    slug: 'electrical-products',
    imageUrl: '/images/categories/lighting.png',
  },
];

export const TILING_PRODUCTS: HomeRunProductItem[] = [
  {
    id: 'roff-t01-nca-30kg',
    title: 'Roff T01 NCA Tile Adhesive, Grey, 30 Kg Bag',
    slug: 'roff-t01-nca-tile-adhesive-grey-30-kg-bag',
    brand: 'Roff (Pidilite)',
    mrp: 460,
    price: 430,
    discountPct: 7,
    cashbackText: '5% Cashback on 1 Lakh+ orders',
    bulkPriceText: 'Unlock Bulk Prices of ₹410',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/roff_t01.png',
    inStock: true,
  },
  {
    id: 'myk-laticrete-303-20kg',
    title: 'MYK Laticrete 303 Grey Tile Adhesive, 20Kg Bag',
    slug: 'myk-laticrete-303-grey-tile-adhesive-20-kg-bag',
    brand: 'MYK Laticrete',
    mrp: 300,
    price: 255,
    discountPct: 15,
    cashbackText: '5% Cashback on 1 Lakh+ orders',
    bulkPriceText: 'Unlock Bulk Prices of ₹235',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/myk_laticrete_303.png',
    inStock: true,
  },
  {
    id: 'birla-white-cement-50kg',
    title: 'Birla White Cement',
    slug: 'birla-white-cement',
    brand: 'Birla White',
    mrp: 50,
    price: 40,
    discountPct: 20,
    optionsCount: 3,
    options: [
      {
        id: 'birla-white-cement-50kg-opt',
        title: '50 Kg',
        mrp: 1350,
        price: 1200,
        imageUrl: '/images/products/birla_white_cement.png',
      },
      {
        id: 'birla-white-cement-5kg-opt',
        title: '5 Kg',
        mrp: 150,
        price: 140,
        imageUrl: '/images/products/birla_white_cement.png',
      },
      {
        id: 'birla-white-cement-1kg-opt',
        title: '1 Kg',
        price: 40,
        imageUrl: '/images/products/birla_white_cement.png',
      },
    ],
    cashbackText: '5% Cashback on 1 Lakh+ orders',
    bulkPriceText: 'Unlock Bulk Prices of ₹38',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/birla_white_cement.png',
    inStock: true,
  },
  {
    id: 'myk-laticrete-dwa215-10kg',
    title: 'MYK Laticrete DWA 215 Tile Adhesive, 10 Kg',
    slug: 'myk-laticrete-dwa-215-tile-adhesive-10-kg',
    brand: 'MYK Laticrete',
    mrp: 3145,
    price: 2025,
    discountPct: 36,
    cashbackText: '5% Cashback on 1 Lakh+ orders',
    bulkPriceText: 'Unlock Bulk Prices of ₹1950',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/myk_laticrete_dwa215.png',
    inStock: true,
  },
  {
    id: 'myk-laticrete-305-20kg',
    title: 'MYK Laticrete 305 Floor and Wall Tile Adhesive, 20 Kg',
    slug: 'myk-laticrete-305-floor-and-wall-tile-adhesive-20-kg',
    brand: 'MYK Laticrete',
    mrp: 490,
    price: 445,
    discountPct: 9,
    cashbackText: '5% Cashback on 1 Lakh+ orders',
    bulkPriceText: 'Unlock Bulk Prices of ₹425',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/myk_laticrete_305.png',
    inStock: true,
  },
  {
    id: 'myk-laticrete-335-20kg',
    title: 'MYK Laticrete 335 Premium Flexible Tile Adhesive, 20 Kg',
    slug: 'myk-laticrete-335-premium-flexible-tile-adhesive-20-kg',
    brand: 'MYK Laticrete',
    mrp: 1050,
    price: 985,
    discountPct: 6,
    cashbackText: '5% Cashback on 1 Lakh+ orders',
    bulkPriceText: 'Unlock Bulk Prices of ₹940',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/myk_laticrete_335.png',
    inStock: true,
  },
  {
    id: 'birla-white-tilestix-20kg',
    title: 'Birla White Tilestix Floor and Wall Tile Adhesive, 20 Kg',
    slug: 'birla-white-tilestix-floor-and-wall-adhesive-20-kg',
    brand: 'Birla White',
    mrp: 520,
    price: 270,
    discountPct: 48,
    cashbackText: '5% Cashback on 1 Lakh+ orders',
    bulkPriceText: 'Unlock Bulk Prices of ₹250',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/birla_white_tilestix.png',
    inStock: true,
  },
  {
    id: 'roff-nsa-eco-t02-20kg',
    title: 'Roff NSA Eco T02 High Bond Tile Adhesive, 20 Kg',
    slug: 'roff-nsa-eco-t02-high-bond-tile-adhesive-20-kg',
    brand: 'Roff (Pidilite)',
    mrp: 380,
    price: 360,
    discountPct: 5,
    cashbackText: '5% Cashback on 1 Lakh+ orders',
    bulkPriceText: 'Unlock Bulk Prices of ₹340',
    badges: ['Site Delivery', 'Pay on Delivery'],
    imageUrl: '/images/products/roff_nsa_eco_t02.png',
    inStock: true,
  },
];

export const ALL_HOMERUN_PRODUCTS: HomeRunProductItem[] = [
  ...TILING_PRODUCTS,
  ...SEARCH_NEW_LAUNCHES,
  ...DEALS_OF_THE_WEEK,
  ...POPULAR_CONSTRUCTION_MATERIALS,
  ...NEWLY_LAUNCHED_PRODUCTS,
  ...CONTRACTOR_BULK_BUYS,
];

export function getCategoryProductsBySlug(slug: string): HomeRunProductItem[] {
  const clean = slug.toLowerCase().trim();
  if (clean === 'tiling' || clean === 'tiles-flooring' || clean.includes('tile')) {
    return TILING_PRODUCTS;
  }
  if (clean === 'cement' || clean.includes('cement')) {
    return [
      ...SEARCH_NEW_LAUNCHES.filter((p) => p.title.toLowerCase().includes('cement') || p.title.toLowerCase().includes('plaster') || p.title.toLowerCase().includes('mortar')),
      ...DEALS_OF_THE_WEEK.filter((p) => p.title.toLowerCase().includes('cement')),
      ...POPULAR_CONSTRUCTION_MATERIALS.filter((p) => p.title.toLowerCase().includes('cement') || p.title.toLowerCase().includes('tiscon')),
    ];
  }
  if (clean.includes('paint') || clean.includes('putty') || clean.includes('water')) {
    return [
      ...POPULAR_CONSTRUCTION_MATERIALS.filter((p) => p.brand.toLowerCase().includes('paint') || p.brand.toLowerCase().includes('fixit')),
      ...DEALS_OF_THE_WEEK.filter((p) => p.brand.toLowerCase().includes('paint') || p.brand.toLowerCase().includes('fixit')),
    ];
  }
  if (clean.includes('electr') || clean.includes('wire') || clean.includes('switch')) {
    return [
      ...POPULAR_CONSTRUCTION_MATERIALS.filter((p) => p.brand.toLowerCase().includes('havells') || p.brand.toLowerCase().includes('kei')),
      ...NEWLY_LAUNCHED_PRODUCTS.filter((p) => p.brand.toLowerCase().includes('modular')),
    ];
  }
  return POPULAR_CONSTRUCTION_MATERIALS;
}

export function searchCatalogProducts(query: string): HomeRunProductItem[] {
  if (!query || !query.trim()) return [];
  const clean = query.trim().toLowerCase();
  
  // Dedup by id
  const seen = new Set<string>();
  const results: HomeRunProductItem[] = [];

  for (const item of ALL_HOMERUN_PRODUCTS) {
    if (seen.has(item.id)) continue;
    const matchTitle = item.title.toLowerCase().includes(clean);
    const matchBrand = item.brand.toLowerCase().includes(clean);
    const matchSlug = item.slug.toLowerCase().includes(clean);
    if (matchTitle || matchBrand || matchSlug) {
      seen.add(item.id);
      results.push(item);
    }
  }

  return results;
}

export function generateRealisticOptions(product: HomeRunProductItem): ProductOptionItem[] {
  if (product.options && product.options.length > 0) {
    return product.options;
  }

  const text = `${product.title} ${product.slug} ${product.brand}`.toLowerCase();

  // 1. Electrical Wires & Cables (0.75, 1.0, 1.5, 2.5, 4.0, 6.0 sq mm)
  if (text.includes('wire') || text.includes('cable') || text.includes('homecab') || text.includes('sq mm') || text.includes('lifeline')) {
    const base = Math.max(800, product.price);
    return [
      {
        id: `${product.id}-0.75sqmm`,
        title: '0.75 sq mm (90m Coil)',
        mrp: Math.round(base * 0.7 * 1.25),
        price: Math.round(base * 0.7),
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-1.0sqmm`,
        title: '1.0 sq mm (90m Coil)',
        mrp: Math.round(base * 0.85 * 1.25),
        price: Math.round(base * 0.85),
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-1.5sqmm`,
        title: '1.5 sq mm (90m Coil)',
        mrp: Math.round(base * 1.15 * 1.22),
        price: Math.round(base * 1.15),
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-2.5sqmm`,
        title: '2.5 sq mm (90m Coil)',
        mrp: Math.round(base * 1.65 * 1.2),
        price: Math.round(base * 1.65),
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-4.0sqmm`,
        title: '4.0 sq mm (90m Coil)',
        mrp: Math.round(base * 2.5 * 1.2),
        price: Math.round(base * 2.5),
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-6.0sqmm`,
        title: '6.0 sq mm (90m Coil)',
        mrp: Math.round(base * 3.8 * 1.2),
        price: Math.round(base * 3.8),
        imageUrl: product.imageUrl,
      },
    ];
  }

  // 2. Plywood, Boards & Sheets (19mm, 16mm, 12mm, 8mm, 6mm)
  if (text.includes('plywood') || text.includes('hdhmr') || text.includes('mdf') || text.includes('board') || text.includes('tesa') || text.includes('greenply')) {
    const base = product.price;
    return [
      {
        id: `${product.id}-19mm`,
        title: "19 mm (8' x 4')",
        mrp: Math.round(base * 1.15),
        price: base,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-16mm`,
        title: "16 mm (8' x 4')",
        mrp: Math.round(base * 0.88 * 1.15),
        price: Math.round(base * 0.88),
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-12mm`,
        title: "12 mm (8' x 4')",
        mrp: Math.round(base * 0.68 * 1.15),
        price: Math.round(base * 0.68),
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-8mm`,
        title: "8 mm (8' x 4')",
        mrp: Math.round(base * 0.48 * 1.15),
        price: Math.round(base * 0.48),
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-6mm`,
        title: "6 mm (8' x 4')",
        mrp: Math.round(base * 0.38 * 1.15),
        price: Math.round(base * 0.38),
        imageUrl: product.imageUrl,
      },
    ];
  }

  // 3. Fevicol & Wood Adhesives (50 Kg, 20 Kg, 10 Kg, 5 Kg, 1 Kg)
  if (text.includes('fevicol') || text.includes('adhesive') || text.includes('marine')) {
    return [
      {
        id: `${product.id}-50kg`,
        title: '50 Kg Pail',
        mrp: 12500,
        price: 11200,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-20kg`,
        title: '20 Kg Bucket',
        mrp: 5400,
        price: 4850,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-10kg`,
        title: '10 Kg Bucket',
        mrp: 2850,
        price: 2550,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-5kg`,
        title: '5 Kg Bucket',
        mrp: 1550,
        price: 1380,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-1kg`,
        title: '1 Kg Pack',
        mrp: 350,
        price: 310,
        imageUrl: product.imageUrl,
      },
    ];
  }

  // 4. Paints, Primers, Waterproofing Compounds (20L, 10L, 4L, 1L)
  if (text.includes('paint') || text.includes('primer') || text.includes('waterproof') || text.includes('dr. fixit') || text.includes('compound') || text.includes('emulsion') || text.includes('damp')) {
    const base = product.price;
    return [
      {
        id: `${product.id}-20l`,
        title: '20 Litre Drum',
        mrp: Math.round(base * 1.15),
        price: base,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-10l`,
        title: '10 Litre Bucket',
        mrp: Math.round(base * 0.55 * 1.15),
        price: Math.round(base * 0.55),
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-4l`,
        title: '4 Litre Can',
        mrp: Math.round(base * 0.25 * 1.15),
        price: Math.round(base * 0.25),
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-1l`,
        title: '1 Litre Can',
        mrp: Math.max(180, Math.round(base * 0.08 * 1.2)),
        price: Math.max(150, Math.round(base * 0.08)),
        imageUrl: product.imageUrl,
      },
    ];
  }

  // 5. Pipes & Plumbing (1", 3/4", 1/2", 1.5", 2")
  if (text.includes('pipe') || text.includes('cpvc') || text.includes('upvc') || text.includes('fitting') || text.includes('supreme')) {
    return [
      {
        id: `${product.id}-1inch`,
        title: '1 Inch (25mm) - 3 Metre',
        mrp: 520,
        price: 440,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-0.75inch`,
        title: '3/4 Inch (20mm) - 3 Metre',
        mrp: 380,
        price: 320,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-0.5inch`,
        title: '1/2 Inch (15mm) - 3 Metre',
        mrp: 260,
        price: 210,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-1.5inch`,
        title: '1.5 Inch (40mm) - 3 Metre',
        mrp: 890,
        price: 760,
        imageUrl: product.imageUrl,
      },
    ];
  }

  // 6. Tiles & Ceramics (Different Finishes)
  if (text.includes('tile') || text.includes('kajaria') || text.includes('vitrified') || text.includes('ceramic')) {
    return [
      {
        id: `${product.id}-statuario`,
        title: 'Statuario White (600x1200 mm)',
        mrp: 950,
        price: 780,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-royal-marfil`,
        title: 'Royal Marfil Beige (600x1200 mm)',
        mrp: 920,
        price: 760,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-armani-bronze`,
        title: 'Armani Bronze Matt (600x1200 mm)',
        mrp: 890,
        price: 740,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-nero-black`,
        title: 'Nero Black Polished (600x1200 mm)',
        mrp: 980,
        price: 820,
        imageUrl: product.imageUrl,
      },
    ];
  }

  // 7. Power Tools & Machines (Standard vs Pro Kit)
  if (text.includes('grinder') || text.includes('drill') || text.includes('dongcheng') || text.includes('stanley') || text.includes('bosch')) {
    return [
      {
        id: `${product.id}-standard`,
        title: 'Standard Kit (850W Spindle)',
        mrp: product.mrp,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-pro`,
        title: 'Heavy Duty Pro Kit (1050W + Accessories)',
        mrp: Math.round(product.price * 1.35 * 1.2),
        price: Math.round(product.price * 1.35),
        imageUrl: product.imageUrl,
      },
    ];
  }

  // 8. TMT Steel Rebars (8mm, 10mm, 12mm, 16mm, 20mm, 25mm)
  if (text.includes('tiscon') || text.includes('tmt') || text.includes('steel') || text.includes('rebar')) {
    return [
      {
        id: `${product.id}-12mm`,
        title: '12 mm (Fe 550D Super Ductile)',
        mrp: 76,
        price: 68,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-10mm`,
        title: '10 mm (Fe 550D Super Ductile)',
        mrp: 77,
        price: 69,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-16mm`,
        title: '16 mm (Fe 550D Super Ductile)',
        mrp: 76,
        price: 68,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-8mm`,
        title: '8 mm (Fe 550D Super Ductile)',
        mrp: 78,
        price: 70,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-20mm`,
        title: '20 mm (Fe 550D Super Ductile)',
        mrp: 76,
        price: 68,
        imageUrl: product.imageUrl,
      },
    ];
  }

  // 9. Cement, Gypsum Plaster, Tile Adhesives & Putty (50kg, 25kg, 5kg, 1kg)
  if (text.includes('cement') || text.includes('plaster') || text.includes('mortar') || text.includes('laticrete') || text.includes('roff') || text.includes('putty')) {
    return [
      {
        id: `${product.id}-50kg`,
        title: '50 Kg Bag',
        mrp: Math.round(product.price * 1.15),
        price: product.price,
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-25kg`,
        title: '25 Kg Bag',
        mrp: Math.round(product.price * 0.55 * 1.15),
        price: Math.round(product.price * 0.55),
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-5kg`,
        title: '5 Kg Pack',
        mrp: Math.max(120, Math.round(product.price * 0.15)),
        price: Math.max(90, Math.round(product.price * 0.13)),
        imageUrl: product.imageUrl,
      },
      {
        id: `${product.id}-1kg`,
        title: '1 Kg Pack',
        mrp: 50,
        price: 40,
        imageUrl: product.imageUrl,
      },
    ];
  }

  // 10. General Commercial Pack Fallback
  return [
    {
      id: `${product.id}-standard`,
      title: 'Standard Unit',
      mrp: product.mrp,
      price: product.price,
      imageUrl: product.imageUrl,
    },
    {
      id: `${product.id}-commercial-pack`,
      title: 'Commercial Contractor Pack (Set of 5)',
      mrp: Math.round(product.price * 5 * 1.1),
      price: Math.round(product.price * 4.6),
      imageUrl: product.imageUrl,
    },
  ];
}


