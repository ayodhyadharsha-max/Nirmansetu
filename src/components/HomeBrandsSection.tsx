'use client';

import React from 'react';
import Link from 'next/link';
import { Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SEED_BRANDS } from '@/lib/catalog/seed-data';

export const HomeBrandsSection: React.FC = () => {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Certified Manufacturing Partners</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Featured Brands Based on Approved Catalogue
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Direct dispatches from authorized primary distributors with authentic test certificates and warranties.
            </p>
          </div>

          <Link
            href="/search"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 self-start md:self-auto"
          >
            <span>View All Brand Catalogues</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {SEED_BRANDS.map((brand) => (
            <Link
              key={brand.id}
              href={`/search?brand=${brand.slug}`}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50/50 hover:border-amber-300 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 group-hover:scale-105 transition-transform mb-3 shadow-2xs">
                  {brand.name.charAt(0)}
                </div>
                <div className="text-xs font-black text-slate-900 group-hover:text-amber-950 truncate">
                  {brand.name}
                </div>
                <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  {brand.description}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-semibold text-emerald-700">Verified Stock</span>
                <span className="group-hover:translate-x-0.5 transition-transform text-slate-700 font-bold">→</span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};
