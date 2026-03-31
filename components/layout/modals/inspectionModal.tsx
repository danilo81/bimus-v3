/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createInspectionRecord } from '@/app/projects/[id]/operations/actions';
import { useToast } from '@/hooks/use-toast';

interface InspectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: any;
    onSuccess: () => void;
}

interface CheckState {
    passed: boolean | null; // null = sin evaluar
    observation: string;
}

export default function InspectionDialog({ open, onOpenChange, project, onSuccess }: InspectionDialogProps) {
    const { toast } = useToast();
    const [selectedProjectItemId, setSelectedProjectItemId] = useState('');
    const [selectedLevelId, setSelectedLevelId] = useState('none');
    const [inspector, setInspector] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [checks, setChecks] = useState<Record<string, CheckState>>({});
    const [expandedControls, setExpandedControls] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);

    const selectedProjectItem = useMemo(() =>
        project?.items?.find((pi: any) => pi.id === selectedProjectItemId),
        [project, selectedProjectItemId]
    );

    const qualityControls = useMemo(() =>
        selectedProjectItem?.item?.qualityControls || [],
        [selectedProjectItem]
    );

    const availableLevels = useMemo(() => project?.levels || [], [project]);

    const handleSelectItem = (projectItemId: string) => {
        setSelectedProjectItemId(projectItemId);
        setSelectedLevelId('none');
        setChecks({});
        setExpandedControls({});
    };

    const getCheckKey = (qcId: string, subPointId?: string) =>
        subPointId ? `${qcId}__${subPointId}` : qcId;

    const setCheck = (key: string, passed: boolean | null) => {
        setChecks(prev => ({ ...prev, [key]: { ...(prev[key] || { observation: '' }), passed } }));
    };

    const setObservation = (key: string, observation: string) => {
        setChecks(prev => ({ ...prev, [key]: { ...(prev[key] || { passed: null }), observation } }));
    };

    const toggleExpand = (qcId: string) => {
        setExpandedControls(prev => ({ ...prev, [qcId]: !prev[qcId] }));
    };

    // Calcula el estado de un QualityControl basado en sus subpoints (o en sí mismo si no tiene)
    const getControlStatus = (qc: any): 'aprobado' | 'rechazado' | 'parcial' | 'pendiente' => {
        const points = qc.subPoints?.length > 0 ? qc.subPoints : [{ id: qc.id, _self: true }];
        const states = points.map((sp: any) => {
            const key = sp._self ? qc.id : getCheckKey(qc.id, sp.id);
            return checks[key]?.passed;
        });
        if (states.every((s: any) => s === null || s === undefined)) return 'pendiente';
        if (states.every((s: any) => s === true)) return 'aprobado';
        if (states.every((s: any) => s === false)) return 'rechazado';
        return 'parcial';
    };

    const totalChecks = useMemo(() => {
        let total = 0;
        for (const qc of qualityControls) {
            total += qc.subPoints?.length > 0 ? qc.subPoints.length : 1;
        }
        return total;
    }, [qualityControls]);

    const evaluatedChecks = useMemo(() =>
        Object.values(checks).filter(c => c.passed !== null).length,
        [checks]
    );

    const overallStatus = useMemo(() => {
        if (evaluatedChecks === 0) return 'pendiente';
        const allPassed = Object.values(checks).filter(c => c.passed !== null).every(c => c.passed === true);
        const allFailed = Object.values(checks).filter(c => c.passed !== null).every(c => c.passed === false);
        if (allPassed && evaluatedChecks === totalChecks) return 'aprobado';
        if (allFailed) return 'rechazado';
        return 'parcial';
    }, [checks, evaluatedChecks, totalChecks]);

    const handleSave = async () => {
        if (!selectedProjectItemId || !project) return;
        if (evaluatedChecks === 0) {
            toast({ title: "Sin evaluaciones", description: "Debe evaluar al menos un punto de control.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const checksPayload: { qualityControlId: string; subPointId?: string; passed: boolean; observation?: string }[] = [];

            for (const qc of qualityControls) {
                if (qc.subPoints?.length > 0) {
                    for (const sp of qc.subPoints) {
                        const key = getCheckKey(qc.id, sp.id);
                        const state = checks[key];
                        if (state?.passed !== null && state?.passed !== undefined) {
                            checksPayload.push({
                                qualityControlId: qc.id,
                                subPointId: sp.id,
                                passed: state.passed,
                                observation: state.observation || undefined,
                            });
                        }
                    }
                } else {
                    const key = qc.id;
                    const state = checks[key];
                    if (state?.passed !== null && state?.passed !== undefined) {
                        checksPayload.push({
                            qualityControlId: qc.id,
                            passed: state.passed,
                            observation: state.observation || undefined,
                        });
                    }
                }
            }

            const result = await createInspectionRecord({
                projectId: project.id,
                projectItemId: selectedProjectItemId,
                levelId: selectedLevelId !== 'none' ? selectedLevelId : undefined,
                inspector: inspector || undefined,
                date,
                notes: notes || undefined,
                checks: checksPayload,
            });

            if (result.success) {
                toast({ title: "Inspección registrada", description: `Estado: ${result.record?.status?.toUpperCase()}` });
                onSuccess();
                handleReset();
                onOpenChange(false);
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setSelectedProjectItemId('');
        setSelectedLevelId('none');
        setInspector('');
        setDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        setChecks({});
        setExpandedControls({});
    };

    const statusBadge = {
        aprobado: <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] font-black uppercase">Aprobado</Badge>,
        rechazado: <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px] font-black uppercase">Rechazado</Badge>,
        parcial: <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] font-black uppercase">Parcial</Badge>,
        pendiente: <Badge className="bg-white/10 text-muted-foreground border-white/10 text-[9px] font-black uppercase">Pendiente</Badge>,
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
            <DialogContent className="max-w-4xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden h-[95vh] flex flex-col shadow-2xl">
                <DialogHeader className="p-6 border-b border-white/5 bg-white/2 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/20">
                            <ClipboardList className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold uppercase tracking-tight">Registro de Inspección</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mt-1">
                                Control de calidad por partida y nivel de obra
                            </DialogDescription>
                        </div>
                        <div className="ml-auto">{statusBadge[overallStatus]}</div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Cabecera del formulario */}
                    <div className="p-6 border-b border-white/5 bg-black/20 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                        <div className="col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Partida *</Label>
                            <Select value={selectedProjectItemId} onValueChange={handleSelectItem}>
                                <SelectTrigger className="h-9 bg-black border-white/10 text-[10px] font-bold uppercase">
                                    <SelectValue placeholder="Seleccionar partida..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0a0a] text-white border-white/10">
                                    {(project?.items || []).map((pi: any) => (
                                        <SelectItem key={pi.id} value={pi.id} className="text-[10px] font-bold uppercase">
                                            {pi.item.description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nivel</Label>
                            <Select value={selectedLevelId} onValueChange={setSelectedLevelId}>
                                <SelectTrigger className="h-9 bg-black border-white/10 text-[10px] font-bold uppercase">
                                    <SelectValue placeholder="Nivel..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0a0a] text-white border-white/10">
                                    <SelectItem value="none" className="text-[10px] font-bold uppercase">General</SelectItem>
                                    {availableLevels.map((lvl: any) => (
                                        <SelectItem key={lvl.id} value={lvl.id} className="text-[10px] font-bold uppercase">{lvl.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)}
                                className="h-9 bg-black border-white/10 text-[10px] font-bold" />
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inspector</Label>
                            <Input value={inspector} onChange={e => setInspector(e.target.value)}
                                placeholder="Nombre del inspector..."
                                className="h-9 bg-black border-white/10 text-[10px] font-bold placeholder:text-muted-foreground/40" />
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notas generales</Label>
                            <Input value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="Observaciones generales..."
                                className="h-9 bg-black border-white/10 text-[10px] font-bold placeholder:text-muted-foreground/40" />
                        </div>
                    </div>

                    {/* Lista de controles de calidad */}
                    <ScrollArea className="flex-1">
                        {!selectedProjectItemId ? (
                            <div className="flex flex-col items-center justify-center py-32 opacity-20">
                                <ClipboardList className="h-12 w-12 mb-3 text-muted-foreground" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seleccione una partida para ver los puntos de control</p>
                            </div>
                        ) : qualityControls.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 opacity-20">
                                <AlertCircle className="h-12 w-12 mb-3 text-muted-foreground" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Esta partida no tiene controles de calidad definidos</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-3">
                                {/* Progress bar */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-300 rounded-full"
                                            style={{ width: totalChecks > 0 ? `${(evaluatedChecks / totalChecks) * 100}%` : '0%' }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                                        {evaluatedChecks}/{totalChecks} evaluados
                                    </span>
                                </div>

                                {qualityControls.map((qc: any) => {
                                    const hasSubPoints = qc.subPoints?.length > 0;
                                    const isExpanded = expandedControls[qc.id] ?? true;
                                    const controlStatus = getControlStatus(qc);

                                    return (
                                        <div key={qc.id} className="border border-white/8 rounded-xl overflow-hidden bg-black/30">
                                            {/* Control header */}
                                            <div
                                                className={cn(
                                                    "flex items-center gap-3 p-4 cursor-pointer hover:bg-white/3 transition-colors",
                                                    hasSubPoints && "border-b border-white/5"
                                                )}
                                                onClick={() => hasSubPoints && toggleExpand(qc.id)}
                                            >
                                                {hasSubPoints ? (
                                                    isExpanded
                                                        ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                                ) : <div className="w-4" />}

                                                <span className="text-xs font-bold uppercase text-white flex-1">{qc.description}</span>

                                                <div className="flex items-center gap-2">
                                                    {statusBadge[controlStatus]}
                                                    {!hasSubPoints && (
                                                        <CheckRow
                                                            checkKey={qc.id}
                                                            state={checks[qc.id]}
                                                            onCheck={setCheck}
                                                            onObservation={setObservation}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sub-points */}
                                            {hasSubPoints && isExpanded && (
                                                <div className="divide-y divide-white/5">
                                                    {qc.subPoints.map((sp: any) => {
                                                        const key = getCheckKey(qc.id, sp.id);
                                                        return (
                                                            <div key={sp.id} className="flex items-center gap-3 px-6 py-3 hover:bg-white/2 transition-colors">
                                                                <span className="text-[11px] text-muted-foreground flex-1 pl-4 border-l border-white/10">{sp.description}</span>
                                                                <CheckRow
                                                                    checkKey={key}
                                                                    state={checks[key]}
                                                                    onCheck={setCheck}
                                                                    onObservation={setObservation}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter className="p-6 border-t border-white/5 bg-black/20 shrink-0">
                    <Button variant="ghost" onClick={() => { handleReset(); onOpenChange(false); }}
                        className="text-[10px] font-black uppercase tracking-widest">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!selectedProjectItemId || evaluatedChecks === 0 || isSaving}
                        className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest px-12 h-11 shadow-xl shadow-primary/10"
                    >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        {isSaving ? 'Guardando...' : 'Registrar Inspección'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Componente auxiliar para la fila de check (Aprobado/Rechazado + observación)
function CheckRow({ checkKey, state, onCheck, onObservation }: {
    checkKey: string;
    state: CheckState | undefined;
    onCheck: (key: string, passed: boolean | null) => void;
    onObservation: (key: string, obs: string) => void;
}) {
    const [showObs, setShowObs] = useState(false);

    return (
        <div className="flex items-center gap-2 shrink-0">
            {/* Observación inline */}
            {showObs && (
                <Input
                    autoFocus
                    value={state?.observation || ''}
                    onChange={e => onObservation(checkKey, e.target.value)}
                    onBlur={() => setShowObs(false)}
                    placeholder="Observación..."
                    className="h-7 w-40 bg-black border-white/10 text-[10px] font-bold placeholder:text-muted-foreground/40"
                    onClick={e => e.stopPropagation()}
                />
            )}
            {state?.observation && !showObs && (
                <span
                    className="text-[9px] text-amber-400 font-bold max-w-20 truncate cursor-pointer"
                    onClick={e => { e.stopPropagation(); setShowObs(true); }}
                    title={state.observation}
                >
                    {state.observation}
                </span>
            )}

            <button
                onClick={e => { e.stopPropagation(); setShowObs(v => !v); }}
                className="text-muted-foreground/40 hover:text-amber-400 transition-colors text-[9px] font-black uppercase"
                title="Agregar observación"
            >
                obs
            </button>

            <button
                onClick={e => {
                    e.stopPropagation();
                    onCheck(checkKey, state?.passed === true ? null : true);
                }}
                className={cn(
                    "p-1.5 rounded-lg transition-all",
                    state?.passed === true
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "text-muted-foreground/30 hover:text-emerald-400 hover:bg-emerald-500/10"
                )}
                title="Aprobado"
            >
                <CheckCircle2 className="h-4 w-4" />
            </button>

            <button
                onClick={e => {
                    e.stopPropagation();
                    onCheck(checkKey, state?.passed === false ? null : false);
                }}
                className={cn(
                    "p-1.5 rounded-lg transition-all",
                    state?.passed === false
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "text-muted-foreground/30 hover:text-red-400 hover:bg-red-500/10"
                )}
                title="Rechazado"
            >
                <XCircle className="h-4 w-4" />
            </button>
        </div>
    );
}
