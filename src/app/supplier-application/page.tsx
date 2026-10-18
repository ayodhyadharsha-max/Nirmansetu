'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  FileSpreadsheet,
  Clock,
  ArrowRight,
  Send,
  Sparkles,
} from 'lucide-react';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';
import { SEED_CATEGORIES } from '@/lib/catalog/seed-data';

export default function SupplierApplicationPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    tradeName: '',
    contactPerson: '',
    phone: '',
    email: '',
    streetAddress: '',
    landmark: '',
    city: 'Ayodhya',
    pincode: '224123',
    state: 'Uttar Pradesh',
    gstin: '',
    pan: '',
    serviceablePincodes: ['224123', '224001'],
    categoryInterests: ['Cement and construction materials'],
    brandAuthorizations: '',
    minOrderQuantities: '50 bags cement, 1 bundle rebar, 20 boxes tiles',
    deliveryCapacity: ['tata_ace'],
    wholesaleCatalogNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    supplierId: string;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const togglePincode = (pin: string) => {
    setFormData((prev) => {
      const exists = prev.serviceablePincodes.includes(pin);
      return {
        ...prev,
        serviceablePincodes: exists
          ? prev.serviceablePincodes.filter((p) => p !== pin)
          : [...prev.serviceablePincodes, pin],
      };
    });
  };

  const toggleCategory = (catName: string) => {
    setFormData((prev) => {
      const exists = prev.categoryInterests.includes(catName);
      return {
        ...prev,
        categoryInterests: exists
          ? prev.categoryInterests.filter((c) => c !== catName)
          : [...prev.categoryInterests, catName],
      };
    });
  };

  const toggleFleet = (vehicle: string) => {
    setFormData((prev) => {
      const exists = prev.deliveryCapacity.includes(vehicle);
      return {
        ...prev,
        deliveryCapacity: exists
          ? prev.deliveryCapacity.filter((v) => v !== vehicle)
          : [...prev.deliveryCapacity, vehicle],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessResult(null);

    try {
      const payload = {
        ...formData,
        brandAuthorizations: formData.brandAuthorizations
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean),
      };

      const res = await fetch('/api/supplier/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit supplier registration.');
      }

      setSuccessResult({
        supplierId: data.supplierId,
        message: data.message,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting your application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Breadcrumb & Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-amber-600 transition">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Merchant Onboarding</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Ayodhya Stockist Network
              </span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Partner Supplier & Stockist Onboarding
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Expand your construction supply volume across Ayodhya and Faizabad. Receive verified contractor POs, guaranteed digital settlements, and zero advertising costs.
              </p>
            </div>
            <Link
              href="/supplier"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shrink-0"
            >
              Existing Merchant Login <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Direct Contractor Volume</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Instant orders from active residential and commercial sites in your postal code.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Guaranteed Digital Payouts</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Funds secured before dispatch; 24h bank settlement upon site OTP confirmation.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Zero Inventory Risk</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Only fulfill against confirmed, pre-paid or approved purchase orders.
              </p>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successResult && (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
            <div className="flex items-center gap-2 font-bold text-base text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>Application Submitted Successfully!</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {successResult.message}
            </p>
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs font-mono">
              <span className="text-slate-500">Supplier Reference ID: </span>
              <strong className="text-emerald-900">{successResult.supplierId}</strong>
            </div>
            <div className="text-xs text-emerald-800 flex items-center gap-2 pt-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>
                Our Ayodhya regional verification team will inspect your GSTIN/PAN and physical shop location within 24 hours.
              </span>
            </div>
            <div className="pt-2 flex gap-3">
              <Link
                href="/supplier"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition"
              >
                Go to Supplier Portal Check <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Submission failed:</strong> {errorMessage}
            </div>
          </div>
        )}

        {/* Application Form */}
        {!successResult && (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-8"
          >
            {/* Step 1: Legal & Business Identity */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-black">
                    1
                  </span>
                  Business Identity & Commercial Information
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter registered firm details as documented in your trade license or GST registration.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Awadh Building Materials Mart"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trade / Shop Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Awadh Traders & Stockists"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Authorized Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rakesh Verma (Proprietor / Manager)"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number (For Order Dispatch OTPs) *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[6-9][0-9]{9}"
                    placeholder="10-digit Indian mobile number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Email (For Purchase Orders & Invoicing) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. orders@awadhtraders.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN Number (Optional for micro-enterprises)
                  </label>
                  <input
                    type="text"
                    placeholder="09AAAAA0000A1Z5 (15 characters)"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Permanent Account Number (PAN)
                  </label>
                  <input
                    type="text"
                    placeholder="AAAAA0000A (10 characters)"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Physical Depot / Shop Address */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-black">
                    2
                  </span>
                  Physical Depot / Yard Location
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Where contractor transport vehicles or our dispatch drivers load materials.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shop / Yard Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Plot / Shop No, Road, Locality"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="Near Hanumangarhi Crossing / Tedhi Bazar"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIN Code (Ayodhya District) *
                  </label>
                  <select
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {AYODHYA_REGIONAL_HUBS.map((hub) => (
                      <option key={hub.pincode} value={hub.pincode}>
                        {hub.pincode} - {hub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Serviceable Pincodes & Vehicle Capacity */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-black">
                    3
                  </span>
                  Serviceable Delivery PIN Codes & Logistics Fleet
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select all Ayodhya regional hubs where you can dispatch goods with your own or tied-up vehicles.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Active Serviceable PIN Codes (Select all that apply)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {AYODHYA_REGIONAL_HUBS.map((hub) => {
                    const selected = formData.serviceablePincodes.includes(hub.pincode);
                    return (
                      <button
                        type="button"
                        key={hub.pincode}
                        onClick={() => togglePincode(hub.pincode)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                          selected
                            ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div>{hub.pincode}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{hub.name}</div>
                        </div>
                        {selected && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Transport / Vehicle Fleet Capacity (For Direct Site Unloading)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'three_wheeler_auto', label: '3-Wheeler Auto / Piaggio (0.5 - 1 Ton)' },
                    { id: 'tata_ace', label: 'Tata Ace / Chhota Hathi (1 - 1.5 Tons)' },
                    { id: 'tata_407', label: 'Tata 407 / Eicher (3 - 5 Tons)' },
                    { id: 'tipper_truck', label: '6-Wheeler Tipper / Dumper (10+ Tons)' },
                    { id: 'tractor_trolley', label: 'Tractor Trolley (Aggregates / Sand)' },
                    { id: 'store_pickup_only', label: 'Store / Yard Pickup Only (No Fleet)' },
                  ].map((v) => {
                    const selected = formData.deliveryCapacity.includes(v.id);
                    return (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => toggleFleet(v.id)}
                        className={`p-3 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                          selected
                            ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{v.label}</span>
                        </div>
                        {selected && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 4: Categories, Brands & Wholesale Catalog */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-black">
                    4
                  </span>
                  Product Categories & Brand Authorizations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select building materials categories in your existing stock.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Category Specialties (Select all available)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {SEED_CATEGORIES.map((cat) => {
                    const selected = formData.categoryInterests.includes(cat.name);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategory(cat.name)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                          selected
                            ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {selected && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Dealerships / Authorizations (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UltraTech, Tata Tiscon, Kajaria, Asian Paints, Supreme, Havells"
                  value={formData.brandAuthorizations}
                  onChange={(e) => setFormData({ ...formData, brandAuthorizations: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Standard Minimum Order Quantities (MOQ)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cement: 50 bags; Steel: 500 kg; Tiles: 15 boxes"
                  value={formData.minOrderQuantities}
                  onChange={(e) => setFormData({ ...formData, minOrderQuantities: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wholesale Price List / Stock Overview Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide approximate wholesale rates, payment terms, or typical lead times (e.g. UltraTech PPC: ₹350/bag wholesale, dispatch within 90 minutes across Faizabad/Ayodhya)."
                  value={formData.wholesaleCatalogNotes}
                  onChange={(e) => setFormData({ ...formData, wholesaleCatalogNotes: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Verification Safeguard Notice */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Verification Policy Notice</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                By submitting this application, you confirm that all provided trade documents and physical address details are accurate. Supplier accounts remain in <strong>Pending</strong> status until verified by our regional team. No supplier products or wholesale quotes are published to customers without administrative validation.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Questions? Call Merchant Support: <strong className="text-slate-800">{BRAND_CONFIG.supportPhone}</strong>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition disabled:opacity-50"
              >
                {loading ? 'Submitting Application...' : 'Submit Partner Application'}
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
