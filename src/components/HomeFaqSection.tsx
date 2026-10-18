'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, BookOpen } from 'lucide-react';

const FAQS = [
  {
    q: 'What is the difference between PPC and OPC 53 cement for construction in Ayodhya?',
    a: 'Portland Pozzolana Cement (PPC), such as UltraTech Super, contains high-reactive fly ash that produces denser, moisture-impermeable concrete. This provides superior resistance against groundwater dampness and sulphate attacks prevalent in the Gangetic alluvial soils of Ayodhya. Ordinary Portland Cement (OPC 53) develops early strength quicker and is typically reserved for specialized rapid-demoulding precast work or cold-weather slab casting.',
  },
  {
    q: 'Why should I insist on Fe 550D grade TMT rebar for structural columns?',
    a: 'The "D" designation stands for "Super Ductile". Eastern Uttar Pradesh and the Ayodhya region fall in a recognized seismic influence zone. Fe 550D rebars (such as Tata Tiscon 550D) offer higher elongation (minimum 14.5%) combined with 550 N/mm² yield strength, preventing sudden brittle collapse during earth vibrations or dynamic structural loads.',
  },
  {
    q: 'How do you handle delivery in narrow lanes near Ram Janmabhoomi and Naya Ghat?',
    a: 'Many traditional residential lanes and temple corridors in Ayodhya Dham cannot accommodate 6-wheeler heavy trucks. In your cart or checkout, toggle off "Standard Truck Access" and specify lane dimensions. We automatically assign electric mini-loaders or small 3-wheeler tempos to navigate narrow corridors without obstructing pilgrimage traffic.',
  },
  {
    q: 'How does the Site Drop-off OTP safeguard my order?',
    a: 'Every order generates a secure 4-digit verification code. When the delivery driver arrives, your site supervisor or engineer inspects the materials—confirming bag counts, bag manufacturing dates, and zero transit tearing. Only when satisfied do you share the OTP with the driver. If any bag is torn, note it down with the driver for immediate free replacement.',
  },
  {
    q: 'Can contractors claim GST Input Tax Credit (ITC)?',
    a: 'Yes, 100%. All materials are invoiced through authorized distributors with statutory HSN codes (e.g. 2523 for cement, 7214 for steel rebars). Simply enter your valid 15-digit GSTIN at checkout or during registration to receive a tax invoice for filing in GSTR-2B.',
  },
  {
    q: 'How quickly can I get 10+ tons of cement or full truckloads of steel delivered?',
    a: 'For commercial projects requiring full truckloads (10 to 30 metric tons), submit a Bulk RFQ. Our Ayodhya wholesale manager locks distributor rates and coordinates scheduled direct mill-to-site trailers within 4 to 12 hours.',
  },
];

export const HomeFaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-14 bg-white border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Ayodhya Site Guidance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Technical Buying Guides & Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Essential specifications for civil engineers, contractors, and home builders in Uttar Pradesh.
          </p>
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full text-left flex items-start justify-between gap-4 py-1"
                >
                  <span className="text-sm font-bold text-slate-900 leading-snug">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 mt-1 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-amber-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="pt-2.5 pb-1 text-xs sm:text-sm text-slate-600 leading-relaxed pr-6 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
