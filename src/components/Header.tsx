'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Search,
  ShoppingCart,
  Calculator,
  FileSpreadsheet,
  ChevronDown,
  Building2,
  Phone,
  User,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';
import { formatPaiseToRupees } from '@/lib/money';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { AnnouncementBar } from './AnnouncementBar';
import { DesktopMegaMenu } from './DesktopMegaMenu';
import { MobileNavDrawer } from './MobileNavDrawer';
import { PublicCatalogItem } from '@/types/database';

interface HeaderProps {
  onOpenCalculator?: () => void;
  onOpenEnquiry?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCalculator = () => {},
  onOpenEnquiry = () => {},
}) => {
  const router = useRouter();
  const { cartCount, cartTotalPaise, setIsCartOpen, selectedPincode, setSelectedPincode } = useCart();
  const { user } = useAuth();

  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicCatalogItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Animated search rotating placeholder
  const [searchWordIndex, setSearchWordIndex] = useState(0);
  const searchWords = [
    'UltraTech Super PPC Cement',
    'Tata Tiscon 550D Rebars',
    'Kajaria Vitrified Tiles 600x600',
    'Asian Paints Apex Weatherproof',
    'Supreme CPVC Water Pipes',
    'Havells FR Copper Wires',
    'Tata Wiron GI Binding Wire',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchWordIndex((prev) => (prev + 1) % searchWords.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [searchWords.length]);

  // Click outside listener for search suggestions dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.items || []);
          setShowSuggestions(true);
        }
      } catch {
        // Ignore network errors
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const currentHub =
    AYODHYA_REGIONAL_HUBS.find((h) => h.pincode === selectedPincode) || AYODHYA_REGIONAL_HUBS[0];

  return (
    <>
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <AnnouncementBar />

      {/* 2. MAIN HEADER NAVIGATION */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-4">
            
            {/* Left: Mobile Hamburger & Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsMobileNavOpen(true)}
                className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition"
                aria-label="Open mobile menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-200 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 block leading-tight">
                    {BRAND_CONFIG.name}
                  </span>
                  <span className="text-[9px] sm:text-[11px] font-bold text-amber-600 block uppercase tracking-wider">
                    {BRAND_CONFIG.city} Marketplace
                  </span>
                </div>
              </Link>

              {/* Desktop Mega-Menu Button */}
              <DesktopMegaMenu
                onOpenCalculator={onOpenCalculator}
                onOpenEnquiry={onOpenEnquiry}
              />

              {/* Delivery Hub & Pincode Dropdown */}
              <button
                onClick={() => setIsPincodeModalOpen(true)}
                className="hidden xl:flex items-center gap-2.5 ml-2 pl-3 border-l border-slate-200 text-left hover:opacity-85 transition"
                title="Change Ayodhya delivery location"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex flex-col items-center justify-center text-[8px] font-bold leading-tight shadow-2xs">
                  <span>{currentHub.slaMinutes}</span>
                  <span>MINS</span>
                </div>
                <div className="leading-tight">
                  <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                    Deliver To <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-1 font-bold text-slate-900 text-xs">
                    <MapPin className="w-3 h-3 text-amber-500" />
                    <span>PIN {selectedPincode}</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Middle: Live Search Bar with Suggestions */}
            <div ref={searchContainerRef} className="flex-1 max-w-lg hidden md:block relative">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSuggestions(true);
                  }}
                  placeholder={`Search ${searchWords[searchWordIndex]}...`}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Suggestions Dropdown */}
              {showSuggestions && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex justify-between">
                    <span>Approved Ayodhya Catalogue</span>
                    <span>{searchResults.length} matches</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {searchResults.map((item) => (
                      <Link
                        key={item.product_id}
                        href={`/products/${item.product_slug}`}
                        onClick={() => setShowSuggestions(false)}
                        className="px-3 py-2 hover:bg-amber-50/70 flex items-center justify-between transition group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold text-slate-900 group-hover:text-amber-950 truncate">
                            {item.product_title}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {item.brand_name || 'Generic'} • {item.pack_size || item.unit_of_measure}
                          </div>
                        </div>
                        <div className="text-right shrink-0 font-bold text-xs text-slate-900">
                          {formatPaiseToRupees(item.selling_price_paise)}
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="px-3 pt-2 pb-1 border-t border-slate-100 text-center">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700"
                    >
                      See all results for &ldquo;{searchQuery}&rdquo; →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Tools & Actions (Estimator, RFQ, Account, Cart) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              
              {/* Construction Estimator Button */}
              <button
                onClick={onOpenCalculator}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-amber-50 hover:text-amber-900 rounded-xl border border-slate-200 transition"
                title="Calculate concrete, steel & bricks required for your site"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-600" />
                <span>Estimator</span>
              </button>

              {/* B2B Bulk RFQ Button */}
              <Link
                href="/bulk-enquiry"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-amber-50 hover:text-amber-900 rounded-xl border border-slate-200 transition"
                title="Request customized quotation for site projects"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                <span>Bulk RFQ</span>
              </Link>

              {/* Customer Account Button */}
              <Link
                href={user ? '/account' : '/login'}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition"
                title={user ? 'Your Account' : 'Sign in to your account'}
              >
                <User className="w-4 h-4 text-slate-600" />
                <span className="hidden xl:inline truncate max-w-[100px]">
                  {user ? user.fullName.split(' ')[0] : 'Sign In'}
                </span>
              </Link>

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm transition"
                aria-label="Open Cart"
              >
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-black">
                    {cartCount}
                  </span>
                )}
                {cartTotalPaise > 0 && (
                  <span className="hidden lg:inline pl-1 text-amber-300 font-semibold border-l border-slate-700 text-xs">
                    {formatPaiseToRupees(cartTotalPaise)}
                  </span>
                )}
              </button>
            </div>

          </div>

          {/* Mobile Search Row (visible on small screens) */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search for cement, TMT, pipes...`}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 focus:bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </form>
          </div>

        </div>
      </header>

      {/* 3. PINCODE SELECTION MODAL */}
      {isPincodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                <h3 className="text-base sm:text-lg font-black text-slate-900">Select Site Delivery Location</h3>
              </div>
              <button
                onClick={() => setIsPincodeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 mb-4 leading-relaxed">
              Select your construction site area in the Ayodhya district to view guaranteed supplier delivery SLAs and live inventory.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {AYODHYA_REGIONAL_HUBS.map((hub) => (
                <button
                  key={hub.pincode}
                  onClick={() => {
                    setSelectedPincode(hub.pincode);
                    setIsPincodeModalOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between ${
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
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {hub.slaMinutes} Mins SLA
                    </span>
                    {hub.isExpress && (
                      <div className="text-[10px] text-amber-700 font-semibold mt-1">Express Delivery</div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Fulfilled through approved partner stockists across Ayodhya Dham & Faizabad.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. MOBILE NAVIGATION DRAWER */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        selectedPincode={selectedPincode}
        onOpenPincodeModal={() => setIsPincodeModalOpen(true)}
        onOpenCalculator={onOpenCalculator}
        onOpenEnquiry={onOpenEnquiry}
      />
    </>
  );
};
