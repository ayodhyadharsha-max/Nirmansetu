'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, Truck, Banknote, ChevronDown, Check, Heart } from 'lucide-react';
import { HomeRunProductItem } from '@/config/homerun-catalog';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ProductOptionsModal } from '@/components/ProductOptionsModal';
import { PublicCatalogItem } from '@/types/database';

interface HomeRunProductCardProps {
  product: HomeRunProductItem;
  onOpenEnquiry?: () => void;
  onOpenOptions?: (product: HomeRunProductItem) => void;
}

const inferPackagingAndUnit = (title: string, brand: string) => {
  const t = title.toLowerCase();
  if (t.includes('cement')) return { unit: '50 kg bag', pack: '50 kg HDPE Bag' };
  if (t.includes('putty')) return { unit: '40 kg bag', pack: '40 kg Bag' };
  if (t.includes('wire') || t.includes('cable')) return { unit: '90m coil', pack: '90m Coil' };
  if (t.includes('waterproofing') || t.includes('primer') || t.includes('paint') || t.includes('distemper')) {
    return { unit: 'pack', pack: 'Commercial Bucket / Canister' };
  }
  if (t.includes('pipe') || t.includes('conduit')) return { unit: 'piece', pack: '3 Metre Length' };
  if (t.includes('adhesive') || t.includes('fevicol')) return { unit: 'pack', pack: 'Industrial Adhesive Pack' };
  return { unit: 'piece', pack: 'Standard Pack' };
};

