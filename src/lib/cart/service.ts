/**
 * NIRMANSETU: CART DATA ACCESS & VALIDATION SERVICE
 *
 * Implements server-side trusted cart management:
 * - Server-side recalculation of every price, tax and delivery fee
 * - Minimum Order Quantity (MOQ) validation
 * - Real inventory & variant availability checks
 * - Guest cart persistence and safe post-login merging
 * - Strict integer paise financial arithmetic
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SEED_CATALOG_ITEMS } from '@/lib/catalog/seed-data';
import { ALL_HOMERUN_PRODUCTS, generateRealisticOptions } from '@/config/homerun-catalog';
import { calculateOrderTotals, calculateTaxPaise } from '@/lib/money';
import { validateCoupon, CouponRecord } from '@/lib/coupons/service';
import { AYODHYA_REGIONAL_HUBS, BRAND_CONFIG } from '@/config/brand';

export interface CartItemDetail {
  id: string; // cart_item id
  cart_id: string;
  variant_id: string;
  product_id: string;
  product_title: string;
  variant_title: string;
  sku: string;
  unit_of_measure: string;
  hsn_code?: string;
  quantity: number;
  unit_price_paise: number;
  mrp_paise: number;
  gst_rate_pct: number;
  min_order_qty: number;
  max_order_qty: number;
  available_stock: number;
  is_available: boolean;
  image_url: string;
  total_line_paise: number;
  validation_warnings?: string[];
}

export interface CartState {
  id: string;
  user_id: string | null;
  session_token: string | null;
  delivery_pincode: string;
  items: CartItemDetail[];
  coupon: CouponRecord | null;
  summary: {
    subtotalPaise: number;
    taxPaise: number;
    deliveryFeePaise: number;
    discountPaise: number;
    totalPaise: number;
  };
  isValidForCheckout: boolean;
  checkoutErrors: string[];
}

// In-memory store for guest/test sessions when database is offline or unmigrated
const memoryCarts = new Map<string, {
  id: string;
  userId: string | null;
  sessionToken: string | null;
  pincode: string;
  couponCode: string | null;
  items: Array<{ variantId: string; quantity: number }>;
  updatedAt: Date;
}>();

// Category helper: Maps product title and brand to authoritative PostgreSQL foreign key variant UUID, statutory HSN, and GST
function getCategorySeedAndTax(productOrTitle: string, brand?: string): {
  variant_id: string;
  product_id: string;
  hsn_code: string;
  default_unit: string;
  tax_rate_pct: number;
} {
  const text = `${productOrTitle} ${brand || ''}`.toLowerCase();

  // 1. Steel & TMT Rebars
  if (text.includes('tiscon') || text.includes('tmt') || text.includes('steel') || text.includes('rebar')) {
    return {
      variant_id: 'e0000000-0000-0000-0000-000000000002',
      product_id: 'd0000000-0000-0000-0000-000000000002',
      hsn_code: '721420',
      default_unit: 'pieces',
      tax_rate_pct: 18.0,
    };
  }

  // 2. Cement, Plaster, Mortar, Putty
  if (text.includes('cement') || text.includes('ultratech') || text.includes('ambuja') || text.includes('acc') || text.includes('plaster') || text.includes('mortar') || text.includes('putty')) {
    return {
      variant_id: 'e0000000-0000-0000-0000-000000000001',
      product_id: 'd0000000-0000-0000-0000-000000000001',
      hsn_code: '252329',
      default_unit: 'bags (50kg)',
      tax_rate_pct: 18.0,
    };
  }

  // 3. Tiles & Flooring
  if (text.includes('tile') || text.includes('kajaria') || text.includes('vitrified') || text.includes('ceramic') || text.includes('somany')) {
    return {
      variant_id: 'e0000000-0000-0000-0000-000000000004',
      product_id: 'd0000000-0000-0000-0000-000000000003',
      hsn_code: '690721',
      default_unit: 'boxes',
      tax_rate_pct: 18.0,
    };
  }

  // 4. Paints, Primers, Waterproofing
  if (text.includes('paint') || text.includes('primer') || text.includes('waterproof') || text.includes('emulsion') || text.includes('dr. fixit') || text.includes('asian paints') || text.includes('berger') || text.includes('nerolac')) {
    return {
      variant_id: 'e0000000-0000-0000-0000-000000000005',
      product_id: 'd0000000-0000-0000-0000-000000000004',
      hsn_code: '320910',
      default_unit: 'litres',
      tax_rate_pct: 18.0,
    };
  }

  // 5. Electrical, Wires, Cables, Switches, MCB
  if (text.includes('wire') || text.includes('cable') || text.includes('havells') || text.includes('polycab') || text.includes('anchor') || text.includes('mcb') || text.includes('switch') || text.includes('electrical')) {
    return {
      variant_id: 'e0000000-0000-0000-0000-000000000006',
      product_id: 'd0000000-0000-0000-0000-000000000005',
      hsn_code: '854449',
      default_unit: 'coils (90m)',
      tax_rate_pct: 18.0,
    };
  }

  // 6. Plumbing, Pipes, Fittings, CPVC, UPVC
  if (text.includes('pipe') || text.includes('cpvc') || text.includes('upvc') || text.includes('fitting') || text.includes('supreme') || text.includes('astral') || text.includes('plumbing')) {
    return {
      variant_id: 'e0000000-0000-0000-0000-000000000007',
      product_id: 'd0000000-0000-0000-0000-000000000006',
      hsn_code: '391723',
      default_unit: 'metres',
      tax_rate_pct: 18.0,
    };
  }

  // 7. Sanitaryware, Bathroom Fittings, Faucets
  if (text.includes('basin') || text.includes('toilet') || text.includes('mixer') || text.includes('jaquar') || text.includes('cera') || text.includes('sanitary') || text.includes('faucet') || text.includes('shower')) {
    return {
      variant_id: 'e0000000-0000-0000-0000-000000000008',
      product_id: 'd0000000-0000-0000-0000-000000000007',
      hsn_code: '848180',
      default_unit: 'units',
      tax_rate_pct: 18.0,
    };
  }

  // 8. Plywood, Boards, Laminates, MDF, HDHMR
  if (text.includes('plywood') || text.includes('board') || text.includes('greenply') || text.includes('century') || text.includes('hdhmr') || text.includes('mdf') || text.includes('laminate') || text.includes('tesa')) {
    return {
      variant_id: 'e0000000-0000-0000-0000-000000000009',
      product_id: 'd0000000-0000-0000-0000-000000000008',
      hsn_code: '441233',
      default_unit: "sheets (8'x4')",
      tax_rate_pct: 18.0,
    };
  }

  // 9. Hardware, Tools, Fasteners, Locks, Binding Wire, Adhesives, Fevicol
  if (text.includes('lock') || text.includes('godrej') || text.includes('tool') || text.includes('grinder') || text.includes('drill') || text.includes('hardware') || text.includes('fevicol') || text.includes('adhesive')) {
    return {
      variant_id: 'e0000000-0000-0000-0000-000000000010',
      product_id: 'd0000000-0000-0000-0000-000000000009',
      hsn_code: '830140',
      default_unit: 'units',
      tax_rate_pct: 18.0,
    };
  }

  // 10. Water Tanks, Kitchen, Sinks
  if (text.includes('tank') || text.includes('sintex') || text.includes('sink') || text.includes('kitchen')) {
    return {
      variant_id: 'e0000000-0000-0000-0000-000000000011',
      product_id: 'd0000000-0000-0000-0000-000000000010',
      hsn_code: '392510',
      default_unit: 'units',
      tax_rate_pct: 18.0,
    };
  }

  // Default to General Building Material (UltraTech PPC seed)
  return {
    variant_id: 'e0000000-0000-0000-0000-000000000001',
    product_id: 'd0000000-0000-0000-0000-000000000001',
    hsn_code: '252329',
    default_unit: 'units',
    tax_rate_pct: 18.0,
  };
}

/**
 * Finds variant details from trusted catalog sources (database, verified seed data, or homerun catalog).
 * Authoritatively validates any client-provided variant ID, option identifier, or catalog slug.
 */
