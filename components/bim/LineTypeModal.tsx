"use client"
import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { LineType, ScaleSettings } from '@/types/types';
import { cn } from '@/lib/utils';

interface LineTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineType?: LineType;
  onSave: (lineType: LineType) => void;
  scaleSettings: ScaleSettings;
}

export function LineTypeModal({ isOpen, onClose, lineType, onSave, scaleSettings }: LineTypeModalProps) {
  const [formData, setFormData] = useState<LineType>(lineType || {
    id: `line-type-${Date.now()}`,
    name: '::NEW LINE TYPE::',
    color: '#ffffff',
    thickness: 2,
    segmentation: []
  });

  const precision = scaleSettings.precision;
  const step = Math.pow(10, -precision);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const addSegment = () => {
    setFormData(prev => ({
      ...prev,
      segmentation: [...prev.segmentation, 5] // default segment length
    }));
  };

  const removeSegment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      segmentation: prev.segmentation.filter((_, i) => i !== index)
    }));
  };

  const updateSegment = (index: number, value: number) => {
    setFormData(prev => {
      const newSeg = [...prev.segmentation];
      newSeg[index] = value;
      return { ...prev, segmentation: newSeg };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#2a2a2a] border border-[#444] rounded-md shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#444] bg-[#333]">
          <h2 className="text-sm font-semibold text-zinc-200">Edit Line Style</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-sm text-zinc-300">

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="bg-[#1e1e1e] border border-[#444] rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="bg-transparent border-0 p-0 w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="bg-[#1e1e1e] border border-[#444] rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500 flex-1 uppercase"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Thickness (px)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={formData.thickness}
              onChange={e => setFormData({ ...formData, thickness: parseFloat(e.target.value) || 1 })}
              className="bg-[#1e1e1e] border border-[#444] rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-500">Segmentation Pattern</label>
              <button
                onClick={addSegment}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
              >
                <Plus className="w-3 h-3" /> Add Segment
              </button>
            </div>

            <div className="text-xs text-zinc-500 mb-1">
              {formData.segmentation.length === 0
                ? "Solid line (no segmentation)"
                : "Alternating dash and gap lengths (e.g., Dash, Gap, Dash, Gap...)"}
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.segmentation.map((seg, index) => (
                <div key={index} className="flex items-center gap-1 bg-[#1e1e1e] border border-[#444] rounded px-2 py-1">
                  <span className="text-xs text-zinc-500">{index % 2 === 0 ? 'Dash' : 'Gap'}:</span>
                  <input
                    type="number"
                    min="0.1"
                    step={step}
                    value={seg.toFixed(precision)}
                    onChange={e => updateSegment(index, parseFloat(e.target.value) || 0)}
                    className="bg-transparent border-none w-12 text-white focus:outline-none text-right"
                  />
                  <button
                    onClick={() => removeSegment(index)}
                    className="text-zinc-500 hover:text-red-400 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="mt-4 p-4 bg-[#1e1e1e] border border-[#444] rounded flex items-center justify-center overflow-hidden">
              <svg width="100%" height="20">
                <line
                  x1="0"
                  y1="10"
                  x2="100%"
                  y2="10"
                  stroke={formData.color}
                  strokeWidth={formData.thickness}
                  strokeDasharray={formData.segmentation.join(',')}
                />
              </svg>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#444] bg-[#333]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-zinc-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
          >
            OK
          </button>
        </div>

      </div>
    </div>
  );
}
