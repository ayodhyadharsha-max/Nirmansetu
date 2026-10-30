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
  FolderTree,
  ShieldAlert,
  Plus,
  Lock,
  Unlock,
  UserX,
  UserCheck,
  Heart,
} from 'lucide-react';
import { BRAND_CONFIG, AYODHYA_REGIONAL_HUBS } from '@/config/brand';
import { SEED_PRODUCTS, SEED_CATEGORIES, SEED_BRANDS } from '@/lib/catalog/seed-data';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPaiseToRupees } from '@/lib/money';

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
    'overview' | 'fulfillment' | 'quotations' | 'orders' | 'customers' | 'categories' | 'suppliers' | 'pincodes' | 'products' | 'wishlist' | 'reports' | 'audit'
  >('overview');

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categorySubTab, setCategorySubTab] = useState<'categories' | 'brands'>('categories');
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    defaultGstRatePct: 18,
  });

  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [newBrand, setNewBrand] = useState({
    name: '',
    slug: '',
    description: '',
    originCountry: 'India',
    logoUrl: '',
  });

  const [wishlistReport, setWishlistReport] = useState<any | null>(null);

  const [productsList, setProductsList] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    brandName: '',
    categorySlug: 'cement-construction-materials',
    categoryName: 'Cement & Construction Materials',
    sellingPriceRupees: '',
    mrpRupees: '',
    unit: 'Bag (50 Kg)',
    minOrderQuantity: 1,
    gstRatePct: 28,
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [pincodes, setPincodes] = useState<any[]>([]);
  const [serviceZones, setServiceZones] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Authentication & Session state
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Modal states for fulfillment actions
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any | null>(null);
  const [selectedOrderForPo, setSelectedOrderForPo] = useState<any | null>(null);
  const [poSupplierId, setPoSupplierId] = useState('f0000000-0000-0000-0000-000000000001');

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
  const [reassignSupplierId, setReassignSupplierId] = useState('f0000000-0000-0000-0000-000000000002');
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

  const getEffectiveHeaders = () => {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
  };

  // Auth gate check
  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setAuthChecking(false);
      }
    }, 1500);

    async function checkAdminAuth() {
      setAuthChecking(true);
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (isMounted) {
            setAuthError('Authentication required. You must sign in with an authorized Administrator account.');
            setAuthChecking(false);
          }
          return;
        }

        if (isMounted) {
          setAccessToken(session.access_token);
          setCurrentUser(session.user);
        }

        // Fetch user profile to check role
        const profileRes = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const profileData = await profileRes.json();
        const role = profileData?.profile?.role || (session.user.user_metadata as any)?.role || 'customer';
        if (isMounted) {
          setUserRole(role);
          if (role !== 'admin') {
            setAuthError(`Access Restricted (403): Your account (${session.user.phone || session.user.email}) is registered as '${role}'. Only verified Administrators can access the operations dashboard.`);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setAuthError(err.message || 'Failed to verify administrator status');
        }
      } finally {
        if (isMounted) {
          setAuthChecking(false);
        }
      }
    }

    checkAdminAuth();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const headers = getEffectiveHeaders();

      // 1. Metrics
      const resMetrics = await fetch('/api/admin/metrics', { headers });
      const dataMetrics = await resMetrics.json();
      if (dataMetrics.success) setMetrics(dataMetrics.metrics);

      // 2. Orders
      const resOrders = await fetch('/api/admin/orders', { headers });
      const dataOrders = await resOrders.json();
      if (dataOrders.success) setOrders(dataOrders.orders || []);

      // 3. Customers
      const resCustomers = await fetch('/api/admin/customers', { headers });
      const dataCustomers = await resCustomers.json();
      if (dataCustomers.success) setCustomers(dataCustomers.customers || []);

      // 4. Categories
      const resCategories = await fetch('/api/admin/categories', { headers });
      const dataCategories = await resCategories.json();
      if (dataCategories.success) setCategories(dataCategories.categories || []);

      // 5. Products
      const resProducts = await fetch('/api/admin/products', { headers });
      const dataProducts = await resProducts.json();
      if (dataProducts.success) setProductsList(dataProducts.products || []);

      // 6. Suppliers
      const resSuppliers = await fetch('/api/admin/suppliers', { headers });
      const dataSuppliers = await resSuppliers.json();
      if (dataSuppliers.success) setSuppliers(dataSuppliers.suppliers || []);

      // 7. Service Zones & Pincodes
      const resZones = await fetch('/api/admin/serviceability', { headers });
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

      // 8. Bulk Enquiries
      const resEnquiries = await fetch('/api/admin/enquiries', { headers });
      const dataEnquiries = await resEnquiries.json();
      if (dataEnquiries.success) setEnquiries(dataEnquiries.enquiries || []);

      // 9. Quotations
      const resQuotes = await fetch('/api/quotations', { headers });
      const dataQuotes = await resQuotes.json();
      if (dataQuotes.success) setQuotations(dataQuotes.quotations || []);

      // 10. Audit Logs
      const resAudit = await fetch('/api/admin/audit-logs', { headers });
      const dataAudit = await resAudit.json();
      if (dataAudit.success) setAuditLogs(dataAudit.logs || []);

      // 11. Brands
      const resBrands = await fetch('/api/admin/brands', { headers });
      const dataBrands = await resBrands.json();
      if (dataBrands.success) setBrandsList(dataBrands.brands || []);

      // 12. Wishlist Analytics
      const resWishlist = await fetch('/api/admin/wishlist', { headers });
      const dataWishlist = await resWishlist.json();
      if (dataWishlist.success) setWishlistReport(dataWishlist.report || null);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to load administrator data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authChecking && !authError) {
      fetchAdminData();
    }
  }, [authChecking, authError]);

  // Customer status toggle
  const handleToggleCustomerStatus = async (userId: string, currentActive: boolean) => {
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getEffectiveHeaders() },
        body: JSON.stringify({ userId, isActive: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update customer status');
      setNotice({
        type: 'success',
        message: `Customer account ${!currentActive ? 'reactivated' : 'suspended'} successfully.`,
      });
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Category creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getEffectiveHeaders() },
        body: JSON.stringify(newCategory),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create category');
      setNotice({ type: 'success', message: `Category "${newCategory.name}" added successfully.` });
      setCategoryModalOpen(false);
      setNewCategory({ name: '', slug: '', description: '', defaultGstRatePct: 18 });
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Category active toggle
  const handleToggleCategory = async (categoryId: string, currentActive: boolean) => {
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getEffectiveHeaders() },
        body: JSON.stringify({ categoryId, isActive: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update category');
      setNotice({
        type: 'success',
        message: `Category status updated successfully.`,
      });
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Brand creation
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getEffectiveHeaders() },
        body: JSON.stringify(newBrand),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to register brand');
      setNotice({ type: 'success', message: `Brand "${newBrand.name}" registered successfully.` });
      setBrandModalOpen(false);
      setNewBrand({
        name: '',
        slug: '',
        description: '',
        originCountry: 'India',
        logoUrl: '',
      });
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Brand active toggle
  const handleToggleBrand = async (brandId: string, currentActive: boolean) => {
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getEffectiveHeaders() },
        body: JSON.stringify({ brandId, isActive: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update brand');
      setNotice({ type: 'success', message: 'Brand status updated.' });
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Product creation
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setNotice(null);
    try {
      const sellingPricePaise = Math.round(parseFloat(newProduct.sellingPriceRupees) * 100);
      const mrpPaise = newProduct.mrpRupees
        ? Math.round(parseFloat(newProduct.mrpRupees) * 100)
        : sellingPricePaise;

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getEffectiveHeaders() },
        body: JSON.stringify({
          title: newProduct.title,
          brandName: newProduct.brandName,
          categoryName: newProduct.categoryName,
          categorySlug: newProduct.categorySlug,
          sellingPricePaise,
          mrpPaise,
          unit: newProduct.unit,
          minOrderQuantity: newProduct.minOrderQuantity,
          gstRatePct: newProduct.gstRatePct,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create product');
      setNotice({ type: 'success', message: `Product "${newProduct.title}" added to catalog.` });
      setProductModalOpen(false);
      setNewProduct({
        title: '',
        brandName: '',
        categorySlug: 'cement-construction-materials',
        categoryName: 'Cement & Construction Materials',
        sellingPriceRupees: '',
        mrpRupees: '',
        unit: 'Bag (50 Kg)',
        minOrderQuantity: 1,
        gstRatePct: 28,
      });
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Product active toggle
  const handleToggleProduct = async (productId: string, currentDeliverable: boolean) => {
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getEffectiveHeaders() },
        body: JSON.stringify({ productId, isDeliverable: !currentDeliverable }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update product');
      setNotice({ type: 'success', message: 'Product deliverability status updated.' });
      fetchAdminData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Dispatch vehicle action
  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDispatch) return;
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/fulfillment/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getEffectiveHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...getEffectiveHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...getEffectiveHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...getEffectiveHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...getEffectiveHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...getEffectiveHeaders() },
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

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Verifying Administrator Authorization...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-red-950 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-800">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Administrator Access Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{authError}</p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login?redirect=/admin"
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              Sign In With Verified Administrator Mobile OTP
            </Link>
            <Link
              href="/"
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              <span className="text-slate-400 font-mono text-[11px]">
                {currentUser ? `Admin: ${currentUser.phone || currentUser.email || currentUser.full_name}` : 'Role: Administrator'}
              </span>
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
            { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
            { id: 'categories', label: `Categories & Brands (${categories.length + (brandsList.length || SEED_BRANDS.length)})`, icon: FolderTree },
            { id: 'products', label: `Catalog (${productsList.length || SEED_PRODUCTS.length})`, icon: Package },
            { id: 'suppliers', label: `Suppliers (${suppliers.length})`, icon: Building2 },
            { id: 'pincodes', label: `Service Zones (${pincodes.length})`, icon: MapPin },
            { id: 'wishlist', label: `Wishlist Demand (${wishlistReport?.totalWishlistEntries || 0})`, icon: Heart },
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
                {orders.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">No orders placed yet.</div>
                ) : (
                  orders.slice(0, 10).map((o) => {
                    const itemsList = o.items || o.order_items || [];
                    const itemsSummary = itemsList.map((i: any) => `${i.quantity}x ${i.product_title_snapshot}`).join(', ') || 'Building Materials';
                    return (
                      <div key={o.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 p-2 rounded-xl transition">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="font-mono text-slate-950">{o.order_number || o.id}</span>
                            <span className="text-[11px] text-slate-600 font-medium">
                              {o.customer_name || 'Site Customer'}
                              {o.customer_phone ? ` (${o.customer_phone})` : ''} • PIN {o.shipping_pincode || o.pincode}
                            </span>
                          </div>
                          <div className="text-[11px] text-amber-900/80 font-medium mt-0.5 max-w-lg truncate">
                            {itemsSummary}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Status: {o.status_history?.slice(-1)[0]?.notes || 'Order placed and confirmed.'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            ₹{((o.total_amount_paise || o.total_paise || 0) / 100).toLocaleString('en-IN')}
                          </span>
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
                          <button
                            onClick={() => setSelectedOrderForDetails(o)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3 h-3 text-amber-400" />
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
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
                      <th className="py-3 px-4 font-semibold">Ordered Materials</th>
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
                          <div className="text-[11px] text-slate-500 font-mono">
                            {o.customer_phone ? `+91 ${o.customer_phone}` : ''}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {o.shipping_address || `PIN ${o.shipping_pincode || o.pincode}`}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5 max-w-xs">
                            {(o.items || o.order_items || []).length === 0 ? (
                              <span className="text-slate-400 text-[11px]">No items</span>
                            ) : (
                              (o.items || o.order_items || []).map((itm: any, idx: number) => (
                                <div key={idx} className="text-[11px] text-slate-800 leading-tight">
                                  <span className="font-bold text-amber-700">{itm.quantity}x</span>{' '}
                                  <span className="font-medium text-slate-900">{itm.product_title_snapshot || 'Material'}</span>
                                  {itm.variant_title_snapshot && (
                                    <span className="text-slate-500 text-[10px]"> ({itm.variant_title_snapshot})</span>
                                  )}
                                </div>
                              ))
                            )}
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
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => setSelectedOrderForDetails(o)}
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs"
                              title="View Full Order Breakdown"
                            >
                              <Eye className="w-3 h-3 text-amber-400" /> Details
                            </button>

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

            {/* Modal: Assign Stockist / Issue PO */}
            {selectedOrderForPo && (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm space-y-4 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-700" />
                    <span>Assign Verified Ayodhya Stockist for {selectedOrderForPo.order_number}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedOrderForPo(null)}
                    className="text-amber-800 hover:text-amber-950 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-amber-100 flex flex-col sm:flex-row justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-700">Customer:</span>{' '}
                    <span className="font-bold text-slate-900">{selectedOrderForPo.customer_name || 'Site Customer'}</span>{' '}
                    {selectedOrderForPo.customer_phone && <span className="text-slate-500 font-mono">({selectedOrderForPo.customer_phone})</span>}
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {selectedOrderForPo.shipping_address || 'Jobsite Address'}, PIN {selectedOrderForPo.shipping_pincode || selectedOrderForPo.pincode}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase">Order Value</span>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      ₹{((selectedOrderForPo.total_amount_paise || selectedOrderForPo.total_paise || 0) / 100).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Materials preview in assign modal */}
                <div className="p-3 bg-white/80 rounded-xl border border-amber-100">
                  <span className="font-semibold text-slate-700 block mb-1">Materials to Fulfill:</span>
                  <div className="space-y-1">
                    {(selectedOrderForPo.items || selectedOrderForPo.order_items || []).map((itm: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-slate-800 text-[11px]">
                        <span>
                          <strong className="text-amber-800">{itm.quantity}x</strong> {itm.product_title_snapshot}{' '}
                          {itm.variant_title_snapshot && <span className="text-slate-500">({itm.variant_title_snapshot})</span>}
                        </span>
                        <span className="font-mono text-slate-600">
                          ₹{((itm.total_paise || itm.unit_price_paise * itm.quantity || 0) / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleIssuePo} className="space-y-4">
                  <div>
                    <label className="block font-semibold text-amber-950 mb-1">
                      Select Approved Ayodhya Merchant / Stockist *
                    </label>
                    <select
                      value={poSupplierId}
                      onChange={(e) => setPoSupplierId(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-200 rounded-xl bg-white text-slate-900"
                    >
                      {suppliers
                        .filter((s) => s.verification_status === 'verified')
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.business_name} ({s.pincode}) - Contact: {s.contact_person} ({s.phone})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForPo(null)}
                      className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="py-2.5 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition flex items-center gap-2 shadow-xs"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Issue PO & Assign Stockist</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modal: Report Failed Delivery */}
            {selectedOrderForFailure && (
              <div className="p-6 bg-orange-50 border border-orange-200 rounded-2xl shadow-sm space-y-4 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-orange-200 pb-2">
                  <h4 className="text-sm font-bold text-orange-950 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-700" />
                    <span>Report Delivery Exception for {selectedOrderForFailure.order_number}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedOrderForFailure(null)}
                    className="text-orange-700 hover:text-orange-950 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleRecordFailure} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-orange-950 mb-1">
                        Reason for Delivery Exception / Failure *
                      </label>
                      <input
                        type="text"
                        required
                        value={failureReason}
                        onChange={(e) => setFailureReason(e.target.value)}
                        className="w-full px-3 py-2 border border-orange-200 rounded-xl bg-white"
                        placeholder="e.g. Site gate locked, customer phone unreachable"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-orange-950 mb-1">
                        Next Delivery Retry Scheduled Time *
                      </label>
                      <input
                        type="text"
                        required
                        value={retryScheduledAt}
                        onChange={(e) => setRetryScheduledAt(e.target.value)}
                        className="w-full px-3 py-2 border border-orange-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForFailure(null)}
                      className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="py-2.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Record Delivery Exception</span>
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
                    <th className="py-3 px-4 font-semibold">Order Ref & Date</th>
                    <th className="py-3 px-4 font-semibold">Customer & Destination</th>
                    <th className="py-3 px-4 font-semibold">Ordered Items & Quantities</th>
                    <th className="py-3 px-4 font-semibold">Payment & Total</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No orders recorded in database yet.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => {
                      const itemsList = o.items || o.order_items || [];
                      return (
                        <tr key={o.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            <div>{o.order_number || o.id}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {o.created_at
                                ? new Date(o.created_at).toLocaleString('en-IN', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })
                                : 'Just now'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{o.customer_name || 'Site Customer'}</div>
                            <div className="text-[11px] text-slate-600 font-mono">
                              {o.customer_phone ? `+91 ${o.customer_phone}` : ''}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              {o.shipping_address ? `${o.shipping_address}, PIN ${o.shipping_pincode || o.pincode}` : `PIN ${o.shipping_pincode || o.pincode}`}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {itemsList.length === 0 ? (
                              <span className="text-slate-400 text-[11px]">No line items</span>
                            ) : (
                              <div className="space-y-1 max-w-xs">
                                {itemsList.map((itm: any, idx: number) => (
                                  <div key={idx} className="text-[11px] text-slate-800 leading-tight">
                                    <span className="font-bold text-amber-700">{itm.quantity}x</span>{' '}
                                    <span className="font-medium text-slate-900">{itm.product_title_snapshot || 'Material'}</span>
                                    {itm.variant_title_snapshot && (
                                      <span className="text-slate-500 text-[10px]"> ({itm.variant_title_snapshot})</span>
                                    )}
                                    <span className="text-slate-400 text-[10px] ml-1 font-mono">
                                      ₹{((itm.total_paise || itm.unit_price_paise * itm.quantity || 0) / 100).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm font-mono">
                              ₹{((o.total_amount_paise || o.total_paise || 0) / 100).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">
                              {o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method || 'Prepaid'}
                            </div>
                            <div className="text-[10px] text-slate-400 capitalize">
                              {o.payment_status || 'Pending'}
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
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedOrderForDetails(o)}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
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

        {/* TAB: CUSTOMER MANAGEMENT */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 w-full sm:w-80 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by customer name, phone, or company..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-slate-900 placeholder-slate-400 text-xs"
                />
              </div>
              <div className="text-slate-500 font-medium text-right w-full sm:w-auto">
                Total Verified Accounts: <span className="font-bold text-slate-900">{customers.length}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Customer / Site Owner</th>
                      <th className="py-3 px-4 font-semibold">Account Role</th>
                      <th className="py-3 px-4 font-semibold">Company & GSTIN</th>
                      <th className="py-3 px-4 font-semibold">Orders</th>
                      <th className="py-3 px-4 font-semibold">Registered</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Access Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers
                      .filter((c) =>
                        !customerSearch
                          ? true
                          : (c.full_name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
                            (c.phone || '').includes(customerSearch) ||
                            (c.business_name || '').toLowerCase().includes(customerSearch.toLowerCase())
                      )
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{c.full_name || 'Customer'}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              <span>{c.phone || 'Phone verified'}</span>
                            </div>
                            {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                c.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : c.role === 'contractor'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {c.role || 'customer'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{c.business_name || '—'}</div>
                            {c.gstin && <div className="text-[10px] text-slate-500 font-mono">GST: {c.gstin}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                              {c.orders_count || 0} orders
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {new Date(c.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.is_active !== false
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {c.is_active !== false ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleToggleCustomerStatus(c.id, c.is_active !== false)}
                              disabled={actionLoading}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                c.is_active !== false
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {c.is_active !== false ? (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Suspend</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3 h-3" />
                                  <span>Reactivate</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CATEGORY & BRAND MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            {/* Sub-tab pills */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setCategorySubTab('categories')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  categorySubTab === 'categories'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Taxonomy Categories ({categories.length || SEED_CATEGORIES.length})
              </button>
              <button
                type="button"
                onClick={() => setCategorySubTab('brands')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  categorySubTab === 'brands'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Manufacturing Brands ({brandsList.length || SEED_BRANDS.length})
              </button>
            </div>

            {categorySubTab === 'categories' ? (
              <>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between text-xs">
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-slate-800">
                      Construction Categories & Tax Configurations
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Active storefront taxonomies and assigned default GST rates for billing.
                    </p>
                  </div>
                  <button
                    onClick={() => setCategoryModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Category</span>
                  </button>
                </div>

                {/* Add Category Modal */}
                {categoryModalOpen && (
                  <div className="bg-white border-2 border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-900 text-sm">Add New Construction Category</h4>
                      <button
                        onClick={() => setCategoryModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <form onSubmit={handleCreateCategory} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Waterproofing & Chemical Sealants"
                            value={newCategory.name}
                            onChange={(e) => {
                              const name = e.target.value;
                              const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                              setNewCategory({ ...newCategory, name, slug });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">URL Slug *</label>
                          <input
                            type="text"
                            required
                            placeholder="waterproofing-sealants"
                            value={newCategory.slug}
                            onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Description</label>
                          <input
                            type="text"
                            placeholder="Liquid waterproofing, polymer coatings, epoxy resins"
                            value={newCategory.description}
                            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Default GST Rate (%) *</label>
                          <select
                            value={newCategory.defaultGstRatePct}
                            onChange={(e) => setNewCategory({ ...newCategory, defaultGstRatePct: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                          >
                            <option value={5}>5% (Essential Construction Inputs)</option>
                            <option value={12}>12% (Plumbing & Ceramic Hardware)</option>
                            <option value={18}>18% (Paints, Tiles & Standard Materials)</option>
                            <option value={28}>28% (Cement, TMT Steel & Heavy Rebars)</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setCategoryModalOpen(false)}
                          className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition shadow-sm"
                        >
                          Save Category
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Order</th>
                          <th className="py-3 px-4 font-semibold">Category Name</th>
                          <th className="py-3 px-4 font-semibold">URL Slug</th>
                          <th className="py-3 px-4 font-semibold">Tax Bracket</th>
                          <th className="py-3 px-4 font-semibold">Storefront Status</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(categories.length > 0 ? categories : SEED_CATEGORIES).map((cat, idx) => (
                          <tr key={cat.id || cat.slug} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-mono text-slate-400">{cat.display_order || idx + 1}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{cat.name}</div>
                              <div className="text-[11px] text-slate-500 max-w-sm truncate">{cat.description}</div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-600">/{cat.slug}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold font-mono">
                                {cat.default_gst_rate_pct || 18}% GST
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  cat.is_active !== false
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {cat.is_active !== false ? 'Active in Menu' : 'Archived'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleToggleCategory(cat.id, cat.is_active !== false)}
                                disabled={actionLoading}
                                className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 underline"
                              >
                                {cat.is_active !== false ? 'Deactivate' : 'Publish'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-slate-800">
                      Authorized Manufacturing Brands & OEMs
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Approved Indian and regional construction material manufacturers in the Ayodhya supply chain.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search brands..."
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs text-slate-900 placeholder-slate-400"
                      />
                    </div>
                    <button
                      onClick={() => setBrandModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Brand</span>
                    </button>
                  </div>
                </div>

                {/* Add Brand Modal */}
                {brandModalOpen && (
                  <div className="bg-white border-2 border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-900 text-sm">Register Construction Brand</h4>
                      <button
                        onClick={() => setBrandModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <form onSubmit={handleCreateBrand} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Brand Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ambuja Cements"
                            value={newBrand.name}
                            onChange={(e) => {
                              const name = e.target.value;
                              const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                              setNewBrand({ ...newBrand, name, slug });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Brand Slug *</label>
                          <input
                            type="text"
                            required
                            placeholder="ambuja-cements"
                            value={newBrand.slug}
                            onChange={(e) => setNewBrand({ ...newBrand, slug: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Origin Country</label>
                          <input
                            type="text"
                            value={newBrand.originCountry}
                            onChange={(e) => setNewBrand({ ...newBrand, originCountry: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Logo URL (Optional)</label>
                          <input
                            type="text"
                            placeholder="/images/brands/ambuja.png"
                            value={newBrand.logoUrl}
                            onChange={(e) => setNewBrand({ ...newBrand, logoUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Description</label>
                        <textarea
                          rows={2}
                          placeholder="Leading manufacturer of cement and clinker in India."
                          value={newBrand.description}
                          onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setBrandModalOpen(false)}
                          className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition shadow-sm"
                        >
                          Register Brand
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Brand Name</th>
                          <th className="py-3 px-4 font-semibold">Slug Identifier</th>
                          <th className="py-3 px-4 font-semibold">Country</th>
                          <th className="py-3 px-4 font-semibold">Description</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(brandsList.length > 0 ? brandsList : SEED_BRANDS)
                          .filter((b) =>
                            !brandSearch
                              ? true
                              : b.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
                                (b.slug || '').toLowerCase().includes(brandSearch.toLowerCase())
                          )
                          .map((brand) => (
                            <tr key={brand.id || brand.slug} className="hover:bg-slate-50/70">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{brand.name}</div>
                                {brand.is_featured && (
                                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                    Featured OEM
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{brand.slug}</td>
                              <td className="py-3 px-4 text-slate-600">{brand.origin_country || 'India'}</td>
                              <td className="py-3 px-4 text-slate-500 max-w-sm truncate">{brand.description || '—'}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    brand.is_active !== false
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {brand.is_active !== false ? 'Active' : 'Suspended'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleToggleBrand(brand.id, brand.is_active !== false)}
                                  disabled={actionLoading}
                                  className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 underline"
                                >
                                  {brand.is_active !== false ? 'Deactivate' : 'Activate'}
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 7: CATALOG & PRODUCT MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
                <div className="flex items-center gap-2 w-full sm:w-64 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search title, brand, SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-slate-900 placeholder-slate-400 text-xs"
                  />
                </div>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 text-xs"
                >
                  <option value="">All Categories</option>
                  {(categories.length > 0 ? categories : SEED_CATEGORIES).map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setProductModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Add Product Modal */}
            {productModalOpen && (
              <div className="bg-white border-2 border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm">Add New Product to Catalog</h4>
                  <button
                    onClick={() => setProductModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleCreateProduct} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Product Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. UltraTech Super Weather Pro Cement"
                        value={newProduct.title}
                        onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Brand Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. UltraTech Cement"
                        value={newProduct.brandName}
                        onChange={(e) => setNewProduct({ ...newProduct, brandName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                      <select
                        value={newProduct.categorySlug}
                        onChange={(e) => {
                          const slug = e.target.value;
                          const found = (categories.length > 0 ? categories : SEED_CATEGORIES).find((c) => c.slug === slug);
                          setNewProduct({
                            ...newProduct,
                            categorySlug: slug,
                            categoryName: found?.name || 'Construction Materials',
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      >
                        {(categories.length > 0 ? categories : SEED_CATEGORIES).map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="385"
                        value={newProduct.sellingPriceRupees}
                        onChange={(e) => setNewProduct({ ...newProduct, sellingPriceRupees: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">MRP (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="420"
                        value={newProduct.mrpRupees}
                        onChange={(e) => setNewProduct({ ...newProduct, mrpRupees: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Unit of Measurement *</label>
                      <input
                        type="text"
                        required
                        placeholder="Bag (50 Kg), Piece, Ton"
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Min Order Quantity</label>
                      <input
                        type="number"
                        min={1}
                        value={newProduct.minOrderQuantity}
                        onChange={(e) => setNewProduct({ ...newProduct, minOrderQuantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">GST Rate (%)</label>
                      <select
                        value={newProduct.gstRatePct}
                        onChange={(e) => setNewProduct({ ...newProduct, gstRatePct: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      >
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setProductModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition shadow-sm"
                    >
                      Publish Product
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Product Title & Brand</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Selling Price & MRP</th>
                      <th className="py-3 px-4 font-semibold">Unit & Min Qty</th>
                      <th className="py-3 px-4 font-semibold">GST Rate</th>
                      <th className="py-3 px-4 font-semibold">Deliverability</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(productsList.length > 0 ? productsList : SEED_PRODUCTS)
                      .filter((prod) => {
                        const matchQuery =
                          !productSearch ||
                          prod.product_title.toLowerCase().includes(productSearch.toLowerCase()) ||
                          (prod.brand_name || '').toLowerCase().includes(productSearch.toLowerCase());
                        const matchCat =
                          !productCategoryFilter ||
                          prod.category_slug === productCategoryFilter;
                        return matchQuery && matchCat;
                      })
                      .map((prod) => {
                        const unitName = (prod as any).unit_of_measure || (prod as any).unit || 'Unit';
                        const minQty = (prod as any).min_order_qty || (prod as any).min_order_quantity || 1;
                        const taxRate = (prod as any).tax_rate_pct || (prod as any).gst_rate_pct || 18;
                        const isAvailable = (prod as any).is_in_stock !== undefined ? (prod as any).is_in_stock : (prod as any).is_deliverable !== false;

                        return (
                          <tr key={prod.product_id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{prod.product_title}</div>
                              <div className="text-[11px] text-amber-700 font-semibold">{prod.brand_name || 'Generic'}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{prod.category_name}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 font-mono">
                                ₹{(prod.selling_price_paise / 100).toFixed(2)}
                              </div>
                              {prod.mrp_paise && prod.mrp_paise > prod.selling_price_paise && (
                                <div className="text-[10px] text-slate-400 line-through font-mono">
                                  MRP ₹{(prod.mrp_paise / 100).toFixed(2)}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div>{unitName}</div>
                              <div className="text-[10px] text-slate-400">Min: {minQty}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                                {taxRate}% GST
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isAvailable
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {isAvailable ? 'Available' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleToggleProduct(prod.product_id, isAvailable)}
                                disabled={actionLoading}
                                className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 underline"
                              >
                                {isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: WISHLIST DEMAND & STOCK INTELLIGENCE */}
        {activeTab === 'wishlist' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>Customer Wishlist Demand & Stock Intelligence</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Aggregated intent signals from verified Ayodhya accounts and active site engineers. Use to optimize supplier procurement and yard stock.
                </p>
              </div>
              <button
                onClick={fetchAdminData}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Intel</span>
              </button>
            </div>

            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <Heart className="w-6 h-6 fill-rose-100" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Total Saved Items</div>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {wishlistReport?.totalWishlistEntries || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Across all customer accounts</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Unique Materials</div>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {wishlistReport?.uniqueProductsWishlisted || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Active catalog materials saved</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  (wishlistReport?.highDemandZeroStock?.length || 0) > 0
                    ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Stock Alerts</div>
                  <div className={`text-2xl font-black mt-0.5 ${
                    (wishlistReport?.highDemandZeroStock?.length || 0) > 0 ? 'text-red-600' : 'text-slate-900'
                  }`}>
                    {wishlistReport?.highDemandZeroStock?.length || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Saved items currently unavailable</div>
                </div>
              </div>
            </div>

            {/* Zero stock warning banner if applicable */}
            {(wishlistReport?.highDemandZeroStock?.length || 0) > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Immediate Stock Action Required:</span> The following materials have active customer purchase intent but are marked out of stock or deliverability is disabled:
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {wishlistReport.highDemandZeroStock.map((item: any) => (
                      <li key={item.productId} className="font-medium">
                        <span className="font-bold">{item.productTitle}</span> ({item.wishlistCount} customer{item.wishlistCount > 1 ? 's' : ''} waiting)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Table: Most Saved Materials */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span>Top In-Demand Construction Materials</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    (Ranked by customer saves)
                  </span>
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Rank</th>
                      <th className="py-3 px-4 font-semibold">Material / Product</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Selling Price</th>
                      <th className="py-3 px-4 font-semibold">Wishlist Demand</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!wishlistReport?.topProducts || wishlistReport.topProducts.length === 0) ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          <Heart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          No wishlist records recorded in database yet.
                        </td>
                      </tr>
                    ) : (
                      wishlistReport.topProducts.map((p: any, idx: number) => (
                        <tr key={p.productId} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-bold font-mono text-slate-400">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{p.productTitle}</div>
                            <div className="text-[11px] text-amber-700 font-semibold">{p.brandName || 'Verified Brand'}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{p.categoryName || 'General'}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            ₹{(p.sellingPricePaise / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold font-mono border border-rose-200">
                              <Heart className="w-3 h-3 fill-rose-500" />
                              <span>{p.wishlistCount} saved</span>
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.isInStock
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {p.isInStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/products/${p.productSlug || p.productId}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 underline"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Product</span>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Demand Distribution */}
            {wishlistReport?.categoryDistribution && wishlistReport.categoryDistribution.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-800 mb-3">
                  Category Demand Distribution
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {wishlistReport.categoryDistribution.map((cat: any) => (
                    <div key={cat.categoryName} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="font-semibold text-slate-900">{cat.categoryName}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>{cat.entryCount} total saves</span>
                        <span className="font-medium text-slate-700">{cat.uniqueProducts} products</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

        {/* MODAL: FULL ORDER DETAILS & AUDIT BREAKDOWN */}
        {selectedOrderForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-xs">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono font-bold text-base text-white">
                        {selectedOrderForDetails.order_number || selectedOrderForDetails.id}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          selectedOrderForDetails.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : selectedOrderForDetails.status === 'dispatched'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : selectedOrderForDetails.status === 'supplier_rejected'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {selectedOrderForDetails.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Placed on {new Date(selectedOrderForDetails.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderForDetails(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* 3 Grid Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Customer & Site */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" /> Customer & Site
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      {selectedOrderForDetails.customer_name || 'Site Customer'}
                    </div>
                    {selectedOrderForDetails.customer_phone && (
                      <a
                        href={`tel:${selectedOrderForDetails.customer_phone}`}
                        className="font-mono text-amber-600 hover:underline block font-semibold"
                      >
                        📞 +91 {selectedOrderForDetails.customer_phone}
                      </a>
                    )}
                    <div className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                      {selectedOrderForDetails.shipping_address || 'Jobsite Address'}
                      <div className="font-bold text-slate-700">
                        PIN: {selectedOrderForDetails.shipping_pincode || selectedOrderForDetails.pincode || '224001'} (Ayodhya)
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Payment & Billing */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Payment & Billing
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-lg">
                      ₹{((selectedOrderForDetails.total_amount_paise || selectedOrderForDetails.total_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700">
                      Method: <span className="uppercase text-slate-900">{selectedOrderForDetails.payment_method === 'cod' ? 'Cash on Delivery' : selectedOrderForDetails.payment_method || 'Prepaid'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Status: <span className="font-bold uppercase text-amber-700">{selectedOrderForDetails.payment_status || 'Pending'}</span>
                    </div>
                  </div>

                  {/* Card 3: Security & Verification */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> Delivery Security
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Drop-off OTP:{' '}
                      <span className="font-mono font-black text-slate-900 bg-amber-100 px-2 py-0.5 rounded">
                        {selectedOrderForDetails.delivery_otp_plain || 'Secured'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      OTP dispatched via verified SMS to recipient mobile upon truck dispatch.
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="bg-slate-100/70 px-4 py-2.5 font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>Ordered Building Materials ({selectedOrderForDetails.items?.length || selectedOrderForDetails.order_items?.length || 0} line items)</span>
                    <span className="text-slate-500 font-normal">Integer-paise verified</span>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Item & Variant</th>
                        <th className="py-2.5 px-3">HSN Code</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">GST Rate</th>
                        <th className="py-2.5 px-4 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {(selectedOrderForDetails.items || selectedOrderForDetails.order_items || []).map((itm: any, idx: number) => {
                        const lineTotalPaise = itm.total_paise || (itm.unit_price_paise * itm.quantity);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{itm.product_title_snapshot || 'Material'}</div>
                              {itm.variant_title_snapshot && (
                                <div className="text-[11px] text-slate-500">{itm.variant_title_snapshot}</div>
                              )}
                              {itm.sku_snapshot && (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {itm.sku_snapshot}</div>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                              {itm.hsn_code_snapshot || '252329'}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-900">
                              {itm.quantity} <span className="text-[10px] text-slate-500 font-normal">{itm.unit_snapshot || 'units'}</span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-700">
                              ₹{((itm.unit_price_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-600">
                              {itm.gst_rate_pct || 18}%
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              ₹{(lineTotalPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50/80 border-t border-slate-200 text-slate-700">
                      <tr>
                        <td colSpan={5} className="py-2 px-4 text-right font-semibold text-[11px]">Material Subtotal:</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{((selectedOrderForDetails.subtotal_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="py-1 px-4 text-right font-semibold text-[11px]">Applicable GST Tax:</td>
                        <td className="py-1 px-4 text-right font-mono text-slate-700">
                          ₹{((selectedOrderForDetails.tax_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="py-1 px-4 text-right font-semibold text-[11px]">Jobsite Delivery Logistics:</td>
                        <td className="py-1 px-4 text-right font-mono text-slate-700">
                          ₹{((selectedOrderForDetails.delivery_fee_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr className="border-t border-slate-200 bg-amber-50/50">
                        <td colSpan={5} className="py-2.5 px-4 text-right font-black text-slate-900 text-xs">Total Net Payable:</td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-amber-800 text-sm">
                          ₹{((selectedOrderForDetails.total_amount_paise || selectedOrderForDetails.total_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Status History & Audit Log Timeline */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-500" /> Status & Audit Trail Timeline
                  </h4>
                  <div className="space-y-2">
                    {(selectedOrderForDetails.status_history || []).length === 0 ? (
                      <p className="text-slate-400 text-[11px]">No status transition logs recorded.</p>
                    ) : (
                      (selectedOrderForDetails.status_history || []).map((sh: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-xs bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold uppercase tracking-wider text-slate-900 text-[10px]">
                                {sh.new_status || sh.status || 'Updated'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {sh.created_at ? new Date(sh.created_at).toLocaleString('en-IN') : ''}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] mt-0.5">{sh.notes || 'Status changed'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer with Direct Operational Actions */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
                <button
                  onClick={() => setSelectedOrderForDetails(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 transition"
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  {(!selectedOrderForDetails.status || selectedOrderForDetails.status === 'confirmed') && (
                    <button
                      onClick={() => {
                        setSelectedOrderForPo(selectedOrderForDetails);
                        setSelectedOrderForDetails(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Building2 className="w-4 h-4" /> Assign Stockist Now
                    </button>
                  )}
                  {(selectedOrderForDetails.status === 'supplier_confirmed' || selectedOrderForDetails.status === 'processing') && (
                    <button
                      onClick={() => {
                        setSelectedOrderForDispatch(selectedOrderForDetails);
                        setSelectedOrderForDetails(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Truck className="w-4 h-4" /> Dispatch Vehicle
                    </button>
                  )}
                  {selectedOrderForDetails.status === 'dispatched' && (
                    <button
                      onClick={() => {
                        setSelectedOrderForOtp(selectedOrderForDetails);
                        setSelectedOrderForDetails(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <KeyRound className="w-4 h-4" /> Verify Drop-off OTP
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
