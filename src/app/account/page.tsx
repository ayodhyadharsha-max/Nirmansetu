'use client';

import React, { useState, useEffect } from 'react';
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
  Edit2,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Home,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { BRAND_CONFIG } from '@/config/brand';
import { CustomerAddress } from '@/types/database';
import { formatPaiseToRupees } from '@/lib/money';
import { StoredOrderRecord } from '@/lib/orders/service';

export default function AccountPage() {
  const router = useRouter();
  const { user, signOut, signInDemoUser, setUserSession } = useAuth();

  // Profile edit state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [gstin, setGstin] = useState(user?.gstin || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Addresses state
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [newStreet, setNewStreet] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newPincode, setNewPincode] = useState(BRAND_CONFIG.defaultPincode);
  const [newAddressType, setNewAddressType] = useState<'site' | 'residential' | 'commercial'>('site');
  const [newUnloading, setNewUnloading] = useState('');
  const [newTruckAccess, setNewTruckAccess] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Orders state
  const [recentOrders, setRecentOrders] = useState<StoredOrderRecord[]>([]);

  useEffect(() => {
    if (user?.id) {
      setFullName(user.fullName);
      setPhone(user.phone || '');
      setCompanyName(user.companyName || '');
      setGstin(user.gstin || '');

      // Load saved addresses
      setAddressLoading(true);
      fetch(`/api/account/addresses?userId=${encodeURIComponent(user.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.addresses)) {
            setAddresses(data.addresses);
          }
        })
        .finally(() => setAddressLoading(false));

      // Load recent orders
      fetch(`/api/orders?userId=${encodeURIComponent(user.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.orders)) {
            setRecentOrders(data.orders.slice(0, 3));
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    setProfileMessage(null);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          companyName: companyName.trim() || undefined,
          gstin: gstin.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUserSession({
          ...user,
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          companyName: companyName.trim() || undefined,
          gstin: gstin.trim() || undefined,
        });
        setProfileMessage('Profile updated successfully!');
        setTimeout(() => setShowProfileModal(false), 800);
      } else {
        setProfileMessage(data.error || 'Failed to update profile');
      }
    } catch {
      setProfileMessage('Error updating profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAddressError(null);

    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          addressType: newAddressType,
          siteOrPersonName: newSiteName.trim(),
          contactPhone: newPhone.trim(),
          streetAddress: newStreet.trim(),
          landmark: newLandmark.trim() || undefined,
          pincode: newPincode,
          city: 'Ayodhya',
          state: 'Uttar Pradesh',
          unloadingInstructions: newUnloading.trim() || undefined,
          hasTruckAccess: newTruckAccess,
          isDefault: addresses.length === 0,
        }),
      });

      const data = await res.json();
      if (data.success && data.address) {
        setAddresses((prev) => [data.address, ...prev]);
        setShowAddressModal(false);
        setNewSiteName('');
        setNewStreet('');
        setNewLandmark('');
        setNewUnloading('');
      } else {
        setAddressError(data.error || 'Failed to save address');
      }
    } catch {
      setAddressError('Network error saving address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/account/addresses/${addressId}?userId=${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
      });
      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
    } catch {
      // Handled
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/account/addresses/${addressId}/default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === addressId,
        }))
      );
    } catch {
      // Handled
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md w-full shadow-lg space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center mx-auto">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-950">Sign In to View Site Account</h2>
            <p className="text-xs text-slate-500">
              Please sign in with your site credentials to track orders, manage saved jobsite delivery addresses, and download GST tax invoices.
            </p>
            <div className="space-y-2 pt-2">
              <Link
                href="/login"
                className="block w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition shadow-md"
              >
                Sign In to Account
              </Link>
              <button
                onClick={() => signInDemoUser('contractor')}
                className="block w-full py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-950 font-bold text-xs rounded-xl border border-orange-200 transition"
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center text-2xl font-black shadow-md">
                {user.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950">{user.fullName}</h1>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-200">
                    {user.role === 'contractor' ? 'Verified Contractor' : 'Site Owner'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {user.email && <span>{user.email}</span>}
                  {user.phone && <span>Phone: {user.phone}</span>}
                  {user.companyName && <span>Firm: {user.companyName}</span>}
                  {user.gstin && <span className="font-mono text-slate-700">GSTIN: {user.gstin}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-3.5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Profile</span>
              </button>
              <Link
                href="/bulk-enquiry"
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5"
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

          {/* Saved Delivery Addresses Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-950 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-orange-600" />
                  Saved Ayodhya Delivery Sites ({addresses.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Locations available for 1-click checkout and automated dispatch planning.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add New Site
              </button>
            </div>

            {addressLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading saved sites...</div>
            ) : addresses.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                No delivery sites saved yet. Add your site address for fast 1-click checkout.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-2xl border transition relative ${
                      addr.is_default
                        ? 'border-orange-500 bg-orange-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {addr.site_or_person_name}
                          </span>
                          {addr.is_default && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                              Default Site
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{addr.street_address}</p>
                        {addr.landmark && (
                          <p className="text-xs text-slate-400">Near {addr.landmark}</p>
                        )}
                        <p className="text-xs font-semibold text-slate-800 mt-1">
                          Ayodhya, UP - {addr.pincode} • Phone: {addr.contact_phone}
                        </p>
                        {addr.unloading_instructions && (
                          <p className="text-[11px] text-slate-500 italic mt-1">
                            Note: {addr.unloading_instructions}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                        title="Delete address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {!addr.is_default && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                        >
                          Set as Default Site
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <span>View All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                No orders placed yet. Explore materials to place your first site order.
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="block p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/10 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900">{order.order_number}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          PIN {order.pincode} • {order.items.length} line items • Dropoff OTP: {order.delivery_otp_plain || '****'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-base text-slate-900">{formatPaiseToRupees(order.total_paise)}</span>
                        <div className="text-[11px] text-slate-400 capitalize">{order.payment_method}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile Edit Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="font-bold text-base text-slate-900 mb-2">Edit Customer Profile</h3>
              <p className="text-xs text-slate-500 mb-4">
                Update your contact details and GSTIN for automated commercial invoicing.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Firm Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono uppercase"
                  />
                </div>

                {profileMessage && <p className="text-xs text-blue-600">{profileMessage}</p>}

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Address Add Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="font-bold text-base text-slate-900 mb-1">Add Jobsite Delivery Address</h3>
              <p className="text-xs text-slate-500 mb-4">
                Saved sites are automatically validated against approved Ayodhya delivery corridors.
              </p>

              <form onSubmit={handleAddAddress} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Site / Receiver Name *</label>
                    <input
                      type="text"
                      value={newSiteName}
                      onChange={(e) => setNewSiteName(e.target.value)}
                      placeholder="e.g. Ramkot Site #3"
                      required
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Site Contact Phone *</label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      required
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Street / Plot Address *</label>
                  <textarea
                    rows={2}
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="Full street address and plot description"
                    required
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Landmark</label>
                    <input
                      type="text"
                      value={newLandmark}
                      onChange={(e) => setNewLandmark(e.target.value)}
                      placeholder="Near landmark"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ayodhya PIN Code *</label>
                    <select
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="224123">224123 - Ayodhya Dham (Ramkot)</option>
                      <option value="224001">224001 - Faizabad Urban / Civil Lines</option>
                      <option value="224133">224133 - Darshannagar Industrial Hub</option>
                      <option value="224122">224122 - Sohawal Highway Cluster</option>
                      <option value="224229">224229 - Bikapur Construction Zone</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unloading Instructions</label>
                  <input
                    type="text"
                    value={newUnloading}
                    onChange={(e) => setNewUnloading(e.target.value)}
                    placeholder="e.g. Narrow lane, unload near foundation pit"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="truckAccessNew"
                    checked={newTruckAccess}
                    onChange={(e) => setNewTruckAccess(e.target.checked)}
                    className="w-3.5 h-3.5 text-orange-600 rounded"
                  />
                  <label htmlFor="truckAccessNew" className="text-xs text-slate-700">
                    Site has clearance for commercial delivery tippers and trucks
                  </label>
                </div>

                {addressError && <p className="text-xs text-red-600">{addressError}</p>}

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
