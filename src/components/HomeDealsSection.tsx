'use client';

import React from 'react';
import Link from 'next/link';
import { Tag, Sparkles, ArrowRight } from 'lucide-react';
import { PublicCatalogItem } from '@/types/database';
import { ProductCard } from './ProductCard';

interface HomeDealsSectionProps {
  items: PublicCatalogItem[];
  selectedPincode: string;
}

export const HomeDealsSection: React.FC<HomeDealsSectionProps> = ({
  items,
  selectedPincode,
}) => {
  // Filter items that have real verified promotional savings
  const dealItems = items
    .filter((i) => i.mrp_paise > i.selling_price_paise && i.is_in_stock)
    .slice(0, 4);

  if (dealItems.length === 0) return null;

  return (
    <section className="py-12 bg-amber-500/5 border-y border-amber-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black uppercase tracking-wider mb-2">
              <Tag className="w-3 h-3 text-amber-700" />
              <span>Admin-Approved Promotional Deals</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Verified Material Savings for Ayodhya Sites
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Genuine discounts negotiated directly with authorized manufacturer stockists. Zero fake strike-throughs.
            </p>
          </div>

          <Link
            href="/search?sort=price_asc"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 self-start md:self-auto"
          >
            <span>Explore All Discounted Materials</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dealItems.map((product) => (
            <ProductCard
              key={product.variant_id}
              product={product}
              selectedPincode={selectedPincode}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