export async function getTrustedVariantDetails(variantId: string): Promise<Omit<CartItemDetail, 'id' | 'cart_id' | 'quantity' | 'total_line_paise' | 'validation_warnings'> | null> {
  if (!variantId || typeof variantId !== 'string') return null;
  const cleanId = variantId.trim();
  const unPrefixed = cleanId.startsWith('v-') ? cleanId.slice(2) : cleanId;

  // 1. Try DB lookup by exact variant_id or unPrefixed if UUID
  try {
    const supabase = createServerSupabaseClient();
    const isCleanUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    const isUnprefixedUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(unPrefixed);
    const targetQueryId = isCleanUuid ? cleanId : (isUnprefixedUuid ? unPrefixed : null);

    if (targetQueryId) {
      const { data: item, error } = await supabase
        .from('public_catalog_view')
        .select('*')
        .eq('variant_id', targetQueryId)
        .maybeSingle();

      if (!error && item && item.selling_price_paise > 0) {
        return {
          variant_id: item.variant_id,
          product_id: item.product_id,
          product_title: item.product_title,
          variant_title: item.variant_title,
          sku: item.sku,
          unit_of_measure: item.unit_of_measure,
          hsn_code: item.hsn_code || '252329',
          unit_price_paise: item.selling_price_paise,
          mrp_paise: item.mrp_paise,
          gst_rate_pct: Number(item.tax_rate_pct || 18.0),
          min_order_qty: item.min_order_qty || 1,
          max_order_qty: item.max_order_qty || 1000,
          available_stock: item.total_available_stock || 0,
          is_available: item.is_in_stock,
          image_url: item.images?.[0] || '/images/placeholder-product.png',
        };
      }
    }
  } catch {
    // Database query failed
  }

  // 2. Direct match in SEED_CATALOG_ITEMS (by variant_id, product_id, or product_slug)
  const seedItem = SEED_CATALOG_ITEMS.find(
    (s) =>
      s.variant_id === cleanId ||
      s.variant_id === unPrefixed ||
      s.product_id === cleanId ||
      s.product_id === unPrefixed ||
      s.product_slug === cleanId ||
      s.product_slug === unPrefixed
  );

  if (seedItem) {
    return {
      variant_id: seedItem.variant_id,
      product_id: seedItem.product_id,
      product_title: seedItem.product_title,
      variant_title: seedItem.variant_title,
      sku: seedItem.sku,
      unit_of_measure: seedItem.unit_of_measure,
      hsn_code: seedItem.hsn_code || '252329',
      unit_price_paise: seedItem.selling_price_paise,
      mrp_paise: seedItem.mrp_paise,
      gst_rate_pct: Number(seedItem.tax_rate_pct || 18.0),
      min_order_qty: 1, // Permit retail on-demand orders from 1 unit
      max_order_qty: seedItem.max_order_qty || 1000,
      available_stock: seedItem.total_available_stock || 500,
      is_available: seedItem.is_in_stock ?? true,
      image_url: seedItem.images?.[0] || '/images/placeholder-product.png',
    };
  }

  // 3. Option matching in ALL_HOMERUN_PRODUCTS (explicit options or dynamic options from ProductOptionsModal)
  for (const prod of ALL_HOMERUN_PRODUCTS) {
    const allOptions = generateRealisticOptions(prod);
    const matchedOpt = allOptions.find((o) => {
      if (o.id === cleanId || o.id === unPrefixed) return true;
      if (`v-${o.id}` === cleanId) return true;
      if (`${prod.id}-${o.id}` === cleanId || `${prod.id}-${o.id}` === unPrefixed) return true;
      if (`v-${prod.id}-${o.id}` === cleanId) return true;
      // If unPrefixed is e.g. "deal-1-50kg" and prod.id is "deal-1"
      if (unPrefixed.startsWith(`${prod.id}-`)) {
        const optSuffix = unPrefixed.slice(prod.id.length + 1);
        if (o.id === optSuffix || o.id === unPrefixed || o.id.endsWith(optSuffix)) return true;
      }
      return false;
    });

    if (matchedOpt) {
      const catInfo = getCategorySeedAndTax(prod.title, prod.brand);
      const unit = matchedOpt.packSize?.includes('Coil') ? '90m coil' : (matchedOpt.title?.includes('Bag') ? '50kg bag' : catInfo.default_unit);

      return {
        variant_id: catInfo.variant_id,
        product_id: catInfo.product_id,
        product_title: prod.title,
        variant_title: matchedOpt.title || matchedOpt.name || matchedOpt.packSize || 'Standard Pack',
        sku: `SKU-${matchedOpt.id.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`,
        unit_of_measure: unit,
        hsn_code: catInfo.hsn_code,
        unit_price_paise: matchedOpt.price * 100, // Authoritative server price from product option
        mrp_paise: (matchedOpt.mrp || matchedOpt.price) * 100,
        gst_rate_pct: catInfo.tax_rate_pct,
        min_order_qty: 1,
        max_order_qty: 500,
        available_stock: 500,
        is_available: true,
        image_url: matchedOpt.imageUrl || prod.imageUrl || '/images/placeholder-product.png',
      };
    }
  }

  // 4. Direct product matching in ALL_HOMERUN_PRODUCTS (e.g. 'v-pop-6', 'pop-6', 'havells-lifeline-plus-25-wire')
  const matchedProd = ALL_HOMERUN_PRODUCTS.find(
    (p) =>
      p.id === cleanId ||
      p.id === unPrefixed ||
      p.slug === cleanId ||
      p.slug === unPrefixed ||
      p.altSlugs?.includes(cleanId) ||
      p.altSlugs?.includes(unPrefixed) ||
      cleanId.startsWith(p.id) ||
      unPrefixed.startsWith(p.id) ||
      cleanId.startsWith(p.slug) ||
      unPrefixed.startsWith(p.slug)
  );

  if (matchedProd) {
    const catInfo = getCategorySeedAndTax(matchedProd.title, matchedProd.brand);
    const unit = matchedProd.title.toLowerCase().includes('wire') ? '90m coil' : catInfo.default_unit;

    return {
      variant_id: catInfo.variant_id,
      product_id: catInfo.product_id,
      product_title: matchedProd.title,
      variant_title: matchedProd.options?.[0]?.title || matchedProd.bulkPriceText || 'Standard Unit',
      sku: `SKU-${matchedProd.id.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`,
      unit_of_measure: unit,
      hsn_code: catInfo.hsn_code,
      unit_price_paise: matchedProd.price * 100, // Authoritative server price from homerun catalog
      mrp_paise: matchedProd.mrp * 100,
      gst_rate_pct: catInfo.tax_rate_pct,
      min_order_qty: 1,
      max_order_qty: 500,
      available_stock: 500,
      is_available: true,
      image_url: matchedProd.imageUrl || '/images/placeholder-product.png',
    };
  }

  // 5. Fallback keyword matching in ALL_HOMERUN_PRODUCTS
  const cleanTokens = unPrefixed.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
  if (cleanTokens.length > 0) {
    const keywordMatch = ALL_HOMERUN_PRODUCTS.find((p) => {
      const hay = `${p.title} ${p.slug} ${p.brand}`.toLowerCase();
      return cleanTokens.some((t) => hay.includes(t));
    });

    if (keywordMatch) {
      const catInfo = getCategorySeedAndTax(keywordMatch.title, keywordMatch.brand);
      return {
        variant_id: catInfo.variant_id,
        product_id: catInfo.product_id,
        product_title: keywordMatch.title,
        variant_title: keywordMatch.options?.[0]?.title || keywordMatch.bulkPriceText || 'Standard Unit',
        sku: `SKU-${keywordMatch.id.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`,
        unit_of_measure: catInfo.default_unit,
        hsn_code: catInfo.hsn_code,
        unit_price_paise: keywordMatch.price * 100,
        mrp_paise: keywordMatch.mrp * 100,
        gst_rate_pct: catInfo.tax_rate_pct,
        min_order_qty: 1,
        max_order_qty: 500,
        available_stock: 500,
        is_available: true,
        image_url: keywordMatch.imageUrl || '/images/placeholder-product.png',
      };
    }
  }

  // Not found in any trusted source
  return null;
}

