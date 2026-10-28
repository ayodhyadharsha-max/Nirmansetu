'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { HomeRunProductItem } from '@/config/homerun-catalog';
import { HomeRunProductCard } from './HomeRunProductCard';

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  products: HomeRunProductItem[];
  onOpenEnquiry?: () => void;
  viewAllHref?: string;
  badge?: string;
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  subtitle,
  products,
  onOpenEnquiry,
  viewAllHref,
  badge,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll positions to toggle previous/next arrow states
  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, products.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Scroll by ~75% of visible viewport width for smooth pagination
    const scrollAmount = Math.max(300, Math.floor(el.clientWidth * 0.75));
    const delta = direction === 'left' ? -scrollAmount : scrollAmount;

    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="py-7 bg-white border-t border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Title, Subtitle, and Carousel Controls */}
        <div className="flex items-end justify-between mb-5 gap-4">
          <div>
            {badge && (
              <span className="inline-block text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-md mb-1.5">
                {badge}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 mr-2 hover:underline"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Left Previous Button */}
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label={`Previous ${title}`}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 bg-white shadow-2xs hover:bg-slate-50 flex items-center justify-center text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800" />
            </button>

            {/* Right Next Button */}
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label={`Next ${title}`}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 bg-white shadow-2xs hover:bg-slate-50 flex items-center justify-center text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800" />
            </button>
          </div>
        </div>

        {/* Real Horizontal Carousel Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-2 px-0.5 -mx-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="snap-start shrink-0 w-[240px] sm:w-[260px] md:w-[275px] lg:w-[285px] self-stretch flex flex-col"
            >
              <HomeRunProductCard
                product={product}
                onOpenEnquiry={onOpenEnquiry}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
