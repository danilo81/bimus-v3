"use client"
import React, { useState } from 'react';
import { X, Plus, Trash2, GripVertical, Settings } from 'lucide-react';
import { WallType, WallLayer, ScaleSettings } from '@/types/types';
import { cn } from '@/lib/utils';

interface WallTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallType?: WallType;
  onSave: (wallType: WallType) => void;
  scaleSettings: ScaleSettings;
}

export function WallTypeModal({ isOpen, onClose, wallType, onSave, scaleSettings }: WallTypeModalProps) {
  const [activeTab, setActiveTab] = useState<'definition' | 'insertion' | 'textures' | 'data'>('definition');

  const precision = scaleSettings.precision;
  const step = Math.pow(10, -precision);

  const [formData, setFormData] = useState<WallType>(wallType || {
    id: `wall-type-${Date.now()}`,
    name: '::NEW WALL TYPE::',
    type: 'standard',
    layers: [
      {
        id: `layer-${Date.now()}`,
        name: 'CEMENTO',
        isCore: true,
        function: 'Other',
        bimClass: '00',
        material: 'CONCRETO ESTRUCTURA',
        thickness: 0.15,
        lambda: 0
      }
    ],
    totalThickness: 0.15,
    height: 3.0,
    topBound: 'Layer Elevation',
    topOffset: 0.1,
    bottomBound: 'Layer Elevation',
    bottomOffset: 0,
    caps: 'Both',
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
    const newLayer: WallLayer = {
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

  const updateLayer = (id: string, updates: Partial<WallLayer>) => {
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
          <h2 className="text-sm font-semibold text-zinc-200">Edit Wall Style</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-sm text-zinc-300">

          {/* Top Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <label className="w-20 text-right">Name:</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="flex-1 bg-transparent border border-[#555] px-2 py-1 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-4 ml-22">
              <label className="w-20 text-right">Wall Type:</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={formData.type === 'standard'}
                  onChange={() => setFormData({ ...formData, type: 'standard' })}
                  className="accent-blue-500"
                />
                Standard wall
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={formData.type === 'curtain'}
                  onChange={() => setFormData({ ...formData, type: 'curtain' })}
                  className="accent-blue-500"
                />
                Curtain wall
              </label>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#555] mt-2">
            {[
              { id: 'definition', label: 'Definition' },
              { id: 'insertion', label: 'Insertion Options' },
              { id: 'textures', label: 'Textures' },
              { id: 'data', label: 'Data' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-1.5 border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-[#ff6600] text-[#ff6600]"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-[300px]">
            {activeTab === 'definition' && (
              <div className="flex flex-col gap-4">
                <div className="h-32 bg-[#ddd] border border-[#555] flex items-center justify-center overflow-hidden relative">
                  {/* Simple preview visualization */}
                  <div className="flex flex-col w-full h-full p-4">
                    {formData.layers.map((layer, i) => (
                      <div
                        key={layer.id}
                        style={{ height: `${(layer.thickness / totalThickness) * 100}%` }}
                        className="w-full border-b border-black/20 bg-zinc-400 relative flex items-center justify-center"
                      >
                        <span className="text-[10px] text-black/50 absolute left-2">{layer.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span>Overall Thickness:</span>
                    <span className="bg-[#222] border border-[#555] px-2 py-1 w-20 text-right">
                      {totalThickness.toFixed(precision)}
                    </span>
                    <span className="text-zinc-500">(Determined by components)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span>Components:</span>
                  <div className="border border-[#555] rounded bg-[#222] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#333] border-b border-[#555]">
                        <tr>
                          <th className="p-2 w-8">#</th>
                          <th className="p-2">Name</th>
                          <th className="p-2 w-12 text-center">Core</th>
                          <th className="p-2">Function</th>
                          <th className="p-2">Class</th>
                          <th className="p-2">Material</th>
                          <th className="p-2 w-20 text-right">Thickness</th>
                          <th className="p-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.layers.map((layer, index) => (
                          <tr
                            key={layer.id}
                            className={cn(
                              "border-b border-[#444] hover:bg-[#333] cursor-pointer",
                              selectedLayerId === layer.id ? "bg-[#444]" : ""
                            )}
                            onClick={() => setSelectedLayerId(layer.id)}
                          >
                            <td className="p-2 text-zinc-500">{index + 1}</td>
                            <td className="p-2">
                              <input
                                value={layer.name}
                                onChange={e => updateLayer(layer.id, { name: e.target.value })}
                                className="bg-transparent border-none outline-none w-full"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={layer.isCore}
                                onChange={e => updateLayer(layer.id, { isCore: e.target.checked })}
                                className="accent-blue-500"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={layer.function}
                                onChange={e => updateLayer(layer.id, { function: e.target.value })}
                                className="bg-transparent border-none outline-none text-zinc-300"
                              >
                                <option value="Other">Other</option>
                                <option value="Structural">Structural</option>
                                <option value="Finish">Finish</option>
                                <option value="Insulation">Insulation</option>
                              </select>
                            </td>
                            <td className="p-2 text-zinc-400">&lt;Object Class&gt;</td>
                            <td className="p-2">
                              <input
                                value={layer.material}
                                onChange={e => updateLayer(layer.id, { material: e.target.value })}
                                className="bg-transparent border-none outline-none w-full"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                step={step}
                                value={layer.thickness.toFixed(precision)}
                                onChange={e => updateLayer(layer.id, { thickness: parseFloat(e.target.value) || 0 })}
                                className="bg-transparent border-none outline-none w-full text-right"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button onClick={addLayer} className="px-4 py-1.5 bg-[#444] hover:bg-[#555] border border-[#666] rounded text-xs flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> New...
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insertion' && (
              <div className="flex flex-col gap-4 border border-[#555] p-4 rounded">
                <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                  <label className="text-right">Height:</label>
                  <input
                    type="number"
                    step={step}
                    value={formData.height.toFixed(precision)}
                    onChange={e => setFormData({ ...formData, height: parseFloat(e.target.value) || 3.0 })}
                    className="bg-[#222] border border-[#555] px-2 py-1 outline-none focus:border-blue-500"
                  />

                  <label className="text-right">Top Bound:</label>
                  <select
                    value={formData.topBound}
                    onChange={e => setFormData({ ...formData, topBound: e.target.value })}
                    className="bg-[#222] border border-[#555] px-2 py-1 outline-none focus:border-blue-500"
                  >
                    <option value="Layer Elevation">Layer Elevation</option>
                    <option value="Story Elevation">Story Elevation</option>
                  </select>

                  <label className="text-right">Top Offset:</label>
                  <input
                    type="number"
                    step={step}
                    value={formData.topOffset.toFixed(precision)}
                    onChange={e => setFormData({ ...formData, topOffset: parseFloat(e.target.value) || 0 })}
                    className="bg-[#222] border border-[#555] px-2 py-1 outline-none focus:border-blue-500"
                  />

                  <label className="text-right">Bottom Bound:</label>
                  <select
                    value={formData.bottomBound}
                    onChange={e => setFormData({ ...formData, bottomBound: e.target.value })}
                    className="bg-[#222] border border-[#555] px-2 py-1 outline-none focus:border-blue-500"
                  >
                    <option value="Layer Elevation">Layer Elevation</option>
                    <option value="Story Elevation">Story Elevation</option>
                  </select>

                  <label className="text-right">Bottom Offset:</label>
                  <input
                    type="number"
                    step={step}
                    value={formData.bottomOffset.toFixed(precision)}
                    onChange={e => setFormData({ ...formData, bottomOffset: parseFloat(e.target.value) || 0 })}
                    className="bg-[#222] border border-[#555] px-2 py-1 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'textures' && (
              <div className="flex flex-col gap-4 border border-[#555] p-4 rounded min-h-[200px] items-center justify-center text-zinc-500">
                Texture settings placeholder
              </div>
            )}

            {activeTab === 'data' && (
              <div className="flex flex-col gap-4 border border-[#555] p-4 rounded min-h-[200px] items-center justify-center text-zinc-500">
                Data settings placeholder
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#444] bg-[#333] flex justify-end gap-2">
          <button
            onClick={handleSave}
            className="px-6 py-1.5 bg-[#444] hover:bg-[#555] border border-[#666] rounded text-sm text-white"
          >
            OK
          </button>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-[#444] hover:bg-[#555] border border-[#666] rounded text-sm text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