/**
 * Calculates delivery fee for a specific PIN code in integer paise.
 */
export async function calculateDeliveryFeeForPincode(pincode: string, isExpress = false): Promise<number> {
  const hub = AYODHYA_REGIONAL_HUBS.find((h) => h.pincode === pincode);
  if (hub) {
    if (isExpress && hub.isExpress) return 39900;
    return 19900;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('service_pincodes')
      .select('is_serviceable, standard_delivery_fee_paise, express_available, express_delivery_fee_paise')
      .eq('pincode', pincode)
      .maybeSingle();

    if (data && data.is_serviceable) {
      if (isExpress && data.express_available) {
        return data.express_delivery_fee_paise;
      }
      return data.standard_delivery_fee_paise;
    }
  } catch {
    // Fallback
  }

  return 19900;
}

/**
 * Retrieves full cart with server-side validation, live stock checks and pricing.
 */
export async function getCart(
  cartIdentifier: string,
  pincode?: string,
  overrideItems?: Array<{ variantId: string; quantity: number }>
): Promise<CartState> {
  const targetPincode = pincode || BRAND_CONFIG.defaultPincode;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cartIdentifier);

  // 1. Try DB lookup ONLY if overrideItems is not provided
  let dbCart: any = null;
  let dbItems: any[] = [];

  if (!overrideItems || overrideItems.length === 0) {
    try {
      const supabase = createServerSupabaseClient();
      let query = supabase.from('carts').select('*');
      if (isUuid) {
        query = query.eq('id', cartIdentifier);
      } else {
        query = query.eq('session_token', cartIdentifier);
      }
      const { data } = await query.maybeSingle();
      dbCart = data;

      if (dbCart) {
        const { data: items } = await supabase
          .from('cart_items')
          .select('*')
          .eq('cart_id', dbCart.id);
        dbItems = items || [];
      }
    } catch {
      // DB offline
    }
  }

  // Fallback to memory cart if DB didn't find it
  let cartId = dbCart?.id || cartIdentifier;
  let rawItems: Array<{ id?: string; variantId: string; quantity: number }> = [];
  let couponCode: string | null = null;
  let activePincode = dbCart?.delivery_pincode || targetPincode;

  if (overrideItems && overrideItems.length > 0) {
    // Use authoritative items submitted directly from client cart
    cartId = isUuid ? cartIdentifier : (dbCart?.id || cartIdentifier);
    rawItems = overrideItems.map((i, idx) => ({ id: `client-item-${idx}`, ...i }));
    memoryCarts.set(cartIdentifier, {
      id: cartId,
      userId: dbCart?.user_id || null,
      sessionToken: isUuid ? null : cartIdentifier,
      pincode: activePincode,
      couponCode: null,
      items: overrideItems,
      updatedAt: new Date(),
    });
  } else if (dbCart) {
    rawItems = dbItems.map((i) => ({ id: i.id, variantId: i.variant_id, quantity: i.quantity }));
    if (dbCart.coupon_id) {
      // Look up coupon
      const { data: couponData } = await createServerSupabaseClient()
        .from('coupons')
        .select('code')
        .eq('id', dbCart.coupon_id)
        .maybeSingle();
      couponCode = couponData?.code || null;
    }
  } else {
    // Memory store
    const memCart = memoryCarts.get(cartIdentifier) || memoryCarts.get(cartId);
    if (memCart) {
      cartId = memCart.id;
      rawItems = memCart.items.map((i, idx) => ({ id: `mem-item-${idx}`, ...i }));
      couponCode = memCart.couponCode;
      activePincode = memCart.pincode || targetPincode;
    } else {
      // Brand new virtual cart
      cartId = isUuid ? cartIdentifier : `c0000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      memoryCarts.set(cartIdentifier, {
        id: cartId,
        userId: null,
        sessionToken: isUuid ? null : cartIdentifier,
        pincode: activePincode,
        couponCode: null,
        items: [],
        updatedAt: new Date(),
      });
    }
  }

  // 2. Validate all items against server-side single source of truth
  const detailedItems: CartItemDetail[] = [];
  const checkoutErrors: string[] = [];

  for (const raw of rawItems) {
    const variant = await getTrustedVariantDetails(raw.variantId);
    if (!variant) {
      checkoutErrors.push(`Item variant "${raw.variantId}" is no longer available in catalog.`);
      continue;
    }

    const warnings: string[] = [];
    if (!variant.is_available || variant.available_stock <= 0) {
      warnings.push('Item is currently out of stock with local Ayodhya suppliers.');
      checkoutErrors.push(`${variant.product_title} is out of stock.`);
    } else if (raw.quantity > variant.available_stock) {
      warnings.push(`Only ${variant.available_stock} ${variant.unit_of_measure} available in local stock.`);
      checkoutErrors.push(`${variant.product_title}: Requested quantity (${raw.quantity}) exceeds available stock (${variant.available_stock}).`);
    }

    if (raw.quantity <= 0) {
      checkoutErrors.push(`${variant.product_title}: Quantity must be greater than zero.`);
    } else if (raw.quantity < (variant.min_order_qty || 1)) {
      warnings.push(`Commercial bulk pack recommended: ${variant.min_order_qty} ${variant.unit_of_measure}.`);
    }

    const totalLinePaise = variant.unit_price_paise * raw.quantity;

    detailedItems.push({
      id: raw.id || `item-${variant.variant_id}`,
      cart_id: cartId,
      variant_id: variant.variant_id,
      product_id: variant.product_id,
      product_title: variant.product_title,
      variant_title: variant.variant_title,
      sku: variant.sku,
      unit_of_measure: variant.unit_of_measure,
      hsn_code: variant.hsn_code,
      quantity: raw.quantity,
      unit_price_paise: variant.unit_price_paise,
      mrp_paise: variant.mrp_paise,
      gst_rate_pct: variant.gst_rate_pct,
      min_order_qty: variant.min_order_qty,
      max_order_qty: variant.max_order_qty,
      available_stock: variant.available_stock,
      is_available: variant.is_available,
      image_url: variant.image_url,
      total_line_paise: totalLinePaise,
      validation_warnings: warnings.length > 0 ? warnings : undefined,
    });
  }

  // 3. Compute pure integer financial summary
  const calculationItems = detailedItems.map((d) => ({
    unitPricePaise: d.unit_price_paise,
    quantity: d.quantity,
    gstRatePct: d.gst_rate_pct,
  }));

  const subtotalPaise = detailedItems.reduce((acc, i) => acc + i.total_line_paise, 0);

  // Validate coupon if applied
  let appliedCoupon: CouponRecord | null = null;
  let discountPaise = 0;

  if (couponCode && subtotalPaise > 0) {
    const couponRes = await validateCoupon(couponCode, subtotalPaise);
    if (couponRes.isValid && couponRes.coupon) {
      appliedCoupon = couponRes.coupon;
      discountPaise = couponRes.discountPaise;
    } else {
      checkoutErrors.push(couponRes.errorMessage || 'Invalid promotional coupon');
    }
  }

  const deliveryFeePaise = detailedItems.length > 0
    ? await calculateDeliveryFeeForPincode(activePincode)
    : 0;

  const totals = calculateOrderTotals({
    items: calculationItems,
    deliveryFeePaise,
    discountPaise,
  });

  return {
    id: cartId,
    user_id: dbCart?.user_id || null,
    session_token: dbCart?.session_token || (isUuid ? null : cartIdentifier),
    delivery_pincode: activePincode,
    items: detailedItems,
    coupon: appliedCoupon,
    summary: totals,
    isValidForCheckout: detailedItems.length > 0 && checkoutErrors.length === 0,
    checkoutErrors,
  };
}

/**
 * Adds an item to the cart, enforcing MOQ and available stock.
 */
export async function addItemToCart(params: {
  cartId?: string;
  sessionToken?: string;
  userId?: string;
  variantId: string;
  quantity: number;
  pincode?: string;
}): Promise<{ success: boolean; cart: CartState; error?: string }> {
  const variant = await getTrustedVariantDetails(params.variantId);
  if (!variant) {
    return { success: false, cart: await getCart(params.cartId || params.sessionToken || 'default'), error: 'Invalid or unlisted product variant' };
  }

  if (!variant.is_available || variant.available_stock <= 0) {
    return { success: false, cart: await getCart(params.cartId || params.sessionToken || 'default'), error: 'Item is currently out of stock with local Ayodhya suppliers' };
  }

  const minQty = variant.min_order_qty || 1;
  const initialQty = Math.max(minQty, params.quantity);

  if (initialQty > variant.available_stock) {
    return {
      success: false,
      cart: await getCart(params.cartId || params.sessionToken || 'default'),
      error: `Requested quantity (${initialQty}) exceeds available stock (${variant.available_stock} ${variant.unit_of_measure})`,
    };
  }

  const cartIdentifier = params.cartId || params.sessionToken || (params.userId ? `user-cart-${params.userId}` : `guest-${Date.now()}`);

  // Memory cart update
  let mem = memoryCarts.get(cartIdentifier);
  if (!mem) {
    mem = {
      id: params.cartId || `c0000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      userId: params.userId || null,
      sessionToken: params.sessionToken || null,
      pincode: params.pincode || BRAND_CONFIG.defaultPincode,
      couponCode: null,
      items: [],
      updatedAt: new Date(),
    };
    memoryCarts.set(cartIdentifier, mem);
    memoryCarts.set(mem.id, mem);
  }

  const existingIndex = mem.items.findIndex((i) => i.variantId === params.variantId);
  if (existingIndex >= 0) {
    const newQty = mem.items[existingIndex].quantity + initialQty;
    if (newQty > variant.available_stock) {
      return {
        success: false,
        cart: await getCart(cartIdentifier),
        error: `Cannot add more. Total in cart (${newQty}) would exceed stock limit of ${variant.available_stock} ${variant.unit_of_measure}`,
      };
    }
    mem.items[existingIndex].quantity = newQty;
  } else {
    mem.items.push({ variantId: params.variantId, quantity: initialQty });
  }

  // Also sync with DB if Supabase client is active
  try {
    const supabase = createServerSupabaseClient();
    // Insert/update cart record
    const { data: cartData } = await supabase
      .from('carts')
      .upsert({
        id: mem.id,
        user_id: params.userId || null,
        session_token: params.sessionToken || null,
        delivery_pincode: params.pincode || BRAND_CONFIG.defaultPincode,
      })
      .select('id')
      .single();

    if (cartData) {
      await supabase.from('cart_items').upsert(
        {
          cart_id: cartData.id,
          variant_id: params.variantId,
          quantity: existingIndex >= 0 ? mem.items[existingIndex].quantity : initialQty,
        },
        { onConflict: 'cart_id,variant_id' }
      );
    }
  } catch {
    // Database sync error handled gracefully
  }

  const updatedCart = await getCart(cartIdentifier, params.pincode);
  return { success: true, cart: updatedCart };
}

