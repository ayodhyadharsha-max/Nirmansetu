/**
 * NIRMANSETU: MONETARY ARITHMETIC UTILITIES
 *
 * All financial amounts in the system are represented as INTEGER PAISE.
 * ₹1 = 100 paise.
 *
 * CRITICAL RULE: Floating-point arithmetic MUST NEVER be used for currency
 * totals, cart line items, or payment processing.
 */

/**
 * Formats integer paise into a standard Indian Rupee string (e.g. ₹1,250.00 or ₹1,250)
 * Uses Intl.NumberFormat for Indian locale formatting (en-IN).
 */
export function formatPaiseToRupees(paise: number | bigint, includeDecimals = false): string {
  const numericPaise = typeof paise === 'bigint' ? Number(paise) : Math.round(paise);
  const rupees = numericPaise / 100;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Converts whole rupees (or rupee decimal input from a user) to integer paise.
 * Multiplies by 100 and applies Math.round to eliminate binary float artifacts.
 */
export function rupeesToPaise(rupees: number): number {
  if (isNaN(rupees) || !isFinite(rupees)) {
    throw new Error('Invalid rupee amount provided to rupeesToPaise');
  }
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise to decimal rupees.
 */
export function paiseToRupees(paise: number | bigint): number {
  const num = typeof paise === 'bigint' ? Number(paise) : paise;
  return Math.round(num) / 100;
}

/**
 * Calculates GST/Tax in integer paise for a taxable amount in paise and a GST percentage.
 * Example: taxablePaise = 10000 (₹100), gstRatePct = 18.00 -> 1800 paise (₹18)
 */
export function calculateTaxPaise(taxablePaise: number, gstRatePct: number): number {
  if (taxablePaise <= 0 || gstRatePct <= 0) return 0;
  // (taxablePaise * (gstRatePct * 100)) / 10000 using integer math
  const rateInBasisPoints = Math.round(gstRatePct * 100);
  return Math.round((taxablePaise * rateInBasisPoints) / 10000);
}

/**
 * Calculates order financial breakdown with integer arithmetic.
 */
export interface OrderFinancialSummary {
  subtotalPaise: number;
  taxPaise: number;
  deliveryFeePaise: number;
  discountPaise: number;
  totalPaise: number;
}

export function calculateOrderTotals(params: {
  items: Array<{ unitPricePaise: number; quantity: number; gstRatePct?: number }>;
  deliveryFeePaise?: number;
  discountPaise?: number;
}): OrderFinancialSummary {
  let subtotalPaise = 0;
  let taxPaise = 0;

  for (const item of params.items) {
    const itemTotal = item.unitPricePaise * item.quantity;
    subtotalPaise += itemTotal;

    if (item.gstRatePct && item.gstRatePct > 0) {
      taxPaise += calculateTaxPaise(itemTotal, item.gstRatePct);
    }
  }

  const deliveryFeePaise = Math.max(0, params.deliveryFeePaise || 0);
  const discountPaise = Math.max(0, Math.min(params.discountPaise || 0, subtotalPaise));

  const totalPaise = subtotalPaise + taxPaise + deliveryFeePaise - discountPaise;

  return {
    subtotalPaise,
    taxPaise,
    deliveryFeePaise,
    discountPaise,
    totalPaise: Math.max(0, totalPaise),
  };
}
