'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  KeyRound,
  FileCheck,
  Sparkles,
  MapPin,
  BadgeCheck,
} from 'lucide-react';

export const HomeHowItWorksSection: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-white via-slate-50 to-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* ========================================================
            PART 1: FULFILLMENT ARCHITECTURE
            ======================================================== */}
        <div className="space-y-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f5b800]/20 border border-[#f5b800]/40 text-slate-900 text-xs font-black uppercase tracking-wider shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>FULFILLMENT ARCHITECTURE</span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
              How Ordering &amp; Local Stockist Dispatch Operates
            </h2>
            
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              We partner with vetted local building-material dealers across Ayodhya Dham and Faizabad. You get factory-direct quality with lightning-fast site delivery without middlemen.
            </p>
          </div>

          {/* 3 Step Visual Photo Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* STEP 01 */}
            <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
              {/* Photo Area */}
              <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-slate-100">
                <img
                  src="/images/fulfillment/fulfillment_step1_select.jpg"
                  alt="Select Site Materials"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
                
                {/* Step Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="w-10 h-10 rounded-2xl bg-[#f5b800] text-slate-950 font-black text-base flex items-center justify-center shadow-lg border-2 border-white">
                    01
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-bold text-slate-900 shadow-md">
                    Site Material Planning
                  </span>
                </div>

                {/* Subtag on Photo */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs font-semibold">
                  <span className="flex items-center gap-1.5 drop-shadow-md">
                    <MapPin className="w-3.5 h-3.5 text-[#f5b800]" />
                    PIN Code Verified
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] text-amber-300 backdrop-blur-xs">
                    Live Rates
                  </span>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <h3 className="text-lg sm:text-xl font-black text-slate-950 group-hover:text-amber-700 transition-colors">
                    Select Site Materials
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Choose cement bags, TMT rebars, pipes, or tiles in exact commercial units. Enter your site PIN code and specify tempo or truck access constraints.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/80 w-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">Transparent benchmark pricing in integer paise</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 02 */}
            <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
              {/* Photo Area */}
              <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-slate-100">
                <img
                  src="/images/fulfillment/fulfillment_step2_dispatch.jpg"
                  alt="Routed to Nearest Ayodhya Stockist"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
                
                {/* Step Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="w-10 h-10 rounded-2xl bg-[#f5b800] text-slate-950 font-black text-base flex items-center justify-center shadow-lg border-2 border-white">
                    02
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-bold text-slate-900 shadow-md">
                    Smart Warehouse Routing
                  </span>
                </div>

                {/* Subtag on Photo */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs font-semibold">
                  <span className="flex items-center gap-1.5 drop-shadow-md">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    Tempo &amp; Tipper Fleet
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-600/90 text-[10px] text-white font-bold backdrop-blur-xs">
                    Scheduled Site Dispatch
                  </span>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <h3 className="text-lg sm:text-xl font-black text-slate-950 group-hover:text-emerald-700 transition-colors">
                    Routed to Nearest Ayodhya Stockist
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Our smart dispatch engine routes your order directly to the verified local dealer holding confirmed inventory closest to your plot in Ayodhya Dham or Faizabad.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80 w-full">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Local site delivery scheduled from nearest stocking point</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 03 */}
            <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
              {/* Photo Area */}
              <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-slate-100">
                <img
                  src="/images/fulfillment/fulfillment_step3_inspect_otp.jpg"
                  alt="Inspect on Site & Share OTP"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
                
                {/* Step Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="w-10 h-10 rounded-2xl bg-[#f5b800] text-slate-950 font-black text-base flex items-center justify-center shadow-lg border-2 border-white">
                    03
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-bold text-slate-900 shadow-md">
                    Site Delivery Verification
                  </span>
                </div>

                {/* Subtag on Photo */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs font-semibold">
                  <span className="flex items-center gap-1.5 drop-shadow-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    Physical Material Check
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#f5b800] text-[10px] text-slate-950 font-black backdrop-blur-xs">
                    4-Digit OTP
                  </span>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <h3 className="text-lg sm:text-xl font-black text-slate-950 group-hover:text-blue-700 transition-colors">
                    Inspect on Site &amp; Share OTP
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Vehicle arrives at your site. Physically check bag manufacturing dates, rebar grade markings, and tile crates. Only release your 4-digit OTP after complete material satisfaction.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300/80 w-full">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">Zero-risk buyer protection protocol</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================
            PART 2: SITE QUALITY COMMITMENTS
            ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm relative overflow-hidden">
          
          {/* Subtle Top Decorative Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-blue-500" />

          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              SITE QUALITY COMMITMENTS
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Guaranteed Genuine Materials Standards
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Strict compliance protocols enforced across every distributor dispatch.
            </p>
          </div>

          {/* 4 Feature Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pillar 1: Batch Test Certificates */}
            <div className="bg-slate-50/70 hover:bg-emerald-50/40 p-6 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-slate-950">
                    On-Site Physical Inspection
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Inspect materials, packaging integrity, and counts at your jobsite before releasing your Drop-off OTP.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60">
                <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                  Site Inspection on Delivery
                </span>
              </div>
            </div>

            {/* Pillar 2: Fresh Stock Guarantee */}
            <div className="bg-slate-50/70 hover:bg-amber-50/40 p-6 rounded-2xl border border-slate-200/80 hover:border-amber-300 transition-all duration-200 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-slate-950">
                    Fresh Stock Guarantee
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cement bags strictly dispatched within 30 days of factory packaging. Zero dampness or lump formation.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60">
                <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                  &lt; 30 Days Factory Fresh
                </span>
              </div>
            </div>

            {/* Pillar 3: 100% Tax Invoices */}
            <div className="bg-slate-50/70 hover:bg-blue-50/40 p-6 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-slate-950">
                    Statutory GST Invoices
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Official GST invoices generated with HSN codes. Registered businesses can provide their GSTIN (ITC subject to rules).
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60">
                <span className="inline-block text-[10px] font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded">
                  GST Invoicing with GSTIN
                </span>
              </div>
            </div>

            {/* Pillar 4: Safe Transit Handling */}
            <div className="bg-slate-50/70 hover:bg-purple-50/40 p-6 rounded-2xl border border-slate-200/80 hover:border-purple-300 transition-all duration-200 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-slate-950">
                    Safe Transit Handling
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Trained unloading staff. If any bag bursts during transport, immediate free replacement within 4 hours.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60">
                <span className="inline-block text-[10px] font-bold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded">
                  4-Hour Free Replacement
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
