'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Minus,
  Check,
  Clock,
  Sparkles,
  Info,
  Tag,
  Building,
} from 'lucide-react';
import { formatPaiseToRupees } from '@/lib/money';

export interface CatalogItem {
  id: string;
  variantId: string;
  title: string;
  category: string;
  brand: string;
  brandLogo?: string;
  unit: string;
  mrpPaise: number;
  sellingPricePaise: number;
  minOrderQty: number;
  hsnCode: string;
  specSummary: string;
  partnerSupplier: string;
  isFeatured?: boolean;
}

export const DEMO_CATALOG_ITEMS: CatalogItem[] = [
  {
    id: 'p1',
    variantId: 'v0000000-0000-0000-0000-000000000001',
    title: 'UltraTech Super PPC Cement (50kg Bag)',
    category: 'cement',
    brand: 'UltraTech Cement',
    unit: '50kg Bag',
    mrpPaise: 42000, // ₹420.00
    sellingPricePaise: 38500, // ₹385.00
    minOrderQty: 5,
    hsnCode: '252329',
    specSummary: 'IS 1489 Part 1 Certified • High Reactive Fly Ash • Dense Impermeable Concrete',
    partnerSupplier: 'Awadh Building Material Mart (Tedhi Bazar)',
    isFeatured: true,
  },
  {
    id: 'p2',
    variantId: 'v0000000-0000-0000-0000-000000000002',
    title: 'Tata Tiscon 550D TMT Steel Rebar (12mm, 12m Rod)',
    category: 'steel',
    brand: 'Tata Tiscon',
    unit: '12m Rod',
    mrpPaise: 85000, // ₹850.00
    sellingPricePaise: 76000, // ₹760.00
    minOrderQty: 10,
    hsnCode: '721420',
    specSummary: 'Fe 550D Super Ductile • 100% Primary Virgin Steel • High Earthquake Resistance',
    partnerSupplier: 'Ramrajya Iron & Cement Depot (Deokali Road)',
    isFeatured: true,
  },
  {
    id: 'p3',
    variantId: 'v0000000-0000-0000-0000-000000000003',
    title: 'Tata Tiscon 550D TMT Steel Rebar (16mm, 12m Rod)',
    category: 'steel',
    brand: 'Tata Tiscon',
    unit: '12m Rod',
    mrpPaise: 150000, // ₹1,500.00
    sellingPricePaise: 135000, // ₹1,350.00
    minOrderQty: 5,
    hsnCode: '721420',
    specSummary: 'Fe 550D Heavy Column Grade • Uniform Rib Pattern for Strong Concrete Grip',
    partnerSupplier: 'Ramrajya Iron & Cement Depot (Deokali Road)',
    isFeatured: false,
  },
  {
    id: 'p4',
    variantId: 'v0000000-0000-0000-0000-000000000005',
    title: 'Standard Red Kiln Clay Bricks (Avadh 1st Class)',
    category: 'bricks',
    brand: 'Avadh Kilns',
    unit: 'Batch of 1,000 Bricks',
    mrpPaise: 850000, // ₹8,500.00
    sellingPricePaise: 750000, // ₹7,500.00
    minOrderQty: 1,
    hsnCode: '690100',
    specSummary: 'Hoffmann Kiln Fired • Sharp Edges with Clear Metallic Ring • 1200 PSI Strength',
    partnerSupplier: 'Awadh Building Material Mart (Tedhi Bazar)',
    isFeatured: true,
  },
  {
    id: 'p5',
    variantId: 'v0000000-0000-0000-0000-000000000006',
    title: 'Dr. Fixit Pidiproof LW+ Waterproofing Compound (5L)',
    category: 'waterproofing',
    brand: 'Dr. Fixit (Pidilite)',
    unit: '5 Litre Can',
    mrpPaise: 98000, // ₹980.00
    sellingPricePaise: 84000, // ₹840.00
    minOrderQty: 1,
    hsnCode: '382440',
    specSummary: 'Integral Liquid Waterproofing • Prevents Capillary Dampness & Efflorescence',
    partnerSupplier: 'Sarayu Hardware & Electrical Store (Darshannagar)',
    isFeatured: false,
  },
  {
    id: 'p6',
    variantId: 'v0000000-0000-0000-0000-000000000008',
    title: 'Supreme Lifeline CPVC Pipe (3/4" / 20mm, 3m SDR 11)',
    category: 'plumbing',
    brand: 'Supreme Pipes',
    unit: '3m Pipe',
    mrpPaise: 28000, // ₹280.00
    sellingPricePaise: 23500, // ₹235.00
    minOrderQty: 5,
    hsnCode: '391723',
    specSummary: 'Hot & Cold Potable Water Plumbing • Lead Free • Temperatures up to 93°C',
    partnerSupplier: 'Sarayu Hardware & Electrical Store (Darshannagar)',
    isFeatured: false,
  },
];

