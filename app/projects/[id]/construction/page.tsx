"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { ConstructionItem, Supply, Level } from '../../../../types/types';
import {
    getProjectById,
    updateProjectItem,
    removeProjectItem,
    addProjectItem,
    updateProject as updateProjectAction,
    customizeProjectItem,
    createProjectChangeOrder,
    batchUpdateProjectItemProgress,
    getConstructionItems,
    getSupplies,
    getProjectSiteLogs,
    consolidateProjectSchedule
} from '@/actions';
import { calculateAPU } from '@/lib/apu-utils';
import { useAuth } from '../../../../hooks/use-auth';
import {
    Calculator,
    Coins,
    Activity,
    Search,
    Plus,
    MoreVertical,
    Eye,
    TrendingUp,
    Info,
    Loader2,
    Save,
    CalendarDays,
    Trash2,
    X,
    Package,
    Users as UsersIcon,
    ClipboardCheck,
    Wrench,
    FileText,
    PlusCircle,
    CheckCircle2,
    FileSignature,
    Layers,
    Calendar,
    Printer,
    Clock,
    Check,
    AlertTriangle,
    History,
    ZoomIn,
    ZoomOut,
    Boxes
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../../components/ui/dropdown-menu';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../../../../components/ui/accordion";
import { Button } from '../../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '../../../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../../components/ui/select";
import { Badge } from '../../../../components/ui/badge';
import { Separator } from '../../../../components/ui/separator';
import { Label } from '../../../../components/ui/label';
import { Checkbox } from '../../../../components/ui/checkbox';
import { useToast } from '../../../../hooks/use-toast';
import { ScrollArea, ScrollBar } from '../../../../components/ui/scroll-area';
import { cn } from '../../../../lib/utils';
import { Textarea } from '../../../../components/ui/textarea';
import { Progress } from '../../../../components/ui/progress';
import { eachDayOfInterval, format, addDays, differenceInDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    GanttProvider,
    GanttSidebar,
    GanttSidebarGroup,
    GanttTimeline,
    GanttHeader,
    GanttFeatureList,
    GanttFeatureRow,
    GanttToday,
    GanttFeature,
    Range
} from '../../../../components/kibo-ui/gantt';

interface ComputationRow {
    id: string;
    chapter: string;
    desc: string;
    unit: string;
    values: number[];
    total: number;
    unitPrice: number;
    supplies?: any[];
    progress?: number;
    qualityControls?: any[];
    performance: number;
    extraDays: number;
    ganttStatus: string;
    predecessorId?: string | null;
    startDate?: Date | null;
    consolidatedStartDate?: Date | null;
    consolidatedDays?: number | null;
}
interface ItemSupply {
    id: string;
    description: string;
    unit: string;
    price: number;
    quantity: number;
    subtotal: number;
    typology: string;
    isNew?: boolean;
}


export default function ConstructionPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [project, setProject] = useState<any | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    type ConstructionItemWithLocalProject = ConstructionItem & { localProjectTitle?: string | null };
    // Execution Technical Detail Modal
    const [isExecutionItemDetailOpen, setIsExecutionItemDetailOpen] = useState(false);
    const [selectedExecutionItem, setSelectedExecutionItem] = useState<any>(null);

    const [isAddComputoOpen, setIsAddComputoOpen] = useState(false);
    const [isChangeOrderOpen, setIsChangeOrderOpen] = useState(false);
    const [isAvanceModalOpen, setIsAvanceModalOpen] = useState(false);
    const [isLibroModalOpen, setIsLibroModalOpen] = useState(false);
    const [isPlanillaModalOpen, setIsPlanillaModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isPayrollHistoryModalOpen, setIsPayrollHistoryModalOpen] = useState(false);
    const [changeOrderReason, setChangeOrderReason] = useState('');
    const [computations, setComputations] = useState<ComputationRow[]>([]);

    const [searchTermComputo, setSearchTermComputo] = useState('');
    const [searchTermPresupuesto, setSearchTermPresupuesto] = useState('');
    const [searchTermEjecucion, setSearchTermEjecucion] = useState('');
    const [librarySearchTerm, setLibrarySearchTerm] = useState('');
    const [selectedLibraryItems, setSelectedLibraryItems] = useState<string[]>([]);
    const [isEditingAPU, setIsEditingAPU] = useState(false);

    // Local APU Customization State
    const [isLocalAPUEditorOpen, setIsLocalAPUEditorOpen] = useState(false);
    const [localAPUEditingItem, setLocalAPUEditingItem] = useState<any>(null);
    const [localAPUSupplies, setLocalAPUSupplies] = useState<any[]>([]);
    const [isLocalSupplyLibraryOpen, setIsLocalSupplyLibraryOpen] = useState(false);
    const [localSupplySearchTerm, setLocalSupplySearchTerm] = useState('');

    const [libraryItems, setLibraryItems] = useState<ConstructionItem[]>([]);
    const [masterSupplies, setMasterSupplies] = useState<Supply[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('computo');
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Progress History State
    const [siteLogs, setSiteLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    // Gantt State
    const [ganttRange, setGanttRange] = useState<Range>("monthly");
    const [ganttZoom, setGanttZoom] = useState(100);
    const [hasPendingGanttMoves, setHasPendingGanttMoves] = useState(false);
    const [ganttSidebarEdits, setGanttSidebarEdits] = useState<Record<string, { ganttStatus?: string; extraDays?: number; predecessorId?: string | null }>>({});

    // Permissions check
    const isAuthor = useMemo(() => user?.id === project?.authorId, [user?.id, project?.authorId]);

    // Avance State (Batch mode with level details)
    const [batchLevelProgress, setBatchLevelProgress] = useState<Record<string, Record<string, string>>>({});

    // Gantt Item Edit State
    const [editStatus, setEditStatus] = useState<string>('');
    const [editExtraDays, setEditExtraDays] = useState<number>(0);
    const [editPerformance, setEditPerformance] = useState<number>(0);
    const [editPredecessorId, setEditPredecessorId] = useState<string | null>(null);

    const STATUS_OPTIONS = [
        { id: 'no iniciado', name: 'No Iniciado' },
        { id: 'iniciado', name: 'Iniciado' },
        { id: 'atrasado', name: 'Atrasado' },
        { id: 'riesgo', name: 'Riesgo' },
        { id: 'terminado', name: 'Terminado' },
        { id: 'verificado', name: 'Verificado' }
    ];

    const [selectedSupplies, setSelectedSupplies] = useState<ItemSupply[]>([]);
    const [selectedSuppliesSearchTerm, setSelectedSuppliesSearchTerm] = useState('');

    const STATUS_COLORS: Record<string, string> = {
        'no iniciado': '#94a3b8', // slate-400
        'iniciado': '#3b82f6',    // blue-500
        'atrasado': '#ef4444',    // red-500
        'riesgo': '#f59e0b',      // amber-500
        'terminado': '#10b981',   // emerald-500
        'verificado': '#8b5cf6'   // violet-500
    };

    const budgetTotals = useMemo(() => {
        const totals = {
            totalMateriales: 0,
            totalManoObra: 0,
            totalCargasSociales: 0,
            totalIVA: 0,
            totalEquipo: 0,
            totalDesgaste: 0,
            totalGastosAdmin: 0,
            totalUtilidades: 0,
            totalIT: 0,
            totalGeneral: 0,
            totalAvance: 0
        };

        if (!project?.config || !computations) {
            return totals;
        }

        for (const item of computations) {
            const quantity = item.total;
            if (quantity === 0) continue;

            const { matSub, labSub, cSociales, ivaMO, equSub, toolWear, adm, utility, it, totalUnit } = calculateAPU(item.supplies || [], project.config);

            totals.totalMateriales += matSub * quantity;
            totals.totalManoObra += labSub * quantity;
            totals.totalCargasSociales += cSociales * quantity;
            totals.totalIVA += ivaMO * quantity;
            totals.totalEquipo += equSub * quantity;
            totals.totalDesgaste += toolWear * quantity;
            totals.totalGastosAdmin += adm * quantity;
            totals.totalUtilidades += utility * quantity;
            totals.totalIT += it * quantity;
            totals.totalGeneral += totalUnit * quantity;
            totals.totalAvance += totalUnit * (item.progress || 0);
        }

        return totals;
    }, [project, computations]);

    const executionItems = useMemo(() => {
        return computations.map(row => {
            const progress = row.progress || 0;
            const balance = row.total - progress;
            const percentage = row.total > 0 ? (progress / row.total) * 100 : 0;
            const financialProgress = progress * row.unitPrice;
            return {
                ...row,
                progress,
                balance,
                percentage,
                financialProgress
            };
        });
    }, [computations]);




    const ganttFeatures = useMemo((): GanttFeature[] => {
        if (!project || computations.length === 0) return [];
        const projectStart = project.startDate ? new Date(project.startDate) : new Date();
        const workingDays = project.config?.workingDaysSelection || [1, 2, 3, 4, 5, 6];

        const getDuration = (row: any) => {
            const baseDuration = Math.ceil(row.performance > 0 ? (row.total * row.performance) / 8 : 1);
            return Math.max(1, baseDuration + (row.extraDays || 0));
        };

        const addWorkingDaysHelper = (startDate: Date, duration: number) => {
            let date = new Date(startDate);
            // If start date is not a working day, move to next working day
            while (!workingDays.includes(date.getDay())) {
                date = addDays(date, 1);
            }
            let daysAdded = 0;
            while (daysAdded < duration) {
                date = addDays(date, 1);
                if (workingDays.includes(date.getDay())) {
                    daysAdded++;
                }
            }
            return date;
        };

        const featureMap = new Map<string, { startAt: Date, endAt: Date }>();
        let defaultOffset = 0;

        const calculateDates = (row: any, visited = new Set<string>()): { startAt: Date, endAt: Date } => {
            if (featureMap.has(row.id)) return featureMap.get(row.id)!;

            if (visited.has(row.id)) {
                const duration = getDuration(row);
                const startAt = addWorkingDaysHelper(projectStart, defaultOffset);
                const endAt = addWorkingDaysHelper(startAt, duration);
                return { startAt, endAt };
            }
            visited.add(row.id);

            let startAt: Date;
            if (row.predecessorId) {
                const predecessor = computations.find((c: any) => c.id === row.predecessorId);
                if (predecessor) {
                    const predDates = calculateDates(predecessor, visited);
                    startAt = new Date(predDates.endAt); // Finish-to-Start relation
                } else {
                    startAt = row.startDate ? new Date(row.startDate) : addWorkingDaysHelper(projectStart, defaultOffset);
                }
            } else if (row.startDate) {
                // Custom date saved via drag-and-drop
                startAt = new Date(row.startDate);
            } else {
                startAt = addWorkingDaysHelper(projectStart, defaultOffset);
            }

            // Ensure startAt is a working day
            while (!workingDays.includes(startAt.getDay())) {
                startAt = addDays(startAt, 1);
            }

            const duration = getDuration(row);
            const endAt = addWorkingDaysHelper(startAt, duration);

            if (!row.predecessorId) {
                defaultOffset += Math.ceil(duration / 2); // Default overlap for non-dependent tasks
            }

            const dates = { startAt, endAt };
            featureMap.set(row.id, dates);
            return dates;
        };

        return computations.map((row: any) => {
            const { startAt, endAt } = calculateDates(row);
            const statusKey = row.ganttStatus || 'no iniciado';
            const statusColor = STATUS_COLORS[statusKey] || '#3b82f6';
            const deps = row.predecessorId ? [row.predecessorId] : [];

            return {
                id: row.id,
                name: row.desc,
                startAt,
                endAt,
                progress: row.total > 0 ? ((row.progress || 0) / row.total) * 100 : 0,
                dependencies: deps,
                status: {
                    id: statusKey,
                    name: statusKey.charAt(0).toUpperCase() + statusKey.slice(1),
                    color: statusColor
                },
                baselineStartAt: row.consolidatedStartDate ? new Date(row.consolidatedStartDate) : undefined,
                baselineEndAt: row.consolidatedStartDate && row.consolidatedDays
                    ? addWorkingDaysHelper(new Date(row.consolidatedStartDate), row.consolidatedDays)
                    : undefined
            };
        });
    }, [project, computations]);

    const totalProjectDelay = useMemo(() => {
        if (!project?.consolidatedAt || ganttFeatures.length === 0) return 0;
        const currentMax = Math.max(...ganttFeatures.map(f => f.endAt.getTime()));
        const baselineFeatures = ganttFeatures.filter(f => f.baselineEndAt);
        if (baselineFeatures.length === 0) return 0;
        const baselineMax = Math.max(...baselineFeatures.map(f => f.baselineEndAt!.getTime()));
        const diff = currentMax - baselineMax;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    }, [ganttFeatures, project?.consolidatedAt]);

    const apuCalculations = useMemo(() => {
        if (!selectedItem || !project?.config) return null;

        const supplies = selectedItem.supplies || selectedItem.item?.supplies || [];
        const config = project.config;

        const { matSub, labSub, cSociales, ivaMO, equSub, toolWear, directCost, adm, utility, it, totalUnit } = calculateAPU(supplies, config);

        return {
            matSub, labSub, cSociales, ivaMO, equSub, toolWear, directCost, adm, utility, it, totalUnit,
            supplies: supplies.map((s: any) => ({
                description: s.supply?.description || s.description,
                unit: s.supply?.unit || s.unit,
                quantity: s.quantity,
                price: s.supply?.price || s.price || 0,
                subtotal: s.quantity * (s.supply?.price || s.price || 0),
                typology: s.supply?.typology || s.typology
            }))
        };
    }, [selectedItem, project]);

    const fetchProjectData = useCallback(async () => {
        const id = params?.id;
        const cleanId = Array.isArray(id) ? id[0] : id;

        if (!cleanId || cleanId === 'undefined') return;

        setIsLoading(true);
        try {
            const [found] = await Promise.all([
                getProjectById(cleanId as string),
            ]);
            if (found) {
                setProject(found as any);

                const projectLevels = (found.levels as any[]) || [];
                const projectItems = (found.items as any[]) || [];
                const config = found.config || {};

                const initialComputations = projectItems.map(pi => {
                    const levelQuantities = pi.levelQuantities || [];
                    const values = projectLevels.map((lvl: any) => {
                        const lq = levelQuantities.find((q: any) => q.levelId === lvl.id);
                        return lq ? Number(lq.quantity) : 0;
                    });

                    const supplies = pi.item?.supplies || [];
                    const apu = calculateAPU(supplies, config);

                    return {
                        id: pi.item.id,
                        chapter: pi.item.chapter,
                        desc: pi.item.description,
                        unit: pi.item.unit,
                        values: values,
                        total: Number(pi.quantity) || 0,
                        unitPrice: apu.totalUnit,
                        supplies: pi.item.supplies || [],
                        progress: Number(pi.progress) || 0,
                        qualityControls: pi.item.qualityControls || [],
                        performance: pi.performance || pi.item.performance || 1,
                        extraDays: pi.extraDays || 0,
                        ganttStatus: pi.ganttStatus || "no iniciado",
                        predecessorId: pi.predecessor?.itemId || null,
                        startDate: pi.startDate ? new Date(pi.startDate) : null,
                        consolidatedStartDate: pi.consolidatedStartDate ? new Date(pi.consolidatedStartDate) : null,
                        consolidatedDays: pi.consolidatedDays || null
                    };
                });
                setComputations(initialComputations);
            }
        } catch (error) {
            console.error("Error loading project:", error);
        } finally {
            setIsLoading(false);
        }
    }, [params?.id]);

    const fetchLibraryItems = useCallback(async () => {
        if (!user?.id) return;
        setIsLoadingLibrary(true);
        try {
            const res = await getConstructionItems(user.id);
            if (res.success && res.items) {
                setLibraryItems(res.items as unknown as ConstructionItem[]);
            } else {
                setLibraryItems([]);
            }
        } catch (error) {
            console.error("Error loading library items:", error);
        } finally {
            setIsLoadingLibrary(false);
        }
    }, [user?.id]);

    const fetchMasterSupplies = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await getSupplies(user.id);
            if (res.success && res.supplies) {
                setMasterSupplies(res.supplies as any);
            } else {
                setMasterSupplies([]);
            }
        } catch (e) {
            console.error(e);
        }
    }, [user?.id]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            fetchProjectData();
        }
    }, [isMounted, fetchProjectData]);

    const filteredLibraryItems = useMemo(() => {
        return libraryItems.filter(item =>
            item.description.toLowerCase().includes(librarySearchTerm.toLowerCase()) ||
            item.chapter.toLowerCase().includes(librarySearchTerm.toLowerCase())
        );
    }, [libraryItems, librarySearchTerm]);

    useEffect(() => {
        if (isAddComputoOpen && libraryItems.length === 0) {
            fetchLibraryItems();
        }
    }, [isAddComputoOpen, libraryItems.length, fetchLibraryItems]);

    useEffect(() => {
        if ((isEditingAPU || isLocalAPUEditorOpen) && masterSupplies.length === 0) {
            fetchMasterSupplies();
        }
    }, [isEditingAPU, isLocalAPUEditorOpen, masterSupplies.length, fetchMasterSupplies]);

    const fetchLogs = useCallback(async () => {
        if (!project?.id) return;
        setIsLoadingLogs(true);
        try {
            const res = await getProjectSiteLogs(project.id);
            if (res.success) {
                setSiteLogs(res.logs || []);
            }
        } catch (error) {
            console.error("Error loading logs:", error);
        } finally {
            setIsLoadingLogs(false);
        }
    }, [project?.id]);

    useEffect(() => {
        if (isHistoryModalOpen) {
            fetchLogs();
        }
    }, [isHistoryModalOpen, fetchLogs]);

    const handlePrintHistory = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Historial de Avance - ${project.title}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
                        .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 12px; }
                        th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
                        .footer { margin-top: 30px; text-align: right; font-size: 10px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">Historial de Avance Físico</div>
                        <p>Proyecto: ${project.title}</p>
                        <p>Fecha de Reporte: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Descripción del Avance</th>
                                <th>Responsable</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${siteLogs.map(log => `
                                <tr>
                                    <td>${format(new Date(log.date), 'dd/MM/yyyy HH:mm')}</td>
                                    <td>${log.content}</td>
                                    <td>${log.author}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">
                        Generado automáticamente por el Sistema BIMUS
                    </div>
                    <script>
                        window.onload = () => { window.print(); window.close(); };
                    </script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleViewDetail = (item: any) => {
        setSelectedItem(item);
        setIsDetailOpen(true);
    };

    const handleViewExecutionDetail = (feature: GanttFeature) => {
        const computation = computations.find(c => c.id === feature.id);
        if (computation) {
            setSelectedExecutionItem({
                ...computation,
                gantt: feature
            });
            setEditStatus(computation.ganttStatus || 'no iniciado');
            setEditExtraDays(computation.extraDays || 0);
            setEditPerformance(computation.performance || 1);
            setEditPredecessorId(computation.predecessorId || null);
            setIsExecutionItemDetailOpen(true);
        }
    };

    const handleSaveGanttChanges = async () => {
        if (!project || !selectedExecutionItem) return;

        setIsSaving(true);
        try {
            const result = await updateProjectItem(project.id, selectedExecutionItem.id, {
                performance: editPerformance,
                extraDays: editExtraDays,
                ganttStatus: editStatus,
                predecessorId: editPredecessorId
            });

            if (result && result.success) {
                toast({
                    title: "Cronograma actualizado",
                    description: "Los cambios se han guardado exitosamente.",
                });
                await fetchProjectData();
                setIsExecutionItemDetailOpen(false);
            } else {
                throw new Error("error" in result ? (result.error as string) : "Fallo al guardar");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleMoveGanttItem = (itemId: string, newStartAt: Date, newEndAt: Date | null) => {
        const targetRow = computations.find((c: any) => c.id === itemId);
        if (targetRow && (targetRow as any).predecessorId) return;

        // Update local state only — no DB call yet
        setComputations(prev => prev.map((row: any) =>
            row.id === itemId ? { ...row, startDate: newStartAt } : row
        ));
        setHasPendingGanttMoves(true);
    };

    const handleSaveGanttTabChanges = async () => {
        if (!project || (!hasPendingGanttMoves && Object.keys(ganttSidebarEdits).length === 0)) return;

        setIsSaving(true);
        try {
            // 1. Save Layout (Start Dates) - only if there are pending moves
            if (hasPendingGanttMoves) {
                const pendingRows = computations.filter((row: any) => row.startDate != null && !row.predecessorId);
                for (const row of pendingRows) {
                    await updateProjectItem(project.id, row.id, { startDate: (row as any).startDate });
                }
            }

            // 2. Save Sidebar Edits (Status, Extra Days, Predecessors)
            for (const [itemId, edits] of Object.entries(ganttSidebarEdits)) {
                await updateProjectItem(project.id, itemId, {
                    ...(edits.ganttStatus !== undefined && { ganttStatus: edits.ganttStatus }),
                    ...(edits.extraDays !== undefined && { extraDays: edits.extraDays }),
                    ...(edits.predecessorId !== undefined && { predecessorId: edits.predecessorId }),
                });
            }

            toast({
                title: "Cronograma actualizado",
                description: "Todos los cambios se han guardado exitosamente."
            });

            setHasPendingGanttMoves(false);
            setGanttSidebarEdits({});
            await fetchProjectData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };


    const handleValueChange = (rowIndex: number, levelIndex: number, newValue: string) => {
        const val = parseFloat(newValue) || 0;
        setComputations(prev => {
            const updated = [...prev];
            const newValues = [...updated[rowIndex].values];
            newValues[levelIndex] = val;
            updated[rowIndex] = {
                ...updated[rowIndex],
                values: newValues,
                total: newValues.reduce((acc, curr) => acc + curr, 0)
            };
            return updated;
        });
    };

    const handleSaveComputos = async () => {
        if (!project || !project.levels) return;
        setIsSaving(true);
        try {
            const projectLevels = project.levels;
            for (const row of computations) {
                const levelData = row.values.map((val, idx) => ({
                    levelId: projectLevels[idx].id,
                    quantity: val
                }));

                const result = await updateProjectItem(project.id, row.id, {
                    quantity: row.total,
                    levelQuantities: levelData
                });
                if (result && (result as any).error) throw new Error((result as any).error);
            }
            toast({
                title: "Cómputos guardados",
                description: "Las cantidades han sido actualizadas exitosamente.",
            });
            await fetchProjectData();
        } catch (error: any) {
            console.error("Error saving computations:", error);
            toast({
                title: "Error al guardar",
                description: error.message || "No se pudieron actualizar todas las cantidades.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleConsolidate = async () => {
        if (!project || !isAuthor) return;
        if (!confirm('¿Desea CONSOLIDAR los cómputos métricos? Esta acción bloqueará la edición para los colaboradores técnicos y marcará el presupuesto como final.')) return;

        setIsSaving(true);
        try {
            // 1. Update Project Status (Locks Computations)
            const result = await updateProjectAction(project.id, { status: 'construccion' });

            // 2. Consolidate Schedule Baseline (Frees Gantt dates)
            const scheduleRes = await consolidateProjectSchedule(project.id);

            if (result && result.success && scheduleRes.success) {
                toast({
                    title: "Proyecto Consolidado",
                    description: "Los cómputos han sido bloqueados y la línea base del cronograma ha sido establecida."
                });
                await fetchProjectData();
            } else {
                if (!scheduleRes.success) throw new Error(scheduleRes.error || "Fallo al consolidar el cronograma.");
                throw new Error("Fallo al actualizar el estado del proyecto.");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredSelectedSupplies = useMemo(() => {
        return selectedSupplies.filter(s =>
            s.description.toLowerCase().includes(selectedSuppliesSearchTerm.toLowerCase()) ||
            s.typology.toLowerCase().includes(selectedSuppliesSearchTerm.toLowerCase())
        );
    }, [selectedSupplies, selectedSuppliesSearchTerm]);

    const summary = useMemo(() => {
        const mat = selectedSupplies.filter(s => s.typology === 'Material' || s.typology === 'Insumo').reduce((a, b) => a + b.subtotal, 0);
        const lab = selectedSupplies.filter(s => s.typology === 'Mano de Obra' || s.typology === 'Honorario').reduce((a, b) => a + b.subtotal, 0);
        const equ = selectedSupplies.filter(s => s.typology === 'Equipo' || s.typology === 'Herramienta').reduce((a, b) => a + b.subtotal, 0);

        const directCost = mat + lab + equ;
        const totalApu = directCost;

        return { mat, lab, equ, directCost, totalApu };
    }, [selectedSupplies]);

    const handleAddSupply = (supply: Supply) => {
        const exists = selectedSupplies.find(s => s.id === supply.id);
        if (exists) {
            toast({ title: "Ya agregado", description: "El insumo ya está en la lista." });
            return;
        }

        setSelectedSupplies(prev => [...prev, {
            id: supply.id,
            description: supply.description,
            unit: supply.unit,
            price: supply.price,
            quantity: 1,
            subtotal: supply.price,
            typology: supply.typology
        }]);
    };

    const handleProcessChangeOrder = async () => {
        if (!project || !changeOrderReason.trim()) {
            toast({ title: "Error", description: "Debe ingresar el motivo de la orden.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const levelIds = project.levels.map((l: any) => l.id);
            const dataToProcess = computations.map(row => ({
                id: row.id,
                total: row.total,
                values: row.values,
                levelIds: levelIds
            }));

            const result = await createProjectChangeOrder(project.id, changeOrderReason, dataToProcess);
            if (result && result.success) {
                toast({ title: "Orden de Cambio Ejecutada", description: "Se ha registrado el respaldo en la bitácora." });
                setIsChangeOrderOpen(false);
                setChangeOrderReason('');
                fetchProjectData();
            } else {
                throw new Error((result as any).error);
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrintQuality = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Protocolo de Calidad - ${selectedItem.description}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
                        .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
                        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                        .section { margin-bottom: 20px; }
                        .main-point { font-weight: bold; background: #f0f0f0; padding: 8px; margin-top: 15px; border: 1px solid #ccc; }
                        .sub-point { padding: 8px 8px 8px 40px; border-bottom: 1px solid #eee; display: flex; align-items: center; }
                        .checkbox { width: 15px; height: 15px; border: 1px solid #000; margin-right: 10px; }
                        .footer { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 100px; text-align: center; }
                        .signature { border-top: 1px solid #000; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">Protocolo de Control de Calidad</div>
                        <p>Documento de verificación y liberación de partida</p>
                    </div>
                    <div class="info">
                        <div><strong>Item:</strong> ${selectedItem.description}</div>
                        <div><strong>Capítulo:</strong> ${selectedItem.chapter}</div>
                        <div><strong>Unidad:</strong> ${selectedItem.unit}</div>
                        <div><strong>Fecha:</strong> _________________</div>
                    </div>
                    <div class="section">
                        ${selectedItem.qualityControls.map((qc: { description: any; subPoints: any[]; }) => `
                            <div class="main-point">${qc.description}</div>
                            ${qc.subPoints.map((sp: any) => `
                                <div class="sub-point">
                                    <div class="checkbox"></div>
                                    <div>${sp.description}</div>
                                </div>
                            `).join('')}
                        `).join('')}
                    </div>
                    <div class="footer">
                        <div class="signature">Firma Responsable de Obra</div>
                        <div class="signature">Firma Supervisión / Cliente</div>
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handlePrintComputos = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const levels = project.levels || [];

        const headerCells = levels.map((l: any) => `<th style="border: 1px solid #ddd; padding: 8px; font-size: 9px; text-transform: uppercase;">${l.name}</th>`).join('');

        const rows = computations.map((row) => {
            const levelCells = row.values.map(val => `<td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center; font-family: monospace;">${val > 0 ? val.toFixed(2) : '-'}</td>`).join('');
            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 9px; font-family: monospace;">${row.id.slice(-6).toUpperCase()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; font-weight: bold;">${row.desc}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${row.unit}</td>
                    ${levelCells}
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: 900; background: #f9f9f9;">${row.total.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <html>
                <head>
                    <title>Cómputos Métricos - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #333; line-height: 1.4; }
                        .report-header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .brand { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        .report-title { font-size: 12px; font-weight: 900; text-transform: uppercase; margin: 0; color: #666; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 10px 8px; text-align: left; font-size: 9px; font-weight: 900; text-transform: uppercase; }
                        .project-info { margin-bottom: 20px; font-size: 11px; }
                        @media print { body { padding: 0; } @page { size: landscape; margin: 1cm; } }
                    </style>
                </head>
                <body>
                    <div class="report-header">
                        <div>
                            <h1 class="brand">BIMUS</h1>
                            <p style="font-size: 8px; font-weight: bold; margin: 0; letter-spacing: 1px;">ARQUITECTURA Y CONSTRUCCIÓN</p>
                        </div>
                        <div style="text-align: right;">
                            <h2 class="report-title">PLANILLA DE CÓMPUTOS MÉTRICOS</h2>
                            <p style="font-size: 9px; margin: 0;">FECHA: ${new Date().toLocaleDateString('es-ES')}</p>
                        </div>
                    </div>
                    <div class="project-info">
                        <strong>PROYECTO:</strong> ${project.title}<br>
                        <strong>UBICACIÓN:</strong> ${project.location || 'N/A'}<br>
                        <strong>CLIENTE:</strong> ${project.client || 'N/A'}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Descripción de Partida</th>
                                <th>Und.</th>
                                ${headerCells}
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handlePrintPresupuesto = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const exchangeRate = project.config?.exchangeRate || 1;
        const mainCurr = project.config?.mainCurrency || 'BS';
        const secCurr = project.config?.secondaryCurrency || 'USD';

        const rows = budgetItems.map((row) => {
            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 9px; font-family: monospace;">${row.id.slice(-6).toUpperCase()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">${row.desc}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${row.unit}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">${row.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">${row.qty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: 900;">${row.totalRow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; color: #666;">${row.totalRowSec.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <html>
                <head>
                    <title>Presupuesto General - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .brand { font-size: 32px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: -1px; }
                        .report-title { font-size: 14px; font-weight: 900; text-transform: uppercase; margin: 0; color: #444; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; }
                        .summary-totals { margin-top: 40px; border-top: 2px solid #000; padding-top: 20px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
                        .total-line { display: flex; gap: 30px; align-items: baseline; }
                        .total-label { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #666; }
                        .total-value { font-size: 24px; font-weight: 900; color: #000; }
                        .sec-total { font-size: 16px; font-weight: 700; color: #888; }
                        @media print { body { padding: 0; } @page { margin: 1.5cm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1 class="brand">BIMUS</h1>
                            <p style="font-size: 10px; font-weight: bold; margin: 0; letter-spacing: 2px;">ARQUITECTURA Y CONSTRUCCIÓN</p>
                        </div>
                        <div style="text-align: right;">
                            <h2 class="report-title">PRESUPUESTO GENERAL DE OBRA</h2>
                            <p style="font-size: 10px; margin: 0;">FECHA: ${new Date().toLocaleDateString('es-ES')}</p>
                        </div>
                    </div>
                    <div style="margin-bottom: 30px; font-size: 12px;">
                        <strong>PROYECTO:</strong> ${project.title.toUpperCase()}<br>
                        <strong>CLIENTE:</strong> ${project.client?.toUpperCase() || 'N/A'}<br>
                        <strong>UBICACIÓN:</strong> ${project.location?.toUpperCase() || 'N/A'}<br>
                        <strong>ÁREA:</strong> ${project.area ? project.area.toLocaleString() : '-'} M²
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Descripción de Partida</th>
                                <th>Und.</th>
                                <th style="text-align: right;">P. Unit.</th>
                                <th style="text-align: right;">Cant.</th>
                                <th style="text-align: right;">Total (${mainCurr})</th>
                                <th style="text-align: right;">Total (${secCurr})</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div class="summary-totals">
                        <div class="total-line">
                            <span class="total-label">Presupuesto Total (${mainCurr})</span>
                            <span class="total-value">${budgetTotals.totalGeneral.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div class="total-line">
                            <span class="total-label">Equivalente (${secCurr})</span>
                            <span class="sec-total">${(budgetTotals.totalGeneral / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                    <div style="margin-top: 100px; display: flex; justify-content: space-around;">
                        <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA RESPONSABLE DE OBRA</div>
                        <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA SUPERVISIÓN / CLIENTE</div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleExportExcel = () => {
        if (!project || budgetItems.length === 0) return;

        const mainCurr = project.config?.mainCurrency || 'BS';
        const secCurr = project.config?.secondaryCurrency || 'USD';

        // CSV Header
        const headers = [
            "ID",
            "CAPITULO",
            "DESCRIPCION",
            "UNIDAD",
            "PRECIO UNITARIO",
            "CANTIDAD",
            `TOTAL (${mainCurr})`,
            `TOTAL (${secCurr})`
        ];

        // CSV Data rows
        const rows = budgetItems.map(item => [
            item.id.slice(-6).toUpperCase(),
            item.chapter,
            item.desc,
            item.unit,
            item.unitPrice.toFixed(2),
            item.qty.toFixed(2),
            item.totalRow.toFixed(2),
            item.totalRowSec.toFixed(2)
        ]);

        // Footer with totals
        const footer = [
            "", "", "", "", "", "TOTAL GENERAL",
            budgetTotals.totalGeneral.toFixed(2),
            (budgetTotals.totalGeneral / (project.config?.exchangeRate || 1)).toFixed(2)
        ];

        // Build CSV content
        const csvContent = [
            headers.join(";"),
            ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(";")),
            footer.join(";")
        ].join("\n");

        // Add BOM for Excel UTF-8 support
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `PRESUPUESTO_${project.title.toUpperCase().replace(/\s+/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Exportación completada", description: "El presupuesto se ha descargado en formato CSV compatible con Excel." });
    };

    const handlePrintItem = (item: ConstructionItemWithLocalProject) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const supplies = (item.supplies as any[] || []).map(s => ({
            id: s.supplyId,
            description: s.supply?.description || '',
            unit: s.supply?.unit || '',
            price: s.supply?.price || 0,
            quantity: s.quantity || 0,
            subtotal: (s.quantity || 0) * (s.supply?.price || 0),
            typology: s.supply?.typology || 'Material'
        }));

        // Clasificación de Insumos
        const matList = supplies.filter(s => s.typology === 'Material' || s.typology === 'Insumo');
        const labList = supplies.filter(s => s.typology === 'Mano de Obra' || s.typology === 'Honorario');
        const equList = supplies.filter(s => s.typology === 'Equipo' || s.typology === 'Herramienta');

        // Totales Base
        const matSubtotal = matList.reduce((a, b) => a + b.subtotal, 0);
        const labSubtotal = labList.reduce((a, b) => a + b.subtotal, 0);
        const equSubtotal = equList.reduce((a, b) => a + b.subtotal, 0);

        // Cálculos Mano de Obra
        const SOCIAL_CHARGES_PCT = 0.10;
        const IVA_PCT = 0.1494;
        const socialCharges = labSubtotal * SOCIAL_CHARGES_PCT;
        const iva = (labSubtotal + socialCharges) * IVA_PCT;
        const totalLabor = labSubtotal + socialCharges + iva;

        // Cálculos Equipo
        const WEAR_PCT = 0.05;
        const wear = equSubtotal * WEAR_PCT;
        const totalEqu = equSubtotal + wear;

        // Costo Directo Total (Suma de bloques)
        const directCostTotal = matSubtotal + totalLabor + totalEqu;

        // Cálculos Indirectos
        const ADMIN_PCT = 0.10;
        const UTILITY_PCT = 0.07;
        const IT_PCT = 0.03;

        const adminCosts = directCostTotal * ADMIN_PCT;
        const utility = (directCostTotal + adminCosts) * UTILITY_PCT;
        const totalBeforeTaxes = directCostTotal + adminCosts + utility;
        const itTax = totalBeforeTaxes * IT_PCT;
        const totalApuValue = totalBeforeTaxes + itTax;

        const html = `
            <html>
                <head>
                    <title>APU - ${item.description}</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { font-family: 'Arial', sans-serif; padding: 32px; color: #1a1a1a; font-size: 11px; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 20px; }
                        .company { font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
                        .doc-type { text-align: right; }
                        .doc-type h2 { font-size: 14px; font-weight: 900; text-transform: uppercase; }
                        .doc-type p { font-size: 10px; color: #555; margin-top: 2px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0; border: 1px solid #ccc; margin-bottom: 20px; }
                        .info-cell { padding: 10px 12px; border-right: 1px solid #ccc; }
                        .info-cell:last-child { border-right: none; }
                        .info-encabezado { font-size: 14px; font-weight: 900; text-transform: uppercase; color: #666; letter-spacing: 1px; font-bold}
                        .info-encabezado2 { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #666; letter-spacing: 1px; font-bold}
                        .info-cell .label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #666; letter-spacing: 1px; }
                        .info-cell .value { font-size: 14px; font-weight: 700; margin-top: 2px; text-transform: uppercase; }
                        .section-title { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #555; background: #f5f5f5; padding: 6px 12px; border: 1px solid #ccc; border-bottom: none; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th { background: #1a1a1a; color: #fff; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; padding: 7px 10px; text-align: left; }
                        th.right { text-align: right; }
                        th.center { text-align: center; }
                        td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 10px; }
                        td.right { text-align: right; font-family: monospace; }
                        td.center { text-align: center; }
                        tr:nth-child(even) { background: #fafafa; }
                        .type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 8px; font-weight: 900; text-transform: uppercase; }
                        .mat { background: #dbeafe; color: #1e40af; }
                        .lab { background: #d1fae5; color: #065f46; }
                        .equ { background: #fef3c7; color: #92400e; }
                        .summary-table { border: 2px solid #1a1a1a; margin-top: 4px; }
                        .summary-table td { border-bottom: 1px solid #ddd; font-weight: 700; }
                        .summary-total td { background: #1a1a1a; color: #fff; font-size: 13px; font-weight: 900; }
                        .footer { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 60px; }
                        .signature { text-align: center; padding-top: 40px; border-top: 1px solid #1a1a1a; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #555; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="company">BIMUS</div>
                        <div class="doc-type">
                            <h2>Análisis de Precio Unitario</h2>
                            <p>APU - Catálogo Maestro de Construcción</p>
                        </div>
                    </div>
                    <!-- DATOS GENERALES -->
                    <div class="info-encabezado" class="font-bold">DATOS GENERALES</div>
                    <table>
                        <tr><td class="info-encabezado left">PROYECTO:</td><td colspan="5" class="font-bold left">${project?.title || 'GENERAL'}</td></tr>
                        <tr><td class="info-encabezado left">CODIGO:</td><td colspan="5" class="font-bold left">${project?.id?.slice(-6).toUpperCase() || 'N/A'}</td></tr>
                        <tr><td class="info-encabezado left">CAPITULO:</td><td colspan="5" class="font-bold left">${item.chapter || 'N/A'}</td></tr>
                        <tr><td class="info-encabezado left">ACTIVIDAD:</td><td colspan="5" class="font-bold left">${item.description}</td></tr>
                        <tr><td class="info-encabezado left">CANTIDAD:</td><td colspan="5" class="font-bold left">${(item.total || 0).toFixed(2)}</td></tr>
                        <tr><td class="info-encabezado left">UNIDAD:</td><td colspan="5" class="font-bold left">${item.unit}</td></tr>
                        <tr><td class="info-encabezado left">MONEDA:</td><td colspan="5" class="font-bold left">BOLIVIANOS</td></tr>
                    </table>

                    <!-- MATERIALES -->
                    <div class="section-title">MATERIALES</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30px" class="center">N</th>
                                <th>DESCRIPCION</th>
                                <th class="center" style="width: 70px">UNIDAD</th>
                                <th class="center" style="width: 70px">CANTIDAD</th>
                                <th class="center" style="width: 80px">PRECIO</th>
                                <th class="center" style="width: 90px">COSTO</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${matList.length > 0 ? matList.map((s, idx) => `
                                <tr>
                                    <td class="center info-encabezado2">${idx + 1}</td>
                                    <td class="left info-encabezado2">${s.description}</td>
                                    <td class="center info-encabezado2">${s.unit}</td>
                                    <td class="center info-encabezado2">${(s.quantity || 0).toFixed(4)}</td>
                                    <td class="right info-encabezado2">${(s.price || 0).toFixed(2)}</td>
                                    <td class="right info-encabezado2">${(s.subtotal || 0).toFixed(2)}</td>
                                </tr>
                            `).join('') : Array(5).fill('<tr><td style="height: 18px"></td><td></td><td></td><td></td><td></td><td></td></tr>').join('')}
                            <tr class="summary-row">
                                <td colspan="5" class="right font-bold text-[14px]">TOTAL PARCIAL:</td>
                                <td class="right font-bold text-[14px]">${matSubtotal.toFixed(2)}<span class="currency"> Bs.</span></td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- MANO DE OBRA -->
                    <div class="section-title">MANO DE OBRA</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30px" class="center">N</th>
                                <th>DESCRIPCION</th>
                                <th class="center" style="width: 70px">UNIDAD</th>
                                <th class="center" style="width: 70px">CANTIDAD</th>
                                <th class="center" style="width: 80px">PRECIO</th>
                                <th class="center" style="width: 90px">COSTO</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${labList.length > 0 ? labList.map((s, idx) => `
                                <tr>
                                    <td class="center info-encabezado2">${idx + 1}</td>
                                    <td class="left info-encabezado2">${s.description}</td>
                                    <td class="center info-encabezado2">${s.unit}</td>
                                    <td class="center info-encabezado2">${(s.quantity || 0).toFixed(4)}</td>
                                    <td class="right info-encabezado2">${(s.price || 0).toFixed(2)}</td>
                                    <td class="right info-encabezado2">${(s.subtotal || 0).toFixed(2)}</td>
                                </tr>
                            `).join('') : Array(3).fill('<tr><td style="height: 18px"></td><td></td><td></td><td></td><td></td><td></td></tr>').join('')}
                            <tr class="bg-light">
                                <td colspan="5" class="right font-bold">SUBTOTAL PARCIAL:</td>
                                <td class="right font-bold">${labSubtotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="4"></td>
                                <td class="right font-bold bg-light">${(SOCIAL_CHARGES_PCT * 100).toFixed(2)}% CARGAS SOCIALES:</td>
                                <td class="right">${socialCharges.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="4"></td>
                                <td class="right font-bold bg-light">${(IVA_PCT * 100).toFixed(2)}% I.V.A.:</td>
                                <td class="right">${iva.toFixed(2)}</td>
                            </tr>
                            <tr class="summary-row">
                                <td colspan="5" class="right font-bold">TOTAL PARCIAL:</td>
                                <td class="right font-bold">${totalLabor.toFixed(2)}<span class="currency">Bs.</span></td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- EQUIPO -->
                    <div class="section-title">EQUIPO, MAQUINARIA, HERRAMIENTAS</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30px" class="center">N</th>
                                <th>DESCRIPCION</th>
                                <th class="center" style="width: 70px">UNIDAD</th>
                                <th class="center" style="width: 70px">CANTIDAD</th>
                                <th class="center" style="width: 80px">PRECIO</th>
                                <th class="center" style="width: 90px">COSTO</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${equList.length > 0 ? equList.map((s, idx) => `
                                <tr>
                                    <td class="center">${idx + 1}</td>
                                    <td>${s.description}</td>
                                    <td class="center">${s.unit}</td>
                                    <td class="center">${(s.quantity || 0).toFixed(4)}</td>
                                    <td class="right">${(s.price || 0).toFixed(2)}</td>
                                    <td class="right">${(s.subtotal || 0).toFixed(2)}</td>
                                </tr>
                            `).join('') : Array(2).fill('<tr><td style="height: 18px"></td><td></td><td></td><td></td><td></td><td></td></tr>').join('')}
                            <tr class="bg-light">
                                <td colspan="5" class="right font-bold">SUBTOTAL PARCIAL:</td>
                                <td class="right font-bold">${equSubtotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="4"></td>
                                <td class="right font-bold bg-light">${(WEAR_PCT * 100).toFixed(2)}% % DESGASTE:</td>
                                <td class="right">${wear.toFixed(2)}</td>
                            </tr>
                            <tr class="summary-row">
                                <td colspan="5" class="right font-bold">TOTAL PARCIAL:</td>
                                <td class="right font-bold">${totalEqu.toFixed(2)}<span class="currency">Bs.</span></td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- GASTOS GENERALES -->
                    <div class="section-title">GASTOS GENERALES Y ADMINISTRATIVOS</div>
                    <table>
                        <tr class="summary-row">
                            <td colspan="5" class="right font-bold" style="width: 80%">${(ADMIN_PCT * 100).toFixed(2)}% TOTAL PARCIAL:</td>
                            <td class="right font-bold">${adminCosts.toFixed(2)}<span class="currency">Bs.</span></td>
                        </tr>
                    </table>

                    <!-- UTILIDAD -->
                    <div class="section-title">UTILIDAD</div>
                    <table>
                        <tr class="summary-row">
                            <td colspan="5" class="right font-bold" style="width: 80%">${(UTILITY_PCT * 100).toFixed(2)}% TOTAL PARCIAL:</td>
                            <td class="right font-bold">${utility.toFixed(2)}<span class="currency">Bs.</span></td>
                        </tr>
                    </table>

                    <!-- IMPUESTOS -->
                    <div class="section-title">IMPUESTOS</div>
                    <table>
                        <tr>
                            <td colspan="4"></td>
                            <td class="right font-bold bg-light" style="width: 300px">${(IT_PCT * 100).toFixed(2)}% I.T. TOTAL PARCIAL:</td>
                            <td class="right">${itTax.toFixed(2)}<span class="currency">Bs.</span></td>
                        </tr>
                        <tr class="main-total">
                            <td colspan="5" class="right font-bold">TOTAL P.U.:</td>
                            <td class="right font-bold">${totalApuValue.toFixed(2)}<span class="currency">Bs.</span></td>
                        </tr>
                        <tr class="main-total">
                            <td colspan="5" class="right font-bold">TOTAL ADOPTADO:</td>
                            <td class="right font-bold">${totalApuValue.toFixed(2)}<span class="currency">Bs.</span></td>
                        </tr>
                    </table>

                    <script>window.print();</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handlePrintEjecucion = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const rows = executionItems.map((row) => {
            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 9px; font-family: monospace;">${row.id.slice(-6).toUpperCase()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">${row.desc}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${row.unit}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">${row.total.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: bold; color: #10b981;">${row.progress.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: bold; color: #f59e0b;">${row.balance.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: 900;">$${row.financialProgress.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${row.percentage.toFixed(1)}%</td>
                </tr>
            `;
        }).join('');

        const html = `
            <html>
                <head>
                    <title>Reporte de Avance - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 30px; }
                        .brand { font-size: 32px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                        .summary { margin-top: 30px; display: flex; justify-content: flex-end; gap: 40px; }
                        .sum-item { text-align: right; }
                        .sum-label { font-size: 10px; font-weight: 900; color: #666; text-transform: uppercase; }
                        .sum-value { font-size: 18px; font-weight: 900; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1 class="brand">BIMUS</h1>
                            <p style="font-size: 10px; font-weight: bold; margin: 0;">ARQUITECTURA Y CONSTRUCCIÓN</p>
                        </div>
                        <div style="text-align: right;">
                            <h2 style="font-size: 14px; font-weight: 900; margin: 0;">CERTIFICACIÓN DE AVANCE FÍSICO</h2>
                            <p style="font-size: 10px; margin: 0;">FECHA: ${new Date().toLocaleDateString('es-ES')}</p>
                        </div>
                    </div>
                    <div style="margin-bottom: 30px; font-size: 12px;">
                        <strong>PROYECTO:</strong> ${project.title.toUpperCase()}<br>
                        <strong>CLIENTE:</strong> ${project.client?.toUpperCase() || 'N/A'}<br>
                        <strong>AVANCE GLOBAL:</strong> ${budgetTotals.totalGeneral > 0 ? ((budgetTotals.totalAvance / budgetTotals.totalGeneral) * 100).toFixed(1) : '0.0'}%
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Descripción Partida</th>
                                <th>Und.</th>
                                <th style="text-align: right;">Cómputo</th>
                                <th style="text-align: right;">Avance</th>
                                <th style="text-align: right;">Saldo</th>
                                <th style="text-align: right;">Val. Ejecutado</th>
                                <th style="text-align: center;">%</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div class="summary">
                        <div class="sum-item">
                            <div class="sum-label">Total Presupuestado</div>
                            <div class="sum-value">$${budgetTotals.totalGeneral.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div class="sum-item">
                            <div class="sum-label">Total Ejecutado</div>
                            <div class="sum-value" style="color: #10b981;">$${budgetTotals.totalAvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handlePrintCronograma = () => {
        if (!project || ganttFeatures.length === 0) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Calculate full range
        const allDates = ganttFeatures.flatMap(f => [f.startAt, f.endAt || f.startAt]);
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

        // Add 2 days padding
        const rangeStart = addDays(minDate, -2);
        const rangeEnd = addDays(maxDate, 5);
        const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
        const totalDays = days.length;
        const dayWidth = 30; // px
        const sidebarWidth = 400; // px
        const itemColWidth = 300; // px
        const durColWidth = 100; // px

        const months: { month: string, days: number }[] = [];
        days.forEach(day => {
            const mLabel = format(day, 'MMMM yyyy', { locale: es }).toUpperCase();
            if (months.length === 0 || months[months.length - 1].month !== mLabel) {
                months.push({ month: mLabel, days: 1 });
            } else {
                months[months.length - 1].days++;
            }
        });

        const headerMonths = months.map(m => `
            <div style="width: ${m.days * dayWidth}px; border-right: 1px solid #ddd; text-align: center; font-size: 10px; font-weight: 900; background: #f8f8f8; padding: 6px 0; border-bottom: 1px solid #ddd;">
                ${m.month}
            </div>
        `).join('');

        const headerDays = days.map(day => `
            <div style="width: ${dayWidth}px; border-right: 1px solid #ddd; text-align: center; font-size: 8px; font-weight: bold; background: white; padding: 4px 0;">
                ${format(day, 'd')}<br>${format(day, 'EE', { locale: es }).charAt(0).toUpperCase()}
            </div>
        `).join('');

        const rows = ganttFeatures.map((f) => {
            const startOffset = differenceInDays(f.startAt, rangeStart) * dayWidth;
            const durationDays = f.endAt ? differenceInDays(f.endAt, f.startAt) + 1 : 1;
            const barWidth = durationDays * dayWidth;
            const color = STATUS_COLORS[f.status.id] || '#3b82f6';

            return `
                <div style="display: flex; border-bottom: 1px solid #eee; min-height: 44px; align-items: center;">
                    <div style="width: ${itemColWidth}px; padding: 8px 15px; border-right: 1px solid #ddd; flex-shrink: 0; background: white; z-index: 10; display: flex; align-items: center;">
                        <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #111; line-height: 1.2;">${f.name}</div>
                    </div>
                    <div style="width: ${durColWidth}px; padding: 8px; border-right: 2px solid #ddd; flex-shrink: 0; background: #fafafa; text-align: center; font-size: 10px; font-weight: 900; color: #444;">
                        ${durationDays} D
                    </div>
                    <div style="position: relative; flex-grow: 1; height: 100%; min-width: ${totalDays * dayWidth}px; background-image: linear-gradient(to right, #f1f1f1 1px, transparent 1px); background-size: ${dayWidth}px 100%;">
                        <div style="
                            position: absolute; 
                            left: ${startOffset}px; 
                            width: ${barWidth}px; 
                            height: 26px; 
                            top: 9px; 
                            background: ${color}; 
                            border-radius: 6px; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            border: 1px solid rgba(0,0,0,0.1);
                        ">
                            <span style="color: white; font-size: 8px; font-weight: 900; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                                ${Math.round(f.progress || 0)}%
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const html = `
            <html>
                <head>
                    <title>CRONOGRAMA GANTT - ${project.title}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                        body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; color: #333; background: #fff; }
                        .print-container { width: fit-content; min-width: 100%; border: 1px solid #ddd; box-shadow: 0 0 20px rgba(0,0,0,0.05); }
                        .header-main { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 25px; padding: 0 10px; }
                        .brand { font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: -1.5px; margin: 0; line-height: 0.8;}
                        .report-type { font-size: 16px; font-weight: 900; color: #111; text-transform: uppercase; margin: 0; }
                        .gantt-header-row { display: flex; border-bottom: 2px solid #111; position: sticky; top: 0; z-index: 20; }
                        .sidebar-header-item { width: ${itemColWidth}px; flex-shrink: 0; border-right: 1px solid #ddd; background: #f1f5f9; display: flex; align-items: center; padding: 0 15px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
                        .sidebar-header-dur { width: ${durColWidth}px; flex-shrink: 0; border-right: 2px solid #ddd; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; text-transform: uppercase; }
                        @media print { 
                            body { padding: 0; } 
                            .print-container { border: none; box-shadow: none; }
                            @page { size: landscape; margin: 0.8cm; }
                            .gantt-header-row { position: static; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header-main">
                        <div>
                            <h1 class="brand">BIMUS</h1>
                            <p style="font-size: 9px; font-weight: bold; margin: 4px 0 0 0; letter-spacing: 3px; color: #111;">ARQUITECTURA Y CONSTRUCCIÓN</p>
                        </div>
                        <div style="text-align: right;">
                            <h2 class="report-type">Cronograma de Obra (Gantt)</h2>
                            <p style="font-size: 10px; margin: 4px 0 0 0; font-weight: 900;">PROYECTO: ${project.title.toUpperCase()}</p>
                            <p style="font-size: 9px; margin: 2px 0 0 0; color: #666; font-weight: bold;">EMITIDO EL: ${new Date().toLocaleDateString('es-ES')}</p>
                        </div>
                    </div>

                    <div class="print-container">
                        <div class="gantt-header-row">
                            <div class="sidebar-header-item">Ítems / Partidas</div>
                            <div class="sidebar-header-dur">Duración</div>
                            <div style="flex-grow: 1; overflow: hidden;">
                                <div style="display: flex;">${headerMonths}</div>
                                <div style="display: flex;">${headerDays}</div>
                            </div>
                        </div>
                        <div class="gantt-body">
                            ${rows}
                        </div>
                    </div>

                    <div style="margin-top: 60px; display: flex; justify-content: space-around; font-family: 'Inter', sans-serif;">
                        <div style="text-align: center; width: 220px; border-top: 2px solid #111; padding-top: 10px; font-size: 10px; font-weight: 900; text-transform: uppercase;">Responsable Técnico</div>
                        <div style="text-align: center; width: 220px; border-top: 2px solid #111; padding-top: 10px; font-size: 10px; font-weight: 900; text-transform: uppercase;">Supervisión de Obra</div>
                    </div>

                    <script>
                        window.onload = function() {
                            setTimeout(() => {
                                window.print();
                                window.onafterprint = function() { window.close(); };
                            }, 800);
                        };
                    </script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleBatchSaveAvance = async () => {
        if (!project) return;

        const errors: string[] = [];
        const itemUpdates = [];

        for (const item of computations) {
            const levelsData = batchLevelProgress[item.id] || {};
            let itemTotalIncrement = 0;
            let detailParts: string[] = [];

            Object.entries(levelsData).forEach(([levelId, qtyStr]) => {
                const qty = parseFloat(qtyStr) || 0;
                if (qty < 0) {
                    errors.push(`La cantidad en "${item.desc}" no puede ser negativa.`);
                }

                const levelIndex = project.levels.findIndex((l: any) => l.id === levelId);
                const computedForLevel = item.values[levelIndex] || 0;

                if (qty > (computedForLevel + 0.001)) {
                    errors.push(`Exceso detectado en "${item.desc}": Ingresó ${qty} pero el cómputo del nivel "${project.levels[levelIndex].name}" es ${computedForLevel}.`);
                }

                if (qty > 0) {
                    itemTotalIncrement += qty;
                    const levelName = project.levels[levelIndex]?.name || 'Nivel';
                    detailParts.push(`${levelName}: ${qty}`);
                }
            });

            const remainingBalance = item.total - (item.progress || 0);
            if (itemTotalIncrement > (remainingBalance + 0.001)) {
                errors.push(`Exceso de ejecución en "${item.desc}": El total ingresado (${itemTotalIncrement}) supera el saldo pendiente (${remainingBalance.toFixed(2)}).`);
            }

            if (itemTotalIncrement > 0 && errors.length === 0) {
                const logDesc = `CERTIFICACIÓN DE AVANCE: Se registró un total de ${itemTotalIncrement} ${item.unit} en la partida "${item.desc}". Detalle por niveles: [${detailParts.join(', ')}].`;
                itemUpdates.push({ itemId: item.id, increment: itemTotalIncrement, log: logDesc });
            }
        }

        if (errors.length > 0) {
            toast({
                title: "Validación de Cómputos",
                description: errors[0],
                variant: "destructive"
            });
            return;
        }

        if (itemUpdates.length === 0) {
            toast({ title: "Sin cambios", description: "Ingrese cantidades de avance para procesar." });
            return;
        }

        setIsSaving(true);
        setBatchLevelProgress({});

        try {
            const result = await batchUpdateProjectItemProgress(project.id, itemUpdates);
            if (result.error) throw new Error(result.error);

            toast({ title: "Avance Registrado", description: "Se ha actualizado la ejecución física de las partidas con éxito." });
            setIsAvanceModalOpen(false);
            await fetchProjectData();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        if (!project || !confirm('¿Estás seguro de que deseas quitar esta partida del proyecto?')) return;

        setIsLoading(true);
        try {
            const result = await removeProjectItem(project.id, itemId);
            if (result && result.success) {
                toast({
                    title: "Partida removida",
                    description: "El ítem ha sido quitado del proyecto.",
                });
                await fetchProjectData();
            } else {
                throw new Error((result as any)?.error || 'Error desconocido');
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "No se pudo remover la partida.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleLibraryItem = (id: string) => {
        setSelectedLibraryItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleAddSelectedItems = async () => {
        if (!project || selectedLibraryItems.length === 0) return;

        setIsSaving(true);
        try {
            for (const itemId of selectedLibraryItems) {
                await addProjectItem(project.id, itemId);
            }

            toast({
                title: "Ítems añadidos",
                description: `${selectedLibraryItems.length} partidas han sido vinculadas al proyecto.`,
            });

            await fetchProjectData();
            setIsAddComputoOpen(false);
            setSelectedLibraryItems([]);
            setLibrarySearchTerm('');
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron añadir los ítems al proyecto.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    // --- LOCAL APU EDITOR LOGIC ---
    const handleOpenLocalAPUEditor = (row: any) => {
        setLocalAPUEditingItem(row);
        const mappedSupplies = row.supplies.map((s: any) => ({
            ...s,
            id: s.supply?.id || s.id,
            description: s.supply?.description || s.description,
            unit: s.supply?.unit || s.unit,
            price: s.supply?.price || s.price || 0,
            quantity: s.quantity,
            typology: s.supply?.typology || s.typology
        }));
        setLocalAPUSupplies(mappedSupplies);
        setIsLocalAPUEditorOpen(true);
    };

    const handleUpdateLocalSupplyQty = (id: string, qty: string) => {
        const numQty = parseFloat(qty) || 0;
        setLocalAPUSupplies(prev => prev.map(s => s.id === id ? { ...s, quantity: numQty } : s));
    };

    const handleRemoveLocalSupply = (id: string) => {
        setLocalAPUSupplies(prev => prev.filter(s => s.id !== id));
    };

    const handleAddLocalSupply = (supply: Supply) => {
        if (localAPUSupplies.some(s => s.id === supply.id)) return;
        setLocalAPUSupplies(prev => [...prev, {
            id: supply.id,
            description: supply.description,
            unit: supply.unit,
            price: supply.price,
            quantity: 1,
            typology: supply.typology
        }]);
        setIsLocalSupplyLibraryOpen(false);
    };

    const localAPUSummary = useMemo(() => {
        if (!project?.config) return calculateAPU([], {});
        return calculateAPU(localAPUSupplies, project.config);
    }, [localAPUSupplies, project?.config]);

    const handleSaveLocalAPU = async () => {
        if (!project || !localAPUEditingItem) return;
        setIsSaving(true);
        try {
            const result = await customizeProjectItem(project.id, localAPUEditingItem.id, {
                chapter: localAPUEditingItem.chapter,
                description: localAPUEditingItem.desc,
                unit: localAPUEditingItem.unit,
                performance: localAPUEditingItem.performance || 1,
                directCost: localAPUSummary.directCost,
                total: localAPUSummary.totalUnit, // totalUnit is what calculateAPU returns
                supplies: localAPUSupplies.map(s => ({
                    supplyId: s.id,
                    quantity: s.quantity
                }))
            });

            if (result.success) {
                toast({ title: "APU Localizada", description: "La partida ahora tiene un análisis exclusivo para este proyecto." });
                setIsLocalAPUEditorOpen(false);
                fetchProjectData();
            } else {
                throw new Error('error' in result ? result.error : 'Fallo en la operación');
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const budgetItems = useMemo(() => {
        const exchangeRate = project?.config?.exchangeRate || 1;
        return computations.map(row => {
            const totalRow = row.total * row.unitPrice;
            return {
                ...row,
                qty: row.total,
                totalRow: totalRow,
                totalRowSec: totalRow / exchangeRate
            };
        });
    }, [computations, project?.config?.exchangeRate]);


    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen  items-center justify-center gap-4 h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Construcción...</p>
            </div>
        );
    }

    if (!project && !isLoading) return (
        <div className="flex flex-col min-h-screen  items-center justify-center p-8 gap-4 h-[50vh]">
            <Info className="h-12 w-12 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground italic uppercase tracking-widest text-[10px]">No se encontró el proyecto.</p>
            <Button variant="outline" onClick={() => router.push('/projects')}>Volver a Proyectos</Button>
        </div>
    );

    const levels = project?.levels || [];
    const isConstruccion = project.status === 'construccion';

    const budgetCards = [
        { title: "TOTAL MATERIALES", value: budgetTotals.totalMateriales, icon: Package },
        { title: "TOTAL MANO DE OBRA", value: budgetTotals.totalManoObra, icon: UsersIcon },
        { title: "TOTAL EQUIPO", value: budgetTotals.totalEquipo, icon: Wrench },
        { title: "DESGASTE HERR.", value: budgetTotals.totalDesgaste, icon: Activity },
        { title: "CARGAS SOCIALES", value: budgetTotals.totalCargasSociales, icon: Coins },
        { title: "IMPUESTO (IVA)", value: budgetTotals.totalIVA, icon: Coins },
        { title: "GASTOS ADMIN.", value: budgetTotals.totalGastosAdmin, icon: FileText },
        { title: "UTILIDADES", value: budgetTotals.totalUtilidades, icon: TrendingUp },
        { title: "IMPUESTO (IT)", value: budgetTotals.totalIT, icon: Coins },
    ];

    return (
        <div className="flex flex-col text-primary p-4 md:p-8 space-y-6  overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-card border border-accent h-12 p-0 rounded-xl overflow-hidden mb-6 flex flex-wrap md:flex-nowrap">
                    <TabsTrigger value="computo" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                        <Calculator className="mr-2 h-4 w-4" /> CÓMPUTO
                    </TabsTrigger>
                    <TabsTrigger value="presupuesto" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r text-xs md:text-sm">
                        <Coins className="mr-2 h-4 w-4" /> PRESUPUESTO
                    </TabsTrigger>
                    <TabsTrigger value="cronograma" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                        <CalendarDays className="mr-2 h-4 w-4" /> CRONOGRAMA
                    </TabsTrigger>
                    <TabsTrigger value="ejecucion" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none text-xs md:text-sm">
                        <Activity className="mr-2 h-4 w-4" /> EJECUCIÓN
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="computo">
                    <Card className="bg-card border-accent text-primary overflow-hidden gap-0">
                        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-7 border-b border-accent">
                            <div className="flex items-center gap-4 w-full">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Calculator className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex flex-col text-left flex-1">
                                    <CardTitle className="text-lg font-bold uppercase tracking-tight">Cómputos Métricos</CardTitle>
                                    <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Cuantificación de actividades por niveles.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex items-center justify-between gap-4 bg-card p-3 rounded-xl border border-accent">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar items..."
                                        className="pl-10 bg-card border-accent h-11 text-xs"
                                        value={searchTermComputo}
                                        onChange={(e) => setSearchTermComputo(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={handlePrintComputos}
                                        variant="outline"
                                        className="border-accent bg-card text-muted-foreground font-bold text-[10px] uppercase tracking-widest px-4 h-11 rounded-xl hover:bg-accent hover:text-primary"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </Button>

                                    {isAuthor && !isConstruccion && (
                                        <Button
                                            onClick={handleConsolidate}
                                            className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl "
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Consolidar Proyecto
                                        </Button>
                                    )}

                                    {isConstruccion && isAuthor && (
                                        <Button
                                            onClick={() => setIsChangeOrderOpen(true)}
                                            className="bg-amber-500 hover:bg-amber-600 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11 rounded-xl"
                                        >
                                            <FileSignature className="mr-2 h-4 w-4" /> Orden de Cambio
                                        </Button>
                                    )}
                                    {!isConstruccion && (
                                        <>
                                            <Button
                                                onClick={handleSaveComputos}
                                                disabled={isSaving || computations.length === 0}
                                                className="bg-emerald-500 border-emerald-500 text-background font-bold text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl hover:bg-emerald-600"
                                            >
                                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                Guardar Cambios
                                            </Button>
                                        </>
                                    )}
                                    {!isConstruccion && (
                                        <>
                                            <Button
                                                onClick={() => setIsAddComputoOpen(true)}
                                                className="bg-primary hover:bg-primary/90 text-background font-bold text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl"
                                            >
                                                <Plus className="mr-2 h-4 w-4" /> Añadir Partida
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="border border-accent rounded-xl overflow-x-auto bg-card">
                                <Table>
                                    <TableHeader className="bg-accent">
                                        <TableRow className="border-accent">
                                            <TableHead className="text-[10px] font-black uppercase whitespace-nowrap px-6 py-4">Item</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase whitespace-nowrap min-w-62.5">Descripción de Partida</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase whitespace-nowrap text-center">Unidad</TableHead>
                                            {levels.map((level: Level) => (
                                                <TableHead key={level.id} className="text-[10px] font-black uppercase text-center whitespace-nowrap min-w-[100px]">
                                                    {level.name.toUpperCase()}
                                                </TableHead>
                                            ))}
                                            <TableHead className="text-[10px] font-black uppercase text-right whitespace-nowrap pr-8">Total</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right whitespace-nowrap pr-6">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {computations.length > 0 ? (
                                            computations
                                                .filter(row => row.desc.toLowerCase().includes(searchTermComputo.toLowerCase()) || row.chapter.toLowerCase().includes(searchTermComputo.toLowerCase()))
                                                .map((row, rowIndex) => (
                                                    <TableRow key={row.id} className="border-accent hover:bg-muted/40 transition-colors">
                                                        <TableCell className="font-mono text-[10px] text-muted-foreground px-6">{row.id.slice(-6).toUpperCase()}</TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[14px] font-black text-primary uppercase">{row.desc}</span>
                                                                <span className="text-[11px] font-bold uppercase tracking-tighter text-primary/40">{row.chapter}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-[12px] text-center font-bold text-muted-foreground uppercase">{row.unit}</TableCell>
                                                        {row.values.map((val, levelIndex) => (
                                                            <TableCell key={levelIndex} className="p-1 text-center">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={val === 0 ? "" : val}
                                                                    placeholder="0.00"
                                                                    onChange={(e) => handleValueChange(rowIndex, levelIndex, e.target.value)}
                                                                    className="h-9 w-24 bg-card border-accent text-xs font-mono text-center mx-auto focus:ring-1 focus:ring-primary text-primary"
                                                                    disabled={isConstruccion}
                                                                />
                                                            </TableCell>
                                                        ))}
                                                        <TableCell className="text-xs font-mono text-right font-black text-primary pr-8 bg-blue-500/10">{(row.total ?? 0).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-card border-accent text-primary  p-1.5 rounded-xl">
                                                                    <DropdownMenuItem className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg">
                                                                        <Calculator className="h-3.5 w-3.5" /> Computar del Modelo
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg" onClick={() => handleViewDetail(row)}>
                                                                        <Calculator className="h-3.5 w-3.5" /> Ver Análisis APU
                                                                    </DropdownMenuItem>
                                                                    {isAuthor && !isConstruccion && (
                                                                        <DropdownMenuItem
                                                                            className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 rounded-lg"
                                                                            onClick={() => handleRemoveItem(row.id)}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5 text-destructive" /> Quitar del Proyecto
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground text-xs italic">
                                                    No hay ítems vinculados. Haz clic en "Añadir Partida" para empezar.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="presupuesto">
                    <div className="space-y-6">
                        <Card className="bg-card border-accent text-primary  p-0 gap-0">
                            <Accordion type="single" collapsible defaultValue="" className='flex justify-between'>
                                <AccordionItem value="summary" className="border-none w-full ">
                                    <AccordionTrigger className="px-6 py-6 hover:no-underline flex items-center">
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="p-2 bg-primary/20 rounded-lg">
                                                <Coins className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex flex-col text-left flex-1">
                                                <CardTitle className="text-lg font-bold uppercase tracking-tight">Resumen de Presupuesto</CardTitle>
                                                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Desglose detallado de costos operativos.</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mr-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-1">Total Consolidado</span>
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-xl font-bold text-primary uppercase">{project.config?.mainCurrency || 'BS'}</span>
                                                    <p className="text-3xl font-black text-primary tracking-tighter">
                                                        {budgetTotals.totalGeneral.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1 px-3 py-0.5 bg-card rounded-lg border border-accent">
                                                    <span className="text-[9px] font-black text-primary uppercase">{project.config?.secondaryCurrency || 'USD'}</span>
                                                    <span className="text-xs font-mono font-bold text-primary/60">
                                                        {(budgetTotals.totalGeneral / (project.config?.exchangeRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6 border-t border-accent bg-card">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 py-6">
                                            {budgetTotals && budgetCards.map((card) => (
                                                <div key={card.title} className="flex items-center justify-between border-b border-accent pb-3">
                                                    <div className="flex items-center gap-3">
                                                        <card.icon className="h-4 w-4 text-primary" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.title}</span>
                                                    </div>
                                                    <p className="font-mono text-sm font-bold text-primary">
                                                        {project.config?.mainCurrency || 'BS'} {card.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </Card>

                        <Card className="bg-card border-accent text-primary gap-0">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-card border-b border-accent">
                                <div className="flex items-center gap-4 w-150">
                                    <div className="p-2 bg-primary/20 rounded-lg">
                                        <Coins className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex flex-col text-left flex-1">
                                        <CardTitle className="text-lg font-bold uppercase tracking-tight">Resumen de Presupuesto</CardTitle>
                                        <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Desglose detallado de costos operativos.</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 justify-between w-full">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar items..."
                                            className="pl-10 bg-card border-accent h-11 text-xs"
                                            value={searchTermPresupuesto}
                                            onChange={(e) => setSearchTermPresupuesto(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        onClick={handlePrintPresupuesto}
                                        variant="outline"
                                        className="border-accent bg-card text-muted-foreground font-bold text-[10px] uppercase tracking-widest px-4 h-11 rounded-xl hover:bg-accent hover:text-primary"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="border border-accent rounded-xl overflow-hidden bg-card">
                                    <Table>
                                        <TableHeader className="bg-accent">
                                            <TableRow className="border-accent hover:bg-muted/40">
                                                <TableHead className="text-[10px] font-black uppercase py-4 px-6">Item</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase">Capítulo</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase min-w-[250px]">Descripción</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-center">Und.</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right">P. Unit.</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right">Cantidad</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right">Total ({project.config?.mainCurrency || 'BS'})</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right pr-8">Total ({project.config?.secondaryCurrency || 'USD'})</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right pr-6">APU</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {budgetItems.length > 0 ? (
                                                budgetItems
                                                    .filter((row: any) => row.desc.toLowerCase().includes(searchTermPresupuesto.toLowerCase()) || row.chapter.toLowerCase().includes(searchTermPresupuesto.toLowerCase()))
                                                    .map((row: any, i: number) => (
                                                        <TableRow key={i} className="border-accent hover:bg-muted/40 transition-colors group">
                                                            <TableCell className="font-mono text-[10px] text-muted-foreground px-6">{row.id.slice(-6).toUpperCase()}</TableCell>
                                                            <TableCell className="text-[14px] text-primary/40 font-black tracking-tighter  uppercase whitespace-nowrap">{row.chapter}</TableCell>
                                                            <TableCell className="py-4">
                                                                <span className="text-[14px] font-bold text-primary uppercase">{row.desc}</span>
                                                            </TableCell>
                                                            <TableCell className="text-[14px] font-bold text-muted-foreground uppercase text-center">{row.unit}</TableCell>
                                                            <TableCell className="text-[14px] font-mono text-right text-muted-foreground font-bold">
                                                                {project.config?.mainCurrency || 'BS'} {(row.unitPrice ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className="text-[14px] font-mono text-right text-primary">
                                                                {(row.qty ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className="text-[14px] font-mono text-right text-primary font-black bg-blue-500/10">
                                                                {project.config?.mainCurrency || 'BS'} {(row.totalRow ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className="text-[14px] font-mono text-right text-muted-foreground pr-8">
                                                                {project.config?.secondaryCurrency || 'USD'} {(row.totalRowSec ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:bg-white/10"
                                                                    onClick={() => handleViewDetail(row)}
                                                                >
                                                                    <Calculator className="h-4 w-4 text-primary" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center py-32 text-muted-foreground italic">
                                                        Sin datos.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="cronograma">
                    <Card className="bg-card border-accent text-primary overflow-y-auto h-[700px] flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-accent/2 border-b border-accent">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <CalendarDays className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-widest">Cronograma de Obra (Gantt)</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Planificación temporal de partidas y frentes de trabajo.</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    {project?.consolidatedAt && (
                                        <div className="flex flex-col items-end mr-4 opacity-70">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">Línea Base</span>
                                            <span className="text-[10px] font-bold text-primary italic">{format(new Date(project.consolidatedAt), 'dd MMM yyyy', { locale: es })}</span>
                                        </div>
                                    )}
                                </div>
                                {project?.consolidatedAt && (
                                    <div className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-xl border font-black text-[10px] uppercase tracking-wider transition-all",
                                        totalProjectDelay > 0
                                            ? "bg-red-500/10 border-red-500/20 text-red-500"
                                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                    )}>
                                        <History className="h-3.5 w-3.5" />
                                        {totalProjectDelay > 0 ? `Retraso: ${totalProjectDelay} días` : "En Tiempo"}
                                    </div>
                                )}
                                {(hasPendingGanttMoves || Object.keys(ganttSidebarEdits).length > 0) && (
                                    <Button
                                        onClick={handleSaveGanttTabChanges}
                                        disabled={isSaving}
                                        className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase tracking-widest h-10 px-5 rounded-xl active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        {isSaving ? "Guardando..." : "Guardar Cronograma"}
                                    </Button>
                                )}
                                <Button
                                    onClick={handlePrintCronograma}
                                    variant="outline"
                                    className="border-accent bg-card text-muted-foreground font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl hover:bg-white/10"
                                >
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button
                                    onClick={() => {
                                        const todayEl = document.querySelector('[data-gantt-today]') as HTMLElement | null;
                                        todayEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                                    }}
                                    variant="outline"
                                    title="Ir a hoy"
                                    className="border-accent bg-card text-muted-foreground font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl hover:bg-white/10"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center bg-card rounded-xl border border-accent p-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-white/10"
                                        onClick={() => setGanttZoom(prev => Math.max(50, prev - 10))}
                                    >
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <span className="text-[10px] font-black w-12 text-center">{ganttZoom}%</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-white/10"
                                        onClick={() => setGanttZoom(prev => Math.min(200, prev + 10))}
                                    >
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Select value={ganttRange} onValueChange={(val: Range) => setGanttRange(val)}>
                                    <SelectTrigger className="h-10 bg-card border-accent text-[10px] font-black uppercase w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card text-primary border-accent">
                                        <SelectItem value="daily" className="text-[10px] font-bold uppercase">Diario</SelectItem>
                                        <SelectItem value="monthly" className="text-[10px] font-bold uppercase">Mensual</SelectItem>
                                        <SelectItem value="quarterly" className="text-[10px] font-bold uppercase">Trimestral</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden">
                            {ganttFeatures.length > 0 ? (
                                <GanttProvider range={ganttRange} zoom={ganttZoom}>
                                    <GanttSidebar>
                                        <GanttSidebarGroup name="PARTIDAS ACTIVAS">
                                            <Accordion type="multiple" className="w-full">
                                                {ganttFeatures.map(feature => {
                                                    const row = computations.find((c: any) => c.id === feature.id) as any;
                                                    const pending = ganttSidebarEdits[feature.id] || {};
                                                    const statusVal = pending.ganttStatus ?? row?.ganttStatus ?? 'no iniciado';
                                                    const extraDaysVal = pending.extraDays ?? row?.extraDays ?? 0;
                                                    const predVal = pending.predecessorId !== undefined ? pending.predecessorId : (row?.predecessorId ?? '');
                                                    const statusColor = STATUS_COLORS[statusVal] || '#3b82f6';
                                                    return (
                                                        <AccordionItem key={feature.id} value={feature.id} className="border-b border-accent">
                                                            <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-accent/20 text-left [&>svg]:ml-2">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-[11px] font-bold uppercase truncate leading-tight">{feature.name}</span>
                                                                        <span className="text-[9px] text-muted-foreground font-black">
                                                                            {Math.round(Math.abs((feature.endAt.getTime() - feature.startAt.getTime()) / (1000 * 60 * 60 * 24)))} días
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent className="px-3 pb-3 space-y-2.5 bg-accent/5">
                                                                {/* Status */}
                                                                <div className="space-y-1">
                                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Estado</Label>
                                                                    <Select
                                                                        value={statusVal}
                                                                        onValueChange={(val) => setGanttSidebarEdits(prev => ({
                                                                            ...prev,
                                                                            [feature.id]: { ...prev[feature.id], ganttStatus: val }
                                                                        }))}
                                                                    >
                                                                        <SelectTrigger className="h-8 text-[10px] font-bold bg-card border-accent w-full">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-card text-primary border-accent">
                                                                            {Object.keys(STATUS_COLORS).map(s => (
                                                                                <SelectItem key={s} value={s} className="text-[10px] font-bold capitalize">{s}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                {/* Extra Days */}
                                                                <div className="space-y-1">
                                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Días Extra</Label>
                                                                    <Input
                                                                        type="number"
                                                                        min={0}
                                                                        value={extraDaysVal}
                                                                        onChange={(e) => setGanttSidebarEdits(prev => ({
                                                                            ...prev,
                                                                            [feature.id]: { ...prev[feature.id], extraDays: parseInt(e.target.value) || 0 }
                                                                        }))}
                                                                        className="h-8 text-[10px] font-mono bg-card border-accent"
                                                                    />
                                                                </div>
                                                                {/* Predecessor */}
                                                                <div className="space-y-1">
                                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Dependiente de</Label>
                                                                    <Select
                                                                        value={predVal || 'none'}
                                                                        onValueChange={(val) => setGanttSidebarEdits(prev => ({
                                                                            ...prev,
                                                                            [feature.id]: { ...prev[feature.id], predecessorId: val === 'none' ? null : val }
                                                                        }))}
                                                                    >
                                                                        <SelectTrigger className="h-8 text-[10px] font-bold bg-card border-accent w-full">
                                                                            <SelectValue placeholder="Sin dependencia" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-card text-primary border-accent">
                                                                            <SelectItem value="none" className="text-[10px] font-bold italic text-muted-foreground">Sin dependencia</SelectItem>
                                                                            {computations
                                                                                .filter((c: any) => c.id !== feature.id)
                                                                                .map((c: any) => (
                                                                                    <SelectItem key={c.id} value={c.id} className="text-[10px] font-bold uppercase">{c.desc}</SelectItem>
                                                                                ))
                                                                            }
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                {/* Open Detail Modal */}
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full h-8 text-[10px] font-black uppercase border-accent hover:bg-accent/20 gap-2 mt-1"
                                                                    onClick={() => handleViewExecutionDetail(feature)}
                                                                >
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                    Ver Detalle
                                                                </Button>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    );
                                                })}
                                            </Accordion>
                                        </GanttSidebarGroup>
                                    </GanttSidebar>
                                    <GanttTimeline>
                                        <GanttHeader />
                                        <GanttFeatureList>
                                            {ganttFeatures.map(feature => (
                                                <GanttFeatureRow
                                                    key={feature.id}
                                                    features={[feature]}
                                                    onMove={handleMoveGanttItem}
                                                />
                                            ))}
                                        </GanttFeatureList>
                                        <GanttToday className="bg-primary text-background" />
                                    </GanttTimeline>
                                </GanttProvider>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full opacity-20 gap-4">
                                    <CalendarDays className="h-16 w-16" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay partidas para programar.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ejecucion">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-card border-accent relative overflow-hidden gap-0 h-fit">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                <CardHeader className="pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Avance Global Físico</span>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-black text-primary tracking-tighter">
                                            {budgetTotals.totalGeneral > 0 ? ((budgetTotals.totalAvance / budgetTotals.totalGeneral) * 100).toFixed(1) : '0.0'}%
                                        </p>
                                    </div>
                                    <div className="mt-4">
                                        <Progress value={budgetTotals.totalGeneral > 0 ? (budgetTotals.totalAvance / budgetTotals.totalGeneral) * 100 : 0} className="h-1.5 bg-card" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-emerald-500/20  relative overflow-hidden gap-0 h-fit">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                <CardHeader className="pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Valor Ejecutado</span>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-emerald-500/50">{project.config?.mainCurrency || 'BS'}</span>
                                        <p className="text-4xl font-black text-primary tracking-tighter">
                                            {budgetTotals.totalAvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase mt-2">Certificación técnica actual</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-blue-500/20  relative overflow-hidden gap-0 h-fit">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                <CardHeader className="pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/70">Saldo por Ejecutar</span>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-blue-500/50">{project.config?.mainCurrency || 'BS'}</span>
                                        <p className="text-4xl font-black text-primary tracking-tighter">
                                            {(budgetTotals.totalGeneral - budgetTotals.totalAvance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase mt-2">Pendiente de liberación</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-card border-accent text-primary gap-0">
                            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-7 bg-card border-b border-accent">
                                <div className="flex items-center gap-4 w-full">
                                    <div className="p-2 bg-primary/20 rounded-lg">
                                        <Activity className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex flex-col text-left flex-1">
                                        <CardTitle className="text-lg font-bold uppercase tracking-tight">Seguimiento de Avance Físico</CardTitle>
                                        <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Control de metrados ejecutados vs programados.</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full">
                                    <div className="flex items-center gap-2 mr-4 justify-between w-full">
                                        <div className="relative w-100">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por items..."
                                                className="pl-9 bg-card border-accent h-9 text-[10px]"
                                                value={searchTermEjecucion}
                                                onChange={(e) => setSearchTermEjecucion(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={handlePrintEjecucion}
                                                variant="outline"
                                                className="border-accent bg-card text-muted-foreground font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl hover:bg-card/10"
                                            >
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                onClick={() => setIsHistoryModalOpen(true)}
                                                variant="outline"
                                                className="border-accent bg-card text-muted-foreground font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl hover:bg-card/10"
                                            >
                                                <History className="h-4 w-4" />
                                            </Button>
                                            {isConstruccion && isAuthor && (
                                                <>
                                                    <Button
                                                        onClick={() => setIsAvanceModalOpen(true)}
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-black font-black text-[10px] uppercase h-10 px-6 rounded-xl">
                                                        <TrendingUp className="mr-2 h-4 w-4" /> Registrar Avance
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">

                                <div className="border border-accent rounded-xl overflow-x-auto bg-card m-6">
                                    <Table>
                                        <TableHeader className="bg-accent">
                                            <TableRow className="border-accent hover:bg-transparent">
                                                <TableHead className="text-[12px] font-black uppercase py-4 px-6">ID Item</TableHead>
                                                <TableHead className="text-[12px] font-black uppercase min-w-[300px]">Partida de Obra</TableHead>
                                                <TableHead className="text-[12px] font-black uppercase text-center">Und.</TableHead>
                                                <TableHead className="text-[12px] font-black uppercase text-right">Cómputo Total</TableHead>
                                                <TableHead className="text-[12px] font-black uppercase text-right">Cant. Avance</TableHead>
                                                <TableHead className="text-[12px] font-black uppercase text-right">Saldo Pendiente</TableHead>
                                                <TableHead className="text-[12px] font-black uppercase text-right">Avance Financiero</TableHead>
                                                <TableHead className="text-[12px] font-black uppercase text-right">% Ejecución</TableHead>
                                                <TableHead className="text-[12px] font-black uppercase text-right pr-8">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-32 text-muted-foreground opacity-50 uppercase text-[10px] font-black tracking-widest">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                                        Sincronizando Avance Físico...
                                                    </TableCell>
                                                </TableRow>
                                            ) : executionItems.length > 0 ? (
                                                executionItems
                                                    .filter(item => item.desc.toLowerCase().includes(searchTermEjecucion.toLowerCase()))
                                                    .map((row, i) => (
                                                        <TableRow key={`${row.id}-${row.progress}`} className="border-accent hover:bg-muted/40 transition-colors group">
                                                            <TableCell className="font-mono text-[10px] text-muted-foreground px-6">{row.id.slice(-6).toUpperCase()}</TableCell>
                                                            <TableCell className="py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[12px] font-bold text-primary uppercase">{row.desc}</span>
                                                                    <span className="text-[10px] text-primary/60 font-black uppercase tracking-tighter">{row.chapter}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-[12px] font-bold text-muted-foreground uppercase text-center">{row.unit}</TableCell>
                                                            <TableCell className="text-[12px] font-mono text-right text-primary font-bold">{row.total.toFixed(2)}</TableCell>
                                                            <TableCell className="text-[12px] font-mono text-right text-emerald-500 font-black">{row.progress.toFixed(2)}</TableCell>
                                                            <TableCell className="text-[12px] font-mono text-right text-amber-500 font-black">
                                                                {row.balance.toFixed(2)}
                                                            </TableCell>
                                                            <TableCell className="text-[12px] font-mono text-right text-emerald-500 font-black pr-8">
                                                                ${row.financialProgress.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className="text-center ">
                                                                <div className="space-y-1.5 w-full max-w-[80px] mx-auto">
                                                                    <div className="flex justify-between text-[12px] font-black text-muted-foreground">
                                                                        <span>{row.percentage.toFixed(1)}%</span>
                                                                    </div>
                                                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={cn("h-full transition-all duration-1000",
                                                                                row.percentage >= 100 ? "bg-emerald-500" : row.percentage > 0 ? "bg-primary" : "bg-transparent"
                                                                            )}
                                                                            style={{ width: `${Math.min(row.percentage, 100)}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="align-right justify-end">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="bg-card border-accent text-primary  p-1.5 rounded-xl">
                                                                        <DropdownMenuItem className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg">
                                                                            <Calculator className="h-3.5 w-3.5" /> Ver Avance Modelo
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg" onClick={() => handleViewDetail(row)}>
                                                                            <Calculator className="h-3.5 w-3.5" /> Documentos del Item
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-32 text-muted-foreground italic opacity-20">
                                                        No hay datos de ejecución registrados.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={isAvanceModalOpen} onOpenChange={setIsAvanceModalOpen}>
                <DialogContent className="min-w-7xl bg-card border-accent text-primary p-0 overflow-hidden  flex flex-col h-[90vh]">
                    <DialogHeader className="p-6 bg-card border-b border-accent shrink-0">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-6 w-6 text-emerald-500" />
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary">Certificación de Avance Físico por Niveles</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[10px] font-black uppercase mt-1 tracking-widest">Control técnico de ejecución con validación contra cómputos métricos</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden p-6">
                        <div className="border border-accent rounded-2xl overflow-hidden bg-card h-full flex flex-col">
                            <ScrollArea className="flex-1">
                                <Table>
                                    <TableHeader className="bg-card sticky top-0 z-10 backdrop-blur-md">
                                        <TableRow className="border-accent hover:bg-transparent">
                                            <TableHead className="text-[10px] font-black uppercase py-4 px-6 w-24 sticky left-0 bg-accent z-20 border-r border-accent">ID</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase min-w-[250px] sticky left-24 bg-accent z-20 border-r border-accent">Descripción Partida</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center w-24 bg-accent">Und.</TableHead>
                                            {levels.map((level: any) => (
                                                <TableHead key={level.id} className="text-[10px] font-black uppercase text-center whitespace-nowrap px-4 border-l border-accent bg-accent">
                                                    {level.name.toUpperCase()}
                                                </TableHead>
                                            ))}
                                            <TableHead className="text-[10px] font-black uppercase text-right pr-8 w-40  bg-emerald-500/5 border-l border-accent">Total Certificado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {computations.map((item) => {
                                            const itemLevelProgress = batchLevelProgress[item.id] || {};
                                            const itemTotalIncrement = Object.values(itemLevelProgress).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
                                            const remainingBalance = item.total - (item.progress || 0);
                                            const isGlobalExceeded = itemTotalIncrement > (remainingBalance + 0.001);

                                            return (
                                                <TableRow key={item.id} className={cn("border-accent hover:bg-muted/40 transition-colors", isGlobalExceeded && "bg-red-500/5")}>
                                                    <TableCell className="font-mono text-[10px] text-muted-foreground px-6 sticky left-0 bg-card z-10 border-b border-accent">{item.id.slice(-6).toUpperCase()}</TableCell>
                                                    <TableCell className="py-4 sticky left-24 bg-card z-10 border-b border-accent">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-primary uppercase">{item.desc}</span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="outline" className="text-[10px] font-black uppercase h-3.5 border-accent">Saldo: {remainingBalance.toFixed(2)}</Badge>
                                                                {isGlobalExceeded && <span className="text-[7px] font-black text-red-500 uppercase animate-pulse flex items-center gap-1"><AlertTriangle className="h-2 w-2" /> EXCESO</span>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-[10px] text-center font-black text-muted-foreground uppercase border-b border-accent">{item.unit}</TableCell>
                                                    {levels.map((level: any, lIdx: any) => {
                                                        const computedForLevel = item.values[lIdx] || 0;
                                                        const enteredVal = parseFloat(batchLevelProgress[item.id]?.[level.id] || '0') || 0;
                                                        const isLevelExceeded = enteredVal > (computedForLevel + 0.001);

                                                        return (
                                                            <TableCell key={level.id} className="p-1 border-b border-accent">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={batchLevelProgress[item.id]?.[level.id] || ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            setBatchLevelProgress(prev => ({
                                                                                ...prev,
                                                                                [item.id]: {
                                                                                    ...(prev[item.id] || {}),
                                                                                    [level.id]: val
                                                                                }
                                                                            }));
                                                                        }}
                                                                        placeholder="0.00"
                                                                        className={cn("h-9 w-24 bg-card border-accent text-center font-mono text-[11px] text-primary focus-visible:ring-1",
                                                                            isLevelExceeded ? "text-red-500 focus-visible:ring-red-500 bg-red-500/10" : "focus-visible:ring-emerald-500"
                                                                        )}
                                                                    />
                                                                    <span className={cn("text-[7px] font-black uppercase tracking-tighter", isLevelExceeded ? "text-red-500" : "text-muted-foreground/40")}>
                                                                        Max: {computedForLevel.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                        );
                                                    })}
                                                    <TableCell className="text-right pr-8 bg-emerald-500/5 border-l border-white/10 font-mono text-sm font-black text-emerald-500">
                                                        {itemTotalIncrement > 0 ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className={isGlobalExceeded ? "text-red-500" : ""}>{itemTotalIncrement.toFixed(2)}</span>
                                                                {isGlobalExceeded && <span className="text-[7px] font-black text-red-500 uppercase">BLOQUEADO</span>}
                                                            </div>
                                                        ) : '—'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-accent bg-card shrink-0">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                            </div>
                            <div className="flex gap-4">
                                <Button variant="ghost" onClick={() => setIsAvanceModalOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cancelar</Button>
                                <Button
                                    onClick={handleBatchSaveAvance}
                                    disabled={isSaving}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-[10px] h-12 px-12 tracking-widest "
                                >
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                    Procesar y Validar Avance
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                <DialogContent className="min-w-7xl bg-card border-accent text-primary p-0 overflow-hidden flex flex-col h-[80vh]">
                    <DialogHeader className="p-6 bg-card border-b border-accent shrink-0 flex flex-row items-center justify-between space-y-0 ">
                        <div className="flex items-center gap-3 ">
                            <History className="h-6 w-6 text-primary" />
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary">Historial de Avance Físico</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[10px] font-black uppercase mt-1 tracking-widest">Registros chronológicos de certificaciones y reportes de obra</DialogDescription>
                            </div>
                        </div>
                        <div className="pr-6">
                            <Button
                                onClick={handlePrintHistory}
                                variant="outline"
                                className="border-accent bg-card text-primary font-black text-[10px] uppercase h-10 px-4 rounded-xl hover:bg-accent "
                            >
                                <Printer className="mr-2 h-4 w-4" /> Imprimir Historial
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden p-6">
                        <div className="border border-accent rounded-xl overflow-hidden bg-card h-full flex flex-col">
                            <ScrollArea className="flex-1">
                                <Table>
                                    <TableHeader className="bg-accent sticky top-0 z-10">
                                        <TableRow className="border-accent hover:bg-transparent">
                                            <TableHead className="text-[10px] font-black uppercase py-4 px-6 w-40">Fecha / Hora</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Descripción del Avance</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase w-48">Responsable</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingLogs ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-20">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 opacity-20" />
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-50">Cargando Historial...</span>
                                                </TableCell>
                                            </TableRow>
                                        ) : siteLogs.length > 0 ? (
                                            siteLogs.map((log) => (
                                                <TableRow key={log.id} className="border-accent hover:bg-muted/40 transition-colors">
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold text-primary">{format(new Date(log.date), 'dd/MM/yyyy')}</span>
                                                            <span className="text-[9px] text-muted-foreground font-black opacity-50">{format(new Date(log.date), 'HH:mm')}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <p className="text-[11px] font-medium text-primary leading-relaxed">{log.content}</p>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                                                                {log.author.charAt(0)}
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase text-primary/70">{log.author}</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-32 opacity-20">
                                                    <div className="flex flex-col items-center gap-3 justify-center w-full">
                                                        <History className="h-12 w-12" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">Sin registros de avance</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-accent bg-card shrink-0">
                        <Button variant="ghost" onClick={() => setIsHistoryModalOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cerrar Historial</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Ficha Técnica de Seguimiento por Item (Gantt Details) */}
            <Dialog open={isExecutionItemDetailOpen} onOpenChange={setIsExecutionItemDetailOpen}>
                <DialogContent className="min-w-7xl bg-card border-accent text-primary p-0 overflow-hidden flex flex-col h-[80vh] justify-between">
                    {selectedExecutionItem && (
                        <>
                            <DialogHeader className="p-8 border-b border-accent bg-card shrink-0 flex flex-row items-center gap-6 space-y-0">
                                <div className="h-16 w-16 rounded-2xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-3xl font-black text-primary uppercase ">
                                    <Info className="h-8 w-8" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-primary text-background font-black uppercase text-[10px]">{selectedExecutionItem.chapter}</Badge>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50 flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" /> ID: {selectedExecutionItem.id.slice(-6).toUpperCase()}
                                        </span>
                                    </div>
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight leading-none mt-1">
                                        {selectedExecutionItem.desc}
                                    </DialogTitle>
                                </div>
                            </DialogHeader>

                            <ScrollArea className="h-100">
                                <div className="p-8 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card className="bg-card border-accent p-4 space-y-1 ">
                                            <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">Cant. Computada</span>
                                            <p className="text-lg font-black text-primary font-mono">{selectedExecutionItem.total.toFixed(2)} <span className="text-[14px] opacity-40">{selectedExecutionItem.unit}</span></p>
                                        </Card>
                                        <Card className="bg-card border-accent p-4 space-y-1 ">
                                            <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">Precio Unitario</span>
                                            <p className="text-lg font-black text-primary font-mono">{project.config?.mainCurrency || 'BS'} {selectedExecutionItem.unitPrice.toFixed(2)}</p>
                                        </Card>
                                        <Card className="bg-card border-accent p-4 space-y-1 ">
                                            <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">Total Partida</span>
                                            <p className="text-lg font-black text-primary font-mono">{project.config?.mainCurrency || 'BS'} {(selectedExecutionItem.total * selectedExecutionItem.unitPrice).toLocaleString()}</p>
                                        </Card>
                                        <Card className="bg-card border-accent p-4 space-y-1 ">
                                            <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">Costo por Día</span>
                                            <p className="text-lg font-black text-primary font-mono">
                                                {project.config?.mainCurrency || 'BS'} {((selectedExecutionItem.total * selectedExecutionItem.unitPrice) / Math.max(1, differenceInDays(selectedExecutionItem.gantt.endAt, selectedExecutionItem.gantt.startAt))).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            </p>
                                        </Card>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Programación Temporal</h3>
                                            </div>
                                            <div className="space-y-4 bg-card border-accent p-6 rounded-3xl">
                                                <div className="flex flex-row justify-between items-center">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fecha Inicio</span>
                                                    <span className="text-xs font-mono font-black text-primary uppercase">{format(selectedExecutionItem.gantt.startAt, 'dd MMM yyyy', { locale: es })}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fecha Final</span>
                                                    <span className="text-xs font-mono font-black text-primary uppercase">{format(subDays(selectedExecutionItem.gantt.endAt, 1), 'dd MMM yyyy', { locale: es })}</span>
                                                </div>
                                                <Separator className="bg-accent" />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Rendimiento ({selectedExecutionItem.unit}/Hr)</Label>
                                                        <Input
                                                            type="number"
                                                            value={editPerformance}
                                                            onChange={(e) => setEditPerformance(Number(e.target.value))}
                                                            className="h-9 bg-card border-accent text-xs font-bold"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Días Extras</Label>
                                                        <Input
                                                            type="number"
                                                            value={editExtraDays}
                                                            onChange={(e) => setEditExtraDays(Number(e.target.value))}
                                                            className="h-9 bg-card border-accent text-xs font-bold"
                                                        />
                                                    </div>
                                                </div>
                                                <Separator className="bg-accent" />
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Dependiente de (Predecesor)</Label>
                                                        <Select value={editPredecessorId || "none"} onValueChange={(val) => setEditPredecessorId(val === "none" ? null : val)}>
                                                            <SelectTrigger className="h-9 bg-card border-accent text-[10px] font-black uppercase">
                                                                <SelectValue placeholder="NINGUNO" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-card border-accent max-h-48 pt-1">
                                                                <SelectItem value="none" className="text-[10px] font-black uppercase text-muted-foreground italic focus:bg-accent focus:text-primary">Ninguno (Inicio del Proyecto)</SelectItem>
                                                                {computations.filter(c => c.id !== selectedExecutionItem.id).map(c => (
                                                                    <SelectItem key={c.id} value={c.id} className="text-[10px] font-black uppercase focus:bg-accent focus:text-primary">
                                                                        {c.id.slice(-4)} - {c.desc}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <Separator className="bg-accent" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fecha Final</span>
                                                    <span className="text-xs font-mono font-black text-emerald-500 uppercase">
                                                        {format(addDays(selectedExecutionItem.gantt.startAt, (editPerformance / 8) + editExtraDays), 'dd MMM yyyy', { locale: es })}
                                                    </span>
                                                </div>
                                                <Separator className="bg-accent" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Días de Duración</span>
                                                    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-black uppercase text-[10px]">
                                                        {Math.ceil((editPerformance / 8) + editExtraDays)} DÍAS CALCULADOS
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-emerald-500" />
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estado de Ejecución Física</h3>
                                            </div>
                                            <div className="space-y-6 bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest">Avance Actual</span>
                                                        <p className="text-3xl font-black text-primary font-mono mt-1">
                                                            {selectedExecutionItem.progress?.toFixed(2) || '0.00'}
                                                            <span className="text-sm opacity-40 ml-1 uppercase">{selectedExecutionItem.unit}</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest">Progreso Real</span>
                                                        <p className="text-3xl font-black text-emerald-500 font-mono mt-1">
                                                            {((selectedExecutionItem.progress || 0) / selectedExecutionItem.total * 100).toFixed(1)}%
                                                        </p>
                                                    </div>
                                                </div>
                                                <Progress
                                                    value={(selectedExecutionItem.progress || 0) / selectedExecutionItem.total * 100}
                                                    className="h-2 bg-white/5"
                                                />
                                                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl justify-center">
                                                    <div className="flex-1 flex flex-col gap-2">
                                                        <Label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest text-center">Cambiar Estado de Ejecución</Label>
                                                        <Select value={editStatus} onValueChange={setEditStatus}>
                                                            <SelectTrigger className="h-9 bg-background border-emerald-500/30 text-[10px] font-black uppercase">
                                                                <SelectValue placeholder="SELECCIONAR ESTADO" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-card border-accent">
                                                                {STATUS_OPTIONS.map(opt => (
                                                                    <SelectItem key={opt.id} value={opt.id} className="text-[10px] font-black uppercase">
                                                                        {opt.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <UsersIcon className="h-4 w-4 text-blue-400" />
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Equipo de Trabajo Designado</h3>
                                                </div>
                                                <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-[9px] font-black">
                                                    {selectedExecutionItem.supplies?.filter((s: any) => {
                                                        const typo = s.supply?.typology || s.typology;
                                                        return typo === 'Mano de Obra' || typo === 'Honorario';
                                                    }).length || 0} CARGOS
                                                </Badge>
                                            </div>

                                            <Card className="bg-card border-accent overflow-hidden rounded-3xl">
                                                <Table>
                                                    <TableHeader className="bg-card border-accent">
                                                        <TableRow className="border-accent hover:bg-transparent">
                                                            <TableHead className="text-[12px] font-black uppercase py-3 px-6">Especialidad / Cargo</TableHead>
                                                            <TableHead className="text-[12px] font-black uppercase text-center w-24">Cantidad</TableHead>
                                                            <TableHead className="text-[12px] font-black uppercase text-right pr-6">Incidencia</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {selectedExecutionItem.supplies?.filter((s: any) => {
                                                            const typo = s.supply?.typology || s.typology;
                                                            return typo === 'Mano de Obra' || typo === 'Honorario';
                                                        }).length > 0 ? (
                                                            selectedExecutionItem.supplies
                                                                .filter((s: any) => {
                                                                    const typo = s.supply?.typology || s.typology;
                                                                    return typo === 'Mano de Obra' || typo === 'Honorario';
                                                                })
                                                                .map((s: any, idx: number) => (
                                                                    <TableRow key={idx} className="border-accent hover:bg-accent">
                                                                        <TableCell className="py-3 px-6">
                                                                            <span className="text-[11px] font-bold text-primary uppercase">{s.supply?.description || s.description}</span>
                                                                        </TableCell>
                                                                        <TableCell className="text-center font-mono text-xs text-blue-400 font-black">{s.quantity.toFixed(3)}</TableCell>
                                                                        <TableCell className="text-right pr-6">
                                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{s.supply?.unit || s.unit} / {selectedExecutionItem.unit}</span>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                        ) : (
                                                            <TableRow>
                                                                <TableCell colSpan={3} className="text-center py-12 text-muted-foreground opacity-20 uppercase text-[9px] font-black italic">No se ha designado personal específico.</TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                                <div className="p-4 bg-blue-500/10 border-t border-blue-500/20 flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Capacidad Operativa Total</span>
                                                    <span className="text-xs font-black text-primary font-mono">
                                                        {selectedExecutionItem.supplies?.filter((s: any) => {
                                                            const typo = s.supply?.typology || s.typology;
                                                            return typo === 'Mano de Obra' || typo === 'Honorario';
                                                        }).reduce((acc: number, s: any) => acc + s.quantity, 0).toFixed(3)} P/Hr
                                                    </span>
                                                </div>
                                            </Card>

                                            <div className="p-6 bg-card border border-accent rounded-3xl space-y-3">
                                                <div className="flex items-center gap-2 text-muted-foreground/60">
                                                    <Wrench className="h-3.5 w-3.5" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Maquinaria y Equipo Vinculado</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedExecutionItem.supplies?.filter((s: any) => {
                                                        const typo = s.supply?.typology || s.typology;
                                                        return typo === 'Equipo' || typo === 'Herramienta';
                                                    }).length > 0 ? (
                                                        selectedExecutionItem.supplies
                                                            .filter((s: any) => {
                                                                const typo = s.supply?.typology || s.typology;
                                                                return typo === 'Equipo' || typo === 'Herramienta';
                                                            })
                                                            .map((s: any, idx: number) => (
                                                                <Badge key={idx} variant="outline" className="bg-card border-accent text-[14px] font-black uppercase h-6">
                                                                    {s.supply?.description || s.description}
                                                                </Badge>
                                                            ))
                                                    ) : (
                                                        <span className="text-[9px] font-black text-muted-foreground/30 uppercase italic">Sin equipos mecanizados registrados</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                            <DialogFooter className="p-6 border-t border-accent bg-card shrink-0 flex flex-col md:flex-row gap-4">
                                <div className="flex gap-4 flex-1">
                                    <Button
                                        variant="outline"
                                        className="border-accent bg-card text-[10px] font-black uppercase h-12 px-8 hover:bg-accent/10 flex-1 md:flex-none"
                                        onClick={() => handleViewDetail(selectedExecutionItem)}
                                    >
                                        <Calculator className="h-4 w-4 mr-2" /> Análisis de Costos APU
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-accent text-[10px] font-black uppercase h-12 px-8 hover:bg-accent/10 flex-1 md:flex-none"
                                        onClick={() => setIsExecutionItemDetailOpen(false)}
                                    >
                                        Cerrar
                                    </Button>
                                </div>
                                <Button
                                    className="flex-1 bg-amber-500 text-primary font-black text-[10px] uppercase h-12 tracking-widest hover:bg-amber-600 active:scale-95 transition-all"
                                    onClick={handleSaveGanttChanges}
                                >
                                    <Save className="h-4 w-4 mr-2" /> Guardar Cambios en Cronograma
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Orden de Cambio Dialog */}
            <Dialog open={isChangeOrderOpen} onOpenChange={setIsChangeOrderOpen}>
                <DialogContent className="min-w-7xl bg-card border-accent text-primary p-0 overflow-hidden flex flex-col h-[90vh] gap-0">
                    <DialogHeader className="p-6 border-b border-accent bg-card shrink-0 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <FileSignature className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Nueva Orden de Cambio</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                    Modificación técnica de cómputos y partidas post-consolidación
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pr-6">
                            <Button
                                onClick={() => setIsAddComputoOpen(true)}
                                className="bg-primary border border-primary text-background hover:bg-primary/40 hover:border-primary/40 text-[10px] font-black uppercase h-10 px-6 rounded-xl"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Adicionar Nueva Partida
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="p-6 bg-amber-500/5 border-b border-accent">
                            <Label className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-3 block">Justificación Técnica / Motivo de la Modificación</Label>
                            <Textarea
                                value={changeOrderReason}
                                onChange={(e) => setChangeOrderReason(e.target.value)}
                                placeholder="Describa el motivo técnico del cambio (Ej: Ampliación de muro perimetral sector norte)..."
                                className="min-h-[100px] resize-none bg-card border-amber-500 focus:border-amber-500/50 uppercase text-xs font-bold p-4 animate-pulse"
                            />
                        </div>

                        <div className="flex-1 p-6 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Previsualización de Tabla de Cómputos</h3>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-amber-500/60 uppercase">
                                    <Info className="h-3 w-3" /> Los cambios aquí realizados se registrarán en la bitácora oficial.
                                </div>
                            </div>

                            <div className="flex-1 border border-accent rounded-xl overflow-hidden bg-card">
                                <ScrollArea className="h-full">
                                    <Table>
                                        <TableHeader className="bg-accent sticky top-0 z-10 backdrop-blur-md">
                                            <TableRow className="border-accent hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase py-4 px-6">Descripción de Partida</TableHead>
                                                {project.levels.map((lvl: any) => (
                                                    <TableHead key={lvl.id} className="text-[10px] font-black uppercase text-center">{lvl.name}</TableHead>
                                                ))}
                                                <TableHead className="text-[10px] font-black uppercase text-right w-32">Nuevo Total</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right pr-8 w-32">Localizar APU</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {computations.map((row, rowIndex) => (
                                                <TableRow key={row.id} className="border-accent hover:bg-muted/40 transition-colors">
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-primary uppercase">{row.desc}</span>
                                                            <span className="text-[9px] text-muted-foreground font-black uppercase opacity-40">{row.unit}</span>
                                                        </div>
                                                    </TableCell>
                                                    {row.values.map((val, lvlIdx) => (
                                                        <TableCell key={lvlIdx} className="p-1 text-center">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={val === 0 ? '' : val}
                                                                onChange={(e) => handleValueChange(rowIndex, lvlIdx, e.target.value)}
                                                                className="h-9 w-24 bg-card border-amber-500 text-center font-mono text-xs focus:ring-1 focus:ring-amber-500/50 text-amber-500"
                                                                placeholder="0.00"
                                                            />
                                                        </TableCell>
                                                    ))}
                                                    <TableCell className="text-right">
                                                        <span className="font-mono text-xs font-black text-amber-500">{row.total.toFixed(2)}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-8">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-amber-500/20 text-amber-500"
                                                            onClick={() => handleOpenLocalAPUEditor(row)}
                                                        >
                                                            <Calculator className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-accent bg-card shrink-0">
                        <Button variant="ghost" onClick={() => setIsChangeOrderOpen(false)} className="text-[10px] font-black uppercase tracking-widest h-12 px-8">Cancelar</Button>
                        <Button
                            onClick={handleProcessChangeOrder}
                            disabled={isSaving || !changeOrderReason.trim()}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase h-12 px-12 tracking-widest "
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
                            Autorizar y Ejecutar Orden de Cambio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Local APU Editor Dialog */}
            <Dialog open={isLocalAPUEditorOpen} onOpenChange={setIsLocalAPUEditorOpen}>
                <DialogContent className="min-w-7xl bg-card border-accent text-primary p-0 overflow-hidden  flex flex-col h-[85vh]">
                    {localAPUEditingItem && (
                        <>
                            <DialogHeader className="p-6 border-b border-accent bg-card shrink-0 flex flex-row items-center gap-4 space-y-0">
                                <div className="p-2 bg-amber-500/20 rounded-lg"><Calculator className="h-6 w-6 text-amber-500" /></div>
                                <div className="flex-1">
                                    <DialogTitle className="text-xl font-bold uppercase tracking-tight">Análisis APU Local del Proyecto</DialogTitle>
                                    <DialogDescription className="text-[14px] font-black uppercase text-muted-foreground mt-1">Ajuste de rendimientos exclusivo para "{localAPUEditingItem.desc}"</DialogDescription>
                                </div>
                            </DialogHeader>

                            <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
                                <div className="grid grid-cols-3 gap-6 bg-card p-4 rounded-xl border border-accent">
                                    <div className="space-y-1"><span className="text-[12px] font-black text-muted-foreground uppercase">Capítulo</span><p className="text-[16px] font-bold uppercase">{localAPUEditingItem.chapter}</p></div>
                                    <div className="space-y-1"><span className="text-[12px] font-black text-muted-foreground uppercase">Rendimiento Base</span><p className="text-[16px] font-bold font-mono">{localAPUEditingItem.performance} {localAPUEditingItem.unit}/Jornal</p></div>
                                    <div className="space-y-1 text-right">
                                        <span className="text-[12px] font-black text-amber-500 uppercase">Costo Unitario Local</span>
                                        <p className="text-[16px] font-black text-amber-500 font-mono">${localAPUSummary.totalUnit.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Package className="h-3.5 w-3.5" /> Insumos del Análisis</h3>
                                    <Button onClick={() => setIsLocalSupplyLibraryOpen(true)} variant="default" size="lg" className="h-8 bg-amber-500 text-[9px] font-black uppercase text-primary hover:bg-amber-600">
                                        <Plus className="h-3 w-3 mr-1.5" /> Adicionar Insumo
                                    </Button>
                                </div>
                                <div className="flex-1 border border-accent rounded-2xl overflow-hidden bg-card">
                                    <ScrollArea className="h-full">
                                        <Table>
                                            <TableHeader className="bg-accent sticky top-0 z-10"><TableRow className="border-accent"><TableHead className="text-[12px] font-black uppercase py-3 px-6">Tipo</TableHead><TableHead className="text-[9px] font-black uppercase">Descripción Insumo</TableHead><TableHead className="text-[9px] font-black uppercase text-center">Unidad</TableHead><TableHead className="text-[9px] font-black uppercase text-right">P. Unit.</TableHead><TableHead className="text-[9px] font-black uppercase text-center w-32">Rendimiento</TableHead><TableHead className="text-[9px] font-black uppercase text-right pr-6">Subtotal</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
                                            <TableBody>
                                                {localAPUSupplies.map((s) => (
                                                    <TableRow key={s.id} className="border-accent hover:bg-accent">
                                                        <TableCell className="px-6 py-3">
                                                            <div className="p-1.5 bg-accent rounded-md border border-white/10 w-fit">
                                                                {s.typology === 'Material' || s.typology === 'Insumo' ? <Package className="h-3.5 w-3.5 text-primary" /> : s.typology === 'Mano de Obra' || s.typology === 'Honorario' ? <UsersIcon className="h-3.5 w-3.5 text-emerald-500" /> : <Wrench className="h-3.5 w-3.5 text-amber-500" />}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-[14px] font-bold uppercase">{s.description}</TableCell>
                                                        <TableCell className="text-center text-[14px] text-muted-foreground font-black">{s.unit}</TableCell>
                                                        <TableCell className="text-right font-mono text-[14px]">${s.price.toFixed(2)}</TableCell>
                                                        <TableCell className="px-4">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={s.quantity}
                                                                onChange={(e) => handleUpdateLocalSupplyQty(s.id, e.target.value)}
                                                                className="h-8 bg-card border-amber-500 text-center font-mono text-xs text-amber-400 font-bold animate-pulse"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-[14px] font-black pr-6">${(s.quantity * s.price).toFixed(2)}</TableCell>
                                                        <TableCell className="pr-4"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveLocalSupply(s.id)}><X className="h-3.5 w-3.5" /></Button></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                            </div>

                            <DialogFooter className="p-6 border-t border-accent bg-card shrink-0 flex gap-4">
                                <Button variant="ghost" onClick={() => setIsLocalAPUEditorOpen(false)} className="text-[10px] font-black uppercase tracking-widest">Descartar</Button>
                                <Button onClick={handleSaveLocalAPU} disabled={isSaving} className="flex-1 bg-amber-500 hover:bg-amber-600 text-primary font-black text-[10px] uppercase h-12 tracking-widest ">
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Confirmar Análisis Local
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Local Supply Picker Sub-Dialog */}
            <Dialog open={isLocalSupplyLibraryOpen} onOpenChange={setIsLocalSupplyLibraryOpen}>
                <DialogContent className="sm:max-w-xl bg-card border-accent text-primary p-0 overflow-hidden flex flex-col h-[70vh] ">
                    <div className="p-6 border-b border-accent flex flex-row items-center gap-4 shrink-0">
                        <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                            <Layers className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary leading-none">
                                Librería de Insumos
                            </DialogTitle>
                            <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">
                                Busque y añada recursos al análisis de costos
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="p-6 flex-1 overflow-hidden flex flex-col space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="BUSCAR RECURSO..."
                                className="pl-10 h-11 bg-card border-accent text-[10px] font-bold uppercase"
                                value={localSupplySearchTerm}
                                onChange={(e) => setLocalSupplySearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 border border-accent rounded-xl overflow-hidden bg-card">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-accent sticky top-0 z-10 backdrop-blur-md">
                                        <TableRow className="border-accent hover:bg-transparent">
                                            <TableHead className="text-[9px] font-black uppercase py-3 px-4 text-muted-foreground">Tipo</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase text-muted-foreground">Descripción</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase text-center text-muted-foreground">Und.</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase text-right text-muted-foreground pr-4">Precio</TableHead>
                                            <TableHead className="w-16"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>

                                        {masterSupplies.filter(s => s.description.toLowerCase().includes(localSupplySearchTerm.toLowerCase())).map((s) => {
                                            const isAdded = localAPUSupplies.some(aps => aps.id === s.id);
                                            return (
                                                <TableRow key={s.id} className="border-accent hover:bg-accent cursor-pointer group" onClick={() => handleAddLocalSupply(s)}>
                                                    <TableCell className="px-4 py-3">
                                                        <div className="p-1.5 bg-accent rounded-md border border-white/10 w-fit">
                                                            {s.typology === 'Material' || s.typology === 'Insumo' ? <Package className="h-3.5 w-3.5 text-primary" /> : s.typology === 'Mano de Obra' || s.typology === 'Honorario' ? <UsersIcon className="h-3.5 w-3.5 text-emerald-500" /> : <Wrench className="h-3.5 w-3.5 text-amber-500" />}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-6"><span className="text-xs font-bold uppercase group-hover:text-primary">{s.description}</span></TableCell>
                                                    <TableCell className="text-[10px] font-black text-muted-foreground uppercase">{s.unit}</TableCell>
                                                    <TableCell className="text-[10px] text-right font-mono font-bold text-muted-foreground pr-4">${s.price.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right pr-4">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn("h-8 w-8", isAdded ? "text-emerald-500 hover:bg-emerald-500/10" : "text-primary hover:bg-primary/10")}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddLocalSupply(s);
                                                            }}
                                                            disabled={isAdded}
                                                        >
                                                            {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddComputoOpen} onOpenChange={setIsAddComputoOpen}>
                <DialogContent className="min-w-7xl bg-card border-accent text-primary p-0 overflow-hidden  flex flex-col h-[85vh]">
                    <DialogHeader className="p-6 border-b border-accent bg-card shrink-0 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <PlusCircle className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Librería de Partidas Maestro</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                    Seleccione las actividades técnicas para vincular al proyecto
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="relative shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="BUSCAR EN EL DIRECTORIO MAESTRO..."
                                className="pl-10 h-11 bg-card border-accent text-[10px] font-bold uppercase tracking-widest"
                                value={librarySearchTerm}
                                onChange={(e) => setLibrarySearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="border border-accent rounded-xl overflow-hidden flex-1 bg-card">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-accent sticky top-0 z-10 backdrop-blur-md">
                                        <TableRow className="border-accent hover:bg-transparent">
                                            <TableHead className="w-12 text-center" />
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase">Capítulo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Descripción de la Partida</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center">Unidad</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right pr-6">Costo Base</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingLibrary ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-20">
                                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredLibraryItems.length > 0 ? (
                                            filteredLibraryItems.map((item) => {
                                                const isAlreadyAdded = computations.some(c => c.id === item.id);
                                                return (
                                                    <TableRow key={item.id} className={cn("border-accent hover:bg-accent/5 transition-colors", isAlreadyAdded && "opacity-30 bg-accent/1")}>
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={selectedLibraryItems.includes(item.id)}
                                                                onCheckedChange={() => handleToggleLibraryItem(item.id)}
                                                                disabled={isAlreadyAdded}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-[10px] font-black text-primary uppercase">{item.chapter}</TableCell>
                                                        <TableCell className="text-xs font-bold text-primary uppercase">{item.description}</TableCell>
                                                        <TableCell className="text-[10px] font-bold text-muted-foreground uppercase text-center">{item.unit}</TableCell>
                                                        <TableCell className="text-right pr-6 font-mono text-xs font-black text-emerald-500">${item.total.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground text-[10px] font-black uppercase opacity-30">No se encontraron ítems que coincidan con la búsqueda.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-accent bg-card shrink-0">
                        <Button variant="ghost" onClick={() => setIsAddComputoOpen(false)} className="text-[10px] font-black uppercase tracking-widest">Cancelar</Button>
                        <div className="flex items-center gap-4">
                            {totalProjectDelay > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-lg animate-pulse">
                                    <Clock className="h-4 w-4 text-destructive" />
                                    <span className="text-[10px] font-black uppercase text-destructive tracking-widest">
                                        Atraso: {totalProjectDelay} Días con línea base
                                    </span>
                                </div>
                            )}
                            {totalProjectDelay === 0 && project?.consolidatedAt && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">
                                        Cronograma en Tiempo
                                    </span>
                                </div>
                            )}
                            <Button
                                onClick={handleAddSelectedItems}
                                disabled={isSaving || selectedLibraryItems.length === 0}
                                className="bg-primary text-background font-black text-[10px] uppercase h-12 px-12"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                Vincular Seleccionados ({selectedLibraryItems.length})
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-250 w-full max-h-[95vh] overflow-hidden bg-card border-accent p-0 flex flex-col ">
                    {selectedItem && apuCalculations && (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b border-accent bg-card flex flex-row items-center gap-4 shrink-0">
                                <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                    <Boxes className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary leading-none">
                                        Análisis APU: {selectedItem.desc}
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">
                                        Análisis de precios unitarios y parámetros de control operativo
                                    </DialogDescription>
                                </div>
                            </div>
                            <ScrollArea className="h-125 pr-4">
                                <div className="flex-1">
                                    <Tabs defaultValue="informacion" className="flex-1 flex flex-col overflow-hidden">
                                        <div className="px-6 shrink-0">
                                            <TabsList className="h-14 bg-card p-0 gap-8">
                                                <TabsTrigger value="informacion" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-2xl border-r border-accent text-xs md:text-sm">
                                                    Análisis Costos
                                                </TabsTrigger>
                                                <TabsTrigger value="calidad" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-2xl border-r border-accent text-xs md:text-sm">
                                                    Control de Calidad
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>

                                        <ScrollArea className="flex-1">
                                            <div className="flex-1">
                                                <TabsContent value="informacion" className="m-0 p-6 space-y-8 outline-none">
                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                                        <div className="lg:col-span-7 space-y-6">
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-2">

                                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Datos generales</h3>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-4 h-full">
                                                                    <div className="space-y-2">
                                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Capítulo</Label>
                                                                        <div className="bg-card border border-accent rounded-md h-11 px-3 flex items-center text-primary uppercase text-xs font-bold">
                                                                            {selectedItem.chapter}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Descripción ítem</Label>
                                                                        <div className="bg-card border border-accent rounded-md h-11 px-3 flex items-center text-primary uppercase text-xs font-bold">
                                                                            {selectedItem.desc}
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Unidad</Label>
                                                                            <div className="bg-card border border-accent rounded-md h-11 px-3 flex items-center text-primary uppercase text-xs font-bold">
                                                                                {selectedItem.unit}
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Rendimiento {selectedItem.unit} / hr</Label>
                                                                            <div className="bg-card border border-accent rounded-md h-11 px-3 flex items-center text-primary font-mono font-bold">
                                                                                {selectedItem.performance.toFixed(2)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2 h-full">
                                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Notas</Label>
                                                                        <div className="bg-card border border-accent rounded-md h-11 px-3 flex items-center text-primary uppercase text-xs font-bold w-full">
                                                                            {selectedItem.notes}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="lg:col-span-5">
                                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 h-full flex flex-col justify-between ">
                                                                <div className="space-y-3">
                                                                    {[
                                                                        { label: 'Total de Materiales', value: apuCalculations.matSub },
                                                                        { label: 'Mano de Obra', value: apuCalculations.labSub },
                                                                        { label: 'Cargas Sociales', value: apuCalculations.cSociales },
                                                                        { label: 'IVA', value: apuCalculations.ivaMO },
                                                                        { label: 'Equipo', value: apuCalculations.equSub },
                                                                        { label: 'Desgaste', value: apuCalculations.toolWear },
                                                                        { label: 'Gastos Administrativos', value: apuCalculations.adm },
                                                                        { label: 'Utilidades', value: apuCalculations.utility },
                                                                        { label: 'IT', value: apuCalculations.it },
                                                                    ].map((item, idx) => (
                                                                        <div key={idx}>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/80">{item.label}</span>
                                                                                <span className="text-primary font-mono font-bold text-xs">${item.value.toFixed(2)}</span>
                                                                            </div>
                                                                            <Separator className="my-2 border-accent" />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="flex items-start justify-end gap-8 pt-4">
                                                                    <div className="text-right">
                                                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">COSTO DIRECTO</p>
                                                                        <p className="text-xl font-bold text-emerald-500">${apuCalculations.directCost.toFixed(2)}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">TOTAL APU</p>
                                                                        <p className="text-xl font-bold text-emerald-500">${apuCalculations.totalUnit.toFixed(2)}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Separator className="border-accent" />

                                                    <div className="space-y-4">
                                                        <div className="bg-card border border-accent rounded-2xl overflow-hidden min-h-[300px]">
                                                            <Table>
                                                                <TableHeader className="bg-accent sticky top-0 z-10 backdrop-blur-md">
                                                                    <TableRow className="border-accent hover:bg-transparent">
                                                                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-6 py-4">Tipo</TableHead>
                                                                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Descripción</TableHead>
                                                                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Unidad</TableHead>
                                                                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right">P. Unitario</TableHead>
                                                                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Cantidad</TableHead>
                                                                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right px-6">Subtotal</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {apuCalculations.supplies.map((s: any, idx: number) => (
                                                                        <TableRow key={idx} className="border-accent  group transition-colors">
                                                                            <TableCell className="px-6 py-4">
                                                                                <div className="p-2 bg-accent rounded-lg border border-accent w-fit">
                                                                                    {s.typology === 'Material' || s.typology === 'Insumo' ? (
                                                                                        <Package className="h-4 w-4 text-primary" />
                                                                                    ) : (
                                                                                        <UsersIcon className="h-4 w-4 text-emerald-500" />
                                                                                    )}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-xs font-bold text-primary uppercase">{s.description}</TableCell>
                                                                            <TableCell className="text-[10px] text-muted-foreground font-black text-center uppercase tracking-widest">{s.unit}</TableCell>
                                                                            <TableCell className="text-right text-[10px] font-mono font-bold text-primary">${s.price.toFixed(2)}</TableCell>
                                                                            <TableCell className="text-center">
                                                                                <div className="w-24 h-9 bg-card border border-accent rounded flex items-center justify-center font-mono text-xs text-primary mx-auto">
                                                                                    {s.quantity.toFixed(4)}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-mono font-bold text-primary px-6">${s.subtotal.toFixed(2)}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </div>
                                                </TabsContent>

                                                <TabsContent value="calidad" className="m-0 p-6 space-y-6 outline-none">
                                                    <div className="flex items-center justify-between mb-4 p-4 rounded-xl border border-accent">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-primary/20 rounded-lg">
                                                                <ClipboardCheck className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black uppercase tracking-widest text-primary leading-none">Verificación Técnica</p>
                                                                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Defina los criterios de aceptación para esta partida.</p>
                                                            </div>
                                                        </div>
                                                        <div className='flex items-center gap-3'>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="h-9 border-accent text-primary text-[10px] font-black uppercase tracking-widest px-4 hover:bg-accent cursor-pointer"
                                                                onClick={handlePrintQuality}
                                                            >
                                                                <Printer className="h-3.5 w-3.5 mr-2" /> Protocolo
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {selectedItem.qualityControls?.length > 0 ? (
                                                        <div className="space-y-6">
                                                            {selectedItem.qualityControls.map((qc: any, idx: number) => (
                                                                <Card key={qc.id} className="bg-card border border-accent overflow-hidden">
                                                                    <div className="p-4 bg-card border-b border-accent flex items-center gap-4">
                                                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                                                                            {idx + 1}
                                                                        </div>
                                                                        <span className="font-bold text-primary uppercase text-sm">{qc.description}</span>
                                                                    </div>
                                                                    <div className="p-4 space-y-3">
                                                                        {qc.subPoints?.map((sp: any) => (
                                                                            <div key={sp.id} className="flex items-center gap-3 pl-4">
                                                                                <div className="h-4 w-4 rounded border border-accent" />
                                                                                <span className="text-xs text-muted-foreground uppercase">{sp.description}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground text-center gap-4 bg-card border border-accent rounded-2xl border-dashed">
                                                            <ClipboardCheck className="h-16 w-16 opacity-5" />
                                                            <p className="font-bold  uppercase text-xs tracking-[0.2em]">Sin Protocolo de Calidad Registrado</p>
                                                            <p className="text-[10px] uppercase font-black tracking-widest opacity-30">Los criterios de aceptación se gestionan en la librería maestro.</p>
                                                        </div>
                                                    )}
                                                </TabsContent>
                                            </div>
                                        </ScrollArea>
                                    </Tabs>
                                </div>
                            </ScrollArea>
                            <div className="p-6 border-t border-accent bg-card flex justify-end items-center gap-4 shrink-0">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsDetailOpen(false)}
                                    className="text-[10px] font-black uppercase tracking-widest hover:bg-accent text-muted-foreground hover:text-primary cursor-pointer"
                                >
                                    CERRAR DETALLE
                                </Button>
                                <Button className="bg-primary hover:bg-primary/90 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11 cursor-pointer" onClick={() => handlePrintItem(selectedItem)}>
                                    <Printer className="mr-2 h-4 w-4" /> IMPRIMIR APU
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
