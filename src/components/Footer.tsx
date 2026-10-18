'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Phone, Mail, MapPin, Clock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';
import { SEED_CATEGORIES } from '@/lib/catalog/seed-data';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
          
          {/* Brand & Ayodhya Sourcing Mission (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 group inline-block">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white">{BRAND_CONFIG.name}</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {BRAND_CONFIG.tagline}. Rapid 60-120 minute direct site fulfillment through approved partner stockists in {BRAND_CONFIG.city}, {BRAND_CONFIG.state}.
            </p>
            <div className="text-[11px] text-slate-500">
              Legal Entity: {BRAND_CONFIG.legalEntity}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-sm space-y-1">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Risk Site Delivery Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Physically inspect cement bags, TMT rebars, and tiles at your job site before sharing your 4-digit Drop-off OTP.
              </p>
            </div>
          </div>

          {/* Column 2: 9 Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Materials Catalog
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              {SEED_CATEGORIES.slice(0, 7).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="hover:text-amber-400 transition block truncate"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/search"
                  className="text-amber-400 hover:text-amber-300 font-bold block pt-1 text-xs"
                >
                  View All 9 Categories →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Tools & Policies */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Contractor & Policies
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <Link href="/bulk-enquiry" className="hover:text-amber-400 transition font-bold text-amber-300">
                  Wholesale Bulk RFQ (10+ Tons)
                </Link>
              </li>
              <li>
                <Link href="/supplier-application" className="hover:text-amber-400 transition font-medium text-amber-200">
                  Partner Merchant Application
                </Link>
              </li>
              <li>
                <Link href="/supplier" className="hover:text-amber-400 transition">
                  Stockist & Supplier Portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-400 transition text-slate-400">
                  Operations & Admin Console
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-amber-400 transition">
                  Materials Schedule & Cart
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-amber-400 transition">
                  Site Account & Order History
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-amber-400 transition">
                  About NirmanSetu Ayodhya
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-amber-400 transition">
                  Site Delivery & Unloading Rules
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-amber-400 transition">
                  Material Inspection & Returns
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-amber-400 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-amber-400 transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Operating Hours */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Ayodhya Site Support
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{BRAND_CONFIG.operatingHours}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`tel:${BRAND_CONFIG.supportPhone.replace(/\s+/g, '')}`} className="hover:text-white font-bold">
                  {BRAND_CONFIG.supportPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`mailto:${BRAND_CONFIG.supportEmail}`} className="hover:text-white truncate">
                  {BRAND_CONFIG.supportEmail}
                </a>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-snug">
                  Near Tedhi Bazar / Naya Ghat Road, Ayodhya Dham, UP 224123
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Regional Hubs Row */}
        <div className="py-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            Ayodhya District Hubs:
          </span>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            {AYODHYA_REGIONAL_HUBS.map((hub) => (
              <span key={hub.pincode} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300 font-semibold">{hub.pincode}</span>
                <span>({hub.name.replace(' Hub', '')}) - {hub.slaMinutes}m</span>
              </span>
            ))}
          </div>
        </div>

        {/* Regulatory & Platform Compliance Notice */}
        <div className="mt-8 text-center space-y-2 text-[11px] text-slate-500">
          <p>
            © {new Date().getFullYear()} {BRAND_CONFIG.name}. All rights reserved. Sourced exclusively through authorized local distributors in Ayodhya, Uttar Pradesh.
          </p>
          <p className="max-w-3xl mx-auto text-[10px] text-slate-600">
            DISCLOSURE: Product brand trademarks (UltraTech, Tata Tiscon, Kajaria, Asian Paints, Dr. Fixit, Havells, Supreme, Jaquar, Greenply, Godrej, Sintex) belong to their respective corporate owners. Platform orders are fulfilled through independent, approved building material merchants.
          </p>
        </div>

      </div>
    </footer>
  );
};
