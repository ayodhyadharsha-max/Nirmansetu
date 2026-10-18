import React from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Filter, AlertCircle, ArrowLeft } from 'lucide-react';
import { listProducts, getCategories, getBrands } from '@/lib/catalog/service';
import { ProductCard } from '@/components/ProductCard';
import { Footer } from '@/components/Footer';
import { BRAND_CONFIG } from '@/config/brand';

interface SearchPageProps {
  searchParams: {
    q?: string;
    category?: string;
    brand?: string;
    inStock?: string;
    sort?: 'price_asc' | 'price_desc' | 'newest' | 'featured' | 'name';
    page?: string;
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.trim() || '';
  return {
    title: query ? `Search: "${query}" | ${BRAND_CONFIG.name}` : `Search Construction Materials | ${BRAND_CONFIG.name}`,
    description: `Search authentic building materials in Ayodhya Dham with fast delivery.`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.trim() || '';
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;

  const [categories, brands, result] = await Promise.all([
    getCategories(),
    getBrands(),
    listProducts({
      search: query,
      categorySlug: searchParams.category,
      brandSlug: searchParams.brand,
      inStockOnly: searchParams.inStock === 'true',
      sortBy: searchParams.sort,
      page,
      limit: 24,
    }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <header className="bg-slate-950 text-white py-3 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white font-black text-lg">
            <span>{BRAND_CONFIG.name}</span>
            <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              {BRAND_CONFIG.city}
            </span>
          </Link>
          <Link href="/" className="text-xs text-slate-300 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Search Header Bar */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form action="/search" method="GET" className="max-w-2xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search cement, steel, red bricks, CPVC pipes, paints, switches..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-400 text-sm font-bold rounded-xl transition"
            >
              Search
            </button>
          </form>

          {query && (
            <div className="text-center mt-3 text-xs text-slate-500">
              Showing search results for <span className="font-bold text-slate-900">"{query}"</span> ({result.totalCount} {result.totalCount === 1 ? 'item' : 'items'} found)
            </div>
          )}
        </div>
      </section>

      {/* Main Results Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filter Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
                <Filter className="w-4 h-4 text-amber-500" />
                <span>Filter Results</span>
              </div>

              {/* Filter by Category */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Category
                </h4>
                <div className="space-y-1 text-xs">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    className={`block px-2.5 py-1 rounded-md ${
                      !searchParams.category ? 'font-bold text-amber-800 bg-amber-50' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Categories
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/search?q=${encodeURIComponent(query)}&category=${cat.slug}`}
                      className={`block px-2.5 py-1 rounded-md ${
                        searchParams.category === cat.slug
                          ? 'font-bold text-amber-800 bg-amber-50'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results Grid */}
          <section className="lg:col-span-3">
            {result.items.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">
                  No materials found for "{query}"
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try searching for general terms like "cement", "steel", "tiles", "plumbing", "paints" or check the category catalog.
                </p>
                <div className="pt-2">
                  <Link
                    href="/categories/cement-construction-materials"
                    className="inline-block px-4 py-2 bg-slate-900 text-amber-400 text-xs font-bold rounded-xl"
                  >
                    Browse Cement & Steel Catalog
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.items.map((prod) => (
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
