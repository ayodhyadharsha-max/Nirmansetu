'use client';

import React from 'react';
import { POPULAR_CONSTRUCTION_MATERIALS } from '@/config/homerun-catalog';
import { ProductCarousel } from './ProductCarousel';

interface PopularMaterialsSectionProps {
  onOpenEnquiry?: () => void;
}

export const PopularMaterialsSection: React.FC<PopularMaterialsSectionProps> = ({
  onOpenEnquiry,
}) => {
  return (
    <ProductCarousel
      title="Popular Construction Materials"
      subtitle="Top-dispatched cement bags, Fe 550D TMT steel, CPVC piping & waterproofing in Ayodhya"
      products={POPULAR_CONSTRUCTION_MATERIALS}
      onOpenEnquiry={onOpenEnquiry}
      viewAllHref="/categories/cement-construction-materials"
      badge="Top Site Reorders"
    />
  );
};
