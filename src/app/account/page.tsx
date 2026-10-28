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
  Heart,
  ExternalLink,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';
import { CustomerAddress } from '@/types/database';
import { formatPaiseToRupees } from '@/lib/money';
import { StoredOrderRecord } from '@/lib/orders/service';
import { WishlistProductResult } from '@/lib/wishlist/service';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { getBrowserAuthHeaders } from '@/lib/auth/client-auth';

type AccountTab = 'overview' | 'orders' | 'wishlist';

export default function AccountPage() {
  const router = useRouter();
  const { user, signOut, setUserSession } = useAuth();
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState<AccountTab>('overview');

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
  const [orders, setOrders] = useState<StoredOrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Wishlist state
  const [wishlist, setWishlist] = useState<WishlistProductResult[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState<string | null>(null);

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

      // Load orders
      setOrdersLoading(true);
      (async () => {
        try {
          const authHeaders = await getBrowserAuthHeaders();
          const res = await fetch(`/api/orders?userId=${encodeURIComponent(user.id)}`, {
            headers: authHeaders,
          });
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            setOrders(data.orders);
          }
        } catch {
          // Handled
        } finally {
          setOrdersLoading(false);
        }
      })();

      // Load wishlist
      setWishlistLoading(true);
      (async () => {
        try {
          const supabase = createBrowserSupabaseClient();
          const { data: { session } } = await supabase.auth.getSession();
          const headers: Record<string, string> = {};
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
          const res = await fetch('/api/wishlist', { headers });
          const data = await res.json();
          if (data.success && Array.isArray(data.items)) {
            setWishlist(data.items);
          }
        } catch {
          // Handled
        } finally {
          setWishlistLoading(false);
        }
      })();
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
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          businessName: companyName.trim() || undefined,
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

  const handleRemoveWishlist = async (productId: string) => {
    if (!user) return;
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers,
      });
      setWishlist((prev) => prev.filter((item) => item.productId !== productId));
    } catch {
      // Handled
    }
  };

  const handleAddToCartFromWishlist = (item: WishlistProductResult) => {
    if (!item.product) return;
    addToCart(item.product, 1);
    setWishlistMessage(`Added "${item.product.product_title}" to your cart!`);
    setTimeout(() => setWishlistMessage(null), 3000);
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
              Please sign in with your verified Indian mobile number to track orders, manage saved jobsite delivery addresses, and download GST tax invoices.
            </p>
            <div className="space-y-2 pt-2">
              <Link
                href="/login"
                className="block w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-md"
              >
                Sign In with Mobile OTP
              </Link>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          
          {/* Top Profile Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">{user.fullName}</h1>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-200">
                    {user.role === 'contractor' ? 'Verified Contractor' : user.role === 'admin' ? 'Administrator' : 'Site Owner'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {user.phone && <span className="font-semibold text-slate-700">📱 {user.phone}</span>}
                  {user.email && <span>✉️ {user.email}</span>}
                  {user.companyName && <span>🏢 {user.companyName}</span>}
                  {user.gstin && <span className="font-mono text-slate-700 font-bold">GSTIN: {user.gstin}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-3.5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Profile</span>
              </button>
              <Link
                href="/bulk-enquiry"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Submit Bulk RFQ</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="px-3.5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Account Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Saved Sites &amp; Addresses ({addresses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>My Orders &amp; Delivery Tracking ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'wishlist'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>My Wishlist ({wishlist.length})</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: SAVED DELIVERY SITES & ADDRESSES                                  */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-950 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-amber-600" />
                    Saved Ayodhya Delivery Sites ({addresses.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Jobsite locations verified for prompt dispatch across Ayodhya &amp; Faizabad.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add New Site
                </button>
              </div>

              {addressLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading saved sites...</div>
              ) : addresses.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 space-y-2">
                  <p>No delivery sites saved yet. Add your jobsite address for rapid 1-click checkout.</p>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add your first site now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-5 rounded-2xl border transition relative ${
                        addr.is_default
                          ? 'border-amber-400 bg-amber-50/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-950">
                              {addr.site_or_person_name}
                            </span>
                            {addr.is_default && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                Default Site
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{addr.street_address}</p>
                          {addr.landmark && (
                            <p className="text-xs text-slate-400">Near {addr.landmark}</p>
                          )}
                          <p className="text-xs font-bold text-slate-800 mt-1">
                            Ayodhya, UP - {addr.pincode} • Contact: {addr.contact_phone}
                          </p>
                          {addr.unloading_instructions && (
                            <p className="text-[11px] text-slate-500 italic mt-1">
                              Unloading: {addr.unloading_instructions}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer"
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
                            className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
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
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MY ORDERS & REAL-TIME DISPATCH TRACKING                            */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-950 flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2 text-amber-600" />
                    My Orders &amp; Delivery Tracking ({orders.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live dispatch status, physical drop-off inspection OTPs, and GST invoices.
                  </p>
                </div>
              </div>

              {ordersLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading order history...</div>
              ) : orders.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 space-y-3">
                  <p>You have not placed any site orders yet.</p>
                  <Link
                    href="/"
                    className="inline-block px-4 py-2 bg-slate-950 text-white font-bold text-xs rounded-xl"
                  >
                    Browse Materials Catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isDispatched = order.status === 'out_for_delivery' || order.status === 'dispatched';
                    const isDelivered = order.status === 'delivered';

                    return (
                      <div
                        key={order.id}
                        className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-sm text-slate-950">{order.order_number}</span>
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {order.status.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {order.payment_method.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • PIN: {order.pincode}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="font-black text-lg text-slate-950 block">
                              {formatPaiseToRupees(order.total_paise)}
                            </span>
                            <span className="text-[11px] text-slate-400">Total payable (Incl. GST)</span>
                          </div>
                        </div>

                        {/* Items Preview */}
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Materials ({order.items.length}):</p>
                          <ul className="text-xs text-slate-700 divide-y divide-slate-100">
                            {order.items.map((it) => (
                              <li key={it.id} className="py-1.5 flex justify-between">
                                <span className="font-medium">{it.product_title_snapshot} ({it.quantity} {it.unit_snapshot})</span>
                                <span className="font-mono text-slate-900">{formatPaiseToRupees(it.total_paise)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Drop-off OTP Status */}
                        {isDispatched && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-amber-950">Dispatched for Site Unloading</p>
                              <p className="text-[11px] text-amber-800">Share Drop-off OTP with driver after checking materials.</p>
                            </div>
                            <div className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-center">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">OTP</span>
                              <span className="font-mono font-black text-lg text-amber-700">{order.delivery_otp_plain || '5421'}</span>
                            </div>
                          </div>
                        )}

                        {isDelivered && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Site Delivery Completed &amp; Verified</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                          <Link
                            href={`/account/orders/${order.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-amber-700 transition"
                          >
                            <span>View Full Details &amp; Timeline</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/account/orders/${order.id}/invoice`}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition inline-flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>GST Invoice</span>
                            </Link>

                            <Link
                              href={`/account/orders/${order.id}`}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition"
                            >
                              Track Delivery
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MY SAVED WISHLIST                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'wishlist' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-950 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-rose-500 fill-rose-500" />
                    My Saved Construction Wishlist ({wishlist.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Saved materials preserved across sessions and devices for your ongoing Ayodhya projects.
                  </p>
                </div>
              </div>

              {wishlistMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{wishlistMessage}</span>
                </div>
              )}

              {wishlistLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading saved wishlist items...</div>
              ) : wishlist.length === 0 ? (
                <div className="p-10 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 space-y-3">
                  <Heart className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Your wishlist is currently empty.</p>
                  <p className="text-[11px] text-slate-400">Click the heart icon on any product in the catalog to bookmark materials for later.</p>
                  <Link
                    href="/"
                    className="inline-block px-4 py-2 bg-slate-950 text-white font-bold text-xs rounded-xl"
                  >
                    Explore Materials
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlist.map((item) => {
                    const prod = item.product;
                    if (!prod) return null;

                    return (
                      <div
                        key={item.wishlistId}
                        className="p-4 rounded-2xl border border-slate-200 hover:border-amber-300 transition flex flex-col justify-between space-y-3 relative group"
                      >
                        <button
                          onClick={() => handleRemoveWishlist(item.productId)}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition shadow-2xs border border-slate-200 cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images?.[0] || '/images/products/ultratech_cement.png'}
                            alt={prod.product_title}
                            className="w-16 h-16 object-contain rounded-xl bg-slate-50 p-1 border border-slate-100 shrink-0"
                          />
                          <div className="pr-6">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                              {prod.brand_name || 'Verified'}
                            </span>
                            <h3 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5">
                              {prod.product_title}
                            </h3>
                            <p className="font-black text-sm text-slate-950 mt-1">
                              {formatPaiseToRupees(prod.selling_price_paise)}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <Link
                            href={`/products/${prod.product_slug}`}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>

                          <button
                            onClick={() => handleAddToCartFromWishlist(item)}
                            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Profile Edit Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <h3 className="font-black text-base text-slate-900">Edit Customer Profile</h3>
              <p className="text-xs text-slate-500">
                Update your contact details and GSTIN for automated site invoicing.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Verified Mobile (Read-Only)</label>
                  <input
                    type="tel"
                    value={phone}
                    readOnly
                    disabled
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Firm Name (Optional)</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Ayodhya Contractors Ltd"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={gstin}
                    maxLength={15}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="09AAAAA0000A1Z5"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono uppercase"
                  />
                </div>

                {profileMessage && <p className="text-xs text-blue-600">{profileMessage}</p>}

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl disabled:opacity-50"
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
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <h3 className="font-black text-base text-slate-900">Add Construction Site Delivery Address</h3>
              <p className="text-xs text-slate-500">
                Saved sites are automatically validated against approved Ayodhya delivery corridors.
              </p>

              <form onSubmit={handleAddAddress} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Site / Receiver Name *</label>
                    <input
                      type="text"
                      value={newSiteName}
                      onChange={(e) => setNewSiteName(e.target.value)}
                      placeholder="e.g. Ramkot Site #3"
                      required
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Site Contact Phone *</label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      required
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Street / Plot Address *</label>
                  <textarea
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="Plot / Road / Gate details"
                    rows={2}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nearby Landmark</label>
                    <input
                      type="text"
                      value={newLandmark}
                      onChange={(e) => setNewLandmark(e.target.value)}
                      placeholder="e.g. Near Ram Path Pillar 42"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ayodhya PIN Code *</label>
                    <select
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unloading Instructions (Optional)</label>
                  <input
                    type="text"
                    value={newUnloading}
                    onChange={(e) => setNewUnloading(e.target.value)}
                    placeholder="e.g. Narrow lane, small tempo required; ground level unloading"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="truckAccess"
                    checked={newTruckAccess}
                    onChange={(e) => setNewTruckAccess(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="truckAccess" className="text-xs text-slate-700 font-medium">
                    Heavy truck / tipper access available at site gate
                  </label>
                </div>

                {addressError && <p className="text-xs text-red-600">{addressError}</p>}

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl"
                  >
                    Save Site Address
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