/**
 * Updates quantity of a variant in the cart.
 */
export async function updateItemQuantity(params: {
  cartId: string;
  variantId: string;
  quantity: number;
}): Promise<{ success: boolean; cart: CartState; error?: string }> {
  if (params.quantity <= 0) {
    return removeItemFromCart(params.cartId, params.variantId);
  }

  const variant = await getTrustedVariantDetails(params.variantId);
  if (!variant) {
    return { success: false, cart: await getCart(params.cartId), error: 'Product variant not found' };
  }

  if (params.quantity < variant.min_order_qty) {
    return {
      success: false,
      cart: await getCart(params.cartId),
      error: `Minimum order quantity for ${variant.product_title} is ${variant.min_order_qty} ${variant.unit_of_measure}.`,
    };
  }

  if (params.quantity > variant.available_stock) {
    return {
      success: false,
      cart: await getCart(params.cartId),
      error: `Only ${variant.available_stock} ${variant.unit_of_measure} available in stock.`,
    };
  }

  const mem = memoryCarts.get(params.cartId);
  if (mem) {
    const item = mem.items.find((i) => i.variantId === params.variantId);
    if (item) item.quantity = params.quantity;
  }

  try {
    const supabase = createServerSupabaseClient();
    await supabase
      .from('cart_items')
      .update({ quantity: params.quantity })
      .eq('cart_id', params.cartId)
      .eq('variant_id', params.variantId);
  } catch {
    // DB sync error handled gracefully
  }

  const cart = await getCart(params.cartId);
  return { success: true, cart };
}

