'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Grid,
  ChevronDown,
  Building,
  Layers,
  PaintBucket,
  Zap,
  Wrench,
  Droplet,
  FolderTree,
  Hammer,
  Home,
  ArrowRight,
  Sparkles,
  Calculator,
  FileSpreadsheet,
} from 'lucide-react';
import { SEED_CATEGORIES, SEED_BRANDS } from '@/lib/catalog/seed-data';

interface DesktopMegaMenuProps {
  onOpenCalculator?: () => void;
  onOpenEnquiry?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'cement-construction-materials': <Building className="w-4 h-4 text-amber-600" />,
  'tiles-flooring': <Layers className="w-4 h-4 text-amber-600" />,
  'paints-primers-putty': <PaintBucket className="w-4 h-4 text-amber-600" />,
  'electrical-products': <Zap className="w-4 h-4 text-amber-600" />,
  'plumbing-pipes-fittings': <Wrench className="w-4 h-4 text-amber-600" />,
  'sanitaryware-bathroom-fittings': <Droplet className="w-4 h-4 text-amber-600" />,
  'plywood-mdf-laminates': <FolderTree className="w-4 h-4 text-amber-600" />,
  'hardware-tools-fasteners': <Hammer className="w-4 h-4 text-amber-600" />,
  'kitchen-home-improvement': <Home className="w-4 h-4 text-amber-600" />,
};

export const DesktopMegaMenu: React.FC<DesktopMegaMenuProps> = ({
  onOpenCalculator,
  onOpenEnquiry,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative hidden lg:block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-slate-900 hover:bg-slate-100 transition-colors"
      >
        <Grid className="w-4 h-4 text-amber-600" />
        <span>All Categories</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Mega Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 w-[840px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-3 gap-6">
            
            {/* Column 1 & 2: 9 Core Categories */}
            <div className="col-span-2 border-r border-slate-100 pr-6">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Ayodhya Stockist Catalog
                </span>
                <Link
                  href="/search"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <span>View All Materials</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {SEED_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-amber-50/70 border border-transparent hover:border-amber-200/60 transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {CATEGORY_ICONS[cat.slug] || <Building className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-950 truncate">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {cat.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Column 3: Featured Brands & Quick Tools */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-3">
                  Verified Brands
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {SEED_BRANDS.slice(0, 8).map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/search?brand=${brand.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-amber-100/60 text-slate-700 hover:text-slate-900 text-[11px] font-bold truncate transition"
                    >
                      {brand.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* B2B Contractor Quick Banner */}
              <div className="mt-4 p-3.5 bg-gradient-to-br from-slate-950 to-slate-800 text-white rounded-xl">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Contractor Desk</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                  Need full truckloads of cement or TMT steel delivered directly to your Ayodhya site?
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href="/bulk-enquiry"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold rounded-lg transition"
                  >
                    Submit RFQ
                  </Link>
                  {onOpenCalculator && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onOpenCalculator();
                      }}
                      className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                    >
                      <Calculator className="w-3 h-3 text-amber-400" />
                      <span>Estimator</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
