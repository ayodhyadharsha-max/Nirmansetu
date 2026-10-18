'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  Clock,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Info,
  MapPin,
  CheckCircle2,
  FileText,
  Building,
  Package,
} from 'lucide-react';
import { PublicCatalogItem } from '@/types/database';
import { formatPaiseToRupees } from '@/lib/money';
import { ProductCard } from './ProductCard';
import { AYODHYA_REGIONAL_HUBS } from '@/config/brand';

import { useCart } from '@/context/CartContext';

interface ProductDetailViewProps {
  product: PublicCatalogItem;
  relatedProducts: PublicCatalogItem[];
  onAddToCart?: (item: PublicCatalogItem, quantity: number) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  relatedProducts,
  onAddToCart,
}) => {
  const cart = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(product.min_order_qty || 1);
  const [selectedPincode, setSelectedPincode] = useState(cart.selectedPincode || '224123');
  const [isAdded, setIsAdded] = useState(false);

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'];

  const discountPct =
    product.mrp_paise > product.selling_price_paise
      ? Math.round(((product.mrp_paise - product.selling_price_paise) / product.mrp_paise) * 100)
      : 0;

  // Single unit line total in paise
  const lineTotalPaise = product.selling_price_paise * quantity;

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
    setTimeout(() => setIsAdded(false), 2000);
  };

  const hub = AYODHYA_REGIONAL_HUBS.find((h) => h.pincode === selectedPincode) || AYODHYA_REGIONAL_HUBS[0];

  return (
    <div className="space-y-12">
      
      {/* 1. Breadcrumb navigation */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href={`/categories/${product.category_slug}`} className="hover:text-slate-900">
          {product.category_name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-900 truncate max-w-xs">{product.product_title}</span>
      </nav>

      {/* 2. Main Product Two-Column Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-4/3 w-full bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            <img
              src={images[selectedImageIndex] || images[0]}
              alt={product.product_title}
              className="w-full h-full object-cover"
            />
            {discountPct > 0 && (
              <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                {discountPct}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition ${
                    selectedImageIndex === idx ? 'border-amber-500 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-900">100% Authentic Brand</div>
                <div className="text-[11px] text-slate-500">Direct factory batches</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-900">GST Invoice</div>
                <div className="text-[11px] text-slate-500">Claim 18%/28% ITC</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Pricing, Quantity & Add to Cart */}
        <div className="lg:col-span-6 space-y-6">
          
          <div>
            {product.brand_name && (
              <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 uppercase tracking-wide mb-2">
                {product.brand_name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-snug">
              {product.product_title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              {product.short_description || product.description}
            </p>
          </div>

          {/* Price Block */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-baseline justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-950">
                {formatPaiseToRupees(product.selling_price_paise)}
                <span className="text-xs font-normal text-slate-500 ml-1.5">
                  / {product.unit_of_measure}
                </span>
              </div>
              {product.mrp_paise > product.selling_price_paise && (
                <div className="text-xs text-slate-400 line-through mt-0.5">
                  MRP {formatPaiseToRupees(product.mrp_paise)} (Inclusive of all taxes)
                </div>
              )}
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                GST {product.tax_rate_pct}% Included
              </span>
            </div>
          </div>

          {/* Pack Size & Unit Information */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Selected Packaging & Standard Unit
            </label>
            <div className="p-3 rounded-xl border border-amber-500 bg-amber-50/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-900">
                  {product.pack_size || `Standard ${product.unit_of_measure}`}
                </span>
              </div>
              <span className="text-slate-500">Unit: {product.unit_of_measure}</span>
            </div>
          </div>

          {/* Pincode & SLA Delivery Check */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Deliver to Site ({selectedPincode})</span>
              </span>
              <span className="font-bold text-emerald-700">{hub.slaMinutes} Mins SLA</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Fulfilled through approved local stockists in {hub.name}. Dispatched via tempo directly to your site foundation or unloading area.
            </p>
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Quantity ({product.unit_of_measure}):
              </span>
              <span className="text-slate-500">
                Minimum order: <strong className="text-slate-900">{product.min_order_qty} {product.unit_of_measure}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-300 rounded-2xl bg-slate-50 p-1">
                <button
                  onClick={() => handleQtyChange(-1)}
                  disabled={quantity <= (product.min_order_qty || 1)}
                  className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-700 hover:text-slate-950 disabled:opacity-30 shadow-xs transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-14 text-center font-black text-sm text-slate-950">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQtyChange(1)}
                  className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-700 hover:text-slate-950 shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                disabled={!product.is_in_stock}
                className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 shadow-md ${
                  !product.is_in_stock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 hover:bg-slate-800 text-amber-400'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Site Cart!</span>
                  </>
                ) : !product.is_in_stock ? (
                  <span>Out of Stock</span>
                ) : (
                  <span>Add {quantity} {product.unit_of_measure} • {formatPaiseToRupees(lineTotalPaise)}</span>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Specifications & Description Section */}
      <div className="pt-8 border-t border-slate-200">
        <h3 className="text-lg font-black text-slate-950 uppercase tracking-wide mb-4">
          Technical Specifications & Standards
        </h3>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-slate-600 w-1/3">Standard / Certification</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">
                  {String(product.specifications?.standard || 'IS Bureau of Indian Standards')}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-slate-600">Unit of Measure</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900 capitalize">{product.unit_of_measure}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-slate-600">Pack Size</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">{product.pack_size || 'Standard Commercial'}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-slate-600">HSN Code</td>
                <td className="py-2.5 px-4 font-semibold font-mono text-slate-900">{product.hsn_code || '2523'}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-slate-600">Applicable GST Tax</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">{product.tax_rate_pct}%</td>
              </tr>
              {Object.entries(product.specifications || {}).map(([key, val], idx) => {
                if (key === 'standard') return null;
                return (
                  <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2.5 px-4 font-bold text-slate-600 capitalize">
                      {key.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{String(val)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-950">Related Materials in Ayodhya</h3>
              <p className="text-xs text-slate-500">Commonly ordered together for civil & structural work</p>
            </div>
            <Link
              href={`/categories/${product.category_slug}`}
              className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
            >
              <span>View All in {product.category_name}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.slice(0, 3).map((item) => (
              <ProductCard key={item.product_id} product={item} onAddToCart={onAddToCart} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
