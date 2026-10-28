'use client';

import React from 'react';
import { Truck, Banknote, ShieldCheck } from 'lucide-react';

export const ServiceHighlights: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
        
        {/* 1. Pay on Delivery */}
        <div className="p-3.5 sm:p-4 flex items-center gap-3.5 hover:bg-slate-50/50 transition-colors">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
            <Banknote className="w-6 h-6 text-slate-800" />
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 leading-tight">Pay on Delivery</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">Verify on site, release OTP after satisfaction</div>
          </div>
        </div>

        {/* 2. Direct Distributor Pricing */}
        <div className="p-3.5 sm:p-4 flex items-center gap-3.5 hover:bg-slate-50/50 transition-colors">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-slate-900 shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 leading-tight">Direct Mill &amp; Stockist Rates</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">Transparent integer paise pricing with statutory GST invoices</div>
          </div>
        </div>

        {/* 3. Rapid Site Dispatch */}
        <div className="p-3.5 sm:p-4 flex items-center gap-3.5 hover:bg-slate-50/50 transition-colors">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-slate-800 shrink-0">
            <Truck className="w-6 h-6 text-slate-800" />
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 leading-tight">Jobsite Dispatch Network</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">Coordinated through approved Ayodhya dealers</div>
          </div>
        </div>

      </div>
    </div>
  );
};
