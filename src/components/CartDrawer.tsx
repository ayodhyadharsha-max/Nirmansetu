'use client';

import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { CatalogItem } from './ProductCatalog';
import { formatPaiseToRupees, calculateOrderTotals } from '@/lib/money';
import { AYODHYA_REGIONAL_HUBS } from '@/config/brand';

export interface CartLine {
  item: CatalogItem;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lines: CartLine[];
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  selectedPincode: string;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  lines,
  onUpdateQuantity,
  onRemoveItem,
  selectedPincode,
  onClearCart,
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [unloadingInstructions, setUnloadingInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod' | 'neft_rtgs'>('cod');
  const [isExpress, setIsExpress] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderReceipt, setOrderReceipt] = useState<{
    orderNumber: string;
    totalPaise: number;
    deliveryOtp: string;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  // Pure integer paise financial calculation
  const calculationItems = lines.map((l) => ({
    unitPricePaise: l.item.sellingPricePaise,
    quantity: l.quantity,
    gstRatePct: 18.0,
  }));

  const hub = AYODHYA_REGIONAL_HUBS.find((h) => h.pincode === selectedPincode) || AYODHYA_REGIONAL_HUBS[0];
  const baseDeliveryFeePaise = 19900; // ₹199
  const expressFeePaise = isExpress && hub.isExpress ? 39900 : baseDeliveryFeePaise;

  const totals = calculateOrderTotals({
    items: calculationItems,
    deliveryFeePaise: calculationItems.length > 0 ? expressFeePaise : 0,
    discountPaise: 0,
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        cartId: 'c0000000-0000-0000-0000-000000000001', // Local session cart placeholder
        pincode: selectedPincode,
        paymentMethod,
        isExpressDelivery: isExpress,
        inlineAddress: {
          addressType: 'site',
          siteOrPersonName: recipientName || 'Ayodhya Project Site',
          contactPhone: recipientPhone || '9450000000',
          streetAddress: streetAddress || 'Near Naya Ghat, Ayodhya Dham',
          landmark: landmark || 'Opposite Mandir road',
          pincode: selectedPincode,
          city: 'Ayodhya',
          state: 'Uttar Pradesh',
          unloadingInstructions: unloadingInstructions || 'Require unloading near site entrance',
          hasTruckAccess: true,
          isDefault: false,
        },
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setOrderReceipt({
        orderNumber: data.orderNumber || data.summary?.orderNumber,
        totalPaise: data.totalPaise || totals.totalPaise,
        deliveryOtp: data.deliveryOtp || data.summary?.deliveryOtp || '4192',
        message: data.message || 'Order successfully scheduled for local partner dispatch.',
      });
      onClearCart();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network failure';
      alert(`Checkout error: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-base text-slate-900">Site Materials Cart</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {lines.length} {lines.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 font-bold transition"
          >
            ✕
          </button>
        </div>

        {orderReceipt ? (
          /* Order Confirmation View */
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <h4 className="text-2xl font-black text-slate-950">Order Placed!</h4>
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 w-full text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Order Reference:</span>
                <span className="font-mono font-bold text-slate-900">{orderReceipt.orderNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Delivery PIN:</span>
                <span className="font-bold text-slate-900">{selectedPincode}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Payable:</span>
                <span className="font-bold text-emerald-700">{formatPaiseToRupees(orderReceipt.totalPaise)}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Site Dropoff OTP:</span>
                <span className="font-mono font-black text-sm text-amber-700 tracking-wider">
                  {orderReceipt.deliveryOtp}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Your materials have been assigned to the nearest Ayodhya stockist. Share the Site Dropoff OTP with the driver upon physical inspection at your site.
            </p>

            <button
              onClick={() => {
                setOrderReceipt(null);
                onClose();
              }}
              className="w-full py-3 bg-slate-950 text-amber-400 font-bold rounded-xl text-sm"
            >
              Back to Catalog
            </button>
          </div>
        ) : (
          /* Standard Cart List & Checkout Form */
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {lines.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-500">Your site cart is empty</p>
                  <p className="text-xs text-slate-400">Add cement, steel or bricks from the catalog to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {lines.map((line) => {
                    const lineTotalPaise = line.item.sellingPricePaise * line.quantity;
                    return (
                      <div key={line.item.id} className="py-3 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {line.item.title}
                          </h4>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {formatPaiseToRupees(line.item.sellingPricePaise)} per {line.item.unit}
                          </div>
                          
                          {/* Stepper */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                              <button
                                onClick={() => onUpdateQuantity(line.item.id, line.quantity - 1)}
                                className="w-5 h-5 rounded bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 text-xs shadow-xs"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-bold text-xs text-slate-900">
                                {line.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(line.item.id, line.quantity + 1)}
                                className="w-5 h-5 rounded bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 text-xs shadow-xs"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => onRemoveItem(line.item.id)}
                              className="text-slate-400 hover:text-red-600 p-1 transition"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-bold text-xs sm:text-sm text-slate-900">
                          {formatPaiseToRupees(lineTotalPaise)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Delivery Details Form */}
              {lines.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Site Delivery Details ({selectedPincode})</span>
                  </h4>

                  <div>
                    <input
                      type="text"
                      placeholder="Receiver / Site Engineer Name *"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <input
                      type="tel"
                      placeholder="Site Mobile Number (10 Digits) *"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Plot No / Street Address / Site Landmark *"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Unloading instructions (e.g. narrow lane, tempo only)"
                      value={unloadingInstructions}
                      onChange={(e) => setUnloadingInstructions(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Payment Method Selector */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Payment Terms
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                          paymentMethod === 'cod'
                            ? 'border-amber-500 bg-amber-50/50 text-slate-900 ring-1 ring-amber-500'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold">Pay on Site (COD)</div>
                        <div className="text-[10px] text-slate-500">Cash / UPI on dropoff</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('razorpay')}
                        className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                          paymentMethod === 'razorpay'
                            ? 'border-amber-500 bg-amber-50/50 text-slate-900 ring-1 ring-amber-500'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold">Online Prepaid</div>
                        <div className="text-[10px] text-slate-500">UPI / Cards / Netbanking</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer with Financial Summary */}
            {lines.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Materials Subtotal</span>
                    <span className="font-semibold text-slate-900">{formatPaiseToRupees(totals.subtotalPaise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (Included in calculation)</span>
                    <span className="font-semibold text-slate-900">{formatPaiseToRupees(totals.taxPaise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Site Transport & Logistics</span>
                    <span className="font-semibold text-slate-900">{formatPaiseToRupees(totals.deliveryFeePaise)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t border-slate-200">
                    <span>Total Amount</span>
                    <span className="text-emerald-700">{formatPaiseToRupees(totals.totalPaise)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-400 text-amber-400 font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Site Order...</span>
                    </>
                  ) : (
                    <span>Confirm Order ({formatPaiseToRupees(totals.totalPaise)})</span>
                  )}
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
