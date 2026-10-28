'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { HomeRunProductItem, ProductOptionItem } from '@/config/homerun-catalog';
import { useCart } from '@/context/CartContext';

interface ProductOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: HomeRunProductItem | null;
}

export const ProductOptionsModal: React.FC<ProductOptionsModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { addToCart } = useCart();
  const [addedOptIds, setAddedOptIds] = useState<Set<string>>(new Set());

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

function generateRealisticOptions(product: HomeRunProductItem): ProductOptionItem[] {
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

  const options: ProductOptionItem[] = generateRealisticOptions(product);

  const handleAddOption = (opt: ProductOptionItem) => {
    addToCart(
      {
        product_id: `${product.id}-${opt.id}`,
        product_title: `${product.title} (${opt.title})`,
        product_slug: product.slug,
        short_description: product.title,
        description: product.title,
        hsn_code: '2523',
        unit_of_measure: 'units',
        is_bulk_available: true,
        is_featured: true,
        specifications: {},
        images: [opt.imageUrl || product.imageUrl],
        tax_rate_pct: 18,
        product_status: 'published',
        category_id: 'c0000000-0000-0000-0000-000000000001',
        category_name: 'Materials',
        category_slug: 'tiling',
        brand_id: 'b0000000-0000-0000-0000-000000000001',
        brand_name: product.brand,
        brand_slug: product.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        brand_logo: opt.imageUrl || product.imageUrl,
        variant_id: `v-${opt.id}`,
        variant_title: opt.title,
        sku: `SKU-${opt.id}`,
        pack_size: opt.title,
        attributes: { size: opt.title },
        min_order_qty: 1,
        max_order_qty: 500,
        weight_kg: 10,
        dimensions_cm: { length: 30, width: 20, height: 10 },
        selling_price_paise: opt.price * 100,
        mrp_paise: (opt.mrp || opt.price) * 100,
        total_available_stock: 500,
        is_in_stock: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      1
    );

    setAddedOptIds((prev) => new Set(prev).add(opt.id));
    setTimeout(() => {
      setAddedOptIds((prev) => {
        const next = new Set(prev);
        next.delete(opt.id);
        return next;
      });
    }, 1800);
  };

  return (
    <>
      {/* Dark Dimming Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Card (Matching home-run.co exact screenshot) */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header: Title + Close Button */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
          <h3 className="text-base font-black text-slate-900 tracking-tight truncate pr-2">
            {product.title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 rounded-full hover:bg-slate-100 shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options List Rows */}
        <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-0.5">
          {options.map((opt) => {
            const isAdded = addedOptIds.has(opt.id);
            return (
              <div
                key={opt.id}
                className="border border-slate-200/80 rounded-xl p-3 flex items-center justify-between bg-white hover:border-slate-300 transition shadow-2xs group"
              >
                {/* Left: Thumbnail Image + Option Name + Price */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    <img
                      src={opt.imageUrl || product.imageUrl}
                      alt={opt.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/products/ultratech_cement.png';
                      }}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-slate-900 truncate">
                      {opt.title}
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      {opt.mrp && opt.mrp > opt.price && (
                        <span className="text-slate-400 line-through text-xs">
                          ₹{opt.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="font-bold text-slate-950 text-xs sm:text-sm">
                        ₹{opt.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Solid Green Add Button */}
                <button
                  onClick={() => handleAddOption(opt)}
                  className={`px-6 sm:px-7 py-2 text-white font-bold text-xs rounded-lg shadow-xs transition shrink-0 flex items-center justify-center gap-1.5 ${
                    isAdded
                      ? 'bg-[#1e6b26]'
                      : 'bg-[#257f2e] hover:bg-[#1e6b26] active:scale-[0.98]'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Added
                    </>
                  ) : (
                    'Add'
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
};
