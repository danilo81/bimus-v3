"use client"
import { BimElement, BimClass, LineType, ScaleSettings } from '@/types/types';
import { Layers, Box, Info, X, Edit2 } from 'lucide-react';

interface SidebarProps {
  selectedElement: BimElement | null;
  onClose: () => void;
  wireframe: boolean;
  onToggleWireframe: () => void;
  onUpdateElement: (id: string, updates: Partial<BimElement>) => void;
  bimClasses: BimClass[];
  lineTypes?: LineType[];
  scaleSettings: ScaleSettings;
}

export function Sidebar({ selectedElement, onClose, wireframe, onToggleWireframe, onUpdateElement, bimClasses, lineTypes, scaleSettings }: SidebarProps) {
  const precision = scaleSettings.precision;
  const step = Math.pow(10, -precision);

  const getOriginCoords = (element: BimElement) => {
    if (element.geometry.type !== 'rectangle' || !element.geometry.args || element.geometry.args.length < 2) return [0, 0];
    const [cx, , cz] = element.geometry.position;
    const [w, h] = element.geometry.args;
    const origin = element.origin || 'mc';

    let ox = cx;
    let oz = cz;

    if (origin.includes('l')) ox -= w / 2;
    if (origin.includes('r')) ox += w / 2;
    if (origin.includes('t')) oz -= h / 2;
    if (origin.includes('b')) oz += h / 2;

    return [ox, oz];
  };

  const handleOriginPositionUpdate = (newOx: number, newOz: number) => {
    if (!selectedElement || selectedElement.geometry.type !== 'rectangle' || !selectedElement.geometry.args || selectedElement.geometry.args.length < 2) return;
    const [w, h] = selectedElement.geometry.args;
    const origin = selectedElement.origin || 'mc';

    let ncx = newOx;
    let ncz = newOz;

    if (origin.includes('l')) ncx += w / 2;
    if (origin.includes('r')) ncx -= w / 2;
    if (origin.includes('t')) ncz += h / 2;
    if (origin.includes('b')) ncz -= h / 2;

    onUpdateElement(selectedElement.id, {
      geometry: {
        ...selectedElement.geometry,
        position: [ncx, selectedElement.geometry.position[1], ncz]
      }
    });
  };

  return (
    <div className="absolute top-4 right-4 bottom-4 w-80 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl text-zinc-100 flex flex-col overflow-hidden shadow-2xl z-20 pointer-events-auto">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold tracking-tight">BIM Editor</h2>
        </div>
      </div>

      <div className="p-4 border-b border-zinc-800">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">View Controls</h3>
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={wireframe}
              onChange={onToggleWireframe}
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${wireframe ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${wireframe ? 'translate-x-4' : ''}`}></div>
          </div>
          <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">Wireframe Mode</span>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {selectedElement ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-4">
                <input
                  type="text"
                  value={selectedElement.name}
                  onChange={(e) => onUpdateElement(selectedElement.id, { name: e.target.value })}
                  className="text-lg font-medium text-white bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-blue-500 focus:outline-none w-full px-1 py-0.5 transition-colors"
                />
                <p className="text-xs text-zinc-500 font-mono mt-1 px-1">{selectedElement.id}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
                title="Deselect"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-3 text-zinc-300">
                  <Info className="w-4 h-4" />
                  <h4 className="text-sm font-medium">Identity Data</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Category</label>
                    <input
                      type="text"
                      value={selectedElement.category}
                      onChange={(e) => onUpdateElement(selectedElement.id, { category: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Level</label>
                    <input
                      type="text"
                      value={selectedElement.level}
                      onChange={(e) => onUpdateElement(selectedElement.id, { level: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Group Class</label>
                    <select
                      value={selectedElement.bimClass || '00'}
                      onChange={(e) => onUpdateElement(selectedElement.id, { bimClass: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                    >
                      {bimClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Fill Type</label>
                    <select
                      value={selectedElement.fillType || 'solid'}
                      onChange={(e) => onUpdateElement(selectedElement.id, { fillType: e.target.value as any })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="solid">Solid</option>
                      <option value="gradient">Gradient</option>
                      <option value="texture">Texture</option>
                      <option value="hatch">Hatch</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Fill Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedElement.color}
                        onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <span className="text-zinc-400 font-mono text-xs uppercase">{selectedElement.color}</span>
                    </div>
                  </div>
                  {selectedElement.fillType === 'gradient' && (
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">Fill Color 2 (Gradient)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedElement.fillColor2 || '#ffffff'}
                          onChange={(e) => onUpdateElement(selectedElement.id, { fillColor2: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <span className="text-zinc-400 font-mono text-xs uppercase">{selectedElement.fillColor2 || '#ffffff'}</span>
                      </div>
                    </div>
                  )}
                  {selectedElement.fillType === 'texture' && (
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">Texture URL</label>
                      <input
                        type="text"
                        value={selectedElement.textureUrl || ''}
                        onChange={(e) => onUpdateElement(selectedElement.id, { textureUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                  {selectedElement.fillType === 'hatch' && (
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">Hatch Type</label>
                      <select
                        value={selectedElement.hatchType || 'diagonal'}
                        onChange={(e) => onUpdateElement(selectedElement.id, { hatchType: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="diagonal">Diagonal</option>
                        <option value="cross">Cross</option>
                        <option value="dots">Dots</option>
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Opacity ({Math.round((selectedElement.opacity || 1) * 100)}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={selectedElement.opacity || 1}
                      onChange={(e) => onUpdateElement(selectedElement.id, { opacity: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div className="pt-2 border-t border-zinc-800">
                    <label className="text-xs text-zinc-500 block mb-1">Line Type</label>
                    <select
                      value={selectedElement.lineType || 'solid'}
                      onChange={(e) => onUpdateElement(selectedElement.id, { lineType: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="solid">Solid</option>
                      {lineTypes?.map(lt => (
                        <option key={lt.id} value={lt.id}>{lt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Line Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedElement.lineColor || '#000000'}
                        onChange={(e) => onUpdateElement(selectedElement.id, { lineColor: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <span className="text-zinc-400 font-mono text-xs uppercase">{selectedElement.lineColor || '#000000'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Line Width</label>
                    <input
                      type="number"
                      min="0.1"
                      max="10"
                      step={step}
                      value={(selectedElement.lineWidth || 1).toFixed(precision)}
                      onChange={(e) => onUpdateElement(selectedElement.id, { lineWidth: parseFloat(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {selectedElement.geometry.type === 'rectangle' && (
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-3 text-zinc-300">
                    <Box className="w-4 h-4" />
                    <h4 className="text-sm font-medium">Geometry</h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-zinc-500 block mb-1">Width</label>
                        <input
                          type="number"
                          step={step}
                          value={(selectedElement.geometry.args[0] || 0).toFixed(precision)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const newW = isNaN(val) ? 0 : val;
                            const currentW = selectedElement.geometry.args[0] || 0;
                            const currentH = selectedElement.geometry.args[1] || 0;
                            const [cx, cy, cz] = selectedElement.geometry.position;
                            const origin = selectedElement.origin || 'mc';
                            let dx = 0;
                            if (origin.includes('l')) dx = (newW - currentW) / 2;
                            else if (origin.includes('r')) dx = -(newW - currentW) / 2;
                            onUpdateElement(selectedElement.id, {
                              geometry: {
                                ...selectedElement.geometry,
                                args: [newW, currentH, 0.01],
                                position: [cx + dx, cy, cz]
                              },
                              area: newW * currentH
                            });
                          }}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 block mb-1">Height</label>
                        <input
                          type="number"
                          step={step}
                          value={(selectedElement.geometry.args[1] || 0).toFixed(precision)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const newH = isNaN(val) ? 0 : val;
                            const currentW = selectedElement.geometry.args[0] || 0;
                            const currentH = selectedElement.geometry.args[1] || 0;
                            const [cx, cy, cz] = selectedElement.geometry.position;
                            const origin = selectedElement.origin || 'mc';
                            let dz = 0;
                            if (origin.includes('t')) dz = (newH - currentH) / 2;
                            else if (origin.includes('b')) dz = -(newH - currentH) / 2;
                            onUpdateElement(selectedElement.id, {
                              geometry: {
                                ...selectedElement.geometry,
                                args: [currentW, newH, 0.01],
                                position: [cx, cy, cz + dz]
                              },
                              area: currentW * newH
                            });
                          }}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <div className="relative">
                        <div className="grid grid-cols-3 gap-0.5 w-16 h-12 relative bg-zinc-900 p-1 rounded border border-zinc-700">
                          {/* Grid lines */}
                          <div className="absolute inset-0 flex flex-col justify-between py-2.5 pointer-events-none px-1">
                            <div className="h-px bg-zinc-800 w-full" />
                            <div className="h-px bg-zinc-800 w-full" />
                          </div>
                          <div className="absolute inset-0 flex justify-between px-3.5 pointer-events-none py-1">
                            <div className="w-px bg-zinc-800 h-full" />
                            <div className="w-px bg-zinc-800 h-full" />
                          </div>

                          {['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'].map((origin) => (
                            <button
                              key={origin}
                              onClick={() => onUpdateElement(selectedElement.id, { origin: origin as any })}
                              className="relative z-10 flex items-center justify-center"
                            >
                              <div className={`w-1.5 h-1.5 rounded-full transition-all ${(selectedElement.origin || 'mc') === origin
                                ? 'bg-blue-500 scale-125 ring-2 ring-blue-500/20'
                                : 'bg-zinc-700 hover:bg-zinc-500'
                                }`} />
                            </button>
                          ))}
                        </div>
                        <div className="absolute -bottom-4 left-0 right-0 flex justify-center">
                          <span className="text-[8px] text-zinc-600 font-bold">W</span>
                        </div>
                        <div className="absolute -left-4 top-0 bottom-0 flex items-center">
                          <span className="text-[8px] text-zinc-600 font-bold [writing-mode:vertical-lr] rotate-180">H</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 w-3">X:</span>
                          <input
                            type="number"
                            step={step}
                            value={(getOriginCoords(selectedElement)[0] || 0).toFixed(precision)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              handleOriginPositionUpdate(isNaN(val) ? 0 : val, getOriginCoords(selectedElement)[1] || 0);
                            }}
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 w-3">Y:</span>
                          <input
                            type="number"
                            step={step}
                            value={(getOriginCoords(selectedElement)[1] || 0).toFixed(precision)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              handleOriginPositionUpdate(getOriginCoords(selectedElement)[0] || 0, isNaN(val) ? 0 : val);
                            }}
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-3 text-zinc-300">
                  <Box className="w-4 h-4" />
                  <h4 className="text-sm font-medium">Physical Properties</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Material</label>
                    <input
                      type="text"
                      value={selectedElement.material}
                      onChange={(e) => onUpdateElement(selectedElement.id, { material: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-500">Volume</span>
                    <span className="text-zinc-200 font-medium font-mono">{selectedElement.volume.toFixed(precision)} m³</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-500">Area</span>
                    <span className="text-zinc-200 font-medium font-mono">{selectedElement.area.toFixed(precision)} m²</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
              <Edit2 className="w-6 h-6 text-zinc-600" />
            </div>
            <p className="text-sm">Select an element in the 3D view<br />to edit its properties.</p>
          </div>
        )}
      </div>
    </div>
  );
}
