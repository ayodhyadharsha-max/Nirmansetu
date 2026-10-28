import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProductById, getProductBySlug } from '@/lib/catalog/service';
import { PublicCatalogItem } from '@/types/database';

export interface WishlistProductResult {
  wishlistId: string;
  productId: string;
  addedAt: string;
  product: PublicCatalogItem | null;
}

// In-memory fallback wishlist for guest or offline scenarios
const inMemoryWishlists = new Map<string, Set<string>>();

export async function getUserWishlist(userId: string): Promise<WishlistProductResult[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('customer_wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const results: WishlistProductResult[] = [];
      for (const item of data) {
        const prod = (await getProductById(item.product_id)) || (await getProductBySlug(item.product_id));
        results.push({
          wishlistId: item.id,
          productId: item.product_id,
          addedAt: item.created_at,
          product: prod,
        });
      }
      return results;
    }
  } catch {
    // Database query failed
  }

  // Fallback to memory
  const userSet = inMemoryWishlists.get(userId) || new Set();
  const results: WishlistProductResult[] = [];
  for (const prodId of Array.from(userSet)) {
    const prod = (await getProductById(prodId)) || (await getProductBySlug(prodId));
    results.push({
      wishlistId: `mem-${prodId}`,
      productId: prodId,
      addedAt: new Date().toISOString(),
      product: prod,
    });
  }
  return results;
}

export async function addToUserWishlist(userId: string, productId: string): Promise<boolean> {
  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('customer_wishlist')
      .insert({
        user_id: userId,
        product_id: productId,
      });

    if (!error || error.code === '23505') {
      // 23505 is unique violation (already in wishlist)
      return true;
    }
  } catch {
    // Fallback to memory
  }

  if (!inMemoryWishlists.has(userId)) {
    inMemoryWishlists.set(userId, new Set());
  }
  inMemoryWishlists.get(userId)!.add(productId);
  return true;
}

export async function removeFromUserWishlist(userId: string, productId: string): Promise<boolean> {
  try {
    const adminSupabase = createAdminClient();
    await adminSupabase
      .from('customer_wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
  } catch {
    // Fallback
  }

  if (inMemoryWishlists.has(userId)) {
    inMemoryWishlists.get(userId)!.delete(productId);
  }
  return true;
}

export interface WishlistProductAggregate {
  productId: string;
  productTitle: string;
  brandName: string;
  categoryName: string;
  wishlistCount: number;
  sellingPricePaise: number;
  isInStock: boolean;
  totalStock: number;
  isHighDemandZeroStock: boolean;
}

export interface WishlistAdminReport {
  totalWishlistEntries: number;
  uniqueProductsCount: number;
  highDemandZeroStockCount: number;
  topWishlisted: WishlistProductAggregate[];
  categoryBreakdown: Array<{ categoryName: string; count: number }>;
}

/**
 * Generates an aggregate, privacy-preserving wishlist demand report for administrators.
 */
export async function getAggregateWishlistReportAdmin(): Promise<WishlistAdminReport> {
  const productCountMap = new Map<string, number>();
  let totalEntries = 0;

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('customer_wishlist')
      .select('product_id');

    if (!error && data) {
      totalEntries = data.length;
      for (const row of data) {
        const count = productCountMap.get(row.product_id) || 0;
        productCountMap.set(row.product_id, count + 1);
      }
    }
  } catch {
    // Database query fallback
  }

  // Include any in-memory wishlists
  for (const set of Array.from(inMemoryWishlists.values())) {
    for (const prodId of Array.from(set) as string[]) {
      if (!productCountMap.has(prodId)) {
        totalEntries++;
      }
      productCountMap.set(prodId, (productCountMap.get(prodId) || 0) + 1);
    }
  }

  const aggregates: WishlistProductAggregate[] = [];
  const categoryMap = new Map<string, number>();

  for (const [prodId, count] of Array.from(productCountMap.entries())) {
    const prod = (await getProductById(prodId)) || (await getProductBySlug(prodId));
    if (prod) {
      const isZeroStock = !prod.is_in_stock || prod.total_available_stock === 0;
      aggregates.push({
        productId: prod.product_id,
        productTitle: prod.product_title,
        brandName: prod.brand_name || 'Generic',
        categoryName: prod.category_name || 'Materials',
        wishlistCount: count,
        sellingPricePaise: prod.selling_price_paise,
        isInStock: prod.is_in_stock,
        totalStock: prod.total_available_stock,
        isHighDemandZeroStock: isZeroStock && count >= 1,
      });

      const catName = prod.category_name || 'Materials';
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + count);
    }
  }

  // Sort descending by wishlistCount
  aggregates.sort((a, b) => b.wishlistCount - a.wishlistCount);

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([cat, cnt]) => ({
      categoryName: cat,
      count: cnt,
    }))
    .sort((a, b) => b.count - a.count);

  const highDemandZeroStockCount = aggregates.filter((a) => a.isHighDemandZeroStock).length;

  return {
    totalWishlistEntries: totalEntries,
    uniqueProductsCount: aggregates.length,
    highDemandZeroStockCount,
    topWishlisted: aggregates,
    categoryBreakdown,
  };
}
