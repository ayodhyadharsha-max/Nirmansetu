'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  FileText,
  Clock,
  Sparkles,
  Building,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPaiseToRupees, calculateOrderTotals } from '@/lib/money';
import { AYODHYA_REGIONAL_HUBS, BRAND_CONFIG } from '@/config/brand';

export default function CartPage() {
  const { cartLines, updateQuantity, removeItem, clearCart, selectedPincode, setSelectedPincode } =
    useCart();
  const { user } = useAuth();

  // Form state
  const [recipientName, setRecipientName] = useState(user?.fullName || '');
  const [recipientPhone, setRecipientPhone] = useState(user?.phone || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [gstin, setGstin] = useState(user?.gstin || '');
  const [unloadingInstructions, setUnloadingInstructions] = useState('');
  const [hasTruckAccess, setHasTruckAccess] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay' | 'neft_rtgs'>('cod');
  const [isExpress, setIsExpress] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderReceipt, setOrderReceipt] = useState<{
    orderNumber: string;
    totalPaise: number;
    deliveryOtp: string;
    message: string;
  } | null>(null);

  const hub =
    AYODHYA_REGIONAL_HUBS.find((h) => h.pincode === selectedPincode) || AYODHYA_REGIONAL_HUBS[0];

  // Pure integer paise calculations
  const calculationItems = cartLines.map((l) => ({
    unitPricePaise: l.item.selling_price_paise,
    quantity: l.quantity,
    gstRatePct: l.item.tax_rate_pct ?? 18.0,
  }));

  const baseDeliveryFeePaise = 19900; // ₹199
  const expressFeePaise = isExpress && hub.isExpress ? 39900 : baseDeliveryFeePaise;
  const deliveryFee = calculationItems.length > 0 ? expressFeePaise : 0;

  const totals = calculateOrderTotals({
    items: calculationItems,
    deliveryFeePaise: deliveryFee,
    discountPaise: 0,
  });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cartLines.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    if (!recipientName.trim() || !recipientPhone.trim() || !streetAddress.trim()) {
      setErrorMessage('Please fill in the receiver name, site mobile number, and address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        cartId: 'c0000000-0000-0000-0000-000000000001',
        pincode: selectedPincode,
        paymentMethod,
        isExpressDelivery: isExpress,
        inlineAddress: {
          addressType: 'site',
          siteOrPersonName: recipientName.trim(),
          contactPhone: recipientPhone.trim(),
          streetAddress: streetAddress.trim(),
          landmark: landmark.trim() || 'Near landmark',
          pincode: selectedPincode,
          city: 'Ayodhya',
          state: 'Uttar Pradesh',
          unloadingInstructions: unloadingInstructions.trim() || 'Standard site unloading',
          hasTruckAccess,
          isDefault: false,
        },
        customerNotes: gstin.trim() ? `GSTIN for Tax Invoice: ${gstin.trim()}` : undefined,
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process order');
      }

      setOrderReceipt({
        orderNumber: data.orderNumber || data.summary?.orderNumber,
        totalPaise: data.totalPaise || totals.totalPaise,
        deliveryOtp: data.deliveryOtp || data.summary?.deliveryOtp || '4192',
        message: data.message || 'Order successfully routed to nearest Ayodhya stockist.',
      });
      clearCart();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error placing order';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Header */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
            <Link href="/" className="hover:text-slate-900 transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Marketplace</span>
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-900">Site Materials Schedule & Cart</span>
          </div>

          {orderReceipt ? (
            /* Order Placed Success Confirmation */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 max-w-2xl mx-auto text-center shadow-xl space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Ayodhya Partner Stockist Dispatched
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-3">
                  Site Order Confirmed!
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
                  Your material schedule has been allocated to our nearest stockist in the {hub.name}.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-left space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Order Reference:</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{orderReceipt.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Destination PIN:</span>
                  <span className="font-bold text-slate-900">{selectedPincode} ({hub.name})</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Payment Terms:</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {paymentMethod === 'cod' ? 'Cash/UPI on Site Dropoff' : 'Prepaid Online'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Total Payable:</span>
                  <span className="font-black text-base text-emerald-700">
                    {formatPaiseToRupees(orderReceipt.totalPaise)}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                  <span className="text-xs text-amber-900 font-bold">Site Drop-off OTP:</span>
                  <span className="font-mono font-black text-lg text-amber-950 tracking-widest">
                    {orderReceipt.deliveryOtp}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 text-left text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Physical Inspection Protocol:</span>
                </div>
                <p>
                  1. Check cement bag manufacturing dates and tamper seals upon truck arrival.
                </p>
                <p>
                  2. Verify steel rebar grade (Fe 550D) embossing and piece count.
                </p>
                <p>
                  3. Hand over the 4-digit Drop-off OTP to the driver only after material acceptance.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/"
                  className="flex-1 py-3 bg-slate-950 text-amber-400 font-extrabold text-xs sm:text-sm rounded-xl hover:bg-slate-800 transition text-center shadow-md"
                >
                  Return to Home Catalog
                </Link>
                <Link
                  href="/account"
                  className="flex-1 py-3 bg-white border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-xl hover:bg-slate-50 transition text-center"
                >
                  View Order Status
                </Link>
              </div>
            </div>
          ) : cartLines.length === 0 ? (
            /* Empty Cart View */
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Your site cart is empty</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Explore cement, TMT steel, pipes, tiles, and electrical supplies from certified Ayodhya stockists.
              </p>
              <div className="pt-2">
                <Link
                  href="/search"
                  className="inline-block px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition shadow-sm"
                >
                  Explore Building Materials
                </Link>
              </div>
            </div>
          ) : (
            /* Active Cart & Checkout Form */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Cart Items & Site Address (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Cart Items List */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">Materials Schedule</h2>
                      <span className="text-xs text-slate-500">
                        {cartLines.length} {cartLines.length === 1 ? 'material type' : 'material types'} selected
                      </span>
                    </div>
                    <button
                      onClick={clearCart}
                      className="text-xs font-bold text-slate-400 hover:text-red-600 transition"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {cartLines.map((line) => {
                      const lineTotal = line.item.selling_price_paise * line.quantity;
                      return (
                        <div key={line.item.variant_id} className="py-4 flex items-start gap-4">
                          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            <img
                              src={line.item.images?.[0] || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=300&q=80'}
                              alt={line.item.product_title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/products/${line.item.product_slug}`}
                              className="text-xs sm:text-sm font-bold text-slate-900 hover:text-amber-700 block truncate"
                            >
                              {line.item.product_title}
                            </Link>

                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {line.item.brand_name || 'Generic'} • {line.item.pack_size || `Standard ${line.item.unit_of_measure}`}
                            </div>

                            <div className="flex items-center gap-3 mt-3">
                              {/* Quantity Stepper */}
                              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(line.item.variant_id, line.quantity - 1)}
                                  className="w-6 h-6 rounded bg-white flex items-center justify-center text-slate-700 hover:text-slate-950 text-xs shadow-2xs"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-10 text-center font-bold text-xs text-slate-900">
                                  {line.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(line.item.variant_id, line.quantity + 1)}
                                  className="w-6 h-6 rounded bg-white flex items-center justify-center text-slate-700 hover:text-slate-950 text-xs shadow-2xs"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <span className="text-[11px] font-semibold text-slate-500">
                                {line.item.unit_of_measure}
                              </span>

                              <button
                                type="button"
                                onClick={() => removeItem(line.item.variant_id)}
                                className="text-slate-400 hover:text-red-600 p-1 text-xs transition"
                                title="Remove line item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-black text-xs sm:text-sm text-slate-950">
                              {formatPaiseToRupees(lineTotal)}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              @{formatPaiseToRupees(line.item.selling_price_paise)} / {line.item.unit_of_measure}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Site Delivery Details Form */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-500" />
                      <h3 className="text-base font-black text-slate-950">Site Delivery Location</h3>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {hub.slaMinutes} Mins SLA (PIN {selectedPincode})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Receiver / Site In-Charge Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Chandra (Site Engr)"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Site Contact Phone (10 Digits) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9450012345"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Plot No / Street Address / Site Location *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Plot 42, Near Ramkot Naya Ghat Road, Ayodhya Dham"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nearest Landmark
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Opposite Primary Health Centre"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        GSTIN (Optional for Tax Invoice)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 09AAACS1429B1ZB"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Unloading & Truck Access Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Narrow lane, send small tempo instead of 6-wheeler truck"
                      value={unloadingInstructions}
                      onChange={(e) => setUnloadingInstructions(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Truck access checkbox */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="truckAccess"
                      checked={hasTruckAccess}
                      onChange={(e) => setHasTruckAccess(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <label htmlFor="truckAccess" className="text-xs text-slate-700 font-medium">
                      Site has standard commercial vehicle access (Tempo / 407 / 6-wheeler truck)
                    </label>
                  </div>
                </div>

              </div>

              {/* Right Column: Financial Summary & Payment Options (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Financial Summary Card */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-black text-slate-950 pb-3 border-b border-slate-100">
                    Order Cost Summary
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Materials Total</span>
                      <span className="font-bold text-slate-900">{formatPaiseToRupees(totals.subtotalPaise)}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>GST (18% - 28% Included)</span>
                      <span className="font-bold text-slate-900">{formatPaiseToRupees(totals.taxPaise)}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Site Logistics ({selectedPincode})</span>
                      <span className="font-bold text-slate-900">{formatPaiseToRupees(totals.deliveryFeePaise)}</span>
                    </div>

                    {isExpress && hub.isExpress && (
                      <div className="flex justify-between text-amber-700 font-semibold">
                        <span>Express Priority Surcharge</span>
                        <span>₹200.00</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                      <div>
                        <span className="text-sm font-black text-slate-950 block">Net Payable Amount</span>
                        <span className="text-[10px] text-slate-500">Includes all GST & site transport</span>
                      </div>
                      <span className="text-xl font-black text-emerald-700">
                        {formatPaiseToRupees(totals.totalPaise)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Terms Selector */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-800 mb-2">
                      Select Payment Terms
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-3 rounded-2xl border text-left transition ${
                          paymentMethod === 'cod'
                            ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-black text-slate-950">Pay on Site (COD)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">UPI / Cash on physical dropoff</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('razorpay')}
                        className={`p-3 rounded-2xl border text-left transition ${
                          paymentMethod === 'razorpay'
                            ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-black text-slate-950">Online Prepaid</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Instant UPI / Netbanking</div>
                      </button>
                    </div>
                  </div>

                  {/* Express Delivery Toggle */}
                  {hub.isExpress && (
                    <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-amber-950">60-Min Express Dispatch</div>
                          <div className="text-[10px] text-amber-800">Priority local loading for urgent pours</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isExpress}
                        onChange={(e) => setIsExpress(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-400 text-amber-400 font-black text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirming Dispatch with Stockist...</span>
                      </>
                    ) : (
                      <span>Schedule Delivery ({formatPaiseToRupees(totals.totalPaise)})</span>
                    )}
                  </button>

                  <div className="text-[11px] text-slate-500 text-center space-y-1">
                    <p className="flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Zero Risk: Release Site OTP only after driver unloading</span>
                    </p>
                  </div>
                </div>

                {/* Sourcing Transparency Note */}
                <div className="bg-slate-100 rounded-2xl p-4 text-xs text-slate-600 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-amber-600" />
                    <span>How Fulfillment Operates:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    NirmanSetu bridges you directly with authorized stockists in {hub.name}. Sourced directly from manufacturers with original test certificates.
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
