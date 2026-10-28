'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface CollectionItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  ctaText: string;
  isCtaLink?: boolean;
  bgColor: string;
  borderColor: string;
  badge?: string;
  isFullCard?: boolean;
}

const COLLECTIONS: CollectionItem[] = [
  // 1. Hettich Hardware
  {
    id: 'hettich',
    title: 'Hettich Hardware',
    subtitle: 'Hinges, Channels at great prices',
    imageUrl: '/images/collections/hettich.png',
    href: '/categories/hardware-tools-fasteners',
    ctaText: 'Shop Now',
    bgColor: 'bg-[#fff9e6]',
    borderColor: 'border-amber-200/70',
    isFullCard: true,
  },
  // 2. Dr. Fixit Waterproofing
  {
    id: 'dr-fixit',
    title: 'Dr. Fixit Waterproofing',
    subtitle: '101 LW+, URP & Raincoat',
    imageUrl: '/images/collections/dr_fixit.png',
    href: '/search?brand=dr-fixit',
    ctaText: 'View Range →',
    isCtaLink: true,
    bgColor: 'bg-[#eef8f8]',
    borderColor: 'border-teal-200/60',
  },
  // 3. Fevicol & Adhesives
  {
    id: 'fevicol',
    title: 'Fevicol & Adhesives',
    subtitle: 'SH, Marine, HeatX & Hi-Per',
    imageUrl: '/images/collections/fevicol_coll.png',
    href: '/categories/hardware-tools-fasteners',
    ctaText: 'View Range →',
    isCtaLink: true,
    bgColor: 'bg-[#eef8f8]',
    borderColor: 'border-teal-200/60',
  },
  // 4. Putty & Primers
  {
    id: 'putty-primers',
    title: 'Putty & Primers from top brands',
    subtitle: 'Get guaranteed lowest prices',
    imageUrl: '/images/collections/putty_primers.png',
    href: '/categories/paints-primers-putty',
    ctaText: 'Shop Now',
    bgColor: 'bg-[#fff0ed]',
    borderColor: 'border-orange-200/70',
    isFullCard: true,
  },
  // 5. Fire Retardant Electrical Piping
  {
    id: 'electrical-piping',
    title: 'Fire Retardant Electrical Piping',
    subtitle: 'VIP Conduits, metal boxes & fittings',
    imageUrl: '/images/collections/electrical_piping.png',
    href: '/categories/electrical-products',
    ctaText: 'Shop Now',
    bgColor: 'bg-[#f3eeff]',
    borderColor: 'border-purple-200/70',
    isFullCard: true,
  },
  // 6. UltraTech Cement
  {
    id: 'ultratech',
    title: 'UltraTech Cement',
    subtitle: 'Aditya Birla Group flagship cement brand',
    imageUrl: '/images/products/ultratech_cement.png',
    href: '/search?brand=ultratech-cement',
    ctaText: 'Shop Now',
    bgColor: 'bg-[#fffde6]',
    borderColor: 'border-amber-200/80',
    badge: 'Verified Stock',
  },
  // 7. Tata Tiscon
  {
    id: 'tata-tiscon',
    title: 'Tata Tiscon',
    subtitle: 'Primary Fe 550D Super Ductile TMT rebars',
    imageUrl: '/images/collections/tata_tiscon.png',
    href: '/search?brand=tata-tiscon',
    ctaText: 'Shop Now',
    bgColor: 'bg-[#f0f4f9]',
    borderColor: 'border-slate-300/80',
    badge: 'Primary Mill',
  },
  // 8. Kajaria Ceramics
  {
    id: 'kajaria',
    title: 'Kajaria Ceramics',
    subtitle: 'India largest ceramic and vitrified tiles',
    imageUrl: '/images/categories/tiling.png',
    href: '/search?brand=kajaria-ceramics',
    ctaText: 'Shop Now',
    bgColor: 'bg-[#fdf6ed]',
    borderColor: 'border-amber-200/70',
  },
  // 9. Asian Paints
  {
    id: 'asian-paints',
    title: 'Asian Paints',
    subtitle: 'Premium paints, exterior coatings and wall putty',
    imageUrl: '/images/products/asian_paints_primer.png',
    href: '/search?brand=asian-paints',
    ctaText: 'Shop Now',
    bgColor: 'bg-[#fff0f3]',
    borderColor: 'border-rose-200/70',
  },
  // 10. Supreme Industries
  {
    id: 'supreme',
    title: 'Supreme Industries',
    subtitle: 'Lead-free CPVC, UPVC and drainage piping solutions',
    imageUrl: '/images/categories/cpvc.png',
    href: '/search?brand=supreme-industries',
    ctaText: 'Shop Now',
    bgColor: 'bg-[#edf6ff]',
    borderColor: 'border-blue-200/70',
  },
  // 11. Havells
  {
    id: 'havells',
    title: 'Havells',
    subtitle: 'Flame retardant electrical cables and switchgear',
    imageUrl: '/images/products/kei_wire.png',
    href: '/search?brand=havells',
    ctaText: 'Shop Now',
    bgColor: 'bg-[#fff2f0]',
    borderColor: 'border-red-200/70',
  },
  // 12. Greenply
  {
    id: 'greenply',
    title: 'Greenply',
    subtitle: 'BWP and BWR grade marine plywood',
    imageUrl: '/images/products/action_tesa.png',
    href: '/search?brand=greenply',
    ctaText: 'Shop Now',
    bgColor: 'bg-[#f4f9f2]',
    borderColor: 'border-emerald-200/70',
  },
  // 13. Godrej Locks
  {
    id: 'godrej',
    title: 'Godrej Locks',
    subtitle: 'Architectural door hardware, deadbolts and security locks',
    imageUrl: '/images/categories/locks.png',
    href: '/search?brand=godrej-locks',
    ctaText: 'Shop Now',
    bgColor: 'bg-[#f6f3ff]',
    borderColor: 'border-purple-200/70',
  },
  // 14. Sintex
  {
    id: 'sintex',
    title: 'Sintex',
    subtitle: '100% virgin food-grade plastic overhead water storage tanks',
    imageUrl: '/images/categories/sanitary.png',
    href: '/search?brand=sintex',
    ctaText: 'Shop Now',
    bgColor: 'bg-[#edf9ff]',
    borderColor: 'border-cyan-200/70',
  },
  // 15. Jaquar
  {
    id: 'jaquar',
    title: 'Jaquar',
    subtitle: 'Complete bathroom and sanitaryware solutions',
    imageUrl: '/images/categories/sanitary.png',
    href: '/search?brand=jaquar',
    ctaText: 'Shop Now',
    bgColor: 'bg-[#f3fbfb]',
    borderColor: 'border-teal-200/70',
  },
];

