'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, ShieldCheck, Truck, Users, MapPin, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header Hero */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-200 text-xs font-black uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Ayodhya&apos;s Building Materials Network</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              About {BRAND_CONFIG.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Empowering construction sites across Ayodhya Dham and Faizabad with guaranteed 60-120 minute material delivery through verified local stockists.
            </p>
          </div>

          {/* Business Model Transparency */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Our Operating Philosophy</span>
            </div>
            <h2 className="text-2xl font-black text-slate-950">
              Zero Owned Warehouses. 100% Genuine Local Stockist Fulfillment.
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <p>
                Inspired by the agile on-demand delivery models of modern construction marketplaces, <strong>{BRAND_CONFIG.name}</strong> was created to solve the acute logistics friction facing builders, contractors, and individuals in Ayodhya.
              </p>
              <p>
                Instead of locking up millions in inventory or running centralized speculative warehouses, we partner directly with the most established building material stockists across Ayodhya Dham, Faizabad, Darshannagar, and Sohawal.
              </p>
              <p>
                When an order or bulk schedule is confirmed on our platform, our intelligent dispatch router assigns the order to the vetted local stockist closest to your construction site. Sourced directly from manufacturers—including UltraTech, Tata Tiscon, Kajaria, Asian Paints, and Supreme—every order arrives with manufacturer test certificates and a physical drop-off OTP inspection guarantee.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-black text-lg text-slate-950">60-120 Mins</div>
                <div className="text-xs text-slate-500 mt-0.5">Average site dispatch SLA across Ayodhya district</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-black text-lg text-slate-950">100% GST ITC</div>
                <div className="text-xs text-slate-500 mt-0.5">Formal tax invoice with every order for contractor claims</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-black text-lg text-slate-950">Zero Risk OTP</div>
                <div className="text-xs text-slate-500 mt-0.5">Release OTP to the driver only after physical inspection</div>
              </div>
            </div>
          </div>

          {/* Regional Hubs Coverage */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">
              Active Regional Hubs in Ayodhya District
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AYODHYA_REGIONAL_HUBS.map((hub) => (
                <div key={hub.pincode} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">{hub.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      PIN {hub.pincode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{hub.coverage}</p>
                  <div className="text-[11px] font-bold text-amber-800">
                    SLA: {hub.slaMinutes} Minutes {hub.isExpress && '• Express Available'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact / CTA Banner */}
          <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-10 text-center space-y-4">
            <h3 className="text-xl sm:text-2xl font-black text-amber-400">
              Need Materials for Your Project in Ayodhya?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              Whether you need 20 bags of cement for a residential repair or 50 tons of TMT steel for a hotel project, our local team is here to assist.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/search"
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition shadow-md"
              >
                Browse Materials Catalog
              </Link>
              <Link
                href="/bulk-enquiry"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl transition"
              >
                Contractor Wholesale RFQ
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
