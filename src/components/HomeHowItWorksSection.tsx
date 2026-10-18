'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building,
  KeyRound,
  FileCheck,
} from 'lucide-react';

export const HomeHowItWorksSection: React.FC = () => {
  return (
    <section className="py-14 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Heading */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider">
            <Building className="w-3.5 h-3.5 text-amber-600" />
            <span>Fulfillment Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
            How Ordering & Local Stockist Dispatch Operates
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We partner with vetted local building-material dealers across Ayodhya Dham and Faizabad. You get factory-direct quality with lightning-fast site delivery without middlemen.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Step 1 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-black text-lg flex items-center justify-center">
              01
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950">Select Site Materials</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Choose cement bags, TMT rebars, pipes, or tiles in exact commercial units. Enter your site PIN code and specify tempo or truck access constraints.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-bold text-amber-700 flex items-center gap-1">
              <span>Transparent benchmark pricing in integer paise</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-black text-lg flex items-center justify-center">
              02
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950">Routed to Nearest Ayodhya Stockist</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Our smart dispatch engine routes your order directly to the verified local dealer holding confirmed inventory closest to your plot in Ayodhya Dham or Faizabad.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              <span>60-120 minute transit SLA guaranteed</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-black text-lg flex items-center justify-center">
              03
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950">Inspect on Site & Share OTP</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Vehicle arrives at your site. Physically check bag manufacturing dates, rebar grade markings, and tile crates. Only release your 4-digit OTP after complete material satisfaction.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-bold text-slate-900 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Zero-risk buyer protection protocol</span>
            </div>
          </div>

        </div>

        {/* 4 Pillars of Product Trust */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <div className="text-center max-w-lg mx-auto mb-8">
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 block mb-1">
              Site Quality Commitments
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950">
              Guaranteed Genuine Materials Standards
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-950">Batch Test Certificates</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every cement and steel delivery is backed by manufacturer lab test reports confirming IS standard compliance.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-950">Fresh Stock Guarantee</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cement bags strictly dispatched within 30 days of factory packaging. Zero dampness or lump formation.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-950">100% Tax Invoices</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Proper GST invoices generated for every order. Contractors and businesses can claim full Input Tax Credit (ITC).
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-950">Safe Transit Handling</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Trained unloading staff. If any bag bursts during transport, immediate free replacement within 4 hours.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
