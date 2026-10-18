'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  Building,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { BRAND_CONFIG } from '@/config/brand';

const SAMPLE_ORDERS = [
  {
    orderNumber: 'NS-AYD-20261018-8412',
    date: '18 Oct 2026, 09:30 AM',
    pincode: '224123',
    hubName: 'Ayodhya Dham Hub',
    status: 'Delivered',
    paymentMethod: 'Pay on Site (COD)',
    totalRupees: '₹38,500.00',
    deliveryOtp: '7129',
    items: [
      {
        title: 'UltraTech Super PPC Cement',
        quantity: 100,
        unit: 'bags',
        rate: '₹385 / bag',
        total: '₹38,500.00',
      },
    ],
  },
  {
    orderNumber: 'NS-AYD-20261016-3901',
    date: '16 Oct 2026, 02:15 PM',
    pincode: '224001',
    hubName: 'Faizabad Central Hub',
    status: 'Delivered',
    paymentMethod: 'Online Prepaid (Razorpay)',
    totalRupees: '₹76,000.00',
    deliveryOtp: '3840',
    items: [
      {
        title: 'Tata Tiscon 550D TMT Rebar (12mm x 12m)',
        quantity: 100,
        unit: 'pieces',
        rate: '₹760 / piece',
        total: '₹76,000.00',
      },
    ],
  },
  {
    orderNumber: 'NS-AYD-20261012-1108',
    date: '12 Oct 2026, 11:45 AM',
    pincode: '224133',
    hubName: 'Darshannagar Industrial Hub',
    status: 'Delivered',
    paymentMethod: 'Pay on Site (COD)',
    totalRupees: '₹17,800.00',
    deliveryOtp: '9154',
    items: [
      {
        title: 'Asian Paints Apex Weatherproof Exterior Emulsion (20L)',
        quantity: 4,
        unit: 'litres',
        rate: '₹4,450 / 20L',
        total: '₹17,800.00',
      },
    ],
  },
];

export default function OrdersHistoryPage() {
  const { user } = useAuth();

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
            <span className="font-bold text-slate-900">Complete Order History</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-black text-slate-950">Site Order History</h1>
              <p className="text-xs text-slate-500 mt-1">
                Verified deliveries and drop-off OTP receipts across Ayodhya construction sites.
              </p>
            </div>
            <Link
              href="/bulk-enquiry"
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk Order RFQ</span>
            </Link>
          </div>

          <div className="space-y-4">
            {SAMPLE_ORDERS.map((order) => (
              <div
                key={order.orderNumber}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {order.date} • Delivered to PIN {order.pincode} ({order.hubName})
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-base text-slate-950 block">
                      {order.totalRupees}
                    </span>
                    <span className="text-[10px] text-slate-500">{order.paymentMethod}</span>
                  </div>
                </div>

                {/* Items Breakdown Table */}
                <div className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-500">
                          Qty: {item.quantity} {item.unit} ({item.rate})
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">{item.total}</div>
                    </div>
                  ))}
                </div>

                {/* Verification OTP & Protocol */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 bg-slate-50 p-3 rounded-2xl">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Site Drop-off OTP Verified:</span>
                    <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                      {order.deliveryOtp}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Original manufacturer test certificate archived with order.
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
