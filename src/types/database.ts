/**
 * NIRMANSETU: DATABASE SCHEMA TYPESCRIPT DEFINITIONS
 * Directly mirrors the 16 core PostgreSQL domains in Supabase.
 */

export type UserRole = 'customer' | 'contractor' | 'supplier' | 'delivery_partner' | 'admin';
export type AddressType = 'site' | 'residential' | 'commercial';
export type SupplierVerificationStatus = 'pending' | 'verified' | 'suspended' | 'rejected';
export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'confirmed'
  | 'supplier_assigned'
  | 'supplier_confirmed'
  | 'supplier_rejected'
  | 'processing'
  | 'po_issued'
  | 'materials_packed'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_delivery'
  | 'cancelled'
  | 'refunded';
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'cod_pending';
export type PaymentMethod = 'razorpay' | 'cod' | 'neft_rtgs' | 'credit_line' | 'bank_transfer';
export type DiscountType = 'percentage' | 'fixed_paise';
export type ProjectType =
  | 'residential_house'
  | 'commercial_complex'
  | 'hotel_ashram'
  | 'temple_infrastructure'
  | 'government_contract'
  | 'renovation';
export type EnquiryStatus = 'new' | 'reviewing' | 'quoted' | 'converted' | 'rejected';
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'rejected';
export type SupplierPoStatus = 'issued' | 'accepted' | 'packed' | 'dispatched' | 'completed' | 'cancelled';
export type DeliveryVehicleType = 'three_wheeler_auto' | 'tata_ace' | 'tipper_truck' | 'tractor_trolley' | 'manual_cart';
export type DeliveryStatus = 'assigned' | 'arrived_at_pickup' | 'picked_up' | 'in_transit' | 'arrived_at_site' | 'delivered' | 'failed';
export type NotificationChannel = 'sms' | 'whatsapp' | 'in_app' | 'email';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  business_name: string | null;
  company_name?: string | null;
  gstin: string | null;
  pan: string | null;
  alternate_phone?: string | null;
  phone_number?: string | null;
  is_phone_verified: boolean;
  is_active: boolean;
  avatar_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CustomerWishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface ServiceZone {
  id: string;
  name: string;
  city: string;
  state: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServicePincode {
  pincode: string;
  zone_id: string | null;
  area_name: string;
  city: string;
  district: string;
  state: string;
  is_serviceable: boolean;
  estimated_delivery_minutes: number;
  standard_delivery_fee_paise: number;
  free_delivery_threshold_paise: number;
  express_available: boolean;
  express_delivery_fee_paise: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  user_id: string;
  address_type: AddressType;
  site_or_person_name: string;
  contact_phone: string;
  alternate_phone: string | null;
  street_address: string;
  landmark: string | null;
  pincode: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  unloading_instructions: string | null;
  has_truck_access: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  default_gst_rate_pct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  origin_country: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PublicationStatus = 'draft' | 'published' | 'archived';

export interface Product {
  id: string;
  category_id: string;
  brand_id: string | null;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  hsn_code: string | null;
  unit_of_measure: string;
  is_bulk_available: boolean;
  is_featured: boolean;
  is_active: boolean;
  publication_status: PublicationStatus;
  tax_rate_pct: number;
  specifications: Record<string, unknown>;
  images: string[];
  created_at: string;
  updated_at: string;
  // Joined relations
  category?: Category;
  brand?: Brand;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  sku: string;
  barcode: string | null;
  pack_size: string | null;
  mrp_paise: number;
  selling_price_paise: number;
  publication_status: PublicationStatus;
  attributes: Record<string, unknown>;
  min_order_qty: number;
  max_order_qty: number | null;
  weight_kg: number | null;
  dimensions_cm: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined relation
  supplier_products?: SupplierProduct[];
}

export interface PublicCatalogItem {
  product_id: string;
  product_title: string;
  product_slug: string;
  short_description: string | null;
  description: string | null;
  hsn_code: string | null;
  unit_of_measure: string;
  is_bulk_available: boolean;
  is_featured: boolean;
  specifications: Record<string, unknown>;
  images: string[];
  tax_rate_pct: number;
  product_status: PublicationStatus;
  category_id: string;
  category_name: string;
  category_slug: string;
  brand_id: string | null;
  brand_name: string | null;
  brand_slug: string | null;
  brand_logo: string | null;
  variant_id: string;
  variant_title: string;
  sku: string;
  pack_size: string | null;
  attributes: Record<string, unknown>;
  min_order_qty: number;
  max_order_qty: number | null;
  weight_kg: number | null;
  dimensions_cm: Record<string, unknown> | null;
  selling_price_paise: number;
  mrp_paise: number;
  total_available_stock: number;
  is_in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  user_id: string | null;
  business_name: string;
  trade_name: string | null;
  contact_person: string;
  phone: string;
  email: string | null;
  gstin: string | null;
  pan: string | null;
  street_address: string;
  landmark: string | null;
  city: string;
  pincode: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  verification_status: SupplierVerificationStatus;
  verified_at: string | null;
  commission_rate_pct: number;
  rating: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  variant_id: string;
  supplier_cost_paise: number;
  mrp_paise: number;
  selling_price_paise: number;
  stock_quantity: number;
  min_lead_time_hours: number;
  is_available: boolean;
  priority_score: number;
  updated_at: string;
  supplier?: Supplier;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value_paise: number;
  max_discount_paise: number | null;
  usage_limit: number | null;
  usage_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  user_id: string | null;
  session_token: string | null;
  coupon_id: string | null;
  delivery_pincode: string | null;
  created_at: string;
  updated_at: string;
  items?: CartItem[];
}

export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  preferred_supplier_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  variant?: ProductVariant & { product?: Product; supplier_products?: SupplierProduct[] };
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  delivery_address_id: string | null;
  delivery_address_snapshot: Record<string, unknown>;
  pincode: string;
  subtotal_paise: number;
  tax_paise: number;
  delivery_fee_paise: number;
  discount_paise: number;
  total_paise: number;
  coupon_id: string | null;
  delivery_otp_hash: string | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  supplier_id: string;
  product_title_snapshot: string;
  variant_title_snapshot: string;
  sku_snapshot: string;
  hsn_code_snapshot: string | null;
  unit_snapshot: string;
  quantity: number;
  unit_price_paise: number;
  gst_rate_pct: number;
  tax_paise: number;
  total_paise: number;
  supplier_cost_paise: number;
  platform_margin_paise: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  payment_method: PaymentMethod;
  amount_paise: number;
  currency: string;
  status: PaymentStatus;
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  gateway_signature: string | null;
  idempotency_key: string;
  error_code: string | null;
  error_description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PaymentEvent {
  id: string;
  payment_id: string | null;
  gateway_event_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  is_verified: boolean;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface BulkEnquiry {
  id: string;
  user_id: string | null;
  enquiry_number: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  company_or_firm_name: string | null;
  gstin: string | null;
  project_type: ProjectType;
  project_title: string;
  project_address: string;
  pincode: string;
  estimated_budget_paise: number | null;
  target_delivery_date: string | null;
  material_requirements: string;
  structured_items: Array<{ category?: string; title: string; approx_qty: number; unit: string }>;
  status: EnquiryStatus;
  assigned_to: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quotation {
  id: string;
  enquiry_id: string | null;
  quotation_number: string;
  user_id: string | null;
  client_name: string;
  client_phone: string;
  client_gstin: string | null;
  delivery_address: string;
  delivery_pincode: string;
  valid_until: string;
  subtotal_paise: number;
  tax_paise: number;
  freight_paise: number;
  unloading_charges_paise: number;
  total_paise: number;
  terms_and_conditions: string;
  status: QuotationStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  variant_id: string | null;
  item_title: string;
  specification_description: string | null;
  hsn_code: string | null;
  unit: string;
  quantity: number;
  unit_rate_paise: number;
  gst_rate_pct: number;
  tax_paise: number;
  total_paise: number;
  created_at: string;
}

export interface SupplierPurchaseOrder {
  id: string;
  po_number: string;
  order_id: string;
  supplier_id: string;
  status: SupplierPoStatus;
  total_cost_paise: number;
  expected_dispatch_at: string | null;
  actual_dispatch_at: string | null;
  supplier_invoice_number: string | null;
  supplier_invoice_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: SupplierPoItem[];
}

export interface SupplierPoItem {
  id: string;
  po_id: string;
  order_item_id: string;
  variant_id: string;
  quantity: number;
  unit_cost_paise: number;
  total_cost_paise: number;
  created_at: string;
}

export interface DeliveryAssignment {
  id: string;
  order_id: string;
  po_id: string | null;
  driver_profile_id: string | null;
  driver_name: string;
  driver_phone: string;
  vehicle_type: DeliveryVehicleType;
  vehicle_registration_number: string;
  status: DeliveryStatus;
  pickup_otp: string | null;
  is_pickup_verified: boolean;
  delivery_otp: string | null;
  is_delivery_verified: boolean;
  pickup_address: string;
  dropoff_address: string;
  dropoff_latitude: number | null;
  dropoff_longitude: number | null;
  current_latitude: number | null;
  current_longitude: number | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  driver_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
  channel: NotificationChannel;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  status: NotificationStatus;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface AdminSetting {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  is_public: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
