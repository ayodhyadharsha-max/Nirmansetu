'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Building2,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Truck,
  Printer,
  Sparkles,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand';
import type { StoredQuotation } from '@/lib/quotations/service';
import { buildWhatsAppClickToChatUrl } from '@/lib/notifications/whatsapp-link';

export default function QuotationViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [quotation, setQuotation] = useState<StoredQuotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [convertedOrder, setConvertedOrder] = useState<any | null>(null);

  const fetchQuotation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotations/${params.id}`);
      const data = await res.json();
      if (data.success && data.quotation) {
        setQuotation(data.quotation);
      } else {
        setNotice({ type: 'error', message: data.error || 'Quotation not found' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to load quotation' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [params.id]);

  const handleRespond = async (action: 'accept' | 'decline') => {
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/quotations/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-test-role': 'customer',
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to ${action} quotation`);
      }
      setNotice({
        type: 'success',
        message:
          action === 'accept'
            ? 'Quotation accepted! You can now convert it directly into a confirmed order.'
            : 'Quotation has been declined.',
      });
      fetchQuotation();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async () => {
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/quotations/${params.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-role': 'customer',
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to convert quotation to order');
      }
      setConvertedOrder(data.order);
      setNotice({
        type: 'success',
        message: `Order ${data.orderNumber} successfully generated! Redirecting to order details...`,
      });
      setTimeout(() => {
        router.push(`/account/orders/${data.orderId}`);
      }, 1500);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">
        Loading commercial quotation...
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Quotation Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested quotation reference may have expired or is unavailable.
        </p>
        <Link
          href="/bulk-enquiry"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold"
        >
          Submit New RFQ
        </Link>
      </div>
    );
  }

  const isExpired = new Date(quotation.valid_until) < new Date();
  const whatsappHelpUrl = buildWhatsAppClickToChatUrl(
    BRAND_CONFIG.supportPhone,
    `Hello NirmanSetu, I am inquiring regarding Quotation ${quotation.quotation_number} for ₹${(
      quotation.total_paise / 100
    ).toLocaleString('en-IN')}.`
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Breadcrumb & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="hover:text-amber-600 transition">
                Home
              </Link>
              <span>/</span>
              <Link href="/bulk-enquiry" className="hover:text-amber-600 transition">
                Bulk RFQ
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-mono font-bold">{quotation.quotation_number}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-600" />
              <span>Commercial Materials Quotation</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                quotation.status === 'accepted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : quotation.status === 'converted'
                  ? 'bg-blue-100 text-blue-800'
                  : quotation.status === 'declined'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {quotation.status}
            </span>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition text-xs flex items-center gap-1 font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Global Action Notices */}
        {notice && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between ${
              notice.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-red-50 border border-red-200 text-red-900'
            }`}
          >
            <span>{notice.message}</span>
            <button
              onClick={() => setNotice(null)}
              className="text-xs underline hover:opacity-75 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Quotation Document Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
          
          {/* Header & Issuer Info */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 font-black text-xl text-slate-900">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">
                  NS
                </div>
                <span>{BRAND_CONFIG.name}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {BRAND_CONFIG.tagline}. Local verified stockist network across {BRAND_CONFIG.city}, UP.
              </p>
              <div className="text-[11px] text-slate-400 mt-2">
                Legal Entity: {BRAND_CONFIG.legalEntity} • GSTIN: 09AABCN1234F1Z0
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Quotation Reference</div>
              <div className="font-mono font-bold text-slate-900 text-sm">{quotation.quotation_number}</div>
              <div className="text-slate-500 text-[11px] flex sm:justify-end items-center gap-1 pt-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Valid Until: <strong>{quotation.valid_until}</strong></span>
              </div>
              {isExpired && quotation.status === 'sent' && (
                <span className="text-[10px] text-red-600 font-bold block">
                  Expired: Contact us to refresh current commodity rates.
                </span>
              )}
            </div>
          </div>

          {/* Client & Jobsite Delivery Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Client / Pro Account Details
              </span>
              <div className="font-bold text-slate-900 text-sm">{quotation.client_name}</div>
              <div className="text-slate-600">Mobile: {quotation.client_phone}</div>
              {quotation.client_email && (
                <div className="text-slate-600">Email: {quotation.client_email}</div>
              )}
              {quotation.client_gstin && (
                <div className="text-slate-500 font-mono text-[11px]">GSTIN: {quotation.client_gstin}</div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Site Delivery Destination
              </span>
              <div className="flex items-start gap-1.5 text-slate-800">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{quotation.delivery_address}</span>
              </div>
              <div className="font-semibold text-slate-700 pl-5">
                Ayodhya Postal PIN: {quotation.delivery_pincode}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Quoted Materials & Scheduled Quantities
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Material Description</th>
                    <th className="py-2.5 px-3 font-semibold">Quantity</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">GST Rate</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotation.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {item.item_title}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800">
                        ₹{(item.unit_rate_paise / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        {item.gst_rate_pct}%
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                        ₹{(item.total_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 max-w-sm space-y-1">
              <div className="font-bold text-slate-700">Commercial Terms & Warranty:</div>
              <p className="leading-relaxed text-[11px] text-slate-600">
                {quotation.terms_and_conditions}
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Material Subtotal:</span>
                <span className="font-mono">₹{(quotation.subtotal_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total GST Tax:</span>
                <span className="font-mono">₹{(quotation.tax_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Dedicated Site Freight:</span>
                <span className="font-mono">
                  {quotation.freight_paise > 0
                    ? `₹${(quotation.freight_paise / 100).toFixed(2)}`
                    : 'Included in quote'}
                </span>
              </div>
              {quotation.unloading_charges_paise > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Ground Unloading Charges:</span>
                  <span className="font-mono">₹{(quotation.unloading_charges_paise / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-black text-base border-t border-slate-200 pt-2">
                <span>Total Payable (INR):</span>
                <span className="text-amber-600 font-mono">
                  ₹{(quotation.total_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Call-to-Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
            <a
              href={whatsappHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-700 font-semibold"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Discuss rates on WhatsApp</span>
            </a>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {quotation.status === 'sent' && !isExpired && (
                <>
                  <button
                    onClick={() => handleRespond('decline')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition disabled:opacity-50"
                  >
                    Decline Quote
                  </button>
                  <button
                    onClick={() => handleRespond('accept')}
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Quotation</span>
                  </button>
                </>
              )}

              {quotation.status === 'accepted' && (
                <button
                  onClick={handleConvert}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Convert to Live Order & Dispatch</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {quotation.status === 'converted' && (
                <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Order generated and active in Ayodhya fulfillment queue.</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
