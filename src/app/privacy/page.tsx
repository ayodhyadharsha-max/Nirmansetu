'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BRAND_CONFIG } from '@/config/brand';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs space-y-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950">Privacy & Data Protection Policy</h1>
          <div className="text-xs text-slate-500">Effective Date: October 18, 2026 • Governed under Indian IT & DPDP Act 2023</div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              At <strong>{BRAND_CONFIG.name}</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;platform&rdquo;), operated in {BRAND_CONFIG.city}, Uttar Pradesh, India, we are committed to protecting the privacy of building contractors, site engineers, developers, and individual property owners who utilize our construction materials marketplace.
            </p>

            <h2 className="text-base font-black text-slate-900 pt-2">1. Information We Collect</h2>
            <p>
              We collect information required strictly for logistics and statutory billing:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Site Delivery Location: Construction plot number, nearest landmark, and PIN code in Ayodhya district.</li>
              <li>Contact Details: Receiver/site engineer name and active mobile phone number for delivery driver coordination and OTP verification.</li>
              <li>Contractor Tax Information: Business firm name and GSTIN for issuing compliant GST tax invoices (GSTR-1).</li>
              <li>Order History: Material specifications, quantities, units, and timestamps.</li>
            </ul>

            <h2 className="text-base font-black text-slate-900 pt-2">2. How Information is Used</h2>
            <p>
              Your delivery address and phone number are shared solely with the approved local partner stockist and assigned delivery driver for the sole purpose of physical delivery and site inspection. We never sell, rent, or trade contractor or customer contact details to third-party telemarketers.
            </p>

            <h2 className="text-base font-black text-slate-900 pt-2">3. Payment & Financial Data Security</h2>
            <p>
              Online transactions are processed via RBI-licensed payment gateways with PCI-DSS compliance. We do not store credit card numbers, debit card PINs, or UPI MPINs on our servers. All monetary transactions are processed in Indian Rupees (INR) using pure integer arithmetic without rounding discrepancies.
            </p>

            <h2 className="text-base font-black text-slate-900 pt-2">4. Contacting Data Protection Officer</h2>
            <p>
              If you have any questions about your data or wish to delete your site account, please contact our support desk at <a href={`mailto:${BRAND_CONFIG.supportEmail}`} className="text-amber-700 font-bold hover:underline">{BRAND_CONFIG.supportEmail}</a> or call {BRAND_CONFIG.supportPhone}.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
