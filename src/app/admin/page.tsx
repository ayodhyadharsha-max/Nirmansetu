'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  Package,
  ShoppingCart,
  Users,
  MapPin,
  FileSpreadsheet,
  History,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Send,
  Eye,
  Sliders,
  Sparkles,
  Download,
} from 'lucide-react';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';
import { SEED_PRODUCTS, SEED_CATEGORIES } from '@/lib/catalog/seed-data';

interface DashboardMetrics {
  totalRevenuePaise: number;
  totalOrders: number;
  totalGstTaxPaise: number;
  activeSuppliersCount: number;
  pendingSuppliersCount: number;
  activePincodesCount: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'suppliers' | 'pincodes' | 'products' | 'reports' | 'audit'
  >('overview');

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [pincodes, setPincodes] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Selected Order for PO issuance
  const [selectedOrderForPo, setSelectedOrderForPo] = useState<any | null>(null);
  const [poSupplierId, setPoSupplierId] = useState('s0000000-0000-0000-0000-000000000001');

  // Headers helper for admin session
  const adminHeaders = {
    'x-test-role': 'admin',
    'x-test-user-id': 'admin-super-001',
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setNotice(null);
    try {
      // 1. Metrics
      const resMetrics = await fetch('/api/admin/metrics', { headers: adminHeaders });
      const dataMetrics = await resMetrics.json();
      if (dataMetrics.success) setMetrics(dataMetrics.metrics);

      // 2. Orders
      const resOrders = await fetch('/api/admin/orders', { headers: adminHeaders });
      const dataOrders = await resOrders.json();
      if (dataOrders.success) setOrders(dataOrders.orders || []);

      // 3. Suppliers
      const resSuppliers = await fetch('/api/admin/suppliers', { headers: adminHeaders });
      const dataSuppliers = await resSuppliers.json();
      if (dataSuppliers.success) setSuppliers(dataSuppliers.suppliers || []);

      // 4. Pincodes
      const resPincodes = await fetch('/api/admin/pincodes', { headers: adminHeaders });
      const dataPincodes = await resPincodes.json();
      if (dataPincodes.success) setPincodes(dataPincodes.pincodes || []);

      // 5. Audit Logs
      const resAudit = await fetch('/api/admin/audit-logs', { headers: adminHeaders });
      const dataAudit = await resAudit.json();
      if (dataAudit.success) setAuditLogs(dataAudit.logs || []);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to load administrator data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Update order status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update order status');
      setNotice({ type: 'success', message: `Order status updated to ${newStatus}` });
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Issue PO to supplier
  const handleIssuePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPo) return;
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderForPo.id}/issue-po`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders,
        },
        body: JSON.stringify({ supplierId: poSupplierId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to issue Purchase Order');
      setNotice({ type: 'success', message: `PO issued successfully! Reference: ${data.po?.po_number}` });
      setSelectedOrderForPo(null);
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Update Supplier Verification Status (approve/reject/suspend)
  const handleUpdateSupplierStatus = async (
    supplierId: string,
    status: 'verified' | 'rejected' | 'suspended'
  ) => {
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/suppliers/${supplierId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update supplier status');
      setNotice({ type: 'success', message: `Supplier verification status updated to ${status}` });
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Update PIN Code Delivery Fee & Status
  const handleUpdatePincode = async (pincode: string, isServiceable: boolean, deliveryFeeRupees: number) => {
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/pincodes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders,
        },
        body: JSON.stringify({
          pincode,
          isServiceable,
          deliveryFeePaise: Math.round(deliveryFeeRupees * 100),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update PIN code settings');
      setNotice({ type: 'success', message: `PIN code ${pincode} serviceability updated.` });
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Admin Header */}
        <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>NirmanSetu Ayodhya • Master Command Center</span>
              <span>•</span>
              <span className="text-slate-400 font-mono text-[11px]">Role: Administrator</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Operations & Fulfillment Dashboard
            </h1>
            <p className="text-xs text-slate-400">
              Real-time regional dispatch, merchant verification, catalog pricing, and audited GST reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Records</span>
            </button>
            <Link
              href="/supplier"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition"
            >
              <span>Supplier Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & KPIs', icon: Sliders },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingCart },
            { id: 'suppliers', label: `Suppliers & Stockists (${suppliers.length})`, icon: Building2 },
            { id: 'pincodes', label: `Ayodhya Serviceability (${pincodes.length})`, icon: MapPin },
            { id: 'products', label: `Catalog & Pricing (${SEED_PRODUCTS.length})`, icon: Package },
            { id: 'reports', label: 'CSV Reports', icon: FileSpreadsheet },
            { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & REAL METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Gross Merchandise Volume
                </span>
                <div className="text-2xl font-black text-slate-900">
                  ₹{((metrics?.totalRevenuePaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Real database settlements
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Customer Orders
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {metrics?.totalOrders || orders.length}
                </div>
                <div className="text-[11px] text-slate-500">
                  Across 6 Ayodhya delivery hubs
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Verified GST Tax Collected
                </span>
                <div className="text-2xl font-black text-slate-900">
                  ₹{((metrics?.totalGstTaxPaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500">
                  Audited 18% & 28% integer paise
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Approved Local Stockists
                </span>
                <div className="text-2xl font-black text-amber-600">
                  {metrics?.activeSuppliersCount || 2}
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    ({metrics?.pendingSuppliersCount || 0} pending)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {metrics?.activePincodesCount || 6} active delivery zones
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Orders Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Latest Site Orders Requiring Supplier PO
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-amber-600 hover:text-amber-700 font-bold"
                  >
                    View All Orders →
                  </button>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {orders.slice(0, 4).map((order) => (
                    <div key={order.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{order.order_number || order.id}</div>
                        <div className="text-[11px] text-slate-500">
                          {order.customer_name} • PIN {order.shipping_pincode} • {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          ₹{(order.total_amount_paise / 100).toLocaleString('en-IN')}
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regional Hub Health */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Ayodhya Regional Logistics Status
                </h3>
                <div className="space-y-3 text-xs">
                  {AYODHYA_REGIONAL_HUBS.map((hub) => (
                    <div key={hub.pincode} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{hub.pincode}</div>
                        <div className="text-[11px] text-slate-500">{hub.name}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {hub.slaMinutes}m SLA
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS & SUPPLIER PO ISSUANCE */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  All Customer Site Orders
                </h3>
                <span className="text-xs text-slate-500">{orders.length} total</span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Order Ref</th>
                      <th className="py-3 px-4 font-semibold">Customer & PIN</th>
                      <th className="py-3 px-4 font-semibold">Total Amount</th>
                      <th className="py-3 px-4 font-semibold">Payment Status</th>
                      <th className="py-3 px-4 font-semibold">Fulfillment Status</th>
                      <th className="py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {o.order_number || o.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{o.customer_name}</div>
                          <div className="text-[11px] text-slate-400">PIN: {o.shipping_pincode} • {o.customer_phone}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ₹{(o.total_amount_paise / 100).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              o.payment_status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            disabled={actionLoading}
                            className="text-xs px-2 py-1 rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="pending_payment">Pending Payment</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedOrderForPo(o)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] transition flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Issue PO
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal / Panel for PO Issuance */}
            {selectedOrderForPo && (
              <div className="p-6 bg-amber-50 border border-amber-300 rounded-2xl shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-700" />
                    <span>Issue Stockist Purchase Order for {selectedOrderForPo.order_number}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedOrderForPo(null)}
                    className="text-amber-800 hover:text-amber-950 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleIssuePo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-amber-950 mb-1">
                        Select Approved Ayodhya Stockist *
                      </label>
                      <select
                        value={poSupplierId}
                        onChange={(e) => setPoSupplierId(e.target.value)}
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white"
                      >
                        {suppliers
                          .filter((s) => s.verification_status === 'verified')
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.business_name} ({s.pincode}) - {s.contact_person}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4 text-amber-400" />
                        <span>Dispatch Purchase Order to Stockist</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUPPLIERS & STOCKISTS */}
        {activeTab === 'suppliers' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-slate-800">
                    Ayodhya Supplier & Stockist Applications
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Review and verify partner building material merchants before catalog publication.
                  </p>
                </div>
                <Link
                  href="/supplier-application"
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  + New Application Form
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Business & Depot</th>
                      <th className="py-3 px-4 font-semibold">Contact & Phone</th>
                      <th className="py-3 px-4 font-semibold">GSTIN / PAN</th>
                      <th className="py-3 px-4 font-semibold">PIN Codes</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{s.business_name}</div>
                          <div className="text-[11px] text-slate-500">{s.street_address}, PIN {s.pincode}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{s.contact_person}</div>
                          <div className="text-[11px] text-slate-500">{s.phone}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                          <div>{s.gstin || 'No GSTIN'}</div>
                          <div className="text-slate-400">{s.pan || 'No PAN'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {((s.metadata?.serviceablePincodes as string[]) || [s.pincode]).map((pin) => (
                              <span key={pin} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono">
                                {pin}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              s.verification_status === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.verification_status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {s.verification_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {s.verification_status !== 'verified' && (
                              <button
                                onClick={() => handleUpdateSupplierStatus(s.id, 'verified')}
                                disabled={actionLoading}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                              >
                                Approve
                              </button>
                            )}
                            {s.verification_status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateSupplierStatus(s.id, 'rejected')}
                                disabled={actionLoading}
                                className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px]"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PINCODES & SERVICEABILITY */}
        {activeTab === 'pincodes' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold uppercase tracking-wider text-slate-800">
                Ayodhya District Serviceability & Freight Rules
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Configure delivery rates, transit SLAs, and active status per postal code.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">PIN Code</th>
                    <th className="py-3 px-4 font-semibold">Hub Locality</th>
                    <th className="py-3 px-4 font-semibold">Base Delivery Fee</th>
                    <th className="py-3 px-4 font-semibold">Service Status</th>
                    <th className="py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pincodes.map((pin) => (
                    <tr key={pin.pincode} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {pin.pincode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {pin.hub_name}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{pin.delivery_fee_rupees}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pin.is_serviceable
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {pin.is_serviceable ? 'Active Service' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() =>
                            handleUpdatePincode(
                              pin.pincode,
                              !pin.is_serviceable,
                              pin.delivery_fee_rupees
                            )
                          }
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px]"
                        >
                          Toggle {pin.is_serviceable ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: CATALOG & PRICING */}
        {activeTab === 'products' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold uppercase tracking-wider text-slate-800">
                  Approved Public Catalog & Selling Prices
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Public customer-facing prices. (Supplier wholesale costs are strictly protected and isolated).
                </p>
              </div>
              <span className="text-xs text-slate-500">{SEED_PRODUCTS.length} SKUs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Product Title & Brand</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Benchmark MRP</th>
                    <th className="py-3 px-4 font-semibold">Public Selling Price</th>
                    <th className="py-3 px-4 font-semibold">Min Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SEED_PRODUCTS.map((prod) => (
                    <tr key={prod.product_id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{prod.product_title}</div>
                        <div className="text-[11px] text-slate-500">{prod.brand_name} • SKU: {prod.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {prod.category_name}
                      </td>
                      <td className="py-3 px-4 line-through text-slate-400">
                        ₹{(prod.mrp_paise / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{(prod.selling_price_paise / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">
                        {prod.min_order_qty} {prod.unit_of_measure}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: REPORTS & CSV EXPORT */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 text-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Customer Orders CSV</h4>
              <p className="text-[11px] text-slate-500">
                Exports all verified orders, customer shipping details, GST tax breakdown, and payment status.
              </p>
              <a
                href="/api/admin/reports/export?type=orders"
                download="orders-export.csv"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 inline-flex"
              >
                <Download className="w-4 h-4" />
                <span>Export Orders CSV</span>
              </a>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 text-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Ayodhya Suppliers CSV</h4>
              <p className="text-[11px] text-slate-500">
                Exports registered partner stockists, verification status, contact details, and serviceable PIN codes.
              </p>
              <a
                href="/api/admin/reports/export?type=suppliers"
                download="suppliers-export.csv"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 inline-flex"
              >
                <Download className="w-4 h-4" />
                <span>Export Suppliers CSV</span>
              </a>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 text-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Public Catalog CSV</h4>
              <p className="text-[11px] text-slate-500">
                Exports public selling prices and benchmark MRPs. (Zero supplier margin or wholesale cost leakage).
              </p>
              <a
                href="/api/admin/reports/export?type=products"
                download="products-export.csv"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 inline-flex"
              >
                <Download className="w-4 h-4" />
                <span>Export Products CSV</span>
              </a>
            </div>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold uppercase tracking-wider text-slate-800">
                  Immutable Security Audit Trail
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Logs sensitive administrator actions, supplier onboarding status changes, and PO dispatches.
                </p>
              </div>
              <span className="text-xs text-slate-500">{auditLogs.length} events</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Action</th>
                    <th className="py-3 px-4 font-semibold">Entity</th>
                    <th className="py-3 px-4 font-semibold">Actor User ID</th>
                    <th className="py-3 px-4 font-semibold">Details / New Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {log.entity_type} ({log.entity_id?.slice(0, 8)}...)
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {log.user_id || 'System'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {JSON.stringify(log.new_values)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
