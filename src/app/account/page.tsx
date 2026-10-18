'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ShoppingBag,
  FileSpreadsheet,
  MapPin,
  ShieldCheck,
  Building,
  LogOut,
  Clock,
  ArrowRight,
  Sparkles,
  Phone,
  FileText,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { BRAND_CONFIG } from '@/config/brand';

export default function AccountPage() {
  const router = useRouter();
  const { user, signOut, signInDemoUser } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md w-full shadow-lg space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-950">Sign In to View Site Account</h2>
            <p className="text-xs text-slate-500">
              Please sign in with your site credentials to track orders and download GST tax invoices.
            </p>
            <div className="space-y-2 pt-2">
              <Link
                href="/login"
                className="block w-full py-3 bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl transition"
              >
                Sign In to Account
              </Link>
              <button
                onClick={() => signInDemoUser('contractor')}
                className="block w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-xl border border-amber-200 transition"
              >
                1-Click Contractor Demo Access
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Top Profile Header */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center text-2xl font-black shadow-md">
                {user.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950">{user.fullName}</h1>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    {user.role === 'contractor' ? 'Verified Contractor' : 'Site Owner'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {user.email && <span>{user.email}</span>}
                  {user.phone && <span>{user.phone}</span>}
                  {user.companyName && <span>Firm: {user.companyName}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/bulk-enquiry"
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Submit Bulk RFQ</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="px-3.5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Total Orders</div>
              <div className="text-2xl font-black text-slate-950 mt-1">3</div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">All site dropoffs confirmed</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">GST Billing Status</div>
              <div className="text-sm font-black text-slate-950 mt-1 font-mono">
                {user.gstin || '09AAACS1429B1ZB'}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">100% Tax Invoices issued</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Primary Delivery Zone</div>
              <div className="text-lg font-black text-slate-950 mt-1">Ayodhya Dham</div>
              <div className="text-[11px] text-slate-500 mt-1">PIN 224123 (60 Min SLA)</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Partner Stockist Rating</div>
              <div className="text-2xl font-black text-amber-600 mt-1">Tier-1</div>
              <div className="text-[11px] text-slate-500 mt-1">Direct mill dispatches</div>
            </div>
          </div>

          {/* Recent Orders Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-950">Active & Recent Site Dispatches</h2>
                <p className="text-xs text-slate-500">Real-time status of orders placed with Ayodhya stockists.</p>
              </div>
              <Link
                href="/account/orders"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <span>View All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Orders Feed */}
            <div className="space-y-4">
              
              {/* Order 1 */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-950">NS-AYD-20261018-8412</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Delivered
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Oct 18, 2026 • Destination: Ramkot, Ayodhya Dham (PIN 224123)
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-base text-slate-950">₹38,500.00</span>
                    <div className="text-[11px] text-slate-500">Paid on Site (UPI)</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>Materials: 100 Bags UltraTech Super PPC Cement</span>
                  </div>
                  <div className="font-mono text-amber-800 font-bold bg-amber-100/60 px-2 py-0.5 rounded">
                    Site Drop-off OTP: 7129 (Verified)
                  </div>
                </div>
              </div>

              {/* Order 2 */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-950">NS-AYD-20261016-3901</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Delivered
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Oct 16, 2026 • Destination: Civil Lines, Faizabad (PIN 224001)
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-base text-slate-950">₹76,000.00</span>
                    <div className="text-[11px] text-slate-500">Prepaid Online</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>Materials: 100 Pcs Tata Tiscon 550D TMT Rebar (12mm)</span>
                  </div>
                  <div className="font-mono text-amber-800 font-bold bg-amber-100/60 px-2 py-0.5 rounded">
                    Site Drop-off OTP: 3840 (Verified)
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Help for Sites */}
          <div className="bg-amber-50 rounded-3xl border border-amber-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-amber-950">Ayodhya Site Contractor Support</h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Need heavy trailer unloading, crane assistance, or bulk billing reconciliation?
                </p>
              </div>
            </div>
            <a
              href={`tel:${BRAND_CONFIG.supportPhone.replace(/\s+/g, '')}`}
              className="px-4 py-2.5 bg-slate-950 text-amber-400 font-bold text-xs rounded-xl hover:bg-slate-800 transition text-center shrink-0"
            >
              Call {BRAND_CONFIG.supportPhone}
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
