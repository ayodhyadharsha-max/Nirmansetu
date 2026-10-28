'use client';

import React from 'react';
import { DEALS_OF_THE_WEEK } from '@/config/homerun-catalog';
import { ProductCarousel } from './ProductCarousel';

interface HomeDealsSectionProps {
  onOpenEnquiry?: () => void;
}

export const HomeDealsSection: React.FC<HomeDealsSectionProps> = ({ onOpenEnquiry }) => {
  return (
    <ProductCarousel
      title="Deals Of The Week"
      subtitle="8 products at our lowest benchmark price for Ayodhya Dham & Faizabad"
      products={DEALS_OF_THE_WEEK}
      onOpenEnquiry={onOpenEnquiry}
      viewAllHref="/categories/cement-construction-materials"
      badge="Lowest Ever Rates"
    />
  );
};
