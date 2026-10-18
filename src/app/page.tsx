'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { CategoryNav } from '@/components/CategoryNav';
import { HeroBanner } from '@/components/HeroBanner';
import { HomeCategoryGrid } from '@/components/HomeCategoryGrid';
import { ProductCatalog } from '@/components/ProductCatalog';
import { HomeDealsSection } from '@/components/HomeDealsSection';
import { HomeBrandsSection } from '@/components/HomeBrandsSection';
import { HomeContractorSection } from '@/components/HomeContractorSection';
import { HomeHowItWorksSection } from '@/components/HomeHowItWorksSection';
import { LocalSupplierTransparency } from '@/components/LocalSupplierTransparency';
import { HomeFaqSection } from '@/components/HomeFaqSection';
import { MaterialCalculatorModal } from '@/components/MaterialCalculatorModal';
import { BulkEnquiryModal } from '@/components/BulkEnquiryModal';
import { CartDrawer } from '@/components/CartDrawer';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { SEED_CATALOG_ITEMS } from '@/lib/catalog/seed-data';

export default function HomePage() {
  const { selectedPincode, setSelectedPincode, addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modals
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [enquiryInitialItems, setEnquiryInitialItems] = useState<
    Array<{ title: string; approxQty: number; unit: string }>
  >([]);

  // From Estimator to Bulk RFQ
  const handleApplyCalculatedMaterials = (
    items: Array<{ title: string; approxQty: number; unit: string }>
  ) => {
    setEnquiryInitialItems(items);
    setIsEnquiryOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      
      {/* 1, 2, 3: Announcement Bar, Main Header, Desktop Mega-Menu, Mobile Nav */}
      <Header
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenEnquiry={() => {
          setEnquiryInitialItems([]);
          setIsEnquiryOpen(true);
        }}
      />

      {/* Sub-Category Navigation Bar */}
      <CategoryNav
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
      />

      {/* 4. Hero Banner with Quick SLA Checker & Contractor Card */}
      <HeroBanner
        onPincodeSubmit={setSelectedPincode}
        onOpenEnquiry={() => {
          setEnquiryInitialItems([]);
          setIsEnquiryOpen(true);
        }}
      />

      <main className="flex-1">
        {/* 5. Shop by Category Grid (9 Categories) */}
        <HomeCategoryGrid />

        {/* 6. Best-Selling Products Fetched from Catalogue Backend */}
        <ProductCatalog
          items={SEED_CATALOG_ITEMS}
          selectedCategory={selectedCategory}
          selectedPincode={selectedPincode}
          onAddToCart={addToCart}
          onOpenEnquiry={() => {
            setEnquiryInitialItems([]);
            setIsEnquiryOpen(true);
          }}
        />

        {/* 8. Deals Based on Actual Admin-Configured Promotions */}
        <HomeDealsSection
          items={SEED_CATALOG_ITEMS}
          selectedPincode={selectedPincode}
        />

        {/* 7. Featured Brands Based on Approved Catalogue Data */}
        <HomeBrandsSection />

        {/* 9. Contractor and Bulk-Order Section */}
        <HomeContractorSection
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          onOpenEnquiry={() => {
            setEnquiryInitialItems([]);
            setIsEnquiryOpen(true);
          }}
        />

        {/* 10, 11. Product Trust, Service Info & How Ordering & Fulfilment Work */}
        <HomeHowItWorksSection />

        {/* Local Supplier Transparency Model */}
        <LocalSupplierTransparency />

        {/* 12. Technical FAQs and Buying Guides */}
        <HomeFaqSection />
      </main>

      {/* 13. Footer with Configurable Business Details and Policies */}
      <Footer />

      {/* Interactive Modals & Drawers */}
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

      <CartDrawer />

    </div>
  );
}
