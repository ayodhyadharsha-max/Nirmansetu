'use client';

import React from 'react';
import Link from 'next/link';
import {
  Grid,
  ArrowRight,
  Building,
  Layers,
  PaintBucket,
  Zap,
  Wrench,
  Droplet,
  FolderTree,
  Hammer,
  Home,
} from 'lucide-react';
import { SEED_CATEGORIES } from '@/lib/catalog/seed-data';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'cement-construction-materials': <Building className="w-5 h-5 text-amber-600" />,
  'tiles-flooring': <Layers className="w-5 h-5 text-amber-600" />,
  'paints-primers-putty': <PaintBucket className="w-5 h-5 text-amber-600" />,
  'electrical-products': <Zap className="w-5 h-5 text-amber-600" />,
  'plumbing-pipes-fittings': <Wrench className="w-5 h-5 text-amber-600" />,
  'sanitaryware-bathroom-fittings': <Droplet className="w-5 h-5 text-amber-600" />,
  'plywood-mdf-laminates': <FolderTree className="w-5 h-5 text-amber-600" />,
  'hardware-tools-fasteners': <Hammer className="w-5 h-5 text-amber-600" />,
  'kitchen-home-improvement': <Home className="w-5 h-5 text-amber-600" />,
};

const CATEGORY_BACKGROUNDS: Record<string, string> = {
  'cement-construction-materials': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
  'tiles-flooring': 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80',
  'paints-primers-putty': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80',
  'electrical-products': 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80',
  'plumbing-pipes-fittings': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
  'sanitaryware-bathroom-fittings': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  'plywood-mdf-laminates': 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80',
  'hardware-tools-fasteners': 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80',
  'kitchen-home-improvement': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
};

export const HomeCategoryGrid: React.FC = () => {
  return (
    <section className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-wider mb-2">
              <Grid className="w-3.5 h-3.5 text-amber-600" />
              <span>Full Project Coverage</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Shop by Category
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              From foundation cement and TMT steel to finishing tiles and sanitaryware.
            </p>
          </div>

          <Link
            href="/search"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 self-start md:self-auto"
          >
            <span>View All Materials</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 9 Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SEED_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group relative rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between bg-slate-900 text-white min-h-[170px]"
            >
              {/* Background Photography with Gradient Overlay */}
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500 opacity-35"
                style={{
                  backgroundImage: `url(${CATEGORY_BACKGROUNDS[cat.slug] || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80'})`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/40" />

              {/* Content Overlay */}
              <div className="relative z-10 p-5 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 text-amber-400 group-hover:scale-110 transition-transform">
                    {CATEGORY_ICONS[cat.slug] || <Building className="w-5 h-5 text-amber-400" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    GST {cat.default_gst_rate_pct}%
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-1 leading-snug">
                    {cat.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:underline">
                    <span>Explore Products</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};
