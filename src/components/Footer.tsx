'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Phone, Mail, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white">{BRAND_CONFIG.name}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {BRAND_CONFIG.tagline}. Rapid 60-120 minute direct site fulfillment powered by approved local merchants in {BRAND_CONFIG.city}, {BRAND_CONFIG.state}.
            </p>
            <div className="text-xs text-slate-500">
              Legal Entity: {BRAND_CONFIG.legalEntity}
            </div>
          </div>

          {/* Ayodhya Regional Coverage */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Ayodhya District Hubs</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {AYODHYA_REGIONAL_HUBS.map((hub) => (
                <li key={hub.pincode} className="flex items-center justify-between">
                  <span>{hub.pincode} - {hub.name}</span>
                  <span className="text-emerald-400 font-bold">{hub.slaMinutes}m</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Core Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Materials Catalog
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>PPC & OPC Structural Cement (UltraTech, Ambuja)</li>
              <li>Fe 550D TMT Rebars (Tata Tiscon, Kamdhenu)</li>
              <li>1st Class Hoffmann Kiln Red Clay Bricks</li>
              <li>M-Sand & Coarse Aggregates (Gitti)</li>
              <li>CPVC & UPVC Potable Water Piping (Supreme)</li>
              <li>Dr. Fixit Integral Concrete Waterproofing</li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Site Support & Orders
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{BRAND_CONFIG.operatingHours}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{BRAND_CONFIG.supportPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{BRAND_CONFIG.supportEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>GST Tax Invoicing & ITC Compliance</span>
              </div>
            </div>
          </div>

        </div>

        {/* Regulatory & Platform Compliance Notice */}
        <div className="mt-8 pt-4 text-center space-y-2 text-[11px] text-slate-500">
          <p>
            © {new Date().getFullYear()} {BRAND_CONFIG.name}. All rights reserved. Operating as an on-demand marketplace connecting customers with verified local suppliers.
          </p>
          <p className="max-w-3xl mx-auto text-[10px] text-slate-600">
            DISCLOSURE: Product brand trademarks (UltraTech, Tata Tiscon, Dr. Fixit, Supreme, Havells) belong to their respective corporate owners. Demonstration catalog data is explicitly labeled and separated from live transactional records.
          </p>
        </div>

      </div>
    </footer>
  );
};
