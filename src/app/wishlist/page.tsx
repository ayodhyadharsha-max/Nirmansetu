'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, ArrowRight, Trash2, ArrowLeft, ShieldCheck, Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { formatPaiseToRupees } from '@/lib/money';

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, clearWishlist, wishlistCount } = useWishlist();
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = React.useState<Record<string, boolean>>({});

  const handleMoveToCart = (item: any) => {
    addToCart(item, item.min_order_qty || 1);
    setAddedIds((prev) => ({ ...prev, [item.product_id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.product_id]: false }));
    }, 1800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href="/" className="hover:text-slate-900 transition">
                Home
              </Link>
              <span>/</span>
              <span className="text-slate-900">Wishlist</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-3">
              <Heart className="w-7 h-7 text-red-500 fill-red-500" />
              <span>My Saved Materials</span>
              <span className="text-sm font-bold text-slate-400 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                {wishlistCount}
              </span>
            </h1>
          </div>

          {wishlistCount > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs font-bold text-slate-500 hover:text-red-600 transition flex items-center gap-1 self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Wishlist</span>
            </button>
          )}
        </div>

        {wishlistCount === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Your Wishlist is Empty</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Save materials, tools, and equipment you need for your jobsite to quickly compare wholesale rates and order when ready.
            </p>
            <div className="pt-2">
              <Link
                href="/categories/cement-construction-materials"
                className="inline-flex items-center gap-2 py-3 px-6 bg-slate-950 hover:bg-slate-800 text-amber-400 font-extrabold text-xs rounded-xl shadow-md transition"
              >
                <span>Browse Building Materials</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlistItems.map((item) => {
              const isAdded = !!addedIds[item.product_id];
              const image = item.images?.[0] || '/images/products/ultratech_cement.png';
              const unit = item.unit_of_measure || '50 kg bag';

              return (
                <div
                  key={item.product_id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group relative"
                >
                  <button
                    onClick={() => removeFromWishlist(item.product_id)}
                    aria-label="Remove item"
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div>
                    <div className="w-full h-44 bg-slate-50 rounded-xl p-3 flex items-center justify-center mb-3">
                      <img
                        src={image}
                        alt={item.product_title}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                      {item.brand_name || 'Generic / Local Stockist'}
                    </div>

                    <Link
                      href={`/products/${item.product_slug}`}
                      className="font-bold text-sm text-slate-900 hover:text-amber-700 line-clamp-2 leading-snug mb-2"
                    >
                      {item.product_title}
                    </Link>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-black text-slate-950 font-mono">
                        {formatPaiseToRupees(item.selling_price_paise)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">/ {unit}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      disabled={isAdded}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-amber-400'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Added to Cart</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Move to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
