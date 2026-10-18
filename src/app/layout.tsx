import type { Metadata } from 'next';
import './globals.css';
import { BRAND_CONFIG } from '@/config/brand';
import { AppProviders } from '@/providers/AppProviders';

export const metadata: Metadata = {
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
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
