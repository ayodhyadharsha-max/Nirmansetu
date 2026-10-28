'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Check } from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#f5b800] text-slate-950 pt-16 pb-12 border-t border-amber-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top 4 Columns Grid matching home-run.co screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-16">
          
          {/* Column 1: App Store Badges */}
          <div className="space-y-3.5">
            {/* Google Play Store Badge */}
            <a
              href="#app-download"
              className="inline-flex items-center gap-2.5 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-slate-900 transition-transform hover:scale-105 shadow-md w-48"
            >
              <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a1.99 1.99 0 0 1-.61-.912V2.726c0-.336.082-.66.61-.912zm11.233 11.235l2.42 2.42-11.83 6.83 9.41-9.25zm0-2.098L5.432 1.701l11.83 6.83-2.42 2.42zm1.464 1.464l3.197-1.846c1.107-.639 1.107-1.683 0-2.322l-3.197-1.846-1.87 1.87 1.87 1.87z"/>
              </svg>
              <div className="text-left leading-none">
                <div className="text-[9px] uppercase tracking-wider font-medium text-slate-300">GET IT ON</div>
                <div className="text-sm font-black text-white mt-0.5">Google Play</div>
              </div>
            </a>

            {/* Apple App Store Badge */}
            <a
              href="#app-download"
              className="inline-flex items-center gap-2.5 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-slate-900 transition-transform hover:scale-105 shadow-md w-48 block"
            >
              <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.61 1.35-.55.63-1.03 1.7-0.9 2.73 1.01.08 2.04-.51 2.59-1.23z"/>
              </svg>
              <div className="text-left leading-none">
                <div className="text-[9px] uppercase tracking-wider font-medium text-slate-300">Download on the</div>
                <div className="text-sm font-black text-white mt-0.5">App Store</div>
              </div>
            </a>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-2">
            <h4 className="text-sm font-black text-slate-950 uppercase tracking-wider mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-xs font-bold text-slate-900">
              <li>
                <Link href="/about" className="hover:underline flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                  <span>Contact</span>
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:underline flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                  <span>Price Lists</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:underline flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                  <span>Knowledge Hub</span>
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:underline flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                  <span>Shop by Category</span>
                </Link>
              </li>
              <li>
                <Link href="#faqs" className="hover:underline flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                  <span>FAQ&apos;s</span>
                </Link>
              </li>
              <li className="pt-2 border-t border-amber-400/60">
                <Link href="/supplier" className="hover:underline flex items-center gap-1.5 text-slate-900 font-bold">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                  <span>Supplier Fulfilment Hub</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Policy */}
          <div className="space-y-2">
            <h4 className="text-sm font-black text-slate-950 uppercase tracking-wider mb-3">
              Policy
            </h4>
            <ul className="space-y-2 text-xs font-bold text-slate-900">
              <li>
                <Link href="/returns" className="hover:underline flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                  <span>Refund Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:underline flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:underline flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:underline flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                  <span>Shipping Policy</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Information */}
          <div className="space-y-3 text-xs text-slate-950">
            <h4 className="text-sm font-black uppercase tracking-wider mb-3">
              Contact Information
            </h4>
            
            <div>
              <span className="font-black">Email: </span>
              <a href="mailto:hello@nirmansetu.in" className="font-bold underline hover:text-slate-800">
                hello@nirmansetu.in
              </a>
            </div>

            <div>
              <div className="font-black mb-1">Address:</div>
              <p className="font-bold leading-relaxed text-slate-900">
                {BRAND_CONFIG.name}, Tedhi Bazar Road, Near Ram Path, Ward No. 12, Ayodhya Dham, Uttar Pradesh 224123
              </p>
            </div>
          </div>

        </div>

        {/* Center Section: Email Newsletter Subscription matching home-run.co screenshot */}
        <div className="py-12 border-t border-amber-400 text-center space-y-5">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
            Get a first peek at New Products, Special Offers, and so much more.
          </h3>

          <form onSubmit={handleSubscribe} className="max-w-xl mx-auto relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-6 py-3.5 rounded-full border border-slate-950/40 bg-white/10 hover:bg-white/20 focus:bg-white text-slate-950 placeholder:text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 transition-all font-medium pr-14"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-slate-950 hover:bg-black/10 transition"
            >
              {subscribed ? (
                <Check className="w-5 h-5 text-emerald-800" />
              ) : (
                <ArrowRight className="w-5 h-5 text-slate-950" />
              )}
            </button>
          </form>
          {subscribed && (
            <p className="text-xs font-black text-emerald-900">
              Thank you for subscribing to NirmanSetu updates!
            </p>
          )}
        </div>

        {/* Bottom Copyright & Legal Links Bar matching screenshot */}
        <div className="pt-8 border-t border-amber-400 text-center text-xs font-semibold text-slate-950 space-y-2">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>© 2026, {BRAND_CONFIG.name}</span>
            <span>•</span>
            <Link href="/returns" className="hover:underline">Refund policy</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:underline">Privacy policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline">Terms of service</Link>
            <span>•</span>
            <Link href="/shipping" className="hover:underline">Shipping policy</Link>
            <span>•</span>
            <Link href="/contact" className="hover:underline">Contact information</Link>
          </p>
        </div>

      </div>
    </footer>
  );
};
