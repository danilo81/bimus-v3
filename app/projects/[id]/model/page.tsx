/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { FixedAsset, BimBranch, BimVersion } from '@/types/types';
import {
    getProjectById,
    getProjectAssets,
    assignAssetToProject,
    unassignAssetFromProject,
    getProjectBimData,
    createBimBranch,
    createBimVersion,
    getAssets as getLibraryAssets
} from '@/actions';
import { getBimIssues, updateBimIssueStatus } from '@/actions/projects/bimIssues';

import { getProjectDocuments } from '@/actions/projects/getProjectDocuments';
import { assignBimRoleToDocument } from '@/actions/projects/assignBimRole';
import { IfcCloudModal } from '@/components/bim/IfcCloudModal';

import {
    Box,
    ChevronLeft,
    FileText,
    Layers,
    Search,
    Download,
    Plus,
    Package,
    HardDrive,
    Eye,
    Users as UsersIcon,
    X,
    Loader2,
    Truck,
    Check,
    Trash2,
    GitBranch,
    GitCommit,
    Clock,
    UserCircle,
    Terminal,
    CheckCircle2,
    LayoutGrid,
    Inbox,
    AlertCircle,
    ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamic import for the BIM viewer with SSR disabled to avoid hydration/initialization errors
const BimViewer = dynamic(() => import('@/components/bim/BimViewer').then(mod => mod.BimViewer), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#050505] gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inicializando Entorno BIM...</p>
        </div>
    )
});

