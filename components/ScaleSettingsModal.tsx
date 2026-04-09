"use client"
import React from 'react';
import { X, Ruler } from 'lucide-react';
import { ScaleSettings } from '@/types/types';

interface ScaleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scaleSettings: ScaleSettings;
  onUpdateScaleSettings: (settings: ScaleSettings) => void;
}

const IMPERIAL_SCALES = [
  '1/32"', '1/16"', '1/8"', '3/16"', '1/4"', '3/8"',
  '1/2"', '3/4"', '1"', '1-1/2"', '2"', '3"',
  '1" = 10\'', '1" = 20\'', '1" = 30\'', '1" = 40\'', '1" = 50\'', '1" = 100\''
];

const METRIC_SCALES = [
  '1:1', '1:2', '1:4', '1:5', '1:8',
  '1:10', '1:20', '1:25', '1:50', '1:100',
  '1:200', '1:500', '1:1000', '1:5000', '1:10000'
];

const ENLARGEMENT_SCALES = [
  '2x', '3x', '4x', '5x',
  '6x', '8x', '10x', '15x',
  '20x', '50x', '100x', '500x'
];

export function ScaleSettingsModal({ isOpen, onClose, scaleSettings, onUpdateScaleSettings }: ScaleSettingsModalProps) {
  if (!isOpen) return null;

  const handleScaleSelect = (type: ScaleSettings['type'], value: string) => {
    onUpdateScaleSettings({ ...scaleSettings, type, value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white tracking-tight">Working Scale</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Imperial Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-zinc-800" />
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Imperial</h3>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {IMPERIAL_SCALES.map((scale) => (
                  <label key={scale} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="scale"
                      checked={scaleSettings.type === 'imperial' && scaleSettings.value === scale}
                      onChange={() => handleScaleSelect('imperial', scale)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${scaleSettings.type === 'imperial' && scaleSettings.value === scale
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-zinc-700 group-hover:border-zinc-500'
                      }`}>
                      {scaleSettings.type === 'imperial' && scaleSettings.value === scale && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`text-xs transition-colors ${scaleSettings.type === 'imperial' && scaleSettings.value === scale
                      ? 'text-white font-medium'
                      : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}>{scale}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Metric Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-zinc-800" />
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Metric/Engineering</h3>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {METRIC_SCALES.map((scale) => (
                  <label key={scale} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="scale"
                      checked={scaleSettings.type === 'metric' && scaleSettings.value === scale}
                      onChange={() => handleScaleSelect('metric', scale)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${scaleSettings.type === 'metric' && scaleSettings.value === scale
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-zinc-700 group-hover:border-zinc-500'
                      }`}>
                      {scaleSettings.type === 'metric' && scaleSettings.value === scale && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`text-xs transition-colors ${scaleSettings.type === 'metric' && scaleSettings.value === scale
                      ? 'text-white font-medium'
                      : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}>{scale}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Enlargement Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-zinc-800" />
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Enlargement</h3>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ENLARGEMENT_SCALES.map((scale) => (
                  <label key={scale} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="scale"
                      checked={scaleSettings.type === 'enlargement' && scaleSettings.value === scale}
                      onChange={() => handleScaleSelect('enlargement', scale)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${scaleSettings.type === 'enlargement' && scaleSettings.value === scale
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-zinc-700 group-hover:border-zinc-500'
                      }`}>
                      {scaleSettings.type === 'enlargement' && scaleSettings.value === scale && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`text-xs transition-colors ${scaleSettings.type === 'enlargement' && scaleSettings.value === scale
                      ? 'text-white font-medium'
                      : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}>{scale}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Paper Scale Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-zinc-800" />
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Paper Scale</h3>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="scale"
                      checked={scaleSettings.type === 'paper'}
                      onChange={() => handleScaleSelect('paper', scaleSettings.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${scaleSettings.type === 'paper'
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-zinc-700 group-hover:border-zinc-500'
                      }`}>
                      {scaleSettings.type === 'paper' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`text-xs transition-colors ${scaleSettings.type === 'paper'
                      ? 'text-white font-medium'
                      : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}>1:</span>
                  </label>
                  <input
                    type="text"
                    value={scaleSettings.type === 'paper' ? scaleSettings.value : ''}
                    onChange={(e) => onUpdateScaleSettings({ ...scaleSettings, type: 'paper', value: e.target.value })}
                    placeholder="100"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Precision</h3>
                  <div className="flex items-center gap-4">
                    {[0, 1, 2, 3, 4].map((p) => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="precision"
                          checked={scaleSettings.precision === p}
                          onChange={() => onUpdateScaleSettings({ ...scaleSettings, precision: p })}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${scaleSettings.precision === p
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-zinc-700 group-hover:border-zinc-500'
                          }`}>
                          {scaleSettings.precision === p && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span className={`text-xs transition-colors ${scaleSettings.precision === p
                          ? 'text-white font-medium'
                          : 'text-zinc-400 group-hover:text-zinc-200'
                          }`}>.{'0'.repeat(p)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={scaleSettings.allLayers}
                        onChange={(e) => onUpdateScaleSettings({ ...scaleSettings, allLayers: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${scaleSettings.allLayers ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-700 group-hover:border-zinc-500'
                        }`}>
                        {scaleSettings.allLayers && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">All Layers</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={scaleSettings.scaleText}
                        onChange={(e) => onUpdateScaleSettings({ ...scaleSettings, scaleText: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${scaleSettings.scaleText ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-700 group-hover:border-zinc-500'
                        }`}>
                        {scaleSettings.scaleText && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">Scale Text</span>
                  </label>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            Apply Scale
          </button>
        </div>
      </div>
    </div>
  );
}
