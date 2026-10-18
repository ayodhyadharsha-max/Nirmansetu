'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ShieldCheck, Phone, Truck, Sparkles } from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-[#EFC41A] text-slate-950 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold border-b border-amber-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* Left: Hours & SLA */}
        <div className="flex items-center gap-2 sm:gap-3 truncate">
          <span className="flex items-center gap-1 font-bold">
            <Clock className="w-3.5 h-3.5 text-slate-900 shrink-0" />
            <span className="truncate">{BRAND_CONFIG.operatingHours}</span>
          </span>
          <span className="hidden md:inline text-amber-700">•</span>
          <span className="hidden md:flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-slate-900 shrink-0" />
            <span>Direct Job Site Delivery Across Ayodhya & Faizabad</span>
          </span>
        </div>

        {/* Center: Core Guarantee */}
        <div className="hidden lg:flex items-center gap-1.5 font-bold text-slate-900">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
          <span>100% Genuine Materials Fulfillments from Approved Local Stockists</span>
        </div>

        {/* Right: Phone & Contractor Hotline */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/bulk-enquiry"
            className="hidden sm:flex items-center gap-1 text-[11px] font-extrabold text-amber-950 hover:underline"
          >
            <Sparkles className="w-3 h-3 text-amber-900" />
            <span>Contractor Pricing</span>
          </Link>
          <a
            href={`tel:${BRAND_CONFIG.supportPhone.replace(/\s+/g, '')}`}
            className="flex items-center gap-1 text-[11px] text-slate-900 font-bold hover:underline"
          >
            <Phone className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">Site Helpline:</span>
            <span>{BRAND_CONFIG.supportPhone}</span>
          </a>
        </div>

      </div>
    </div>
  );
};
