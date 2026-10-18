'use client';

import React, { useState } from 'react';
import { Calculator, X, Check, ArrowRight, Info, Layers, RefreshCw } from 'lucide-react';

interface MaterialCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMaterials?: (items: Array<{ title: string; approxQty: number; unit: string }>) => void;
}

export const MaterialCalculatorModal: React.FC<MaterialCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyMaterials,
}) => {
  const [activeTab, setActiveTab] = useState<'slab' | 'brickwork' | 'plaster' | 'paint'>('slab');

  // Form states
  const [slabArea, setSlabArea] = useState<number>(1000); // 1000 sq ft slab
  const [slabThickness, setSlabThickness] = useState<number>(5); // 5 inches
  const [wallArea, setWallArea] = useState<number>(500); // 500 sq ft
  const [wallThickness, setWallThickness] = useState<'9' | '4.5'>('9');
  const [plasterArea, setPlasterArea] = useState<number>(1200); // 1200 sq ft
  const [paintArea, setPaintArea] = useState<number>(2500); // 2500 sq ft

  if (!isOpen) return null;

  // Real-time calculations based on IS 456 standards
  const calculateSlab = () => {
    const volumeCft = slabArea * (slabThickness / 12);
    const volumeM3 = volumeCft * 0.0283168;
    const cementBags = Math.ceil(volumeM3 * 8.2);
    const steelKg = Math.round(volumeM3 * 78);
    const sandCft = Math.round(volumeCft * 0.44);
    const aggregateCft = Math.round(volumeCft * 0.88);
    const waterproofingLitres = Math.ceil(cementBags * 0.2 * 10) / 10;

    return [
      { name: 'UltraTech / Ambuja PPC Cement', qty: cementBags, unit: '50kg Bags', approxCost: `₹${(cementBags * 385).toLocaleString('en-IN')}` },
      { name: 'Tata Tiscon Fe 550D TMT Steel', qty: steelKg, unit: 'Kg', approxCost: `₹${Math.round(steelKg * 68).toLocaleString('en-IN')}` },
      { name: 'M-Sand / Coarse Sand', qty: sandCft, unit: 'Cft', approxCost: `₹${Math.round(sandCft * 46).toLocaleString('en-IN')}` },
      { name: 'Blue Metal Aggregate (20mm Gitti)', qty: aggregateCft, unit: 'Cft', approxCost: `₹${Math.round(aggregateCft * 42).toLocaleString('en-IN')}` },
      { name: 'Dr. Fixit LW+ Waterproofing Compound', qty: waterproofingLitres, unit: 'Litres', approxCost: `₹${Math.round(waterproofingLitres * 170).toLocaleString('en-IN')}` },
    ];
  };

  const calculateBrickwork = () => {
    const isNine = wallThickness === '9';
    const totalBricks = Math.ceil(wallArea * (isNine ? 9.5 : 4.75));
    const cementBags = Math.ceil(wallArea * (isNine ? 0.012 : 0.006));
    const sandCft = Math.round(wallArea * (isNine ? 0.085 : 0.042));

    return [
      { name: 'Avadh 1st Class Red Clay Bricks', qty: totalBricks, unit: 'Pieces', approxCost: `₹${Math.round(totalBricks * 7.5).toLocaleString('en-IN')}` },
      { name: 'Masonry PPC Cement', qty: cementBags, unit: '50kg Bags', approxCost: `₹${(cementBags * 385).toLocaleString('en-IN')}` },
      { name: 'River Sand for Mortar', qty: sandCft, unit: 'Cft', approxCost: `₹${Math.round(sandCft * 48).toLocaleString('en-IN')}` },
    ];
  };

  const calculatePlaster = () => {
    const cementBags = Math.ceil(plasterArea * 0.0055);
    const sandCft = Math.round(plasterArea * (12 / 25.4 / 12) * 1.33);

    return [
      { name: 'Plastering Grade PPC Cement', qty: cementBags, unit: '50kg Bags', approxCost: `₹${(cementBags * 385).toLocaleString('en-IN')}` },
      { name: 'Fine Screened Plaster Sand', qty: sandCft, unit: 'Cft', approxCost: `₹${Math.round(sandCft * 48).toLocaleString('en-IN')}` },
    ];
  };

  const calculatePaint = () => {
    const puttyKg = Math.ceil(paintArea / 14);
    const primerLitres = Math.ceil(paintArea / 110);
    const paintLitres = Math.ceil(paintArea / 65);

    return [
      { name: 'Waterproof Acrylic Wall Putty (2 Coats)', qty: puttyKg, unit: 'Kg', approxCost: `₹${Math.round(puttyKg * 24).toLocaleString('en-IN')}` },
      { name: 'Acrylic Wall Primer (1 Coat)', qty: primerLitres, unit: 'Litres', approxCost: `₹${Math.round(primerLitres * 155).toLocaleString('en-IN')}` },
      { name: 'Exterior / Interior Emulsion (2 Coats)', qty: paintLitres, unit: 'Litres', approxCost: `₹${Math.round(paintLitres * 260).toLocaleString('en-IN')}` },
    ];
  };

  const activeEstimates =
    activeTab === 'slab'
      ? calculateSlab()
      : activeTab === 'brickwork'
      ? calculateBrickwork()
      : activeTab === 'plaster'
      ? calculatePlaster()
      : calculatePaint();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">
                Ayodhya Construction Material Estimator
              </h3>
              <p className="text-xs text-slate-500">
                Calculated according to Indian Standard IS 456 civil guidelines & local market rates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mt-5">
          <button
            onClick={() => setActiveTab('slab')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'slab' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Slab RCC Casting
          </button>
          <button
            onClick={() => setActiveTab('brickwork')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'brickwork' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Brick Masonry
          </button>
          <button
            onClick={() => setActiveTab('plaster')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'plaster' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Plastering
          </button>
          <button
            onClick={() => setActiveTab('paint')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'paint' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Putty & Paint
          </button>
        </div>

        {/* Input Parameters */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          {activeTab === 'slab' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Slab Area (Sq Ft)
                </label>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={slabArea}
                  onChange={(e) => setSlabArea(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Slab Thickness (Inches)
                </label>
                <select
                  value={slabThickness}
                  onChange={(e) => setSlabThickness(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={4}>4 Inches (Standard Light Slab)</option>
                  <option value={5}>5 Inches (Recommended Residential Slab)</option>
                  <option value={6}>6 Inches (Heavy Commercial / Parking)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'brickwork' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Wall Surface Area (Sq Ft)
                </label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={wallArea}
                  onChange={(e) => setWallArea(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Wall Thickness
                </label>
                <select
                  value={wallThickness}
                  onChange={(e) => setWallThickness(e.target.value as '9' | '4.5')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="9">9 Inches (Main Load-Bearing Wall)</option>
                  <option value="4.5">4.5 Inches (Partition Wall)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'plaster' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Plaster Surface Area (Sq Ft)
              </label>
              <input
                type="number"
                min={100}
                step={100}
                value={plasterArea}
                onChange={(e) => setPlasterArea(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {activeTab === 'paint' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Wall + Ceiling Surface Area (Sq Ft)
              </label>
              <input
                type="number"
                min={200}
                step={100}
                value={paintArea}
                onChange={(e) => setPaintArea(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}
        </div>

        {/* Calculated Results Table */}
        <div className="mt-6">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Estimated Materials Required</span>
            <span className="text-[11px] text-slate-400 font-normal">Direct from Ayodhya suppliers</span>
          </h4>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            {activeEstimates.map((item, idx) => (
              <div key={idx} className="p-3 sm:px-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">{item.name}</div>
                  <div className="text-[11px] text-slate-500">Benchmark estimate: {item.approxCost}</div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-black text-xs sm:text-sm">
                    {item.qty} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Estimates include 5% standard site wastage.</span>
          </div>
          <button
            onClick={() => {
              if (onApplyMaterials) {
                onApplyMaterials(
                  activeEstimates.map((i) => ({
                    title: i.name,
                    approxQty: i.qty,
                    unit: i.unit,
                  }))
                );
              }
              onClose();
            }}
            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5"
          >
            <span>Quote in Bulk RFQ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
