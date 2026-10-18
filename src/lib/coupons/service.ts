/**
 * NIRMANSETU: PROMOTIONAL COUPONS & CASHBACK SERVICE
 *
 * Implements coupon validation, discount computation, and usage tracking.
 * Strictly calculates all discounts in INTEGER PAISE without floating-point arithmetic.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DiscountType } from '@/types/database';

export interface CouponRecord {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number; // percentage (e.g. 10.00) or fixed paise (e.g. 50000)
  min_order_value_paise: number;
  max_discount_paise: number | null;
  usage_limit: number | null;
  usage_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

/**
 * Standard seed coupons for development, offline testing, and demo promotions
 */
export const SEED_COUPONS: CouponRecord[] = [
  {
    id: 'cp000000-0000-0000-0000-000000000001',
    code: 'AYODHYA10',
    description: '10% discount on orders above ₹5,000 (Maximum discount ₹2,500)',
    discount_type: 'percentage',
    discount_value: 10.0,
    min_order_value_paise: 500000, // ₹5,000
    max_discount_paise: 250000, // ₹2,500
    usage_limit: 1000,
    usage_count: 14,
    valid_from: '2026-01-01T00:00:00Z',
    valid_until: '2027-12-31T23:59:59Z',
    is_active: true,
  },
  {
    id: 'cp000000-0000-0000-0000-000000000002',
    code: 'NIRMAN500',
    description: 'Flat ₹500 off on bulk cement and steel orders above ₹10,000',
    discount_type: 'fixed_paise',
    discount_value: 50000, // ₹500 in paise
    min_order_value_paise: 1000000, // ₹10,000
    max_discount_paise: 50000,
    usage_limit: 500,
    usage_count: 42,
    valid_from: '2026-01-01T00:00:00Z',
    valid_until: '2027-12-31T23:59:59Z',
    is_active: true,
  },
  {
    id: 'cp000000-0000-0000-0000-000000000003',
    code: 'EXPIRED20',
    description: 'Expired test promotion for validation suite',
    discount_type: 'percentage',
    discount_value: 20.0,
    min_order_value_paise: 200000,
    max_discount_paise: 100000,
    usage_limit: 100,
    usage_count: 100,
    valid_from: '2025-01-01T00:00:00Z',
    valid_until: '2025-12-31T23:59:59Z', // Expired
    is_active: false,
  },
  {
    id: 'cp000000-0000-0000-0000-000000000004',
    code: 'RAMSETU50',
    description: 'Special inauguration 50% discount up to ₹5,000',
    discount_type: 'percentage',
    discount_value: 50.0,
    min_order_value_paise: 100000, // ₹1,000
    max_discount_paise: 500000, // ₹5,000
    usage_limit: 50,
    usage_count: 5,
    valid_from: '2026-01-01T00:00:00Z',
    valid_until: '2027-12-31T23:59:59Z',
    is_active: true,
  },
];

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: CouponRecord;
  discountPaise: number;
  errorMessage?: string;
}

/**
 * Validates a coupon code against subtotal in paise and checks business rules.
 */
export async function validateCoupon(
  code: string,
  subtotalPaise: number
): Promise<CouponValidationResult> {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return { isValid: false, discountPaise: 0, errorMessage: 'Coupon code cannot be empty' };
  }

  let coupon: CouponRecord | undefined;

  // Try DB query first
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (!error && data) {
      coupon = data as CouponRecord;
    }
  } catch {
    // Database connection fallback
  }

  // Fallback to seed coupons if not found in DB
  if (!coupon) {
    coupon = SEED_COUPONS.find((c) => c.code === normalizedCode);
  }

  if (!coupon) {
    return {
      isValid: false,
      discountPaise: 0,
      errorMessage: `Coupon "${normalizedCode}" is invalid or does not exist.`,
    };
  }

  if (!coupon.is_active) {
    return {
      isValid: false,
      discountPaise: 0,
      errorMessage: `Coupon "${normalizedCode}" is currently inactive.`,
    };
  }

  const now = new Date();
  const validFrom = new Date(coupon.valid_from);
  const validUntil = new Date(coupon.valid_until);

  if (now < validFrom) {
    return {
      isValid: false,
      discountPaise: 0,
      errorMessage: `Coupon "${normalizedCode}" is not yet active. Valid from ${validFrom.toLocaleDateString('en-IN')}.`,
    };
  }

  if (now > validUntil) {
    return {
      isValid: false,
      discountPaise: 0,
      errorMessage: `Coupon "${normalizedCode}" expired on ${validUntil.toLocaleDateString('en-IN')}.`,
    };
  }

  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return {
      isValid: false,
      discountPaise: 0,
      errorMessage: `Coupon "${normalizedCode}" has reached its maximum redemption limit.`,
    };
  }

  if (subtotalPaise < coupon.min_order_value_paise) {
    const minRupees = Math.round(coupon.min_order_value_paise / 100);
    return {
      isValid: false,
      discountPaise: 0,
      errorMessage: `Minimum order value for coupon "${normalizedCode}" is ₹${minRupees.toLocaleString('en-IN')}.`,
    };
  }

  // Calculate discount strictly in integer paise
  let discountPaise = 0;

  if (coupon.discount_type === 'percentage') {
    // (subtotalPaise * (discount_value * 100)) / 10000
    const basisPoints = Math.round(Number(coupon.discount_value) * 100);
    discountPaise = Math.round((subtotalPaise * basisPoints) / 10000);

    if (coupon.max_discount_paise !== null && coupon.max_discount_paise > 0) {
      discountPaise = Math.min(discountPaise, coupon.max_discount_paise);
    }
  } else {
    // fixed_paise
    const fixedAmount = Math.round(Number(coupon.discount_value));
    discountPaise = Math.min(fixedAmount, subtotalPaise);
  }

  // Ensure discount doesn't exceed subtotal
  discountPaise = Math.max(0, Math.min(discountPaise, subtotalPaise));

  return {
    isValid: true,
    coupon,
    discountPaise,
  };
}

/**
 * Increments coupon usage count after successful order placement.
 */
export async function incrementCouponUsage(couponId: string): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: coupon } = await supabase
      .from('coupons')
      .select('usage_count')
      .eq('id', couponId)
      .maybeSingle();

    if (coupon) {
      await supabase
        .from('coupons')
        .update({ usage_count: (coupon.usage_count || 0) + 1 })
        .eq('id', couponId);
    }
  } catch {
    // Ignore in offline mode
  }
}
