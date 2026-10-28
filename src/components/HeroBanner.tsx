'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  FileText,
  BadgePercent,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand';

interface HeroBannerProps {
  onPincodeSubmit: (pincode: string) => void;
  onOpenEnquiry: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onPincodeSubmit,
  onOpenEnquiry,
}) => {
  const [inputPincode, setInputPincode] = useState('');
  const [checkStatus, setCheckStatus] = useState<string | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = inputPincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setCheckStatus('Please enter a valid 6-digit PIN code.');
      return;
    }
    onPincodeSubmit(cleanPin);
    setCheckStatus(`Pincode ${cleanPin} activated. Showing verified local stock and delivery times.`);
  };

  return (
    <div className="relative bg-gradient-to-b from-amber-500/10 via-slate-50 to-white pt-8 pb-12 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* DEMO NOTICE BADGE (As required by project instructions: clearly labeled) */}
        {BRAND_CONFIG.isDemoMode && (
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 bg-amber-100 border border-amber-300 rounded-full text-amber-900 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
            <span>DEMO ARCHITECTURE & PILOT PLATFORM • AYODHYA DISTRICT PILOT</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-amber-400 rounded-lg text-xs font-bold tracking-wide uppercase">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Local Jobsite Delivery in Ayodhya Dham</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight leading-[1.15]">
              Construction Materials Delivered On-Demand in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-700">
                Ayodhya
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              Order authentic cement, primary TMT rebars, kiln red bricks, CPVC plumbing, and waterproofing directly to your project site. Fulfilled by approved local dealers across Ayodhya Dham & Faizabad.
            </p>

            {/* Quick Pincode Checker Input Box */}
            <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-300 shadow-md max-w-md">
              <form onSubmit={handleCheck} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter Ayodhya PIN (e.g. 224123, 224001)"
                  value={inputPincode}
                  onChange={(e) => setInputPincode(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-amber-400 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <span>Check Delivery</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
              {checkStatus && (
                <div className="text-[11px] font-semibold text-emerald-700 px-3 pt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{checkStatus}</span>
                </div>
              )}
            </div>

            {/* Trust Pill Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-[11px] leading-tight">
                  <div className="font-bold text-slate-900">Quality Assured</div>
                  <div className="text-slate-500">Inspected on Delivery</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-[11px] leading-tight">
                  <div className="font-bold text-slate-900">Direct Delivery</div>
                  <div className="text-slate-500">Auto, Ace, Tipper</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                <BadgePercent className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="text-[11px] leading-tight">
                  <div className="font-bold text-slate-900">Fair Pricing</div>
                  <div className="text-slate-500">No Mid-Tier Markup</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                <div className="text-[11px] leading-tight">
                  <div className="font-bold text-slate-900">GST Invoice</div>
                  <div className="text-slate-500">Statutory Tax Invoices</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Contractor B2B Banner Card */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="inline-block px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold text-[11px] tracking-wide mb-3">
                BUILDERS & CONTRACTORS DESK
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Ashram, Hotel & Commercial Site Quotations
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Building in Ayodhya Dham or Faizabad bypass? Get wholesale truckload rates, scheduled site dispatches, and credit terms for bulk quantities.
              </p>

              <div className="mt-5 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Wholesale bulk pricing for 100+ bags cement & 5+ tons steel</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Multi-supplier consolidated delivery scheduling</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Dedicated Ayodhya site operations manager</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Response</div>
                  <div className="text-xs font-bold text-emerald-400">Same-Day Quotation</div>
                </div>
                <button
                  onClick={onOpenEnquiry}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-md"
                >
                  Request Bulk Quote
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
