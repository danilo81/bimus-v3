"use client";
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Eye, EyeOff, Boxes } from 'lucide-react';
import { BimIsolationViewer } from './BimIsolationViewer';
import { Button } from '@/components/ui/button';

interface BimIsolationModalProps {
    isOpen: boolean;
    onClose: () => void;
    ifcUrl: string;
    targetElementIds: string[];
    itemName: string;
}

export function BimIsolationModal({ isOpen, onClose, ifcUrl, targetElementIds, itemName }: BimIsolationModalProps) {
    const [loadState, setLoadState] = useState('Inicializando...');
    const [loadProgress, setLoadProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showXray, setShowXray] = useState(true);

    const handleLoadState = (state: string, progress?: number) => {
        setLoadState(state);
        if (progress !== undefined) {
            setLoadProgress(progress);
        }
        if (state === 'Completado') {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset state on close
        setIsLoading(true);
        setLoadProgress(0);
        setLoadState('Inicializando...');
        setShowXray(true);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="min-w-[90vw] h-[90vh] bg-card border-accent shadow-2xl flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-accent bg-card backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center justify-between pl-2">
                        <div className="flex flex-col gap-1">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary tracking-tight">
                                <Boxes className="w-5 h-5 text-emerald-400" /> Auditoría de Cómputo 5D
                            </DialogTitle>
                            <p className="text-zinc-400 text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
                                {targetElementIds.length} elementos mapeados <span className="opacity-40">|</span> Partida: <span className="text-indigo-400">{itemName}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3 pr-8">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowXray(!showXray)}
                                className={`text-xs h-8 border-zinc-700 transition-colors ${!showXray ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50' : 'bg-transparent text-zinc-300'}`}
                            >
                                {showXray ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                                {showXray ? 'Ocultar Contexto (Fantasma)' : 'Mostrar Contexto (Fantasma)'}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 relative bg-[#09090b]">
                    {isOpen && (
                        <BimIsolationViewer
                            ifcUrl={ifcUrl}
                            targetElementIds={targetElementIds}
                            onLoadState={handleLoadState}
                            showXray={showXray}
                        />
                    )}

                    {isLoading && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm pointer-events-auto">
                            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                            <h3 className="text-lg font-semibold text-white tracking-wide">{loadState}</h3>
                            <div className="w-64 max-w-sm mt-4 bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                                <div
                                    className="bg-emerald-500 h-full transition-all duration-300 ease-out"
                                    style={{ width: `${loadProgress}%` }}
                                />
                            </div>
                            <p className="text-zinc-500 text-xs mt-2 font-mono">{loadProgress}%</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
