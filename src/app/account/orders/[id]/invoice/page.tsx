'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand';
import { formatPaiseToRupees } from '@/lib/money';
import { StoredOrderRecord } from '@/lib/orders/service';
import { useAuth } from '@/context/AuthContext';
import { getBrowserAuthHeaders } from '@/lib/auth/client-auth';

export default function OrderInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = params.id as string;

  const [order, setOrder] = useState<StoredOrderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const authHeaders = await getBrowserAuthHeaders();
        const res = await fetch(`/api/orders/${orderId}?userId=${encodeURIComponent(user?.id || '')}`, {
          headers: authHeaders,
        });
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        }
      } catch {
        // Handled
      } finally {
        setLoading(false);
      }
    }
    if (orderId) load();
  }, [orderId, user?.id]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading GST Tax Invoice...</div>;
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        <p>Order not found or invoice not accessible.</p>
        <button onClick={() => router.back()} className="mt-4 text-orange-600 font-bold hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const invoiceNumber = order.order_number.replace('NS-', 'INV-');
  const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:p-0 print:bg-white text-slate-900 font-sans">
      <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Order</span>
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 px-4 py-2 rounded-xl shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Printable Invoice Container */}
      <div className="max-w-3xl mx-auto bg-white border border-slate-300 rounded-2xl p-8 sm:p-10 shadow-lg print:border-none print:shadow-none print:p-4">
        
        {/* Header */}
        <div className="flex justify-between items-start pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-base">
                N
              </div>
              <span className="font-black text-xl text-slate-950 tracking-tight">{BRAND_CONFIG.name}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">{BRAND_CONFIG.legalEntity}</p>
            <p className="text-xs text-slate-500">Ayodhya Dham Hub, Uttar Pradesh - 224123</p>
            <p className="text-xs text-slate-500">GSTIN: 09AAACN9876C1Z8 · Support: {BRAND_CONFIG.supportPhone}</p>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-900 text-white">
              TAX INVOICE
            </span>
            <p className="text-xs font-mono font-bold text-slate-900 mt-2">Invoice No: {invoiceNumber}</p>
            <p className="text-xs text-slate-500">Date: {invoiceDate}</p>
            <p className="text-xs text-slate-500">Order Ref: {order.order_number}</p>
          </div>
        </div>

        {/* Bill To & Ship To */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Billed To (Customer)
            </span>
            <p className="font-bold text-slate-900 text-sm">
              {order.delivery_address_snapshot?.site_or_person_name || user?.fullName || 'Valued Builder'}
            </p>
            {user?.companyName && <p className="text-slate-600">{user.companyName}</p>}
            {user?.gstin && <p className="font-mono text-slate-700">GSTIN: {user.gstin}</p>}
            <p className="text-slate-500 mt-0.5">Contact: {order.delivery_address_snapshot?.contact_phone || user?.phone}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Delivery Site Location
            </span>
            <p className="text-slate-700 leading-relaxed">
              {order.delivery_address_snapshot?.street_address}
              {order.delivery_address_snapshot?.landmark && `, Near ${order.delivery_address_snapshot.landmark}`}
            </p>
            <p className="text-slate-700 font-semibold mt-0.5">Ayodhya, Uttar Pradesh - {order.pincode}</p>
            <p className="text-[11px] text-emerald-700 font-bold mt-1">Status: Verified Site Delivery</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-6 border-b border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                <th className="pb-2">#</th>
                <th className="pb-2">Material Description</th>
                <th className="pb-2">HSN</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Unit Rate</th>
                <th className="pb-2 text-right">GST %</th>
                <th className="pb-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <tr key={item.id} className="py-2.5">
                  <td className="py-2.5 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 font-semibold text-slate-900">
                    {item.product_title_snapshot}
                    <span className="block text-[11px] text-slate-400 font-normal">{item.variant_title_snapshot}</span>
                  </td>
                  <td className="py-2.5 font-mono text-slate-500">{item.hsn_code_snapshot || '2523'}</td>
                  <td className="py-2.5 text-right font-medium">{item.quantity} {item.unit_snapshot}</td>
                  <td className="py-2.5 text-right font-mono">{formatPaiseToRupees(item.unit_price_paise)}</td>
                  <td className="py-2.5 text-right font-medium">{item.gst_rate_pct}%</td>
                  <td className="py-2.5 text-right font-bold text-slate-900">{formatPaiseToRupees(item.total_paise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="py-6 flex justify-end">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal (Excl. Tax)</span>
              <span className="font-mono">{formatPaiseToRupees(order.subtotal_paise)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Central GST (CGST)</span>
              <span className="font-mono">{formatPaiseToRupees(Math.round(order.tax_paise / 2))}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>State GST (SGST - Uttar Pradesh)</span>
              <span className="font-mono">{formatPaiseToRupees(order.tax_paise - Math.round(order.tax_paise / 2))}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery &amp; Freight (Transit Included)</span>
              <span className="font-mono">{formatPaiseToRupees(order.delivery_fee_paise)}</span>
            </div>
            {order.discount_paise > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Promotional Discount</span>
                <span className="font-mono">-{formatPaiseToRupees(order.discount_paise)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-300 flex justify-between font-bold text-sm text-slate-950">
              <span>Total Invoice Amount</span>
              <span className="font-mono text-base">{formatPaiseToRupees(order.total_paise)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-400">
          <div>
            <p>Authorized Digital E-Way Bill &amp; Tax Invoice.</p>
            <p>Subject to Ayodhya jurisdiction.</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-700">For {BRAND_CONFIG.legalEntity}</p>
            <p className="italic">Authorized Signatory</p>
          </div>
        </div>

      </div>
    </div>
  );
}
