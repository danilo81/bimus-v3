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
    LayoutGrid
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

    const [projectAssets, setProjectAssets] = useState<FixedAsset[]>([]);
    const [libraryAssets, setLibraryAssets] = useState<FixedAsset[]>([]);
    const [assetSearchTerm, setAssetSearchTerm] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProject = useCallback(async () => {
        const id = params?.id;
        const cleanId = Array.isArray(id) ? id[0] : id;

        if (cleanId) {
            setIsLoading(true);
            try {
                const [found, assetsResponse, bimResponse] = await Promise.all([
                    getProjectById(cleanId as string),
                    getProjectAssets(cleanId as string),
                    getProjectBimData(cleanId as string)
                ]);

                if (found) setProject(found);

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

    const mockAssets = [
        { id: '1', name: 'PLANO_CIMENTACION_REV01.PDF', type: 'DOCUMENT', size: '2.4 MB', version: 'v1.2' },
        { id: '2', name: 'NUBE_PUNTOS_TOPOGRAFIA.LAS', type: 'CLOUD', size: '1.2 GB', version: 'v2.0' },
        { id: '3', name: 'MODELO_ESTRUCTURAL_BASE.IFC', type: 'BIM', size: '45.8 MB', version: 'v3.1' },
        { id: '4', name: 'MEMORIA_CALCULO_ACERO.PDF', type: 'DOCUMENT', size: '850 KB', version: 'v1.0' },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-white/10"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3 font-headline uppercase tracking-tight">
                            <Box className="h-7 w-7 text-primary" /> Modelo:
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Gestión de activos digitales y control de versiones BIM</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest px-6 h-9">
                        <Download className="mr-2 h-4 w-4" /> Exportar Inventario
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="modelo" className="w-full">
                <TabsList className="bg-white/5 border border-white/10 h-12 p-0 rounded-xl overflow-hidden mb-6 flex flex-wrap md:flex-nowrap">
                    <TabsTrigger value="modelo" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none border-r border-white/10 text-xs md:text-sm font-black uppercase tracking-widest">
                        <Box className="mr-2 h-4 w-4" /> MODELO & VERSIONES
                    </TabsTrigger>
                    <TabsTrigger
                        value="assets"
                        className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none border-r border-white/10 text-xs md:text-sm font-black uppercase tracking-widest"
                    >
                        <HardDrive className="mr-2 h-4 w-4" /> ASSETS
                    </TabsTrigger>
                    <TabsTrigger
                        value="items"
                        className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none border-r border-white/10 text-xs md:text-sm font-black uppercase tracking-widest"
                    >
                        <Layers className="mr-2 h-4 w-4" /> ITEMS
                    </TabsTrigger>
                    <TabsTrigger
                        value="insumos"
                        className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none border-r border-white/10 text-xs md:text-sm font-black uppercase tracking-widest"
                    >
                        <Package className="mr-2 h-4 w-4" /> INSUMOS
                    </TabsTrigger>
                    <TabsTrigger
                        value="activos"
                        className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none text-xs md:text-sm font-black uppercase tracking-widest"
                    >
                        <Truck className="mr-2 h-4 w-4" /> ACTIVOS
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="modelo">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[75vh]">
                        {/* Sidebar de Versiones (Timeline) */}
                        <div className="lg:col-span-3 flex flex-col gap-4">
                            <Card className="bg-[#0a0a0a] border-white/10 flex-1 overflow-hidden flex flex-col">
                                <CardHeader className="p-4 bg-white/2 border-b border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <GitBranch className="h-4 w-4 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Rama Activa</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsNewBranchOpen(true)}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                    <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                        <SelectTrigger className="h-10 bg-black border-white/10 uppercase font-black text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0a0a0a] text-white border-white/10">
                                            {branches.map(b => (
                                                <SelectItem key={b.id} value={b.id} className="text-[10px] font-bold uppercase">{b.name} {b.isMain && '(MAIN)'}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </CardHeader>

                                <CardHeader className="p-4 bg-white/2 border-b border-white/5 py-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Historial de Cambios</span>
                                    </div>
                                </CardHeader>

                                <ScrollArea className="flex-1">
                                    <div className="p-4 space-y-6 relative">
                                        <div className="absolute left-5.25 top-6 bottom-6 w-px bg-white/5" />
                                        {(activeBranch as any)?.versions?.length > 0 ? (
                                            (activeBranch as any).versions.map((v: BimVersion) => (
                                                <div key={v.id} className="relative pl-8 group">
                                                    <div className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-[#0a0a0a] bg-primary/20 z-10 group-hover:bg-primary transition-colors" />
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black text-white uppercase truncate">{v.message}</span>
                                                            <Badge variant="outline" className="text-[7px] font-mono border-white/10 h-3.5 bg-white/5">{v.hash}</Badge>
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

                                <div className="p-4 bg-white/2 border-t border-white/5">
                                    <Button
                                        className="w-full bg-primary text-black font-black text-[10px] uppercase h-10 tracking-widest shadow-xl"
                                        onClick={() => setIsNewCommitOpen(true)}
                                    >
                                        <GitCommit className="mr-2 h-4 w-4" /> Registrar Versión
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Visor de Modelo */}
                        <div className="lg:col-span-9 flex flex-col">
                            <Card className="bg-[#0a0a0a] border-white/10 flex-1 overflow-hidden flex flex-col">
                                <CardHeader className="p-4 bg-white/2 border-b border-white/5 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                                            <Terminal className="h-4 w-4 text-primary" /> Terminal del Modelo BIM
                                        </CardTitle>
                                        <CardDescription className="text-[9px] font-bold uppercase text-muted-foreground mt-1">Viendo Rama: <span className="text-primary">{activeBranch?.name}</span></CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase hover:bg-white/5"><Download className="h-3.5 w-3.5 mr-1.5" /> Descargar (.rvt)</Button>
                                        <Button variant="outline" size="sm" className="h-8 border-white/10 text-[9px] font-black uppercase hover:bg-white/10"><Plus className="h-3.5 w-3.5 mr-1.5" /> Vincular IFC</Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 p-0 relative group">
                                    <BimViewer branchName={activeBranch?.name} />

                                    <div className="absolute bottom-6 right-6 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-2 rounded-xl flex gap-1 shadow-2xl">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary"><LayoutGrid className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary"><Layers className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary"><Box className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="assets">
                    <Card className="bg-[#0a0a0a] border-white/10 text-white overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-white/2 border-b border-white/5">
                            <div>
                                <CardTitle className="text-lg font-bold uppercase tracking-tight">Activos Digitales</CardTitle>
                                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Planos, nubes de puntos y modelos vinculados.</CardDescription>
                            </div>
                            <Button size="sm" className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest h-9 px-6 shadow-xl shadow-primary/10">
                                <Plus className="mr-2 h-4 w-4" /> Subir Asset
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {mockAssets.map((asset) => (
                                    <Card key={asset.id} className="bg-black/40 border-white/5 hover:border-primary/50 transition-all group overflow-hidden">
                                        <CardContent className="p-4 flex flex-col gap-3">
                                            <div className="flex items-start justify-between">
                                                <div className="p-2 bg-primary/20 rounded-lg group-hover:scale-110 transition-transform">
                                                    <FileText className="h-6 w-6 text-primary" />
                                                </div>
                                                <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground font-black uppercase">
                                                    {asset.type}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold truncate text-white uppercase tracking-tight">{asset.name}</h4>
                                                <div className="flex justify-between text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                    <span>{asset.size}</span>
                                                    <span className="text-primary">{asset.version}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                                                <Button variant="ghost" size="sm" className="flex-1 h-7 text-[10px] uppercase font-black hover:bg-primary hover:text-black">
                                                    <Eye className="h-3 w-3 mr-1" /> Ver
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 bg-white/5 hover:bg-white/10">
                                                    <Download className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
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
                        <Card className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-white/2 border-b border-white/5">
                                <div>
                                    <CardTitle className="text-lg font-bold uppercase tracking-tight">Activos Fijos Asignados a la Obra</CardTitle>
                                    <CardDescription className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mt-1">Maquinaria y equipos asignados físicamente a este proyecto.</CardDescription>
                                </div>
                                <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-[10px] font-black uppercase h-10 px-6 hover:bg-white/10" onClick={handleOpenAssignModal}>
                                    <Plus className="mr-2 h-4 w-4" /> Asignar Equipo
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="border border-white/5 rounded-xl overflow-hidden mx-6 mb-6 mt-6">
                                    <Table>
                                        <TableHeader className="bg-white/5">
                                            <TableRow className="border-white/5 hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase py-4 px-6 w-32">Código</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase">Equipo / Activo</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase">Marca/Modelo</TableHead>
                                                <TableHead className="text-[10px) font-black uppercase text-center">Estado</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right pr-12">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {projectAssets.map((asset) => (
                                                <TableRow key={asset.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                                    <TableCell className="px-6 py-4">
                                                        <span className="text-[10px] font-mono font-black text-primary uppercase bg-primary/5 px-2 py-1 rounded border border-primary/10">
                                                            {asset.code}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs font-bold text-white uppercase">{asset.name}</TableCell>
                                                    <TableCell className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                                                        {asset.brand} {asset.model}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2.5 py-0.5 border-white/10",
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
                        <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20 bg-white/1">
                            <Truck className="h-16 w-16 mb-4 text-primary" />
                            <div className="text-center space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay activos fijos asignados a esta obra.</p>
                                <Button size="sm" variant="outline" className="border-white/10 text-[10px] font-black uppercase px-8 h-10 hover:bg-white/10" onClick={handleOpenAssignModal}>
                                    <Plus className="mr-2 h-4 w-4" /> Asignar Primer Equipo
                                </Button>
                            </div>
                        </div>
                    )}
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
                <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-6 bg-white/2 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg"><GitCommit className="h-6 w-6 text-emerald-500" /></div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase">Registrar Versión (Commit)</DialogTitle>
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
                                className="h-11 bg-white/5 border-white/10 uppercase font-bold text-sm"
                                placeholder="Ej: Ajuste de espesor de losa..."
                            />
                        </div>
                        <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                            <p className="text-[9px] text-emerald-500 font-bold uppercase leading-relaxed">Esta acción generará un Hash único de auditoría y quedará registrada en la bitácora técnica de obra.</p>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t border-white/5 bg-black/20">
                        <Button variant="ghost" onClick={() => setIsNewCommitOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateCommit} disabled={isSaving || !commitMessage.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-black font-black text-[10px] uppercase px-8 shadow-xl">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Confirmar Commit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Asignar Equipo Modal */}
            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                <DialogContent className="sm:max-w-175 bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl flex flex-col h-[80vh]">
                    <DialogHeader className="p-6 border-b border-white/5 bg-white/2 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg border border-primary/20 shadow-inner">
                                <Truck className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Librería de Equipos y Maquinaria</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Seleccione los activos para asignar a la obra actual</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="relative shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar equipo por nombre, marca o código..."
                                className="pl-10 h-11 bg-white/5 border-white/10 text-[10px] font-bold uppercase tracking-widest"
                                value={assetSearchTerm}
                                onChange={(e) => setAssetSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="border border-white/10 rounded-xl overflow-hidden flex-1 bg-black/40">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                        <TableRow className="hover:bg-transparent border-white/10">
                                            <TableHead className="text-[10px] font-black uppercase py-4 px-6 w-32">Código</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Equipo / Activo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Marca</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right pr-6 w-24">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {libraryAssets
                                            .filter(a => a.name.toLowerCase().includes(assetSearchTerm.toLowerCase()) || a.code.toLowerCase().includes(assetSearchTerm.toLowerCase()))
                                            .length > 0 ? (
                                            libraryAssets
                                                .filter(a => a.name.toLowerCase().includes(assetSearchTerm.toLowerCase()) || a.code.toLowerCase().includes(assetSearchTerm.toLowerCase()))
                                                .map((asset) => (
                                                    <TableRow key={asset.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                                        <TableCell className="px-6 py-4">
                                                            <span className="text-[10px] font-mono font-black text-primary uppercase bg-primary/5 px-2 py-1 rounded border border-primary/10">
                                                                {asset.code}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-xs font-bold text-white uppercase group-hover:text-primary transition-colors">{asset.name}</TableCell>
                                                        <TableCell className="text-[10px] text-muted-foreground uppercase font-bold">{asset.brand}</TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <Button
                                                                size="sm"
                                                                className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-black rounded-lg active:scale-90 transition-all"
                                                                onClick={() => handleAssignAsset(asset.id)}
                                                                disabled={isSaving}
                                                            >
                                                                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-20 text-muted-foreground text-[10px] font-black uppercase opacity-30">
                                                    No se encontraron activos disponibles en la librería.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-white/5 bg-black shrink-0">
                        <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)} className="w-full text-[10px] font-black uppercase tracking-widest h-12 hover:bg-white/5">Cerrar Terminal de Equipos</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* APU Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-250 w-full max-h-[95vh] overflow-hidden bg-card border-muted/50 p-0 flex flex-col shadow-2xl">
                    {selectedItem && apuCalculations && (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b border-white/5 bg-black/20 flex flex-row items-center gap-4 shrink-0">
                                <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                    <Box className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <DialogTitle className="text-xl font-bold uppercase tracking-tight text-white leading-none">
                                        Análisis APU (Modelo BIM)
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">
                                        Análisis de precios unitarios y parámetros de control
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
                                                                <div className="bg-background/50 border border-white/5 rounded-md h-11 px-3 flex items-center text-white uppercase text-xs font-bold shadow-inner">
                                                                    {selectedItem.item.chapter}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Descripción ítem</Label>
                                                                <div className="bg-background/50 border border-white/5 rounded-md h-11 px-3 flex items-center text-white uppercase text-xs font-bold shadow-inner">
                                                                    {selectedItem.item.description}
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Unidad</Label>
                                                                    <div className="bg-background/50 border border-white/5 rounded-md h-11 px-3 flex items-center text-white uppercase text-xs font-bold shadow-inner">
                                                                        {selectedItem.item.unit}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Cantidad Modelo</Label>
                                                                    <div className="bg-background/50 border border-white/5 rounded-md h-11 px-3 flex items-center text-white font-mono font-bold shadow-inner">
                                                                        {selectedItem.quantity.toFixed(2)}
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
                                                <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden min-h-75 shadow-inner">
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
                                                                        <div className="p-2 bg-white/5 rounded-lg border border-white/10 w-fit shadow-inner">
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
                                                                        <div className="w-24 h-9 bg-black/40 border border-white/10 rounded flex items-center justify-center font-mono text-xs text-white mx-auto shadow-inner">
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
                                            <div className="h-full min-h-75 flex flex-col items-center justify-center text-muted-foreground text-center gap-4 bg-black/20 rounded-2xl border border-dashed border-white/5 shadow-inner">
                                                <Box className="h-16 w-16 opacity-5" />
                                                <p className="font-bold text-white uppercase text-xs tracking-[0.2em]">Protocolo de Calidad vinculado al Modelo</p>
                                                <p className="text-[10px] uppercase font-black tracking-widest opacity-30">Los criterios de aceptación se gestionan en la librería maestro.</p>
                                            </div>
                                        </TabsContent>
                                    </div>
                                </ScrollArea>

                                <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end items-center gap-4 shrink-0 shadow-2xl">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsDetailOpen(false)}
                                        className="text-[10px] font-black uppercase tracking-widest hover:bg-white/5 text-muted-foreground hover:text-white"
                                    >
                                        CERRAR DETALLE
                                    </Button>
                                    <Button className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest px-8 h-11 shadow-xl shadow-primary/10">
                                        <Download className="mr-2 h-4 w-4" /> EXPORTAR ANÁLISIS
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