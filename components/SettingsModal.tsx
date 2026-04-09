"use client"
import React, { useState } from 'react';
import { X, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelConfig: {
    showGrid: boolean;
    showShadows: boolean;
    backgroundColor: string;
    gridSize: number;
    gridSpacing: number;
    gridFullCanvas: boolean;
  };
  onUpdateModelConfig: (config: any) => void;
}

export function SettingsModal({ isOpen, onClose, modelConfig, onUpdateModelConfig }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'units'>('general');

  if (!isOpen) return null;

  const handleConfigChange = (key: string, value: any) => {
    onUpdateModelConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-lg font-semibold text-white">Model Configuration</h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 shrink-0 px-4">
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'general' ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            General Configuration
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'units' ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            Units
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-sm text-zinc-300">
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-md">
              <p className="text-zinc-400">
                Configure global settings for the BIM model viewer.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Show Grid</span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900 cursor-pointer"
                    checked={modelConfig.showGrid}
                    onChange={(e) => handleConfigChange('showGrid', e.target.checked)}
                  />
                </div>

                {modelConfig.showGrid && (
                  <div className="pl-4 space-y-4 border-l-2 border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Full Canvas View</span>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900 cursor-pointer"
                        checked={modelConfig.gridFullCanvas}
                        onChange={(e) => handleConfigChange('gridFullCanvas', e.target.checked)}
                      />
                    </div>
                    {!modelConfig.gridFullCanvas && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Grid Size (m)</span>
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          step="10"
                          value={modelConfig.gridSize}
                          onChange={(e) => handleConfigChange('gridSize', Number(e.target.value))}
                          className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-right focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Grid Spacing (m)</span>
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={modelConfig.gridSpacing}
                        onChange={(e) => handleConfigChange('gridSpacing', Number(e.target.value))}
                        className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-right focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-medium">Show Shadows</span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900 cursor-pointer"
                    checked={modelConfig.showShadows}
                    onChange={(e) => handleConfigChange('showShadows', e.target.checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Background Color</span>
                  <input
                    type="color"
                    value={modelConfig.backgroundColor}
                    onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'units' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Length & Decimal Options */}
              <div className="md:col-span-2 space-y-6">
                <fieldset className="border border-zinc-700 rounded-md p-4">
                  <legend className="px-2 text-zinc-400">Length</legend>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="w-16">Units:</label>
                      <select className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 flex-1">
                        <option>Meters</option>
                        <option>Centimeters</option>
                        <option>Millimeters</option>
                        <option>Feet</option>
                        <option>Inches</option>
                      </select>
                      <button className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded px-4 py-1 transition-colors">
                        Custom...
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-indigo-500" />
                        <span>Show unit mark</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-indigo-500" />
                        <span>Show thousands separators in Dimension text</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <div>Rounding style:</div>
                      <div className="pl-4 space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="roundingStyle" className="bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-indigo-500" />
                          <span>Fractional</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="roundingStyle" defaultChecked className="bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-indigo-500" />
                          <span>Decimal</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="roundingStyle" className="bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-indigo-500" />
                          <span>Exact as fractions / non-exact as decimals</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span>Fractional display for Dimensions:</span>
                      <div className="flex gap-2">
                        <button className="w-8 h-8 flex items-center justify-center bg-zinc-800 border border-zinc-600 rounded">1/4</button>
                        <button className="w-8 h-8 flex items-center justify-center bg-zinc-800/50 border border-zinc-700 rounded hover:bg-zinc-800">¼</button>
                        <button className="w-8 h-8 flex items-center justify-center bg-zinc-800/50 border border-zinc-700 rounded hover:bg-zinc-800">
                          <span className="text-[10px] leading-none flex flex-col items-center"><span>1</span><span className="border-t border-zinc-400 w-full"></span><span>4</span></span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>Rounding precision:</div>
                      <div className="pl-4 space-y-3">
                        <div className="flex items-center gap-4">
                          <label className="w-48">Fraction precision:</label>
                          <select className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 w-32">
                            <option>1/8</option>
                            <option>1/16</option>
                            <option>1/32</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="w-48">Decimal precision:</label>
                          <select className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 w-32">
                            <option>.001</option>
                            <option>.01</option>
                            <option>.1</option>
                          </select>
                          <button className="p-1.5 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700">
                            <LinkIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="w-48 text-zinc-500">Dimension object precision:</label>
                          <select disabled className="bg-zinc-800/50 border border-zinc-700/50 text-zinc-500 rounded px-2 py-1 w-32">
                            <option>.001</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="w-48">Decimal rounding base:</label>
                          <select className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 w-32">
                            <option>1</option>
                            <option>5</option>
                          </select>
                          <button className="p-1.5 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700">
                            <LinkIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="w-48 text-zinc-500">Dimension rounding base:</label>
                          <select disabled className="bg-zinc-800/50 border border-zinc-700/50 text-zinc-500 rounded px-2 py-1 w-32">
                            <option>1</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border border-zinc-700 rounded-md p-4">
                  <legend className="px-2 text-zinc-400">Decimal Options</legend>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-indigo-500" />
                      <span>Leading zero</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-indigo-500" />
                      <span>Trailing zero</span>
                    </label>
                  </div>
                </fieldset>
              </div>

              {/* Right Column: Area, Volume, Angle */}
              <div className="space-y-6">
                <fieldset className="border border-zinc-700 rounded-md p-4">
                  <legend className="px-2 text-zinc-400">Area</legend>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="w-16">Units:</label>
                      <select className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 flex-1">
                        <option>Square Meters</option>
                        <option>Square Feet</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <button className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded px-4 py-1 transition-colors text-zinc-500">
                        Custom...
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="w-16">Precision:</label>
                      <select className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 flex-1">
                        <option>.001</option>
                        <option>.01</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border border-zinc-700 rounded-md p-4">
                  <legend className="px-2 text-zinc-400">Volume</legend>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="w-16">Units:</label>
                      <select className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 flex-1">
                        <option>Cubic Meters</option>
                        <option>Cubic Feet</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <button className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded px-4 py-1 transition-colors text-zinc-500">
                        Custom...
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="w-16">Precision:</label>
                      <select className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 flex-1">
                        <option>.001</option>
                        <option>.01</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border border-zinc-700 rounded-md p-4">
                  <legend className="px-2 text-zinc-400">Angle</legend>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="w-16">Units:</label>
                      <select className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 flex-1">
                        <option>Degrees</option>
                        <option>Radians</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="w-16">Precision:</label>
                      <select className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 flex-1">
                        <option>0.00</option>
                        <option>0.0</option>
                      </select>
                    </div>
                  </div>
                </fieldset>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end shrink-0 bg-[#1e1e1e]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
