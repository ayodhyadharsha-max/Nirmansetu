'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  Loader2,
  AlertCircle,
  Phone,
  Sparkles,
  ArrowRight,
  MessageCircle,
  HardHat,
  Compass,
  Palette,
  Home,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';
import { buildWhatsAppClickToChatUrl } from '@/lib/notifications/whatsapp-link';

type PersonaType = 'contractor' | 'builder' | 'architect' | 'interior_designer' | 'homeowner';

export default function BulkEnquiryPage() {
  const { user } = useAuth();
  const { selectedPincode } = useCart();

  const [persona, setPersona] = useState<PersonaType>('contractor');
  const [contactName, setContactName] = useState(user?.fullName || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [gstin, setGstin] = useState(user?.gstin || '');
  const [projectType, setProjectType] = useState<
    'residential' | 'commercial' | 'infrastructure' | 'hospitality'
  >('commercial');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [pincode, setPincode] = useState(selectedPincode);
  const [materialRequirements, setMaterialRequirements] = useState('');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');

  // Selected quick materials
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([
    'Cement (10+ Metric Tons)',
    'TMT Rebars Fe 550D (Truckload)',
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rfqReceipt, setRfqReceipt] = useState<{
    enquiryNumber: string;
    message: string;
  } | null>(null);

  const handlePersonaChange = (newPersona: PersonaType) => {
    setPersona(newPersona);
    if (newPersona === 'contractor') {
      setSelectedMaterials(['Cement (10+ Metric Tons)', 'TMT Rebars Fe 550D (Truckload)', 'Red Kiln Bricks (4,000+ Pcs)']);
      setProjectType('commercial');
    } else if (newPersona === 'builder') {
      setSelectedMaterials(['Cement (10+ Metric Tons)', 'TMT Rebars Fe 550D (Truckload)', 'Structural Waterproofing Chemicals']);
      setProjectType('commercial');
    } else if (newPersona === 'architect') {
      setSelectedMaterials(['TMT Rebars Fe 550D (Truckload)', 'Vitrified Tiles (1,000+ Sq Ft)', 'CPVC/UPVC Pipes (Full Lot)']);
      setProjectType('infrastructure');
    } else if (newPersona === 'interior_designer') {
      setSelectedMaterials(['Vitrified Tiles (1,000+ Sq Ft)', 'Structural Waterproofing Chemicals', 'CPVC/UPVC Pipes (Full Lot)']);
      setProjectType('residential');
    } else {
      setSelectedMaterials(['Cement (10+ Metric Tons)', 'Red Kiln Bricks (4,000+ Pcs)']);
      setProjectType('residential');
    }
  };

  const toggleMaterial = (mat: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!contactName.trim() || !contactPhone.trim() || !projectAddress.trim()) {
      setErrorMessage('Please fill in your name, contact phone number, and site address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const allRequirements = [
        ...selectedMaterials,
        materialRequirements.trim(),
      ]
        .filter(Boolean)
        .join('; ');

      const payload = {
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim() || undefined,
        companyOrFirmName: companyName.trim() || undefined,
        gstin: gstin.trim() || undefined,
        projectType,
        projectTitle: projectTitle.trim() || 'Ayodhya Site Project',
        projectAddress: projectAddress.trim(),
        pincode: pincode.trim() || selectedPincode,
        materialRequirements: allRequirements || 'Full truckload procurement inquiry',
        targetDeliveryDate: targetDeliveryDate || undefined,
      };

      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit RFQ');
      }

      setRfqReceipt({
        enquiryNumber: data.enquiryNumber || 'RFQ-AYD-20261018-001',
        message: data.message || 'RFQ received by Ayodhya operations team.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting bulk enquiry';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Page Banner */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Contractor & Bulk Procurement Desk</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Direct Wholesale Material Pricing for Ayodhya Projects
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Procuring 10+ tons of cement, trailer loads of TMT rebar, or bulk tiles for hotels, ashrams, or commercial infrastructure? Get tiered contractor pricing sourced directly from approved distributors.
            </p>
          </div>

          {rfqReceipt ? (
            /* RFQ Success View */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xl space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Request Confirmed
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mt-3">
                  Quotation Request Received!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
                  Our Ayodhya supplier accounts manager will contact you with wholesale pricing within 2 operating hours.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">RFQ Reference:</span>
                  <span className="font-mono font-black text-slate-900">{rfqReceipt.enquiryNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Target Area:</span>
                  <span className="font-bold text-slate-900">PIN {pincode} (Ayodhya District)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Response SLA:</span>
                  <span className="font-bold text-emerald-700">Within 120 Minutes</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={buildWhatsAppClickToChatUrl(
                    BRAND_CONFIG.supportPhone,
                    `Hello NirmanSetu Ayodhya, I have submitted Bulk RFQ ${rfqReceipt.enquiryNumber} for my construction site in PIN ${pincode}. Please share distributor wholesale rates.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition inline-flex items-center justify-center gap-2 shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Connect with Accounts Manager on WhatsApp</span>
                </a>
                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 py-3 bg-slate-950 text-amber-400 font-extrabold text-xs sm:text-sm rounded-xl hover:bg-slate-800 transition inline-block shadow-md text-center"
                >
                  Return to Storefront
                </Link>
              </div>
            </div>
          ) : (
            /* Bulk RFQ Form */
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xl space-y-6">
              
              {/* Persona Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2.5">
                  Select Your Project Persona / Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {[
                    { id: 'contractor', label: 'Contractor (ठेकेदार)', icon: HardHat },
                    { id: 'builder', label: 'Builder / Developer', icon: Building },
                    { id: 'architect', label: 'Architect / Engineer', icon: Compass },
                    { id: 'interior_designer', label: 'Interior Designer', icon: Palette },
                    { id: 'homeowner', label: 'Homeowner (अपना घर)', icon: Home },
                  ].map((p) => {
                    const Icon = p.icon;
                    const isSelected = persona === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePersonaChange(p.id as PersonaType)}
                        className={`p-3 rounded-xl border text-center font-bold transition flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                        <span className="text-[11px] leading-tight">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Quick Material Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2.5">
                    1. Select Required Bulk Materials
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      'Cement (10+ Metric Tons)',
                      'TMT Rebars Fe 550D (Truckload)',
                      'Red Kiln Bricks (4,000+ Pcs)',
                      'Vitrified Tiles (1,000+ Sq Ft)',
                      'CPVC/UPVC Pipes (Full Lot)',
                      'Structural Waterproofing Chemicals',
                    ].map((mat) => {
                      const isSelected = selectedMaterials.includes(mat);
                      return (
                        <button
                          key={mat}
                          type="button"
                          onClick={() => toggleMaterial(mat)}
                          className={`p-3 rounded-xl border text-left font-bold transition flex items-center justify-between ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-500'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{mat}</span>
                          {isSelected && <span className="text-amber-600 text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Detailed Quantities / Specs */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Specific Quantities & Grades
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 200 Bags UltraTech PPC, 5 Tons 12mm Tata Tiscon 550D, 12,000 Red Bricks delivered to Naya Ghat site."
                    value={materialRequirements}
                    onChange={(e) => setMaterialRequirements(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* 3. Site Location & Timeline */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    3. Site Location & Schedule
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Project / Site Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ayodhya Riverfront Resort & Hotel"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Project Type
                      </label>
                      <select
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                      >
                        <option value="commercial">Commercial / Hotel / Retail</option>
                        <option value="residential">Residential Villa / Multi-Story</option>
                        <option value="hospitality">Ashram / Dharamshala / Trust Project</option>
                        <option value="infrastructure">Infrastructure / Roadwork</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Site Street Address in Ayodhya *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Plot No / Near Temple Corridor / Road"
                        value={projectAddress}
                        onChange={(e) => setProjectAddress(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Postal PIN Code *
                      </label>
                      <select
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                      >
                        {AYODHYA_REGIONAL_HUBS.map((h) => (
                          <option key={h.pincode} value={h.pincode}>
                            {h.pincode} - {h.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expected First Delivery Date
                    </label>
                    <input
                      type="date"
                      value={targetDeliveryDate}
                      onChange={(e) => setTargetDeliveryDate(e.target.value)}
                      className="w-full sm:w-auto px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                </div>

                {/* 4. Contact & Contractor Info */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    4. Contact & Billing Information
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ramesh Chandra"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile Number (For Quotation WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="9450012345"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Company / Contractor Firm Name
                      </label>
                      <input
                        type="text"
                        placeholder="Chandra Builders Pvt Ltd"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        GSTIN (For 100% Tax Invoicing & ITC)
                      </label>
                      <input
                        type="text"
                        placeholder="09AAACS1429B1ZB"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-400 text-amber-400 font-black text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting to Ayodhya Operations Desk...</span>
                    </>
                  ) : (
                    <span>Submit Request for Wholesale Quotation (RFQ)</span>
                  )}
                </button>

                <p className="text-[11px] text-slate-500 text-center">
                  Direct partnership sourcing from authorized stockists. Original mill test certificates provided for all cement and steel deliveries.
                </p>

              </form>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
