"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    getSupplyRequests,
    getPurchaseOrders,
    createSupplyRequest,
    createPurchaseOrder,
    deletePurchaseOrder,
    getProjectById,
    addContactToProject,
    importContactToLibrary,
    getContacts,
    createContact
} from '@/actions';

import {
    ShoppingCart,
    ChevronLeft,
    Plus,
    Search,
    FileCheck,
    ClipboardList,
    History,
    FileSearch,
    Check,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Save,
    Printer,
    Trash2,
    UserPlus,
    Phone,
    UserCircle,
    Building2,
    CheckCircle2,
    X,
    Loader2,
    Calculator,
    MoreVertical
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';
import { ScrollArea } from '../../../../components/ui/scroll-area';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../../components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { Label } from '../../../../components/ui/label';
import { Checkbox } from '../../../../components/ui/checkbox';
import { useToast } from '../../../../hooks/use-toast';
import { useAuth } from '../../../../hooks/use-auth';
import { cn } from '../../../../lib/utils';

export default function ProjectShopPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [project, setProject] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('pedidos');

    // Data states
    const [requests, setRequests] = useState<any[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [userLibraryContacts, setUserLibraryContacts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [requestSearchTerm, setRequestSearchTerm] = useState('');

    // Modal states
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const [isNewPOOpen, setIsNewPOOpen] = useState(false);
    const [isCotizacionesOpen, setIsCotizacionesOpen] = useState(false);
    const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
    const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
    const [isRequestsHistoryOpen, setIsRequestsHistoryOpen] = useState(false);

    // Form states
    const [requestQuantities, setRequestQuantities] = useState<Record<string, string>>({});
    const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
    const [poSupplierId, setPOSupplierId] = useState<string>('none');
    const [poPaymentType, setPOPaymentType] = useState<'debito' | 'credito'>('debito');
    const [poDueDate, setPODueDate] = useState(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Sub-modal Calculator States
    const [isLevelBreakdownOpen, setIsLevelBreakdownOpen] = useState(false);
    const [selectedSupplyForBreakdown, setSelectedSupplyForBreakdown] = useState<any>(null);
    const [levelBreakdownInputs, setLevelBreakdownInputs] = useState<Record<string, string>>({});

    // Quotation state
    const [selectedRequestForQuotation, setSelectedRequestForQuotation] = useState<any>(null);
    const [quotationData, setQuotationData] = useState({
        supplierId: 'none',
        price: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [quotationOverrides, setQuotationOverrides] = useState<Record<string, { price: number, supplierId: string, date: string }>>({});

    // New Supplier State
    const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
    const [newSupplierData, setNewSupplierData] = useState({
        name: '',
        company: '',
        nit: '',
        phone: '',
    });

    const fetchProjectData = useCallback(async () => {
        const id = params?.id;
        const cleanId = Array.isArray(id) ? id[0] : id;
        if (!cleanId || cleanId === 'undefined') return;

        setIsLoading(true);
        try {
            const [proj, reqs, pos, libConts] = await Promise.all([
                getProjectById(cleanId),
                getSupplyRequests(cleanId),
                getPurchaseOrders(cleanId),
                getContacts()
            ]);
            setProject(proj);
            setRequests(reqs);
            if (pos.success) {
                setPurchaseOrders(pos.orders);
            }
            setUserLibraryContacts(libConts);

            // Consolidar proveedores: Mi librería + Proveedores vinculados por otros al proyecto
            const projectSuppliers = proj?.team?.filter((m: any) => m.type === 'proveedor') || [];
            const librarySuppliers = libConts.filter((c: any) => c.type === 'proveedor');

            const allSupMap = new Map();
            // Priorizamos los de la librería local (tienen mis notas/bancos), pero incluimos los del proyecto
            projectSuppliers.forEach((s: any) => allSupMap.set(s.id, s));
            librarySuppliers.forEach((s: any) => allSupMap.set(s.id, s));

            setSuppliers(Array.from(allSupMap.values()));
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [params?.id]);

    useEffect(() => {
        fetchProjectData();
    }, [fetchProjectData]);

    // Funciones de la Calculadora de Niveles
    const getSupplyComputeForLevel = useCallback((supplyId: string, levelId: string): number => {
        if (!project?.items || !levelId) return 0;
        let total = 0;
        for (const pi of project.items) {
            const levelQty = pi.levelQuantities?.find((lq: any) => lq.levelId === levelId)?.quantity ?? 0;
            if (levelQty === 0) continue;

            const itemSupply = pi.item?.supplies?.find((is: any) => is.supply?.id === supplyId);
            if (!itemSupply) continue;
            total += levelQty * (itemSupply.quantity || 0);
        }
        return total;
    }, [project]);

    const handleOpenLevelBreakdown = (supply: any) => {
        setSelectedSupplyForBreakdown(supply);
        setLevelBreakdownInputs({});
        setIsLevelBreakdownOpen(true);
    };

    const handleConfirmBreakdown = () => {
        if (!selectedSupplyForBreakdown) return;
        const total = Object.values(levelBreakdownInputs).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);

        setRequestQuantities(prev => ({
            ...prev,
            [selectedSupplyForBreakdown.id]: total > 0 ? total.toFixed(2) : ''
        }));

        setIsLevelBreakdownOpen(false);
    };

    const projectSupplies = useMemo(() => {
        if (!project || !project.items) return [];
        const map: Record<string, any> = {};

        project.items.forEach((pi: any) => {
            const itemQty = pi.quantity || 0;
            pi.item?.supplies?.forEach((is: any) => {
                const s = is.supply;
                if (s.typology === 'Material' || s.typology === 'Insumo') {
                    const requiredQty = itemQty * (is.quantity || 0);
                    if (map[s.id]) {
                        map[s.id].totalRequired += requiredQty;
                    } else {
                        map[s.id] = {
                            id: s.id,
                            description: s.description,
                            unit: s.unit,
                            price: s.price,
                            totalRequired: requiredQty,
                            costs: s.costs || []
                        };
                    }
                }
            });
        });

        return Object.values(map).map((s: any) => {
            const everRequested = requests.filter(r => r.supplyId === s.id).reduce((acc, r) => acc + (r.quantity || 0), 0);
            return {
                ...s,
                totalRequestedEver: everRequested,
                balance: s.totalRequired - everRequested
            };
        }).sort((a: any, b: any) => a.description.localeCompare(b.description));
    }, [project, requests]);

    const poCompatibleItems = useMemo(() => {
        if (poSupplierId === 'none') return [];
        return requests.filter(r => {
            if (!selectedRequestIds.includes(r.id)) return false;
            if (r.status !== 'pendiente') return false;

            const override = quotationOverrides[r.id];
            return !override || override.supplierId === poSupplierId;
        });
    }, [requests, selectedRequestIds, poSupplierId, quotationOverrides]);

    // Cálculos de Orden de Compra (Base vs Proveedor)
    const poBaseTotal = useMemo(() => {
        return poCompatibleItems.reduce((acc, r) => acc + (r.quantity * r.supply.price), 0);
    }, [poCompatibleItems]);

    const poTotalAmount = useMemo(() => {
        return poCompatibleItems.reduce((acc, r) => {
            const override = quotationOverrides[r.id];
            const price = override ? override.price : r.supply.price;
            return acc + (r.quantity * price);
        }, 0);
    }, [poCompatibleItems, quotationOverrides]);

    const poVariationTotal = poTotalAmount - poBaseTotal;

    const handleCreateRequestBatch = async () => {
        const validRequests = Object.entries(requestQuantities)
            .filter(([_, qty]) => parseFloat(qty) > 0)
            .map(([supplyId, qty]) => ({ supplyId, quantity: parseFloat(qty) }));

        if (validRequests.length === 0) {
            toast({ title: "Sin datos", description: "Ingrese cantidades para los insumos deseados.", variant: "destructive" });
            return;
        }

        for (const req of validRequests) {
            const supplyInfo = projectSupplies.find(s => s.id === req.supplyId);
            if (supplyInfo && req.quantity > (supplyInfo.balance + 0.001)) {
                toast({
                    title: "Exceso de pedido",
                    description: `La cantidad para "${supplyInfo.description}" supera el saldo presupuestado (${supplyInfo.balance.toFixed(2)} ${supplyInfo.unit}).`,
                    variant: "destructive"
                });
                return;
            }
        }

        setIsSaving(true);
        try {
            for (const req of validRequests) {
                await createSupplyRequest({
                    projectId: project.id,
                    supplyId: req.supplyId,
                    quantity: req.quantity
                });
            }
            toast({ title: "Pedidos Registrados", description: `${validRequests.length} solicitudes han sido creadas.` });
            setIsNewRequestOpen(false);
            setRequestQuantities({});
            setRequestSearchTerm('');
            fetchProjectData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreatePO = async () => {
        if (poSupplierId === 'none' || poCompatibleItems.length === 0) return;
        setIsSaving(true);
        try {
            const items = poCompatibleItems.map(req => {
                const override = quotationOverrides[req.id];
                return {
                    supplyId: req.supplyId,
                    quantity: req.quantity,
                    price: override ? override.price : req.supply.price
                };
            });

            // Se inyecta la advertencia en las notas para el backend (si el schema lo soporta, será útil)
            const warningNote = poVariationTotal > 0
                ? `ADVERTENCIA DE COSTOS: Se registró un sobrecosto total de $${poVariationTotal.toFixed(2)} respecto al presupuesto base autorizado.`
                : undefined;

            const payload: any = {
                projectId: project.id,
                supplierId: poSupplierId,
                paymentType: poPaymentType,
                dueDate: poPaymentType === 'credito' ? poDueDate : undefined,
                items,
                requestIds: poCompatibleItems.map(i => i.id)
            };

            // Inyectamos la nota de forma segura
            if (warningNote) {
                payload.notes = warningNote;
            }

            const result = await createPurchaseOrder(payload);

            if (result.success) {
                toast({ title: "Orden de Compra Generada", description: `Se ha creado la orden para ${poCompatibleItems.length} ítems.` });
                setIsNewPOOpen(false);
                const processedIds = poCompatibleItems.map(i => i.id);
                setSelectedRequestIds(prev => prev.filter(id => !processedIds.includes(id)));
                setPOSupplierId('none');
                fetchProjectData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePO = async (id: string) => {
        if (!confirm('¿Desea eliminar esta Orden de Compra?')) return;
        try {
            const result = await deletePurchaseOrder(id);
            if (result.success) {
                toast({ title: "Orden eliminada", variant: "destructive" });
                fetchProjectData();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleOpenQuotation = (req: any) => {
        setSelectedRequestForQuotation(req);
        const existing = quotationOverrides[req.id];
        setQuotationData({
            supplierId: existing ? existing.supplierId : 'none',
            price: existing ? existing.price.toString() : req.supply.price.toString(),
            date: existing ? existing.date : new Date().toISOString().split('T')[0]
        });
        setIsQuotationModalOpen(true);
    };

    const handleSaveQuotation = () => {
        if (!selectedRequestForQuotation) return;
        setQuotationOverrides(prev => ({
            ...prev,
            [selectedRequestForQuotation.id]: {
                price: parseFloat(quotationData.price) || 0,
                supplierId: quotationData.supplierId,
                date: quotationData.date
            }
        }));
        toast({ title: "Cotización vinculada" });
        setIsQuotationModalOpen(false);
    };

    const handleImportToLibrary = async (contactId: string) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const result = await importContactToLibrary(contactId);
            if (result.success) {
                toast({ title: "Proveedor importado", description: "El contacto ahora forma parte de tu librería global." });
                fetchProjectData();
            } else {
                toast({ title: "Aviso", description: result.error, variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project) return;
        setIsCreatingSupplier(true);
        try {
            const finalName = newSupplierData.name.trim() || newSupplierData.company.trim() || 'PROVEEDOR NUEVO';

            const result = await createContact({
                ...newSupplierData,
                name: finalName,
                type: 'proveedor',
                status: 'active'
            });

            if (result.success && result.contact) {
                const linkResult = await addContactToProject(project.id, result.contact.id);

                if (linkResult.success) {
                    toast({ title: "Proveedor Registrado", description: "Se ha vinculado al equipo del proyecto." });
                }

                await fetchProjectData();

                if (isQuotationModalOpen) {
                    setQuotationData(prev => ({ ...prev, supplierId: result.contact!.id }));
                } else if (isNewPOOpen) {
                    setPOSupplierId(result.contact!.id);
                }

                setIsCreateSupplierOpen(false);
                setNewSupplierData({ name: '', company: '', nit: '', phone: '' });
            } else {
                throw new Error(result.error || 'No se pudo crear el proveedor.');
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsCreatingSupplier(false);
        }
    };

    const handlePrintPO = (po: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const rows = po.items.map((item: any) => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px;">${item.supply.description}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px; text-align: center;">${item.supply.unit}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px; text-align: right;">${item.quantity.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px; text-align: right;">$${item.price.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px; text-align: right; font-weight: bold;">$${(item.quantity * item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
        `).join('');
        const html = `<html><head><style>body{font-family:sans-serif;padding:40px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:10px;font-size:11px;}th{background:#f8f8f8;text-align:left;font-weight:900;text-transform:uppercase;}</style></head><body><h1>Orden de Compra ${po.number}</h1><p>Fecha: ${new Date(po.createdAt).toLocaleDateString()}</p><table><thead><tr><th>Descripción</th><th>Und.</th><th>Cant.</th><th>P. Unit.</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><h3>Total: $${po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3><script>window.onload=function(){window.print();}</script></body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    if (isLoading) return <div className="flex min-h-screen items-center justify-center h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!project) return null;

    return (
        <div className="flex flex-col text-primary p-4 md:p-8 space-y-6 overflow-y-auto">


            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-card border border-accent h-12 p-0 rounded-xl overflow-hidden mb-6 flex flex-wrap md:flex-nowrap">
                    <TabsTrigger value="pedidos" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r text-xs md:text-sm">
                        <ClipboardList className="mr-2 h-4 w-4" /> PEDIDOS DE OBRA
                    </TabsTrigger>
                    <TabsTrigger value="ordenes" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none text-xs md:text-sm">
                        <FileCheck className="mr-2 h-4 w-4" /> ÓRDENES DE COMPRA
                    </TabsTrigger>
                </TabsList>


                <TabsContent value="pedidos" className="space-y-6">
                    <Card className="bg-card border-accent text-primary overflow-hidden gap-0">
                        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-7 border-b border-accent">
                            <div className="flex items-center gap-4 w-full">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <ShoppingCart className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex flex-col text-left flex-1">
                                    <CardTitle className="text-lg font-bold uppercase tracking-tight">Gestión de Suministros</CardTitle>
                                    <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Planificación y control de compras de insumos.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex items-center justify-between gap-4 bg-card p-3 rounded-xl border border-accent">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar pedidos..."
                                        className="pl-10 bg-card border-accent h-11 text-xs"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsRequestsHistoryOpen(true)}
                                        className="border-accent bg-card text-muted-foreground font-bold text-[10px] uppercase tracking-widest px-4 h-11 rounded-xl hover:bg-accent hover:text-primary"
                                    >
                                        <History className="mr-2 h-4 w-4" /> Historial
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsCotizacionesOpen(true)}
                                        className="border-accent bg-card text-muted-foreground font-bold text-[10px] uppercase tracking-widest px-4 h-11 rounded-xl hover:bg-accent hover:text-primary"
                                    >
                                        <Building2 className="mr-2 h-4 w-4" /> Directorio
                                    </Button>
                                    <Button
                                        onClick={() => setIsNewRequestOpen(true)}
                                        className="bg-primary hover:bg-primary/90 text-background font-bold text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl"
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Nuevo Pedido
                                    </Button>
                                    <Button
                                        onClick={() => setIsNewPOOpen(true)}
                                        disabled={selectedRequestIds.length === 0}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-background font-bold text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl disabled:opacity-50"
                                    >
                                        <FileCheck className="mr-2 h-4 w-4" /> Generar OC ({selectedRequestIds.length})
                                    </Button>
                                </div>
                            </div>


                            <div className="border border-accent rounded-xl overflow-x-auto bg-card">
                                <Table>
                                    <TableHeader className="bg-accent">
                                        <TableRow className="border-accent">
                                            <TableHead className="w-12 text-center" />
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase whitespace-nowrap">Material / Insumo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center whitespace-nowrap">Unidad</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right whitespace-nowrap">Cantidad</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase min-w-64 px-6 whitespace-nowrap">Proveedor / Cotización</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center whitespace-nowrap">Estado</TableHead>
                                            <TableHead className="text-right pr-6 text-[10px] font-black uppercase whitespace-nowrap">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.filter(r => r.status === 'pendiente').filter(r => r.supply.description.toLowerCase().includes(searchTerm.toLowerCase())).map((req) => {
                                            const override = quotationOverrides[req.id];
                                            const dbPreferredCost = req.supply.costs?.find((c: any) => c.isPreferred) || req.supply.costs?.[0];

                                            let supplier = null;
                                            if (override) {
                                                supplier = suppliers.find(s => s.id === override.supplierId);
                                            } else if (dbPreferredCost?.supplier) {
                                                supplier = dbPreferredCost.supplier;
                                            }

                                            const isExternal = supplier && supplier.userId !== user?.id;
                                            const alreadyInLibrary = supplier && userLibraryContacts.some(c => c.nit === supplier.nit);

                                            return (
                                                <TableRow key={req.id} className="border-accent hover:bg-muted/40 transition-colors">
                                                    <TableCell className="text-center">
                                                        <Checkbox disabled={req.status !== 'pendiente'} checked={selectedRequestIds.includes(req.id)} onCheckedChange={(checked) => setSelectedRequestIds(prev => checked ? [...prev, req.id] : prev.filter(id => id !== req.id))} />
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <span className="text-[14px] font-black text-primary uppercase">{req.supply.description}</span>
                                                    </TableCell>
                                                    <TableCell className="text-[12px] text-center font-bold text-muted-foreground uppercase">{req.supply.unit}</TableCell>
                                                    <TableCell className="text-[12px] font-mono text-right font-black text-primary">{req.quantity.toFixed(2)}</TableCell>
                                                    <TableCell className="px-6">
                                                        {supplier ? (
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[11px] font-bold text-primary uppercase leading-none">
                                                                        {supplier.company || supplier.name || 'PROVEEDOR VARIOS'}
                                                                    </span>
                                                                    {isExternal && !alreadyInLibrary && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <button onClick={() => handleImportToLibrary(supplier.id)} className="p-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all">
                                                                                        <UserPlus className="h-2.5 w-2.5" />
                                                                                    </button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent className="text-[8px] uppercase font-black bg-card border-accent">Importar a mi librería global</TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] font-mono font-black text-primary/60 mt-1">
                                                                    ${(override ? override.price : (dbPreferredCost?.price || req.supply.price)).toFixed(2)}
                                                                </div>
                                                            </div>
                                                        ) : <span className="text-[10px] text-muted-foreground/30 uppercase italic">— Sin Cotización —</span>}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase border-none", req.status === 'pendiente' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500')}>
                                                            {req.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Button variant="ghost" size="icon" disabled={req.status !== 'pendiente'} onClick={() => handleOpenQuotation(req)} className="h-8 w-8 hover:bg-white/10">
                                                            <FileSearch className="h-4 w-4 text-primary" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ordenes" className="space-y-6">
                    <Card className="bg-card border-accent text-primary overflow-hidden gap-0">
                        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-7 border-b border-accent">
                            <div className="flex items-center gap-4 w-full">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <FileCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex flex-col text-left flex-1">
                                    <CardTitle className="text-lg font-bold uppercase tracking-tight">Órdenes de Compra</CardTitle>
                                    <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Directorio de adquisiciones formalizadas.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex items-center justify-between gap-4 bg-card p-3 rounded-xl border border-accent">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar órdenes..."
                                        className="pl-10 bg-card border-accent h-11 text-xs"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* <Button
                                        variant="outline"
                                        onClick={fetchProjectData}
                                        className="border-accent bg-card text-muted-foreground font-bold text-[10px] uppercase tracking-widest px-4 h-11 rounded-xl hover:bg-accent hover:text-primary"
                                    >
                                        <History className="mr-2 h-4 w-4" /> Sincronizar
                                    </Button> */}
                                </div>
                            </div>

                            <div className="border border-accent rounded-xl overflow-x-auto bg-card">
                                <Table>
                                    <TableHeader className="bg-accent">
                                        <TableRow className="border-accent">
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase whitespace-nowrap">Nro. Orden</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase min-w-[250px] whitespace-nowrap">Proveedor / Razón Social</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center whitespace-nowrap">Fecha</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right whitespace-nowrap">Total Orden</TableHead>
                                            <TableHead className="text-right pr-6 text-[10px] font-black uppercase whitespace-nowrap">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchaseOrders.length > 0 ? (
                                            purchaseOrders
                                                .filter(po => po.number.toLowerCase().includes(searchTerm.toLowerCase()) || (po.supplier?.company || po.supplier?.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map((po) => (
                                                    <TableRow key={po.id} className="border-accent hover:bg-muted/40 transition-colors">
                                                        <TableCell className="font-mono text-[12px] font-black text-primary px-6">{po.number}</TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[14px] font-black text-primary uppercase">{po.supplier?.company || po.supplier?.name || 'PROVEEDOR VARIOS'}</span>
                                                                <span className="text-[10px] font-bold text-primary/40 uppercase">NIT: {po.supplier?.nit || '—'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-[12px] text-center font-bold text-muted-foreground uppercase">
                                                            {new Date(po.createdAt).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-[14px] font-mono text-right font-black text-primary bg-emerald-500/10">
                                                            ${po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                                                                        <MoreVertical className="h-4 w-4 text-primary" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-card border-accent text-primary p-2 rounded-lg">
                                                                    <DropdownMenuItem onClick={() => handlePrintPO(po)} className="text-[10px] font-black uppercase tracking-widest cursor-pointer py-3 rounded-lg focus:bg-primary/10">
                                                                        <Printer className="mr-3 h-4 w-4 text-primary" /> Imprimir Orden
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleDeletePO(po.id)} className="text-[10px] font-black uppercase tracking-widest text-red-500 focus:bg-red-500/10 cursor-pointer py-3 rounded-lg">
                                                                        <Trash2 className="mr-3 h-4 w-4" /> Eliminar Registro
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground text-xs italic">
                                                    No hay órdenes de compra registradas.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal de Cotizaciones / Directorio de Proveedores del Proyecto */}
            <Dialog open={isCotizacionesOpen} onOpenChange={setIsCotizacionesOpen}>
                <DialogContent className="max-w-3xl bg-card border-accent text-primary p-0 overflow-hidden  flex flex-col h-[80vh]">
                    <DialogHeader className="p-6 border-b border-accent bg-card shrink-0 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Directorio de Proveedores</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[10px] font-black uppercase mt-1 tracking-widest">Empresas vinculadas a este proyecto específico</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 flex-1 overflow-hidden flex flex-col space-y-4">
                        <div className="flex justify-between items-center bg-card p-3 rounded-xl border border-accent">
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Proveedores Activos: {suppliers.length}</p>
                            <Button size="sm" className="bg-primary text-background font-bold text-[10px] uppercase h-8 px-4 rounded-lg" onClick={() => setIsCreateSupplierOpen(true)}>
                                <Plus className="mr-1.5 h-3 w-3" /> Adicionar Nuevo
                            </Button>
                        </div>

                        <div className="flex-1 border border-accent rounded-xl overflow-hidden bg-card/40">

                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-accent sticky top-0 z-10">
                                        <TableRow className="border-accent hover:bg-transparent">
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Razón Social / Empresa</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Contacto</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Nit / C.I.</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-6">Libreria</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>

                                        {suppliers.length > 0 ? (
                                            suppliers.map((s) => {
                                                const alreadyInLibrary = userLibraryContacts.some(c => c.nit === s.nit);
                                                return (
                                                    <TableRow key={s.id} className="border-accent hover:bg-muted/40 transition-colors group">
                                                        <TableCell className="py-4 px-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-[13px] font-black text-primary uppercase">{s.company || 'VARIOS'}</span>
                                                                <span className="text-[9px] text-muted-foreground uppercase font-black opacity-60">Proveedor Obra</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-[12px] font-bold text-primary uppercase">{s.name}</TableCell>
                                                        <TableCell className="font-mono text-[11px] text-muted-foreground">{s.nit || '—'}</TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            {!alreadyInLibrary && s.userId !== user?.id && (
                                                                <Button variant="outline" size="sm" className="h-7 border-primary/20 text-primary text-[8px] font-black uppercase px-3 rounded-lg" onClick={() => handleImportToLibrary(s.id)}>
                                                                    <UserPlus className="h-3 w-3 mr-1.5" /> Importar
                                                                </Button>
                                                            )}
                                                            {alreadyInLibrary && <Badge variant="outline" className="text-[8px] font-black uppercase h-5 bg-primary/10 text-primary border-none">En mi librería</Badge>}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-20 text-muted-foreground uppercase text-[10px] font-black opacity-40">Sin proveedores vinculados.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>
                    <DialogFooter className="p-4 border-t border-accent bg-card shrink-0">
                        <Button variant="ghost" onClick={() => setIsCotizacionesOpen(false)} className="w-full text-[10px] font-black uppercase tracking-widest hover:bg-white/5">Cerrar Directorio</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Nuevo Pedido */}
            <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
                <DialogContent className="sm:max-w-[850px] bg-card border-accent text-primary p-0 overflow-hidden flex flex-col h-[85vh] shadow-2xl">
                    <DialogHeader className="p-6 border-b border-accent bg-card shrink-0 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <Plus className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Nueva Solicitud de Material</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground mt-1 tracking-widest">Seleccione los insumos presupuestados para la obra</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="relative shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="BUSCAR INSUMO..." className="pl-10 h-11 bg-card border-accent text-[12px] font-bold uppercase rounded-xl" value={requestSearchTerm} onChange={(e) => setRequestSearchTerm(e.target.value)} />
                        </div>
                        <div className="border border-accent rounded-xl overflow-hidden flex-1 bg-card/40">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-accent sticky top-0 z-10">
                                        <TableRow className="border-accent hover:bg-transparent">
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase">Insumo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center w-32">Saldo Pto.</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center w-48 pr-6">Cantidad a Pedir</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>

                                        {projectSupplies.filter((s: any) => s.description.toLowerCase().includes(requestSearchTerm.toLowerCase())).map((s: any) => (
                                            <TableRow key={s.id} className="border-accent hover:bg-muted/40 transition-colors">
                                                <TableCell className="py-4 px-6">
                                                    <span className="text-[13px] font-black text-primary uppercase">{s.description}</span>
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-[12px] font-black text-amber-500">{s.balance.toFixed(2)}</TableCell>
                                                <TableCell className="pr-6">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={requestQuantities[s.id] || ''}
                                                            onChange={(e) => setRequestQuantities(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                            className="h-10 w-24 bg-card border-accent text-center font-mono text-sm rounded-lg"
                                                            placeholder="0.00"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-10 w-10 border-accent bg-card hover:bg-primary/20 hover:text-primary transition-colors shrink-0 rounded-lg"
                                                            onClick={() => handleOpenLevelBreakdown(s)}
                                                        >
                                                            <Calculator className="h-4 w-4" />
                                                        </Button>
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase w-8 text-left">{s.unit}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t border-accent bg-card shrink-0">
                        <Button variant="ghost" onClick={() => setIsNewRequestOpen(false)} className="text-[12px] font-bold uppercase tracking-widest hover:bg-white/5">Cancelar</Button>
                        <Button onClick={handleCreateRequestBatch} disabled={isSaving} className="bg-primary text-background font-bold text-[12px] uppercase h-12 px-12 rounded-xl ml-4">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} CONFIRMAR PEDIDO
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sub-Modal: Calculadora por Niveles */}
            <Dialog open={isLevelBreakdownOpen} onOpenChange={setIsLevelBreakdownOpen}>
                <DialogContent className="sm:max-w-[600px] bg-card border-accent text-primary p-0 overflow-hidden flex flex-col shadow-2xl">
                    <DialogHeader className="p-6 border-b border-accent bg-accent/50 shrink-0">
                        <DialogTitle className="text-xl font-bold uppercase text-primary flex items-center gap-2">
                            <Calculator className="h-6 w-6" /> Calcular Cantidad
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground mt-1">
                            Distribución de <span className="text-primary font-black underline">{selectedSupplyForBreakdown?.description}</span> por niveles
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 flex-1 overflow-y-auto max-h-[50vh]">
                        <div className="border border-accent rounded-xl overflow-hidden bg-card/40">
                            <Table>
                                <TableHeader className="bg-accent">
                                    <TableRow className="border-accent">
                                        <TableHead className="text-[10px] font-black uppercase py-4 px-6 text-left">Nivel de Obra</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right">Requerido Pto.</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right w-36 pr-6">Cant. Pedir</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>

                                    {project?.levels?.map((lvl: any) => {
                                        const required = getSupplyComputeForLevel(selectedSupplyForBreakdown?.id, lvl.id);
                                        if (required <= 0) return null;

                                        return (
                                            <TableRow key={lvl.id} className="border-accent hover:bg-muted/40 transition-colors">
                                                <TableCell className="text-[13px] font-black uppercase py-4 px-6">{lvl.name}</TableCell>
                                                <TableCell className="text-right font-mono text-[12px] text-amber-500 font-bold">
                                                    {required.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right pr-6 py-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={levelBreakdownInputs[lvl.id] || ''}
                                                        onChange={(e) => setLevelBreakdownInputs(prev => ({ ...prev, [lvl.id]: e.target.value }))}
                                                        className="h-10 bg-card border-accent text-right font-mono text-sm focus-visible:ring-primary rounded-lg"
                                                        placeholder="0.00"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}


                                    {project?.levels?.every((lvl: any) => getSupplyComputeForLevel(selectedSupplyForBreakdown?.id, lvl.id) <= 0) && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-10 text-[10px] uppercase font-black text-muted-foreground opacity-50">
                                                Este insumo no está asignado a ningún nivel específico en el presupuesto.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-accent bg-accent/20 shrink-0 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Acuulado</span>
                            <span className="text-2xl font-black text-primary font-mono">
                                {Object.values(levelBreakdownInputs).reduce((acc, val) => acc + (parseFloat(val) || 0), 0).toFixed(2)}
                                <span className="text-[12px] ml-1 text-muted-foreground font-black">{selectedSupplyForBreakdown?.unit}</span>
                            </span>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setIsLevelBreakdownOpen(false)} className="text-[12px] font-bold uppercase tracking-widest hover:bg-white/5">Cancelar</Button>
                            <Button onClick={handleConfirmBreakdown} className="bg-primary text-background font-bold text-[12px] uppercase h-11 px-8 rounded-xl shadow-xl">
                                <Check className="mr-2 h-4 w-4" /> Aplicar Suma
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Cotización */}
            <Dialog open={isQuotationModalOpen} onOpenChange={setIsQuotationModalOpen}>
                <DialogContent className="max-w-2xl bg-card border-accent text-primary p-0 overflow-hidden flex flex-col shadow-2xl">
                    <DialogHeader className="p-6 border-b border-accent bg-card shrink-0 flex flex-row items-center space-y-0 gap-3">
                        <FileSearch className="h-6 w-6 text-amber-500" />
                        <div>
                            <DialogTitle className="text-xl font-bold uppercase tracking-tight">Gestionar Cotización</DialogTitle>
                            <DialogDescription className="text-[10px] font-black uppercase mt-1">Vincule un proveedor y precio específico para este pedido</DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Seleccionar Proveedor</Label>
                                    <Button variant="link" size="sm" className="h-auto p-0 text-primary text-[10px] font-black uppercase" onClick={() => setIsCreateSupplierOpen(true)}>
                                        <Plus className="h-3 w-3 mr-1" /> Nuevo Proveedor
                                    </Button>
                                </div>
                                <Select value={quotationData.supplierId} onValueChange={(v) => setQuotationData(prev => ({ ...prev, supplierId: v }))}>
                                    <SelectTrigger className="h-11 bg-card border-accent uppercase font-bold text-xs rounded-sm w-full">
                                        <SelectValue placeholder="Busque proveedor..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card text-primary border-accent">
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={s.id} className="text-[10px] font-bold uppercase">{s.company || s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Precio Unit. (USD)</Label>
                                    <Input type="number" step="0.01" value={quotationData.price} onChange={(e) => setQuotationData(prev => ({ ...prev, price: e.target.value }))} className="h-11 bg-card border-accent font-mono text-base font-black text-amber-500 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Fecha Oferta</Label>
                                    <Input type="date" value={quotationData.date} onChange={(e) => setQuotationData(prev => ({ ...prev, date: e.target.value }))} className="h-11 bg-card border-accent font-mono text-[11px] rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t border-accent bg-card shrink-0">
                        <Button variant="ghost" onClick={() => setIsQuotationModalOpen(false)} className="text-[12px] font-bold uppercase tracking-widest hover:bg-white/5">Cancelar</Button>
                        <Button onClick={handleSaveQuotation} disabled={!quotationData.price || quotationData.supplierId === 'none'} className="bg-amber-500 hover:bg-amber-600 text-background font-bold text-[12px] uppercase h-11 px-10 ml-4 rounded-xl">
                            <Check className="mr-2 h-4 w-4" /> Vincular Oferta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Nuevo Proveedor Directo */}
            <Dialog open={isCreateSupplierOpen} onOpenChange={setIsCreateSupplierOpen}>
                <DialogContent className="sm:max-w-md bg-card border-accent text-primary p-0 overflow-hidden  flex flex-col h-auto">
                    <form onSubmit={handleCreateSupplier} className="flex flex-col h-full">
                        <DialogHeader className="p-6 border-b border-accent bg-card shrink-0 flex flex-row items-center space-y-0 gap-3">
                            <Building2 className="h-6 w-6 text-primary" />
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Nuevo Proveedor Directo</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Alta de contacto en directorio de obra</DialogDescription>
                            </div>
                        </DialogHeader>

                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><UserCircle className="h-3 w-3" /> Nombre de Contacto</Label>
                                <Input value={newSupplierData.name} onChange={(e) => setNewSupplierData(p => ({ ...p, name: e.target.value }))} className="h-11 bg-card border-accent uppercase font-bold text-xs rounded-xl" required placeholder="EJ: CARLOS RUIZ" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><Building2 className="h-3 w-3" /> Razón Social (Empresa)</Label>
                                <Input value={newSupplierData.company} onChange={(e) => setNewSupplierData(p => ({ ...p, company: e.target.value }))} className="h-11 bg-card border-accent uppercase font-bold text-xs rounded-xl" required placeholder="EJ: MATERIALES EL PINAR" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Nit / C.I.</Label>
                                    <Input value={newSupplierData.nit} onChange={(e) => setNewSupplierData(p => ({ ...p, nit: e.target.value }))} className="h-11 bg-card border-accent font-mono text-xs rounded-xl" required placeholder="00000000" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><Phone className="h-3 w-3" /> Teléfono</Label>
                                    <Input value={newSupplierData.phone} onChange={(e) => setNewSupplierData(p => ({ ...p, phone: e.target.value }))} className="h-11 bg-card border-accent font-mono text-xs rounded-xl" required placeholder="+591 ..." />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 border-t border-accent bg-card shrink-0">
                            <Button type="button" variant="ghost" onClick={() => setIsCreateSupplierOpen(false)} className="text-[12px] font-bold uppercase tracking-widest hover:bg-white/5">Cancelar</Button>
                            <Button type="submit" disabled={isCreatingSupplier} className="bg-primary text-background font-bold text-[12px] uppercase h-11 px-8 ml-4 rounded-xl">
                                {isCreatingSupplier ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Registrar y Vincular
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Generar OC MODIFICADO */}
            <Dialog open={isNewPOOpen} onOpenChange={setIsNewPOOpen}>
                <DialogContent className="sm:max-w-5xl bg-card border-accent text-primary p-0 overflow-hidden flex flex-col h-[85vh] shadow-2xl">
                    <DialogHeader className="p-6 border-b border-accent bg-accent/50 shrink-0 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg"><FileCheck className="h-6 w-6 text-primary" /></div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Generar Orden de Compra</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground mt-1">Formalice la adquisición de materiales seleccionados y audite variaciones</DialogDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsNewPOOpen(false)} className="h-8 w-8 hover:bg-white/10"><X className="h-5 w-5" /></Button>
                    </DialogHeader>
                    <div className="p-6 space-y-6 flex-1 overflow-hidden flex flex-col">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-accent/20 p-4 rounded-xl border border-accent">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase text-muted-foreground">Seleccionar Proveedor</Label></div>
                                <Select value={poSupplierId} onValueChange={setPOSupplierId}>
                                    <SelectTrigger className="h-11 bg-card border-accent uppercase font-bold text-xs rounded-xl"><SelectValue placeholder="Busque proveedor..." /></SelectTrigger>
                                    <SelectContent className="bg-card text-primary border-accent">
                                        {suppliers.map((s) => (<SelectItem key={s.id} value={s.id} className="text-[10px] font-bold uppercase">{s.company || s.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Modalidad de Pago</Label>
                                <Select value={poPaymentType} onValueChange={(v: any) => setPOPaymentType(v)}>
                                    <SelectTrigger className="h-11 bg-card border-accent uppercase font-bold text-xs rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-card text-primary border-accent">
                                        <SelectItem value="debito" className="text-[10px] font-bold uppercase">Pago al Contado (Egreso Directo)</SelectItem>
                                        <SelectItem value="credito" className="text-[10px] font-bold uppercase">A Crédito (Cuenta por Pagar)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex-1 border border-accent rounded-xl overflow-hidden bg-card/40">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-accent sticky top-0 z-10">
                                        <TableRow className="border-accent hover:bg-transparent">
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase">Insumo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center w-20">Und.</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right w-20">Cant.</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right w-24">P. Base</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right w-24">P. Prov.</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center w-28">Variación</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right w-32 pr-6">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {poCompatibleItems.map((req) => {
                                            const override = quotationOverrides[req.id];
                                            const basePrice = req.supply.price;
                                            const supplierPrice = override ? override.price : basePrice;
                                            const variation = supplierPrice - basePrice;
                                            const variationPercent = basePrice > 0 ? (variation / basePrice) * 100 : 0;

                                            return (
                                                <TableRow key={req.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                                    <TableCell className="py-4 px-6"><span className="text-xs font-bold text-white uppercase">{req.supply.description}</span></TableCell>
                                                    <TableCell className="text-center text-[10px] font-black text-muted-foreground uppercase">{req.supply.unit}</TableCell>
                                                    <TableCell className="text-right font-mono text-xs font-black">{req.quantity.toFixed(2)}</TableCell>

                                                    {/* Precios Base y Proveedor */}
                                                    <TableCell className="text-right font-mono text-xs text-muted-foreground">${basePrice.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right font-mono text-xs text-primary font-bold">${supplierPrice.toFixed(2)}</TableCell>

                                                    {/* Semáforo de Variación */}
                                                    <TableCell className="text-center">
                                                        {variation === 0 ? (
                                                            <Badge variant="outline" className="text-[9px] text-muted-foreground/50 border-white/10 w-full justify-center rounded-sm">0.0%</Badge>
                                                        ) : variation > 0 ? (
                                                            <Badge variant="outline" className="text-[9px] text-red-500 bg-red-500/10 border-none w-full justify-center gap-1 rounded-sm">
                                                                <TrendingUp className="h-3 w-3" /> +{variationPercent.toFixed(1)}%
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[9px] text-emerald-500 bg-emerald-500/10 border-none w-full justify-center gap-1 rounded-sm">
                                                                <TrendingDown className="h-3 w-3" /> {variationPercent.toFixed(1)}%
                                                            </Badge>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-right pr-6 font-mono text-sm font-black text-white">${(req.quantity * supplierPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t border-accent bg-accent/20 shrink-0 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total de la Orden</span>
                            <div className="flex items-end gap-4 mt-0.5">
                                <span className="text-2xl font-black text-primary font-mono leading-none">${poTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>

                                {/* Advertencia General de Sobrecosto / Ahorro */}
                                {poVariationTotal > 0 && (
                                    <span className="text-[10px] font-black text-red-500 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-md animate-pulse">
                                        <AlertTriangle className="h-3 w-3" /> +${poVariationTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} SOBRE EL PRESUPUESTO
                                    </span>
                                )}
                                {poVariationTotal < 0 && (
                                    <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md">
                                        <TrendingDown className="h-3 w-3" /> AHORRO DE ${Math.abs(poVariationTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setIsNewPOOpen(false)} className="text-[12px] font-bold uppercase tracking-widest hover:bg-white/5">Cancelar</Button>
                            <Button onClick={handleCreatePO} disabled={isSaving || poSupplierId === 'none' || poCompatibleItems.length === 0} className="bg-primary text-background font-bold text-[12px] uppercase h-12 px-12 rounded-xl shadow-xl">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck className="mr-2 h-4 w-4" />} GENERAR OC
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}