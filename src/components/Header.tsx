'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Search,
  ShoppingCart,
  Calculator,
  FileSpreadsheet,
  Clock,
  Sparkles,
  ChevronDown,
  Building2,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';
import { formatPaiseToRupees } from '@/lib/money';

interface HeaderProps {
  selectedPincode: string;
  onPincodeChange: (pincode: string) => void;
  cartCount: number;
  cartTotalPaise: number;
  onOpenCart: () => void;
  onOpenCalculator: () => void;
  onOpenEnquiry: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedPincode,
  onPincodeChange,
  cartCount,
  cartTotalPaise,
  onOpenCart,
  onOpenCalculator,
  onOpenEnquiry,
}) => {
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [searchWordIndex, setSearchWordIndex] = useState(0);
  const searchWords = ['UltraTech Cement', 'Tata Tiscon 550D', 'Red Clay Bricks', 'Dr. Fixit LW+', 'Supreme CPVC Pipes', 'Havells Wires'];

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchWordIndex((prev) => (prev + 1) % searchWords.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [searchWords.length]);

  const currentHub = AYODHYA_REGIONAL_HUBS.find((h) => h.pincode === selectedPincode) || AYODHYA_REGIONAL_HUBS[0];

  return (
    <>
      {/* 1. TOP ANNOUNCEMENT BAR (HomeRun Inspired) */}
      <div className="bg-[#EFC41A] text-slate-900 px-4 py-1.5 text-xs font-semibold flex items-center justify-between border-b border-amber-300">
        <div className="mx-auto flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-800" />
            {BRAND_CONFIG.operatingHours}
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:flex items-center gap-1 text-slate-900 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            100% Genuine Materials Fulfillments from Approved Local Stockists
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-800 font-medium">
          <Phone className="w-3 h-3" />
          <span>Ayodhya Site Helpline: {BRAND_CONFIG.supportPhone}</span>
        </div>
      </div>

      {/* 2. MAIN HEADER NAVIGATION */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            
            {/* Brand Logo & Configurable Name */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-amber-200 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 block leading-tight">
                    {BRAND_CONFIG.name}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-amber-600 block uppercase tracking-wider">
                    {BRAND_CONFIG.city} Marketplace
                  </span>
                </div>
              </Link>

              {/* Delivery Hub & Pincode Dropdown */}
              <button
                onClick={() => setIsPincodeModalOpen(true)}
                className="hidden md:flex items-center gap-2.5 ml-3 pl-4 border-l border-slate-200 text-left hover:opacity-85 transition"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex flex-col items-center justify-center text-[9px] font-bold leading-tight shadow-sm">
                  <span>{currentHub.slaMinutes}</span>
                  <span>MINS</span>
                </div>
                <div className="leading-tight">
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    Deliver To <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-1 font-bold text-slate-900 text-xs sm:text-sm">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>{selectedPincode} ({currentHub.name.replace(' Hub', '')})</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Live Search Input with Dynamic Rotator */}
            <div className="flex-1 max-w-xl hidden md:block">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search for ${searchWords[searchWordIndex]}...`}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-400 placeholder:transition-opacity"
                />
              </div>
            </div>

            {/* Action Tools: Calculator, RFQ, Wallet, Cart */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Construction Estimator Button */}
              <button
                onClick={onOpenCalculator}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 rounded-lg border border-slate-200 transition"
                title="Calculate concrete, steel & bricks required for your site"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-600" />
                <span>Site Estimator</span>
              </button>

              {/* B2B Bulk RFQ Button */}
              <button
                onClick={onOpenEnquiry}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 rounded-lg border border-slate-200 transition"
                title="Request customized quotation for site projects"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                <span>Bulk RFQ</span>
              </button>

              {/* HomeRun-inspired Wallet/Cashback Badge */}
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-full text-xs font-bold border border-emerald-700/50 shadow-sm cursor-pointer hover:opacity-90">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Setu Cash</span>
                <span className="text-[10px] bg-emerald-700 text-emerald-100 px-1.5 py-0.5 rounded-full font-medium">1% Back</span>
              </div>

              {/* Cart Drawer Trigger */}
              <button
                onClick={onOpenCart}
                className="relative flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm transition"
              >
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[11px] px-1.5 py-0.2 rounded-full font-black">
                    {cartCount}
                  </span>
                )}
                {cartTotalPaise > 0 && (
                  <span className="hidden md:inline pl-1 text-amber-300 font-semibold border-l border-slate-700">
                    {formatPaiseToRupees(cartTotalPaise)}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 3. PINCODE SELECTION MODAL */}
      {isPincodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900">Select Delivery Location</h3>
              </div>
              <button
                onClick={() => setIsPincodeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 mb-4">
              Select your construction site area in the Ayodhya district to view guaranteed delivery SLAs and available local inventory.
            </p>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {AYODHYA_REGIONAL_HUBS.map((hub) => (
                <button
                  key={hub.pincode}
                  onClick={() => {
                    onPincodeChange(hub.pincode);
                    setIsPincodeModalOpen(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between ${
                    selectedPincode === hub.pincode
                      ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{hub.pincode}</span>
                      <span className="text-xs font-semibold text-slate-700">({hub.name})</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{hub.coverage}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {hub.slaMinutes} Mins SLA
                    </span>
                    {hub.isExpress && (
                      <div className="text-[10px] text-amber-700 font-semibold mt-1">Express Available</div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Operating under active supplier partnerships across Ayodhya Dham & Faizabad zones.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