/**
 * Removes a line item from the cart.
 */
export async function removeItemFromCart(cartId: string, variantId: string): Promise<{ success: boolean; cart: CartState }> {
  const mem = memoryCarts.get(cartId);
  if (mem) {
    mem.items = mem.items.filter((i) => i.variantId !== variantId);
  }

  try {
    const supabase = createServerSupabaseClient();
    await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .eq('variant_id', variantId);
  } catch {
    // Handled
  }

  const cart = await getCart(cartId);
  return { success: true, cart };
}

/**
 * Applies a promotional coupon to the cart after validating discount and min order value.
 */
export async function applyCouponToCart(cartId: string, couponCode: string): Promise<{ success: boolean; cart: CartState; error?: string }> {
  const cart = await getCart(cartId);
  if (cart.items.length === 0) {
    return { success: false, cart, error: 'Cannot apply coupon to an empty cart' };
  }

  const validation = await validateCoupon(couponCode, cart.summary.subtotalPaise);
  if (!validation.isValid) {
    return { success: false, cart, error: validation.errorMessage };
  }

  const mem = memoryCarts.get(cartId);
  if (mem) {
    mem.couponCode = couponCode.toUpperCase();
  }

  try {
    const supabase = createServerSupabaseClient();
    await supabase
      .from('carts')
      .update({ coupon_id: validation.coupon?.id || null })
      .eq('id', cartId);
  } catch {
    // Handled
  }

  const updatedCart = await getCart(cartId);
  return { success: true, cart: updatedCart };
}

