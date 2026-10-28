'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  MapPin,
  Search,
  Building2,
  Phone,
  Calculator,
  FileSpreadsheet,
  User,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Building,
  Layers,
  PaintBucket,
  Zap,
  Wrench,
  Droplet,
  FolderTree,
  Hammer,
  Home,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';
import { SEED_CATEGORIES } from '@/lib/catalog/seed-data';
import { useAuth } from '@/context/AuthContext';
import { CATEGORY_GROUPS } from './CategoryNav';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPincode: string;
  onOpenPincodeModal: () => void;
  onOpenCalculator: () => void;
  onOpenEnquiry: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'cement-construction-materials': <Building className="w-4 h-4 text-amber-600" />,
  'tiles-flooring': <Layers className="w-4 h-4 text-amber-600" />,
  'paints-primers-putty': <PaintBucket className="w-4 h-4 text-amber-600" />,
  'electrical-products': <Zap className="w-4 h-4 text-amber-600" />,
  'plumbing-pipes-fittings': <Wrench className="w-4 h-4 text-amber-600" />,
  'sanitaryware-bathroom-fittings': <Droplet className="w-4 h-4 text-amber-600" />,
  'plywood-mdf-laminates': <FolderTree className="w-4 h-4 text-amber-600" />,
  'hardware-tools-fasteners': <Hammer className="w-4 h-4 text-amber-600" />,
  'kitchen-home-improvement': <Home className="w-4 h-4 text-amber-600" />,
};

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  selectedPincode,
  onOpenPincodeModal,
  onOpenCalculator,
  onOpenEnquiry,
}) => {
  const { user } = useAuth();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const currentHub =
    AYODHYA_REGIONAL_HUBS.find((h) => h.pincode === selectedPincode) || AYODHYA_REGIONAL_HUBS[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xs sm:max-w-sm h-full shadow-2xl flex flex-col border-r border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-950 text-base block leading-tight">
                {BRAND_CONFIG.name}
              </span>
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                {BRAND_CONFIG.city}
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Location / Pincode Bar */}
        <div className="p-3 bg-amber-50/60 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-500 font-medium">Delivering To</div>
              <div className="text-xs font-bold text-slate-900 truncate">
                PIN {selectedPincode} ({currentHub.name.replace(' Hub', '')})
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenPincodeModal();
            }}
            className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline shrink-0 px-2 py-1"
          >
            Change
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          
          {/* Quick Account Status */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 truncate">{user.fullName}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                    {user.role === 'contractor' ? 'Verified Contractor' : 'Customer'}
                  </div>
                </div>
                <Link
                  href="/account"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-slate-900 text-amber-400 text-xs font-bold rounded-lg"
                >
                  Account
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Ayodhya Site Account</div>
                  <div className="text-[10px] text-slate-500">Track orders & GST invoicing</div>
                </div>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg shadow-2xs"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Quick Tools: Site Estimator & Bulk RFQ */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenCalculator();
              }}
              className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 flex flex-col items-center justify-center text-center transition cursor-pointer"
            >
              <Calculator className="w-5 h-5 text-amber-600 mb-1" />
              <span className="text-xs font-bold text-slate-900">Site Estimator</span>
              <span className="text-[9px] text-slate-500">Calculate materials</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenEnquiry();
              }}
              className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 flex flex-col items-center justify-center text-center transition cursor-pointer"
            >
              <FileSpreadsheet className="w-5 h-5 text-amber-600 mb-1" />
              <span className="text-xs font-bold text-slate-900">Bulk RFQ</span>
              <span className="text-[9px] text-slate-500">Full truckloads</span>
            </button>
          </div>

          {/* Touch-Friendly Category Accordion (Responsive Mobile Navigation) */}
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
              <span>Categories &amp; Submenus</span>
              <span className="text-[10px] font-bold text-amber-600">6 Groups</span>
            </div>
            
            <div className="space-y-1.5">
              {CATEGORY_GROUPS.map((group) => {
                const isExpanded = expandedGroup === group.label;
                return (
                  <div
                    key={group.label}
                    className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
                      className="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 text-left bg-white hover:bg-slate-50 transition"
                      aria-expanded={isExpanded}
                    >
                      <span className="text-xs font-bold text-slate-900">{group.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-amber-600' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="bg-slate-50/80 px-2 py-2 space-y-1 border-t border-slate-100">
                        {group.subcategories.map((sub) => (
                          <Link
                            key={sub.name}
                            href={sub.slug === 'search' ? '/search' : `/categories/${sub.slug}`}
                            onClick={onClose}
                            className="min-h-[40px] flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:text-amber-950 hover:bg-amber-100/60 rounded-lg transition"
                          >
                            <span>{sub.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </Link>
                        ))}
                        <Link
                          href={`/categories/${group.primaryCategorySlug}`}
                          onClick={onClose}
                          className="min-h-[36px] flex items-center justify-between px-3 py-2 text-xs font-bold text-amber-700 hover:text-amber-800 border-t border-slate-200/60 mt-1 transition"
                        >
                          <span>Explore all {group.label}</span>
                          <span>→</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Link to All 9 Database Catalog Categories */}
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              All Materials (9)
            </div>
            <div className="grid grid-cols-1 gap-1">
              {SEED_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 text-slate-700 text-xs font-medium transition"
                >
                  <div className="flex items-center gap-2">
                    {CATEGORY_ICONS[cat.slug] || <Building className="w-4 h-4 text-amber-600" />}
                    <span>{cat.name}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>

          {/* Customer Service & Policies */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <Link
              href="/about"
              onClick={onClose}
              className="block py-1 text-slate-600 hover:text-slate-950 font-medium"
            >
              About NirmanSetu Ayodhya
            </Link>
            <Link
              href="/shipping"
              onClick={onClose}
              className="block py-1 text-slate-600 hover:text-slate-950 font-medium"
            >
              Site Delivery &amp; Unloading Policy
            </Link>
            <Link
              href="/returns"
              onClick={onClose}
              className="block py-1 text-slate-600 hover:text-slate-950 font-medium"
            >
              Material Inspection &amp; Returns
            </Link>
            <Link
              href="/contact"
              onClick={onClose}
              className="block py-1 text-slate-600 hover:text-slate-950 font-medium"
            >
              Contact &amp; Hub Directory
            </Link>

            <div className="pt-2 flex flex-col gap-1.5">
              <Link
                href="/supplier"
                onClick={onClose}
                className="flex items-center gap-2 p-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Supplier Fulfilment Hub</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Drawer Footer with Direct Helpline */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <a
            href={`tel:${BRAND_CONFIG.supportPhone.replace(/\s+/g, '')}`}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Site Helpline ({BRAND_CONFIG.supportPhone})</span>
          </a>
        </div>

      </div>
    </div>
  );
};
