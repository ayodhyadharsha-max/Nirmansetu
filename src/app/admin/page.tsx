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
  Clock,
  KeyRound,
  FileText,
  AlertCircle,
  Check,
  RotateCcw,
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
    'overview' | 'fulfillment' | 'quotations' | 'orders' | 'suppliers' | 'pincodes' | 'products' | 'reports' | 'audit'
  >('overview');

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [pincodes, setPincodes] = useState<any[]>([]);
  const [serviceZones, setServiceZones] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states for fulfillment actions
  const [selectedOrderForPo, setSelectedOrderForPo] = useState<any | null>(null);
  const [poSupplierId, setPoSupplierId] = useState('s0000000-0000-0000-0000-000000000001');

  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<any | null>(null);
  const [dispatchForm, setDispatchForm] = useState({
    driverName: 'Ramesh Yadav',
    driverPhone: '9450011223',
    vehicleType: 'tata_ace' as any,
    vehicleRegistrationNumber: 'UP 42 AT 8899',
    deliveryInstructions: 'Enter via bypass road; unload at ground level near column 2.',
  });

  const [selectedOrderForOtp, setSelectedOrderForOtp] = useState<any | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpNotes, setOtpNotes] = useState('Customer inspected all cement bags & rebar bundles. All intact.');

  const [selectedOrderForReassign, setSelectedOrderForReassign] = useState<any | null>(null);
  const [reassignSupplierId, setReassignSupplierId] = useState('s0000000-0000-0000-0000-000000000002');
  const [reassignReason, setReassignReason] = useState('Previous stockist reported insufficient rebar stock.');

  const [selectedOrderForFailure, setSelectedOrderForFailure] = useState<any | null>(null);
  const [failureReason, setFailureReason] = useState('Customer phone switched off & site gate locked.');
  const [retryScheduledAt, setRetryScheduledAt] = useState('Tomorrow 09:00 AM');

  // Quotation form state
  const [selectedEnquiryForQuote, setSelectedEnquiryForQuote] = useState<any | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    validityDays: 7,
    unitRateRupees: '385',
    freightRupees: '1500',
    unloadingRupees: '800',
    terms: 'Prices inclusive of GST. Transit insurance included. Site unloading at ground level.',
  });

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

      // 4. Service Zones & Pincodes
      const resZones = await fetch('/api/admin/serviceability', { headers: adminHeaders });
      const dataZones = await resZones.json();
      if (dataZones.success && dataZones.zones) {
        setServiceZones(dataZones.zones);
        setPincodes(
          dataZones.zones.map((z: any) => ({
            pincode: z.pincode,
            hub_name: `${z.hub_locality} (${z.zone_name})`,
            delivery_fee_rupees: z.standard_delivery_fee_paise / 100,
            is_serviceable: z.is_serviceable,
            min_order_rupees: z.min_order_paise / 100,
            operating_hours: z.operating_hours,
            delivery_restrictions: z.delivery_restrictions,
          }))
        );
      }

      // 5. Bulk Enquiries
      const resEnquiries = await fetch('/api/admin/enquiries', { headers: adminHeaders });
      const dataEnquiries = await resEnquiries.json();
      if (dataEnquiries.success) setEnquiries(dataEnquiries.enquiries || []);

      // 6. Quotations
      const resQuotes = await fetch('/api/quotations', { headers: adminHeaders });
      const dataQuotes = await resQuotes.json();
      if (dataQuotes.success) setQuotations(dataQuotes.quotations || []);

      // 7. Audit Logs
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

  // Dispatch vehicle action
  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDispatch) return;
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/fulfillment/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders },
        body: JSON.stringify({
          orderId: selectedOrderForDispatch.id,
          poId: selectedOrderForDispatch.po_id || '',
          ...dispatchForm,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to dispatch order');
      setNotice({
        type: 'success',
        message: `Vehicle dispatched! Customer notified with 4-digit Drop-off OTP: [${data.delivery?.delivery_otp}].`,
      });
      setSelectedOrderForDispatch(null);
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Verify physical OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForOtp) return;
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/fulfillment/verify-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders },
        body: JSON.stringify({
          orderId: selectedOrderForOtp.id,
          deliveryOtp: enteredOtp.trim(),
          completionNotes: otpNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'OTP verification failed');
      setNotice({
        type: 'success',
        message: `Site delivery physically verified! Order ${selectedOrderForOtp.order_number} marked delivered.`,
      });
      setSelectedOrderForOtp(null);
      setEnteredOtp('');
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Record failed delivery
  const handleRecordFailure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForFailure) return;
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/fulfillment/failed-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders },
        body: JSON.stringify({
          orderId: selectedOrderForFailure.id,
          failureReason: failureReason.trim(),
          retryScheduledAt,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to record delivery failure');
      setNotice({
        type: 'success',
        message: 'Delivery failure recorded and retry window scheduled without losing order history.',
      });
      setSelectedOrderForFailure(null);
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Reassign supplier
  const handleReassignSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReassign) return;
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/fulfillment/reassign-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders },
        body: JSON.stringify({
          orderId: selectedOrderForReassign.id,
          newSupplierId: reassignSupplierId,
          reason: reassignReason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reassign supplier');
      setNotice({
        type: 'success',
        message: `Order reassigned to alternative merchant. New PO: ${data.po?.po_number}.`,
      });
      setSelectedOrderForReassign(null);
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Issue PO
  const handleIssuePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPo) return;
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/fulfillment/assign-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders },
        body: JSON.stringify({
          orderId: selectedOrderForPo.id,
          supplierId: poSupplierId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to assign supplier');
      setNotice({
        type: 'success',
        message: `PO ${data.po?.po_number} dispatched to approved supplier.`,
      });
      setSelectedOrderForPo(null);
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Create formal quotation
  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiryForQuote) return;
    setActionLoading(true);
    setNotice(null);
    try {
      const unitRatePaise = Math.round(parseFloat(quoteForm.unitRateRupees) * 100);
      const freightPaise = Math.round(parseFloat(quoteForm.freightRupees) * 100);
      const unloadingPaise = Math.round(parseFloat(quoteForm.unloadingRupees) * 100);

      const items = (selectedEnquiryForQuote.structured_items || []).map((si: any) => ({
        itemTitle: si.title || 'Construction Material',
        unit: si.unit || 'units',
        quantity: si.approx_qty || 100,
        unitRatePaise,
        gstRatePct: 18,
      }));

      if (items.length === 0) {
        items.push({
          itemTitle: 'UltraTech PPC Cement (High Tonnage Batch)',
          unit: 'bags',
          quantity: 200,
          unitRatePaise,
          gstRatePct: 28,
        });
      }

      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders },
        body: JSON.stringify({
          enquiryId: selectedEnquiryForQuote.id,
          clientName: selectedEnquiryForQuote.contact_name,
          clientPhone: selectedEnquiryForQuote.contact_phone,
          clientEmail: selectedEnquiryForQuote.contact_email || undefined,
          clientGstin: selectedEnquiryForQuote.gstin || undefined,
          deliveryAddress: selectedEnquiryForQuote.project_address,
          deliveryPincode: selectedEnquiryForQuote.pincode,
          validityDays: quoteForm.validityDays,
          items,
          freightPaise,
          unloadingChargesPaise: unloadingPaise,
          termsAndConditions: quoteForm.terms,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create quotation');
      setNotice({
        type: 'success',
        message: `Quotation ${data.quotation?.quotation_number} sent to ${selectedEnquiryForQuote.contact_name}.`,
      });
      setSelectedEnquiryForQuote(null);
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
              <span>NirmanSetu Ayodhya • Operations & Logistics Command</span>
              <span>•</span>
              <span className="text-slate-400 font-mono text-[11px]">Role: Administrator</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Supplier Fulfilment & Delivery Control Center
            </h1>
            <p className="text-xs text-slate-400">
              Approved stockist dispatch, 4-digit Drop-off OTP verification, B2B quotations, and Ayodhya zone SLA enforcement.
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
            { id: 'fulfillment', label: `Fulfilment & Dispatch (${orders.length})`, icon: Truck },
            { id: 'quotations', label: `Quotations & RFQs (${enquiries.length})`, icon: FileText },
            { id: 'orders', label: `All Orders (${orders.length})`, icon: ShoppingCart },
            { id: 'suppliers', label: `Suppliers (${suppliers.length})`, icon: Building2 },
            { id: 'pincodes', label: `Service Zones (${pincodes.length})`, icon: MapPin },
            { id: 'products', label: `Catalog (${SEED_PRODUCTS.length})`, icon: Package },
            { id: 'reports', label: 'CSV Reports', icon: FileSpreadsheet },
            { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
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

        {/* TAB 1: OVERVIEW */}
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
                  Customer Site Orders
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {metrics?.totalOrders || orders.length}
                </div>
                <div className="text-[11px] text-slate-500">
                  Across 6 Ayodhya delivery zones
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Commercial B2B RFQs
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {enquiries.length}
                </div>
                <div className="text-[11px] text-slate-500">
                  {quotations.filter((q) => q.status === 'accepted').length} accepted quotations
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Approved Local Stockists
                </span>
                <div className="text-2xl font-black text-amber-600">
                  {metrics?.activeSuppliersCount || suppliers.filter((s) => s.verification_status === 'verified').length}
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    ({suppliers.filter((s) => s.verification_status === 'pending').length} pending)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  100% stockist fulfilled (zero warehouse cost)
                </div>
              </div>
            </div>

            {/* Quick Fulfilment Alerts */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <span>Active Delivery & Stockist Fulfilment Queue</span>
                </h3>
                <button
                  onClick={() => setActiveTab('fulfillment')}
                  className="text-xs text-amber-600 hover:text-amber-700 font-bold"
                >
                  Manage Full Queue →
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {orders.map((o) => (
                  <div key={o.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{o.order_number || o.id}</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          {o.customer_name} • PIN {o.shipping_pincode || o.pincode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Status History: {o.status_history?.slice(-1)[0]?.notes || 'Awaiting dispatch'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          o.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'dispatched'
                            ? 'bg-blue-100 text-blue-800'
                            : o.status === 'supplier_rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FULFILMENT & DISPATCH COMMAND */}
        {activeTab === 'fulfillment' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-slate-800">
                    Ayodhya Local Stockist Fulfilment Operations
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Assign approved suppliers, handle rejections, dispatch transport with 4-digit Drop-off OTPs, and verify site drops.
                  </p>
                </div>
                <span className="text-xs text-slate-500">{orders.length} orders</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Order Ref</th>
                      <th className="py-3 px-4 font-semibold">Destination Site</th>
                      <th className="py-3 px-4 font-semibold">Fulfillment Stage</th>
                      <th className="py-3 px-4 font-semibold">Latest Operations Note</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <div>{o.order_number || o.id}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            ₹{((o.total_amount_paise || o.total_paise || 0) / 100).toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{o.customer_name || 'Site Customer'}</div>
                          <div className="text-[11px] text-slate-500">
                            PIN {o.shipping_pincode || o.pincode}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              o.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.status === 'dispatched'
                                ? 'bg-blue-100 text-blue-800'
                                : o.status === 'supplier_rejected'
                                ? 'bg-red-100 text-red-800'
                                : o.status === 'failed_delivery'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {o.status_history?.slice(-1)[0]?.notes || 'Order confirmed, awaiting assignment.'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Step 1: Assign Supplier */}
                            {(!o.status || o.status === 'confirmed' || o.status === 'pending_payment') && (
                              <button
                                onClick={() => setSelectedOrderForPo(o)}
                                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px]"
                              >
                                Assign Stockist
                              </button>
                            )}

                            {/* Reassign if supplier rejected */}
                            {o.status === 'supplier_rejected' && (
                              <button
                                onClick={() => setSelectedOrderForReassign(o)}
                                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" /> Reassign Stockist
                              </button>
                            )}

                            {/* Step 2: Dispatch Vehicle */}
                            {(o.status === 'supplier_confirmed' || o.status === 'processing') && (
                              <button
                                onClick={() => setSelectedOrderForDispatch(o)}
                                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1"
                              >
                                <Truck className="w-3 h-3" /> Dispatch Vehicle
                              </button>
                            )}

                            {/* Step 3: Verify Delivery OTP */}
                            {o.status === 'dispatched' && (
                              <>
                                <button
                                  onClick={() => setSelectedOrderForOtp(o)}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1"
                                >
                                  <KeyRound className="w-3 h-3" /> Verify Drop-off OTP
                                </button>
                                <button
                                  onClick={() => setSelectedOrderForFailure(o)}
                                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-800 text-slate-200 font-bold text-[10px]"
                                >
                                  Report Failure
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Dispatch Vehicle */}
            {selectedOrderForDispatch && (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                  <h4 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-700" />
                    <span>Arrange Delivery Dispatch for {selectedOrderForDispatch.order_number}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedOrderForDispatch(null)}
                    className="text-blue-700 hover:text-blue-950 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleDispatch} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-blue-950 mb-1">
                      Assigned Driver Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={dispatchForm.driverName}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-blue-950 mb-1">
                      Driver Mobile (For Customer Contact) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={dispatchForm.driverPhone}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, driverPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-blue-950 mb-1">
                      Vehicle Type *
                    </label>
                    <select
                      value={dispatchForm.vehicleType}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white"
                    >
                      <option value="tata_ace">Tata Ace (1.5 Tons)</option>
                      <option value="three_wheeler_auto">3-Wheeler Auto (1 Ton)</option>
                      <option value="tata_407">Tata 407 (4 Tons)</option>
                      <option value="tipper_truck">Tipper Truck (10+ Tons)</option>
                      <option value="tractor_trolley">Tractor Trolley</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-blue-950 mb-1">
                      Vehicle Registration Plate *
                    </label>
                    <input
                      type="text"
                      required
                      value={dispatchForm.vehicleRegistrationNumber}
                      onChange={(e) =>
                        setDispatchForm({ ...dispatchForm, vehicleRegistrationNumber: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white font-mono uppercase"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-blue-950 mb-1">
                      Site Delivery Instructions
                    </label>
                    <input
                      type="text"
                      value={dispatchForm.deliveryInstructions}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, deliveryInstructions: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Dispatch Vehicle & Generate Drop-off OTP</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modal: Verify Drop-off OTP */}
            {selectedOrderForOtp && (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-700" />
                    <span>Physical Inspection & Drop-off OTP Verification for {selectedOrderForOtp.order_number}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedOrderForOtp(null)}
                    className="text-emerald-700 hover:text-emerald-950 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <p className="text-emerald-800 text-[11px]">
                    Customer must inspect materials at the site and share the 4-digit numeric code received on their phone.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-emerald-950 mb-1">
                        4-Digit Customer Drop-off OTP *
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        required
                        placeholder="e.g. 8412"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white font-mono text-center text-lg tracking-widest font-black"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-emerald-950 mb-1">
                        Site Inspection Notes
                      </label>
                      <input
                        type="text"
                        value={otpNotes}
                        onChange={(e) => setOtpNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Material Receipt & Complete Order</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modal: Reassign Alternative Stockist */}
            {selectedOrderForReassign && (
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-red-200 pb-2">
                  <h4 className="text-sm font-bold text-red-950 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-red-700" />
                    <span>Reassign Alternative Approved Stockist for {selectedOrderForReassign.order_number}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedOrderForReassign(null)}
                    className="text-red-700 hover:text-red-950 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleReassignSupplier} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-red-950 mb-1">
                        Select Alternative Approved Stockist *
                      </label>
                      <select
                        value={reassignSupplierId}
                        onChange={(e) => setReassignSupplierId(e.target.value)}
                        className="w-full px-3 py-2 border border-red-200 rounded-xl bg-white"
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

                    <div>
                      <label className="block font-semibold text-red-950 mb-1">
                        Reassignment Justification
                      </label>
                      <input
                        type="text"
                        value={reassignReason}
                        onChange={(e) => setReassignReason(e.target.value)}
                        className="w-full px-3 py-2 border border-red-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="py-2.5 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Reassign Order to Alternative Stockist</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUOTATIONS & COMMERCIAL RFQs */}
        {activeTab === 'quotations' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-slate-800">
                    Commercial Bulk RFQs from Ayodhya Sites
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Review contractor requirements, request private distributor bids, and prepare formal customer quotations.
                  </p>
                </div>
                <span className="text-xs text-slate-500">{enquiries.length} enquiries</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">RFQ Number</th>
                      <th className="py-3 px-4 font-semibold">Client & Firm</th>
                      <th className="py-3 px-4 font-semibold">Project Location</th>
                      <th className="py-3 px-4 font-semibold">Required Materials</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enquiries.map((enq) => (
                      <tr key={enq.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {enq.enquiry_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{enq.contact_name}</div>
                          <div className="text-[11px] text-slate-500">
                            {enq.company_or_firm_name || 'Individual Pro'} • {enq.contact_phone}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>{enq.project_title}</div>
                          <div className="text-[11px] text-slate-400">PIN {enq.pincode}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                          {enq.material_requirements}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              enq.status === 'quoted'
                                ? 'bg-blue-100 text-blue-800'
                                : enq.status === 'converted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {enq.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedEnquiryForQuote(enq)}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px]"
                          >
                            Prepare Quote
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Prepare Formal Quotation */}
            {selectedEnquiryForQuote && (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Issue Commercial Quotation for {selectedEnquiryForQuote.enquiry_number}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedEnquiryForQuote(null)}
                    className="text-slate-500 hover:text-slate-800 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCreateQuotation} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Quoted Selling Rate (₹ / Unit) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={quoteForm.unitRateRupees}
                        onChange={(e) => setQuoteForm({ ...quoteForm, unitRateRupees: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Freight Charge (₹)
                      </label>
                      <input
                        type="number"
                        value={quoteForm.freightRupees}
                        onChange={(e) => setQuoteForm({ ...quoteForm, freightRupees: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Ground Unloading (₹)
                      </label>
                      <input
                        type="number"
                        value={quoteForm.unloadingRupees}
                        onChange={(e) => setQuoteForm({ ...quoteForm, unloadingRupees: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Quotation Validity (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={quoteForm.validityDays}
                      onChange={(e) => setQuoteForm({ ...quoteForm, validityDays: parseInt(e.target.value, 10) })}
                      className="w-full sm:w-48 px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Commercial Terms & Warranty
                    </label>
                    <textarea
                      rows={2}
                      value={quoteForm.terms}
                      onChange={(e) => setQuoteForm({ ...quoteForm, terms: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center gap-2"
                    >
                      <Send className="w-4 h-4 text-amber-400" />
                      <span>Issue Formal Quotation to Client</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List of Issued Quotations */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold uppercase tracking-wider text-slate-800">
                  Issued Formal Quotations ({quotations.length})
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Quote Ref</th>
                      <th className="py-2.5 px-4 font-semibold">Client Name</th>
                      <th className="py-2.5 px-4 font-semibold">Valid Until</th>
                      <th className="py-2.5 px-4 font-semibold">Total Amount</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quotations.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {q.quotation_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{q.client_name}</div>
                          <div className="text-[11px] text-slate-400">PIN {q.delivery_pincode}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {q.valid_until}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                          ₹{(q.total_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              q.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.status === 'converted'
                                ? 'bg-blue-100 text-blue-800'
                                : q.status === 'declined'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/quotations/${q.id}`}
                            target="_blank"
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-wider text-slate-700">All Site Orders</h3>
              <span className="text-xs text-slate-500">{orders.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Order Ref</th>
                    <th className="py-3 px-4 font-semibold">Customer & PIN</th>
                    <th className="py-3 px-4 font-semibold">Total Amount</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.order_number || o.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">{o.customer_name}</div>
                        <div className="text-[11px] text-slate-400">PIN {o.shipping_pincode || o.pincode}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{((o.total_amount_paise || o.total_paise || 0) / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SUPPLIERS */}
        {activeTab === 'suppliers' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold uppercase tracking-wider text-slate-800">Ayodhya Partner Stockists</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Approved merchants with local yards.</p>
              </div>
              <Link
                href="/supplier-application"
                target="_blank"
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
              >
                + New Merchant Application
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Business</th>
                    <th className="py-3 px-4 font-semibold">Contact & Phone</th>
                    <th className="py-3 px-4 font-semibold">PIN Codes</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.business_name}</td>
                      <td className="py-3 px-4">{s.contact_person} ({s.phone})</td>
                      <td className="py-3 px-4">{((s.metadata?.serviceablePincodes as string[]) || [s.pincode]).join(', ')}</td>
                      <td className="py-3 px-4 uppercase font-bold text-[10px]">{s.verification_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: PINCODES & RESTRICTIONS */}
        {activeTab === 'pincodes' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold uppercase tracking-wider text-slate-800">
                Ayodhya Logistics Service Zones & Site Access Restrictions
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Configured operating hours, order minimums, delivery fees, and vehicle restrictions per postal PIN.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">PIN Code</th>
                    <th className="py-3 px-4 font-semibold">Hub Locality & Zone</th>
                    <th className="py-3 px-4 font-semibold">Min Order</th>
                    <th className="py-3 px-4 font-semibold">Delivery Fee</th>
                    <th className="py-3 px-4 font-semibold">Operating Hours</th>
                    <th className="py-3 px-4 font-semibold">Site Restrictions</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pincodes.map((pin) => (
                    <tr key={pin.pincode} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{pin.pincode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{pin.hub_name}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{pin.min_order_rupees || 500}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{pin.delivery_fee_rupees}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {pin.operating_hours?.open || '07:00'} - {pin.operating_hours?.close || '21:00'} IST
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs text-[11px]">
                        {(pin.delivery_restrictions || []).join(' • ') || 'Standard vehicle access'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pin.is_serviceable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {pin.is_serviceable ? 'Active Service' : 'Suspended'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: CATALOG */}
        {activeTab === 'products' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold uppercase tracking-wider text-slate-800">Approved Public Catalog</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Product Title & Brand</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Selling Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SEED_PRODUCTS.map((prod) => (
                    <tr key={prod.product_id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{prod.product_title}</td>
                      <td className="py-3 px-4 text-slate-600">{prod.category_name}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{(prod.selling_price_paise / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: REPORTS */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">Customer Orders CSV</h4>
              <p className="text-[11px] text-slate-500">All site orders and GST tax breakdown.</p>
              <a
                href="/api/admin/reports/export?type=orders"
                download="orders-export.csv"
                className="w-full py-2.5 px-4 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Orders
              </a>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">Ayodhya Suppliers CSV</h4>
              <p className="text-[11px] text-slate-500">Approved merchant partners and PIN codes.</p>
              <a
                href="/api/admin/reports/export?type=suppliers"
                download="suppliers-export.csv"
                className="w-full py-2.5 px-4 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Suppliers
              </a>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">Public Catalog CSV</h4>
              <p className="text-[11px] text-slate-500">Public rates with zero supplier margin leaks.</p>
              <a
                href="/api/admin/reports/export?type=products"
                download="products-export.csv"
                className="w-full py-2.5 px-4 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Products
              </a>
            </div>
          </div>
        )}

        {/* TAB 9: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-wider text-slate-800">
                Security Audit Log ({auditLogs.length} events)
              </h3>
            </div>
            <div className="overflow-x-auto font-mono text-[11px]">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Entity</th>
                    <th className="py-2.5 px-4">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{log.action}</td>
                      <td className="py-2.5 px-4 text-slate-600">{log.entity_type}</td>
                      <td className="py-2.5 px-4 text-slate-500">{log.user_id || 'System'}</td>
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
