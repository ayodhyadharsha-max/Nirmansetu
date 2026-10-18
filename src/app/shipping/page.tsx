'use client';

import React from 'react';
import { Truck, Clock, MapPin, AlertCircle, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700">
            <Truck className="w-4 h-4 text-amber-600" />
            <span>Ayodhya District Logistics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950">Site Delivery & Unloading Policy</h1>
          <div className="text-xs text-slate-500">Service Standards for Construction Job Sites in Ayodhya Dham</div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <h2 className="text-base font-black text-slate-900 pt-2">1. Delivery Service Level Agreements (SLAs)</h2>
            <p>
              We route dispatches dynamically to the closest authorized partner stockist in the Ayodhya district. Our standard delivery SLAs are based on regional zones:
            </p>

            <div className="space-y-2 pt-1 pb-2">
              {AYODHYA_REGIONAL_HUBS.map((h) => (
                <div key={h.pincode} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{h.name} (PIN {h.pincode})</span>
                    <div className="text-[11px] text-slate-500">{h.coverage}</div>
                  </div>
                  <span className="text-xs font-black text-emerald-700">{h.slaMinutes} Minutes</span>
                </div>
              ))}
            </div>

            <h2 className="text-base font-black text-slate-900 pt-2">2. Temple Corridor & Traffic Restrictions</h2>
            <p>
              In certain core zones of Ayodhya Dham (e.g. Ramkot, Naya Ghat, Hanumangarhi corridor), commercial vehicle entry may be subject to local traffic administration regulations during peak pilgrimage hours. In such circumstances, dispatches are scheduled using electric mini-transporters or small tempos to ensure on-time delivery without interruption.
            </p>

            <h2 className="text-base font-black text-slate-900 pt-2">3. Vehicle Access & Unloading</h2>
            <p>
              Standard delivery fees include vehicular transport to the specified site address. Site roads must allow safe passage for commercial tempos, 407s, or 6-wheeler trucks.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ground Floor Unloading: Standard unloading adjacent to the vehicle is accommodated.</li>
              <li>Upper Floor Lifting: Carrying materials to upper floors, basements, or through narrow interior alleys requires specialized manual labour, arranged upon advance notice.</li>
            </ul>

            <h2 className="text-base font-black text-slate-900 pt-2">4. Delivery OTP Handover</h2>
            <p>
              Always inspect the bags, pieces, and bundles before releasing the 4-digit Delivery OTP to the driver. The driver will not complete delivery until the OTP is matched.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
