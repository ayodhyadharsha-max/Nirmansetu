'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Package,
  FileText,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus,
  Save,
  Send,
  Eye,
  Lock,
} from 'lucide-react';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';
import { StoredSupplier, StoredSupplierProduct, StoredSupplierPo } from '@/lib/suppliers/service';

export default function SupplierPortalPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'orders' | 'profile'>('overview');
  
  // Active demo/authenticated supplier ID
  const [selectedSupplierId, setSelectedSupplierId] = useState('s0000000-0000-0000-0000-000000000001');
  
  const [supplier, setSupplier] = useState<StoredSupplier | null>(null);
  const [products, setProducts] = useState<StoredSupplierProduct[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<StoredSupplierPo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New product stock form
  const [newStock, setNewStock] = useState({
    variantId: 'v0000000-0000-0000-0000-000000000001',
    supplierCostRupees: '350',
    stockQuantity: '200',
    leadTimeHours: '2',
    supplierSku: 'AWM-CEM-01',
    isAvailable: true,
  });

  // Profile edit form
  const [profileForm, setProfileForm] = useState({
    tradeName: '',
    contactPerson: '',
    phone: '',
    email: '',
    streetAddress: '',
    landmark: '',
  });

  // Fetch supplier details, products and POs
  const fetchPortalData = async (supId = selectedSupplierId) => {
    setLoading(true);
    setNotice(null);
    try {
      // 1. Fetch Profile
      const resProfile = await fetch(`/api/supplier/profile?supplierId=${supId}`, {
        headers: {
          'x-test-role': 'supplier',
          'x-test-supplier-id': supId,
        },
      });
      const dataProfile = await resProfile.json();
      if (dataProfile.success && dataProfile.supplier) {
        setSupplier(dataProfile.supplier);
        setProfileForm({
          tradeName: dataProfile.supplier.trade_name || '',
          contactPerson: dataProfile.supplier.contact_person || '',
          phone: dataProfile.supplier.phone || '',
          email: dataProfile.supplier.email || '',
          streetAddress: dataProfile.supplier.street_address || '',
          landmark: dataProfile.supplier.landmark || '',
        });
      }

      // 2. Fetch Products
      const resProducts = await fetch(`/api/supplier/products?supplierId=${supId}`, {
        headers: {
          'x-test-role': 'supplier',
          'x-test-supplier-id': supId,
        },
      });
      const dataProducts = await resProducts.json();
      if (dataProducts.success) {
        setProducts(dataProducts.products || []);
      }

      // 3. Fetch POs
      const resPos = await fetch(`/api/supplier/purchase-orders?supplierId=${supId}`, {
        headers: {
          'x-test-role': 'supplier',
          'x-test-supplier-id': supId,
        },
      });
      const dataPos = await resPos.json();
      if (dataPos.success) {
        setPurchaseOrders(dataPos.purchaseOrders || []);
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to fetch portal records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData(selectedSupplierId);
  }, [selectedSupplierId]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/supplier/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-test-role': 'supplier',
          'x-test-supplier-id': selectedSupplierId,
        },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          ...profileForm,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }
      setNotice({ type: 'success', message: 'Supplier profile updated successfully.' });
      if (data.supplier) setSupplier(data.supplier);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Product Stock Submission
  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setNotice(null);
    try {
      const costPaise = Math.round(parseFloat(newStock.supplierCostRupees) * 100);
      const res = await fetch('/api/supplier/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-role': 'supplier',
          'x-test-supplier-id': selectedSupplierId,
        },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          variantId: newStock.variantId,
          supplierCostPaise: costPaise,
          stockQuantity: parseInt(newStock.stockQuantity, 10),
          leadTimeHours: parseInt(newStock.leadTimeHours, 10),
          supplierSku: newStock.supplierSku,
          isAvailable: newStock.isAvailable,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit stock update');
      }
      setNotice({
        type: 'success',
        message: 'Inventory wholesale cost & stock submitted. Awaiting administrator catalog sync.',
      });
      fetchPortalData(selectedSupplierId);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle PO status update
  const handlePoStatusUpdate = async (poId: string, status: string, notes?: string) => {
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/supplier/purchase-orders/${poId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-test-role': 'supplier',
          'x-test-supplier-id': selectedSupplierId,
        },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          status,
          notes: notes || `Status updated to ${status} via Supplier Portal`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update PO status');
      }
      setNotice({ type: 'success', message: `PO status changed to ${status}.` });
      fetchPortalData(selectedSupplierId);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Portal Header */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Building2 className="w-4 h-4" />
              <span>Ayodhya Stockist Partner Portal</span>
              <span>•</span>
              <span className="text-slate-400 font-mono text-[11px]">{selectedSupplierId}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {supplier?.business_name || 'Stockist Depot Portal'}
            </h1>
            <p className="text-xs text-slate-300">
              {supplier?.street_address || 'Ayodhya District Depot'}, PIN {supplier?.pincode}
            </p>
          </div>

          {/* Verification Badge & Switcher for Testing */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Switch Merchant:</span>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="s0000000-0000-0000-0000-000000000001">Awadh Material Mart (Verified)</option>
                <option value="s0000000-0000-0000-0000-000000000002">Ramrajya Depot (Verified)</option>
              </select>
            </div>

            {supplier && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  supplier.verification_status === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : supplier.verification_status === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {supplier.verification_status === 'verified' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="capitalize">{supplier.verification_status} Status</span>
              </span>
            )}
          </div>
        </div>

        {/* Status Notice Banner if Pending */}
        {supplier?.verification_status === 'pending' && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Account Verification Pending:</strong> Your GSTIN/PAN and physical depot location are currently undergoing review by the platform administrator. Wholesale pricing and stock updates submitted now will be staged and activated immediately upon formal approval.
            </div>
          </div>
        )}

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
            { id: 'overview', label: 'Depot Overview', icon: Building2 },
            { id: 'inventory', label: `Inventory & Wholesale (${products.length})`, icon: Package },
            { id: 'orders', label: `Purchase Orders (${purchaseOrders.length})`, icon: FileText },
            { id: 'profile', label: 'Merchant Profile', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Assigned Purchase Orders
              </span>
              <div className="text-3xl font-black text-slate-900">{purchaseOrders.length}</div>
              <p className="text-[11px] text-slate-500">
                Active contractor site dispatches across Ayodhya
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Managed SKUs
              </span>
              <div className="text-3xl font-black text-slate-900">{products.length}</div>
              <p className="text-[11px] text-slate-500">
                Products linked with confirmed wholesale rates
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Platform Commission Rate
              </span>
              <div className="text-3xl font-black text-amber-600">
                {supplier?.commission_rate_pct || 4.5}%
              </div>
              <p className="text-[11px] text-slate-500">
                Admin negotiated rate (Zero upfront listing fee)
              </p>
            </div>

            <div className="md:col-span-3 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>Logistics & Regional Delivery Hubs</span>
              </h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {(supplier?.metadata?.serviceablePincodes as string[] || ['224123', '224001']).map((pin) => (
                  <span
                    key={pin}
                    className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-semibold border border-slate-200"
                  >
                    PIN {pin} (Ayodhya Hub)
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Registered transport capacity: {(supplier?.metadata?.deliveryCapacity as string[] || ['Tata Ace']).join(', ')}.
                When an order in your serviceable hub is confirmed, a Purchase Order is dispatched with customer site coordinates and delivery OTP.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY & WHOLESALE PRICING */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Form to submit stock/pricing */}
            <form
              onSubmit={handleStockSubmit}
              className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span>Update Stock Level & Wholesale Rate</span>
                </h3>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-600" /> Private wholesale rate (Not visible to buyers)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catalog Product Variant *
                  </label>
                  <select
                    value={newStock.variantId}
                    onChange={(e) => setNewStock({ ...newStock, variantId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="v0000000-0000-0000-0000-000000000001">UltraTech Super PPC Cement (50kg)</option>
                    <option value="v0000000-0000-0000-0000-000000000002">Tata Tiscon 550D TMT Rebar (12mm)</option>
                    <option value="v0000000-0000-0000-0000-000000000003">Kajaria Polished Glazed Tiles (600x1200mm)</option>
                    <option value="v0000000-0000-0000-0000-000000000004">Asian Paints Apex Weatherproof (20L)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Wholesale Settlement Cost (₹ per Unit) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newStock.supplierCostRupees}
                    onChange={(e) => setNewStock({ ...newStock, supplierCostRupees: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Available Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newStock.stockQuantity}
                    onChange={(e) => setNewStock({ ...newStock, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Depot Lead Time (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={newStock.leadTimeHours}
                    onChange={(e) => setNewStock({ ...newStock, leadTimeHours: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Internal Depot SKU Code
                  </label>
                  <input
                    type="text"
                    value={newStock.supplierSku}
                    onChange={(e) => setNewStock({ ...newStock, supplierSku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Wholesale Rate</span>
                  </button>
                </div>
              </div>
            </form>

            {/* List of supplier products */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Current Managed Inventory
                </h4>
                <span className="text-[11px] text-slate-500">{products.length} records</span>
              </div>

              {products.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No products added yet. Use the form above to add your stock and wholesale rates.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">SKU / Variant ID</th>
                        <th className="py-3 px-4 font-semibold">Wholesale Cost (Settlement)</th>
                        <th className="py-3 px-4 font-semibold">Stock Quantity</th>
                        <th className="py-3 px-4 font-semibold">Lead Time</th>
                        <th className="py-3 px-4 font-semibold">Approval Status</th>
                        <th className="py-3 px-4 font-semibold">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                            <div>{p.supplier_sku || p.variant_id}</div>
                            <div className="text-[10px] text-slate-400">{p.variant_id}</div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            ₹{(p.supplier_cost_paise / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {p.stock_quantity} units
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {p.min_lead_time_hours || 2} hrs
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.is_approved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.is_approved ? 'Approved for Catalog' : 'Pending Admin Sync'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(p.updated_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PURCHASE ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Assigned Site Purchase Orders
              </h3>
              <button
                onClick={() => fetchPortalData(selectedSupplierId)}
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Orders
              </button>
            </div>

            {purchaseOrders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                No purchase orders currently assigned to your depot.
              </div>
            ) : (
              purchaseOrders.map((po) => (
                <div
                  key={po.id}
                  className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm font-mono">{po.po_number}</span>
                        <span className="text-[11px] text-slate-400">Order Ref: {po.order_number || po.order_id}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Issued on {new Date(po.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Settlement Total:</span>
                      <span className="text-base font-black text-slate-900">
                        ₹{(po.total_cost_paise / 100).toLocaleString('en-IN')}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          po.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.status === 'dispatched'
                            ? 'bg-blue-100 text-blue-800'
                            : po.status === 'accepted'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {po.status}
                      </span>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-2">
                    <span className="font-semibold text-slate-700 text-[11px]">Dispatch Items:</span>
                    <div className="bg-slate-50 rounded-xl p-3 divide-y divide-slate-200/60">
                      {po.items.map((item) => (
                        <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{item.product_title}</div>
                            <div className="text-[11px] text-slate-500">{item.variant_title}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">{item.quantity} units</div>
                            <div className="text-[11px] text-slate-500">
                              @ ₹{(item.unit_cost_paise / 100).toFixed(2)} / unit
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="text-[11px] text-slate-500 italic">
                      {po.notes || 'Dispatch instructions: Check bags and transport directly to jobsite.'}
                    </div>

                    <div className="flex items-center gap-2">
                      {po.status === 'issued' && (
                        <button
                          onClick={() => handlePoStatusUpdate(po.id, 'accepted')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition"
                        >
                          Accept Order
                        </button>
                      )}
                      {po.status === 'accepted' && (
                        <button
                          onClick={() => handlePoStatusUpdate(po.id, 'packed')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
                        >
                          Mark Loaded / Packed
                        </button>
                      )}
                      {po.status === 'packed' && (
                        <button
                          onClick={() => handlePoStatusUpdate(po.id, 'dispatched')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
                        >
                          Mark Vehicle Dispatched
                        </button>
                      )}
                      {po.status === 'dispatched' && (
                        <button
                          onClick={() => handlePoStatusUpdate(po.id, 'completed')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
                        >
                          Confirm Site Delivery
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <form
            onSubmit={handleProfileSubmit}
            className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 text-xs"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Permitted Merchant Profile Details
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Update operational phone numbers, depot contact person, or shop landmark. Legal business name and commission rate are locked to protect audit trails.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business Legal Name (Read-only)
                </label>
                <input
                  type="text"
                  disabled
                  value={supplier?.business_name || ''}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trade / Display Name
                </label>
                <input
                  type="text"
                  value={profileForm.tradeName}
                  onChange={(e) => setProfileForm({ ...profileForm, tradeName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Authorized Contact Person
                </label>
                <input
                  type="text"
                  value={profileForm.contactPerson}
                  onChange={(e) => setProfileForm({ ...profileForm, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dispatch Contact Phone
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Depot Street Address
                </label>
                <input
                  type="text"
                  value={profileForm.streetAddress}
                  onChange={(e) => setProfileForm({ ...profileForm, streetAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                  value={profileForm.landmark}
                  onChange={(e) => setProfileForm({ ...profileForm, landmark: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  GSTIN (Audited)
                </label>
                <input
                  type="text"
                  disabled
                  value={supplier?.gstin || 'Unregistered'}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono cursor-not-allowed uppercase"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
