"use client"
import React, { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { SlabType, SlabLayer, ScaleSettings } from '@/types/types';
import { cn } from '@/lib/utils';

interface SlabTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  slabType?: SlabType;
  onSave: (slabType: SlabType) => void;
  scaleSettings: ScaleSettings;
}

export function SlabTypeModal({ isOpen, onClose, slabType, onSave, scaleSettings }: SlabTypeModalProps) {
  const [activeTab, setActiveTab] = useState<'definition' | 'insertion' | 'textures' | 'data'>('definition');

  const precision = scaleSettings.precision;
  const step = Math.pow(10, -precision);

  const [formData, setFormData] = useState<SlabType>(slabType || {
    id: `slab-type-${Date.now()}`,
    name: '::NEW SLAB TYPE::',
    layers: [
      {
        id: `layer-${Date.now()}`,
        name: 'LOSA',
        isCore: true,
        function: 'Other',
        bimClass: '00',
        material: 'CONCRETO ESTRUCTURA',
        thickness: 0.15,
        lambda: 0
      }
    ],
    totalThickness: 0.15,
    datum: 'top',
    bimClass: '00'
  });

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    // Calculate total thickness
    const total = formData.layers.reduce((sum, layer) => sum + layer.thickness, 0);
    onSave({ ...formData, totalThickness: total });
    onClose();
  };

  const addLayer = () => {
    const newLayer: SlabLayer = {
      id: `layer-${Date.now()}`,
      name: 'NEW LAYER',
      isCore: false,
      function: 'Other',
      bimClass: '00',
      material: 'Default',
      thickness: 0.05,
      lambda: 0
    };
    setFormData(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer]
    }));
  };

  const removeLayer = (id: string) => {
    setFormData(prev => ({
      ...prev,
      layers: prev.layers.filter(l => l.id !== id)
    }));
  };

  const updateLayer = (id: string, updates: Partial<SlabLayer>) => {
    setFormData(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, ...updates } : l)
    }));
  };

  const totalThickness = formData.layers.reduce((sum, layer) => sum + layer.thickness, 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#2a2a2a] border border-[#444] rounded-md shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#444] bg-[#333]">
          <h2 className="text-sm font-semibold text-zinc-200">Edit Slab Style</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Name Input */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400 w-12">Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="flex-1 bg-[#1e1e1e] border border-[#444] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#444]">
            {['Definition', 'Insertion Options', 'Textures', 'Data'].map((tab) => {
              const id = tab.toLowerCase().split(' ')[0] as any;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-medium border-b-2 transition-colors",
                    activeTab === id
                      ? "border-orange-500 text-orange-500"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {activeTab === 'definition' && (
            <div className="flex flex-col gap-4">
              {/* Preview Area */}
              <div className="h-32 bg-white rounded border border-[#444] flex items-center justify-center overflow-hidden p-4 relative">
                <div className="w-full h-full flex flex-col justify-center items-center">
                  {formData.layers.map((layer, idx) => (
                    <div
                      key={layer.id}
                      className="w-full border-b border-black flex items-center justify-center text-[10px] text-black bg-gray-100"
                      style={{
                        height: `${(layer.thickness / totalThickness) * 100}%`,
                        minHeight: '10px'
                      }}
                    >
                      {layer.name} ({layer.thickness.toFixed(precision)})
                    </div>
                  ))}
                </div>
              </div>

              {/* Thickness & Datum */}
              <div className="flex gap-8">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-400">Overall Thickness:</label>
                  <input
                    type="number"
                    value={totalThickness.toFixed(precision)}
                    disabled
                    className="w-24 bg-[#1e1e1e] border border-[#444] rounded px-2 py-1 text-sm text-zinc-500"
                  />
                  <span className="text-xs text-zinc-500">(Determined by components)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-[#444] rounded p-3">
                  <h3 className="text-xs text-zinc-400 mb-2 -mt-5 bg-[#2a2a2a] inline-block px-1">Datum</h3>
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 text-xs text-zinc-300">
                      <input
                        type="radio"
                        name="datum"
                        checked={formData.datum === 'top'}
                        onChange={() => setFormData({ ...formData, datum: 'top' })}
                        className="accent-indigo-500"
                      />
                      Top of component
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-300">
                      <input
                        type="radio"
                        name="datum"
                        checked={formData.datum === 'bottom'}
                        onChange={() => setFormData({ ...formData, datum: 'bottom' })}
                        className="accent-indigo-500"
                      />
                      Bottom of component
                    </label>
                  </div>
                </div>
              </div>

              {/* Components Table */}
              <div className="flex flex-col gap-2">
                <div className="text-xs text-zinc-400">Components:</div>
                <div className="border border-[#444] rounded overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#333] text-zinc-300">
                      <tr>
                        <th className="p-2 w-8">#</th>
                        <th className="p-2">Name</th>
                        <th className="p-2 w-12">Datum</th>
                        <th className="p-2">Function</th>
                        <th className="p-2">Class</th>
                        <th className="p-2">Material</th>
                        <th className="p-2 w-20">Thickness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.layers.map((layer, index) => (
                        <tr
                          key={layer.id}
                          className={cn(
                            "border-t border-[#444] cursor-pointer",
                            selectedLayerId === layer.id ? "bg-indigo-500/20" : "hover:bg-[#333]"
                          )}
                          onClick={() => setSelectedLayerId(layer.id)}
                        >
                          <td className="p-2 text-zinc-500 flex items-center gap-1">
                            <GripVertical className="w-3 h-3 cursor-grab" />
                            {index + 1}
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={layer.name}
                              onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                              className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                            />
                          </td>
                          <td className="p-2 text-center">
                            {layer.isCore && <div className="w-3 h-3 bg-zinc-400 mx-auto rounded-sm" />}
                          </td>
                          <td className="p-1">
                            <select
                              value={layer.function}
                              onChange={(e) => updateLayer(layer.id, { function: e.target.value })}
                              className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1 text-zinc-300"
                            >
                              <option value="Other">Other</option>
                              <option value="Structure">Structure</option>
                              <option value="Finish">Finish</option>
                            </select>
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={layer.bimClass}
                              onChange={(e) => updateLayer(layer.id, { bimClass: e.target.value })}
                              className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={layer.material}
                              onChange={(e) => updateLayer(layer.id, { material: e.target.value })}
                              className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              step={step}
                              value={layer.thickness}
                              onChange={(e) => updateLayer(layer.id, { thickness: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={addLayer}
                    className="px-3 py-1 bg-[#333] hover:bg-[#444] text-zinc-300 rounded text-xs transition-colors"
                  >
                    New...
                  </button>
                  <button
                    className="px-3 py-1 bg-[#333] hover:bg-[#444] text-zinc-300 rounded text-xs transition-colors"
                  >
                    Edit...
                  </button>
                  <button
                    className="px-3 py-1 bg-[#333] hover:bg-[#444] text-zinc-300 rounded text-xs transition-colors"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => selectedLayerId && removeLayer(selectedLayerId)}
                    disabled={!selectedLayerId || formData.layers.length <= 1}
                    className="px-3 py-1 bg-[#333] hover:bg-red-500/20 text-zinc-300 hover:text-red-400 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'definition' && (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
              Settings for {activeTab} not implemented yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#444] bg-[#333]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-sm font-medium text-zinc-300 hover:bg-[#444] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
