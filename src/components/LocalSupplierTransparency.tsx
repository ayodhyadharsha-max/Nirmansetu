'use client';

import React from 'react';
import { Store, Truck, ShieldCheck, Handshake, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand';

export const LocalSupplierTransparency: React.FC = () => {
  return (
    <section className="py-12 bg-white border-t border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
          <div className="max-w-3xl">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider mb-4">
              <Handshake className="w-3.5 h-3.5" />
              <span>Ayodhya Supplier Fulfillment Model</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Hyperlocal Fulfillment Through Approved Local Dealers
            </h2>

            <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
              {BRAND_CONFIG.name} operates as an on-demand technology and logistics bridge in Ayodhya Dham and Faizabad. We do not maintain capital-heavy central warehouses or an owned delivery fleet. Instead, we empower trusted local building material merchants, stockists, and cement-steel dealers to fulfill orders efficiently.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-6 border-t border-slate-800">
              
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">1. Verified Local Stockists</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Orders are automatically matched with the nearest verified supplier in your PIN code (Tedhi Bazar, Deokali, Darshannagar).
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">2. Rapid Site Transport</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dispatched via local three-wheeler loaders, Tata Ace tempos, and tipper trucks equipped with OTP dropoff verification.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">3. Single Invoice & Warranty</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Standardized quality guarantee, formal GST tax invoicing, and digital payment security backed by {BRAND_CONFIG.name}.
                </p>
              </div>

            </div>

            {/* Supplier Onboarding Callout */}
            <div className="mt-8 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-xs sm:text-sm text-amber-300">
                  Are you a building material merchant in Ayodhya or Faizabad?
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Expand your construction site order volume with zero upfront setup cost.
                </div>
              </div>
              <a
                href={`mailto:${BRAND_CONFIG.supportEmail}?subject=Supplier%20Partnership%20Enquiry%20-%20Ayodhya`}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition whitespace-nowrap self-start sm:self-auto"
              >
                Apply as Partner Supplier
              </a>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
