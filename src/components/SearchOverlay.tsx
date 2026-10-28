'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, Banknote, Truck, Check, ArrowRight, ChevronDown, Search as SearchIcon } from 'lucide-react';
import {
  HomeRunProductItem,
  HomeRunCategoryItem,
  SEARCH_NEW_LAUNCHES,
  SEARCH_TOP_CATEGORIES,
  searchCatalogProducts,
} from '@/config/homerun-catalog';
import { useCart } from '@/context/CartContext';
import { PublicCatalogItem } from '@/types/database';
import { ProductOptionsModal } from '@/components/ProductOptionsModal';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSelectCategory?: (categoryName: string) => void;
  onSubmitSearch?: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSelectCategory,
  onSubmitSearch,
}) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [optionsModalProduct, setOptionsModalProduct] = useState<HomeRunProductItem | null>(null);
  const [dbResults, setDbResults] = useState<PublicCatalogItem[]>([]);
  const [isDbSearching, setIsDbSearching] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Query database API alongside local catalog items
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setDbResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsDbSearching(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery.trim())}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setDbResults(data.items || []);
        }
      } catch {
        // Fallback to local catalog
      } finally {
        setIsDbSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  // Local catalog search matches
  const localMatches = searchCatalogProducts(searchQuery);

  // Merge & deduplicate local catalog products and database products
  const mergedProducts: HomeRunProductItem[] = [...localMatches];
  for (const dbItem of dbResults) {
    if (!mergedProducts.some((p) => p.slug === dbItem.product_slug || p.id === dbItem.product_id)) {
      mergedProducts.push({
        id: dbItem.product_id,
        title: dbItem.product_title,
        slug: dbItem.product_slug,
        brand: dbItem.brand_name || 'Generic',
        mrp: Math.round(dbItem.mrp_paise / 100),
        price: Math.round(dbItem.selling_price_paise / 100),
        discountPct:
          dbItem.mrp_paise > dbItem.selling_price_paise
            ? Math.round(((dbItem.mrp_paise - dbItem.selling_price_paise) / dbItem.mrp_paise) * 100)
            : 0,
        badges: ['Site Delivery', 'Pay on Delivery'],
        imageUrl: dbItem.images?.[0] || '/images/products/ultratech_cement.png',
        bulkPriceText: `Unlock Bulk Prices of ₹${Math.round((dbItem.selling_price_paise * 0.95) / 100)}`,
        cashbackText: '5% Cashback on 1 Lakh+ orders',
        inStock: dbItem.is_in_stock,
      });
    }
  }

  const handleAddProduct = (prod: HomeRunProductItem) => {
    addToCart(
      {
        product_id: prod.id,
        product_title: prod.title,
        product_slug: prod.slug,
        short_description: prod.title,
        description: prod.title,
        hsn_code: '2523',
        unit_of_measure: 'units',
        is_bulk_available: true,
        is_featured: true,
        specifications: {},
        images: [prod.imageUrl],
        tax_rate_pct: 18,
        product_status: 'published',
        category_id: 'c0000000-0000-0000-0000-000000000001',
        category_name: 'Materials',
        category_slug: 'cement-construction-materials',
        brand_id: 'b0000000-0000-0000-0000-000000000001',
        brand_name: prod.brand,
        brand_slug: prod.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        brand_logo: prod.imageUrl,
        variant_id: `v-${prod.id}`,
        variant_title: 'Standard',
        sku: `SKU-${prod.id}`,
        pack_size: 'Standard',
        attributes: {},
        min_order_qty: 1,
        max_order_qty: 500,
        weight_kg: 10,
        dimensions_cm: { length: 30, width: 20, height: 10 },
        selling_price_paise: prod.price * 100,
        mrp_paise: prod.mrp * 100,
        total_available_stock: 500,
        is_in_stock: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      1
    );

    setAddedIds((prev) => new Set(prev).add(prod.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(prod.id);
        return next;
      });
    }, 1800);
  };

  const isQueryEmpty = searchQuery.trim().length === 0;

  return (
    <>
      {/* 1. Dark Translucent Dimming Backdrop behind the search popup */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Floating Search Popup Container (Directly below search bar, matching screenshots) */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[94vw] sm:w-[680px] md:w-[720px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 sm:p-6 z-50 max-h-[82vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
        
        {/* ========================================================================= */}
        {/* STATE A: EMPTY / INITIAL FOCUSED SEARCH STATE (Matching Image 2 & 4)      */}
        {/* ========================================================================= */}
        {isQueryEmpty ? (
          <div className="space-y-6">
            
            {/* Top Categories Section */}
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight mb-3">
                Top Categories
              </h3>
              
              <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-4">
                {SEARCH_TOP_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory(cat.title);
                      } else {
                        router.push(`/search?q=${encodeURIComponent(cat.title)}`);
                        onClose();
                      }
                    }}
                    className="flex flex-col items-center group text-center focus:outline-none"
                  >
                    {/* Circle Image Container with Subtle Cyan Border */}
                    <div className="relative w-15 h-15 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full border border-teal-200/80 bg-[#f4faf8] flex items-center justify-center p-2.5 group-hover:scale-105 group-hover:border-amber-400 group-hover:shadow-md transition-all duration-200 shadow-2xs">
                      {/* Optional "Bulk Prices" Badge */}
                      {cat.badge && (
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[#f5b800] text-slate-950 font-black text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full uppercase whitespace-nowrap shadow-2xs">
                          {cat.badge}
                        </span>
                      )}
                      <img
                        src={cat.imageUrl}
                        alt={cat.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/categories/cement.png';
                        }}
                        className="max-h-full max-w-full object-contain drop-shadow-2xs"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 mt-2 group-hover:text-amber-800 transition">
                      {cat.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* New Launches Section (3 products side-by-side matching screenshot) */}
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight mb-3">
                New Launches
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {SEARCH_NEW_LAUNCHES.slice(0, 3).map((prod) => {
                  const isAdded = addedIds.has(prod.id);
                  return (
                    <div
                      key={prod.id}
                      className="bg-white border border-slate-100 rounded-xl p-2.5 flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition group"
                    >
                      <div>
                        {/* Image & Discount Pill */}
                        <div className="relative h-32 sm:h-36 w-full flex items-center justify-center bg-white rounded-lg p-2 mb-1.5 overflow-hidden">
                          {prod.discountPct > 0 && (
                            <span className="absolute top-1 left-1 bg-[#f5b800] text-slate-950 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full shadow-2xs z-10">
                              {prod.discountPct}% OFF
                            </span>
                          )}
                          <Link
                            href={`/products/${prod.slug}`}
                            onClick={onClose}
                            className="w-full h-full flex items-center justify-center"
                          >
                            <img
                              src={prod.imageUrl}
                              alt={prod.title}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/products/ultratech_cement.png';
                              }}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          </Link>
                        </div>

                        {/* Delivery Badges */}
                        <div className="flex items-center gap-2.5 text-[10px] font-semibold text-[#138a72] mb-1">
                          <span className="inline-flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-[#138a72]" /> Site Delivery
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <Banknote className="w-3 h-3 text-[#138a72]" /> Pay on Delivery
                          </span>
                        </div>

                        {/* Title */}
                        <Link
                          href={`/products/${prod.slug}`}
                          onClick={onClose}
                          className="font-bold text-xs text-slate-900 line-clamp-2 hover:underline block leading-snug"
                        >
                          {prod.title}
                        </Link>

                        {/* Price Row */}
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className="text-slate-400 line-through text-xs">
                            ₹{prod.mrp}
                          </span>
                          <span className="font-extrabold text-slate-950 text-sm">
                            ₹{prod.price}
                          </span>
                        </div>

                        {/* Bulk Price Link */}
                        {prod.bulkPriceText && (
                          <Link
                            href={`/products/${prod.slug}`}
                            onClick={onClose}
                            className="text-[10px] font-semibold text-blue-600 border-b border-dotted border-blue-500 hover:text-blue-800 block mt-1 truncate"
                          >
                            {prod.bulkPriceText}
                          </Link>
                        )}
                      </div>

                      {/* Green Add Button or Options Button */}
                      {prod.optionsCount ? (
                        <button
                          type="button"
                          onClick={() => setOptionsModalProduct(prod)}
                          className="w-full mt-2.5 py-1.5 sm:py-2 bg-[#257f2e] hover:bg-[#1e6b26] text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-1 active:scale-[0.98] cursor-pointer"
                        >
                          <span>{prod.optionsCount} Options</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddProduct(prod)}
                          className={`w-full mt-2.5 py-1.5 sm:py-2 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            isAdded
                              ? 'bg-[#1e6b26]'
                              : 'bg-[#257f2e] hover:bg-[#1e6b26] active:scale-[0.98]'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Added
                            </>
                          ) : (
                            'Add'
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* STATE B: ACTIVE SEARCH QUERY RESULTS (Matching Image 1 & 3)               */
          /* ========================================================================= */
          <div>
            {/* Header: Query count + View All link */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <span className="text-xs font-bold text-slate-600">
                Found {mergedProducts.length} {mergedProducts.length === 1 ? 'material' : 'materials'} for &ldquo;{searchQuery}&rdquo;
              </span>
              <button
                onClick={() => {
                  if (onSubmitSearch) {
                    onSubmitSearch();
                  } else {
                    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                    onClose();
                  }
                }}
                className="text-xs font-bold text-amber-700 hover:text-amber-850 flex items-center gap-1"
              >
                <span>View All Results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {mergedProducts.length === 0 ? (
              <div className="py-10 text-center">
                <SearchIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">
                  No materials found for &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Try searching for Cement, TMT Steel, CPVC, Fevicol, Asian Paints or browse Top Categories.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  {['Cement', 'Priya', 'TMT Steel', 'Fevicol', 'CPVC Pipes', 'Gyproc'].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        if (onSelectCategory) onSelectCategory(term);
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-slate-900 rounded-full text-xs font-semibold transition"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {mergedProducts.slice(0, 6).map((prod) => {
                  const isAdded = addedIds.has(prod.id);
                  return (
                    <div
                      key={prod.id}
                      className="bg-white border border-slate-100 rounded-xl p-2.5 flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition group"
                    >
                      <div>
                        {/* Image Container with White Background */}
                        <div className="relative h-32 sm:h-36 w-full flex items-center justify-center bg-white rounded-lg p-2 mb-1.5 overflow-hidden">
                          <Link
                            href={`/products/${prod.slug}`}
                            onClick={onClose}
                            className="w-full h-full flex items-center justify-center"
                          >
                            <img
                              src={prod.imageUrl}
                              alt={prod.title}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/products/ultratech_cement.png';
                              }}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          </Link>
                        </div>

                        {/* Site Delivery & Pay on Delivery */}
                        <div className="flex items-center gap-2.5 text-[10px] font-semibold text-[#138a72] mb-1">
                          <span className="inline-flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-[#138a72]" /> Site Delivery
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <Banknote className="w-3 h-3 text-[#138a72]" /> Pay on Delivery
                          </span>
                        </div>

                        {/* Teal Delivery Pill */}
                        <div className="bg-[#0d9488] text-white text-[9px] font-bold px-2 py-0.5 rounded-xs inline-flex items-center gap-1 mb-1">
                          <Truck className="w-3 h-3" />
                          <span>Jobsite Delivery in Ayodhya</span>
                        </div>

                        {/* Product Title */}
                        <Link
                          href={`/products/${prod.slug}`}
                          onClick={onClose}
                          className="font-bold text-xs text-slate-900 line-clamp-2 hover:underline block leading-snug mt-0.5"
                        >
                          {prod.title}
                        </Link>

                        {/* Price Row: Strikethrough MRP + Bold Price */}
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className="text-slate-400 line-through text-xs">
                            ₹{prod.mrp}
                          </span>
                          <span className="font-extrabold text-slate-950 text-sm">
                            ₹{prod.price}
                          </span>
                        </div>

                        {/* 5% Cashback Flat Banner (Matching Screenshot 1 & 3) */}
                        <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-yellow-100 border border-amber-200/70 rounded-xs px-2 py-1 flex items-center gap-1.5 text-[10px] mt-1.5">
                          <span className="bg-[#257f2e] text-white font-black text-[8px] px-1 py-0.5 rounded-xs leading-none">
                            5% FLAT
                          </span>
                          <span className="font-semibold text-slate-800 text-[10px] truncate">
                            Cashback on 1 Lakh+ orders
                          </span>
                        </div>

                        {/* Blue Dotted Underline Bulk Rate */}
                        <Link
                          href={`/products/${prod.slug}`}
                          onClick={onClose}
                          className="text-[10px] font-semibold text-blue-600 border-b border-dotted border-blue-500 hover:text-blue-850 block mt-1 truncate"
                        >
                          {prod.bulkPriceText || `Unlock Bulk Prices of ₹${Math.round(prod.price * 0.95)}`}
                        </Link>
                      </div>

                      {/* Solid Green Add Button or Options Button */}
                      {prod.optionsCount ? (
                        <button
                          type="button"
                          onClick={() => setOptionsModalProduct(prod)}
                          className="w-full mt-2.5 py-2 bg-[#257f2e] hover:bg-[#1e6b26] text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-1 active:scale-[0.98] cursor-pointer"
                        >
                          <span>{prod.optionsCount} Options</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddProduct(prod)}
                          className={`w-full mt-2.5 py-2 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            isAdded
                              ? 'bg-[#1e6b26]'
                              : 'bg-[#257f2e] hover:bg-[#1e6b26] active:scale-[0.98]'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Added
                            </>
                          ) : (
                            'Add'
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom See All Results Button */}
            {mergedProducts.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    if (onSubmitSearch) {
                      onSubmitSearch();
                    } else {
                      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                      onClose();
                    }
                  }}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 transition"
                >
                  See all results for &ldquo;{searchQuery}&rdquo; in Ayodhya Catalogue →
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Product Options Modal */}
      <ProductOptionsModal
        isOpen={Boolean(optionsModalProduct)}
        onClose={() => setOptionsModalProduct(null)}
        product={optionsModalProduct}
      />
    </>
  );
};
