"use client"
import React, { useState, useMemo } from 'react';
import { Layers, Box, Info, X, Tag, Calculator, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface BimAssignmentSidebarProps {
  onClose: () => void;
  projectItems: any[];
  mappedElements: { elementId: string; projectItemId: string; quantity: number }[];
  activeAssignmentTarget: string | null;
  onSelectTarget: (projectItemId: string | null) => void;
}

export function BimAssignmentSidebar({
  onClose,
  projectItems,
  mappedElements,
  activeAssignmentTarget,
  onSelectTarget
}: BimAssignmentSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Group mapped elements by project item
  const mappedStats = useMemo(() => {
    const stats: Record<string, { count: number, total: number }> = {};
    mappedElements.forEach(m => {
      if (!stats[m.projectItemId]) {
        stats[m.projectItemId] = { count: 0, total: 0 };
      }
      stats[m.projectItemId].count++;
      stats[m.projectItemId].total += m.quantity;
    });
    return stats;
  }, [mappedElements]);

  const filteredItems = useMemo(() => {
    return projectItems.filter(pi =>
      pi.item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pi.item.chapter.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projectItems, searchTerm]);

  return (
    <div className="absolute top-4 right-4 bottom-4 w-96 bg-[#0a0a0a]/95 backdrop-blur-md border border-zinc-800 rounded-xl text-zinc-100 flex flex-col overflow-hidden shadow-2xl z-20 pointer-events-auto">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold tracking-tight uppercase text-sm">Cómputos 5D</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 border-b border-zinc-800 flex flex-col gap-3">
        <p className="text-[10px] uppercase text-zinc-400 font-bold tracking-widest leading-relaxed">
          Seleccione una partida de la lista para activarla. Luego, haga clic en los elementos del modelo 3D para asignar sus cantidades (Volumen/Área) automáticamente a la partida seleccionada.
        </p>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar partida o capítulo..."
          className="w-full bg-black border border-zinc-800 rounded text-xs px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500 placeholder:uppercase placeholder:tracking-widest"
        />
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2 p-2">
          {filteredItems.map(pi => {
            const isActive = activeAssignmentTarget === pi.id;
            const stats = mappedStats[pi.id];

            return (
              <div
                key={pi.id}
                onClick={() => onSelectTarget(isActive ? null : pi.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${isActive
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col flex-1 pr-2">
                    <span className={`text-xs font-bold uppercase transition-colors ${isActive ? 'text-emerald-400' : 'text-zinc-200'}`}>
                      {pi.item.description}
                    </span>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{pi.item.chapter}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-zinc-400 bg-black px-1.5 py-0.5 rounded border border-zinc-800 pb-0">{pi.item.unit}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <Tag className={`w-3.5 h-3.5 ${stats ? 'text-blue-400' : 'text-zinc-600'}`} />
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {stats ? `${stats.count} elem.` : '0 elem.'}
                    </span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-xs font-mono font-bold text-white">{(pi.quantity || 0).toFixed(2)}</span>
                    <span className="text-[9px] text-zinc-500 mb-px">TOT</span>
                  </div>
                </div>

                {isActive && (
                  <>
                    <div className="mt-3 pt-2 w-full flex items-center justify-center gap-2 text-[9px] text-emerald-400 uppercase tracking-widest font-bold animate-pulse">
                      <CheckCircle2 className="w-3 h-3" /> Partida Activa - Haga clic en el modelo
                    </div>
                    {stats && stats.count > 0 && (
                      <div className="mt-3 space-y-1.5 border-t border-zinc-800/30 pt-3">
                        <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-widest">Elementos vinculados:</span>
                        <div className="max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                           {mappedElements.filter(m => m.projectItemId === pi.id).map((m, idx) => (
                             <div key={idx} className="flex items-center justify-between bg-black/40 rounded px-2 py-1.5 border border-zinc-800/50">
                               <div className="flex items-center gap-2 truncate">
                                 <Box className="w-2.5 h-2.5 text-zinc-600" />
                                 <span className="text-[10px] text-zinc-400 truncate font-mono uppercase">{m.elementId.split('-').pop()}</span>
                               </div>
                               <div className="flex items-center gap-1 shrink-0">
                                 <span className="text-[10px] font-bold text-emerald-400/80">{m.quantity.toFixed(2)}</span>
                                 <span className="text-[8px] text-zinc-600">{pi.item.unit}</span>
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="py-10 text-center opacity-30 flex flex-col items-center gap-3">
              <Box className="w-8 h-8" />
              <p className="text-[10px] uppercase tracking-widest font-black">No hay partidas que coincidan</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
