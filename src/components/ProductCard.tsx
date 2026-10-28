'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Minus, Check, Clock, Banknote, Truck, Heart } from 'lucide-react';
import { PublicCatalogItem } from '@/types/database';
import { formatPaiseToRupees } from '@/lib/money';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface ProductCardProps {
  product: PublicCatalogItem;
  onAddToCart?: (product: PublicCatalogItem, quantity: number) => void;
  selectedPincode?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  selectedPincode,
}) => {
  const cart = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = useState<number>(product.min_order_qty || 1);
  const [isAdded, setIsAdded] = useState(false);

  const initialImage =
    product.images && product.images.length > 0 && product.images[0]
      ? product.images[0]
      : '/images/products/ultratech_cement.png';

  const [imgSrc, setImgSrc] = useState(initialImage);

  const discountPct =
    product.mrp_paise > product.selling_price_paise
      ? Math.round(((product.mrp_paise - product.selling_price_paise) / product.mrp_paise) * 100)
      : 0;

  const handleQtyChange = (delta: number) => {
    setQuantity((prev) => Math.max(product.min_order_qty || 1, prev + delta));
  };

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
    } else {
      cart.addToCart(product, quantity);
    }
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const wishlisted = isWishlisted(product.product_id);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 p-2 sm:p-3 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group h-full">
      
      <div>
        {/* Card Image Area with Discount Pill and Object-Contain */}
        <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-white mb-2 flex items-center justify-center p-2 rounded-xl">
          {discountPct > 0 && (
            <div className="absolute top-1.5 left-1.5 z-10 bg-[#f5b800] text-slate-950 font-black text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full shadow-2xs">
              {discountPct}% OFF
            </div>
          )}

          {/* Wishlist Heart Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-1.5 right-1.5 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-red-500 shadow-2xs transition"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
          </button>

          <Link
            href={`/products/${product.product_slug}`}
            className="w-full h-full flex items-center justify-center"
          >
            <img
              src={imgSrc}
              alt={product.product_title}
              onError={() => setImgSrc('/images/products/ultratech_cement.png')}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-xs"
              loading="lazy"
            />
          </Link>
        </div>

        {/* Delivery Badges */}
        <div className="space-y-1.5 mb-2.5">
          <div className="flex items-center gap-2.5 text-[11px] font-semibold text-[#138a72]">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#138a72]" />
              <span>Site Delivery</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-[#138a72]" />
              <span>Pay on Delivery</span>
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-1 text-[10px]">
            <span className="inline-flex items-center gap-1 bg-[#138a72] text-white font-bold px-1.5 py-0.5 rounded">
              <Truck className="w-3 h-3 text-white" />
              <span>Jobsite Delivery</span>
            </span>
            <span className="text-[#138a72] font-medium">Ayodhya &amp; Nearby</span>
          </div>
        </div>

        {/* Product Title & Brand */}
        <div>
          {product.brand_name && (
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              {product.brand_name}
            </div>
          )}

          <Link href={`/products/${product.product_slug}`}>
            <h3 className="font-bold text-xs sm:text-[14px] text-slate-900 group-hover:underline line-clamp-2 mt-0.5 leading-snug min-h-[38px]">
              {product.product_title}
            </h3>
          </Link>
        </div>
      </div>

      {/* Card Footer: Pricing and Actions */}
      <div className="mt-3 pt-2 border-t border-slate-100">
        
        {/* Price Row */}
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {formatPaiseToRupees(product.selling_price_paise)}
              <span className="text-xs font-normal text-slate-500 ml-1">/ {product.unit_of_measure}</span>
            </div>
            {product.mrp_paise > product.selling_price_paise && (
              <div className="text-[11px] text-slate-400 line-through">
                MRP {formatPaiseToRupees(product.mrp_paise)}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 text-right">
            Min: <span className="font-bold text-slate-800">{product.min_order_qty}</span>
          </div>
        </div>

        {/* Quantity Controls & Add to Cart Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => handleQtyChange(-1)}
              disabled={quantity <= (product.min_order_qty || 1)}
              className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 hover:text-slate-950 disabled:opacity-30 text-xs shadow-xs transition"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-7 text-center font-bold text-xs text-slate-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQtyChange(1)}
              className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 hover:text-slate-950 text-xs shadow-xs transition"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.is_in_stock}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer ${
              !product.is_in_stock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-800 text-white'
                : 'bg-[#257f2e] hover:bg-[#1f6d27] text-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Added</span>
              </>
            ) : !product.is_in_stock ? (
              <span>Out of Stock</span>
            ) : (
              <span>Add</span>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
