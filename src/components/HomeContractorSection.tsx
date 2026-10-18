'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Building, FileSpreadsheet, Calculator, CheckCircle2, Phone, ShieldCheck } from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand';

interface HomeContractorSectionProps {
  onOpenCalculator?: () => void;
  onOpenEnquiry?: () => void;
}

export const HomeContractorSection: React.FC<HomeContractorSectionProps> = ({
  onOpenCalculator,
  onOpenEnquiry,
}) => {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>B2B Commercial & Infrastructure Procurement</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Bulk Construction Material Rates for Ayodhya Contractors
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Managing hotel, dharamshala, ashram, or commercial infrastructure construction in Ayodhya Dham? Get wholesale distributor quotes for 10+ tons of cement, truckloads of TMT steel, and full containers of vitrified tiles.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Wholesale mill pricing for 100+ cement bags</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Trailer direct delivery (Fe 550D TMT rebar)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>GSTIN-compliant tax invoices for full ITC</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Dedicated on-site logistics manager</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Link
                  href="/bulk-enquiry"
                  className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition shadow-lg flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Request Wholesale Quotation (RFQ)</span>
                </Link>

                {onOpenCalculator && (
                  <button
                    onClick={onOpenCalculator}
                    className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl transition border border-slate-700 flex items-center gap-2"
                  >
                    <Calculator className="w-4 h-4 text-amber-400" />
                    <span>Launch Material Estimator</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Card: Quick Contact & Response Guarantee */}
            <div className="lg:col-span-5 bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                  Ayodhya Operations SLA
                </span>
                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-700">
                  Active 7 Days
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-400">Wholesale RFQ Response Time</div>
                  <div className="font-extrabold text-white text-base">Under 120 Minutes</div>
                </div>

                <div>
                  <div className="text-slate-400">Direct Contractor Phone Line</div>
                  <a
                    href={`tel:${BRAND_CONFIG.supportPhone.replace(/\s+/g, '')}`}
                    className="font-extrabold text-amber-400 text-sm hover:underline block"
                  >
                    {BRAND_CONFIG.supportPhone}
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Dispatches coordinated through approved stockists in Ayodhya Dham, Faizabad, Darshannagar, and Sohawal.
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
