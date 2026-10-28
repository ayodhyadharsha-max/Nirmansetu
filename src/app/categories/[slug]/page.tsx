import React from 'react';
import { getCategoryBySlug, listProducts } from '@/lib/catalog/service';
import {
  HOMERUN_CATEGORIES,
  getCategoryProductsBySlug,
  HomeRunProductItem,
} from '@/config/homerun-catalog';
import { CategoryView } from '@/components/CategoryView';
import { BRAND_CONFIG } from '@/config/brand';

interface CategoryPageProps {
  params: { slug: string };
  searchParams: {
    brand?: string;
    inStock?: string;
    sort?: 'price_asc' | 'price_desc' | 'newest' | 'featured' | 'name';
    minPrice?: string;
    maxPrice?: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug);
  const matchingHomerun = HOMERUN_CATEGORIES.find(
    (c) => c.slug === params.slug || c.id === params.slug
  );
  const categoryName =
    category?.name ||
    matchingHomerun?.title ||
    params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${categoryName} in Ayodhya | ${BRAND_CONFIG.name}`,
    description: `Buy genuine ${categoryName.toLowerCase()} in Ayodhya Dham with local jobsite delivery. Transparent wholesale pricing from verified regional suppliers.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug);
  const matchingHomerun = HOMERUN_CATEGORIES.find(
    (c) => c.slug === params.slug || c.id === params.slug
  );

  const categoryName =
    category?.name ||
    matchingHomerun?.title ||
    params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Attempt database query
  const productResult = await listProducts({
    categorySlug: category?.slug || params.slug,
    brandSlug: searchParams.brand,
    inStockOnly: searchParams.inStock === 'true',
    sortBy: searchParams.sort,
    minPricePaise: searchParams.minPrice ? parseInt(searchParams.minPrice, 10) : undefined,
    maxPricePaise: searchParams.maxPrice ? parseInt(searchParams.maxPrice, 10) : undefined,
    limit: 24,
  });

  let products: HomeRunProductItem[] = [];

  if (productResult.items && productResult.items.length > 0) {
    products = productResult.items.map((dbItem) => ({
      id: dbItem.product_id,
      title: dbItem.product_title,
      slug: dbItem.product_slug,
      brand: dbItem.brand_name || 'Generic',
      mrp: Math.round(dbItem.mrp_paise / 100),
      price: Math.round(dbItem.selling_price_paise / 100),
      discountPct:
        dbItem.mrp_paise > dbItem.selling_price_paise
          ? Math.round(((dbItem.mrp_paise - dbItem.selling_price_paise) / dbItem.mrp_paise) * 100)
          : 0,
      badges: ['Site Delivery', 'Pay on Delivery'],
      imageUrl: dbItem.images?.[0] || '/images/products/ultratech_cement.png',
      bulkPriceText: `Unlock Bulk Prices of ₹${Math.round((dbItem.selling_price_paise * 0.95) / 100)}`,
      cashbackText: '5% Cashback on 1 Lakh+ orders',
      inStock: dbItem.is_in_stock,
    }));
  } else {
    // Fallback to high-definition verified catalog dataset (e.g. TILING_PRODUCTS matching screenshot)
    products = getCategoryProductsBySlug(params.slug);
  }

  // Parent navigation categorization
  let parentCategoryTitle = 'Civil & Interiors';
  let parentCategorySlug = 'civil-interiors';

  const clean = params.slug.toLowerCase();
  if (clean.includes('electr') || clean.includes('wire') || clean.includes('light')) {
    parentCategoryTitle = 'Electrical';
    parentCategorySlug = 'electrical-products';
  } else if (clean.includes('plumb') || clean.includes('pipe') || clean.includes('sanitary')) {
    parentCategoryTitle = 'Plumbing, Sanitary & Bath';
    parentCategorySlug = 'plumbing-pipes-fittings';
  } else if (clean.includes('tool') || clean.includes('drill') || clean.includes('grinder')) {
    parentCategoryTitle = 'Tools';
    parentCategorySlug = 'hardware-tools-fasteners';
  } else if (clean.includes('plywood') || clean.includes('hardware') || clean.includes('hinge') || clean.includes('fevicol')) {
    parentCategoryTitle = 'Furniture & Architectural Hardware';
    parentCategorySlug = 'furniture-architectural-hardware';
  }

  return (
    <CategoryView
      categoryTitle={categoryName}
      categorySlug={params.slug}
      parentCategoryTitle={parentCategoryTitle}
      parentCategorySlug={parentCategorySlug}
      products={products}
    />
  );
}
