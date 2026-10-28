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
  Heart,
} from 'lucide-react';
import { PublicCatalogItem } from '@/types/database';
import { formatPaiseToRupees } from '@/lib/money';
import { ProductCard } from './ProductCard';
import { AYODHYA_REGIONAL_HUBS } from '@/config/brand';
import { ALL_HOMERUN_PRODUCTS } from '@/config/homerun-catalog';

import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface ProductDetailViewProps {
  product: PublicCatalogItem;
  relatedProducts: PublicCatalogItem[];
  onAddToCart?: (item: PublicCatalogItem, quantity: number) => void;
}

function formatUnitAndMinOrder(unitOfMeasure: string, minQty: number = 1) {
  const normalized = (unitOfMeasure || '').toLowerCase().trim();

  if (normalized.includes('50 kg bag') || normalized.includes('50kg bag') || normalized.includes('50 kg')) {
    return {
      priceUnit: 'per 50 kg bag',
      quantityLabel: 'Quantity (Bags)',
      minOrderText: minQty === 1 ? '1 bag (50 kg)' : `${minQty} bags (${minQty * 50} kg total)`,
      itemPlural: minQty === 1 ? 'Bag (50 kg)' : 'Bags (50 kg each)',
      shortUnit: minQty === 1 ? 'bag' : 'bags',
    };
  }
  if (normalized.includes('40 kg bag') || normalized.includes('40kg bag') || normalized.includes('40 kg')) {
    return {
      priceUnit: 'per 40 kg bag',
      quantityLabel: 'Quantity (Bags)',
      minOrderText: minQty === 1 ? '1 bag (40 kg)' : `${minQty} bags (${minQty * 40} kg total)`,
      itemPlural: minQty === 1 ? 'Bag (40 kg)' : 'Bags (40 kg each)',
      shortUnit: minQty === 1 ? 'bag' : 'bags',
    };
  }
  if (normalized.includes('coil') || normalized.includes('90m')) {
    return {
      priceUnit: 'per 90m coil',
      quantityLabel: 'Quantity (Coils)',
      minOrderText: minQty === 1 ? '1 coil (90m)' : `${minQty} coils`,
      itemPlural: minQty === 1 ? 'Coil (90m)' : 'Coils (90m)',
      shortUnit: minQty === 1 ? 'coil' : 'coils',
    };
  }
  if (normalized.includes('piece') || normalized.includes('pc')) {
    return {
      priceUnit: 'per piece',
      quantityLabel: 'Quantity (Pieces)',
      minOrderText: minQty === 1 ? '1 piece' : `${minQty} pieces`,
      itemPlural: minQty === 1 ? 'Piece' : 'Pieces',
      shortUnit: minQty === 1 ? 'piece' : 'pieces',
    };
  }
  if (normalized.includes('kg')) {
    return {
      priceUnit: 'per kg',
      quantityLabel: 'Quantity (kg)',
      minOrderText: `${minQty} kg`,
      itemPlural: 'kg',
      shortUnit: 'kg',
    };
  }
  if (normalized.includes('litre') || normalized.includes('liter')) {
    return {
      priceUnit: 'per litre',
      quantityLabel: 'Quantity (Litres)',
      minOrderText: `${minQty} L`,
      itemPlural: minQty === 1 ? 'Litre' : 'Litres',
      shortUnit: minQty === 1 ? 'L' : 'L',
    };
  }

  return {
    priceUnit: `per ${unitOfMeasure}`,
    quantityLabel: `Quantity (${unitOfMeasure})`,
    minOrderText: minQty === 1 ? `1 ${unitOfMeasure}` : `${minQty} ${unitOfMeasure}`,
    itemPlural: unitOfMeasure,
    shortUnit: unitOfMeasure,
  };
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  relatedProducts,
  onAddToCart,
}) => {
  const cart = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(product.min_order_qty || 1);
  const [selectedPincode, setSelectedPincode] = useState(cart.selectedPincode || '224123');
  const [isAdded, setIsAdded] = useState(false);

  const unitInfo = formatUnitAndMinOrder(product.unit_of_measure, product.min_order_qty);

  const wishlisted = isWishlisted(product.product_id);

  // Look up catalog item for authentic rich variants/options
  const catalogItem = ALL_HOMERUN_PRODUCTS.find(
    (p) => p.slug === product.product_slug || p.id === product.product_id || p.altSlugs?.includes(product.product_slug)
  );
  const options = catalogItem?.options || [];
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    options[0]?.id || null
  );

  const selectedOption = options.find((o) => o.id === selectedOptionId);

  const effectiveSellingPricePaise = selectedOption
    ? selectedOption.price * 100
    : product.selling_price_paise;
  const effectiveMrpPaise = selectedOption
    ? (selectedOption.mrp ?? selectedOption.price) * 100
    : product.mrp_paise;
  const effectivePackSize = selectedOption
    ? selectedOption.packSize || selectedOption.name || selectedOption.title
    : product.pack_size || `Standard ${product.unit_of_measure}`;

  const optionImage = selectedOption?.imageUrl;
  const rawImages = (optionImage ? [optionImage] : product.images) || [];
  const images = rawImages.length > 0
    ? rawImages
    : ['/images/products/ultratech_cement.png'];

  const discountPct =
    effectiveMrpPaise > effectiveSellingPricePaise
      ? Math.round(((effectiveMrpPaise - effectiveSellingPricePaise) / effectiveMrpPaise) * 100)
      : 0;

  // Single unit line total in paise
  const lineTotalPaise = effectiveSellingPricePaise * quantity;

  const handleQtyChange = (delta: number) => {
    setQuantity((prev) => Math.max(product.min_order_qty || 1, prev + delta));
  };

  const handleAdd = () => {
    const effectiveProduct: PublicCatalogItem = {
      ...product,
      selling_price_paise: effectiveSellingPricePaise,
      mrp_paise: effectiveMrpPaise,
      pack_size: effectivePackSize,
      variant_id: selectedOption ? `v-${selectedOption.id}` : product.variant_id,
      variant_title: selectedOption ? (selectedOption.title || selectedOption.name || product.variant_title) : product.variant_title,
      images: images,
    };

    if (onAddToCart) {
      onAddToCart(effectiveProduct, quantity);
    } else {
      cart.addToCart(effectiveProduct, quantity);
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
          <div className="relative aspect-4/3 w-full bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm flex items-center justify-center p-6">
            <img
              src={images[selectedImageIndex] || images[0]}
              alt={product.product_title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/products/ultratech_cement.png';
              }}
              className="max-h-full max-w-full object-contain drop-shadow-xs"
            />
            {discountPct > 0 && (
              <span className="absolute top-4 left-4 bg-[#f5b800] text-slate-950 text-xs font-black px-2.5 py-1 rounded-full shadow-2xs">
                {discountPct}% OFF
              </span>
            )}
            {/* Wishlist Heart Toggle */}
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/95 hover:bg-white text-slate-400 hover:text-red-500 shadow-md transition cursor-pointer"
            >
              <Heart className={`w-5 h-5 ${wishlisted ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
            </button>
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
                <div className="font-bold text-slate-900">Verified Brand Sourcing</div>
                <div className="text-[11px] text-slate-500">Inspected before OTP release</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-900">Statutory GST Invoice</div>
                <div className="text-[11px] text-slate-500">Tax invoice with GSTIN (ITC rules apply)</div>
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
                {formatPaiseToRupees(effectiveSellingPricePaise)}
                <span className="text-xs font-normal text-slate-500 ml-1.5">
                  / {unitInfo.priceUnit}
                </span>
              </div>
              {effectiveMrpPaise > effectiveSellingPricePaise && (
                <div className="text-xs text-slate-400 line-through mt-0.5">
                  MRP {formatPaiseToRupees(effectiveMrpPaise)} (Inclusive of all taxes)
                </div>
              )}
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                GST {product.tax_rate_pct}% Included
              </span>
            </div>
          </div>

          {/* Multi-Option / Size Selector */}
          {options.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-800 uppercase tracking-wider">
                  Available Sizes / Options:
                </label>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">
                  {options.length} Variations
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {options.map((opt) => {
                  const isSelected = (selectedOptionId || options[0].id) === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedOptionId(opt.id);
                        setSelectedImageIndex(0);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-400/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        {opt.title || opt.name}
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1.5">
                        <span className="text-sm font-black text-slate-950">
                          ₹{opt.price.toLocaleString('en-IN')}
                        </span>
                        {typeof opt.mrp === 'number' && opt.mrp > opt.price && (
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{opt.mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                        {Boolean(opt.discountPct) && (
                          <span className="text-[10px] font-bold text-emerald-700 ml-auto">
                            {opt.discountPct}% OFF
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pack Size & Unit Information */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Selected Packaging & Standard Unit
            </label>
            <div className="p-3 rounded-xl border border-amber-500 bg-amber-50/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-900">
                  {effectivePackSize}
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
              <span className="font-bold text-emerald-700">{hub.isExpress ? 'Express Dispatch Zone' : 'Standard Delivery Zone'}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Fulfilled through approved local stockists in {hub.name}. Dispatched via tempo directly to your site foundation or unloading area.
            </p>
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                {unitInfo.quantityLabel}:
              </span>
              <span className="text-slate-500">
                Minimum order: <strong className="text-slate-900">{unitInfo.minOrderText}</strong>
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
                    ? 'bg-emerald-800 text-white'
                    : 'bg-[#257f2e] hover:bg-[#1f6d27] text-white active:scale-95'
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
                  <span>
                    Add {quantity} {quantity === 1 ? unitInfo.shortUnit : unitInfo.shortUnit} • {formatPaiseToRupees(lineTotalPaise)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                className={`px-4 py-3.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  wishlisted
                    ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{wishlisted ? 'Saved' : 'Save'}</span>
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
                <td className="py-2.5 px-4 font-semibold text-slate-900">{effectivePackSize}</td>
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
