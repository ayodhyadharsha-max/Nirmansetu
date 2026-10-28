'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, QrCode, CheckCircle2, Award, FileCheck2 } from 'lucide-react';

export const AuthenticityGuaranteeBanner: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
      <div className="relative rounded-3xl overflow-hidden shadow-md bg-gradient-to-r from-[#145d8f] via-[#176ea8] to-[#0f4b75] text-white p-6 sm:p-8 lg:p-10 border border-sky-400/40">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Guarantee Badge & Details */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/25 text-white text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>NirmanSetu Quality Protocol</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Quality-Assured Construction Materials
            </h2>

            <p className="text-sm sm:text-base text-sky-100 max-w-2xl leading-relaxed">
              All cement, steel rebars, and plumbing materials are fulfilled through verified regional stockists across the Ayodhya district. Inspect material condition, packaging integrity, and counts directly on site before releasing your Drop-off confirmation OTP.
            </p>

            {/* Quality Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <FileCheck2 className="w-5 h-5 text-emerald-300 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-white">On-Site Inspection</div>
                  <div className="text-[11px] text-sky-200">Check bags &amp; bundles on delivery</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <Award className="w-5 h-5 text-amber-300 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-white">Fresh Stock Policy</div>
                  <div className="text-[11px] text-sky-200">Inspected before dispatch</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <QrCode className="w-5 h-5 text-sky-300 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-white">Brand QR Verification</div>
                  <div className="text-[11px] text-sky-200">Official manufacturer packaging</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Original Materials Seal Graphic */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-dashed border-white/40 flex flex-col items-center justify-center p-6 text-center bg-white/10 backdrop-blur-xs shadow-xl rotate-[-3deg] hover:rotate-0 transition-transform duration-300">
              <ShieldCheck className="w-14 h-14 text-emerald-300 mb-1" />
              <div className="text-sm font-black uppercase tracking-wider text-white">
                Quality Assured
              </div>
              <div className="text-[11px] font-bold text-sky-200 uppercase tracking-widest mt-0.5">
                Ayodhya Stockist Network
              </div>
              <div className="mt-2 text-[10px] text-sky-100 bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                Drop-off OTP Safeguard
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
