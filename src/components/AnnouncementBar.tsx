'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Phone } from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-[#f5b800] text-slate-950 px-4 py-2 text-xs sm:text-sm font-bold tracking-tight border-b border-amber-400">
      <div className="max-w-7xl mx-auto flex items-center justify-between sm:justify-center relative">
        <div className="flex items-center justify-center gap-2 text-center w-full">
          <span>Open 8 am to 8 pm all days</span>
        </div>

        {/* Direct Supplier Portal shortcut */}
        <div className="hidden md:flex items-center gap-3 absolute right-0 text-[11px] font-semibold text-slate-900">
          <Link
            href="/supplier"
            className="hover:underline flex items-center gap-1 font-bold text-slate-900 hover:text-slate-950 transition"
          >
            <span>Supplier Portal</span>
          </Link>
          <div className="hidden xl:flex items-center gap-1 text-slate-800">
            <Phone className="w-3 h-3" />
            <span>{BRAND_CONFIG.supportPhone}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