export const HomeRunProductCard: React.FC<HomeRunProductCardProps> = ({
  product,
  onOpenEnquiry,
  onOpenOptions,
}) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isAdded, setIsAdded] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(product.imageUrl);

  const { unit, pack } = inferPackagingAndUnit(product.title, product.brand);

  const catalogItem: PublicCatalogItem = {
    product_id: product.id,
    product_title: product.title,
    product_slug: product.slug,
    short_description: product.title,
    description: product.title,
    hsn_code: '2523',
    unit_of_measure: unit,
    is_bulk_available: true,
    is_featured: true,
    specifications: {},
    images: [imgSrc],
    tax_rate_pct: 18,
    product_status: 'published',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    category_name: 'Materials',
    category_slug: 'cement-construction-materials',
    brand_id: 'b0000000-0000-0000-0000-000000000001',
    brand_name: product.brand,
    brand_slug: product.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    brand_logo: imgSrc,
    variant_id: `v-${product.id}`,
    variant_title: pack,
    sku: `SKU-${product.id}`,
    pack_size: pack,
    attributes: {},
    min_order_qty: 1,
    max_order_qty: 500,
    weight_kg: 10,
    dimensions_cm: { length: 30, width: 20, height: 10 },
    selling_price_paise: product.price * 100,
    mrp_paise: product.mrp * 100,
    total_available_stock: 500,
    is_in_stock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const wishlisted = isWishlisted(product.id);

  const handleAdd = () => {
    addToCart(catalogItem, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  return (
    <div className="bg-white flex flex-col justify-between h-full w-full group p-3 rounded-2xl hover:shadow-md border border-slate-100 hover:border-slate-200 transition-all duration-200">
      
      <div className="flex-1 flex flex-col">
        {/* Product Image Area with Discount Pill and Wishlist Heart */}
        <div className="relative w-full h-44 sm:h-48 shrink-0 overflow-hidden bg-white mb-2 flex items-center justify-center p-2 rounded-xl">
          {product.discountPct > 0 && (
            <div className="absolute top-1.5 left-1.5 z-10 bg-[#f5b800] text-slate-950 font-black text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full shadow-2xs">
              {product.discountPct}% OFF
            </div>
          )}

          {/* Wishlist Heart Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(catalogItem);
            }}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            className="absolute top-1.5 right-1.5 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-red-500 shadow-2xs transition cursor-pointer"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
          </button>

          <Link
            href={`/products/${product.slug}`}
            className="w-full h-full flex items-center justify-center"
          >
            <img
              src={imgSrc}
              alt={product.title}
              onError={() => setImgSrc('/images/products/ultratech_cement.png')}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-xs"
              loading="lazy"
            />
          </Link>
        </div>

        {/* Delivery Badges */}
        <div className="space-y-1 mb-2">
          {/* Site Delivery & Pay on Delivery */}
          <div className="h-4 flex items-center gap-3 text-[11px] font-semibold text-[#138a72]">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#138a72]" />
              <span>Site Delivery</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-[#138a72]" />
              <span>Pay on Delivery</span>
            </span>
          </div>

          {/* Delivery Pill + Text Outside */}
          <div className="h-5 flex items-center flex-wrap gap-1 text-[10px]">
            <span className="inline-flex items-center gap-1 bg-[#138a72] text-white font-bold px-1.5 py-0.5 rounded">
              <Truck className="w-3 h-3 text-white" />
              <span>Jobsite Delivery</span>
            </span>
            <span className="text-[#138a72] font-medium">Ayodhya &amp; Nearby</span>
          </div>

          {/* Sub-badge Row: Fixed height h-5 */}
          <div className="h-5 flex items-center">
            {product.subBadge ? (
              <span className="inline-block text-[10px] font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80 leading-none">
                {product.subBadge}
              </span>
            ) : null}
          </div>
        </div>

        {/* Product Title (Strictly 2 lines / 40px height for 100% equal card sizing) */}
        <div className="h-10 mb-1 flex items-start overflow-hidden">
          <Link href={`/products/${product.slug}`} className="block group w-full">
            <h3 className="font-bold text-xs sm:text-[13px] text-slate-900 leading-snug group-hover:underline line-clamp-2">
              {product.title}
            </h3>
          </Link>
        </div>
      </div>

      {/* Pricing & Footer Actions */}
      <div className="mt-auto pt-2 border-t border-slate-100 flex flex-col justify-end shrink-0">
        
        {/* Price Row: Fixed h-6 */}
        <div className="h-6 flex items-baseline gap-1.5 mb-1">
          {product.mrp > product.price && (
            <span className="text-xs text-slate-400 line-through font-normal">
              ₹ {product.mrp.toLocaleString('en-IN')}
            </span>
          )}
          <span className="text-base sm:text-lg font-bold text-slate-900">
            ₹ {product.price.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">/ {unit}</span>
        </div>

        {/* Unlock Bulk Prices Link */}
        <div className="h-5 flex items-center mb-2">
          {product.bulkPriceText ? (
            <button
              type="button"
              onClick={onOpenEnquiry}
              className="text-xs font-semibold text-[#1e60d5] hover:underline underline decoration-dotted underline-offset-2 text-left cursor-pointer truncate"
            >
              {product.bulkPriceText}
            </button>
          ) : null}
        </div>

        {/* Solid Green Action Button: Fixed h-10 */}
        <button
          type="button"
          onClick={() => {
            if (product.optionsCount) {
              if (onOpenOptions) {
                onOpenOptions(product);
              } else {
                setIsOptionsOpen(true);
              }
            } else {
              handleAdd();
            }
          }}
          className={`w-full h-10 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer ${
            isAdded
              ? 'bg-emerald-800 text-white'
              : 'bg-[#257f2e] hover:bg-[#1f6d27] text-white'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Added to Cart</span>
            </>
          ) : product.optionsCount ? (
            <>
              <span>{product.optionsCount} Options</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </>
          ) : (
            <span>Add</span>
          )}
        </button>

      </div>

      {/* Options Modal for multi-variant products */}
      {isOptionsOpen && (
        <ProductOptionsModal
          isOpen={isOptionsOpen}
          onClose={() => setIsOptionsOpen(false)}
          product={product}
        />
      )}

    </div>
  );
};
