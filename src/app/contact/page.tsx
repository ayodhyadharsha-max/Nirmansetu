'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Building2, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pincode, setPincode] = useState('224123');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950">
              Contact Ayodhya Site Operations
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Our Ayodhya dispatch coordinator and contractor support team are available 7 days a week from 8:00 AM to 8:00 PM.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Contact Information & Hubs */}
            <div className="space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h2 className="text-lg font-black text-slate-950">Direct Contact Channels</h2>
                
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">Ayodhya Site Support Phone</div>
                      <a href={`tel:${BRAND_CONFIG.supportPhone.replace(/\s+/g, '')}`} className="text-amber-700 hover:underline">
                        {BRAND_CONFIG.supportPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">Official Email Support</div>
                      <a href={`mailto:${BRAND_CONFIG.supportEmail}`} className="text-amber-700 hover:underline">
                        {BRAND_CONFIG.supportEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">Operating Hours</div>
                      <div className="text-slate-600">{BRAND_CONFIG.operatingHours}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">Ayodhya Regional Operations Office</div>
                      <div className="text-slate-600">
                        Near Tedhi Bazar / Naya Ghat Road, Ayodhya Dham, Uttar Pradesh 224123
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regional Dispatch Hubs */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
                <h3 className="text-sm font-black text-slate-950">Partner Stockist Dispatch Corridors</h3>
                <div className="space-y-2 text-xs">
                  {AYODHYA_REGIONAL_HUBS.slice(0, 3).map((h) => (
                    <div key={h.pincode} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{h.name}</span>
                        <div className="text-[10px] text-slate-500">{h.coverage}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {h.slaMinutes}m SLA
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Message Form */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              {isSent ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-950">Message Sent!</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    An Ayodhya site coordinator will get in touch with you shortly.
                  </p>
                  <button
                    onClick={() => setIsSent(false)}
                    className="text-xs font-bold text-amber-600 hover:underline"
                  >
                    Send another query
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-lg font-black text-slate-950">Send Site Enquiry</h2>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9450012345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Site PIN Code</label>
                    <select
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {AYODHYA_REGIONAL_HUBS.map((h) => (
                        <option key={h.pincode} value={h.pincode}>
                          {h.pincode} - {h.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Message or Material Details *</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="What materials, tonnage or delivery timelines do you need for your Ayodhya site?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-400 text-amber-400 font-black text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Site Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
