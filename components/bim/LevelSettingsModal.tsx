"use client"
import React, { useState, useEffect } from 'react';
import { X, Settings, Info, Ruler, Scissors, Layers } from 'lucide-react';
import { Level, ScaleSettings } from '@/types/types';

interface LevelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: Level;
  onSave: (updatedLevel: Level) => void;
  scaleSettings: ScaleSettings;
}

export function LevelSettingsModal({ isOpen, onClose, level, onSave, scaleSettings }: LevelSettingsModalProps) {
  const [formData, setFormData] = useState<Level>(level);

  const precision = scaleSettings.precision;
  const step = Math.pow(10, -precision);

  useEffect(() => {
    setFormData(level);
  }, [level]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Configuración del Nivel</h2>
              <p className="text-xs text-zinc-500 font-mono">{level.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* General Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              <Info className="w-3.5 h-3.5" />
              <span>Información General</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nombre del Nivel</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Ej: Planta Baja"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={formData.isStory ? "text-indigo-400" : "text-zinc-600"}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-white">Story</span>
                    <span className="text-xs text-zinc-500">Define si este nivel es un piso principal</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.isStory}
                    onChange={(e) => setFormData({ ...formData, isStory: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Geometry Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              <Ruler className="w-3.5 h-3.5" />
              <span>Geometría y Elevación</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Elevación (m)</label>
                <div className="relative">
                  <input
                    type="number"
                    step={step}
                    value={formData.elevation.toFixed(precision)}
                    onChange={(e) => setFormData({ ...formData, elevation: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Altura Muro Def. (m)</label>
                <div className="relative">
                  <input
                    type="number"
                    step={step}
                    value={formData.defaultWallHeight.toFixed(precision)}
                    onChange={(e) => setFormData({ ...formData, defaultWallHeight: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* View Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              <Scissors className="w-3.5 h-3.5" />
              <span>Configuración de Vista</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Plano de Corte (m)</label>
              <div className="relative">
                <input
                  type="number"
                  step={step}
                  value={formData.cutPlane.toFixed(precision)}
                  onChange={(e) => setFormData({ ...formData, cutPlane: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <p className="mt-1.5 text-[10px] text-zinc-500 italic">Altura relativa al nivel para la vista en planta</p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