export const CuratedCollectionsSection: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-8 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title & Slider Controls */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Curated Brands &amp; Collections
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Materials sourced from verified regional stockists with transparent billing
            </p>
          </div>

          {/* Slider Prev / Next Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous brands"
              className={`w-9 h-9 rounded-full border border-slate-300 bg-white flex items-center justify-center shadow-xs transition-all ${
                canScrollLeft
                  ? 'text-slate-900 hover:bg-slate-100 hover:border-slate-400 active:scale-95 cursor-pointer'
                  : 'text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Next brands"
              className={`w-9 h-9 rounded-full border border-slate-300 bg-white flex items-center justify-center shadow-xs transition-all ${
                canScrollRight
                  ? 'text-slate-900 hover:bg-slate-100 hover:border-slate-400 active:scale-95 cursor-pointer'
                  : 'text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-2 px-1 -mx-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {COLLECTIONS.map((item) => {
            if (item.isFullCard) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`w-[230px] sm:w-[250px] shrink-0 snap-start rounded-3xl overflow-hidden h-[280px] group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative block border ${item.borderColor} ${item.bgColor}`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 rounded-3xl"
                    loading="lazy"
                  />
                </Link>
              );
            }

            return (
              <div
                key={item.id}
                className={`w-[230px] sm:w-[250px] shrink-0 snap-start rounded-3xl ${item.bgColor} border ${item.borderColor} p-4 sm:p-5 flex flex-col justify-between h-[280px] group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative`}
              >
                {/* Optional Verified / Mill Badge */}
                {item.badge && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-slate-800 shadow-2xs border border-slate-200/60">
                      {item.badge}
                    </span>
                  </div>
                )}

              {/* Title & Subtitle */}
              <div className="pr-2">
                <h3 className="font-black text-base text-slate-900 leading-snug group-hover:text-amber-950 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-medium line-clamp-2">
                  {item.subtitle}
                </p>
              </div>

              {/* Product Cutout Image Area */}
              <div className="my-2 flex items-center justify-center h-28 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="max-h-28 max-w-[90%] object-contain group-hover:scale-108 transition-transform duration-300 drop-shadow-2xs"
                  loading="lazy"
                />
              </div>

              {/* Action Link / Button */}
              <div>
                {item.isCtaLink ? (
                  <Link
                    href={item.href}
                    className="inline-flex items-center text-xs font-bold text-teal-800 group-hover:underline"
                  >
                    <span>{item.ctaText}</span>
                  </Link>
                ) : (
                  <Link
                    href={item.href}
                    className="inline-block bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs active:scale-95"
                  >
                    {item.ctaText}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
        </div>

      </div>
    </section>
  );
};
