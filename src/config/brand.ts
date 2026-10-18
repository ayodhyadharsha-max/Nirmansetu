/**
 * NIRMANSETU: BRAND IDENTITY & MARKETPLACE LOCALIZATION CONFIGURATION
 *
 * This module provides a single source of truth for platform branding,
 * contact details, and localization defaults. All branding strings can be
 * overridden via environment variables without touching component code.
 */

export interface BrandConfig {
  name: string;
  shortName: string;
  tagline: string;
  legalEntity: string;
  city: string;
  state: string;
  country: string;
  supportPhone: string;
  supportEmail: string;
  defaultCurrency: string;
  defaultPincode: string;
  operatingHours: string;
  isDemoMode: boolean;
}

export const BRAND_CONFIG: BrandConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'NirmanSetu',
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || 'NirmanSetu',
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || "Ayodhya's On-Demand Building Materials Marketplace",
  legalEntity: process.env.NEXT_PUBLIC_BRAND_LEGAL_ENTITY || 'NirmanSetu Tech & Infra Private Limited (Proposed)',
  city: process.env.NEXT_PUBLIC_BRAND_CITY || 'Ayodhya',
  state: process.env.NEXT_PUBLIC_BRAND_STATE || 'Uttar Pradesh',
  country: process.env.NEXT_PUBLIC_BRAND_COUNTRY || 'India',
  supportPhone: process.env.NEXT_PUBLIC_BRAND_SUPPORT_PHONE || '+91 94500 00000',
  supportEmail: process.env.NEXT_PUBLIC_BRAND_SUPPORT_EMAIL || 'support@nirmansetu.in',
  defaultCurrency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'INR',
  defaultPincode: process.env.NEXT_PUBLIC_DEFAULT_PINCODE || '224123',
  operatingHours: 'Open 8:00 AM to 8:00 PM (All 7 Days)',
  isDemoMode: process.env.NEXT_PUBLIC_ENABLE_DEMO_BADGES !== 'false',
};

/**
 * Verified Ayodhya District Hubs & Coverage Info
 */
export const AYODHYA_REGIONAL_HUBS = [
  {
    name: 'Ayodhya Dham Hub',
    pincode: '224123',
    coverage: 'Ram Janmabhoomi, Tedhi Bazar, Naya Ghat, Ramkot, Ranopali',
    slaMinutes: 60,
    isExpress: true,
  },
  {
    name: 'Faizabad Central Hub',
    pincode: '224001',
    coverage: 'Civil Lines, Rikabganj, Deokali Road, Chowk, Rekabganj',
    slaMinutes: 90,
    isExpress: true,
  },
  {
    name: 'Darshannagar Industrial Hub',
    pincode: '224133',
    coverage: 'Darshannagar, Medical College corridor, Railway siding',
    slaMinutes: 120,
    isExpress: false,
  },
  {
    name: 'Sohawal Cluster',
    pincode: '224122',
    coverage: 'Sohawal bypass, Raunahi, Industrial corridor',
    slaMinutes: 150,
    isExpress: false,
  },
  {
    name: 'Bikapur South',
    pincode: '224229',
    coverage: 'Bikapur market and southern rural sites',
    slaMinutes: 180,
    isExpress: false,
  },
] as const;