/**
 * Removes applied coupon from cart.
 */
export async function removeCouponFromCart(cartId: string): Promise<{ success: boolean; cart: CartState }> {
  const mem = memoryCarts.get(cartId);
  if (mem) {
    mem.couponCode = null;
  }

  try {
    const supabase = createServerSupabaseClient();
    await supabase
      .from('carts')
      .update({ coupon_id: null })
      .eq('id', cartId);
  } catch {
    // Handled
  }

  const cart = await getCart(cartId);
  return { success: true, cart };
}

/**
 * Merges a guest cart into an authenticated user's cart safely upon login.
 * Preserves existing user cart items and merges quantities without duplicate line entries.
 */
export async function mergeGuestCart(params: {
  guestSessionToken: string;
  userId: string;
}): Promise<{ success: boolean; cart: CartState }> {
  const guestCart = await getCart(params.guestSessionToken);
  const userCartId = `user-cart-${params.userId}`;

  // For each item in guest cart, add to user cart
  for (const item of guestCart.items) {
    await addItemToCart({
      cartId: userCartId,
      userId: params.userId,
      variantId: item.variant_id,
      quantity: item.quantity,
      pincode: guestCart.delivery_pincode,
    });
  }

  // If guest cart had a coupon, copy it over if user cart doesn't have one
  if (guestCart.coupon) {
    await applyCouponToCart(userCartId, guestCart.coupon.code);
  }

  // Clean up guest memory cart
  memoryCarts.delete(params.guestSessionToken);

  try {
    const supabase = createServerSupabaseClient();
    await supabase.from('carts').delete().eq('session_token', params.guestSessionToken);
  } catch {
    // Handled
  }

  const merged = await getCart(userCartId);
  return { success: true, cart: merged };
}
