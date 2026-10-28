'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';

interface HeroPromoBannerProps {
  onOpenEnquiry?: () => void;
}

export const HeroPromoBanner: React.FC<HeroPromoBannerProps> = ({ onOpenEnquiry }) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      <div className="relative rounded-3xl overflow-hidden border border-amber-200/90 shadow-sm bg-gradient-to-br from-amber-50 via-white to-amber-100/30">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center p-6 sm:p-8 lg:p-10">
          
          {/* Left Column: Core Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/25 border border-amber-400/40 text-amber-900 text-xs font-bold tracking-tight">
              <Zap className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
              <span>Ayodhya Dham &amp; Faizabad Hub • Direct Authorized Stockists</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-[1.12]">
              Everything Your Project Needs.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-700">
                In One Place.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              Explore construction materials and request competitive bulk quotations from approved primary distributors and stockists across Ayodhya Dham.
            </p>

            {/* CTAs matching Section 3 requirements */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/categories/cement-construction-materials"
                className="px-6 py-3 bg-[#257f2e] hover:bg-[#1f6d27] text-white font-extrabold text-sm rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Explore Materials</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {onOpenEnquiry && (
                <button
                  type="button"
                  onClick={onOpenEnquiry}
                  className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-extrabold text-sm rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Request Bulk Pricing (RFQ)</span>
                </button>
              )}
            </div>

            {/* Quality Commitments Strip */}
            <div className="flex flex-wrap items-center gap-4 pt-3 text-xs font-semibold text-slate-600 border-t border-slate-200/70">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#257f2e]" />
                <span>Inspect Before Drop-off OTP</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#257f2e]" />
                <span>Statutory GST Invoices</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#257f2e]" />
                <span>Scheduled Jobsite Delivery</span>
              </span>
            </div>

          </div>

          {/* Right Column: Visual Material Photography */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-16/10 lg:aspect-4/3 group">
              <img
                src="/images/fulfillment/fulfillment_step1_select.jpg"
                alt="Ayodhya construction site materials planning - cement, TMT rebars, bricks and live rates"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-4">
                <div className="text-white">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Live Ayodhya Stockist Network
                  </div>
                  <div className="text-xs font-medium text-slate-200">
                    Direct dispatches across Ayodhya Dham, Faizabad, Darshannagar &amp; Sohawal
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