export default function ModelPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [project, setProject] = useState<any | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // BIM Version Control States
    const [branches, setBranches] = useState<BimBranch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [isNewBranchOpen, setIsNewBranchOpen] = useState(false);
    const [isNewCommitOpen, setIsNewCommitOpen] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [commitMessage, setCommitMessage] = useState('');

    const [documents, setDocuments] = useState<any[]>([]);
    const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false);
    const [assignRoleTarget, setAssignRoleTarget] = useState<'arquitectura' | 'estructura' | 'instalaciones' | null>(null);

    const [projectAssets, setProjectAssets] = useState<FixedAsset[]>([]);
    const [libraryAssets, setLibraryAssets] = useState<FixedAsset[]>([]);
    const [assetSearchTerm, setAssetSearchTerm] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [bimIssues, setBimIssues] = useState<any[]>([]);
    const [issueFilter, setIssueFilter] = useState<'all' | 'pendiente' | 'resuelto'>('all');

    const fetchProject = useCallback(async () => {
        const id = params?.id;
        const cleanId = Array.isArray(id) ? id[0] : id;

        if (cleanId) {
            setIsLoading(true);
            try {
                const [found, assetsResponse, bimResponse, docsResponse, issuesResponse] = await Promise.all([
                    getProjectById(cleanId as string),
                    getProjectAssets(cleanId as string),
                    getProjectBimData(cleanId as string),
                    getProjectDocuments(cleanId as string),
                    getBimIssues(cleanId as string)
                ]);

                if (found) setProject(found);

                if (docsResponse) setDocuments(docsResponse);

                if (assetsResponse && 'assets' in assetsResponse) {
                    setProjectAssets(assetsResponse.assets as FixedAsset[]);
                } else {
                    setProjectAssets([]);
                }

                if (bimResponse.success) {
                    setBranches(bimResponse.branches);
                    if (bimResponse.branches.length > 0 && !selectedBranchId) {
                        setSelectedBranchId(bimResponse.branches[0].id);
                    }
                }

                if (issuesResponse?.success) {
                    setBimIssues(issuesResponse.issues || []);
                }
            } catch (error) {
                console.error("Error loading project:", error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los datos del proyecto.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        }
    }, [params?.id, toast, selectedBranchId]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    const activeBranch = useMemo(() =>
        branches.find(b => b.id === selectedBranchId),
        [branches, selectedBranchId]);

    const handleCreateBranch = async () => {
        if (!project || !newBranchName.trim()) return;
        setIsSaving(true);
        try {
            const result = await createBimBranch(project.id, newBranchName);
            if (result.success) {
                toast({ title: "Rama Creada", description: `Se ha creado la rama "${newBranchName}" correctamente.` });
                setIsNewBranchOpen(false);
                setNewBranchName('');
                await fetchProject();
                if (result.branch) setSelectedBranchId(result.branch.id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateCommit = async () => {
        if (!project || !selectedBranchId || !commitMessage.trim()) return;
        setIsSaving(true);
        try {
            const result = await createBimVersion(project.id, selectedBranchId, commitMessage);
            if (result.success) {
                toast({ title: "Versión Registrada", description: "Se ha guardado una nueva iteración del modelo." });
                setIsNewCommitOpen(false);
                setCommitMessage('');
                await fetchProject();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleViewDetail = (item: any) => {
        setSelectedItem(item);
        setIsDetailOpen(true);
    };

    const handleAssignRole = async (url: string, name: string) => {
        setIsAssignRoleModalOpen(false);
        if (!project || !assignRoleTarget) return;

        // Find the document that matches the URL
        const doc = documents.find(d => d.url === url);
        if (!doc) return;

        setIsSaving(true);
        try {
            const result = await assignBimRoleToDocument(project.id, doc.id, assignRoleTarget);
            if (result.success) {
                toast({ title: "Modelo Asignado", description: `Se ha asignado el modelo de ${assignRoleTarget} exitosamente.` });
                await fetchProject();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
            setAssignRoleTarget(null);
        }
    };

    const aggregatedSupplies = useMemo(() => {
        if (!project || !project.items) return [];

        const supplyMap: Record<string, any> = {};

        project.items.forEach((pi: any) => {
            const itemQty = pi.quantity || 0;
            const supplies = pi.item?.supplies || [];

            supplies.forEach((itemSupply: any) => {
                const s = itemSupply.supply;
                const totalQty = itemQty * (itemSupply.quantity || 0);

                if (supplyMap[s.id]) {
                    supplyMap[s.id].totalQty += totalQty;
                } else {
                    supplyMap[s.id] = {
                        id: s.id,
                        description: s.description,
                        unit: s.unit,
                        price: s.price,
                        totalQty: totalQty,
                        typology: s.typology
                    };
                }
            });
        });

        return Object.values(supplyMap).sort((a: any, b: any) => a.description.localeCompare(b.description));
    }, [project]);

    const handleOpenAssignModal = async () => {
        setIsAssignModalOpen(true);
        try {
            const lib = await getLibraryAssets();
            setLibraryAssets(lib.filter(a => a.status === 'disponible' && a.projectId !== project?.id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleAssignAsset = async (assetId: string) => {
        if (!project) return;
        setIsSaving(true);
        try {
            const result = await assignAssetToProject(assetId, project.id);
            if (result.success) {
                toast({ title: "Activo Asignado", description: "El equipo ahora forma parte del inventario de obra." });
                setLibraryAssets(prev => prev.filter(a => a.id !== assetId));
                await fetchProject();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUnassignAsset = async (assetId: string) => {
        if (!project || !confirm('¿Liberar este equipo de la obra actual?')) return;
        setIsSaving(true);
        try {
            const result = await unassignAssetFromProject(assetId, project.id);
            if (result.success) {
                toast({ title: "Activo Liberado", description: "El equipo ha regresado al catálogo de disponibles." });
                await fetchProject();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const hasItems = project?.items && project.items.length > 0;
    const hasInsumos = aggregatedSupplies.length > 0;
    const hasAssets = projectAssets.length > 0;

    const apuCalculations = useMemo(() => {
        if (!selectedItem || !project?.config) return null;

        const supplies = selectedItem.item?.supplies || [];
        const config = project.config;

        const matSub = supplies.filter((s: any) => s.supply.typology === 'Material' || s.supply.typology === 'Insumo').reduce((acc: number, s: any) => acc + (s.quantity * s.supply.price || 0), 0);
        const labSub = supplies.filter((s: any) => s.supply.typology === 'Mano de Obra' || s.supply.typology === 'Honorario').reduce((acc: number, s: any) => acc + (s.quantity * s.supply.price || 0), 0);
        const equSub = supplies.filter((s: any) => s.supply.typology === 'Equipo' || s.supply.typology === 'Herramienta').reduce((acc: number, s: any) => acc + (s.quantity * s.supply.price || 0), 0);

        const cSociales = labSub * (Number(config.socialCharges || 0) / 100);
        const ivaMO = (labSub + cSociales) * (Number(config.iva || 0) / 100);
        const toolWear = labSub * (Number(config.toolWear || 0) / 100);

        const directCost = matSub + labSub + cSociales + ivaMO + equSub + toolWear;

        const adm = directCost * (Number(config.adminExpenses || 0) / 100);
        const utility = (directCost + adm) * (Number(config.utility || 0) / 100);
        const it = (directCost + adm + utility) * (Number(config.it || 0) / 100);

        const totalUnit = directCost + adm + utility + it;

        return {
            matSub, labSub, cSociales, ivaMO, equSub, toolWear, directCost, adm, utility, it, totalUnit,
            supplies: supplies.map((s: any) => ({
                description: s.supply.description,
                unit: s.supply.unit,
                quantity: s.quantity,
                price: s.supply.price,
                subtotal: s.quantity * s.supply.price,
                typology: s.supply.typology
            }))
        };
    }, [selectedItem, project]);

    const handleToggleIssueStatus = async (issueId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pendiente' ? 'resuelto' : 'pendiente';
        // Optimistic update
        setBimIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
        try {
            const result = await updateBimIssueStatus(issueId, newStatus);
            if (!result.success) {
                // Revert
                setBimIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: currentStatus } : i));
                toast({ title: 'Error', description: result.error || 'No se pudo actualizar el estado.', variant: 'destructive' });
            } else {
                toast({ title: 'Estado actualizado', description: `Incidencia marcada como "${newStatus}".` });
            }
        } catch {
            setBimIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: currentStatus } : i));
        }
    };

    const filteredIssues = useMemo(() => {
        if (issueFilter === 'all') return bimIssues;
        return bimIssues.filter(i => i.status === issueFilter);
    }, [bimIssues, issueFilter]);


    return (
        <div className="flex flex-col h-fit text-primary p-4 md:p-8 space-y-6">
            <Tabs defaultValue="modelo" className="w-full">
                <TabsList className="bg-card border border-accent h-12 p-0 rounded-xl overflow-hidden mb-6 flex flex-wrap md:flex-nowrap">
                    <TabsTrigger value="modelo" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm font-black uppercase tracking-widest">
                        <Box className="mr-2 h-4 w-4" /> MODELO & VERSIONES
                    </TabsTrigger>
                    <TabsTrigger
                        value="assets"
                        className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r text-xs md:text-sm font-black uppercase tracking-widest"
                    >
                        <HardDrive className="mr-2 h-4 w-4" /> ASSETS
                    </TabsTrigger>
                    <TabsTrigger
                        value="incidencias"
                        className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm font-black uppercase tracking-widest"
                    >
                        <AlertCircle className="mr-2 h-4 w-4" /> Incidencias
                    </TabsTrigger>
                    <TabsTrigger
                        value="submittals"
                        className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none text-xs md:text-sm font-black uppercase tracking-widest"
                    >
                        <ClipboardList className="mr-2 h-4 w-4" /> Submittals
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="modelo">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[75vh] ">
                        {/* Sidebar de Versiones (Timeline) */}
                        <div className="lg:col-span-3 flex flex-col gap-4">
                            <Card className="bg-card border-accent flex-1 overflow-hidden flex flex-col h-fit gap-0 ">
                                <CardHeader className="p-4 bg-accent/2 border-b border-accent space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 bg-card w-fit">
                                            <div>
                                                <h1 className="text-2xl font-bold flex items-center gap-3 font-headline uppercase tracking-tight">
                                                    <Box className="h-7 w-7 text-primary" /> Modelo:
                                                </h1>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Gestión de activos digitales y control de versiones BIM</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <GitBranch className="h-4 w-4 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Rama Activa</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsNewBranchOpen(true)}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                    <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                        <SelectTrigger className="h-10 bg-card border-accent uppercase font-black text-[10px] w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card text-primary border-accent w-full">
                                            {branches.map(b => (
                                                <SelectItem key={b.id} value={b.id} className="text-[10px] font-bold uppercase">{b.name} {b.isMain && '(MAIN)'}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </CardHeader>

                                <CardHeader className="p-4 bg-accent border-b border-accent py-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Historial de Cambios</span>
                                    </div>
                                </CardHeader>

                                <ScrollArea className="flex-1">
                                    <div className="p-4 space-y-6 relative">
                                        <div className="absolute left-5.25 top-6 bottom-6 w-px bg-accent" />
                                        {(activeBranch as any)?.versions?.length > 0 ? (
                                            (activeBranch as any).versions.map((v: BimVersion) => (
                                                <div key={v.id} className="relative pl-8 group">
                                                    <div className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-accent bg-primary/20 z-10 group-hover:bg-primary transition-colors" />
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black text-primary uppercase truncate">{v.message}</span>
                                                            <Badge variant="outline" className="text-[7px] font-mono border-accent h-3.5 bg-accent/5">{v.hash}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-tighter">
                                                            <UserCircle className="h-2.5 w-2.5" /> {v.authorName} • {new Date(v.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-20 text-center opacity-20 flex flex-col items-center gap-3">
                                                <GitCommit className="h-8 w-8" />
                                                <p className="text-[9px] font-black uppercase tracking-widest">Sin versiones en esta rama</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>

                                <div className="p-4 bg-accent/2 border-t border-accent">
                                    <Button
                                        className="w-full bg-primary text-background font-black text-[10px] uppercase h-10 tracking-widest "
                                        onClick={() => setIsNewCommitOpen(true)}
                                    >
                                        <GitCommit className="mr-2 h-4 w-4" /> Registrar Versión
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Visor de Modelo */}
                        <div className="lg:col-span-9 flex flex-col">
                            <Card className="bg-card border-accent flex-1 overflow-hidden flex flex-col">
                                <CardHeader className="p-4 bg-accent/2 border-b border-accent flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                                            <Terminal className="h-4 w-4 text-primary" /> Control de versiones
                                        </CardTitle>
                                        <CardDescription className="text-[9px] font-bold uppercase text-muted-foreground mt-1">Gestión de ramas y versiones de diseño</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 p-0 relative group">
                                    <div className="flex border-b border-accent h-32 items-center justify-around bg-linear-to-br from-black to-accent/10 p-6">
                                        {['arquitectura', 'estructura', 'instalaciones'].map((role) => {
                                            const roleDoc = documents.find(d => d.bimRole === role);
                                            return (
                                                <div key={role} className="flex flex-col items-center justify-center p-4 bg-background/50 border border-accent rounded-xl w-64 shadow-xl">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                                                        <Box className="w-3 h-3" /> {role}
                                                    </span>
                                                    {roleDoc ? (
                                                        <div className="flex items-center gap-2 mb-2 w-full justify-center">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                            <span className="text-[10px] truncate max-w-[150px] font-mono text-muted-foreground">{roleDoc.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-2">No asignado</span>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-6 text-[9px] border-accent/50 w-full"
                                                        onClick={() => {
                                                            setAssignRoleTarget(role as any);
                                                            setIsAssignRoleModalOpen(true);
                                                        }}
                                                    >
                                                        Asignar Archivo
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {project && isAssignRoleModalOpen && (
                                        <IfcCloudModal
                                            isOpen={isAssignRoleModalOpen}
                                            onClose={() => setIsAssignRoleModalOpen(false)}
                                            projectId={project.id}
                                            onSelect={handleAssignRole}
                                        />
                                    )}

                                    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                                        <Layers className="h-16 w-16 mb-4 text-primary opacity-20" />
                                        <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-primary">El visor 3D en control de versiones está en construcción.</h3>
                                        <p className="text-[10px] uppercase tracking-widest mt-2 text-muted-foreground">Utilice el módulo de Diseño para visualizar y operar sobre los modelos asignados.</p>
                                    </div>
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-100 flex items-center justify-center -z-10">
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="assets">
                    <Card className="bg-card border-accent text-primary overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-accent/2 border-b border-accent">
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-3 font-headline uppercase tracking-tight">
                                    <Inbox className="h-7 w-7 text-primary" /> Activos Digitales
                                </h1>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Planos, nubes de puntos y modelos vinculados.</p>
                            </div>
                        </CardHeader>
                        <CardContent className="py-20 flex flex-col items-center justify-center opacity-20 group hover:opacity-40 transition-opacity duration-700">
                            <Box className="h-16 w-16 mb-4 text-primary" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">No hay activos digitales vinculados</h3>
                            <p className="text-[9px] uppercase tracking-widest mt-2">Vincule planos o modelos en el módulo de Documentación</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="items">
                    {hasItems ? (
                        <Card className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-white/2 border-b border-white/5">
                                <div>
                                    <CardTitle className="text-lg font-bold uppercase tracking-tight">Items Vinculados al Modelo</CardTitle>
                                    <CardDescription className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mt-1">Partidas detectadas en el modelo con sus metrados reales.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="border border-white/5 rounded-xl overflow-hidden mx-6 mb-6 mt-6">
                                    <Table>
                                        <TableHeader className="bg-white/5">
                                            <TableRow className="border-white/5 hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase py-4 px-6">ID Item</TableHead>
                                                <TableHead className="text-[10px) font-black uppercase">Descripción de la Partida</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-center">Unidad</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right">Cantidad Modelo</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right pr-6">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {project.items.map((pi: any, i: number) => (
                                                <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors group">
                                                    <TableCell className="font-mono text-[10px] text-primary px-6">{pi.item.id.slice(-6).toUpperCase()}</TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-white uppercase group-hover:text-primary transition-colors">{pi.item.description}</span>
                                                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-40">{pi.item.chapter}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-[10px] font-bold text-muted-foreground uppercase text-center">{pi.item.unit}</TableCell>
                                                    <TableCell className="text-xs font-mono text-right font-black text-primary">{(pi.quantity || 0).toFixed(2)}</TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => handleViewDetail(pi)}
                                                        >
                                                            <Eye className="h-4 w-4 text-primary" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20 bg-white/1">
                            <Layers className="h-16 w-16 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay ítems vinculados al modelo de esta obra.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="insumos">
                    {hasInsumos ? (
                        <Card className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-white/2 border-b border-white/5">
                                <div>
                                    <CardTitle className="text-lg font-bold uppercase tracking-tight">Consolidado de Insumos (Modelo)</CardTitle>
                                    <CardDescription className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mt-1">Requerimientos totales derivados del modelo BIM.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="border border-white/5 rounded-xl overflow-hidden mx-6 mb-6 mt-6">
                                    <Table>
                                        <TableHeader className="bg-white/5">
                                            <TableRow className="border-white/5 hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase py-4 px-6">Tipo</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase">Descripción del Recurso</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-center">Unidad</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right">Cant. Requerida</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right pr-6">P. Unit. Base</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {aggregatedSupplies.map((s: any, i: number) => (
                                                <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors">
                                                    <TableCell className="px-6 py-4">
                                                        <div className="p-2 bg-white/5 rounded-lg border border-white/10 w-fit">
                                                            {s.typology === 'Material' || s.typology === 'Insumo' ? (
                                                                <Package className="h-3.5 w-3.5 text-primary" />
                                                            ) : (
                                                                <UsersIcon className="h-3.5 w-3.5 text-emerald-500" />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs font-bold text-white uppercase">{s.description}</TableCell>
                                                    <TableCell className="text-[10px] font-bold text-muted-foreground uppercase text-center">{s.unit}</TableCell>
                                                    <TableCell className="text-xs font-mono text-right font-black text-emerald-500">{(s.totalQty || 0).toFixed(2)}</TableCell>
                                                    <TableCell className="text-xs font-mono text-right text-muted-foreground pr-6">${(s.price || 0).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20 bg-white/1">
                            <Package className="h-16 w-16 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No se han detectado requerimientos de insumos en el modelo.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="activos">
                    {hasAssets ? (
                        <Card className="bg-card border-accent text-primary overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-accent/2 border-b border-accent">
                                <div>
                                    <CardTitle className="text-lg font-bold uppercase tracking-tight">Activos Fijos Asignados a la Obra</CardTitle>
                                    <CardDescription className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mt-1">Maquinaria y equipos asignados físicamente a este proyecto.</CardDescription>
                                </div>
                                <Button size="sm" variant="outline" className="border-accent bg-accent/5 text-[10px] font-black uppercase h-10 px-6 hover:bg-accent/10" onClick={handleOpenAssignModal}>
                                    <Plus className="mr-2 h-4 w-4" /> Asignar Equipo
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="border border-accent rounded-xl overflow-hidden mx-6 mb-6 mt-6">
                                    <Table>
                                        <TableHeader className="bg-accent">
                                            <TableRow className="border-accent hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase py-4 px-6 w-32">Código</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase">Equipo / Activo</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase">Marca/Modelo</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-center">Estado</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right pr-12">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {projectAssets.map((asset) => (
                                                <TableRow key={asset.id} className="border-accent hover:bg-accent/5 transition-colors group">
                                                    <TableCell className="px-6 py-4">
                                                        <span className="text-[10px] font-mono font-black text-primary uppercase bg-primary/5 px-2 py-1 rounded border border-primary/10">
                                                            {asset.code}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs font-bold text-primary uppercase">{asset.name}</TableCell>
                                                    <TableCell className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                                                        {asset.brand} {asset.model}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2.5 py-0.5 border-accent",
                                                            asset.status === 'en_uso' ? 'text-primary bg-primary/10 border-primary/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                                        )}>
                                                            {asset.status.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-12">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleUnassignAsset(asset.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 border border-dashed border-accent rounded-3xl opacity-20 bg-accent/2">
                            <Truck className="h-16 w-16 mb-4 text-primary" />
                            <div className="text-center space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay activos fijos asignados a esta obra.</p>
                                <Button size="sm" variant="outline" className="border-accent text-[10px] font-black uppercase px-8 h-10 hover:bg-accent/10" onClick={handleOpenAssignModal}>
                                    <Plus className="mr-2 h-4 w-4" /> Asignar Primer Equipo
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="incidencias">
                    <Card className="bg-card border-accent overflow-hidden">
                        <CardHeader className="p-4 md:p-6 bg-accent/2 border-b border-accent">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                        <AlertCircle className="h-6 w-6 text-primary" /> Incidencias de Diseño
                                    </CardTitle>
                                    <CardDescription className="text-[10px] uppercase tracking-widest mt-1 text-muted-foreground">
                                        Issues vinculados a elementos del modelo BIM • Creados desde el workspace de diseño
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={issueFilter === 'all' ? 'default' : 'outline'}
                                        size="sm"
                                        className="text-[10px] font-black uppercase h-8 px-4"
                                        onClick={() => setIssueFilter('all')}
                                    >
                                        Todos ({bimIssues.length})
                                    </Button>
                                    <Button
                                        variant={issueFilter === 'pendiente' ? 'default' : 'outline'}
                                        size="sm"
                                        className="text-[10px] font-black uppercase h-8 px-4"
                                        onClick={() => setIssueFilter('pendiente')}
                                    >
                                        Pendientes ({bimIssues.filter(i => i.status === 'pendiente').length})
                                    </Button>
                                    <Button
                                        variant={issueFilter === 'resuelto' ? 'default' : 'outline'}
                                        size="sm"
                                        className="text-[10px] font-black uppercase h-8 px-4"
                                        onClick={() => setIssueFilter('resuelto')}
                                    >
                                        Resueltos ({bimIssues.filter(i => i.status === 'resuelto').length})
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredIssues.length > 0 ? (
                                <div className="divide-y divide-accent">
                                    {filteredIssues.map((issue: any) => (
                                        <div key={issue.id} className="p-4 md:p-6 hover:bg-accent/5 transition-colors group">
                                            <div className="flex items-start gap-4">
                                                <button
                                                    onClick={() => handleToggleIssueStatus(issue.id, issue.status)}
                                                    className={cn(
                                                        "mt-1 shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                                        issue.status === 'resuelto'
                                                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-500"
                                                            : "border-amber-500/40 text-amber-500/40 hover:border-amber-500 hover:text-amber-500"
                                                    )}
                                                    title={issue.status === 'pendiente' ? 'Marcar como resuelto' : 'Reabrir incidencia'}
                                                >
                                                    {issue.status === 'resuelto' ? (
                                                        <Check className="h-4 w-4" />
                                                    ) : (
                                                        <AlertCircle className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h4 className={cn(
                                                            "font-bold text-sm uppercase tracking-wide",
                                                            issue.status === 'resuelto' && "line-through text-muted-foreground/50"
                                                        )}>
                                                            {issue.title}
                                                        </h4>
                                                        <Badge className={cn(
                                                            "text-[8px] font-black uppercase tracking-widest border-none",
                                                            issue.status === 'pendiente'
                                                                ? "bg-amber-500/10 text-amber-500"
                                                                : "bg-emerald-500/10 text-emerald-500"
                                                        )}>
                                                            {issue.status}
                                                        </Badge>
                                                    </div>
                                                    {issue.description && (
                                                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                                            {issue.description}
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                                                        {issue.elementName && (
                                                            <span className="flex items-center gap-1.5">
                                                                <Layers className="h-3 w-3" /> {issue.elementName}
                                                            </span>
                                                        )}
                                                        {issue.elementId && (
                                                            <span className="flex items-center gap-1.5 font-mono text-[9px]">
                                                                <Terminal className="h-3 w-3" /> {issue.elementId.slice(0, 12)}...
                                                            </span>
                                                        )}
                                                        {issue.author && (
                                                            <span className="flex items-center gap-1.5">
                                                                <UserCircle className="h-3 w-3" /> {issue.author.name || issue.author.email}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="h-3 w-3" /> {new Date(issue.createdAt).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-28 opacity-30">
                                    <Inbox className="h-14 w-14 mb-4 text-muted-foreground" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                                        {issueFilter === 'all'
                                            ? 'No hay incidencias registradas. Crea una desde el workspace de diseño.'
                                            : `No hay incidencias con estado "${issueFilter}".`
                                        }
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="submittals">
                    <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-accent rounded-[2rem] bg-card backdrop-blur-sm group hover:border-primary/30 transition-all duration-500">
                        <div className="p-6 bg-accent/20 rounded-full mb-6 group-hover:scale-110 transition-transform duration-500">
                            <ClipboardList className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none mb-4 font-black uppercase tracking-widest text-[9px]">Próximamente</Badge>
                        <h3 className="text-xl font-black uppercase tracking-[0.2em] text-primary mb-2">Gestión de Submittals</h3>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 max-w-[400px] text-center leading-relaxed">
                            Control total de especificaciones técnicas y aprobaciones de materiales vinculadas a cada componente del diseño.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Nueva Rama Modal */}
            <Dialog open={isNewBranchOpen} onOpenChange={setIsNewBranchOpen}>
                <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-6 bg-white/2 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg"><GitBranch className="h-6 w-6 text-primary" /></div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase">Crear Nueva Rama</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Inicie una línea de diseño alternativa</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Nombre de la Rama (Branch)</Label>
                            <Input
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                                className="h-11 bg-white/5 border-white/10 uppercase font-bold text-sm"
                                placeholder="Ej: propuesta-estructural-v2"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t border-white/5 bg-black/20">
                        <Button variant="ghost" onClick={() => setIsNewBranchOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateBranch} disabled={isSaving || !newBranchName.trim()} className="bg-primary text-black font-black text-[10px] uppercase px-8 shadow-xl">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitBranch className="mr-2 h-4 w-4" />} Crear Rama
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Nueva Versión (Commit) Modal */}
            <Dialog open={isNewCommitOpen} onOpenChange={setIsNewCommitOpen}>
                <DialogContent className="max-w-md bg-card border-accent text-primary p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-card border-b border-accent">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg"><GitCommit className="h-6 w-6 text-emerald-500" /></div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase">Registrar Versión </DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Documente los cambios realizados en el modelo</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Mensaje de Versión</Label>
                            <Input
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                className="h-11 bg-card border-accent uppercase font-bold text-sm"
                                placeholder="Ej: Ajuste de espesor de losa..."
                            />
                        </div>
                        <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                            <p className="text-[9px] text-emerald-500 font-bold uppercase leading-relaxed">Esta acción generará un Hash único de auditoría y quedará registrada en la bitácora técnica de obra.</p>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t border-accent bg-card">
                        <Button variant="ghost" onClick={() => setIsNewCommitOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateCommit} disabled={isSaving || !commitMessage.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-background font-black text-[10px] uppercase px-8">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Confirmar Commit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}