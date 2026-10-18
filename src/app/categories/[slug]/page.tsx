import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, Filter, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { getCategoryBySlug, listProducts, getCategories, getBrands } from '@/lib/catalog/service';
import { ProductCard } from '@/components/ProductCard';
import { Header } from '@/components/Header';
import { CartDrawer } from '@/components/CartDrawer';
import { Footer } from '@/components/Footer';
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
  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.name} in Ayodhya | ${BRAND_CONFIG.name}`,
    description: `Buy genuine ${category.name.toLowerCase()} in Ayodhya Dham with fast 60-120 minute site delivery. Direct wholesale pricing from approved local dealers.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) {
    notFound();
  }

  const [allCategories, allBrands, productResult] = await Promise.all([
    getCategories(),
    getBrands(),
    listProducts({
      categorySlug: category.slug,
      brandSlug: searchParams.brand,
      inStockOnly: searchParams.inStock === 'true',
      sortBy: searchParams.sort,
      minPricePaise: searchParams.minPrice ? parseInt(searchParams.minPrice, 10) : undefined,
      maxPricePaise: searchParams.maxPrice ? parseInt(searchParams.maxPrice, 10) : undefined,
      limit: 24,
    }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Modern Storefront Header */}
      <Header />
      <CartDrawer />

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Categories</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-900">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Category Hero Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white py-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>GST Rate: {category.default_gst_rate_pct}%</span>
                <span>• ITC Eligible Invoicing</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {category.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
                {category.description || `Genuine building materials delivered to Ayodhya sites with verified batch test certificates.`}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Available in Ayodhya:</span>
              <div className="text-lg font-black text-amber-400">
                {productResult.totalCount} {productResult.totalCount === 1 ? 'Product' : 'Products'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Sidebar Filters & Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar: Filter Controls */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
                <Filter className="w-4 h-4 text-amber-500" />
                <span>Filter Materials</span>
              </div>

              {/* All Categories Quick Switch */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  All 9 Categories
                </h4>
                <div className="space-y-1 max-h-56 overflow-y-auto text-xs">
                  {allCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.slug}`}
                      className={`block px-2.5 py-1.5 rounded-lg transition ${
                        cat.slug === category.slug
                          ? 'bg-amber-50 text-amber-800 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Availability Filter */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Stock Status
                </h4>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <Link
                    href={`/categories/${category.slug}?inStock=true`}
                    className={`block px-2.5 py-1 rounded-md ${
                      searchParams.inStock === 'true'
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    In Stock in Ayodhya Only
                  </Link>
                  <Link
                    href={`/categories/${category.slug}`}
                    className={`block px-2.5 py-1 rounded-md ${
                      !searchParams.inStock ? 'font-bold text-slate-900' : 'hover:text-slate-900'
                    }`}
                  >
                    Show All Catalog Items
                  </Link>
                </div>
              </div>

              {/* Sort By Filter */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Sort By
                </h4>
                <div className="space-y-1 text-xs">
                  <Link
                    href={`/categories/${category.slug}?sort=price_asc`}
                    className={`block px-2.5 py-1 rounded-md ${
                      searchParams.sort === 'price_asc' ? 'font-bold text-amber-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Price: Low to High
                  </Link>
                  <Link
                    href={`/categories/${category.slug}?sort=price_desc`}
                    className={`block px-2.5 py-1 rounded-md ${
                      searchParams.sort === 'price_desc' ? 'font-bold text-amber-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Price: High to Low
                  </Link>
                  <Link
                    href={`/categories/${category.slug}?sort=newest`}
                    className={`block px-2.5 py-1 rounded-md ${
                      searchParams.sort === 'newest' ? 'font-bold text-amber-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Newest Additions
                  </Link>
                </div>
              </div>
            </div>

            {/* B2B Quotation Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Contractor Bulk Desk</span>
              </div>
              <h4 className="font-bold text-sm text-white">Need Truckloads in Ayodhya?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Direct wholesale quotes for temple trusts, commercial complexes, and housing projects.
              </p>
              <Link
                href="/bulk-enquiry"
                className="block text-center w-full py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-300 transition"
              >
                Request Quotation
              </Link>
            </div>
          </aside>

          {/* Right Area: Product Grid */}
          <section className="lg:col-span-3">
            {productResult.items.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <div className="text-3xl">📦</div>
                <h3 className="text-base font-bold text-slate-800">No products match this filter</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try clearing the filters or view all products in the catalog.
                </p>
                <Link
                  href={`/categories/${category.slug}`}
                  className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Clear Filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productResult.items.map((prod) => (
                  <ProductCard key={prod.product_id} product={prod} />
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
