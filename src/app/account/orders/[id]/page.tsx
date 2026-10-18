'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  RotateCcw,
  Loader2,
  AlertCircle,
  XCircle,
  FileText,
  Truck,
  Building,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { formatPaiseToRupees } from '@/lib/money';
import { StoredOrderRecord } from '@/lib/orders/service';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = params.id as string;

  const [order, setOrder] = useState<StoredOrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Return modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('Damaged or chipped materials');
  const [returnNotes, setReturnNotes] = useState('');
  const [isReturning, setIsReturning] = useState(false);

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}?userId=${encodeURIComponent(user?.id || '')}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || 'Failed to retrieve order');
        }
      } catch {
        setError('Network error fetching order');
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      loadOrder();
    }
  }, [orderId, user?.id]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) return;
    setIsCancelling(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          reason: cancelReason.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setShowCancelModal(false);
        setActionMessage('Order successfully cancelled.');
      } else {
        setActionMessage(data.error || 'Failed to cancel order');
      }
    } catch {
      setActionMessage('Failed to submit cancellation request');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRequestReturn = async () => {
    setIsReturning(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          returnReason,
          notes: returnNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setShowReturnModal(false);
        setActionMessage('Return request submitted for site inspection.');
      } else {
        setActionMessage(data.error || 'Failed to submit return request');
      }
    } catch {
      setActionMessage('Return request failed');
    } finally {
      setIsReturning(false);
    }
  };

  const isCancellable = order && ['draft', 'submitted', 'confirmed'].includes(order.status);
  const isReturnable = order && order.status === 'delivered';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/account/orders" className="hover:text-slate-900 transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Orders</span>
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-900">{order?.order_number || 'Order Details'}</span>
          </div>

          {actionMessage && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading order details...</p>
            </div>
          ) : error || !order ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900 mb-1">Order Not Found</h2>
              <p className="text-xs text-slate-500 mb-6">{error || 'Unable to load order details.'}</p>
              <Link
                href="/account/orders"
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
              >
                Return to Orders
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-400">Order Number</span>
                    <h1 className="text-xl font-mono font-black text-slate-900">{order.order_number}</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Placed on {new Date(order.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Payment: {order.payment_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Site Delivery OTP Banner */}
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-1.5 text-orange-900 font-bold text-sm">
                      <ShieldCheck className="w-4 h-4 text-orange-600" />
                      <span>Site Drop-off Inspection Protocol</span>
                    </div>
                    <p className="text-xs text-orange-700 mt-0.5">
                      Verify material physical condition upon truck arrival. Share OTP only after satisfactory inspection.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-orange-200 px-4 py-2 text-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Site OTP</span>
                    <span className="text-2xl font-mono font-black text-orange-600 tracking-wider">
                      {order.delivery_otp_plain || '****'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Materials Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-2 text-orange-600" />
                  Purchased Materials Snapshot
                </h2>

                <div className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{item.product_title_snapshot}</h3>
                        <p className="text-slate-500 mt-0.5">
                          {item.variant_title_snapshot} • SKU: {item.sku_snapshot} • HSN: {item.hsn_code_snapshot || '2523'}
                        </p>
                        <p className="text-slate-600 mt-1">
                          {item.quantity} {item.unit_snapshot} @ {formatPaiseToRupees(item.unit_price_paise)} / {item.unit_snapshot} (GST {item.gst_rate_pct}%)
                        </p>
                      </div>

                      <div className="text-right sm:text-right">
                        <span className="font-bold text-sm text-slate-900 block">
                          {formatPaiseToRupees(item.total_paise)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Tax: {formatPaiseToRupees(item.tax_paise)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">{formatPaiseToRupees(order.subtotal_paise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST Tax</span>
                    <span className="font-semibold text-slate-900">{formatPaiseToRupees(order.tax_paise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Direct Site Delivery</span>
                    <span className="font-semibold text-slate-900">{formatPaiseToRupees(order.delivery_fee_paise)}</span>
                  </div>
                  {order.discount_paise > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Promotional Discount ({order.coupon_code || 'Promo'})</span>
                      <span>-{formatPaiseToRupees(order.discount_paise)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-lg font-black text-orange-600">
                      {formatPaiseToRupees(order.total_paise)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Site Details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-orange-600" />
                  Site Delivery Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Receiver / Site Incharge</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {order.delivery_address_snapshot?.siteOrPersonName || order.delivery_address_snapshot?.customerDetails?.name || 'Site Incharge'}
                    </span>
                    <p className="text-slate-600 mt-1">
                      Phone: {order.delivery_address_snapshot?.contactPhone || order.delivery_address_snapshot?.customerDetails?.phone}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Location Coordinates / Address</span>
                    <p className="font-semibold text-slate-900">
                      {order.delivery_address_snapshot?.streetAddress}
                    </p>
                    <p className="text-slate-600">
                      {order.delivery_address_snapshot?.landmark && `Near ${order.delivery_address_snapshot.landmark}, `}
                      Ayodhya, UP - {order.pincode}
                    </p>
                    {order.delivery_address_snapshot?.unloadingInstructions && (
                      <p className="text-slate-500 italic mt-1">
                        Instructions: {order.delivery_address_snapshot.unloadingInstructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-orange-600" />
                  Order Audit Trail & Fulfillment Timeline
                </h2>

                <div className="space-y-4">
                  {order.status_history.map((hist, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                            {hist.new_status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(hist.created_at).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {hist.notes && <p className="text-slate-600 mt-0.5">{hist.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {isCancellable && (
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      className="px-4 py-2 border border-red-300 text-red-600 font-bold text-xs rounded-xl hover:bg-red-50 transition"
                    >
                      Cancel Order
                    </button>
                  )}

                  {isReturnable && (
                    <button
                      type="button"
                      onClick={() => setShowReturnModal(true)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
                    >
                      Report Issue / Request Return
                    </button>
                  )}
                </div>

                <Link
                  href="/account/orders"
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
                >
                  Back to All Orders
                </Link>
              </div>
            </div>
          )}

          {/* Cancellation Modal */}
          {showCancelModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <h3 className="font-bold text-base text-slate-900 mb-2">Cancel Site Order</h3>
                <p className="text-xs text-slate-600 mb-4">
                  Orders can only be cancelled before materials are loaded onto supplier trucks. Please state the reason for cancellation:
                </p>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Jobsite schedule postponed or concrete pouring delayed"
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={isCancelling || !cancelReason.trim()}
                    className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition"
                  >
                    {isCancelling ? 'Processing...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Return Modal */}
          {showReturnModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <h3 className="font-bold text-base text-slate-900 mb-2">Request Material Return</h3>
                <p className="text-xs text-slate-600 mb-4">
                  Building materials can be inspected and returned within 48 hours of site drop-off under our Ayodhya quality guarantee:
                </p>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Return</label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Damaged or chipped materials">Damaged, chipped or broken materials</option>
                      <option value="Moisture in cement bags">Lumps or moisture damage in cement bags</option>
                      <option value="Incorrect specification delivered">Incorrect brand, grade or size delivered</option>
                      <option value="Excess quantity ordered">Excess site quantity (unopened packs)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
                    <textarea
                      rows={2}
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      placeholder="Describe the issue observed at the site..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestReturn}
                    disabled={isReturning}
                    className="px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50 transition"
                  >
                    {isReturning ? 'Submitting...' : 'Submit Return Request'}
                  </button>
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
