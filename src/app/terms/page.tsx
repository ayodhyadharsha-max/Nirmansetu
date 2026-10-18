'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BRAND_CONFIG } from '@/config/brand';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs space-y-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950">Terms & Conditions of Service</h1>
          <div className="text-xs text-slate-500">Effective Date: October 18, 2026 • Ayodhya Jurisdiction</div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Welcome to <strong>{BRAND_CONFIG.name}</strong>. By placing an order, requesting a contractor RFQ, or accessing our platform, you agree to these Terms of Service.
            </p>

            <h2 className="text-base font-black text-slate-900 pt-2">1. Hyperlocal Partner Stockist Model</h2>
            <p>
              {BRAND_CONFIG.name} operates as an on-demand technology platform connecting builders and buyers with authorized building material distributors and stockists in the Ayodhya district. Products are invoiced and fulfilled by approved regional distributors under strict quality assurance standards.
            </p>

            <h2 className="text-base font-black text-slate-900 pt-2">2. Pricing & Currency</h2>
            <p>
              All prices listed on the platform are in Indian Rupees (₹) inclusive of applicable Goods and Services Tax (GST: 18% or 28% depending on the material classification under Indian HSN rules). The price displayed at the time of order confirmation is guaranteed for delivery within the agreed SLA.
            </p>

            <h2 className="text-base font-black text-slate-900 pt-2">3. Site Drop-off OTP & Material Acceptance</h2>
            <p>
              Every order generates a secure 4-digit Delivery OTP. The customer or site engineer is obligated to inspect the materials upon vehicle arrival (e.g., verifying cement bag seals, TMT rebar embossing, tile box quantities). Sharing the OTP with the delivery driver constitutes formal acceptance of delivery and good condition of the materials.
            </p>

            <h2 className="text-base font-black text-slate-900 pt-2">4. Payment Terms & COD</h2>
            <p>
              For Cash on Delivery (COD) orders, payment must be handed over in cash or transferred via immediate UPI to the authorized delivery personnel prior to completion of vehicle unloading. For contractor credit or bulk billing terms, separate written agreements apply.
            </p>

            <h2 className="text-base font-black text-slate-900 pt-2">5. Governing Law & Dispute Resolution</h2>
            <p>
              These terms are governed by the laws of Uttar Pradesh, India. Any legal dispute or proceeding arising out of or related to this platform shall be subject exclusively to the courts of Ayodhya (Faizabad), Uttar Pradesh.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
