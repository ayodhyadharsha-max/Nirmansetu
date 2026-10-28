'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ServiceHighlights } from '@/components/ServiceHighlights';
import { HeroPromoBanner } from '@/components/HeroPromoBanner';
import { HomeCategoryGrid } from '@/components/HomeCategoryGrid';
import { HomeDealsSection } from '@/components/HomeDealsSection';
import { PopularMaterialsSection } from '@/components/PopularMaterialsSection';
import { NewlyLaunchedSection } from '@/components/NewlyLaunchedSection';
import { AuthenticityGuaranteeBanner } from '@/components/AuthenticityGuaranteeBanner';
import { CuratedCollectionsSection } from '@/components/CuratedCollectionsSection';
import { ContractorBulkSection } from '@/components/ContractorBulkSection';
import { HomeHowItWorksSection } from '@/components/HomeHowItWorksSection';
import { HomeFaqSection } from '@/components/HomeFaqSection';
import { MaterialCalculatorModal } from '@/components/MaterialCalculatorModal';
import { BulkEnquiryModal } from '@/components/BulkEnquiryModal';
import { CartDrawer } from '@/components/CartDrawer';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { Category, Brand, PublicCatalogItem } from '@/types/database';
import { SEED_CATEGORIES, SEED_BRANDS, SEED_CATALOG_ITEMS } from '@/lib/catalog/seed-data';

export default function HomePage() {
  const { selectedPincode, setSelectedPincode, addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Dynamic live database data with instantaneous initial state
  const [categories, setCategories] = useState<Category[]>(SEED_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(SEED_BRANDS);
  const [products, setProducts] = useState<PublicCatalogItem[]>(SEED_CATALOG_ITEMS.slice(0, 8));

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [catRes, brandRes, prodRes] = await Promise.all([
          fetch('/api/categories').then((r) => r.json()).catch(() => ({ categories: [] })),
          fetch('/api/brands').then((r) => r.json()).catch(() => ({ brands: [] })),
          fetch('/api/products').then((r) => r.json()).catch(() => ({ items: [] })),
        ]);
        if (isMounted) {
          if (catRes?.categories?.length) setCategories(catRes.categories);
          if (brandRes?.brands?.length) setBrands(brandRes.brands);
          setProducts(prodRes?.items || []);
        }
      } catch {
        // Handled
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

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
      
      {/* 1. Header with Announcement Bar, Logo, Location, Search, Cart & Category Navigation */}
      <Header
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenEnquiry={() => {
          setEnquiryInitialItems([]);
          setIsEnquiryOpen(true);
        }}
      />

      <main className="flex-1">
        {/* 2. Service Trust Highlights: Pay on Delivery, Direct Rates, Rapid Dispatch */}
        <ServiceHighlights />

        {/* 3. Hero Promo Banner: "Everything Your Project Needs. In One Place." */}
        <HeroPromoBanner
          onOpenEnquiry={() => {
            setEnquiryInitialItems([]);
            setIsEnquiryOpen(true);
          }}
        />

        {/* 4. 24 Category Squircles Grid with Bulk Prices Badges */}
        <HomeCategoryGrid categories={categories} />

        {/* 5. Deals Of The Week Product Carousel (Working arrows & smooth scroll) */}
        <HomeDealsSection
          onOpenEnquiry={() => {
            setEnquiryInitialItems([]);
            setIsEnquiryOpen(true);
          }}
        />

        {/* 6. Popular Construction Materials Product Carousel */}
        <PopularMaterialsSection
          onOpenEnquiry={() => {
            setEnquiryInitialItems([]);
            setIsEnquiryOpen(true);
          }}
        />

        {/* 7. Newly Launched Arrivals Product Carousel */}
        <NewlyLaunchedSection
          onOpenEnquiry={() => {
            setEnquiryInitialItems([]);
            setIsEnquiryOpen(true);
          }}
        />

        {/* 8. 100% Genuine Materials Quality Protocol Guarantee */}
        <AuthenticityGuaranteeBanner />

        {/* 9. Curated Collections: Hettich, Dr. Fixit, Fevicol, Putty/Primers & Electrical Piping Slider */}
        <CuratedCollectionsSection />

        {/* 10. Contractor Bulk Buys Commercial Lot Carousel */}
        <ContractorBulkSection
          onOpenEnquiry={() => {
            setEnquiryInitialItems([]);
            setIsEnquiryOpen(true);
          }}
        />

        {/* 11. Fulfillment Architecture & Site Quality Commitments with Genuine Photos */}
        <HomeHowItWorksSection />

        {/* 12. Technical FAQs and Buying Guides for Ayodhya Contractors */}
        <HomeFaqSection />
      </main>

      {/* 13. Broad Yellow Theme Footer with Newsletter & Ayodhya Hub Directory */}
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
