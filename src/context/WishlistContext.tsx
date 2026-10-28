'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PublicCatalogItem } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistItems: PublicCatalogItem[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: PublicCatalogItem) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => void;
  wishlistCount: number;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'nirmansetu_wishlist_items_v1';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<PublicCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load from local storage initially
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWishlistItems(parsed);
        }
      }
    } catch {
      // LocalStorage access fails safely
    }
  }, []);

  // Sync to database if user is authenticated and merge any guest items
  const fetchUserWishlist = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // 1. If user had items saved as a guest in localStorage, sync them to the account
      const guestItems = [...wishlistItems];
      if (guestItems.length > 0 && session?.access_token) {
        for (const item of guestItems) {
          try {
            await fetch('/api/wishlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...headers },
              body: JSON.stringify({ productId: item.product_id }),
            });
          } catch {
            // Skip individual failures
          }
        }
      }

      // 2. Fetch complete, authoritative wishlist from server
      const res = await fetch('/api/wishlist', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        const mapped: PublicCatalogItem[] = data.items.map((entry: any) => entry.product).filter(Boolean);
        // Combine server items and any unique guest items
        const combined = [...mapped];
        for (const g of guestItems) {
          if (!combined.some((c) => c.product_id === g.product_id || c.product_slug === g.product_slug)) {
            combined.push(g);
          }
        }
        setWishlistItems(combined);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));
        } catch {
          // Ignore
        }
      }
    } catch {
      // Fallback to local storage
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchUserWishlist();
    }
  }, [user?.id, fetchUserWishlist]);

  // Persist local state whenever wishlistItems change
  const saveItems = (items: PublicCatalogItem[]) => {
    setWishlistItems(items);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore
    }
  };

  const isWishlisted = useCallback(
    (productId: string) => {
      return wishlistItems.some((i) => i.product_id === productId || i.product_slug === productId);
    },
    [wishlistItems]
  );

  const toggleWishlist = async (product: PublicCatalogItem): Promise<boolean> => {
    const already = isWishlisted(product.product_id);
    let updated: PublicCatalogItem[];

    if (already) {
      updated = wishlistItems.filter((i) => i.product_id !== product.product_id && i.product_slug !== product.product_slug);
    } else {
      updated = [product, ...wishlistItems.filter((i) => i.product_id !== product.product_id)];
    }

    saveItems(updated);

    // If authenticated, sync with server
    if (user?.id) {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        if (already) {
          await fetch(`/api/wishlist?productId=${encodeURIComponent(product.product_id)}`, {
            method: 'DELETE',
            headers,
          });
        } else {
          await fetch('/api/wishlist', {
            method: 'POST',
            headers,
            body: JSON.stringify({ productId: product.product_id }),
          });
        }
      } catch {
        // Optimistic update retained locally
      }
    }

    return !already;
  };

  const removeFromWishlist = async (productId: string) => {
    const updated = wishlistItems.filter((i) => i.product_id !== productId && i.product_slug !== productId);
    saveItems(updated);

    if (user?.id) {
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
      } catch {
        // Optimistic update retained locally
      }
    }
  };

  const clearWishlist = () => {
    saveItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds: wishlistItems.map((i) => i.product_id),
        wishlistItems,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        wishlistCount: wishlistItems.length,
        isLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
