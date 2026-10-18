import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getProductBySlug, getProductById, listProducts } from '@/lib/catalog/service';
import { ProductDetailView } from '@/components/ProductDetailView';
import { Header } from '@/components/Header';
import { CartDrawer } from '@/components/CartDrawer';
import { Footer } from '@/components/Footer';
import { BRAND_CONFIG } from '@/config/brand';

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ProductPageProps) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.slug);
  const product = isUuid ? await getProductById(params.slug) : await getProductBySlug(params.slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nirmansetu.in';

  return {
    title: `${product.product_title} in Ayodhya | ${BRAND_CONFIG.name}`,
    description: `Buy genuine ${product.product_title} in Ayodhya Dham with fast site delivery. Specifications, IS certifications and transparent wholesale pricing.`,
    alternates: {
      canonical: `/products/${product.product_slug}`,
    },
    openGraph: {
      title: `${product.product_title} | ${BRAND_CONFIG.name}`,
      description: `Buy genuine ${product.product_title} in Ayodhya with rapid 60-120 min delivery.`,
      url: `${baseUrl}/products/${product.product_slug}`,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.product_title} | ${BRAND_CONFIG.name}`,
      description: `Buy genuine ${product.product_title} in Ayodhya Dham with verified local stockists.`,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.slug);
  const product = isUuid ? await getProductById(params.slug) : await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  // Fetch related products from the same category
  const relatedResult = await listProducts({
    categorySlug: product.category_slug,
    limit: 6,
  });

  const relatedProducts = relatedResult.items.filter((i) => i.product_id !== product.product_id);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nirmansetu.in';
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.product_title,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand_name,
    },
    sku: product.sku,
    image: product.images?.[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: (product.selling_price_paise / 100).toFixed(2),
      availability: product.is_in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: BRAND_CONFIG.name,
      },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category_name,
        item: `${baseUrl}/categories/${product.category_slug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.product_title,
        item: `${baseUrl}/products/${product.product_slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Modern Storefront Header */}
      <Header />
      <CartDrawer />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <ProductDetailView product={product} relatedProducts={relatedProducts} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
