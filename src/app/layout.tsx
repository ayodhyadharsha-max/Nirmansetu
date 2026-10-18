import type { Metadata } from 'next';
import './globals.css';
import { BRAND_CONFIG } from '@/config/brand';
import { AppProviders } from '@/providers/AppProviders';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nirmansetu.in';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: `${BRAND_CONFIG.name} | Construction Materials Delivered in Ayodhya | 60-120 Min Delivery`,
  description: `Buy genuine cement, TMT steel, red bricks, CPVC pipes, electrical & waterproofing materials in Ayodhya Dham with fast site delivery. Powered by approved local suppliers.`,
  keywords: [
    'Ayodhya construction materials',
    'buy cement Ayodhya',
    'Tata Tiscon Ayodhya',
    'UltraTech cement Faizabad',
    'building materials delivery Ayodhya',
    'TMT rebar supplier Uttar Pradesh',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: `${BRAND_CONFIG.name} | Construction Materials Delivered in Ayodhya`,
    description: `Buy genuine cement, TMT steel, red bricks, CPVC pipes, electrical & waterproofing materials in Ayodhya Dham with fast site delivery.`,
    url: baseUrl,
    siteName: BRAND_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND_CONFIG.name} | Ayodhya Building Materials`,
    description: `Fast jobsite delivery of cement, steel, bricks & plumbing in Ayodhya. Verified local stockists.`,
  },
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  name: BRAND_CONFIG.name,
  description: BRAND_CONFIG.tagline,
  url: baseUrl,
  telephone: '+91-9450011223',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Tedhi Bazar Road, Near Ram Path',
    addressLocality: 'Ayodhya',
    addressRegion: 'Uttar Pradesh',
    postalCode: '224123',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 26.7922,
    longitude: 82.1998,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '06:00',
      closes: '21:00',
    },
  ],
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, Credit Card, UPI, Net Banking, Razorpay',
  priceRange: '₹₹',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
