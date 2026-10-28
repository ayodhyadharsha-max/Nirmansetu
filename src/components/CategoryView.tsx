'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Banknote,
  Truck,
  ChevronDown,
  Clock,
  Check,
  Search,
} from 'lucide-react';
import { HomeRunProductItem } from '@/config/homerun-catalog';
import { useCart } from '@/context/CartContext';
import { Header } from '@/components/Header';
import { CartDrawer } from '@/components/CartDrawer';
import { Footer } from '@/components/Footer';
import { ProductOptionsModal } from '@/components/ProductOptionsModal';

interface CategoryViewProps {
  categoryTitle: string;
  categorySlug: string;
  parentCategoryTitle?: string;
  parentCategorySlug?: string;
  products: HomeRunProductItem[];
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  categoryTitle,
  categorySlug,
  parentCategoryTitle = 'Civil & Interiors',
  parentCategorySlug = 'civil-interiors',
  products,
}) => {
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('relevance');
  const [activeBrandFilter, setActiveBrandFilter] = useState<string | null>(null);
  const [optionsModalProduct, setOptionsModalProduct] = useState<HomeRunProductItem | null>(null);

  // Extract distinct brands from products for interactive filter
  const distinctBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));

  // Filter and sort products
  let filteredProducts = [...products];
  if (activeBrandFilter) {
    filteredProducts = filteredProducts.filter((p) => p.brand === activeBrandFilter);
  }

  if (sortBy === 'price_asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'discount') {
    filteredProducts.sort((a, b) => b.discountPct - a.discountPct);
  }

  const handleAdd = (item: HomeRunProductItem) => {
    addToCart(
      {
        product_id: item.id,
        product_title: item.title,
        product_slug: item.slug,
        short_description: item.title,
        description: item.title,
        hsn_code: '2523',
        unit_of_measure: 'units',
        is_bulk_available: true,
        is_featured: true,
        specifications: {},
        images: [item.imageUrl],
        tax_rate_pct: 18,
        product_status: 'published',
        category_id: 'c0000000-0000-0000-0000-000000000001',
        category_name: categoryTitle,
        category_slug: categorySlug,
        brand_id: 'b0000000-0000-0000-0000-000000000001',
        brand_name: item.brand,
        brand_slug: item.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        brand_logo: item.imageUrl,
        variant_id: `v-${item.id}`,
        variant_title: 'Standard',
        sku: `SKU-${item.id}`,
        pack_size: 'Standard',
        attributes: {},
        min_order_qty: 1,
        max_order_qty: 500,
        weight_kg: 10,
        dimensions_cm: { length: 30, width: 20, height: 10 },
        selling_price_paise: item.price * 100,
        mrp_paise: item.mrp * 100,
        total_available_stock: 500,
        is_in_stock: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      1
    );

    setAddedIds((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 1800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 1. Header with search bar, mega-nav, and announcement bar */}
      <Header />
      <CartDrawer />

      {/* 2. Main Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full">
        
        {/* 2A. Top Beige Trust / Value Proposition Highlight Banner (Matching home-run.co exact screenshot) */}
        <div className="bg-[#fbf7ee] border border-amber-200/60 rounded-2xl p-4 sm:py-3.5 sm:px-8 mb-5 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-amber-200/60 gap-3 md:gap-0">
            
            {/* Item 1: Pay on Delivery */}
            <div className="flex items-center gap-3 md:justify-center md:px-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100/70 flex items-center justify-center shrink-0 text-slate-800">
                <Banknote className="w-5 h-5 text-slate-800" />
              </div>
              <div className="leading-tight">
                <div className="font-extrabold text-sm text-slate-900">Pay on Delivery</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">Pay after you receive &amp; verify</div>
              </div>
            </div>

            {/* Item 2: 5% Cashback */}
            <div className="flex items-center gap-3 md:justify-center md:px-6 pt-2.5 md:pt-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100/70 flex items-center justify-center shrink-0 text-slate-800">
                <span className="w-5 h-5 rounded-full border border-slate-800 flex items-center justify-center font-black text-xs leading-none">
                  ₹
                </span>
              </div>
              <div className="leading-tight">
                <div className="font-extrabold text-sm text-slate-900">5% Cashback</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">On order above 1lakh+</div>
              </div>
            </div>

            {/* Item 3: Jobsite Delivery */}
            <div className="flex items-center gap-3 md:justify-center md:px-6 pt-2.5 md:pt-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100/70 flex items-center justify-center shrink-0 text-slate-800">
                <Truck className="w-5 h-5 text-slate-800" />
              </div>
              <div className="leading-tight">
                <div className="font-extrabold text-sm text-slate-900">Jobsite Delivery</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">Ayodhya Dham &amp; nearby zones</div>
              </div>
            </div>

          </div>
        </div>

        {/* 2B. Breadcrumbs (Matching Screenshot: Home > Civil & Interiors > Tiling) */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
          <Link href="/" className="hover:text-slate-900 transition">
            Home
          </Link>
          <span className="text-slate-400">›</span>
          <Link href={`/categories/${parentCategorySlug}`} className="hover:text-slate-900 transition">
            {parentCategoryTitle}
          </Link>
          <span className="text-slate-400">›</span>
          <span className="font-semibold text-slate-900">{categoryTitle}</span>
        </nav>

        {/* 2C. Large Category Heading */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mb-5">
          {categoryTitle}
        </h1>

        {/* 2D. Horizontal Filter & Sort Bar (Matching Screenshot Exact Layout) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 mb-6 border-b border-slate-100">
          
          {/* Left: Filter Pills Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs text-slate-400 font-semibold shrink-0 mr-1">Filter:</span>
            
            {/* Category Dropdown Pill */}
            <button
              onClick={() => setActiveBrandFilter(null)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition shadow-2xs shrink-0 ${
                activeBrandFilter === null
                  ? 'border-slate-800 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>All Items</span>
            </button>

            {/* Brand Dropdown Filters */}
            {distinctBrands.map((brandName) => (
              <button
                key={brandName}
                onClick={() => setActiveBrandFilter(activeBrandFilter === brandName ? null : brandName)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition shadow-2xs shrink-0 ${
                  activeBrandFilter === brandName
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{brandName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ))}

            {/* Standard Filter Pills from Screenshot */}
            {['Type', 'Size', 'Colors', 'Grade', 'Price', 'Pack Size'].map((filterName) => (
              <button
                key={filterName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition shadow-2xs shrink-0"
              >
                <span>{filterName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ))}
          </div>

          {/* Right: Product Count & Sort Dropdown */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <span className="text-xs text-slate-500 font-medium">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs cursor-pointer"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="discount">Highest Discount</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

        </div>

        {/* 2E. Product Cards Grid (4 Columns Desktop, 2 Columns Tablet, 1 Column Mobile) */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-2xl border border-slate-200">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No products found matching filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters to view all products in {categoryTitle}.</p>
            <button
              onClick={() => setActiveBrandFilter(null)}
              className="mt-3 px-4 py-2 bg-slate-900 text-amber-400 text-xs font-bold rounded-xl"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((prod) => {
              const isAdded = addedIds.has(prod.id);
              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md p-3.5 flex flex-col justify-between transition duration-200 group"
                >
                  <div className="flex-1 flex flex-col">
                    {/* Top Image Box with Yellow Discount Pill */}
                    <div className="relative h-48 sm:h-52 shrink-0 w-full flex items-center justify-center bg-white rounded-xl p-3 mb-2 overflow-hidden">
                      {prod.discountPct > 0 && (
                        <span className="absolute top-2 left-2 z-10 bg-[#f5b800] text-slate-950 font-black text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full shadow-2xs">
                          {prod.discountPct}% OFF
                        </span>
                      )}
                      <Link
                        href={`/products/${prod.slug}`}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <img
                          src={prod.imageUrl}
                          alt={prod.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/products/ultratech_cement.png';
                          }}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xs"
                          loading="lazy"
                        />
                      </Link>
                    </div>

                    {/* Delivery & Payment Row */}
                    <div className="flex items-center gap-2.5 text-[11px] font-semibold text-[#138a72] mb-1">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#138a72]" /> Site Delivery
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Banknote className="w-3.5 h-3.5 text-[#138a72]" /> Pay on Delivery
                      </span>
                    </div>

                    {/* Teal Delivery Pill */}
                    <div className="bg-[#0d9488] text-white text-[9px] font-bold px-2 py-0.5 rounded-xs inline-flex items-center gap-1 mb-1.5">
                      <Truck className="w-3 h-3" />
                      <span>Jobsite Delivery in Ayodhya</span>
                    </div>

                    {/* Product Title: Strict 2 lines / 40px height for uniform grid */}
                    <div className="h-10 mb-1 overflow-hidden">
                      <Link
                        href={`/products/${prod.slug}`}
                        className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 hover:underline block leading-snug"
                      >
                        {prod.title}
                      </Link>
                    </div>

                    {/* Price Row: Strikethrough MRP + Bold Selling Price */}
                    <div className="flex items-baseline gap-1.5 mt-1">
                      {prod.mrp > prod.price && (
                        <span className="text-slate-400 line-through text-xs sm:text-sm">
                          ₹{prod.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="font-black text-slate-950 text-sm sm:text-base">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* 5% Cashback Flat Banner (Matching Screenshot 1 & 2) */}
                    <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-yellow-100 border border-amber-200/70 rounded-xs px-2 py-1 flex items-center gap-1.5 text-[10px] mt-2">
                      <span className="bg-[#257f2e] text-white font-black text-[8px] px-1 py-0.5 rounded-xs leading-none">
                        5% FLAT
                      </span>
                      <span className="font-semibold text-slate-800 text-[10px] truncate">
                        Cashback on 1 Lakh+ orders
                      </span>
                    </div>

                    {/* Blue Dotted Underline Bulk Price Link */}
                    <div className="h-5 flex items-center mt-1.5">
                      {prod.bulkPriceText ? (
                        <Link
                          href={`/products/${prod.slug}`}
                          className="text-[10px] font-semibold text-blue-600 border-b border-dotted border-blue-500 hover:text-blue-800 block truncate"
                        >
                          {prod.bulkPriceText}
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  {/* Bottom Action Button (Solid Green Add Button or Options Dropdown, pinned with mt-auto) */}
                  <div className="mt-auto pt-3">
                    {prod.optionsCount ? (
                      <button
                        type="button"
                        onClick={() => setOptionsModalProduct(prod)}
                        className="w-full h-10 bg-[#257f2e] hover:bg-[#1e6b26] text-white font-bold text-xs sm:text-sm rounded-lg shadow-xs transition flex items-center justify-center gap-1 active:scale-[0.98] cursor-pointer"
                      >
                        <span>{prod.optionsCount} Options</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAdd(prod)}
                        className={`w-full h-10 text-white font-bold text-xs sm:text-sm rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isAdded
                            ? 'bg-[#1e6b26]'
                            : 'bg-[#257f2e] hover:bg-[#1e6b26] active:scale-[0.98]'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4" /> Added
                          </>
                        ) : (
                          'Add'
                        )}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* 3. Product Options Modal Popup (Matching home-run.co screenshot) */}
      <ProductOptionsModal
        isOpen={Boolean(optionsModalProduct)}
        onClose={() => setOptionsModalProduct(null)}
        product={optionsModalProduct}
      />

      {/* 4. Broad Yellow Footer */}
      <Footer />
    </div>
  );
};
