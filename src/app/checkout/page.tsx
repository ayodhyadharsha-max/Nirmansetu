'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
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
  CreditCard,
  Banknote,
  RotateCcw,
  Check,
  Package,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPaiseToRupees, calculateOrderTotals } from '@/lib/money';
import { AYODHYA_REGIONAL_HUBS } from '@/config/brand';
import { CustomerAddress } from '@/types/database';
import { getBrowserAuthHeaders } from '@/lib/auth/client-auth';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cartLines,
    clearCart,
    selectedPincode,
    setSelectedPincode,
    sessionToken,
    appliedCoupon,
    cartTotalPaise,
  } = useCart();
  const { user } = useAuth();

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('custom');

  // Customer & Delivery state
  const [recipientName, setRecipientName] = useState(user?.fullName || '');
  const [recipientPhone, setRecipientPhone] = useState(user?.phone || '');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [gstin, setGstin] = useState(user?.gstin || '');
  const [unloadingInstructions, setUnloadingInstructions] = useState('');
  const [hasTruckAccess, setHasTruckAccess] = useState(true);
  const [addressType, setAddressType] = useState<'site' | 'residential' | 'commercial'>('site');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay' | 'neft_rtgs'>('cod');
  const [isExpress, setIsExpress] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [orderReceipt, setOrderReceipt] = useState<{
    orderNumber: string;
    totalPaise: number;
    deliveryOtp: string | null;
    deliveryOtpNotice?: string;
    paymentStatus: string;
    message: string;
  } | null>(null);

  // Sync user defaults
  useEffect(() => {
    if (user) {
      if (!recipientName && user.fullName) setRecipientName(user.fullName);
      if (!recipientPhone && user.phone) setRecipientPhone(user.phone);
      if (!gstin && user.gstin) setGstin(user.gstin);
    }
  }, [user, recipientName, recipientPhone, gstin]);

  // Load saved addresses when user is authenticated
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/account/addresses?userId=${encodeURIComponent(user.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
            setSavedAddresses(data.addresses);
            const defaultAddr = data.addresses.find((a: CustomerAddress) => a.is_default) || data.addresses[0];
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id);
              applySavedAddress(defaultAddr);
            }
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  const applySavedAddress = (addr: CustomerAddress) => {
    setRecipientName(addr.site_or_person_name);
    setRecipientPhone(addr.contact_phone);
    setAlternatePhone(addr.alternate_phone || '');
    setStreetAddress(addr.street_address);
    setLandmark(addr.landmark || '');
    setSelectedPincode(addr.pincode);
    setAddressType(addr.address_type);
    setUnloadingInstructions(addr.unloading_instructions || '');
    setHasTruckAccess(addr.has_truck_access);
  };

  const hub =
    AYODHYA_REGIONAL_HUBS.find((h) => h.pincode === selectedPincode) || AYODHYA_REGIONAL_HUBS[0];

  // Pure integer paise calculations
  const calculationItems = cartLines.map((l) => ({
    unitPricePaise: l.item.selling_price_paise,
    quantity: l.quantity,
    gstRatePct: l.item.tax_rate_pct ?? 18.0,
  }));

  const baseDeliveryFeePaise = cartTotalPaise >= 1500000 ? 0 : 19900; // Free delivery threshold ₹15,000
  const expressFeePaise = isExpress && hub.isExpress ? 39900 : baseDeliveryFeePaise;
  const deliveryFee = calculationItems.length > 0 ? expressFeePaise : 0;
  const discountPaise = appliedCoupon?.discountPaise || 0;

  const totals = calculateOrderTotals({
    items: calculationItems,
    deliveryFeePaise: deliveryFee,
    discountPaise,
  });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cartLines.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    if (!recipientName.trim() || !recipientPhone.trim() || !streetAddress.trim()) {
      setErrorMessage('Please fill in receiver name, 10-digit mobile number, and site address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const idempotencyKey = `idem_${sessionToken || 'guest'}_${Date.now()}`;

      const payload = {
        idempotencyKey,
        cartId: sessionToken || 'guest-cart',
        items: cartLines.map((l) => ({
          variantId: l.item.variant_id,
          quantity: l.quantity,
        })),
        customerDetails: {
          name: recipientName.trim(),
          phone: recipientPhone.trim(),
          email: user?.email || undefined,
          companyName: user?.companyName || undefined,
          gstin: gstin.trim() || undefined,
        },
        deliveryAddress: {
          addressType,
          siteOrPersonName: recipientName.trim(),
          contactPhone: recipientPhone.trim(),
          alternatePhone: alternatePhone.trim() || undefined,
          streetAddress: streetAddress.trim(),
          landmark: landmark.trim() || 'Ayodhya Site',
          pincode: selectedPincode,
          city: 'Ayodhya',
          state: 'Uttar Pradesh',
          unloadingInstructions: unloadingInstructions.trim() || 'Standard site unloading',
          hasTruckAccess,
        },
        paymentMethod,
        isExpressDelivery: isExpress,
        customerNotes: gstin.trim() ? `Tax Invoice GSTIN: ${gstin.trim()}` : undefined,
      };

      const authHeaders = await getBrowserAuthHeaders();
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          ...payload,
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order.');
      }

      clearCart();
      setOrderReceipt({
        orderNumber: data.orderNumber,
        totalPaise: data.totalPaise,
        deliveryOtp: data.deliveryOtp || null,
        deliveryOtpNotice: data.deliveryOtpNotice,
        paymentStatus: data.paymentStatus,
        message: paymentMethod === 'cod'
          ? 'Order confirmed! Pay on delivery to verified driver upon Drop-off OTP inspection.'
          : 'Order placed successfully! Invoicing and fulfillment in progress.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating order';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <span>/</span>
            <Link href="/cart" className="hover:text-slate-900">Cart</Link>
            <span>/</span>
            <span className="font-bold text-slate-900">Secure Checkout</span>
          </div>

          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Cart</span>
          </Link>
        </div>

        {/* ORDER SUCCESS RECEIPT VIEW */}
        {orderReceipt ? (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-emerald-200 p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Order Placed Successfully
              </span>
              <h1 className="text-2xl font-black text-slate-950 mt-2">
                Order #{orderReceipt.orderNumber}
              </h1>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {orderReceipt.message}
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Total (GST Included):</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatPaiseToRupees(orderReceipt.totalPaise)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-amber-700 uppercase">
                  {orderReceipt.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Hub:</span>
                <span className="font-bold text-slate-900">{hub.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Delivery:</span>
                <span className="font-bold text-emerald-700">2–4 Hours (Same-Day Dispatch)</span>
              </div>
            </div>

            {orderReceipt.deliveryOtp ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Drop-Off Inspection PIN
                </span>
                <p className="text-2xl font-black font-mono tracking-widest text-emerald-950">
                  {orderReceipt.deliveryOtp}
                </p>
                <p className="text-[10px] text-emerald-700">Provide to driver only after inspecting materials on site.</p>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 text-left space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Secure Drop-Off Inspection PIN
                </p>
                <p className="text-slate-600">
                  {orderReceipt.deliveryOtpNotice || 'Your 4-digit Drop-off OTP will be dispatched via SMS directly to your contact number once materials are loaded onto the delivery truck. Provide it to the driver only after physical inspection.'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/account/orders"
                className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition text-center shadow-md"
              >
                View in My Orders
              </Link>
              <Link
                href="/"
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : cartLines.length === 0 ? (
          /* EMPTY CART VIEW */
          <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-950">Your Cart is Empty</h2>
              <p className="text-xs text-slate-500">
                Add building materials to your cart before proceeding to checkout.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-md"
            >
              Browse Construction Catalog
            </Link>
          </div>
        ) : (
          /* CHECKOUT FORM VIEW */
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 7 Columns: Delivery & Logistics Information */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Regional Hub / Pincode */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    <h2 className="text-sm font-bold text-slate-900">1. Delivery Location &amp; Hub</h2>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Serviceable: {hub.name}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ayodhya Regional PIN Code
                  </label>
                  <select
                    value={selectedPincode}
                    onChange={(e) => setSelectedPincode(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-amber-500"
                  >
                    {AYODHYA_REGIONAL_HUBS.map((h) => (
                      <option key={h.pincode} value={h.pincode}>
                        {h.pincode} — {h.name} ({h.slaMinutes} Mins)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Saved addresses selector */}
                {savedAddresses.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Choose from Saved Site Addresses
                    </label>
                    <select
                      value={selectedAddressId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedAddressId(id);
                        const match = savedAddresses.find((a) => a.id === id);
                        if (match) applySavedAddress(match);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:outline-none"
                    >
                      <option value="custom">-- Enter New Site Address --</option>
                      {savedAddresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.site_or_person_name} — {a.street_address} ({a.pincode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Step 2: Site Contact & Street Address */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Building className="w-5 h-5 text-amber-600" />
                  <h2 className="text-sm font-bold text-slate-900">2. Construction Site &amp; Receiver Details</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Receiver / Site Supervisor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Ramesh Verma"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Site Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="9876543210"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Complete Street Address / Plot Number <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Plot No., Colony, Near Landmark, Ward / Village"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Landmark / Nearby Building
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Ram Path Bridge"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      GSTIN (Optional, for Tax Credit)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="09AAAAA0000A1Z5"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 uppercase"
                    />
                  </div>
                </div>

                {/* Truck Access Checkbox */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="truckAccess"
                    checked={hasTruckAccess}
                    onChange={(e) => setHasTruckAccess(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="truckAccess" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Site has commercial road access for delivery trucks (Mini Truck / Tipper)
                  </label>
                </div>
              </div>

              {/* Step 3: Payment Method */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  <h2 className="text-sm font-bold text-slate-900">3. Select Payment Method</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      paymentMethod === 'cod'
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-400/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      {paymentMethod === 'cod' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="mt-2">
                      <span className="font-bold text-xs text-slate-900 block">Pay on Delivery</span>
                      <span className="text-[10px] text-slate-500">Cash or UPI at site inspection</span>
                    </div>
                  </label>

                  <label
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 cursor-not-allowed opacity-75 flex flex-col justify-between"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      disabled
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <CreditCard className="w-5 h-5 text-slate-400" />
                      <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded">Setup in Progress</span>
                    </div>
                    <div className="mt-2">
                      <span className="font-bold text-xs text-slate-700 block">Online Payment</span>
                      <span className="text-[10px] text-slate-500">Gateway KYC underway — Select Pay on Delivery</span>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      paymentMethod === 'neft_rtgs'
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-400/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="neft_rtgs"
                      checked={paymentMethod === 'neft_rtgs'}
                      onChange={() => setPaymentMethod('neft_rtgs')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <Building className="w-5 h-5 text-slate-600" />
                      {paymentMethod === 'neft_rtgs' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="mt-2">
                      <span className="font-bold text-xs text-slate-900 block">NEFT / RTGS</span>
                      <span className="text-[10px] text-slate-500">Wholesale bank transfer</span>
                    </div>
                  </label>
                </div>
              </div>

            </div>

            {/* Right 5 Columns: Order Summary Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 sticky top-24">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">Order Summary ({cartLines.length} Items)</h2>
                  <Link href="/cart" className="text-xs font-bold text-amber-700 hover:underline">
                    Edit Cart
                  </Link>
                </div>

                {/* Items preview list */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2">
                  {cartLines.map((line) => (
                    <div key={line.item.variant_id || line.item.product_id} className="pt-2 flex items-center justify-between text-xs">
                      <div className="flex-1 pr-3">
                        <p className="font-bold text-slate-800 line-clamp-1">{line.item.product_title}</p>
                        <p className="text-[11px] text-slate-400">
                          {line.quantity} × {line.item.pack_size || line.item.unit_of_measure}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900">
                        {formatPaiseToRupees(line.item.selling_price_paise * line.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Breakup in Integer Paise */}
                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Taxable Value:</span>
                    <span>{formatPaiseToRupees(totals.subtotalPaise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Statutory GST (CGST + SGST):</span>
                    <span>{formatPaiseToRupees(totals.taxPaise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Freight &amp; Unloading:</span>
                    <span>
                      {totals.deliveryFeePaise === 0 ? (
                        <strong className="text-emerald-700 uppercase font-black">Free Delivery</strong>
                      ) : (
                        formatPaiseToRupees(totals.deliveryFeePaise)
                      )}
                    </span>
                  </div>
                  {totals.discountPaise > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount:</span>
                      <span>-{formatPaiseToRupees(totals.discountPaise)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-black text-sm text-slate-900">Total Payable:</span>
                    <div className="text-right">
                      <span className="font-black text-xl text-slate-950">
                        {formatPaiseToRupees(totals.totalPaise)}
                      </span>
                      <p className="text-[10px] text-slate-400">Inclusive of all statutory taxes</p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || cartLines.length === 0}
                  className="w-full py-3.5 bg-[#257f2e] hover:bg-[#1f6d27] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Site Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Place Construction Order</span>
                      <span>•</span>
                      <span>{formatPaiseToRupees(totals.totalPaise)}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Suppliers · Strict Integer Paise · Drop-off OTP</span>
                </div>
              </div>
            </div>

          </form>
        )}

      </main>

      <Footer />
    </div>
  );
}
