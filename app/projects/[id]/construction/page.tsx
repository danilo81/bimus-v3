// "use client";

// import { useParams, useRouter } from 'next/navigation';
// import { useEffect, useState, useMemo, useCallback } from 'react';
// import { Project, ConstructionItem, ProjectConfig, Supply, Contact } from '../../../../lib/types';
// import {
//     getProjectById,
//     updateProjectItem,
//     removeProjectItem,
//     addProjectItem,
//     updateProject as updateProjectAction,
//     customizeProjectItem,
//     createProjectChangeOrder,
//     updateProjectItemProgress,
//     createSiteLogEntry,
//     createProjectPayroll,
//     batchUpdateProjectItemProgress
// } from '../../actions';
// import { useAuth } from '../../../../hooks/use-auth';
// import {
//     Hammer,
//     ChevronLeft,
//     Calculator,
//     Coins,
//     Activity,
//     Search,
//     Plus,
//     MoreVertical,
//     Eye,
//     TrendingUp,
//     Info,
//     Loader2,
//     Save,
//     DollarSign,
//     Download,
//     CalendarDays,
//     Trash2,
//     X,
//     Package,
//     ArrowRight,
//     Users as UsersIcon,
//     ClipboardCheck,
//     Wrench,
//     FileText,
//     PlusCircle,
//     Edit,
//     CheckCircle2,
//     FileSignature,
//     ListChecks,
//     BarChart3,
//     BookOpen,
//     Send,
//     Users,
//     Layers,
//     MapPin,
//     Calendar,
//     Building2,
//     Ruler,
//     Printer,
//     UserPlus,
//     Clock,
//     Check,
//     AlertTriangle,
//     ArrowUpCircle,
//     History,
//     Banknote,
//     ZoomIn,
//     ZoomOut,
//     Box
// } from 'lucide-react';
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger
// } from '../../../../components/ui/dropdown-menu';
// import {
//     Accordion,
//     AccordionContent,
//     AccordionItem,
//     AccordionTrigger,
// } from "../../../../components/ui/accordion";
// import { Button } from '../../../../components/ui/button';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
// import { Input } from '../../../../components/ui/input';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle
// } from '../../../../components/ui/dialog';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "../../../../components/ui/select";
// import { Badge } from '../../../../components/ui/badge';
// import { Separator } from '../../../../components/ui/separator';
// import { Label } from '../../../../components/ui/label';
// import { Checkbox } from '../../../../components/ui/checkbox';
// import { useToast } from '../../../../hooks/use-toast';
// import { getConstructionItems } from '../../../../app/library/construction/items/actions';
// import { getSupplies } from '../../../../app/library/construction/supplies/actions';
// import { ScrollArea, ScrollBar } from '../../../../components/ui/scroll-area';
// import { cn } from '../../../../lib/utils';
// import { Textarea } from '../../../../components/ui/textarea';
// import { Progress } from '../../../../components/ui/progress';
// import { eachDayOfInterval, format, isSameDay, addDays, differenceInDays } from 'date-fns';
// import { es } from 'date-fns/locale';
// import {
//     GanttProvider,
//     GanttSidebar,
//     GanttSidebarGroup,
//     GanttSidebarItem,
//     GanttTimeline,
//     GanttHeader,
//     GanttFeatureList,
//     GanttFeatureRow,
//     GanttToday,
//     Range,
//     GanttFeature
// } from '../../../../components/kibo-ui/gantt';

// interface ComputationRow {
//     id: string;
//     chapter: string;
//     desc: string;
//     unit: string;
//     values: number[];
//     total: number;
//     unitPrice: number;
//     supplies?: any[];
//     progress?: number;
//     qualityControls?: any[];
// }

// const calculateAPU = (supplies: any[], config: any) => {
//     if (!config) return { totalUnit: 0, matSub: 0, labSub: 0, cSociales: 0, ivaMO: 0, equSub: 0, toolWear: 0, directCost: 0, adm: 0, utility: 0, it: 0 };

//     const matSub = supplies.filter((s: any) => s.supply.typology === 'Material' || s.supply.typology === 'Insumo').reduce((acc: number, s: any) => acc + (s.quantity * s.supply.price || 0), 0);
//     const labSub = supplies.filter((s: any) => s.supply.typology === 'Mano de Obra' || s.supply.typology === 'Honorario').reduce((acc: number, s: any) => acc + (s.quantity * s.supply.price || 0), 0);
//     const equSub = supplies.filter((s: any) => s.supply.typology === 'Equipo' || s.supply.typology === 'Herramienta').reduce((acc: number, s: any) => acc + (s.quantity * s.supply.price || 0), 0);

//     const cSociales = labSub * (Number(config.socialCharges || 0) / 100);
//     const ivaMO = (labSub + cSociales) * (Number(config.iva || 0) / 100);
//     const toolWear = labSub * (Number(config.toolWear || 0) / 100);

//     const directCost = matSub + labSub + cSociales + ivaMO + equSub + toolWear;

//     const adm = directCost * (Number(config.adminExpenses || 0) / 100);
//     const utility = (directCost + adm) * (Number(config.utility || 0) / 100);
//     const it = (directCost + adm + utility) * (Number(config.it || 0) / 100);

//     const totalUnit = directCost + adm + utility + it;

//     return {
//         matSub, labSub, cSociales, ivaMO, equSub, toolWear, directCost, adm, utility, it, totalUnit
//     };
// };

// export default function ConstructionPage() {
//     const params = useParams();
//     const router = useRouter();
//     const { user } = useAuth();
//     const { toast } = useToast();
//     const [project, setProject] = useState<any | null>(null);
//     const [selectedItem, setSelectedItem] = useState<any | null>(null);
//     const [isDetailOpen, setIsDetailOpen] = useState(false);

//     // Execution Technical Detail Modal
//     const [isExecutionItemDetailOpen, setIsExecutionItemDetailOpen] = useState(false);
//     const [selectedExecutionItem, setSelectedExecutionItem] = useState<any>(null);

//     const [isAddComputoOpen, setIsAddComputoOpen] = useState(false);
//     const [isChangeOrderOpen, setIsChangeOrderOpen] = useState(false);
//     const [isAvanceModalOpen, setIsAvanceModalOpen] = useState(false);
//     const [isLibroModalOpen, setIsLibroModalOpen] = useState(false);
//     const [isPlanillaModalOpen, setIsPlanillaModalOpen] = useState(false);
//     const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
//     const [isPayrollHistoryModalOpen, setIsPayrollHistoryModalOpen] = useState(false);
//     const [changeOrderReason, setChangeOrderReason] = useState('');
//     const [computations, setComputations] = useState<ComputationRow[]>([]);

//     const [searchTermComputo, setSearchTermComputo] = useState('');
//     const [searchTermPresupuesto, setSearchTermPresupuesto] = useState('');
//     const [searchTermEjecucion, setSearchTermEjecucion] = useState('');
//     const [librarySearchTerm, setLibrarySearchTerm] = useState('');
//     const [selectedLibraryItems, setSelectedLibraryItems] = useState<string[]>([]);
//     const [isEditingAPU, setIsEditingAPU] = useState(false);

//     const [libraryItems, setLibraryItems] = useState<ConstructionItem[]>([]);
//     const [masterSupplies, setMasterSupplies] = useState<Supply[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSaving, setIsSaving] = useState(false);
//     const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
//     const [isMounted, setIsMounted] = useState(false);

//     // Gantt State
//     const [ganttRange, setGanttRange] = useState<Range>("monthly");
//     const [ganttZoom, setGanttZoom] = useState(100);

//     // Permissions check
//     const isAuthor = useMemo(() => user?.id === project?.authorId, [user?.id, project?.authorId]);

//     // Avance State (Batch mode with level details)
//     const [batchLevelProgress, setBatchLevelProgress] = useState<Record<string, Record<string, string>>>({});

//     const fetchProjectData = useCallback(async () => {
//         const id = params?.id;
//         const cleanId = Array.isArray(id) ? id[0] : id;

//         if (!cleanId || cleanId === 'undefined') return;

//         setIsLoading(true);
//         try {
//             const found = await getProjectById(cleanId as string);
//             if (found) {
//                 setProject(found as any);

//                 const projectLevels = (found.levels as any[]) || [];
//                 const projectItems = (found.items as any[]) || [];
//                 const config = found.config || {};

//                 const initialComputations = projectItems.map(pi => {
//                     const levelQuantities = pi.levelQuantities || [];
//                     const values = projectLevels.map((lvl: any) => {
//                         const lq = levelQuantities.find((q: any) => q.levelId === lvl.id);
//                         return lq ? Number(lq.quantity) : 0;
//                     });

//                     const supplies = pi.item?.supplies || [];
//                     const apu = calculateAPU(supplies, config);

//                     return {
//                         id: pi.item.id,
//                         chapter: pi.item.chapter,
//                         desc: pi.item.description,
//                         unit: pi.item.unit,
//                         values: values,
//                         total: Number(pi.quantity) || 0,
//                         unitPrice: apu.totalUnit,
//                         supplies: pi.item.supplies || [],
//                         progress: Number(pi.progress) || 0,
//                         qualityControls: pi.item.qualityControls || []
//                     };
//                 });
//                 setComputations(initialComputations);
//             }
//         } catch (error) {
//             console.error("Error loading project:", error);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [params?.id]);

//     const fetchLibraryItems = useCallback(async () => {
//         if (!user?.id) return;
//         setIsLoadingLibrary(true);
//         try {
//             const items = await getConstructionItems(user.id);
//             setLibraryItems(items as unknown as ConstructionItem[]);
//         } catch (error) {
//             console.error("Error loading library items:", error);
//         } finally {
//             setIsLoadingLibrary(false);
//         }
//     }, [user?.id]);

//     const fetchMasterSupplies = useCallback(async () => {
//         if (!user?.id) return;
//         try {
//             const res = await getSupplies(user.id);
//             setMasterSupplies(res as any);
//         } catch (e) {
//             console.error(e);
//         }
//     }, [user?.id]);

//     useEffect(() => {
//         setIsMounted(true);
//     }, []);

//     useEffect(() => {
//         if (isMounted) {
//             fetchProjectData();
//         }
//     }, [isMounted, fetchProjectData]);

//     const filteredLibraryItems = useMemo(() => {
//         return libraryItems.filter(item =>
//             item.description.toLowerCase().includes(librarySearchTerm.toLowerCase()) ||
//             item.chapter.toLowerCase().includes(librarySearchTerm.toLowerCase())
//         );
//     }, [libraryItems, librarySearchTerm]);

//     useEffect(() => {
//         if (isAddComputoOpen && libraryItems.length === 0) {
//             fetchLibraryItems();
//         }
//     }, [isAddComputoOpen, libraryItems.length, fetchLibraryItems]);

//     useEffect(() => {
//         if (isEditingAPU && masterSupplies.length === 0) {
//             fetchMasterSupplies();
//         }
//     }, [isEditingAPU, masterSupplies.length, fetchMasterSupplies]);

//     const handleViewDetail = (item: any) => {
//         setSelectedItem(item);
//         setIsDetailOpen(true);
//     };

//     const handleViewExecutionDetail = (feature: GanttFeature) => {
//         const computation = computations.find(c => c.id === feature.id);
//         if (computation) {
//             setSelectedExecutionItem({
//                 ...computation,
//                 gantt: feature
//             });
//             setIsExecutionItemDetailOpen(true);
//         }
//     };

//     const handleValueChange = (rowIndex: number, levelIndex: number, newValue: string) => {
//         const val = parseFloat(newValue) || 0;
//         setComputations(prev => {
//             const updated = [...prev];
//             const newValues = [...updated[rowIndex].values];
//             newValues[levelIndex] = val;
//             updated[rowIndex] = {
//                 ...updated[rowIndex],
//                 values: newValues,
//                 total: newValues.reduce((acc, curr) => acc + curr, 0)
//             };
//             return updated;
//         });
//     };

//     const handleSaveComputos = async () => {
//         if (!project || !project.levels) return;
//         setIsSaving(true);
//         try {
//             const projectLevels = project.levels;
//             for (const row of computations) {
//                 const levelData = row.values.map((val, idx) => ({
//                     levelId: projectLevels[idx].id,
//                     quantity: val
//                 }));

