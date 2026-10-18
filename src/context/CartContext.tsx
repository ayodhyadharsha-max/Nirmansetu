'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PublicCatalogItem } from '@/types/database';
import { BRAND_CONFIG } from '@/config/brand';
import { useAuth } from '@/context/AuthContext';

export interface CartLine {
  item: PublicCatalogItem;
  quantity: number;
}

export interface AppliedCouponInfo {
  code: string;
  discountPaise: number;
  description?: string;
}

interface CartContextType {
  cartLines: CartLine[];
  addToCart: (item: PublicCatalogItem, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotalPaise: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  selectedPincode: string;
  setSelectedPincode: (pincode: string) => void;
  sessionToken: string;
  appliedCoupon: AppliedCouponInfo | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
  mergeGuestCartOnAuth: (userId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'nirmansetu_cart_v1';
const PINCODE_KEY = 'nirmansetu_pincode_v1';
const SESSION_KEY = 'nirmansetu_session_token_v1';
const COUPON_KEY = 'nirmansetu_coupon_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedPincode, setSelectedPincodeState] = useState<string>(BRAND_CONFIG.defaultPincode);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore cart, session token and coupon on mount
  useEffect(() => {
    try {
      let token = localStorage.getItem(SESSION_KEY);
      if (!token) {
        token = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(SESSION_KEY, token);
      }
      setSessionToken(token);

      const storedCart = localStorage.getItem(STORAGE_KEY);
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          setCartLines(parsed);
        }
      }

      const storedPincode = localStorage.getItem(PINCODE_KEY);
      if (storedPincode) {
        setSelectedPincodeState(storedPincode);
      }

      const storedCoupon = localStorage.getItem(COUPON_KEY);
      if (storedCoupon) {
        const parsedCoupon = JSON.parse(storedCoupon);
        if (parsedCoupon?.code) {
          setAppliedCoupon(parsedCoupon);
        }
      }
    } catch {
      // LocalStorage access fails safely
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartLines));
    } catch {
      // Ignore quota errors
    }
  }, [cartLines, isHydrated]);

  const setSelectedPincode = (pincode: string) => {
    setSelectedPincodeState(pincode);
    try {
      localStorage.setItem(PINCODE_KEY, pincode);
    } catch {
      // Ignore
    }
  };

  const addToCart = (item: PublicCatalogItem, quantity: number = item.min_order_qty || 1) => {
    const minQty = item.min_order_qty || 1;
    const qtyToAdd = Math.max(minQty, quantity);

    setCartLines((prev) => {
      const existing = prev.find((l) => l.item.variant_id === item.variant_id);
      if (existing) {
        const newQty = existing.quantity + qtyToAdd;
        return prev.map((l) =>
          l.item.variant_id === item.variant_id
            ? { ...l, quantity: newQty }
            : l
        );
      }
      return [...prev, { item, quantity: qtyToAdd }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (variantId: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(variantId);
      return;
    }
    setCartLines((prev) =>
      prev.map((l) => (l.item.variant_id === variantId ? { ...l, quantity: newQty } : l))
    );
  };

  const removeItem = (variantId: string) => {
    setCartLines((prev) => prev.filter((l) => l.item.variant_id !== variantId));
  };

  const clearCart = () => {
    setCartLines([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(COUPON_KEY);
    } catch {
      // Ignore
    }
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/cart/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: sessionToken || 'guest-cart',
          couponCode: code,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid promotional coupon' };
      }

      const couponInfo: AppliedCouponInfo = {
        code: data.cart?.coupon?.code || code.toUpperCase(),
        discountPaise: data.cart?.summary?.discountPaise || 0,
        description: data.cart?.coupon?.description,
      };

      setAppliedCoupon(couponInfo);
      try {
        localStorage.setItem(COUPON_KEY, JSON.stringify(couponInfo));
      } catch {
        // Ignore
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Network error validating coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    try {
      localStorage.removeItem(COUPON_KEY);
    } catch {
      // Ignore
    }
  };

  const mergeGuestCartOnAuth = useCallback(async (userId: string) => {
    if (!sessionToken || cartLines.length === 0) return;

    try {
      await fetch('/api/cart/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestSessionToken: sessionToken,
          userId,
        }),
      });
    } catch {
      // Handled
    }
  }, [sessionToken, cartLines.length]);

  const { user } = useAuth();

  useEffect(() => {
    if (user?.id && sessionToken && cartLines.length > 0) {
      mergeGuestCartOnAuth(user.id);
    }
  }, [user?.id, sessionToken, cartLines.length, mergeGuestCartOnAuth]);

  const cartCount = cartLines.reduce((acc, l) => acc + l.quantity, 0);
  const cartTotalPaise = cartLines.reduce(
    (acc, l) => acc + l.item.selling_price_paise * l.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartLines,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        cartCount,
        cartTotalPaise,
        isCartOpen,
        setIsCartOpen,
        selectedPincode,
        setSelectedPincode,
        sessionToken,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        mergeGuestCartOnAuth,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
