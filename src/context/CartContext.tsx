'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PublicCatalogItem } from '@/types/database';
import { BRAND_CONFIG } from '@/config/brand';

export interface CartLine {
  item: PublicCatalogItem;
  quantity: number;
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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'nirmansetu_cart_v1';
const PINCODE_KEY = 'nirmansetu_pincode_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedPincode, setSelectedPincodeState] = useState<string>(BRAND_CONFIG.defaultPincode);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore cart and pincode from localStorage on mount (hydration-safe)
  useEffect(() => {
    try {
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
      // Ignore storage quota errors
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
    const qtyToAdd = Math.max(1, quantity);
    setCartLines((prev) => {
      const existing = prev.find((l) => l.item.variant_id === item.variant_id);
      if (existing) {
        return prev.map((l) =>
          l.item.variant_id === item.variant_id
            ? { ...l, quantity: l.quantity + qtyToAdd }
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
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

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
