'use client';

import React from 'react';
import { NEWLY_LAUNCHED_PRODUCTS } from '@/config/homerun-catalog';
import { ProductCarousel } from './ProductCarousel';

interface NewlyLaunchedSectionProps {
  onOpenEnquiry?: () => void;
}

export const NewlyLaunchedSection: React.FC<NewlyLaunchedSectionProps> = ({ onOpenEnquiry }) => {
  return (
    <ProductCarousel
      title="Newly Launched"
      subtitle="Latest heavy storage racks, BEE 5-star geysers, CCTV surveillance & impact tools"
      products={NEWLY_LAUNCHED_PRODUCTS}
      onOpenEnquiry={onOpenEnquiry}
      viewAllHref="/search"
      badge="New Arrivals"
    />
  );
};
