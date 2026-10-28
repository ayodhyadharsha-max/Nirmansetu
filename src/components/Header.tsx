'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Search,
  ShoppingBag,
  ChevronDown,
  User,
  Menu,
  X,
  Zap,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';
import { formatPaiseToRupees } from '@/lib/money';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { AnnouncementBar } from './AnnouncementBar';
import { MobileNavDrawer } from './MobileNavDrawer';
import { CategoryNav } from './CategoryNav';
import { SearchOverlay } from './SearchOverlay';
import { PublicCatalogItem } from '@/types/database';

interface HeaderProps {
  onOpenCalculator?: () => void;
  onOpenEnquiry?: () => void;
  selectedCategory?: string | null;
  onSelectCategory?: (categoryId: string | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCalculator = () => {},
  onOpenEnquiry = () => {},
  selectedCategory = null,
  onSelectCategory = () => {},
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

  // Animated search rotating placeholder matching screenshots
  const [searchWordIndex, setSearchWordIndex] = useState(0);
  const searchWords = [
    'Cement',
    'Tiling',
    'Fevicol',
    'Painting',
    'Wires',
    'Lighting',
    'Tata Tiscon TMT',
    'Asian Paints',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchWordIndex((prev) => (prev + 1) % searchWords.length);
    }, 2500);
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
      {/* 1. TOP MUSTARD YELLOW ANNOUNCEMENT BAR */}
      <AnnouncementBar />

      {/* 2. MAIN HEADER NAVIGATION (Matching home-run.co exact header layout) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20 gap-3 sm:gap-6">
            
            {/* Left: Hamburger & Brand Logo with Lightning Icon */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <button
                onClick={() => setIsMobileNavOpen(true)}
                className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition"
                aria-label="Open mobile menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <Link href="/" className="flex items-center gap-2 group shrink-0">
                {/* Yellow Rounded Square with Lightning Bolt */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#f5b800] flex flex-col items-center justify-center text-slate-950 shadow-xs group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
                  <span className="text-[7px] font-black tracking-tighter uppercase leading-none mt-0.5">Fast</span>
                </div>
                <div className="leading-tight">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 block">
                    {BRAND_CONFIG.name}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 block -mt-0.5 tracking-wider uppercase">
                    Ayodhya Site Express
                  </span>
                </div>
              </Link>

              {/* Delivery Location selector */}
              <button
                onClick={() => setIsPincodeModalOpen(true)}
                className="hidden md:flex items-center gap-2 ml-1 pl-3 border-l border-slate-200 text-left hover:opacity-85 transition group"
                title="Change delivery location"
              >
                <div className="bg-[#177833] text-white px-2 py-1 rounded-xl flex flex-col items-center justify-center leading-none text-center shadow-2xs group-hover:bg-[#13632a] transition">
                  <span className="text-[11px] font-black">FAST</span>
                  <span className="text-[8px] font-bold uppercase tracking-wider">SITE</span>
                </div>
                <div className="leading-tight">
                  <div className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5">
                    Deliver To
                  </div>
                  <div className="flex items-center gap-0.5 font-bold text-slate-900 text-xs">
                    <MapPin className="w-3 h-3 text-slate-800" />
                    <span>{selectedPincode}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </button>
            </div>

            {/* Middle: Large Rounded Search Bar with Animated Placeholder */}
            <div ref={searchContainerRef} className={`flex-1 max-w-xl hidden md:block relative ${showSuggestions ? 'z-50' : ''}`}>
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onClick={() => setShowSuggestions(true)}
                  placeholder={`Search for ${searchWords[searchWordIndex]}`}
                  className="w-full pl-11 pr-10 py-2.5 bg-white border border-slate-300 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#f5b800]/40 focus:border-[#f5b800] transition-all placeholder:text-slate-400 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Suggestions / Rich Search Overlay Dropdown (Matching home-run.co screenshots) */}
              <SearchOverlay
                isOpen={showSuggestions}
                onClose={() => setShowSuggestions(false)}
                searchQuery={searchQuery}
                onSelectCategory={(catName) => {
                  setSearchQuery(catName);
                  setShowSuggestions(true);
                }}
                onSubmitSearch={() => {
                  setShowSuggestions(false);
                  if (searchQuery.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
              />
            </div>

            {/* Right: Wallet Button + Login + Bag Icon (Matching home-run.co layout) */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              
              {/* Wallet Pill Button (Forest Green Pill with Gold Coins Icon) */}
              <button
                onClick={() => router.push(user ? '/account' : '/login')}
                className="bg-[#0b4827] hover:bg-[#07361d] text-white px-3.5 py-2 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-2xs transition"
                title="Your site wallet balance & cashback"
              >
                <div className="w-4 h-4 rounded-full bg-[#f5b800] text-slate-950 flex items-center justify-center text-[10px] font-black leading-none">
                  ₹
                </div>
                <span>Wallet</span>
              </button>

              {/* Login Button */}
              <Link
                href={user ? '/account' : '/login'}
                className="flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-amber-700 px-2 py-1.5 transition"
                title={user ? 'Your Account' : 'Sign in to your account'}
              >
                <User className="w-4 h-4 text-slate-700" />
                <span className="hidden sm:inline">
                  {user ? user.fullName.split(' ')[0] : 'Login'}
                </span>
              </Link>

              {/* Shopping Bag Icon with Counter */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-slate-800 hover:text-amber-700 transition"
                aria-label="Open Cart"
              >
                <ShoppingBag className="w-5 h-5 text-slate-800" />
                {cartCount > 0 && (
                  <span className="absolute 0 top-0.5 right-0.5 bg-[#f5b800] text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

          </div>

          {/* Mobile Search Row (visible on small screens) */}
          <div className={`pb-3 md:hidden relative ${showSuggestions ? 'z-50' : ''}`}>
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onClick={() => setShowSuggestions(true)}
                placeholder={`Search for ${searchWords[searchWordIndex]}`}
                className="w-full pl-10 pr-8 py-2 bg-slate-100 focus:bg-white border border-slate-300 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#f5b800]/40 focus:border-[#f5b800] shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Mobile Rich Search Overlay Popup */}
            <div className="md:hidden">
              <SearchOverlay
                isOpen={showSuggestions}
                onClose={() => setShowSuggestions(false)}
                searchQuery={searchQuery}
                onSelectCategory={(catName) => {
                  setSearchQuery(catName);
                  setShowSuggestions(true);
                }}
                onSubmitSearch={() => {
                  setShowSuggestions(false);
                  if (searchQuery.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
              />
            </div>
          </div>

        </div>

        {/* Sub-Category Navigation Bar (Pinned with Header) */}
        <CategoryNav
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          onOpenCalculator={onOpenCalculator}
        />
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
              Select your construction site area in the Ayodhya district to view delivery options and live inventory.
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
                      {hub.isExpress ? 'Express Zone' : 'Standard Zone'}
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
