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

  return {
    title: `${product.product_title} in Ayodhya | ${BRAND_CONFIG.name}`,
    description: `Buy genuine ${product.product_title} in Ayodhya Dham with fast site delivery. Specifications, IS certifications and transparent wholesale pricing.`,
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
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
