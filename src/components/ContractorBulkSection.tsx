'use client';

import React from 'react';
import { CONTRACTOR_BULK_BUYS } from '@/config/homerun-catalog';
import { ProductCarousel } from './ProductCarousel';

interface ContractorBulkSectionProps {
  onOpenEnquiry?: () => void;
}

export const ContractorBulkSection: React.FC<ContractorBulkSectionProps> = ({ onOpenEnquiry }) => {
  return (
    <ProductCarousel
      title="Contractor Bulk Buys"
      subtitle="Trailer-lot TMT rebars, truckload cement, and pallet tile lots with statutory GST invoices"
      products={CONTRACTOR_BULK_BUYS}
      onOpenEnquiry={onOpenEnquiry}
      viewAllHref="/bulk-enquiry"
      badge="B2B Commercial Lots"
    />
  );
};
