'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CategoryNavProps {
  selectedCategory?: string | null;
  onSelectCategory?: (categoryId: string | null) => void;
  onOpenCalculator?: () => void;
}

export interface SubCategoryItem {
  name: string;
  slug: string;
}

export interface NavCategoryGroup {
  label: string;
  slug: string;
  primaryCategorySlug: string;
  subcategories: SubCategoryItem[];
}

export const CATEGORY_GROUPS: NavCategoryGroup[] = [
  {
    label: 'Civil & Interiors',
    slug: 'civil-interiors',
    primaryCategorySlug: 'cement-construction-materials',
    subcategories: [
      { name: 'Cement & Construction Materials', slug: 'cement-construction-materials' },
      { name: 'Tiles & Flooring', slug: 'tiles-flooring' },
      { name: 'Paints & Primers', slug: 'paints-primers-putty' },
      { name: 'Waterproofing', slug: 'paints-primers-putty' },
      { name: 'Plywood & Laminates', slug: 'plywood-mdf-laminates' },
    ],
  },
  {
    label: 'Furniture & Architectural Hardware',
    slug: 'furniture-hardware',
    primaryCategorySlug: 'hardware-tools-fasteners',
    subcategories: [
      { name: 'Door Locks', slug: 'hardware-tools-fasteners' },
      { name: 'Hinges & Channels', slug: 'hardware-tools-fasteners' },
      { name: 'Wardrobe Fittings', slug: 'hardware-tools-fasteners' },
      { name: 'Glass Door Hardware', slug: 'hardware-tools-fasteners' },
    ],
  },
  {
    label: 'Electrical',
    slug: 'electrical',
    primaryCategorySlug: 'electrical-products',
    subcategories: [
      { name: 'Wires & Cables', slug: 'electrical-products' },
      { name: 'Switches & Sockets', slug: 'electrical-products' },
      { name: 'MCBs & Distribution Boards', slug: 'electrical-products' },
      { name: 'Lighting', slug: 'electrical-products' },
    ],
  },
  {
    label: 'Plumbing, Sanitary & Bath',
    slug: 'plumbing-bath',
    primaryCategorySlug: 'plumbing-pipes-fittings',
    subcategories: [
      { name: 'CPVC & UPVC Pipes', slug: 'plumbing-pipes-fittings' },
      { name: 'Pipe Fittings', slug: 'plumbing-pipes-fittings' },
      { name: 'Sanitaryware', slug: 'sanitaryware-bathroom-fittings' },
      { name: 'Taps & Faucets', slug: 'sanitaryware-bathroom-fittings' },
      { name: 'Bathroom Accessories', slug: 'sanitaryware-bathroom-fittings' },
    ],
  },
  {
    label: 'New Launches',
    slug: 'new-launches',
    primaryCategorySlug: 'hardware-tools-fasteners',
    subcategories: [
      { name: 'Heavy Duty Storage Racks', slug: 'hardware-tools-fasteners' },
      { name: 'Smart Storage Water Heaters', slug: 'electrical-products' },
      { name: 'V-Guard Calisto Geysers', slug: 'electrical-products' },
      { name: 'View All New Launches', slug: 'search' },
    ],
  },
  {
    label: 'Tools',
    slug: 'tools',
    primaryCategorySlug: 'hardware-tools-fasteners',
    subcategories: [
      { name: 'Power Tools', slug: 'hardware-tools-fasteners' },
      { name: 'General Hardware', slug: 'hardware-tools-fasteners' },
      { name: 'Safety Equipment', slug: 'hardware-tools-fasteners' },
      { name: 'Fasteners', slug: 'hardware-tools-fasteners' },
    ],
  },
];

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory = null,
  onSelectCategory = () => {},
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any active timeout
  const cancelCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  // Instant opening on hover (0ms delay) + cancel close timer
  const handleMouseEnter = useCallback(
    (label: string) => {
      cancelCloseTimeout();
      setActiveDropdown(label);
    },
    [cancelCloseTimeout]
  );

  // 200ms grace period so hand movements across the hover bridge never cause flickering
  const handleMouseLeave = useCallback(() => {
    cancelCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  }, [cancelCloseTimeout]);

  // Click or touch toggle support
  const handleToggle = useCallback(
    (label: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      cancelCloseTimeout();
      setActiveDropdown((prev) => (prev === label ? null : label));
    },
    [cancelCloseTimeout]
  );

  // Keyboard navigation on trigger button
  const handleButtonKeyDown = useCallback(
    (label: string, groupSlug: string, e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cancelCloseTimeout();
        setActiveDropdown((prev) => (prev === label ? null : label));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        cancelCloseTimeout();
        setActiveDropdown(label);
        // Focus the first item in the dropdown after render
        setTimeout(() => {
          const firstItem = document.getElementById(`nav-item-${groupSlug}-0`);
          if (firstItem) firstItem.focus();
        }, 50);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setActiveDropdown(null);
      }
    },
    [cancelCloseTimeout]
  );

  // Click outside closes dropdown immediately
  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (navContainerRef.current && !navContainerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
      cancelCloseTimeout();
    };
  }, [cancelCloseTimeout]);

  return (
    <nav
      className="bg-white border-t border-slate-100/90 relative z-30 select-none"
      ref={navContainerRef}
      aria-label="Product Categories Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start md:justify-center gap-2 sm:gap-4 md:gap-5 lg:gap-8 h-11 overflow-x-auto md:overflow-visible scrollbar-none py-1">
          
          {/* Home Link */}
          <Link
            href="/"
            onClick={() => {
              onSelectCategory(null);
              setActiveDropdown(null);
            }}
            className={`text-[13px] xl:text-[14px] font-medium transition-colors whitespace-nowrap shrink-0 py-1.5 px-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              selectedCategory === null
                ? 'text-slate-950 font-bold bg-slate-100/70'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            Home
          </Link>

          {/* Category Dropdown Groups */}
          {CATEGORY_GROUPS.map((group, index) => {
            const isOpen = activeDropdown === group.label;
            // Right-align dropdowns on the right half of the navigation bar to prevent screen cutoff
            const isRightAligned = index >= 3;

            return (
              <div
                key={group.label}
                className="relative shrink-0 py-1"
                onMouseEnter={() => handleMouseEnter(group.label)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Desktop Trigger Button with ARIA attributes and keyboard controls */}
                <button
                  type="button"
                  id={`nav-btn-${group.slug}`}
                  onClick={(e) => handleToggle(group.label, e)}
                  onKeyDown={(e) => handleButtonKeyDown(group.label, group.slug, e)}
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  aria-controls={`nav-dropdown-${group.slug}`}
                  className={`hidden md:inline-flex items-center gap-1.5 text-[13px] xl:text-[14px] font-medium transition-colors whitespace-nowrap cursor-pointer select-none py-1.5 px-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    isOpen
                      ? 'text-slate-950 font-bold bg-slate-100/80 shadow-2xs'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50/80'
                  }`}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-slate-900' : 'group-hover:text-slate-700'
                    }`}
                  />
                </button>

                {/* Mobile Direct Link (Direct category navigation on touch devices, preventing trapped dropdowns) */}
                <Link
                  href={`/categories/${group.primaryCategorySlug}`}
                  onClick={() => {
                    onSelectCategory(group.primaryCategorySlug);
                    setActiveDropdown(null);
                  }}
                  className="md:hidden inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-950 whitespace-nowrap py-1 px-1.5"
                >
                  <span>{group.label}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </Link>

                {/* Floating Dropdown Card (Completely unclipped, floating smoothly above page content) */}
                {isOpen && (
                  <div
                    id={`nav-dropdown-${group.slug}`}
                    role="menu"
                    aria-labelledby={`nav-btn-${group.slug}`}
                    className={`hidden md:block absolute top-full pt-2 z-50 w-72 sm:w-80 animate-in fade-in-50 duration-150 ${
                      isRightAligned ? 'right-0' : 'left-0'
                    }`}
                    onMouseEnter={() => handleMouseEnter(group.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-2.5 overflow-hidden ring-1 ring-slate-900/5">
                      {/* Dropdown Category Header */}
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between mb-1">
                        <span>{group.label}</span>
                        <span className="text-[10px] font-bold text-amber-600">Ayodhya Stock</span>
                      </div>

                      {/* Subcategories List */}
                      <div className="space-y-0.5">
                        {group.subcategories.map((sub, itemIdx) => (
                          <Link
                            key={sub.name}
                            id={`nav-item-${group.slug}-${itemIdx}`}
                            href={sub.slug === 'search' ? '/search' : `/categories/${sub.slug}`}
                            role="menuitem"
                            tabIndex={0}
                            onClick={() => {
                              onSelectCategory(sub.slug);
                              setActiveDropdown(null);
                            }}
                            className="flex items-center justify-between px-3 py-2 text-[13px] font-semibold text-slate-700 hover:text-slate-950 hover:bg-amber-50/70 rounded-xl transition-all group/item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          >
                            <span>{sub.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-amber-700 group-hover/item:translate-x-0.5 transition-all opacity-40 group-hover/item:opacity-100" />
                          </Link>
                        ))}
                      </div>

                      {/* View All Category Footer Link */}
                      <div className="border-t border-slate-100 mt-2 pt-2 px-3 pb-0.5">
                        <Link
                          href={`/categories/${group.primaryCategorySlug}`}
                          role="menuitem"
                          onClick={() => {
                            onSelectCategory(group.primaryCategorySlug);
                            setActiveDropdown(null);
                          }}
                          className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center justify-between py-1 transition-colors"
                        >
                          <span>Browse all {group.label}</span>
                          <span className="text-amber-600 font-black">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
