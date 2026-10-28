'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { HOMERUN_CATEGORIES } from '@/config/homerun-catalog';
import { Category } from '@/types/database';

interface HomeCategoryGridProps {
  categories?: Category[];
}

export const HomeCategoryGrid: React.FC<HomeCategoryGridProps> = () => {
  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* The 24 Category Squircles Grid matching home-run.co screenshots 2 & 4 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {HOMERUN_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="flex flex-col items-center group cursor-pointer text-center"
            >
              {/* Squircle Card Container */}
              <div className="relative w-full aspect-square rounded-3xl bg-[#eef8f8] group-hover:bg-[#e4f2f2] border border-[#d8eded]/70 transition-all duration-200 flex items-center justify-center p-3 sm:p-4 shadow-2xs group-hover:shadow-md group-hover:-translate-y-1">
                
                {/* Yellow "Bulk Prices" badge (matching Cement & Tiling in screenshots) */}
                {cat.badge && (
                  <div className="absolute top-2 left-2 z-10 bg-[#f5b800] text-slate-950 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full shadow-2xs tracking-tight">
                    {cat.badge}
                  </div>
                )}

                {/* Cutout Image of Category Product */}
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                  <img
                    src={cat.imageUrl}
                    alt={cat.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-sm rounded-xl"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Category Label Below Squircle */}
              <span className="mt-2 text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-2 px-1 leading-snug">
                {cat.title}
              </span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};
