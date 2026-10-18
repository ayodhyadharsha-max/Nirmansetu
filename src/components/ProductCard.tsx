'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Minus, Check, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { PublicCatalogItem } from '@/types/database';
import { formatPaiseToRupees } from '@/lib/money';
import { useCart } from '@/context/CartContext';

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
  const effectivePincode = selectedPincode || cart.selectedPincode || '224123';
  const [quantity, setQuantity] = useState<number>(product.min_order_qty || 1);
  const [isAdded, setIsAdded] = useState(false);

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

  const displayImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Card Image Area with Badges */}
        <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
          <Link href={`/products/${product.product_slug}`}>
            <img
              src={displayImage}
              alt={product.product_title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </Link>

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            {product.brand_name && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-xs text-white">
                {product.brand_name}
              </span>
            )}
            {discountPct > 0 && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                {discountPct}% OFF
              </span>
            )}
          </div>

          <div className="absolute top-2.5 right-2.5">
            {product.is_in_stock ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/90 text-white backdrop-blur-xs">
                <Clock className="w-2.5 h-2.5" />
                <span>60m Ayodhya</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-700/80 text-white">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
            {product.category_name}
          </div>

          <Link href={`/products/${product.product_slug}`}>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition line-clamp-2 mt-1 leading-snug">
              {product.product_title}
            </h3>
          </Link>

          {product.pack_size && (
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Pack: {product.pack_size}
            </div>
          )}

          <div className="text-[11px] text-slate-400 mt-1">
            HSN: {product.hsn_code || '2523'} • Unit: {product.unit_of_measure}
          </div>
        </div>
      </div>

      {/* Card Footer: Pricing and Actions */}
      <div className="p-4 pt-0">
        <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between mb-3">
          <div>
            <div className="text-base font-black text-slate-950">
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
            Min: <span className="font-bold text-slate-800">{product.min_order_qty} {product.unit_of_measure}</span>
          </div>
        </div>

        {/* Quantity Controls & Add to Cart */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
            <button
              onClick={() => handleQtyChange(-1)}
              disabled={quantity <= (product.min_order_qty || 1)}
              className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 text-xs shadow-xs"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-7 text-center font-bold text-xs text-slate-900">
              {quantity}
            </span>
            <button
              onClick={() => handleQtyChange(1)}
              className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 text-xs shadow-xs"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleAdd}
            disabled={!product.is_in_stock}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs ${
              !product.is_in_stock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 hover:bg-slate-800 text-amber-400'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : !product.is_in_stock ? (
              <span>Out of Stock</span>
            ) : (
              <span>Add to Cart</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
