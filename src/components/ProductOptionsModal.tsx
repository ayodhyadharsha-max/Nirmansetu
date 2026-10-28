'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { HomeRunProductItem, ProductOptionItem, generateRealisticOptions } from '@/config/homerun-catalog';
import { useCart } from '@/context/CartContext';

interface ProductOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: HomeRunProductItem | null;
}

export const ProductOptionsModal: React.FC<ProductOptionsModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { addToCart } = useCart();
  const [addedOptIds, setAddedOptIds] = useState<Set<string>>(new Set());

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

  if (!isOpen || !product) return null;

  const options: ProductOptionItem[] = generateRealisticOptions(product);

  const handleAddOption = (opt: ProductOptionItem) => {
    addToCart(
      {
        product_id: `${product.id}-${opt.id}`,
        product_title: `${product.title} (${opt.title})`,
        product_slug: product.slug,
        short_description: product.title,
        description: product.title,
        hsn_code: '2523',
        unit_of_measure: 'units',
        is_bulk_available: true,
        is_featured: true,
        specifications: {},
        images: [opt.imageUrl || product.imageUrl],
        tax_rate_pct: 18,
        product_status: 'published',
        category_id: 'c0000000-0000-0000-0000-000000000001',
        category_name: 'Materials',
        category_slug: 'tiling',
        brand_id: 'b0000000-0000-0000-0000-000000000001',
        brand_name: product.brand,
        brand_slug: product.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        brand_logo: opt.imageUrl || product.imageUrl,
        variant_id: `v-${opt.id}`,
        variant_title: opt.title,
        sku: `SKU-${opt.id}`,
        pack_size: opt.title,
        attributes: { size: opt.title },
        min_order_qty: 1,
        max_order_qty: 500,
        weight_kg: 10,
        dimensions_cm: { length: 30, width: 20, height: 10 },
        selling_price_paise: opt.price * 100,
        mrp_paise: (opt.mrp || opt.price) * 100,
        total_available_stock: 500,
        is_in_stock: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      1
    );

    setAddedOptIds((prev) => new Set(prev).add(opt.id));
    setTimeout(() => {
      setAddedOptIds((prev) => {
        const next = new Set(prev);
        next.delete(opt.id);
        return next;
      });
    }, 1800);
  };

  return (
    <>
      {/* Dark Dimming Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Card (Matching home-run.co exact screenshot) */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header: Title + Close Button */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
          <h3 className="text-base font-black text-slate-900 tracking-tight truncate pr-2">
            {product.title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 rounded-full hover:bg-slate-100 shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options List Rows */}
        <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-0.5">
          {options.map((opt) => {
            const isAdded = addedOptIds.has(opt.id);
            return (
              <div
                key={opt.id}
                className="border border-slate-200/80 rounded-xl p-3 flex items-center justify-between bg-white hover:border-slate-300 transition shadow-2xs group"
              >
                {/* Left: Thumbnail Image + Option Name + Price */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    <img
                      src={opt.imageUrl || product.imageUrl}
                      alt={opt.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/products/ultratech_cement.png';
                      }}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-slate-900 truncate">
                      {opt.title}
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      {opt.mrp && opt.mrp > opt.price && (
                        <span className="text-slate-400 line-through text-xs">
                          ₹{opt.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="font-bold text-slate-950 text-xs sm:text-sm">
                        ₹{opt.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Solid Green Add Button */}
                <button
                  onClick={() => handleAddOption(opt)}
                  className={`px-6 sm:px-7 py-2 text-white font-bold text-xs rounded-lg shadow-xs transition shrink-0 flex items-center justify-center gap-1.5 ${
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
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
};
