"use client"
import React, { useState } from 'react';
import { X, Wand2, CheckSquare, Square } from 'lucide-react';
import { BimElement } from '@/types/types';

interface SelectSimilarModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: BimElement[];
  selectedElement: BimElement | null;
  onSelect: (ids: string[]) => void;
}

export function SelectSimilarModal({ isOpen, onClose, elements, selectedElement, onSelect }: SelectSimilarModalProps) {
  const [criteria, setCriteria] = useState({
    category: true,
    bimClass: true,
    color: false,
    lineColor: false,
    lineWidth: false,
    material: false,
    level: true,
    name: false,
  });

  if (!isOpen) return null;

  const handleSelectSimilar = () => {
    if (!selectedElement) return;

    const similarIds = elements.filter(el => {
      if (el.visibility === 'hidden') return false;
      let matches = true;
      if (criteria.category && el.category !== selectedElement.category) matches = false;
      if (criteria.bimClass && el.bimClass !== selectedElement.bimClass) matches = false;
      if (criteria.color && el.color !== selectedElement.color) matches = false;
      if (criteria.lineColor && el.lineColor !== selectedElement.lineColor) matches = false;
      if (criteria.lineWidth && el.lineWidth !== selectedElement.lineWidth) matches = false;
      if (criteria.material && el.material !== selectedElement.material) matches = false;
      if (criteria.level && el.level !== selectedElement.level) matches = false;
      if (criteria.name && el.name !== selectedElement.name) matches = false;
      return matches;
    }).map(el => el.id);

    onSelect(similarIds);
    onClose();
  };

  const toggleCriteria = (key: keyof typeof criteria) => {
    setCriteria(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-zinc-100">Select Similar</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!selectedElement ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                <Wand2 className="w-6 h-6 text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm">Please select an element first to use as a template.</p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">Template Element</p>
                <p className="text-sm text-zinc-200 font-medium">{selectedElement.name} ({selectedElement.category})</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {Object.entries(criteria).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => toggleCriteria(key as keyof typeof criteria)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${value
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-100'
                      : 'bg-zinc-800/30 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                  >
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    {value ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSelectSimilar}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Select Similar Objects
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
