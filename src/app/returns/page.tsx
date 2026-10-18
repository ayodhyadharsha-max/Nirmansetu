'use client';

import React from 'react';
import { ShieldCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BRAND_CONFIG } from '@/config/brand';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Inspection Protocol</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950">
            Material Inspection, Breakage & Returns Policy
          </h1>
          <div className="text-xs text-slate-500">
            Quality Assurance Standard for Construction Materials in Ayodhya
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Due to the structural integrity demands of civil construction, materials delivered to building sites must meet rigorous standards. We maintain a zero-friction replacement guarantee for genuine transit damage.
            </p>

            <h2 className="text-base font-black text-slate-900 pt-2">1. On-Site Physical Inspection (Pre-OTP)</h2>
            <p>
              The customer, site supervisor, or contractor engineer must inspect delivered goods upon arrival while the delivery vehicle is stationary:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cement & Putty Bags:</strong> Verify bags are intact, dry, and factory sealed. Reject any burst or damp bags on the spot.</li>
              <li><strong>TMT Steel Rebars:</strong> Check Fe 550D grade embossing and bundle tags.</li>
              <li><strong>Tiles & Ceramics:</strong> Check outer cartons for impact crushing. Open sample boxes to confirm zero transit cracks.</li>
              <li><strong>Sanitaryware & Pipes:</strong> Check brass faucets and CPVC pipe ends for hairline defects.</li>
            </ul>

            <h2 className="text-base font-black text-slate-900 pt-2">2. Immediate Transit Damage Replacement</h2>
            <p>
              If any bag is burst or tiles broken during transport, the site engineer should report the damaged piece count to the driver before sharing the OTP. The damaged items are recorded on the digital delivery note and will be replaced free of cost within 4 hours by the nearest partner stockist.
            </p>

            <h2 className="text-base font-black text-slate-900 pt-2">3. Non-Returnable Items</h2>
            <p>
              Once the 4-digit Delivery OTP is shared and the vehicle departs the site, certain materials cannot be returned due to moisture contamination risk and safety regulations:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cement bags opened or stored on site for over 24 hours.</li>
              <li>Custom-cut steel rebars, pipes, or electrical wires cut to specific site lengths.</li>
              <li>Paints tinted to custom customer shades.</li>
            </ul>

            <h2 className="text-base font-black text-slate-900 pt-2">4. Support & Escalations</h2>
            <p>
              For any site delivery dispute or immediate replacement request, contact our Ayodhya Site Helpline immediately at <strong>{BRAND_CONFIG.supportPhone}</strong> or email <a href={`mailto:${BRAND_CONFIG.supportEmail}`} className="text-amber-700 font-bold hover:underline">{BRAND_CONFIG.supportEmail}</a>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
