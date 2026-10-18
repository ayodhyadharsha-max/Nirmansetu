'use client';

import React from 'react';
import Link from 'next/link';
import { Building, Sparkles } from 'lucide-react';
import { PublicCatalogItem } from '@/types/database';
import { SEED_CATALOG_ITEMS } from '@/lib/catalog/seed-data';
import { ProductCard } from './ProductCard';

interface ProductCatalogProps {
  items?: PublicCatalogItem[];
  selectedCategory: string | null;
  selectedPincode: string;
  onAddToCart: (item: PublicCatalogItem, quantity: number) => void;
  onOpenEnquiry: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  items = SEED_CATALOG_ITEMS,
  selectedCategory,
  selectedPincode,
  onAddToCart,
  onOpenEnquiry,
}) => {
  const filteredItems = selectedCategory
    ? items.filter((i) => i.category_slug === selectedCategory)
    : items;

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
            <Link
              href="/search"
              className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border border-slate-300 px-3.5 py-2 rounded-xl transition shadow-xs"
            >
              Search All Items
            </Link>
            <button
              onClick={onOpenEnquiry}
              className="text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 border border-amber-500/50 px-3.5 py-2 rounded-xl transition shadow-xs"
            >
              Need 10+ Tons or Full Truckloads?
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <div className="text-3xl">🏗️</div>
            <h3 className="font-bold text-base text-slate-900">No products found in this category</h3>
            <p className="text-xs text-slate-500">
              Approved local stockists in Ayodhya are currently onboarding items for this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.product_id}
                product={item}
                onAddToCart={onAddToCart}
                selectedPincode={selectedPincode}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