//                 const result = await updateProjectItem(project.id, row.id, row.total, levelData);
//                 if (result && (result as any).error) throw new Error((result as any).error);
//             }
//             toast({
//                 title: "Cómputos guardados",
//                 description: "Las cantidades han sido actualizadas exitosamente.",
//             });
//             await fetchProjectData();
//         } catch (error: any) {
//             console.error("Error saving computations:", error);
//             toast({
//                 title: "Error al guardar",
//                 description: error.message || "No se pudieron actualizar todas las cantidades.",
//                 variant: "destructive"
//             });
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     const handleConsolidate = async () => {
//         if (!project || !isAuthor) return;
//         if (!confirm('¿Desea CONSOLIDAR los cómputos métricos? Esta acción bloqueará la edición para los colaboradores técnicos y marcará el presupuesto como final.')) return;

//         setIsSaving(true);
//         try {
//             const result = await updateProjectAction(project.id, { status: 'construccion' });
//             if (result && result.success) {
//                 toast({
//                     title: "Proyecto Consolidado",
//                     description: "Los cómputos han sido bloqueados para el equipo externo."
//                 });
//                 await fetchProjectData();
//             } else {
//                 throw new Error("Fallo al actualizar el estado del proyecto.");
//             }
//         } catch (error: any) {
//             toast({
//                 title: "Error",
//                 description: error.message,
//                 variant: "destructive"
//             });
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     const handleProcessChangeOrder = async () => {
//         if (!project || !changeOrderReason.trim()) {
//             toast({ title: "Error", description: "Debe ingresar el motivo de la orden.", variant: "destructive" });
//             return;
//         }
//         setIsSaving(true);
//         try {
//             const levelIds = project.levels.map((l: any) => l.id);
//             const dataToProcess = computations.map(row => ({
//                 id: row.id,
//                 total: row.total,
//                 values: row.values,
//                 levelIds: levelIds
//             }));

//             const result = await createProjectChangeOrder(project.id, changeOrderReason, dataToProcess);
//             if (result && result.success) {
//                 toast({ title: "Orden de Cambio Ejecutada", description: "Se ha registrado el respaldo en la bitácora." });
//                 setIsChangeOrderOpen(false);
//                 setChangeOrderReason('');
//                 fetchProjectData();
//             } else {
//                 throw new Error((result as any).error);
//             }
//         } catch (e: any) {
//             toast({ title: "Error", description: e.message, variant: "destructive" });
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     const handlePrintComputos = () => {
//         if (!project) return;

//         const printWindow = window.open('', '_blank');
//         if (!printWindow) return;

//         const levels = project.levels || [];

//         const headerCells = levels.map((l: any) => `<th style="border: 1px solid #ddd; padding: 8px; font-size: 9px; text-transform: uppercase;">${l.name}</th>`).join('');

//         const rows = computations.map((row) => {
//             const levelCells = row.values.map(val => `<td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center; font-family: monospace;">${val > 0 ? val.toFixed(2) : '-'}</td>`).join('');
//             return `
//                 <tr>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 9px; font-family: monospace;">${row.id.slice(-6).toUpperCase()}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; font-weight: bold;">${row.desc}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${row.unit}</td>
//                     ${levelCells}
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: 900; background: #f9f9f9;">${row.total.toFixed(2)}</td>
//                 </tr>
//             `;
//         }).join('');

//         const html = `
//             <html>
//                 <head>
//                     <title>Cómputos Métricos - ${project.title}</title>
//                     <style>
//                         body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #333; line-height: 1.4; }
//                         .report-header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
//                         .brand { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; }
//                         .report-title { font-size: 12px; font-weight: 900; text-transform: uppercase; margin: 0; color: #666; }
//                         table { width: 100%; border-collapse: collapse; margin-top: 10px; }
//                         th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 10px 8px; text-align: left; font-size: 9px; font-weight: 900; text-transform: uppercase; }
//                         .project-info { margin-bottom: 20px; font-size: 11px; }
//                         @media print { body { padding: 0; } @page { size: landscape; margin: 1cm; } }
//                     </style>
//                 </head>
//                 <body>
//                     <div class="report-header">
//                         <div>
//                             <h1 class="brand">BIMUS</h1>
//                             <p style="font-size: 8px; font-weight: bold; margin: 0; letter-spacing: 1px;">ARQUITECTURA Y CONSTRUCCIÓN</p>
//                         </div>
//                         <div style="text-align: right;">
//                             <h2 class="report-title">PLANILLA DE CÓMPUTOS MÉTRICOS</h2>
//                             <p style="font-size: 9px; margin: 0;">FECHA: ${new Date().toLocaleDateString('es-ES')}</p>
//                         </div>
//                     </div>
//                     <div class="project-info">
//                         <strong>PROYECTO:</strong> ${project.title}<br>
//                         <strong>UBICACIÓN:</strong> ${project.location || 'N/A'}<br>
//                         <strong>CLIENTE:</strong> ${project.client || 'N/A'}
//                     </div>
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>ID</th>
//                                 <th>Descripción de Partida</th>
//                                 <th>Und.</th>
//                                 ${headerCells}
//                                 <th style="text-align: right;">Total</th>
//                             </tr>
//                         </thead>
//                         <tbody>${rows}</tbody>
//                     </table>
//                     <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
//                 </body>
//             </html>
//         `;
//         printWindow.document.write(html);
//         printWindow.document.close();
//     };

//     const handlePrintPresupuesto = () => {
//         if (!project) return;

//         const printWindow = window.open('', '_blank');
//         if (!printWindow) return;

//         const exchangeRate = project.config?.exchangeRate || 1;
//         const mainCurr = project.config?.mainCurrency || 'BS';
//         const secCurr = project.config?.secondaryCurrency || 'USD';

//         const rows = budgetItems.map((row) => {
//             return `
//                 <tr>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 9px; font-family: monospace;">${row.id.slice(-6).toUpperCase()}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">${row.desc}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${row.unit}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">${row.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">${row.qty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: 900;">${row.totalRow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; color: #666;">${row.totalRowSec.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
//                 </tr>
//             `;
//         }).join('');

//         const html = `
//             <html>
//                 <head>
//                     <title>Presupuesto General - ${project.title}</title>
//                     <style>
//                         body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
//                         .header { border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
//                         .brand { font-size: 32px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: -1px; }
//                         .report-title { font-size: 14px; font-weight: 900; text-transform: uppercase; margin: 0; color: #444; }
//                         table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//                         th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; }
//                         .summary-totals { margin-top: 40px; border-top: 2px solid #000; padding-top: 20px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
//                         .total-line { display: flex; gap: 30px; align-items: baseline; }
//                         .total-label { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #666; }
//                         .total-value { font-size: 24px; font-weight: 900; color: #000; }
//                         .sec-total { font-size: 16px; font-weight: 700; color: #888; }
//                         @media print { body { padding: 0; } @page { margin: 1.5cm; } }
//                     </style>
//                 </head>
//                 <body>
//                     <div class="header">
//                         <div>
//                             <h1 class="brand">BIMUS</h1>
//                             <p style="font-size: 10px; font-weight: bold; margin: 0; letter-spacing: 2px;">ARQUITECTURA Y CONSTRUCCIÓN</p>
//                         </div>
//                         <div style="text-align: right;">
//                             <h2 class="report-title">PRESUPUESTO GENERAL DE OBRA</h2>
//                             <p style="font-size: 10px; margin: 0;">FECHA: ${new Date().toLocaleDateString('es-ES')}</p>
//                         </div>
//                     </div>
//                     <div style="margin-bottom: 30px; font-size: 12px;">
//                         <strong>PROYECTO:</strong> ${project.title.toUpperCase()}<br>
//                         <strong>CLIENTE:</strong> ${project.client?.toUpperCase() || 'N/A'}<br>
//                         <strong>UBICACIÓN:</strong> ${project.location?.toUpperCase() || 'N/A'}<br>
//                         <strong>ÁREA:</strong> ${project.area ? project.area.toLocaleString() : '-'} M²
//                     </div>
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>ID</th>
//                                 <th>Descripción de Partida</th>
//                                 <th>Und.</th>
//                                 <th style="text-align: right;">P. Unit.</th>
//                                 <th style="text-align: right;">Cant.</th>
//                                 <th style="text-align: right;">Total (${mainCurr})</th>
//                                 <th style="text-align: right;">Total (${secCurr})</th>
//                             </tr>
//                         </thead>
//                         <tbody>${rows}</tbody>
//                     </table>
//                     <div class="summary-totals">
//                         <div class="total-line">
//                             <span class="total-label">Presupuesto Total (${mainCurr})</span>
//                             <span class="total-value">${budgetTotals.totalGeneral.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
//                         </div>
//                         <div class="total-line">
//                             <span class="total-label">Equivalente (${secCurr})</span>
//                             <span class="sec-total">${(budgetTotals.totalGeneral / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
//                         </div>
//                     </div>
//                     <div style="margin-top: 100px; display: flex; justify-content: space-around;">
//                         <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA RESPONSABLE DE OBRA</div>
//                         <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA SUPERVISIÓN / CLIENTE</div>
//                     </div>
//                     <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
//                 </body>
//             </html>
//         `;
//         printWindow.document.write(html);
//         printWindow.document.close();
//     };

//     const handlePrintEjecucion = () => {
//         if (!project) return;

//         const printWindow = window.open('', '_blank');
//         if (!printWindow) return;

//         const rows = executionItems.map((row) => {
//             return `
//                 <tr>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 9px; font-family: monospace;">${row.id.slice(-6).toUpperCase()}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">${row.desc}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${row.unit}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">${row.total.toFixed(2)}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: bold; color: #10b981;">${row.progress.toFixed(2)}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: bold; color: #f59e0b;">${row.balance.toFixed(2)}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: 900;">$${row.financialProgress.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${row.percentage.toFixed(1)}%</td>
//                 </tr>
//             `;
//         }).join('');

//         const html = `
//             <html>
//                 <head>
//                     <title>Reporte de Avance - ${project.title}</title>
//                     <style>
//                         body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
//                         .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 30px; }
//                         .brand { font-size: 32px; font-weight: 900; text-transform: uppercase; margin: 0; }
//                         table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//                         th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
//                         .summary { margin-top: 30px; display: flex; justify-content: flex-end; gap: 40px; }
//                         .sum-item { text-align: right; }
//                         .sum-label { font-size: 10px; font-weight: 900; color: #666; text-transform: uppercase; }
//                         .sum-value { font-size: 18px; font-weight: 900; }
//                     </style>
//                 </head>
//                 <body>
//                     <div class="header">
//                         <div>
//                             <h1 class="brand">BIMUS</h1>
//                             <p style="font-size: 10px; font-weight: bold; margin: 0;">ARQUITECTURA Y CONSTRUCCIÓN</p>
//                         </div>
//                         <div style="text-align: right;">
//                             <h2 style="font-size: 14px; font-weight: 900; margin: 0;">CERTIFICACIÓN DE AVANCE FÍSICO</h2>
//                             <p style="font-size: 10px; margin: 0;">FECHA: ${new Date().toLocaleDateString('es-ES')}</p>
//                         </div>
//                     </div>
//                     <div style="margin-bottom: 30px; font-size: 12px;">
//                         <strong>PROYECTO:</strong> ${project.title.toUpperCase()}<br>
//                         <strong>CLIENTE:</strong> ${project.client?.toUpperCase() || 'N/A'}<br>
//                         <strong>AVANCE GLOBAL:</strong> ${budgetTotals.totalGeneral > 0 ? ((budgetTotals.totalAvance / budgetTotals.totalGeneral) * 100).toFixed(1) : '0.0'}%
//                     </div>
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>ID</th>
//                                 <th>Descripción Partida</th>
//                                 <th>Und.</th>
//                                 <th style="text-align: right;">Cómputo</th>
//                                 <th style="text-align: right;">Avance</th>
//                                 <th style="text-align: right;">Saldo</th>
//                                 <th style="text-align: right;">Val. Ejecutado</th>
//                                 <th style="text-align: center;">%</th>
//                             </tr>
//                         </thead>
//                         <tbody>${rows}</tbody>
//                     </table>
//                     <div class="summary">
//                         <div class="sum-item">
//                             <div class="sum-label">Total Presupuestado</div>
//                             <div class="sum-value">$${budgetTotals.totalGeneral.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
//                         </div>
//                         <div class="sum-item">
//                             <div class="sum-label">Total Ejecutado</div>
//                             <div class="sum-value" style="color: #10b981;">$${budgetTotals.totalAvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
//                         </div>
//                     </div>
//                     <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
//                 </body>
//             </html>
//         `;
//         printWindow.document.write(html);
//         printWindow.document.close();
//     };

//     const handlePrintCronograma = () => {
//         if (!project || ganttFeatures.length === 0) return;

//         const printWindow = window.open('', '_blank');
//         if (!printWindow) return;

//         const rows = ganttFeatures.map((f) => {
//             const start = format(f.startAt, 'dd/MM/yyyy');
//             const end = f.endAt ? format(f.endAt, 'dd/MM/yyyy') : '-';
//             const duration = f.endAt ? `${differenceInDays(f.endAt, f.startAt)} días` : '-';
//             return `
//                 <tr>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; font-weight: bold;">${f.name}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${start}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${end}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">${duration}</td>
//                     <td style="border: 1px solid #ddd; padding: 8px; font-size: 9px; text-align: center; text-transform: uppercase;">${f.status.name}</td>
//                 </tr>
//             `;
//         }).join('');

//         const html = `
//             <html>
//                 <head>
//                     <title>Cronograma de Obra - ${project.title}</title>
//                     <style>
//                         body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
//                         .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; align-items: flex-end; }
//                         .brand { font-size: 32px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: -1px; }
//                         table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//                         th { background: #f8f8f8; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
//                         @media print { body { padding: 0; } @page { size: portrait; margin: 1.5cm; } }
//                     </style>
//                 </head>
//                 <body>
//                     <div class="header">
//                         <div>
//                             <h1 class="brand">BIMUS</h1>
//                             <p style="font-size: 10px; font-weight: bold; margin: 0; letter-spacing: 2px;">ARQUITECTURA Y CONSTRUCCIÓN</p>
//                         </div>
//                         <div style="text-align: right;">
//                             <h2 style="font-size: 14px; font-weight: 900; margin: 0; text-transform: uppercase;">CRONOGRAMA DE EJECUCIÓN</h2>
//                             <p style="font-size: 9px; margin: 0;">FECHA EMISIÓN: ${new Date().toLocaleDateString('es-ES')}</p>
//                         </div>
//                     </div>
//                     <div style="margin-bottom: 30px; font-size: 12px;">
//                         <strong>PROYECTO:</strong> ${project.title.toUpperCase()}<br>
//                         <strong>INICIO PREVISTO:</strong> ${project.startDate ? new Date(project.startDate).toLocaleDateString() : 'NO DEFINIDO'}
//                     </div>
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>Descripción de Partida</th>
//                                 <th style="text-align: center;">Inicio</th>
//                                 <th style="text-align: center;">Fin</th>
//                                 <th style="text-align: right;">Duración</th>
//                                 <th style="text-align: center;">Estado</th>
//                             </tr>
//                         </thead>
//                         <tbody>${rows}</tbody>
//                     </table>
//                     <div style="margin-top: 100px; display: flex; justify-content: space-around;">
//                         <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA RESPONSABLE DE OBRA</div>
//                         <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA SUPERVISIÓN</div>
//                     </div>
//                     <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
//                 </body>
//             </html>
//         `;
//         printWindow.document.write(html);
//         printWindow.document.close();
//     };

//     const handleBatchSaveAvance = async () => {
//         if (!project) return;

//         const errors: string[] = [];
//         const itemUpdates = [];

//         for (const item of computations) {
//             const levelsData = batchLevelProgress[item.id] || {};
//             let itemTotalIncrement = 0;
//             let detailParts: string[] = [];

//             Object.entries(levelsData).forEach(([levelId, qtyStr]) => {
//                 const qty = parseFloat(qtyStr) || 0;
//                 if (qty < 0) {
//                     errors.push(`La cantidad en "${item.desc}" no puede ser negativa.`);
//                 }

//                 const levelIndex = project.levels.findIndex((l: any) => l.id === levelId);
//                 const computedForLevel = item.values[levelIndex] || 0;

//                 if (qty > (computedForLevel + 0.001)) {
//                     errors.push(`Exceso detectado en "${item.desc}": Ingresó ${qty} pero el cómputo del nivel "${project.levels[levelIndex].name}" es ${computedForLevel}.`);
//                 }

//                 if (qty > 0) {
//                     itemTotalIncrement += qty;
//                     const levelName = project.levels[levelIndex]?.name || 'Nivel';
//                     detailParts.push(`${levelName}: ${qty}`);
//                 }
//             });

//             const remainingBalance = item.total - (item.progress || 0);
//             if (itemTotalIncrement > (remainingBalance + 0.001)) {
//                 errors.push(`Exceso de ejecución en "${item.desc}": El total ingresado (${itemTotalIncrement}) supera el saldo pendiente (${remainingBalance.toFixed(2)}).`);
//             }

//             if (itemTotalIncrement > 0 && errors.length === 0) {
//                 const logDesc = `CERTIFICACIÓN DE AVANCE: Se registró un total de ${itemTotalIncrement} ${item.unit} en la partida "${item.desc}". Detalle por niveles: [${detailParts.join(', ')}].`;
//                 itemUpdates.push({ itemId: item.id, increment: itemTotalIncrement, log: logDesc });
//             }
//         }

//         if (errors.length > 0) {
//             toast({
//                 title: "Validación de Cómputos",
//                 description: errors[0],
//                 variant: "destructive"
//             });
//             return;
//         }

//         if (itemUpdates.length === 0) {
//             toast({ title: "Sin cambios", description: "Ingrese cantidades de avance para procesar." });
//             return;
//         }

//         setIsSaving(true);
//         setBatchLevelProgress({});

//         try {
//             const result = await batchUpdateProjectItemProgress(project.id, itemUpdates);
//             if (result.error) throw new Error(result.error);

//             toast({ title: "Avance Registrado", description: "Se ha actualizado la ejecución física de las partidas con éxito." });
//             setIsAvanceModalOpen(false);
//             await fetchProjectData();
//         } catch (e: any) {
//             toast({ title: "Error", description: e.message, variant: "destructive" });
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     const handleRemoveItem = async (itemId: string) => {
//         if (!project || !confirm('¿Estás seguro de que deseas quitar esta partida del proyecto?')) return;

//         setIsLoading(true);
//         try {
//             const result = await removeProjectItem(project.id, itemId);
//             if (result && result.success) {
//                 toast({
//                     title: "Partida removida",
//                     description: "El ítem ha sido quitado del proyecto.",
//                 });
//                 await fetchProjectData();
//             } else {
//                 throw new Error((result as any)?.error || 'Error desconocido');
//             }
//         } catch (error: any) {
//             toast({
//                 title: "Error",
//                 description: error.message || "No se pudo remover la partida.",
//                 variant: "destructive"
//             });
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleToggleLibraryItem = (id: string) => {
//         setSelectedLibraryItems(prev =>
//             prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
//         );
//     };

//     const handleAddSelectedItems = async () => {
//         if (!project || selectedLibraryItems.length === 0) return;

//         setIsSaving(true);
//         try {
//             for (const itemId of selectedLibraryItems) {
//                 await addProjectItem(project.id, itemId);
//             }

//             toast({
//                 title: "Ítems añadidos",
//                 description: `${selectedLibraryItems.length} partidas han sido vinculadas al proyecto.`,
//             });

//             await fetchProjectData();
//             setIsAddComputoOpen(false);
//             setSelectedLibraryItems([]);
//             setLibrarySearchTerm('');
//         } catch (error) {
//             toast({
//                 title: "Error",
//                 description: "No se pudieron añadir los ítems al proyecto.",
//                 variant: "destructive"
//             });
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     const budgetItems = useMemo(() => {
//         const exchangeRate = project?.config?.exchangeRate || 1;
//         return computations.map(row => {
//             const totalRow = row.total * row.unitPrice;
//             return {
//                 ...row,
//                 qty: row.total,
//                 totalRow: totalRow,
//                 totalRowSec: totalRow / exchangeRate
//             };
//         });
//     }, [computations, project?.config?.exchangeRate]);

//     const budgetTotals = useMemo(() => {
//         const totals = {
//             totalMateriales: 0,
//             totalManoObra: 0,
//             totalCargasSociales: 0,
//             totalIVA: 0,
//             totalEquipo: 0,
//             totalDesgaste: 0,
//             totalGastosAdmin: 0,
//             totalUtilidades: 0,
//             totalIT: 0,
//             totalGeneral: 0,
//             totalAvance: 0
//         };

//         if (!project?.config || !computations) {
//             return totals;
//         }

//         for (const item of computations) {
//             const quantity = item.total;
//             if (quantity === 0) continue;

//             const { matSub, labSub, cSociales, ivaMO, equSub, toolWear, adm, utility, it, totalUnit } = calculateAPU(item.supplies || [], project.config);

//             totals.totalMateriales += matSub * quantity;
//             totals.totalManoObra += labSub * quantity;
//             totals.totalCargasSociales += cSociales * quantity;
//             totals.totalIVA += ivaMO * quantity;
//             totals.totalEquipo += equSub * quantity;
//             totals.totalDesgaste += toolWear * quantity;
//             totals.totalGastosAdmin += adm * quantity;
//             totals.totalUtilidades += utility * quantity;
//             totals.totalIT += it * quantity;
//             totals.totalGeneral += totalUnit * quantity;
//             totals.totalAvance += totalUnit * (item.progress || 0);
//         }

//         return totals;
//     }, [project, computations]);

//     const executionItems = useMemo(() => {
//         return computations.map(row => {
//             const progress = row.progress || 0;
//             const balance = row.total - progress;
//             const percentage = row.total > 0 ? (progress / row.total) * 100 : 0;
//             const financialProgress = progress * row.unitPrice;
//             return {
//                 ...row,
//                 progress,
//                 balance,
//                 percentage,
//                 financialProgress
//             };
//         });
//     }, [computations]);

//     const ganttFeatures = useMemo((): GanttFeature[] => {
//         if (!project || computations.length === 0) return [];
//         const projectStart = project.startDate ? new Date(project.startDate) : new Date();

//         return computations.map((row, idx) => {
//             const startAt = addDays(projectStart, idx * 5);
//             const endAt = addDays(startAt, Math.max(5, Math.ceil(row.total / 10)));

//             return {
//                 id: row.id,
//                 name: row.desc,
//                 startAt,
//                 endAt,
//                 status: {
//                     id: row.progress && row.progress >= row.total ? 'completado' : 'activo',
//                     name: row.progress && row.progress >= row.total ? 'Completado' : 'Activo',
//                     color: row.progress && row.progress >= row.total ? '#10b981' : '#3b82f6'
//                 }
//             };
//         });
//     }, [project, computations]);

//     const apuCalculations = useMemo(() => {
//         if (!selectedItem || !project?.config) return null;

//         const supplies = selectedItem.supplies || [];
//         const config = project.config;

//         const { matSub, labSub, cSociales, ivaMO, equSub, toolWear, directCost, adm, utility, it, totalUnit } = calculateAPU(supplies, config);

//         return {
//             matSub, labSub, cSociales, ivaMO, equSub, toolWear, directCost, adm, utility, it, totalUnit,
//             supplies: supplies.map((s: any) => ({
//                 description: s.supply.description,
//                 unit: s.supply.unit,
//                 quantity: s.quantity,
//                 price: s.supply.price,
//                 subtotal: s.quantity * s.supply.price,
//                 typology: s.supply.typology
//             }))
//         };
//     }, [selectedItem, project]);

//     if (isLoading) {
//         return (
//             <div className="flex flex-col min-h-screen bg-[#050505] items-center justify-center gap-4 h-[50vh]">
//                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
//                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Construcción...</p>
//             </div>
//         );
//     }

//     if (!project && !isLoading) return (
//         <div className="flex flex-col min-h-screen bg-[#050505] items-center justify-center p-8 gap-4 h-[50vh]">
//             <Info className="h-12 w-12 text-muted-foreground opacity-20" />
//             <p className="text-muted-foreground italic uppercase tracking-widest text-[10px]">No se encontró el proyecto.</p>
//             <Button variant="outline" onClick={() => router.push('/projects')}>Volver a Proyectos</Button>
//         </div>
//     );

//     const levels = project?.levels || [];
//     const isConstruccion = project.status === 'construccion';

//     const budgetCards = [
//         { title: "TOTAL MATERIALES", value: budgetTotals.totalMateriales, icon: Package },
//         { title: "TOTAL MANO DE OBRA", value: budgetTotals.totalManoObra, icon: UsersIcon },
//         { title: "TOTAL EQUIPO", value: budgetTotals.totalEquipo, icon: Wrench },
//         { title: "DESGASTE HERR.", value: budgetTotals.totalDesgaste, icon: Activity },
//         { title: "CARGAS SOCIALES", value: budgetTotals.totalCargasSociales, icon: Coins },
//         { title: "IMPUESTO (IVA)", value: budgetTotals.totalIVA, icon: Coins },
//         { title: "GASTOS ADMIN.", value: budgetTotals.totalGastosAdmin, icon: FileText },
//         { title: "UTILIDADES", value: budgetTotals.totalUtilidades, icon: TrendingUp },
//         { title: "IMPUESTO (IT)", value: budgetTotals.totalIT, icon: Coins },
//     ];

//     return (
//         <div className="flex flex-col min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-6">
//             <Tabs defaultValue="computo" className="w-full">
//                 <TabsList className="bg-white/5 border border-white/10 h-12 p-0 rounded-xl overflow-hidden mb-6 flex flex-wrap md:flex-nowrap">
//                     <TabsTrigger value="computo" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none border-r border-white/10 text-xs md:text-sm">
//                         <Calculator className="mr-2 h-4 w-4" /> CÓMPUTO
//                     </TabsTrigger>
//                     <TabsTrigger value="presupuesto" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none border-r border-white/10 text-xs md:text-sm">
//                         <Coins className="mr-2 h-4 w-4" /> PRESUPUESTO
//                     </TabsTrigger>
//                     <TabsTrigger value="cronograma" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none border-r border-white/10 text-xs md:text-sm">
//                         <CalendarDays className="mr-2 h-4 w-4" /> CRONOGRAMA
//                     </TabsTrigger>
//                     <TabsTrigger value="ejecucion" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none text-xs md:text-sm">
//                         <Activity className="mr-2 h-4 w-4" /> EJECUCIÓN
//                     </TabsTrigger>
//                 </TabsList>

//                 <TabsContent value="computo">
//                     <Card className="bg-[#0a0a0a] border-white/10 text-white overflow-hidden shadow-2xl">
//                         <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-7 bg-white/2 border-b border-white/5">
//                             <div>
//                                 <CardTitle className="text-lg font-bold uppercase tracking-tight">Cómputos Métricos</CardTitle>
//                                 <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Cuantificación de actividades por niveles.</CardDescription>
//                             </div>
//                         </CardHeader>
//                         <CardContent className="space-y-4 pt-6">
//                             <div className="flex items-center justify-between gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
//                                 <div className="relative flex-1 max-w-md">
//                                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                                     <Input
//                                         placeholder="Buscar partida..."
//                                         className="pl-10 bg-black/40 border-white/10 h-11 text-xs"
//                                         value={searchTermComputo}
//                                         onChange={(e) => setSearchTermComputo(e.target.value)}
//                                     />
//                                 </div>
//                                 <div className="flex items-center gap-3">
//                                     <Button
//                                         onClick={handlePrintComputos}
//                                         variant="outline"
//                                         className="border-white/10 bg-white/5 text-muted-foreground font-bold text-[10px] uppercase tracking-widest px-4 h-11 rounded-xl hover:bg-white/10 hover:text-white"
//                                     >
//                                         <Printer className="h-4 w-4" />
//                                     </Button>

//                                     {isAuthor && !isConstruccion && (
//                                         <Button
//                                             onClick={handleConsolidate}
//                                             className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl shadow-xl shadow-amber-500/20"
//                                         >
//                                             <CheckCircle2 className="mr-2 h-4 w-4" /> Consolidar Proyecto
//                                         </Button>
//                                     )}

//                                     {isConstruccion && isAuthor && (
//                                         <Button
//                                             onClick={() => setIsChangeOrderOpen(true)}
//                                             className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase tracking-widest px-8 h-11 rounded-xl shadow-xl shadow-amber-500/20"
//                                         >
//                                             <FileSignature className="mr-2 h-4 w-4" /> Orden de Cambio
//                                         </Button>
//                                     )}

//                                     {!isConstruccion && (
//                                         <>
//                                             <Button
//                                                 onClick={handleSaveComputos}
//                                                 disabled={isSaving || computations.length === 0}
//                                                 className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl hover:bg-emerald-500/20"
//                                             >
//                                                 {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
//                                                 Guardar Cambios
//                                             </Button>
//                                             <Button
//                                                 onClick={() => setIsAddComputoOpen(true)}
//                                                 className="bg-primary hover:bg-primary/90 text-white font-bold text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl shadow-lg shadow-primary/20"
//                                             >
//                                                 <Plus className="mr-2 h-4 w-4" /> Añadir Partida
//                                             </Button>
//                                         </>
//                                     )}
//                                 </div>
//                             </div>

//                             <div className="border border-white/5 rounded-xl overflow-x-auto bg-black/20">
//                                 <Table>
//                                     <TableHeader className="bg-white/5">
//                                         <TableRow className="border-white/5 hover:bg-transparent">
//                                             <TableHead className="text-[10px] font-black uppercase whitespace-nowrap px-6 py-4">Item</TableHead>
//                                             <TableHead className="text-[10px] font-black uppercase whitespace-nowrap min-w-62.5">Descripción de Partida</TableHead>
//                                             <TableHead className="text-[10px] font-black uppercase whitespace-nowrap text-center">Unidad</TableHead>
//                                             {levels.map((level: any) => (
//                                                 <TableHead key={level.id} className="text-[10px] font-black uppercase text-center whitespace-nowrap min-w-[100px]">
//                                                     {level.name.toUpperCase()}
//                                                 </TableHead>
//                                             ))}
//                                             <TableHead className="text-[10px] font-black uppercase text-right whitespace-nowrap pr-8">Total</TableHead>
//                                             <TableHead className="text-[10px] font-black uppercase text-right whitespace-nowrap pr-6">Acciones</TableHead>
//                                         </TableRow>
//                                     </TableHeader>
//                                     <TableBody>
//                                         {computations.length > 0 ? (
//                                             computations
//                                                 .filter(row => row.desc.toLowerCase().includes(searchTermComputo.toLowerCase()) || row.chapter.toLowerCase().includes(searchTermComputo.toLowerCase()))
//                                                 .map((row, rowIndex) => (
//                                                     <TableRow key={row.id} className="border-white/5 hover:bg-white/3 transition-colors">
//                                                         <TableCell className="font-mono text-[10px] text-muted-foreground px-6">{row.id.slice(-6).toUpperCase()}</TableCell>
//                                                         <TableCell className="py-4">
//                                                             <div className="flex flex-col">
//                                                                 <span className="text-xs font-bold text-white uppercase">{row.desc}</span>
//                                                                 <span className="text-[9px] text-primary font-black uppercase tracking-tighter">{row.chapter}</span>
//                                                             </div>
//                                                         </TableCell>
//                                                         <TableCell className="text-[10px] text-center font-bold text-muted-foreground uppercase">{row.unit}</TableCell>
//                                                         {row.values.map((val, levelIndex) => (
//                                                             <TableCell key={levelIndex} className="p-1 text-center">
//                                                                 <Input
//                                                                     type="number"
//                                                                     step="0.01"
//                                                                     value={val === 0 ? "" : val}
//                                                                     placeholder="0.00"
//                                                                     onChange={(e) => handleValueChange(rowIndex, levelIndex, e.target.value)}
//                                                                     className="h-9 w-24 bg-white/5 border-white/5 text-xs font-mono text-center mx-auto focus:ring-1 focus:ring-primary text-white"
//                                                                     disabled={isConstruccion}
//                                                                 />
//                                                             </TableCell>
//                                                         ))}
//                                                         <TableCell className="text-xs font-mono text-right font-black text-primary pr-8 bg-primary/5">{(row.total ?? 0).toFixed(2)}</TableCell>
//                                                         <TableCell className="text-right pr-6">
//                                                             <DropdownMenu>
//                                                                 <DropdownMenuTrigger asChild>
//                                                                     <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
//                                                                         <MoreVertical className="h-4 w-4" />
//                                                                     </Button>
//                                                                 </DropdownMenuTrigger>
//                                                                 <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl p-1.5 rounded-xl">
//                                                                     <DropdownMenuItem className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg" onClick={() => handleViewDetail(row)}>
//                                                                         <Calculator className="h-3.5 w-3.5" /> Ver Análisis APU
//                                                                     </DropdownMenuItem>
//                                                                     {isAuthor && !isConstruccion && (
//                                                                         <DropdownMenuItem
//                                                                             className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 rounded-lg"
//                                                                             onClick={() => handleRemoveItem(row.id)}
//                                                                         >
//                                                                             <Trash2 className="h-3.5 w-3.5 text-destructive" /> Quitar del Proyecto
//                                                                         </DropdownMenuItem>
//                                                                     )}
//                                                                 </DropdownMenuContent>
//                                                             </DropdownMenu>
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 ))
//                                         ) : (
//                                             <TableRow>
//                                                 <TableCell colSpan={5} className="text-center py-20 text-muted-foreground text-xs italic">
//                                                     No hay ítems vinculados. Haz clic en "Añadir Partida" para empezar.
//                                                 </TableCell>
//                                             </TableRow>
//                                         )}
//                                     </TableBody>
//                                 </Table>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </TabsContent>

//                 <TabsContent value="presupuesto">
//                     <div className="space-y-6">
//                         <Card className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl p-0 gap-0">
//                             <Accordion type="single" collapsible>
//                                 <AccordionItem value="summary" className="border-none">
//                                     <AccordionTrigger className="px-6 py-6 hover:no-underline flex items-center w-full">
//                                         <div className="flex flex-col text-left flex-1">
//                                             <CardTitle className="text-lg font-bold uppercase tracking-tight">Resumen de Presupuesto</CardTitle>
//                                             <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Desglose detallado de costos operativos.</CardDescription>
//                                         </div>
//                                         <div className="flex items-center gap-3 mr-4">
//                                             <div className="flex flex-col items-end">
//                                                 <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-1">Total Consolidado</span>
//                                                 <div className="flex items-baseline gap-3">
//                                                     <span className="text-xl font-bold text-white uppercase">{project.config?.mainCurrency || 'BS'}</span>
//                                                     <p className="text-3xl font-black text-white tracking-tighter">
//                                                         {budgetTotals.totalGeneral.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                                                     </p>
//                                                 </div>
//                                                 <div className="flex items-center gap-1.5 mt-1 px-3 py-0.5 bg-white/5 rounded-lg border border-white/5">
//                                                     <span className="text-[9px] font-black text-primary uppercase">{project.config?.secondaryCurrency || 'USD'}</span>
//                                                     <span className="text-xs font-mono font-bold text-white/60">
//                                                         {(budgetTotals.totalGeneral / (project.config?.exchangeRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                                                     </span>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </AccordionTrigger>
//                                     <AccordionContent className="px-6 pb-6 border-t border-white/5 bg-black/20">
//                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 py-6">
//                                             {budgetTotals && budgetCards.map((card) => (
//                                                 <div key={card.title} className="flex items-center justify-between border-b border-white/5 pb-3">
//                                                     <div className="flex items-center gap-3">
//                                                         <card.icon className="h-4 w-4 text-primary" />
//                                                         <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.title}</span>
//                                                     </div>
//                                                     <p className="font-mono text-sm font-bold text-white">
//                                                         ${card.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                                                     </p>
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     </AccordionContent>
//                                 </AccordionItem>
//                             </Accordion>
//                         </Card>

//                         <Card className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl">
//                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-white/2 border-b border-white/5">
//                                 <div>
//                                     <CardTitle className="text-lg font-bold uppercase tracking-tight">Presupuesto de Obra</CardTitle>
//                                 </div>
//                                 <div className="flex items-center gap-3">
//                                     <Button
//                                         onClick={handlePrintPresupuesto}
//                                         variant="outline"
//                                         size="sm"
//                                         className="border-white/10 bg-white/5 text-[10px] font-black uppercase px-6 h-9 hover:bg-white/10"
//                                     >
//                                         <Printer className="h-4 w-4" /> Imprimir
//                                     </Button>
//                                     <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-[10px] font-black uppercase px-6 h-9 hover:bg-white/10">
//                                         <Download className="mr-2 h-4 w-4" /> Exportar
//                                     </Button>
//                                 </div>
//                             </CardHeader>
//                             <CardContent className="space-y-4 pt-6">
//                                 <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
//                                     <Table>
//                                         <TableHeader className="bg-white/5">
//                                             <TableRow className="border-white/10 hover:bg-transparent">
//                                                 <TableHead className="text-[10px] font-black uppercase py-4 px-6">Item</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase">Capítulo</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase min-w-[250px]">Descripción</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase text-center">Und.</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase text-right">P. Unit.</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase text-right">Cantidad</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase text-right">Total ({project.config?.mainCurrency || 'BS'})</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase text-right pr-8">Total ({project.config?.secondaryCurrency || 'USD'})</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase text-right pr-6">APU</TableHead>
//                                             </TableRow>
//                                         </TableHeader>
//                                         <TableBody>
//                                             {budgetItems.length > 0 ? (
//                                                 budgetItems
//                                                     .filter((row: any) => row.desc.toLowerCase().includes(searchTermPresupuesto.toLowerCase()) || row.chapter.toLowerCase().includes(searchTermPresupuesto.toLowerCase()))
//                                                     .map((row: any, i: number) => (
//                                                         <TableRow key={i} className="border-white/5 hover:bg-white/3 transition-colors group">
//                                                             <TableCell className="font-mono text-[10px] text-muted-foreground px-6">{row.id.slice(-6).toUpperCase()}</TableCell>
//                                                             <TableCell className="text-[10px] text-primary font-black tracking-tighter whitespace-nowrap">{row.chapter}</TableCell>
//                                                             <TableCell className="py-4">
//                                                                 <span className="text-xs font-bold text-white uppercase">{row.desc}</span>
//                                                             </TableCell>
//                                                             <TableCell className="text-[10px] font-bold text-muted-foreground uppercase text-center">{row.unit}</TableCell>
//                                                             <TableCell className="text-xs font-mono text-right text-muted-foreground font-bold">
//                                                                 ${(row.unitPrice ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                                                             </TableCell>
//                                                             <TableCell className="text-xs font-mono text-right text-white">
//                                                                 {(row.qty ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                                                             </TableCell>
//                                                             <TableCell className="text-xs font-mono text-right text-primary font-black bg-primary/5">
//                                                                 ${(row.totalRow ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                                                             </TableCell>
//                                                             <TableCell className="text-xs font-mono text-right text-muted-foreground pr-8">
//                                                                 ${(row.totalRowSec ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                                                             </TableCell>
//                                                             <TableCell className="text-right pr-6">
//                                                                 <Button
//                                                                     variant="ghost"
//                                                                     size="icon"
//                                                                     className="h-8 w-8 hover:bg-white/10"
//                                                                     onClick={() => handleViewDetail(row)}
//                                                                 >
//                                                                     <Calculator className="h-4 w-4 text-primary" />
//                                                                 </Button>
//                                                             </TableCell>
//                                                         </TableRow>
//                                                     ))
//                                             ) : (
//                                                 <TableRow>
//                                                     <TableCell colSpan={9} className="text-center py-32 text-muted-foreground italic">
//                                                         Sin datos.
//                                                     </TableCell>
//                                                 </TableRow>
//                                             )}
//                                         </TableBody>
//                                     </Table>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     </div>
//                 </TabsContent>

//                 <TabsContent value="cronograma">
//                     <Card className="bg-[#0a0a0a] border-white/10 text-white overflow-hidden shadow-2xl h-[700px] flex flex-col">
//                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-white/2 border-b border-white/5">
//                             <div className="flex items-center gap-4">
//                                 <div className="p-2 bg-primary/20 rounded-lg">
//                                     <CalendarDays className="h-5 w-5 text-primary" />
//                                 </div>
//                                 <div>
//                                     <CardTitle className="text-sm font-black uppercase tracking-widest">Cronograma de Obra (Gantt)</CardTitle>
//                                     <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Planificación temporal de partidas y frentes de trabajo.</CardDescription>
//                                 </div>
//                             </div>
//                             <div className="flex items-center gap-3">
//                                 <Button
//                                     onClick={handlePrintCronograma}
//                                     variant="outline"
//                                     size="sm"
//                                     className="border-white/10 bg-white/5 text-[10px] font-black uppercase px-6 h-9 hover:bg-white/10"
//                                 >
//                                     <Printer className="h-4 w-4 mr-2" /> Imprimir Cronograma
//                                 </Button>
//                                 <div className="flex items-center bg-black/40 rounded-xl border border-white/10 p-1">
//                                     <Button
//                                         variant="ghost"
//                                         size="icon"
//                                         className="h-8 w-8 hover:bg-white/10"
//                                         onClick={() => setGanttZoom(prev => Math.max(50, prev - 10))}
//                                     >
//                                         <ZoomOut className="h-4 w-4" />
//                                     </Button>
//                                     <span className="text-[10px] font-black w-12 text-center">{ganttZoom}%</span>
//                                     <Button
//                                         variant="ghost"
//                                         size="icon"
//                                         className="h-8 w-8 hover:bg-white/10"
//                                         onClick={() => setGanttZoom(prev => Math.min(200, prev + 10))}
//                                     >
//                                         <ZoomIn className="h-4 w-4" />
//                                     </Button>
//                                 </div>
//                                 <Select value={ganttRange} onValueChange={(val: Range) => setGanttRange(val)}>
//                                     <SelectTrigger className="h-10 bg-black/40 border-white/10 text-[10px] font-black uppercase w-32">
//                                         <SelectValue />
//                                     </SelectTrigger>
//                                     <SelectContent className="bg-[#0a0a0a] text-white border-white/10">
//                                         <SelectItem value="daily" className="text-[10px] font-bold uppercase">Diario</SelectItem>
//                                         <SelectItem value="monthly" className="text-[10px] font-bold uppercase">Mensual</SelectItem>
//                                         <SelectItem value="quarterly" className="text-[10px] font-bold uppercase">Trimestral</SelectItem>
//                                     </SelectContent>
//                                 </Select>
//                             </div>
//                         </CardHeader>
//                         <CardContent className="p-0 flex-1 overflow-hidden">
//                             {ganttFeatures.length > 0 ? (
//                                 <GanttProvider range={ganttRange} zoom={ganttZoom}>
//                                     <GanttSidebar>
//                                         <GanttSidebarGroup name="PARTIDAS ACTIVAS">
//                                             {ganttFeatures.map(feature => (
//                                                 <GanttSidebarItem
//                                                     key={feature.id}
//                                                     feature={feature}
//                                                     onSelectItem={() => handleViewExecutionDetail(feature)}
//                                                     className="border-b border-white/5"
//                                                 />
//                                             ))}
//                                         </GanttSidebarGroup>
//                                     </GanttSidebar>
//                                     <GanttTimeline>
//                                         <GanttHeader />
//                                         <GanttFeatureList>
//                                             {ganttFeatures.map(feature => (
//                                                 <GanttFeatureRow
//                                                     key={feature.id}
//                                                     features={[feature]}
//                                                 />
//                                             ))}
//                                         </GanttFeatureList>
//                                         <GanttToday className="bg-primary shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
//                                     </GanttTimeline>
//                                 </GanttProvider>
//                             ) : (
//                                 <div className="flex flex-col items-center justify-center h-full opacity-20 gap-4">
//                                     <CalendarDays className="h-16 w-16" />
//                                     <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay partidas para programar.</p>
//                                 </div>
//                             )}
//                         </CardContent>
//                     </Card>
//                 </TabsContent>

//                 <TabsContent value="ejecucion">
//                     <div className="space-y-6">
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                             <Card className="bg-primary/5 border-primary/20 shadow-xl relative overflow-hidden">
//                                 <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
//                                 <CardHeader className="pb-2">
//                                     <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Avance Global Físico</span>
//                                 </CardHeader>
//                                 <CardContent>
//                                     <div className="flex items-baseline gap-2">
//                                         <p className="text-4xl font-black text-white tracking-tighter">
//                                             {budgetTotals.totalGeneral > 0 ? ((budgetTotals.totalAvance / budgetTotals.totalGeneral) * 100).toFixed(1) : '0.0'}%
//                                         </p>
//                                     </div>
//                                     <div className="mt-4">
//                                         <Progress value={budgetTotals.totalGeneral > 0 ? (budgetTotals.totalAvance / budgetTotals.totalGeneral) * 100 : 0} className="h-1.5 bg-white/5" />
//                                     </div>
//                                 </CardContent>
//                             </Card>

//                             <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-xl relative overflow-hidden">
//                                 <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
//                                 <CardHeader className="pb-2">
//                                     <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Valor Ejecutado</span>
//                                 </CardHeader>
//                                 <CardContent>
//                                     <div className="flex items-baseline gap-2">
//                                         <span className="text-xl font-bold text-emerald-500/50">$</span>
//                                         <p className="text-4xl font-black text-white tracking-tighter">
//                                             {budgetTotals.totalAvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                                         </p>
//                                     </div>
//                                     <p className="text-[9px] font-black text-muted-foreground uppercase mt-2">Certificación técnica actual</p>
//                                 </CardContent>
//                             </Card>

//                             <Card className="bg-blue-500/5 border-blue-500/20 shadow-xl relative overflow-hidden">
//                                 <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
//                                 <CardHeader className="pb-2">
//                                     <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/70">Saldo por Ejecutar</span>
//                                 </CardHeader>
//                                 <CardContent>
//                                     <div className="flex items-baseline gap-2">
//                                         <span className="text-xl font-bold text-blue-500/50">$</span>
//                                         <p className="text-4xl font-black text-white tracking-tighter">
//                                             {(budgetTotals.totalGeneral - budgetTotals.totalAvance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                                         </p>
//                                     </div>
//                                     <p className="text-[9px] font-black text-muted-foreground uppercase mt-2">Pendiente de liberación</p>
//                                 </CardContent>
//                             </Card>
//                         </div>

//                         <Card className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl">
//                             <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-7 bg-white/2 border-b border-white/5">
//                                 <div>
//                                     <CardTitle className="text-lg font-bold uppercase tracking-tight">Seguimiento de Avance Físico</CardTitle>
//                                     <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Control de metrados ejecutados vs programados.</CardDescription>
//                                 </div>
//                                 <div className="flex items-center gap-3">
//                                     <div className="flex items-center gap-2 mr-4">
//                                         <Button
//                                             onClick={handlePrintEjecucion}
//                                             variant="outline"
//                                             className="border-white/10 bg-white/5 text-muted-foreground font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl hover:bg-white/10"
//                                         >
//                                             <Printer className="h-4 w-4" />
//                                         </Button>
//                                         <Button
//                                             onClick={() => setIsPayrollHistoryModalOpen(true)}
//                                             className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-lg shadow-amber-600/10"
//                                         >
//                                             <History className="mr-2 h-4 w-4" /> Historial Planillas
//                                         </Button>
//                                         <Button
//                                             onClick={() => setIsHistoryModalOpen(true)}
//                                             className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-lg shadow-amber-500/10"
//                                         >
//                                             <History className="mr-2 h-4 w-4" /> Historial Avance
//                                         </Button>
//                                         <Button
//                                             onClick={() => setIsPlanillaModalOpen(true)}
//                                             className="bg-blue-500 hover:bg-blue-600 text-white font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-lg"
//                                         >
//                                             <UsersIcon className="mr-2 h-4 w-4" /> Planilla Personal
//                                         </Button>
//                                         <Button
//                                             onClick={() => setIsAvanceModalOpen(true)}
//                                             className="bg-emerald-500 hover:bg-emerald-600 text-black font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-lg"
//                                         >
//                                             <TrendingUp className="mr-2 h-4 w-4" /> Registrar Avance
//                                         </Button>
//                                         <Button
//                                             onClick={() => setIsLibroModalOpen(true)}
//                                             className="bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-lg"
//                                         >
//                                             <BookOpen className="mr-2 h-4 w-4" /> Libro de Obra
//                                         </Button>
//                                     </div>
//                                     <div className="relative w-64">
//                                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
//                                         <Input
//                                             placeholder="Buscar por descripción..."
//                                             className="pl-9 bg-black/40 border-white/10 h-9 text-[10px] uppercase"
//                                             value={searchTermEjecucion}
//                                             onChange={(e) => setSearchTermEjecucion(e.target.value)}
//                                         />
//                                     </div>
//                                 </div>
//                             </CardHeader>
//                             <CardContent className="p-0">
//                                 <div className="border-b border-white/5">
//                                     <Table>
//                                         <TableHeader className="bg-white/5">
//                                             <TableRow className="border-white/5 hover:bg-transparent">
//                                                 <TableHead className="text-[10px] font-black uppercase py-4 px-6">ID Item</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase min-w-[300px]">Partida de Obra</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase text-center">Und.</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase text-right">Cómputo Total</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase text-right">Cant. Avance</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase text-right">Saldo Pendiente</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase text-right pr-8">Avance Financiero</TableHead>
//                                                 <TableHead className="text-[10px] font-black uppercase min-w-[150px] pr-6 text-center">% Ejecución</TableHead>
//                                             </TableRow>
//                                         </TableHeader>
//                                         <TableBody>
//                                             {isLoading ? (
//                                                 <TableRow>
//                                                     <TableCell colSpan={8} className="text-center py-32 text-muted-foreground opacity-50 uppercase text-[10px] font-black tracking-widest">
//                                                         <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
//                                                         Sincronizando Avance Físico...
//                                                     </TableCell>
//                                                 </TableRow>
//                                             ) : executionItems.length > 0 ? (
//                                                 executionItems
//                                                     .filter(item => item.desc.toLowerCase().includes(searchTermEjecucion.toLowerCase()))
//                                                     .map((row, i) => (
//                                                         <TableRow key={`${row.id}-${row.progress}`} className="border-white/5 hover:bg-white/3 transition-colors group">
//                                                             <TableCell className="font-mono text-[10px] text-muted-foreground px-6">{row.id.slice(-6).toUpperCase()}</TableCell>
//                                                             <TableCell className="py-4">
//                                                                 <div className="flex flex-col">
//                                                                     <span className="text-xs font-bold text-white uppercase">{row.desc}</span>
//                                                                     <span className="text-[9px] text-primary/60 font-black uppercase tracking-tighter">{row.chapter}</span>
//                                                                 </div>
//                                                             </TableCell>
//                                                             <TableCell className="text-[10px] font-bold text-muted-foreground uppercase text-center">{row.unit}</TableCell>
//                                                             <TableCell className="text-xs font-mono text-right text-white font-bold">{row.total.toFixed(2)}</TableCell>
//                                                             <TableCell className="text-xs font-mono text-right text-emerald-500 font-black">{row.progress.toFixed(2)}</TableCell>
//                                                             <TableCell className="text-xs font-mono text-right text-amber-500 font-black">
//                                                                 {row.balance.toFixed(2)}
//                                                             </TableCell>
//                                                             <TableCell className="text-xs font-mono text-right text-emerald-500 font-black pr-8">
//                                                                 ${row.financialProgress.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                                                             </TableCell>
//                                                             <TableCell className="pr-6">
//                                                                 <div className="space-y-1.5 w-full max-w-[120px] mx-auto">
//                                                                     <div className="flex justify-between text-[8px] font-black text-muted-foreground">
//                                                                         <span>{row.percentage.toFixed(1)}%</span>
//                                                                     </div>
//                                                                     <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
//                                                                         <div
//                                                                             className={cn("h-full transition-all duration-1000",
//                                                                                 row.percentage >= 100 ? "bg-emerald-500" : row.percentage > 0 ? "bg-primary" : "bg-transparent"
//                                                                             )}
//                                                                             style={{ width: `${Math.min(row.percentage, 100)}%` }}
//                                                                         />
//                                                                     </div>
//                                                                 </div>
//                                                             </TableCell>
//                                                         </TableRow>
//                                                     ))
//                                             ) : (
//                                                 <TableRow>
//                                                     <TableCell colSpan={8} className="text-center py-32 text-muted-foreground italic opacity-20">
//                                                         No hay datos de ejecución registrados.
//                                                     </TableCell>
//                                                 </TableRow>
//                                             )}
//                                         </TableBody>
//                                     </Table>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     </div>
//                 </TabsContent>
//             </Tabs>

//             {/* Ficha Técnica de Seguimiento por Item (Gantt Details) */}
//             <Dialog open={isExecutionItemDetailOpen} onOpenChange={setIsExecutionItemDetailOpen}>
//                 <DialogContent className="min-w-7xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl flex flex-col h-[85vh]">
//                     {selectedExecutionItem && (
//                         <>
//                             <DialogHeader className="p-8 border-b border-white/5 bg-white/2 shrink-0 flex flex-row items-center gap-6 space-y-0">
//                                 <div className="h-16 w-16 rounded-2xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-3xl font-black text-primary uppercase shadow-2xl">
//                                     <Info className="h-8 w-8" />
//                                 </div>
//                                 <div className="flex-1 space-y-1">
//                                     <div className="flex items-center gap-3">
//                                         <Badge className="bg-primary text-black font-black uppercase text-[10px]">{selectedExecutionItem.chapter}</Badge>
//                                         <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50 flex items-center gap-1.5">
//                                             <Clock className="h-3 w-3" /> ID: {selectedExecutionItem.id.slice(-6).toUpperCase()}
//                                         </span>
//                                     </div>
//                                     <DialogTitle className="text-2xl font-black uppercase tracking-tight leading-none mt-1">
//                                         {selectedExecutionItem.desc}
//                                     </DialogTitle>
//                                 </div>
//                                 <Button variant="ghost" size="icon" onClick={() => setIsExecutionItemDetailOpen(false)} className="text-muted-foreground hover:text-white">
//                                     <X className="h-5 w-5" />
//                                 </Button>
//                             </DialogHeader>

//                             <ScrollArea className="flex-1">
//                                 <div className="p-8 space-y-10">
//                                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                                         <Card className="bg-white/2 border-white/5 p-4 space-y-1 shadow-inner">
//                                             <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Cant. Computada</span>
//                                             <p className="text-lg font-black text-white font-mono">{selectedExecutionItem.total.toFixed(2)} <span className="text-[10px] opacity-40">{selectedExecutionItem.unit}</span></p>
//                                         </Card>
//                                         <Card className="bg-white/2 border-white/5 p-4 space-y-1 shadow-inner">
//                                             <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Precio Unitario</span>
//                                             <p className="text-lg font-black text-primary font-mono">${selectedExecutionItem.unitPrice.toFixed(2)}</p>
//                                         </Card>
//                                         <Card className="bg-white/2 border-white/5 p-4 space-y-1 shadow-inner">
//                                             <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Total Partida</span>
//                                             <p className="text-lg font-black text-white font-mono">${(selectedExecutionItem.total * selectedExecutionItem.unitPrice).toLocaleString()}</p>
//                                         </Card>
//                                         <Card className="bg-primary/5 border-primary/20 p-4 space-y-1 shadow-inner">
//                                             <span className="text-[8px] font-black text-primary uppercase tracking-widest">Costo por Día</span>
//                                             <p className="text-lg font-black text-primary font-mono">
//                                                 ${((selectedExecutionItem.total * selectedExecutionItem.unitPrice) / Math.max(1, differenceInDays(selectedExecutionItem.gantt.endAt, selectedExecutionItem.gantt.startAt))).toLocaleString(undefined, { maximumFractionDigits: 2 })}
//                                             </p>
//                                         </Card>
//                                     </div>

//                                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                                         <div className="space-y-6">
//                                             <div className="flex items-center gap-2">
//                                                 <Calendar className="h-4 w-4 text-primary" />
//                                                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Programación Temporal</h3>
//                                             </div>
//                                             <div className="space-y-4 bg-white/2 border border-white/5 p-6 rounded-3xl">
//                                                 <div className="flex justify-between items-center">
//                                                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fecha Inicio</span>
//                                                     <span className="text-xs font-mono font-black text-white uppercase">{format(selectedExecutionItem.gantt.startAt, 'dd MMM yyyy', { locale: es })}</span>
//                                                 </div>
//                                                 <Separator className="bg-white/5" />
//                                                 <div className="flex justify-between items-center">
//                                                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fecha Final</span>
//                                                     <span className="text-xs font-mono font-black text-white uppercase">{format(selectedExecutionItem.gantt.endAt, 'dd MMM yyyy', { locale: es })}</span>
//                                                 </div>
//                                                 <Separator className="bg-white/5" />
//                                                 <div className="flex justify-between items-center">
//                                                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Días de Duración</span>
//                                                     <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-black uppercase text-[10px]">
//                                                         {differenceInDays(selectedExecutionItem.gantt.endAt, selectedExecutionItem.gantt.startAt)} DÍAS NATURALES
//                                                     </Badge>
//                                                 </div>
//                                             </div>

//                                             <div className="flex items-center gap-2">
//                                                 <Activity className="h-4 w-4 text-emerald-500" />
//                                                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estado de Ejecución Física</h3>
//                                             </div>
//                                             <div className="space-y-6 bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl">
//                                                 <div className="flex justify-between items-end">
//                                                     <div>
//                                                         <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest">Avance Actual</span>
//                                                         <p className="text-3xl font-black text-white font-mono mt-1">
//                                                             {selectedExecutionItem.progress?.toFixed(2) || '0.00'}
//                                                             <span className="text-sm opacity-40 ml-1 uppercase">{selectedExecutionItem.unit}</span>
//                                                         </p>
//                                                     </div>
//                                                     <div className="text-right">
//                                                         <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest">Progreso Real</span>
//                                                         <p className="text-3xl font-black text-emerald-500 font-mono mt-1">
//                                                             {((selectedExecutionItem.progress || 0) / selectedExecutionItem.total * 100).toFixed(1)}%
//                                                         </p>
//                                                     </div>
//                                                 </div>
//                                                 <Progress
//                                                     value={(selectedExecutionItem.progress || 0) / selectedExecutionItem.total * 100}
//                                                     className="h-2 bg-white/5"
//                                                 />
//                                                 <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl justify-center">
//                                                     <CheckCircle2 className="h-3 w-3 text-emerald-500" />
//                                                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">ESTADO: {selectedExecutionItem.gantt.status.name}</span>
//                                                 </div>
//                                             </div>
//                                         </div>

//                                         <div className="space-y-6">
//                                             <div className="flex items-center justify-between">
//                                                 <div className="flex items-center gap-2">
//                                                     <UsersIcon className="h-4 w-4 text-blue-400" />
//                                                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Equipo de Trabajo Designado</h3>
//                                                 </div>
//                                                 <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-[9px] font-black">
//                                                     {selectedExecutionItem.supplies?.filter((s: any) => s.supply.typology === 'Mano de Obra' || s.supply.typology === 'Honorario').length || 0} CARGOS
//                                                 </Badge>
//                                             </div>

//                                             <Card className="bg-white/2 border-white/5 overflow-hidden rounded-3xl shadow-2xl">
//                                                 <Table>
//                                                     <TableHeader className="bg-white/5">
//                                                         <TableRow className="border-white/10 hover:bg-transparent">
//                                                             <TableHead className="text-[9px] font-black uppercase py-3 px-6">Especialidad / Cargo</TableHead>
//                                                             <TableHead className="text-[9px] font-black uppercase text-center w-24">Cantidad</TableHead>
//                                                             <TableHead className="text-[9px] font-black uppercase text-right pr-6">Incidencia</TableHead>
//                                                         </TableRow>
//                                                     </TableHeader>
//                                                     <TableBody>
//                                                         {selectedExecutionItem.supplies?.filter((s: any) => s.supply.typology === 'Mano de Obra' || s.supply.typology === 'Honorario').length > 0 ? (
//                                                             selectedExecutionItem.supplies
//                                                                 .filter((s: any) => s.supply.typology === 'Mano de Obra' || s.supply.typology === 'Honorario')
//                                                                 .map((s: any, idx: number) => (
//                                                                     <TableRow key={idx} className="border-white/5 hover:bg-white/5">
//                                                                         <TableCell className="py-3 px-6">
//                                                                             <span className="text-[11px] font-bold text-white uppercase">{s.supply.description}</span>
//                                                                         </TableCell>
//                                                                         <TableCell className="text-center font-mono text-xs text-blue-400 font-black">{s.quantity.toFixed(3)}</TableCell>
//                                                                         <TableCell className="text-right pr-6">
//                                                                             <span className="text-[10px] font-bold text-muted-foreground uppercase">{s.supply.unit} / {selectedExecutionItem.unit}</span>
//                                                                         </TableCell>
//                                                                     </TableRow>
//                                                                 ))
//                                                         ) : (
//                                                             <TableRow>
//                                                                 <TableCell colSpan={3} className="text-center py-12 text-muted-foreground opacity-20 uppercase text-[9px] font-black italic">No se ha designado personal específico.</TableCell>
//                                                             </TableRow>
//                                                         )}
//                                                     </TableBody>
//                                                 </Table>
//                                                 <div className="p-4 bg-blue-500/10 border-t border-blue-500/20 flex justify-between items-center">
//                                                     <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Capacidad Operativa Total</span>
//                                                     <span className="text-xs font-black text-white font-mono">
//                                                         {selectedExecutionItem.supplies?.filter((s: any) => s.supply.typology === 'Mano de Obra' || s.supply.typology === 'Honorario').reduce((acc: number, s: any) => acc + s.quantity, 0).toFixed(3)} PERS.
//                                                     </span>
//                                                 </div>
//                                             </Card>

//                                             <div className="p-6 bg-white/2 border border-white/5 rounded-3xl space-y-3">
//                                                 <div className="flex items-center gap-2 text-muted-foreground/60">
//                                                     <Wrench className="h-3.5 w-3.5" />
//                                                     <span className="text-[9px] font-black uppercase tracking-widest">Maquinaria y Equipo Vinculado</span>
//                                                 </div>
//                                                 <div className="flex flex-wrap gap-2">
//                                                     {selectedExecutionItem.supplies?.filter((s: any) => s.supply.typology === 'Equipo' || s.supply.typology === 'Herramienta').length > 0 ? (
//                                                         selectedExecutionItem.supplies
//                                                             .filter((s: any) => s.supply.typology === 'Equipo' || s.supply.typology === 'Herramienta')
//                                                             .map((s: any, idx: number) => (
//                                                                 <Badge key={idx} variant="outline" className="bg-white/5 border-white/10 text-[8px] font-black uppercase h-6">
//                                                                     {s.supply.description}
//                                                                 </Badge>
//                                                             ))
//                                                     ) : (
//                                                         <span className="text-[9px] font-black text-muted-foreground/30 uppercase italic">Sin equipos mecanizados registrados</span>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </ScrollArea>

//                             <DialogFooter className="p-6 border-t border-white/5 bg-black shrink-0 flex gap-4">
//                                 <Button
//                                     variant="outline"
//                                     className="border-white/10 bg-white/5 text-[10px] font-black uppercase h-12 px-8 hover:bg-white/10"
//                                     onClick={() => handleViewDetail(selectedExecutionItem)}
//                                 >
//                                     <Calculator className="h-4 w-4 mr-2" /> Análisis de Costos APU
//                                 </Button>
//                                 <Button
//                                     className="flex-1 bg-white text-black font-black text-[10px] uppercase h-12 tracking-widest shadow-xl hover:bg-white/90 active:scale-95 transition-all"
//                                     onClick={() => setIsExecutionItemDetailOpen(false)}
//                                 >
//                                     Cerrar Ficha de Seguimiento
//                                 </Button>
//                             </DialogFooter>
//                         </>
//                     )}
//                 </DialogContent>
//             </Dialog>

//             <Dialog open={isChangeOrderOpen} onOpenChange={setIsChangeOrderOpen}>
//                 <DialogContent className="min-w-7xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl flex flex-col h-[90vh]">
//                     <DialogHeader className="p-6 border-b border-white/5 bg-white/2 shrink-0 flex flex-row items-center justify-between space-y-0">
//                         <div className="flex items-center gap-3">
//                             <div className="p-2 bg-amber-500/20 rounded-lg">
//                                 <FileSignature className="h-6 w-6 text-amber-500" />
//                             </div>
//                             <div>
//                                 <DialogTitle className="text-xl font-bold uppercase tracking-tight">Nueva Orden de Cambio</DialogTitle>
//                                 <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
//                                     Modificación técnica de cómputos y partidas post-consolidación
//                                 </DialogDescription>
//                             </div>
//                         </div>
//                         <div className="flex items-center gap-3">
//                             <Button
//                                 onClick={() => setIsAddComputoOpen(true)}
//                                 className="bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase h-10 px-6 rounded-xl"
//                             >
//                                 <Plus className="mr-2 h-4 w-4" /> Adicionar Nueva Partida
//                             </Button>
//                             <Button variant="ghost" size="icon" onClick={() => setIsChangeOrderOpen(false)} className="text-muted-foreground hover:text-white">
//                                 <X className="h-5 w-5" />
//                             </Button>
//                         </div>
//                     </DialogHeader>

//                     <div className="flex-1 overflow-hidden flex flex-col">
//                         <div className="p-6 bg-amber-500/5 border-b border-white/5">
//                             <Label className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-3 block">Justificación Técnica / Motivo de la Modificación</Label>
//                             <Textarea
//                                 value={changeOrderReason}
//                                 onChange={(e) => setChangeOrderReason(e.target.value)}
//                                 placeholder="Describa el motivo técnico del cambio (Ej: Ampliación de muro perimetral sector norte)..."
//                                 className="min-h-[100px] bg-black/40 border-amber-500/20 focus:border-amber-500/50 uppercase text-xs font-bold p-4"
//                             />
//                         </div>

//                         <div className="flex-1 p-6 overflow-hidden flex flex-col">
//                             <div className="flex items-center justify-between mb-4">
//                                 <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Previsualización de Tabla de Cómputos</h3>
//                                 <div className="flex items-center gap-2 text-[9px] font-bold text-amber-500/60 uppercase">
//                                     <Info className="h-3 w-3" /> Los cambios aquí realizados se registrarán en la bitácora oficial.
//                                 </div>
//                             </div>

//                             <div className="flex-1 border border-white/5 rounded-xl overflow-hidden bg-black/20">
//                                 <ScrollArea className="h-full">
//                                     <Table>
//                                         <TableHeader className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
//                                             <TableRow className="border-white/10 hover:bg-transparent">
//                                                 <TableHead className="text-[10px] font-black uppercase py-4 px-6">Descripción de Partida</TableHead>
//                                                 {project.levels.map((lvl: any) => (
//                                                     <TableHead key={lvl.id} className="text-[10px] font-black uppercase text-center">{lvl.name}</TableHead>
//                                                 ))}
//                                                 <TableHead className="text-[10px] font-black uppercase text-right pr-8">Nuevo Total</TableHead>
//                                             </TableRow>
//                                         </TableHeader>
//                                         <TableBody>
//                                             {computations.map((row, rowIndex) => (
//                                                 <TableRow key={row.id} className="border-white/5 hover:bg-white/3 transition-colors">
//                                                     <TableCell className="px-6 py-4">
//                                                         <div className="flex flex-col">
//                                                             <span className="text-xs font-bold text-white uppercase">{row.desc}</span>
//                                                             <span className="text-[9px] text-muted-foreground font-black uppercase opacity-40">{row.unit}</span>
//                                                         </div>
//                                                     </TableCell>
//                                                     {row.values.map((val, lvlIdx) => (
//                                                         <TableCell key={lvlIdx} className="p-1 text-center">
//                                                             <Input
//                                                                 type="number"
//                                                                 step="0.01"
//                                                                 value={val === 0 ? '' : val}
//                                                                 onChange={(e) => handleValueChange(rowIndex, lvlIdx, e.target.value)}
//                                                                 className="h-9 w-24 bg-black border-amber-500/10 text-center font-mono text-xs focus:ring-1 focus:ring-amber-500/50 text-amber-100"
//                                                                 placeholder="0.00"
//                                                             />
//                                                         </TableCell>
//                                                     ))}
//                                                     <TableCell className="text-right pr-8">
//                                                         <span className="font-mono text-xs font-black text-amber-500">{row.total.toFixed(2)}</span>
//                                                     </TableCell>
//                                                 </TableRow>
//                                             ))}
//                                         </TableBody>
//                                     </Table>
//                                 </ScrollArea>
//                             </div>
//                         </div>
//                     </div>

//                     <DialogFooter className="p-6 border-t border-white/5 bg-black shrink-0">
//                         <Button variant="ghost" onClick={() => setIsChangeOrderOpen(false)} className="text-[10px] font-black uppercase tracking-widest h-12 px-8">Cancelar</Button>
//                         <Button
//                             onClick={handleProcessChangeOrder}
//                             disabled={isSaving || !changeOrderReason.trim()}
//                             className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase h-12 px-12 tracking-widest shadow-xl shadow-amber-500/20"
//                         >
//                             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
//                             Autorizar y Ejecutar Orden de Cambio
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>

//             <Dialog open={isAddComputoOpen} onOpenChange={setIsAddComputoOpen}>
//                 <DialogContent className="max-w-4xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl flex flex-col h-[85vh]">
//                     <DialogHeader className="p-6 border-b border-white/5 bg-white/2 shrink-0 flex flex-row items-center justify-between space-y-0">
//                         <div className="flex items-center gap-3">
//                             <div className="p-2 bg-primary/20 rounded-lg">
//                                 <PlusCircle className="h-6 w-6 text-primary" />
//                             </div>
//                             <div>
//                                 <DialogTitle className="text-xl font-bold uppercase tracking-tight">Librería de Partidas Maestro</DialogTitle>
//                                 <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
//                                     Seleccione las actividades técnicas para vincular al proyecto
//                                 </DialogDescription>
//                             </div>
//                         </div>
//                         <Button variant="ghost" size="icon" onClick={() => setIsAddComputoOpen(false)} className="text-muted-foreground hover:text-white">
//                             <X className="h-5 w-5" />
//                         </Button>
//                     </DialogHeader>

//                     <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
//                         <div className="relative shrink-0">
//                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                             <Input
//                                 placeholder="BUSCAR EN EL DIRECTORIO MAESTRO..."
//                                 className="pl-10 h-11 bg-white/5 border-white/10 text-[10px] font-bold uppercase tracking-widest"
//                                 value={librarySearchTerm}
//                                 onChange={(e) => setLibrarySearchTerm(e.target.value)}
//                             />
//                         </div>

//                         <div className="border border-white/10 rounded-xl overflow-hidden flex-1 bg-black/40">
//                             <ScrollArea className="h-full">
//                                 <Table>
//                                     <TableHeader className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
//                                         <TableRow className="border-white/10 hover:bg-transparent">
//                                             <TableHead className="w-12 text-center" />
//                                             <TableHead className="py-4 px-6 text-[10px] font-black uppercase">Capítulo</TableHead>
//                                             <TableHead className="text-[10px) font-black uppercase">Descripción de la Partida</TableHead>
//                                             <TableHead className="text-[10px] font-black uppercase text-center">Unidad</TableHead>
//                                             <TableHead className="text-[10px] font-black uppercase text-right pr-6">Costo Base</TableHead>
//                                         </TableRow>
//                                     </TableHeader>
//                                     <TableBody>
//                                         {isLoadingLibrary ? (
//                                             <TableRow>
//                                                 <TableCell colSpan={5} className="text-center py-20">
//                                                     <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
//                                                 </TableCell>
//                                             </TableRow>
//                                         ) : filteredLibraryItems.length > 0 ? (
//                                             filteredLibraryItems.map((item) => {
//                                                 const isAlreadyAdded = computations.some(c => c.id === item.id);
//                                                 return (
//                                                     <TableRow key={item.id} className={cn("border-white/5 hover:bg-white/5 transition-colors", isAlreadyAdded && "opacity-30 bg-white/1")}>
//                                                         <TableCell className="text-center">
//                                                             <Checkbox
//                                                                 checked={selectedLibraryItems.includes(item.id)}
//                                                                 onCheckedChange={() => handleToggleLibraryItem(item.id)}
//                                                                 disabled={isAlreadyAdded}
//                                                             />
//                                                         </TableCell>
//                                                         <TableCell className="py-4 px-6 text-[10px] font-black text-primary uppercase">{item.chapter}</TableCell>
//                                                         <TableCell className="text-xs font-bold text-white uppercase">{item.description}</TableCell>
//                                                         <TableCell className="text-[10px] font-bold text-muted-foreground uppercase text-center">{item.unit}</TableCell>
//                                                         <TableCell className="text-right pr-6 font-mono text-xs font-black text-emerald-500">${item.total.toFixed(2)}</TableCell>
//                                                     </TableRow>
//                                                 );
//                                             })
//                                         ) : (
//                                             <TableRow>
//                                                 <TableCell colSpan={5} className="text-center py-20 text-muted-foreground text-[10px] font-black uppercase opacity-30">No se encontraron ítems que coincidan con la búsqueda.</TableCell>
//                                             </TableRow>
//                                         )}
//                                     </TableBody>
//                                 </Table>
//                             </ScrollArea>
//                         </div>
//                     </div>

//                     <DialogFooter className="p-6 border-t border-white/5 bg-black shrink-0">
//                         <Button variant="ghost" onClick={() => setIsAddComputoOpen(false)} className="text-[10px] font-black uppercase tracking-widest">Cancelar</Button>
//                         <Button
//                             onClick={handleAddSelectedItems}
//                             disabled={isSaving || selectedLibraryItems.length === 0}
//                             className="bg-primary text-black font-black text-[10px] uppercase h-12 px-12 shadow-xl shadow-primary/20"
//                         >
//                             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
//                             Vincular Seleccionados ({selectedLibraryItems.length})
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>

//             <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
//                 <DialogContent className="sm:max-w-[1000px] w-full max-h-[95vh] overflow-hidden bg-card border-muted/50 p-0 flex flex-col shadow-2xl">
//                     {selectedItem && apuCalculations && (
//                         <div className="flex flex-col h-full overflow-hidden">
//                             <div className="p-6 border-b border-white/5 bg-black/20 flex flex-row items-center gap-4 shrink-0">
//                                 <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
//                                     <Box className="h-6 w-6 text-primary" />
//                                 </div>
//                                 <div className="flex-1">
//                                     <DialogTitle className="text-xl font-bold uppercase tracking-tight text-white leading-none">
//                                         Análisis APU: {selectedItem.desc}
//                                     </DialogTitle>
//                                     <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">
//                                         Análisis de precios unitarios y parámetros de control operativo
//                                     </DialogDescription>
//                                 </div>
//                                 <Button variant="ghost" size="icon" onClick={() => setIsDetailOpen(false)} className="text-muted-foreground hover:text-white">
//                                     <X className="h-5 w-5" />
//                                 </Button>
//                             </div>

//                             <Tabs defaultValue="informacion" className="flex-1 flex flex-col overflow-hidden">
//                                 <div className="px-6 bg-black/10 border-b border-white/5 shrink-0">
//                                     <TabsList className="h-14 bg-transparent p-0 gap-8" variant="line">
//                                         <TabsTrigger value="informacion" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-white">
//                                             Análisis Costos
//                                         </TabsTrigger>
//                                         <TabsTrigger value="calidad" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-white">
//                                             Control de Calidad
//                                         </TabsTrigger>
//                                     </TabsList>
//                                 </div>

//                                 <ScrollArea className="flex-1">
//                                     <div className="flex-1">
//                                         <TabsContent value="informacion" className="m-0 p-6 space-y-8 outline-none">
//                                             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
//                                                 <div className="lg:col-span-7 space-y-6">
//                                                     <div className="space-y-4">
//                                                         <div className="flex items-center gap-2">
//                                                             <Box className="h-4 w-4 text-primary" />
//                                                             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Datos generales</h3>
//                                                         </div>
//                                                         <div className="grid grid-cols-1 gap-4">
//                                                             <div className="space-y-2">
//                                                                 <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Capítulo</Label>
//                                                                 <div className="bg-background/50 border border-white/5 rounded-md h-11 px-3 flex items-center text-white uppercase text-xs font-bold">
//                                                                     {selectedItem.chapter}
//                                                                 </div>
//                                                             </div>
//                                                             <div className="space-y-2">
//                                                                 <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Descripción ítem</Label>
//                                                                 <div className="bg-background/50 border border-white/5 rounded-md h-11 px-3 flex items-center text-white uppercase text-xs font-bold">
//                                                                     {selectedItem.desc}
//                                                                 </div>
//                                                             </div>
//                                                             <div className="grid grid-cols-2 gap-4">
//                                                                 <div className="space-y-2">
//                                                                     <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Unidad</Label>
//                                                                     <div className="bg-background/50 border border-white/5 rounded-md h-11 px-3 flex items-center text-white uppercase text-xs font-bold">
//                                                                         {selectedItem.unit}
//                                                                     </div>
//                                                                 </div>
//                                                                 <div className="space-y-2">
//                                                                     <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Cómputo Total</Label>
//                                                                     <div className="bg-background/50 border border-white/5 rounded-md h-11 px-3 flex items-center text-white font-mono font-bold">
//                                                                         {selectedItem.total.toFixed(2)}
//                                                                     </div>
//                                                                 </div>
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </div>

//                                                 <div className="lg:col-span-5">
//                                                     <div className="bg-[#1a1f2e] border border-blue-500/20 rounded-2xl p-6 h-full flex flex-col justify-between shadow-xl">
//                                                         <div className="space-y-3">
//                                                             {[
//                                                                 { label: 'Total de Materiales', value: apuCalculations.matSub },
//                                                                 { label: 'Mano de Obra', value: apuCalculations.labSub },
//                                                                 { label: 'Cargas Sociales', value: apuCalculations.cSociales },
//                                                                 { label: 'IVA', value: apuCalculations.ivaMO },
//                                                                 { label: 'Equipo', value: apuCalculations.equSub },
//                                                                 { label: 'Desgaste', value: apuCalculations.toolWear },
//                                                                 { label: 'Gastos Administrativos', value: apuCalculations.adm },
//                                                                 { label: 'Utilidades', value: apuCalculations.utility },
//                                                                 { label: 'IT', value: apuCalculations.it },
//                                                             ].map((item, idx) => (
//                                                                 <div key={idx}>
//                                                                     <div className="flex justify-between items-center">
//                                                                         <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/80">{item.label}</span>
//                                                                         <span className="text-white font-mono font-bold text-xs">${item.value.toFixed(2)}</span>
//                                                                     </div>
//                                                                     <Separator className="my-2 border-white/5" />
//                                                                 </div>
//                                                             ))}
//                                                         </div>
//                                                         <div className="flex items-start justify-end gap-8 pt-4">
//                                                             <div className="text-right">
//                                                                 <p className="text-[10px] font-black text-primary uppercase tracking-widest">COSTO DIRECTO</p>
//                                                                 <p className="text-xl font-bold text-white">${apuCalculations.directCost.toFixed(2)}</p>
//                                                             </div>
//                                                             <div className="text-right">
//                                                                 <p className="text-[10px] font-black text-primary uppercase tracking-widest">TOTAL APU</p>
//                                                                 <p className="text-xl font-bold text-white">${apuCalculations.totalUnit.toFixed(2)}</p>
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>

//                                             <Separator className="border-white/10" />

//                                             <div className="space-y-4">
//                                                 <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden min-h-[300px]">
//                                                     <Table>
//                                                         <TableHeader className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
//                                                             <TableRow className="border-white/5 hover:bg-transparent">
//                                                                 <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-6 py-4">Tipo</TableHead>
//                                                                 <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Descripción</TableHead>
//                                                                 <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Unidad</TableHead>
//                                                                 <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right">P. Unitario</TableHead>
//                                                                 <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Cantidad</TableHead>
//                                                                 <TableHead className="text-[10px] font-black uppercase text-right px-6">Subtotal</TableHead>
//                                                             </TableRow>
//                                                         </TableHeader>
//                                                         <TableBody>
//                                                             {apuCalculations.supplies.map((s: any, idx: number) => (
//                                                                 <TableRow key={idx} className="border-white/5 hover:bg-white/2 group transition-colors">
//                                                                     <TableCell className="px-6 py-4">
//                                                                         <div className="p-2 bg-white/5 rounded-lg border border-white/10 w-fit">
//                                                                             {s.typology === 'Material' || s.typology === 'Insumo' ? (
//                                                                                 <Package className="h-4 w-4 text-primary" />
//                                                                             ) : (
//                                                                                 <UsersIcon className="h-4 w-4 text-emerald-500" />
//                                                                             )}
//                                                                         </div>
//                                                                     </TableCell>
//                                                                     <TableCell className="text-xs font-bold text-white uppercase">{s.description}</TableCell>
//                                                                     <TableCell className="text-[10px] text-muted-foreground font-black text-center uppercase tracking-widest">{s.unit}</TableCell>
//                                                                     <TableCell className="text-right text-[10px] font-mono font-bold text-muted-foreground">${s.price.toFixed(2)}</TableCell>
//                                                                     <TableCell className="text-center">
//                                                                         <div className="w-24 h-9 bg-black/40 border border-white/10 rounded flex items-center justify-center font-mono text-xs text-white mx-auto">
//                                                                             {s.quantity.toFixed(4)}
//                                                                         </div>
//                                                                     </TableCell>
//                                                                     <TableCell className="text-right font-mono font-bold text-white px-6">${s.subtotal.toFixed(2)}</TableCell>
//                                                                 </TableRow>
//                                                             ))}
//                                                         </TableBody>
//                                                     </Table>
//                                                 </div>
//                                             </div>
//                                         </TabsContent>

//                                         <TabsContent value="calidad" className="m-0 p-6 space-y-6 outline-none">
//                                             {selectedItem.qualityControls?.length > 0 ? (
//                                                 <div className="space-y-6">
//                                                     {selectedItem.qualityControls.map((qc: any, idx: number) => (
//                                                         <Card key={qc.id} className="bg-white/2 border-white/5 overflow-hidden">
//                                                             <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-4">
//                                                                 <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
//                                                                     {idx + 1}
//                                                                 </div>
//                                                                 <span className="font-bold text-white uppercase text-sm">{qc.description}</span>
//                                                             </div>
//                                                             <div className="p-4 space-y-3">
//                                                                 {qc.subPoints?.map((sp: any) => (
//                                                                     <div key={sp.id} className="flex items-center gap-3 pl-4">
//                                                                         <div className="h-4 w-4 rounded border border-white/20" />
//                                                                         <span className="text-xs text-muted-foreground uppercase">{sp.description}</span>
//                                                                     </div>
//                                                                 ))}
//                                                             </div>
//                                                         </Card>
//                                                     ))}
//                                                 </div>
//                                             ) : (
//                                                 <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground text-center gap-4 bg-black/20 rounded-2xl border border-dashed border-white/5">
//                                                     <ClipboardCheck className="h-16 w-16 opacity-5" />
//                                                     <p className="font-bold text-white uppercase text-xs tracking-[0.2em]">Sin Protocolo de Calidad Registrado</p>
//                                                     <p className="text-[10px] uppercase font-black tracking-widest opacity-30">Los criterios de aceptación se gestionan en la librería maestro.</p>
//                                                 </div>
//                                             )}
//                                         </TabsContent>
//                                     </div>
//                                 </ScrollArea>

//                                 <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end items-center gap-4 shrink-0">
//                                     <Button
//                                         variant="ghost"
//                                         onClick={() => setIsDetailOpen(false)}
//                                         className="text-[10px] font-black uppercase tracking-widest hover:bg-white/5 text-muted-foreground hover:text-white"
//                                     >
//                                         CERRAR DETALLE
//                                     </Button>
//                                     <Button className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest px-8 h-11 shadow-xl shadow-primary/10">
//                                         <Printer className="mr-2 h-4 w-4" /> IMPRIMIR ANÁLISIS
//                                     </Button>
//                                 </div>
//                             </Tabs>
//                         </div>
//                     )}
//                 </DialogContent>
//             </Dialog>
//         </div>
//     );
// }

"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Project, ConstructionItem, ProjectConfig, Supply, Contact, GanttFeature } from '../../../../lib/types';
import {
    getProjectById,
    updateProjectItem,
    removeProjectItem,
    addProjectItem,
    updateProject as updateProjectAction,
    customizeProjectItem,
    createProjectChangeOrder,
    updateProjectItemProgress,
    createSiteLogEntry,
    createProjectPayroll,
    batchUpdateProjectItemProgress
} from '../../actions';
import { useAuth } from '../../../../hooks/use-auth';
import {
    Hammer,
    ChevronLeft,
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
    DollarSign,
    Download,
    CalendarDays,
    Trash2,
    X,
    Package,
    ArrowRight,
    Users as UsersIcon,
    ClipboardCheck,
    Wrench,
    FileText,
    PlusCircle,
    Edit,
    CheckCircle2,
    FileSignature,
    ListChecks,
    BarChart3,
    BookOpen,
    Send,
    Users,
    Layers,
    MapPin,
    Calendar,
    Building2,
    Ruler,
    Printer,
    UserPlus,
    Clock,
    Check,
    AlertTriangle,
    ArrowUpCircle,
    History,
    Banknote,
    ZoomIn,
    ZoomOut,
    Box
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
import { getConstructionItems } from '../../../../app/library/construction/items/actions';
import { getSupplies } from '../../../../app/library/construction/supplies/actions';
import { ScrollArea, ScrollBar } from '../../../../components/ui/scroll-area';
import { cn } from '../../../../lib/utils';
import { Textarea } from '../../../../components/ui/textarea';
import { Progress } from '../../../../components/ui/progress';
import { eachDayOfInterval, format, isSameDay, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    GanttProvider,
    GanttSidebar,
    GanttSidebarGroup,
    GanttSidebarItem,
    GanttTimeline,
    GanttHeader,
    GanttFeatureList,
    GanttFeatureRow,
    GanttToday,
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
    performance?: number;
}

const calculateAPU = (supplies: any[], config: any) => {
    if (!config) return { totalUnit: 0, matSub: 0, labSub: 0, cSociales: 0, ivaMO: 0, equSub: 0, toolWear: 0, directCost: 0, adm: 0, utility: 0, it: 0 };

    const matSub = supplies.filter((s: any) => {
        const typo = s.supply?.typology || s.typology;
        return typo === 'Material' || typo === 'Insumo';
    }).reduce((acc: number, s: any) => acc + (s.quantity * (s.supply?.price || s.price || 0)), 0);

    const labSub = supplies.filter((s: any) => {
        const typo = s.supply?.typology || s.typology;
        return typo === 'Mano de Obra' || typo === 'Honorario';
    }).reduce((acc: number, s: any) => acc + (s.quantity * (s.supply?.price || s.price || 0)), 0);

    const equSub = supplies.filter((s: any) => {
        const typo = s.supply?.typology || s.typology;
        return typo === 'Equipo' || typo === 'Herramienta';
    }).reduce((acc: number, s: any) => acc + (s.quantity * (s.supply?.price || s.price || 0)), 0);

    const cSociales = labSub * (Number(config.socialCharges || 0) / 100);
    const ivaMO = (labSub + cSociales) * (Number(config.iva || 0) / 100);
    const toolWear = labSub * (Number(config.toolWear || 0) / 100);

    const directCost = matSub + labSub + cSociales + ivaMO + equSub + toolWear;

    const adm = directCost * (Number(config.adminExpenses || 0) / 100);
    const utility = (directCost + adm) * (Number(config.utility || 0) / 100);
    const it = (directCost + adm + utility) * (Number(config.it || 0) / 100);

    const totalUnit = directCost + adm + utility + it;

    return {
        matSub, labSub, cSociales, ivaMO, equSub, toolWear, directCost, adm, utility, it, totalUnit
    };
};

export default function ConstructionPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [project, setProject] = useState<any | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

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
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Gantt State
    const [ganttRange, setGanttRange] = useState<Range>("monthly");
    const [ganttZoom, setGanttZoom] = useState(100);

    // Permissions check
    const isAuthor = useMemo(() => user?.id === project?.authorId, [user?.id, project?.authorId]);

    // Avance State (Batch mode with level details)
    const [batchLevelProgress, setBatchLevelProgress] = useState<Record<string, Record<string, string>>>({});

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
                        performance: pi.item.performance || 1
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
            const items = await getConstructionItems(user.id);
            setLibraryItems(items as unknown as ConstructionItem[]);
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
            setMasterSupplies(res as any);
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
            setIsExecutionItemDetailOpen(true);
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

                const result = await updateProjectItem(project.id, row.id, row.total, levelData);
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
            const result = await updateProjectAction(project.id, { status: 'construccion' });
            if (result && result.success) {
                toast({
                    title: "Proyecto Consolidado",
                    description: "Los cómputos han sido bloqueados para el equipo externo."
                });
                await fetchProjectData();
            } else {
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
                            <div class="sum-value">$${totalGeneral.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div class="sum-item">
                            <div class="sum-label">Total Ejecutado</div>
                            <div class="sum-value" style="color: #10b981;">$${totalAvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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

        const rows = ganttFeatures.map((f) => {
            const start = format(f.startAt, 'dd/MM/yyyy');
            const end = f.endAt ? format(f.endAt, 'dd/MM/yyyy') : '-';
            const duration = f.endAt ? `${differenceInDays(f.endAt, f.startAt)} días` : '-';
            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; font-weight: bold;">${f.name}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${start}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${end}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">${duration}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 9px; text-align: center; text-transform: uppercase;">${f.status.name}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <html>
                <head>
                    <title>Cronograma de Obra - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; align-items: flex-end; }
                        .brand { font-size: 32px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: -1px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #f8f8f8; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                        @media print { body { padding: 0; } @page { size: portrait; margin: 1.5cm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1 class="brand">BIMUS</h1>
                            <p style="font-size: 10px; font-weight: bold; margin: 0; letter-spacing: 2px;">ARQUITECTURA Y CONSTRUCCIÓN</p>
                        </div>
                        <div style="text-align: right;">
                            <h2 style="font-size: 14px; font-weight: 900; margin: 0; text-transform: uppercase;">CRONOGRAMA DE EJECUCIÓN</h2>
                            <p style="font-size: 9px; margin: 0;">FECHA EMISIÓN: ${new Date().toLocaleDateString('es-ES')}</p>
                        </div>
                    </div>
                    <div style="margin-bottom: 30px; font-size: 12px;">
                        <strong>PROYECTO:</strong> ${project.title.toUpperCase()}<br>
                        <strong>INICIO PREVISTO:</strong> ${project.startDate ? new Date(project.startDate).toLocaleDateString() : 'NO DEFINIDO'}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Descripción de Partida</th>
                                <th style="text-align: center;">Inicio</th>
                                <th style="text-align: center;">Fin</th>
                                <th style="text-align: right;">Duración</th>
                                <th style="text-align: center;">Estado</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div style="margin-top: 100px; display: flex; justify-content: space-around;">
                        <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA RESPONSABLE DE OBRA</div>
                        <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA SUPERVISIÓN</div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
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
                throw new Error(result.error);
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

        return computations.map((row, idx) => {
            const startAt = addDays(projectStart, idx * 5);
            const endAt = addDays(startAt, Math.max(5, Math.ceil(row.total / 10)));

            return {
                id: row.id,
                name: row.desc,
                startAt,
                endAt,
                status: {
                    id: row.progress && row.progress >= row.total ? 'completado' : 'activo',
                    name: row.progress && row.progress >= row.total ? 'Completado' : 'Activo',
                    color: row.progress && row.progress >= row.total ? '#10b981' : '#3b82f6'
                }
            };
        });
    }, [project, computations]);

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

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-[#050505] items-center justify-center gap-4 h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Construcción...</p>
            </div>
        );
    }

    if (!project && !isLoading) return (
        <div className="flex flex-col min-h-screen bg-[#050505] items-center justify-center p-8 gap-4 h-[50vh]">
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
        <div className="flex flex-col min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-6">
            <Tabs defaultValue="computo" className="w-full">
                <TabsList className="bg-white/5 border border-white/10 h-12 p-0 rounded-xl overflow-hidden mb-6 flex flex-wrap md:flex-nowrap">
                    <TabsTrigger value="computo" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none border-r border-white/10 text-xs md:text-sm">
                        <Calculator className="mr-2 h-4 w-4" /> CÓMPUTO
                    </TabsTrigger>
                    <TabsTrigger value="presupuesto" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none border-r border-white/10 text-xs md:text-sm">
                        <Coins className="mr-2 h-4 w-4" /> PRESUPUESTO
                    </TabsTrigger>
                    <TabsTrigger value="cronograma" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none border-r border-white/10 text-xs md:text-sm">
                        <CalendarDays className="mr-2 h-4 w-4" /> CRONOGRAMA
                    </TabsTrigger>
                    <TabsTrigger value="ejecucion" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none text-xs md:text-sm">
                        <Activity className="mr-2 h-4 w-4" /> EJECUCIÓN
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="computo">
                    <Card className="bg-[#0a0a0a] border-white/10 text-white overflow-hidden shadow-2xl">
                        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-7 bg-white/2 border-b border-white/5">
                            <div>
                                <CardTitle className="text-lg font-bold uppercase tracking-tight">Cómputos Métricos</CardTitle>
                                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Cuantificación de actividades por niveles.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex items-center justify-between gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar partida..."
                                        className="pl-10 bg-black/40 border-white/10 h-11 text-xs"
                                        value={searchTermComputo}
                                        onChange={(e) => setSearchTermComputo(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={handlePrintComputos}
                                        variant="outline"
                                        className="border-white/10 bg-white/5 text-muted-foreground font-bold text-[10px] uppercase tracking-widest px-4 h-11 rounded-xl hover:bg-white/10 hover:text-white"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </Button>

                                    {isAuthor && !isConstruccion && (
                                        <Button
                                            onClick={handleConsolidate}
                                            className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl shadow-xl shadow-amber-500/20"
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Consolidar Proyecto
                                        </Button>
                                    )}

                                    {isConstruccion && isAuthor && (
                                        <Button
                                            onClick={() => setIsChangeOrderOpen(true)}
                                            className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase tracking-widest px-8 h-11 rounded-xl shadow-xl shadow-amber-500/20"
                                        >
                                            <FileSignature className="mr-2 h-4 w-4" /> Orden de Cambio
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleSaveComputos}
                                        disabled={isSaving || computations.length === 0}
                                        className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl hover:bg-emerald-500/20"
                                    >
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Guardar Cambios
                                    </Button>
                                    {!isConstruccion && isAuthor && (
                                        <>
                                            <Button
                                                onClick={() => setIsAddComputoOpen(true)}
                                                className="bg-primary hover:bg-primary/90 text-white font-bold text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl shadow-lg shadow-primary/20"
                                            >
                                                <Plus className="mr-2 h-4 w-4" /> Añadir Partida
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="border border-white/5 rounded-xl overflow-x-auto bg-black/20">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="text-[10px] font-black uppercase whitespace-nowrap px-6 py-4">Item</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase whitespace-nowrap min-w-62.5">Descripción de Partida</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase whitespace-nowrap text-center">Unidad</TableHead>
                                            {levels.map((level) => (
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
                                                    <TableRow key={row.id} className="border-white/5 hover:bg-white/3 transition-colors">
                                                        <TableCell className="font-mono text-[10px] text-muted-foreground px-6">{row.id.slice(-6).toUpperCase()}</TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-white uppercase">{row.desc}</span>
                                                                <span className="text-[9px] text-primary font-black uppercase tracking-tighter">{row.chapter}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-[10px] text-center font-bold text-muted-foreground uppercase">{row.unit}</TableCell>
                                                        {row.values.map((val, levelIndex) => (
                                                            <TableCell key={levelIndex} className="p-1 text-center">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={val === 0 ? "" : val}
                                                                    placeholder="0.00"
                                                                    onChange={(e) => handleValueChange(rowIndex, levelIndex, e.target.value)}
                                                                    className="h-9 w-24 bg-white/5 border-white/5 text-xs font-mono text-center mx-auto focus:ring-1 focus:ring-primary text-white"
                                                                    disabled={isConstruccion}
                                                                />
                                                            </TableCell>
                                                        ))}
                                                        <TableCell className="text-xs font-mono text-right font-black text-primary pr-8 bg-primary/5">{(row.total ?? 0).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl p-1.5 rounded-xl">
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
                        <Card className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl p-0 gap-0">
                            <Accordion type="single" collapsible defaultValue="">
                                <AccordionItem value="summary" className="border-none">
                                    <AccordionTrigger className="px-6 py-6 hover:no-underline flex items-center w-full">
                                        <div className="flex flex-col text-left flex-1">
                                            <CardTitle className="text-lg font-bold uppercase tracking-tight">Resumen de Presupuesto</CardTitle>
                                            <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Desglose detallado de costos operativos.</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-3 mr-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-1">Total Consolidado</span>
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-xl font-bold text-white uppercase">{project.config?.mainCurrency || 'BS'}</span>
                                                    <p className="text-3xl font-black text-white tracking-tighter">
                                                        {budgetTotals.totalGeneral.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1 px-3 py-0.5 bg-white/5 rounded-lg border border-white/5">
                                                    <span className="text-[9px] font-black text-primary uppercase">{project.config?.secondaryCurrency || 'USD'}</span>
                                                    <span className="text-xs font-mono font-bold text-white/60">
                                                        {(budgetTotals.totalGeneral / (project.config?.exchangeRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6 border-t border-white/5 bg-black/20">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 py-6">
                                            {budgetTotals && budgetCards.map((card) => (
                                                <div key={card.title} className="flex items-center justify-between border-b border-white/5 pb-3">
                                                    <div className="flex items-center gap-3">
                                                        <card.icon className="h-4 w-4 text-primary" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.title}</span>
                                                    </div>
                                                    <p className="font-mono text-sm font-bold text-white">
                                                        ${card.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </Card>

                        <Card className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-white/2 border-b border-white/5">
                                <div>
                                    <CardTitle className="text-lg font-bold uppercase tracking-tight">Presupuesto de Obra</CardTitle>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={handlePrintPresupuesto}
                                        variant="outline"
                                        size="sm"
                                        className="border-white/10 bg-white/5 text-[10px] font-black uppercase px-6 h-9 hover:bg-white/10"
                                    >
                                        <Printer className="h-4 w-4" /> Imprimir
                                    </Button>
                                    {/* <Button
                                        onClick={handleExportExcel}
                                        variant="outline"
                                        size="sm"
                                        className="border-white/10 bg-white/5 text-[10px] font-black uppercase px-6 h-9 hover:bg-white/10"
                                    >
                                        <Download className="mr-2 h-4 w-4" /> Exportar
                                    </Button> */}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
                                    <Table>
                                        <TableHeader className="bg-white/5">
                                            <TableRow className="border-white/10 hover:bg-transparent">
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
                                                        <TableRow key={i} className="border-white/5 hover:bg-white/3 transition-colors group">
                                                            <TableCell className="font-mono text-[10px] text-muted-foreground px-6">{row.id.slice(-6).toUpperCase()}</TableCell>
                                                            <TableCell className="text-[10px] text-primary font-black tracking-tighter whitespace-nowrap">{row.chapter}</TableCell>
                                                            <TableCell className="py-4">
                                                                <span className="text-xs font-bold text-white uppercase">{row.desc}</span>
                                                            </TableCell>
                                                            <TableCell className="text-[10px] font-bold text-muted-foreground uppercase text-center">{row.unit}</TableCell>
                                                            <TableCell className="text-xs font-mono text-right text-muted-foreground font-bold">
                                                                ${(row.unitPrice ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className="text-xs font-mono text-right text-white">
                                                                {(row.qty ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className="text-xs font-mono text-right text-primary font-black bg-primary/5">
                                                                ${(row.totalRow ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className="text-xs font-mono text-right text-muted-foreground pr-8">
                                                                ${(row.totalRowSec ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                    <Card className="bg-[#0a0a0a] border-white/10 text-white overflow-hidden shadow-2xl h-[700px] flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-white/2 border-b border-white/5">
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
                                <Button
                                    onClick={handlePrintCronograma}
                                    variant="outline"
                                    size="sm"
                                    className="border-white/10 bg-white/5 text-[10px] font-black uppercase px-6 h-9 hover:bg-white/10"
                                >
                                    <Printer className="h-4 w-4 mr-2" /> Imprimir Cronograma
                                </Button>
                                <div className="flex items-center bg-black/40 rounded-xl border border-white/10 p-1">
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
                                    <SelectTrigger className="h-10 bg-black/40 border-white/10 text-[10px] font-black uppercase w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0a0a0a] text-white border-white/10">
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
                                            {ganttFeatures.map(feature => (
                                                <GanttSidebarItem
                                                    key={feature.id}
                                                    feature={feature}
                                                    onInfoClick={handleViewExecutionDetail}
                                                    className="border-b border-white/5"
                                                />
                                            ))}
                                        </GanttSidebarGroup>
                                    </GanttSidebar>
                                    <GanttTimeline>
                                        <GanttHeader />
                                        <GanttFeatureList>
                                            {ganttFeatures.map(feature => (
                                                <GanttFeatureRow
                                                    key={feature.id}
                                                    features={[feature]}
                                                />
                                            ))}
                                        </GanttFeatureList>
                                        <GanttToday className="bg-primary shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
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
                            <Card className="bg-primary/5 border-primary/20 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                <CardHeader className="pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Avance Global Físico</span>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-black text-white tracking-tighter">
                                            {budgetTotals.totalGeneral > 0 ? ((budgetTotals.totalAvance / budgetTotals.totalGeneral) * 100).toFixed(1) : '0.0'}%
                                        </p>
                                    </div>
                                    <div className="mt-4">
                                        <Progress value={budgetTotals.totalGeneral > 0 ? (budgetTotals.totalAvance / budgetTotals.totalGeneral) * 100 : 0} className="h-1.5 bg-white/5" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                <CardHeader className="pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Valor Ejecutado</span>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-emerald-500/50">$</span>
                                        <p className="text-4xl font-black text-white tracking-tighter">
                                            {budgetTotals.totalAvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase mt-2">Certificación técnica actual</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-blue-500/5 border-blue-500/20 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                <CardHeader className="pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/70">Saldo por Ejecutar</span>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-blue-500/50">$</span>
                                        <p className="text-4xl font-black text-white tracking-tighter">
                                            {(budgetTotals.totalGeneral - budgetTotals.totalAvance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase mt-2">Pendiente de liberación</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl">
                            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-7 bg-white/2 border-b border-white/5">
                                <div>
                                    <CardTitle className="text-lg font-bold uppercase tracking-tight">Seguimiento de Avance Físico</CardTitle>
                                    <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Control de metrados ejecutados vs programados.</CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 mr-4">
                                        <Button
                                            onClick={handlePrintEjecucion}
                                            variant="outline"
                                            className="border-white/10 bg-white/5 text-muted-foreground font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl hover:bg-white/10"
                                        >
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            onClick={() => setIsPayrollHistoryModalOpen(true)}
                                            className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-lg shadow-amber-600/10"
                                        >
                                            <History className="mr-2 h-4 w-4" /> Historial Planillas
                                        </Button>
                                        <Button
                                            onClick={() => setIsHistoryModalOpen(true)}
                                            className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-lg shadow-amber-500/10"
                                        >
                                            <History className="mr-2 h-4 w-4" /> Historial Avance
                                        </Button>
                                        <Button
                                            onClick={() => setIsPlanillaModalOpen(true)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-lg"
                                        >
                                            <UsersIcon className="mr-2 h-4 w-4" /> Planilla Personal
                                        </Button>
                                        <Button
                                            onClick={() => setIsAvanceModalOpen(true)}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-black font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-lg"
                                        >
                                            <TrendingUp className="mr-2 h-4 w-4" /> Registrar Avance
                                        </Button>
                                        <Button
                                            onClick={() => setIsLibroModalOpen(true)}
                                            className="bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-lg"
                                        >
                                            <BookOpen className="mr-2 h-4 w-4" /> Libro de Obra
                                        </Button>
                                    </div>
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por descripción..."
                                            className="pl-9 bg-black/40 border-white/10 h-9 text-[10px] uppercase"
                                            value={searchTermEjecucion}
                                            onChange={(e) => setSearchTermEjecucion(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="border-b border-white/5">
                                    <Table>
                                        <TableHeader className="bg-white/5">
                                            <TableRow className="border-white/5 hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase py-4 px-6">ID Item</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase min-w-[300px]">Partida de Obra</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-center">Und.</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right">Cómputo Total</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right">Cant. Avance</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right">Saldo Pendiente</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right pr-8">Avance Financiero</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase min-w-[150px] pr-6 text-center">% Ejecución</TableHead>
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
                                                        <TableRow key={`${row.id}-${row.progress}`} className="border-white/5 hover:bg-white/3 transition-colors group">
                                                            <TableCell className="font-mono text-[10px] text-muted-foreground px-6">{row.id.slice(-6).toUpperCase()}</TableCell>
                                                            <TableCell className="py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-white uppercase">{row.desc}</span>
                                                                    <span className="text-[9px] text-primary/60 font-black uppercase tracking-tighter">{row.chapter}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-[10px] font-bold text-muted-foreground uppercase text-center">{row.unit}</TableCell>
                                                            <TableCell className="text-xs font-mono text-right text-white font-bold">{row.total.toFixed(2)}</TableCell>
                                                            <TableCell className="text-xs font-mono text-right text-emerald-500 font-black">{row.progress.toFixed(2)}</TableCell>
                                                            <TableCell className="text-xs font-mono text-right text-amber-500 font-black">
                                                                {row.balance.toFixed(2)}
                                                            </TableCell>
                                                            <TableCell className="text-xs font-mono text-right text-emerald-500 font-black pr-8">
                                                                ${row.financialProgress.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className="pr-6">
                                                                <div className="space-y-1.5 w-full max-w-[120px] mx-auto">
                                                                    <div className="flex justify-between text-[8px] font-black text-muted-foreground">
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

            {/* Ficha Técnica de Seguimiento por Item (Gantt Details) */}
            <Dialog open={isExecutionItemDetailOpen} onOpenChange={setIsExecutionItemDetailOpen}>
                <DialogContent className="max-w-4xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl flex flex-col h-[85vh]">
                    {selectedExecutionItem && (
                        <>
                            <DialogHeader className="p-8 border-b border-white/5 bg-white/2 shrink-0 flex flex-row items-center gap-6 space-y-0">
                                <div className="h-16 w-16 rounded-2xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-3xl font-black text-primary uppercase shadow-2xl">
                                    <Info className="h-8 w-8" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-primary text-black font-black uppercase text-[10px]">{selectedExecutionItem.chapter}</Badge>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50 flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" /> ID: {selectedExecutionItem.id.slice(-6).toUpperCase()}
                                        </span>
                                    </div>
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight leading-none mt-1">
                                        {selectedExecutionItem.desc}
                                    </DialogTitle>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsExecutionItemDetailOpen(false)} className="text-muted-foreground hover:text-white">
                                    <X className="h-5 w-5" />
                                </Button>
                            </DialogHeader>

                            <ScrollArea className="flex-1">
                                <div className="p-8 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card className="bg-white/2 border-white/5 p-4 space-y-1 shadow-inner">
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Cant. Computada</span>
                                            <p className="text-lg font-black text-white font-mono">{selectedExecutionItem.total.toFixed(2)} <span className="text-[10px] opacity-40">{selectedExecutionItem.unit}</span></p>
                                        </Card>
                                        <Card className="bg-white/2 border-white/5 p-4 space-y-1 shadow-inner">
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Precio Unitario</span>
                                            <p className="text-lg font-black text-primary font-mono">${selectedExecutionItem.unitPrice.toFixed(2)}</p>
                                        </Card>
                                        <Card className="bg-white/2 border-white/5 p-4 space-y-1 shadow-inner">
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Total Partida</span>
                                            <p className="text-lg font-black text-white font-mono">${(selectedExecutionItem.total * selectedExecutionItem.unitPrice).toLocaleString()}</p>
                                        </Card>
                                        <Card className="bg-primary/5 border-primary/20 p-4 space-y-1 shadow-inner">
                                            <span className="text-[8px] font-black text-primary uppercase tracking-widest">Costo por Día</span>
                                            <p className="text-lg font-black text-primary font-mono">
                                                ${((selectedExecutionItem.total * selectedExecutionItem.unitPrice) / Math.max(1, differenceInDays(selectedExecutionItem.gantt.endAt, selectedExecutionItem.gantt.startAt))).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            </p>
                                        </Card>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Programación Temporal</h3>
                                            </div>
                                            <div className="space-y-4 bg-white/2 border border-white/5 p-6 rounded-3xl">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fecha Inicio</span>
                                                    <span className="text-xs font-mono font-black text-white uppercase">{format(selectedExecutionItem.gantt.startAt, 'dd MMM yyyy', { locale: es })}</span>
                                                </div>
                                                <Separator className="bg-white/5" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fecha Final</span>
                                                    <span className="text-xs font-mono font-black text-white uppercase">{format(selectedExecutionItem.gantt.endAt, 'dd MMM yyyy', { locale: es })}</span>
                                                </div>
                                                <Separator className="bg-white/5" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Días de Duración</span>
                                                    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-black uppercase text-[10px]">
                                                        {differenceInDays(selectedExecutionItem.gantt.endAt, selectedExecutionItem.gantt.startAt)} DÍAS NATURALES
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
                                                        <p className="text-3xl font-black text-white font-mono mt-1">
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
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">ESTADO: {selectedExecutionItem.gantt.status.name}</span>
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

                                            <Card className="bg-white/2 border-white/5 overflow-hidden rounded-3xl shadow-2xl">
                                                <Table>
                                                    <TableHeader className="bg-white/5">
                                                        <TableRow className="border-white/10 hover:bg-transparent">
                                                            <TableHead className="text-[9px] font-black uppercase py-3 px-6">Especialidad / Cargo</TableHead>
                                                            <TableHead className="text-[9px] font-black uppercase text-center w-24">Cantidad</TableHead>
                                                            <TableHead className="text-[9px] font-black uppercase text-right pr-6">Incidencia</TableHead>
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
                                                                    <TableRow key={idx} className="border-white/5 hover:bg-white/5">
                                                                        <TableCell className="py-3 px-6">
                                                                            <span className="text-[11px] font-bold text-white uppercase">{s.supply?.description || s.description}</span>
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
                                                    <span className="text-xs font-black text-white font-mono">
                                                        {selectedExecutionItem.supplies?.filter((s: any) => {
                                                            const typo = s.supply?.typology || s.typology;
                                                            return typo === 'Mano de Obra' || typo === 'Honorario';
                                                        }).reduce((acc: number, s: any) => acc + s.quantity, 0).toFixed(3)} PERS.
                                                    </span>
                                                </div>
                                            </Card>

                                            <div className="p-6 bg-white/2 border border-white/5 rounded-3xl space-y-3">
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
                                                                <Badge key={idx} variant="outline" className="bg-white/5 border-white/10 text-[8px] font-black uppercase h-6">
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

                            <DialogFooter className="p-6 border-t border-white/5 bg-black shrink-0 flex gap-4">
                                <Button
                                    variant="outline"
                                    className="border-white/10 bg-white/5 text-[10px] font-black uppercase h-12 px-8 hover:bg-white/10"
                                    onClick={() => handleViewDetail(selectedExecutionItem)}
                                >
                                    <Calculator className="h-4 w-4 mr-2" /> Análisis de Costos APU
                                </Button>
                                <Button
                                    className="flex-1 bg-white text-black font-black text-[10px] uppercase h-12 tracking-widest shadow-xl hover:bg-white/90 active:scale-95 transition-all"
                                    onClick={() => setIsExecutionItemDetailOpen(false)}
                                >
                                    Cerrar Ficha de Seguimiento
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Orden de Cambio Dialog */}
            <Dialog open={isChangeOrderOpen} onOpenChange={setIsChangeOrderOpen}>
                <DialogContent className="min-w-7xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl flex flex-col h-[90vh]">
                    <DialogHeader className="p-6 border-b border-white/5 bg-white/2 shrink-0 flex flex-row items-center justify-between space-y-0">
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
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => setIsAddComputoOpen(true)}
                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase h-10 px-6 rounded-xl"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Adicionar Nueva Partida
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setIsChangeOrderOpen(false)} className="text-muted-foreground hover:text-white">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="p-6 bg-amber-500/5 border-b border-white/5">
                            <Label className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-3 block">Justificación Técnica / Motivo de la Modificación</Label>
                            <Textarea
                                value={changeOrderReason}
                                onChange={(e) => setChangeOrderReason(e.target.value)}
                                placeholder="Describa el motivo técnico del cambio (Ej: Ampliación de muro perimetral sector norte)..."
                                className="min-h-[100px] bg-black/40 border-amber-500/20 focus:border-amber-500/50 uppercase text-xs font-bold p-4"
                            />
                        </div>

                        <div className="flex-1 p-6 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Previsualización de Tabla de Cómputos</h3>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-amber-500/60 uppercase">
                                    <Info className="h-3 w-3" /> Los cambios aquí realizados se registrarán en la bitácora oficial.
                                </div>
                            </div>

                            <div className="flex-1 border border-white/5 rounded-xl overflow-hidden bg-black/20">
                                <ScrollArea className="h-full">
                                    <Table>
                                        <TableHeader className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                            <TableRow className="border-white/10 hover:bg-transparent">
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
                                                <TableRow key={row.id} className="border-white/5 hover:bg-white/3 transition-colors">
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-white uppercase">{row.desc}</span>
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
                                                                className="h-9 w-24 bg-black border-amber-500/10 text-center font-mono text-xs focus:ring-1 focus:ring-amber-500/50 text-amber-100"
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

                    <DialogFooter className="p-6 border-t border-white/5 bg-black shrink-0">
                        <Button variant="ghost" onClick={() => setIsChangeOrderOpen(false)} className="text-[10px] font-black uppercase tracking-widest h-12 px-8">Cancelar</Button>
                        <Button
                            onClick={handleProcessChangeOrder}
                            disabled={isSaving || !changeOrderReason.trim()}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase h-12 px-12 tracking-widest shadow-xl shadow-amber-500/20"
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
                            Autorizar y Ejecutar Orden de Cambio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Local APU Editor Dialog */}
            <Dialog open={isLocalAPUEditorOpen} onOpenChange={setIsLocalAPUEditorOpen}>
                <DialogContent className="min-w-7xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl flex flex-col h-[85vh]">
                    {localAPUEditingItem && (
                        <>
                            <DialogHeader className="p-6 border-b border-white/5 bg-white/2 shrink-0 flex flex-row items-center gap-4 space-y-0">
                                <div className="p-2 bg-amber-500/20 rounded-lg"><Calculator className="h-6 w-6 text-amber-500" /></div>
                                <div className="flex-1">
                                    <DialogTitle className="text-xl font-bold uppercase tracking-tight">Análisis APU Local del Proyecto</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground mt-1">Ajuste de rendimientos exclusivo para "{localAPUEditingItem.desc}"</DialogDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsLocalAPUEditorOpen(false)}><X className="h-5 w-5" /></Button>
                            </DialogHeader>

                            <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
                                <div className="grid grid-cols-3 gap-6 bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="space-y-1"><span className="text-[8px] font-black text-muted-foreground uppercase">Capítulo</span><p className="text-xs font-bold uppercase">{localAPUEditingItem.chapter}</p></div>
                                    <div className="space-y-1"><span className="text-[8px] font-black text-muted-foreground uppercase">Rendimiento Base</span><p className="text-xs font-bold font-mono">{localAPUEditingItem.performance} {localAPUEditingItem.unit}/DÍA</p></div>
                                    <div className="space-y-1 text-right">
                                        <span className="text-[8px] font-black text-amber-500 uppercase">Costo Unitario Local</span>
                                        <p className="text-xl font-black text-white font-mono">${localAPUSummary.totalUnit.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Package className="h-3.5 w-3.5" /> Insumos del Análisis</h3>
                                    <Button onClick={() => setIsLocalSupplyLibraryOpen(true)} variant="outline" size="sm" className="h-8 border-amber-500/20 bg-amber-500/5 text-[9px] font-black uppercase text-amber-500 hover:bg-amber-500/10">
                                        <Plus className="h-3 w-3 mr-1.5" /> Adicionar Insumo
                                    </Button>
                                </div>

                                <div className="flex-1 border border-white/5 rounded-2xl overflow-hidden bg-black/40">
                                    <ScrollArea className="h-full">
                                        <Table>
                                            <TableHeader className="bg-white/5 sticky top-0 z-10"><TableRow className="border-white/10"><TableHead className="text-[9px] font-black uppercase py-3 px-6">Tipo</TableHead><TableHead className="text-[9px] font-black uppercase">Descripción Insumo</TableHead><TableHead className="text-[9px] font-black uppercase text-center">Unidad</TableHead><TableHead className="text-[9px] font-black uppercase text-right">P. Unit.</TableHead><TableHead className="text-[9px] font-black uppercase text-center w-32">Rendimiento</TableHead><TableHead className="text-[9px] font-black uppercase text-right pr-6">Subtotal</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
                                            <TableBody>
                                                {localAPUSupplies.map((s) => (
                                                    <TableRow key={s.id} className="border-white/5 hover:bg-white/2">
                                                        <TableCell className="px-6 py-3">
                                                            <Badge variant="outline" className="text-[7px] border-white/10 uppercase font-black">{s.typology}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-[11px] font-bold uppercase">{s.description}</TableCell>
                                                        <TableCell className="text-center text-[10px] text-muted-foreground font-black">{s.unit}</TableCell>
                                                        <TableCell className="text-right font-mono text-[10px]">${s.price.toFixed(2)}</TableCell>
                                                        <TableCell className="px-4">
                                                            <Input
                                                                type="number"
                                                                step="0.0001"
                                                                value={s.quantity}
                                                                onChange={(e) => handleUpdateLocalSupplyQty(s.id, e.target.value)}
                                                                className="h-8 bg-black border-white/10 text-center font-mono text-xs text-amber-400 font-bold"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-[11px] font-black pr-6">${(s.quantity * s.price).toFixed(2)}</TableCell>
                                                        <TableCell className="pr-4"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveLocalSupply(s.id)}><X className="h-3.5 w-3.5" /></Button></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                            </div>

                            <DialogFooter className="p-6 border-t border-white/5 bg-black shrink-0 flex gap-4">
                                <Button variant="ghost" onClick={() => setIsLocalAPUEditorOpen(false)} className="text-[10px] font-black uppercase tracking-widest">Descartar</Button>
                                <Button onClick={handleSaveLocalAPU} disabled={isSaving} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase h-12 tracking-widest shadow-xl shadow-amber-500/20">
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Confirmar Análisis Local
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Local Supply Picker Sub-Dialog */}
            <Dialog open={isLocalSupplyLibraryOpen} onOpenChange={setIsLocalSupplyLibraryOpen}>
                <DialogContent className="sm:max-w-xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden flex flex-col h-[70vh] shadow-2xl">
                    <DialogHeader className="p-6 border-b border-white/5 bg-white/2">
                        <DialogTitle className="text-lg font-bold uppercase tracking-tight">Seleccionar Insumo Maestro</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 flex-1 overflow-hidden flex flex-col space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="BUSCAR RECURSO..."
                                className="pl-10 h-11 bg-white/5 border-white/10 text-[10px] font-bold uppercase"
                                value={localSupplySearchTerm}
                                onChange={(e) => setLocalSupplySearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 border border-white/10 rounded-xl overflow-hidden bg-black/40">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableBody>
                                        {masterSupplies.filter(s => s.description.toLowerCase().includes(localSupplySearchTerm.toLowerCase())).map((s) => (
                                            <TableRow key={s.id} className="border-white/5 hover:bg-white/5 cursor-pointer group" onClick={() => handleAddLocalSupply(s)}>
                                                <TableCell className="py-3 px-6"><span className="text-xs font-bold uppercase group-hover:text-primary">{s.description}</span></TableCell>
                                                <TableCell className="text-[10px] font-black text-muted-foreground uppercase">{s.unit}</TableCell>
                                                <TableCell className="text-right pr-6"><Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Plus className="h-4 w-4" /></Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddComputoOpen} onOpenChange={setIsAddComputoOpen}>
                <DialogContent className="max-w-4xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl flex flex-col h-[85vh]">
                    <DialogHeader className="p-6 border-b border-white/5 bg-white/2 shrink-0 flex flex-row items-center justify-between space-y-0">
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
                        <Button variant="ghost" size="icon" onClick={() => setIsAddComputoOpen(false)} className="text-muted-foreground hover:text-white">
                            <X className="h-5 w-5" />
                        </Button>
                    </DialogHeader>

                    <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="relative shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="BUSCAR EN EL DIRECTORIO MAESTRO..."
                                className="pl-10 h-11 bg-white/5 border-white/10 text-[10px] font-bold uppercase tracking-widest"
                                value={librarySearchTerm}
                                onChange={(e) => setLibrarySearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="border border-white/10 rounded-xl overflow-hidden flex-1 bg-black/40">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                        <TableRow className="border-white/10 hover:bg-transparent">
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
                                                    <TableRow key={item.id} className={cn("border-white/5 hover:bg-white/5 transition-colors", isAlreadyAdded && "opacity-30 bg-white/1")}>
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={selectedLibraryItems.includes(item.id)}
                                                                onCheckedChange={() => handleToggleLibraryItem(item.id)}
                                                                disabled={isAlreadyAdded}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-[10px] font-black text-primary uppercase">{item.chapter}</TableCell>
                                                        <TableCell className="text-xs font-bold text-white uppercase">{item.description}</TableCell>
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

                    <DialogFooter className="p-6 border-t border-white/5 bg-black shrink-0">
                        <Button variant="ghost" onClick={() => setIsAddComputoOpen(false)} className="text-[10px] font-black uppercase tracking-widest">Cancelar</Button>
                        <Button
                            onClick={handleAddSelectedItems}
                            disabled={isSaving || selectedLibraryItems.length === 0}
                            className="bg-primary text-black font-black text-[10px] uppercase h-12 px-12 shadow-xl shadow-primary/20"
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Vincular Seleccionados ({selectedLibraryItems.length})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-[1000px] w-full max-h-[95vh] overflow-hidden bg-card border-muted/50 p-0 flex flex-col shadow-2xl">
                    {selectedItem && apuCalculations && (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b border-white/5 bg-black/20 flex flex-row items-center gap-4 shrink-0">
                                <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                    <Box className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <DialogTitle className="text-xl font-bold uppercase tracking-tight text-white leading-none">
                                        Análisis APU: {selectedItem.desc}
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">
                                        Análisis de precios unitarios y parámetros de control operativo
                                    </DialogDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsDetailOpen(false)} className="text-muted-foreground hover:text-white">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            <Tabs defaultValue="informacion" className="flex-1 flex flex-col overflow-hidden">
                                <div className="px-6 bg-black/10 border-b border-white/5 shrink-0">
                                    <TabsList className="h-14 bg-transparent p-0 gap-8" variant="line">
                                        <TabsTrigger value="informacion" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-white">
                                            Análisis Costos
                                        </TabsTrigger>
                                        <TabsTrigger value="calidad" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-white">
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
                                                            <Box className="h-4 w-4 text-primary" />
                                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Datos generales</h3>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Capítulo</Label>
                                                                <div className="bg-background/50 border border-white/5 rounded-md h-11 px-3 flex items-center text-white uppercase text-xs font-bold">
                                                                    {selectedItem.chapter}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Descripción ítem</Label>
                                                                <div className="bg-background/50 border border-white/5 rounded-md h-11 px-3 flex items-center text-white uppercase text-xs font-bold">
                                                                    {selectedItem.desc}
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Unidad</Label>
                                                                    <div className="bg-background/50 border border-white/5 rounded-md h-11 px-3 flex items-center text-white uppercase text-xs font-bold">
                                                                        {selectedItem.unit}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Cómputo Total</Label>
                                                                    <div className="bg-background/50 border border-white/5 rounded-md h-11 px-3 flex items-center text-white font-mono font-bold">
                                                                        {selectedItem.total.toFixed(2)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="lg:col-span-5">
                                                    <div className="bg-[#1a1f2e] border border-blue-500/20 rounded-2xl p-6 h-full flex flex-col justify-between shadow-xl">
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
                                                                        <span className="text-white font-mono font-bold text-xs">${item.value.toFixed(2)}</span>
                                                                    </div>
                                                                    <Separator className="my-2 border-white/5" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex items-start justify-end gap-8 pt-4">
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">COSTO DIRECTO</p>
                                                                <p className="text-xl font-bold text-white">${apuCalculations.directCost.toFixed(2)}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">TOTAL APU</p>
                                                                <p className="text-xl font-bold text-white">${apuCalculations.totalUnit.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator className="border-white/10" />

                                            <div className="space-y-4">
                                                <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden min-h-[300px]">
                                                    <Table>
                                                        <TableHeader className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                                            <TableRow className="border-white/5 hover:bg-transparent">
                                                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-6 py-4">Tipo</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Descripción</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Unidad</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right">P. Unitario</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Cantidad</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase text-right px-6">Subtotal</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {apuCalculations.supplies.map((s: any, idx: number) => (
                                                                <TableRow key={idx} className="border-white/5 hover:bg-white/2 group transition-colors">
                                                                    <TableCell className="px-6 py-4">
                                                                        <div className="p-2 bg-white/5 rounded-lg border border-white/10 w-fit">
                                                                            {s.typology === 'Material' || s.typology === 'Insumo' ? (
                                                                                <Package className="h-4 w-4 text-primary" />
                                                                            ) : (
                                                                                <UsersIcon className="h-4 w-4 text-emerald-500" />
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-xs font-bold text-white uppercase">{s.description}</TableCell>
                                                                    <TableCell className="text-[10px] text-muted-foreground font-black text-center uppercase tracking-widest">{s.unit}</TableCell>
                                                                    <TableCell className="text-right text-[10px] font-mono font-bold text-muted-foreground">${s.price.toFixed(2)}</TableCell>
                                                                    <TableCell className="text-center">
                                                                        <div className="w-24 h-9 bg-black/40 border border-white/10 rounded flex items-center justify-center font-mono text-xs text-white mx-auto">
                                                                            {s.quantity.toFixed(4)}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-mono font-bold text-white px-6">${s.subtotal.toFixed(2)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="calidad" className="m-0 p-6 space-y-6 outline-none">
                                            {selectedItem.qualityControls?.length > 0 ? (
                                                <div className="space-y-6">
                                                    {selectedItem.qualityControls.map((qc: any, idx: number) => (
                                                        <Card key={qc.id} className="bg-white/2 border-white/5 overflow-hidden">
                                                            <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-4">
                                                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="font-bold text-white uppercase text-sm">{qc.description}</span>
                                                            </div>
                                                            <div className="p-4 space-y-3">
                                                                {qc.subPoints?.map((sp: any) => (
                                                                    <div key={sp.id} className="flex items-center gap-3 pl-4">
                                                                        <div className="h-4 w-4 rounded border border-white/20" />
                                                                        <span className="text-xs text-muted-foreground uppercase">{sp.description}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground text-center gap-4 bg-black/20 rounded-2xl border border-dashed border-white/5">
                                                    <ClipboardCheck className="h-16 w-16 opacity-5" />
                                                    <p className="font-bold text-white uppercase text-xs tracking-[0.2em]">Sin Protocolo de Calidad Registrado</p>
                                                    <p className="text-[10px] uppercase font-black tracking-widest opacity-30">Los criterios de aceptación se gestionan en la librería maestro.</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </div>
                                </ScrollArea>

                                <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end items-center gap-4 shrink-0">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsDetailOpen(false)}
                                        className="text-[10px] font-black uppercase tracking-widest hover:bg-white/5 text-muted-foreground hover:text-white"
                                    >
                                        CERRAR DETALLE
                                    </Button>
                                    <Button className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest px-8 h-11 shadow-xl shadow-primary/10">
                                        <Printer className="mr-2 h-4 w-4" /> IMPRIMIR ANÁLISIS
                                    </Button>
                                </div>
                            </Tabs>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
