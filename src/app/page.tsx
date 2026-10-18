'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { CategoryNav } from '@/components/CategoryNav';
import { HeroBanner } from '@/components/HeroBanner';
import { ProductCatalog } from '@/components/ProductCatalog';
import { PublicCatalogItem } from '@/types/database';
import { LocalSupplierTransparency } from '@/components/LocalSupplierTransparency';
import { MaterialCalculatorModal } from '@/components/MaterialCalculatorModal';
import { BulkEnquiryModal } from '@/components/BulkEnquiryModal';
import { CartDrawer, CartLine } from '@/components/CartDrawer';
import { Footer } from '@/components/Footer';
import { BRAND_CONFIG } from '@/config/brand';

export default function HomePage() {
  const [selectedPincode, setSelectedPincode] = useState(BRAND_CONFIG.defaultPincode);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Cart state
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modal states
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [enquiryInitialItems, setEnquiryInitialItems] = useState<
    Array<{ title: string; approxQty: number; unit: string }>
  >([]);

  // Add to cart handler
  const handleAddToCart = (item: PublicCatalogItem, quantity: number) => {
    setCartLines((prev) => {
      const existing = prev.find((l) => l.item.variant_id === item.variant_id);
      if (existing) {
        return prev.map((l) =>
          l.item.variant_id === item.variant_id ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [...prev, { item, quantity }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (variantId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(variantId);
      return;
    }
    setCartLines((prev) =>
      prev.map((l) => (l.item.variant_id === variantId ? { ...l, quantity: newQty } : l))
    );
  };

  const handleRemoveItem = (variantId: string) => {
    setCartLines((prev) => prev.filter((l) => l.item.variant_id !== variantId));
  };

  const handleClearCart = () => {
    setCartLines([]);
  };

  // Total quantity and total paise
  const cartCount = cartLines.reduce((acc, l) => acc + l.quantity, 0);
  const cartTotalPaise = cartLines.reduce(
    (acc, l) => acc + l.item.selling_price_paise * l.quantity,
    0
  );

  // From Calculator to Bulk RFQ
  const handleApplyCalculatedMaterials = (
    items: Array<{ title: string; approxQty: number; unit: string }>
  ) => {
    setEnquiryInitialItems(items);
    setIsEnquiryOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 1. Header with dynamic PIN Code selector and live cart info */}
      <Header
        selectedPincode={selectedPincode}
        onPincodeChange={setSelectedPincode}
        cartCount={cartCount}
        cartTotalPaise={cartTotalPaise}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenEnquiry={() => {
          setEnquiryInitialItems([]);
          setIsEnquiryOpen(true);
        }}
      />

      {/* 2. Sub-Category Navigation */}
      <CategoryNav
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
      />

      {/* 3. Hero Banner with Quick SLA Checker & Contractor Card */}
      <HeroBanner
        onPincodeSubmit={setSelectedPincode}
        onOpenEnquiry={() => {
          setEnquiryInitialItems([]);
          setIsEnquiryOpen(true);
        }}
      />

      {/* 4. Product Catalog with Local Supplier Attribution */}
      <main className="flex-1">
        <ProductCatalog
          selectedCategory={selectedCategory}
          selectedPincode={selectedPincode}
          onAddToCart={handleAddToCart}
          onOpenEnquiry={() => {
            setEnquiryInitialItems([]);
            setIsEnquiryOpen(true);
          }}
        />

        {/* 5. Marketplace Supplier Transparency Model */}
        <LocalSupplierTransparency />
      </main>

      {/* 6. Footer */}
      <Footer />

      {/* Modals & Drawers */}
      <MaterialCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onApplyMaterials={handleApplyCalculatedMaterials}
      />

      <BulkEnquiryModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        initialItems={enquiryInitialItems}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        lines={cartLines}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        selectedPincode={selectedPincode}
        onClearCart={handleClearCart}
      />
    </div>
  );
}