interface ProductCatalogProps {
  selectedCategory: string | null;
  selectedPincode: string;
  onAddToCart: (item: CatalogItem, quantity: number) => void;
  onOpenEnquiry: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  selectedCategory,
  selectedPincode,
  onAddToCart,
  onOpenEnquiry,
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const filteredItems = selectedCategory
    ? DEMO_CATALOG_ITEMS.filter((i) => i.category === selectedCategory)
    : DEMO_CATALOG_ITEMS;

  const getQty = (item: CatalogItem) => quantities[item.id] || item.minOrderQty;

  const updateQty = (item: CatalogItem, delta: number) => {
    const current = getQty(item);
    const updated = Math.max(item.minOrderQty, current + delta);
    setQuantities((prev) => ({ ...prev, [item.id]: updated }));
  };

  const handleAdd = (item: CatalogItem) => {
    const qty = getQty(item);
    onAddToCart(item, qty);
    setAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1800);
  };

  return (
    <section className="py-10 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
              <Building className="w-3.5 h-3.5" />
              <span>Ayodhya Live Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Genuine Materials Ready for Dispatch
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Serving PIN <span className="font-bold text-slate-900">{selectedPincode}</span> with transparent local stockist pricing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenEnquiry}
              className="text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3.5 py-2 rounded-xl transition shadow-sm"
            >
              Need 10+ Tons or Full Truckloads?
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const currentQty = getQty(item);
            const discountPct = Math.round(
              ((item.mrpPaise - item.sellingPricePaise) / item.mrpPaise) * 100
            );
            const isAdded = addedIds[item.id];

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Brand & Badge Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                      {item.brand}
                    </span>
                    {discountPct > 0 && (
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-black text-base text-slate-950 group-hover:text-amber-700 transition leading-snug">
                    {item.title}
                  </h3>

                  {/* Specs & HSN */}
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {item.specSummary}
                  </p>

                  <div className="mt-2.5 text-[11px] text-slate-400 font-mono">
                    HSN: {item.hsnCode} • Unit: {item.unit}
                  </div>

                  {/* Local Supplier Fulfillment Attribution */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">Fulfilling Supplier:</span>{' '}
                    <span>{item.partnerSupplier}</span>
                  </div>
                </div>

                {/* Price and Cart Action */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <div className="text-lg font-black text-slate-950">
                        {formatPaiseToRupees(item.sellingPricePaise)}
                        <span className="text-xs font-normal text-slate-500 ml-1">/ {item.unit}</span>
                      </div>
                      {item.mrpPaise > item.sellingPricePaise && (
                        <div className="text-xs text-slate-400 line-through">
                          MRP {formatPaiseToRupees(item.mrpPaise)}
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 text-right">
                      Min Order: <span className="font-bold text-slate-900">{item.minOrderQty} {item.unit}</span>
                    </div>
                  </div>

                  {/* Quantity Stepper & Add Button */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                      <button
                        onClick={() => updateQty(item, -1)}
                        disabled={currentQty <= item.minOrderQty}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 shadow-xs"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center font-bold text-xs text-slate-900">
                        {currentQty}
                      </span>
                      <button
                        onClick={() => updateQty(item, 1)}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleAdd(item)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-950 hover:bg-slate-800 text-amber-400'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Added to Cart!</span>
                        </>
                      ) : (
                        <span>Add {currentQty} {item.unit}</span>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
