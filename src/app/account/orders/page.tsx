'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingBag,
  Building,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  FileSpreadsheet,
  RotateCcw,
  Loader2,
  AlertCircle,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { formatPaiseToRupees } from '@/lib/money';
import { StoredOrderRecord } from '@/lib/orders/service';
import { getBrowserAuthHeaders } from '@/lib/auth/client-auth';

export default function OrdersHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<StoredOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const authHeaders = await getBrowserAuthHeaders();
        const res = await fetch(`/api/orders?userId=${encodeURIComponent(user.id)}`, {
          headers: authHeaders,
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      } catch {
        // Handled
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [user?.id]);

  const handleReorder = async (orderId: string) => {
    setReorderingId(orderId);
    setMessage(null);
    try {
      const authHeaders = await getBrowserAuthHeaders();
      const res = await fetch(`/api/orders/${orderId}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Materials from order re-added to cart! Redirecting to checkout...`);
        setTimeout(() => {
          router.push('/cart');
        }, 1200);
      } else {
        setMessage(data.error || 'Failed to reorder items');
      }
    } catch {
      setMessage('Failed to reorder');
    } finally {
      setReorderingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'confirmed':
      case 'out_for_delivery':
      case 'materials_packed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submitted':
      case 'draft':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/account" className="hover:text-slate-900 transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Account</span>
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-900">Orders & Dispatches</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-black text-slate-950">Dispatches & Jobsite Orders</h1>
              <p className="text-xs text-slate-500 mt-1">
                Real-time tracking of partner stockist dispatches and verified delivery OTPs across Ayodhya Dham.
              </p>
            </div>
            <Link
              href="/cart"
              className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
              Open Site Cart
            </Link>
          </div>

          {message && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading order records from database...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No Orders Found</h3>
              <p className="text-xs text-slate-500 mb-6">
                You have not placed any site orders yet. Add cement, steel, or tiles to begin.
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-5 py-2.5 bg-orange-600 text-white font-bold text-xs rounded-xl hover:bg-orange-700 transition"
              >
                Browse Materials Catalog
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/account/orders/${order.id}`}
                            className="font-mono font-bold text-sm text-slate-900 hover:text-orange-600 transition flex items-center"
                          >
                            {order.order_number}
                            <ChevronRight className="w-3.5 h-3.5 ml-1 text-slate-400" />
                          </Link>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Placed {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Total</span>
                        <span className="text-base font-extrabold text-slate-900">
                          {formatPaiseToRupees(order.total_paise)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Materials Preview */}
                  <div className="py-3 divide-y divide-slate-100">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="font-semibold text-slate-800">
                            {item.product_title_snapshot}
                          </span>
                          <span className="text-slate-400">
                            ({item.quantity} {item.unit_snapshot})
                          </span>
                        </div>
                        <span className="font-mono text-slate-700">
                          {formatPaiseToRupees(item.total_paise)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>PIN {order.pincode} • Dropoff OTP: </span>
                      <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        {order.delivery_otp_plain || '****'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReorder(order.id)}
                        disabled={reorderingId === order.id}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                      >
                        {reorderingId === order.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        )}
                        Reorder Materials
                      </button>

                      <Link
                        href={`/account/orders/${order.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
                      >
                        View Full Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
