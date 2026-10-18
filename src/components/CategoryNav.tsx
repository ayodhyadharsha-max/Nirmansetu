'use client';

import React from 'react';
import {
  Layers,
  Wrench,
  Droplets,
  Zap,
  Paintbrush,
  Box,
  Truck,
  Calculator,
} from 'lucide-react';

interface CategoryNavProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onOpenCalculator: () => void;
}

export const CATEGORIES_DATA = [
  { id: 'all', name: 'All Materials', icon: Layers, slug: '' },
  { id: 'cement-construction-materials', name: 'Cement & Construction', icon: Box, slug: 'cement-construction-materials' },
  { id: 'tiles-flooring', name: 'Tiles & Flooring', icon: Layers, slug: 'tiles-flooring' },
  { id: 'paints-primers-putty', name: 'Paints, Primers & Putty', icon: Paintbrush, slug: 'paints-primers-putty' },
  { id: 'electrical-products', name: 'Electrical Products', icon: Zap, slug: 'electrical-products' },
  { id: 'plumbing-pipes-fittings', name: 'Plumbing Pipes & Fittings', icon: Droplets, slug: 'plumbing-pipes-fittings' },
  { id: 'sanitaryware-bathroom-fittings', name: 'Sanitaryware & Bath', icon: Droplets, slug: 'sanitaryware-bathroom-fittings' },
  { id: 'plywood-mdf-laminates', name: 'Plywood, MDF & Laminates', icon: Wrench, slug: 'plywood-mdf-laminates' },
  { id: 'hardware-tools-fasteners', name: 'Hardware, Tools & Fasteners', icon: Wrench, slug: 'hardware-tools-fasteners' },
  { id: 'kitchen-home-improvement', name: 'Kitchen & Home Improvement', icon: Truck, slug: 'kitchen-home-improvement' },
];

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenCalculator,
}) => {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white overflow-x-auto shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-2 py-2.5 min-w-max">
          {CATEGORIES_DATA.map((cat) => {
            const Icon = cat.icon;
            const isSelected =
              cat.id === 'all'
                ? selectedCategory === null
                : selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id === 'all' ? null : cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}

          <div className="h-4 w-px bg-slate-700 mx-2" />

          {/* Quick Calculator Tool Trigger */}
          <button
            onClick={onOpenCalculator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors whitespace-nowrap"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>Site Calculator</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
