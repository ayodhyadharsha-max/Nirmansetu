'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, CheckCircle2, AlertCircle, Building, Loader2 } from 'lucide-react';
import { AYODHYA_REGIONAL_HUBS } from '@/config/brand';

interface BulkEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItems?: Array<{ title: string; approxQty: number; unit: string }>;
}

export const BulkEnquiryModal: React.FC<BulkEnquiryModalProps> = ({
  isOpen,
  onClose,
  initialItems = [],
}) => {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [projectType, setProjectType] = useState<
    'residential_house' | 'commercial_complex' | 'hotel_ashram' | 'temple_infrastructure' | 'government_contract' | 'renovation'
  >('residential_house');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [pincode, setPincode] = useState('224123');
  const [materialRequirements, setMaterialRequirements] = useState(
    initialItems.length > 0
      ? initialItems.map((i) => `• ${i.title}: ${i.approxQty} ${i.unit}`).join('\n')
      : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; enquiryNumber?: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName,
          contactPhone,
          contactEmail: contactEmail || undefined,
          companyOrFirmName: companyName || undefined,
          gstin: gstin || undefined,
          projectType,
          projectTitle: projectTitle || 'Ayodhya Project Construction',
          projectAddress: projectAddress || 'Ayodhya Construction Site',
          pincode,
          materialRequirements: materialRequirements || 'Bulk cement, steel, bricks quotation required.',
          structuredItems: initialItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry');
      }

      setSubmitResult({
        success: true,
        message: data.message || 'Quotation submitted successfully.',
        enquiryNumber: data.enquiryNumber,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      setSubmitResult({ success: false, message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">
                Commercial Site & Bulk RFQ Quotation
              </h3>
              <p className="text-xs text-slate-500">
                Direct wholesale rates from Ayodhya partner stockists
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition"
          >
            ✕
          </button>
        </div>

        {submitResult ? (
          <div className="py-8 text-center space-y-4">
            {submitResult.success ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-black text-slate-950">Quotation Request Received!</h4>
                <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                  Reference: {submitResult.enquiryNumber}
                </div>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  {submitResult.message}
                </p>
                <div className="pt-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-slate-950 text-amber-400 font-bold rounded-xl text-xs sm:text-sm"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-950">Submission Error</h4>
                <p className="text-xs text-red-600">{submitResult.message}</p>
                <button
                  onClick={() => setSubmitResult(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Singh"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Site Contact Mobile (10-Digit) *
                </label>
                <input
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  placeholder="9450012345"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Firm / Company / Ashram Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Awadh Infra Builders"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GSTIN (For 18%/28% Tax Credit)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="09AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Type *
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="residential_house">Residential Independent House</option>
                  <option value="commercial_complex">Commercial Complex / Mall</option>
                  <option value="hotel_ashram">Hotel / Ashram / Dharamshala</option>
                  <option value="temple_infrastructure">Temple Infrastructure Project</option>
                  <option value="government_contract">Government / PWD Civil Contract</option>
                  <option value="renovation">Renovation & Structural Expansion</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ayodhya Site Pincode *
                </label>
                <select
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {AYODHYA_REGIONAL_HUBS.map((hub) => (
                    <option key={hub.pincode} value={hub.pincode}>
                      {hub.pincode} - {hub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Name & Exact Site Address *
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Hotel Janak Palace site, Near Naya Ghat bypass, Ayodhya Dham"
                value={projectAddress}
                onChange={(e) => setProjectAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                List Required Materials & Approximate Quantities *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. 500 bags UltraTech PPC Cement, 6 tons 12mm Tata Tiscon steel, 20,000 red bricks, 50 cans Dr. Fixit LW+"
                value={materialRequirements}
                onChange={(e) => setMaterialRequirements(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-400 text-amber-400 font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting to Ayodhya Operations Desk...</span>
                  </>
                ) : (
                  <span>Submit RFQ for Wholesale Pricing</span>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
