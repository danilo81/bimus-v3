
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getProjectById, addContactToProject } from '../../actions';
import {
    getSupplyRequests,
    getPurchaseOrders,
    createSupplyRequest,
    createPurchaseOrder,
    deletePurchaseOrder
} from '../operations/actions';
import { importContactToLibrary, getContacts, createContact } from '../../../library/contacts/actions';
import {
    ShoppingCart,
    ChevronLeft,
    Plus,
    Search,
    FileCheck,
    ClipboardList,
    Clock,
    DollarSign,
    Package,
    Loader2,
    Building2,
    CheckCircle2,
    X,
    Filter,
    ArrowRight,
    MoreVertical,
    History,
    FileSearch,
    PlusCircle,
    Check,
    Star,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    Save,
    Download,
    Printer,
    Edit,
    Trash2,
    UserPlus,
    Phone,
    UserCircle
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
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
import { Separator } from '../../../../components/ui/separator';

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
    const [isPOHistoryOpen, setIsPOHistoryOpen] = useState(false);

    // Form states
    const [requestQuantities, setRequestQuantities] = useState<Record<string, string>>({});
    const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
    const [poSupplierId, setPOSupplierId] = useState<string>('none');
    const [poPaymentType, setPOPaymentType] = useState<'debito' | 'credito'>('debito');
    const [poDueDate, setPODueDate] = useState(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

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
            setPurchaseOrders(pos);
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

    const poTotalAmount = useMemo(() => {
        return poCompatibleItems.reduce((acc, r) => {
            const override = quotationOverrides[r.id];
            const price = override ? override.price : r.supply.price;
            return acc + (r.quantity * price);
        }, 0);
    }, [poCompatibleItems, quotationOverrides]);

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

            const result = await createPurchaseOrder({
                projectId: project.id,
                supplierId: poSupplierId,
                paymentType: poPaymentType,
                dueDate: poPaymentType === 'credito' ? poDueDate : undefined,
                items
            });

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
                // VINCULAR AL PROYECTO
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
        <div className="flex flex-col min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={() => router.back()}><ChevronLeft className="h-6 w-6" /></Button>
                <div><h1 className="text-2xl font-bold flex items-center gap-3 font-headline uppercase tracking-tight"><ShoppingCart className="h-7 w-7 text-primary" /> Compras: {project.title}</h1><p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Gestión técnica de suministros y adquisiciones</p></div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-white/5 border border-white/10 h-12 p-1 rounded-xl w-fit">
                    <TabsTrigger value="pedidos" className="text-[10px] font-black uppercase tracking-widest px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-black"><ClipboardList className="h-3.5 w-3.5 mr-2" /> Pedidos de Obra</TabsTrigger>
                    <TabsTrigger value="ordenes" className="text-[10px] font-black uppercase tracking-widest px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-black"><FileCheck className="h-3.5 w-3.5 mr-2" /> Órdenes de Compra</TabsTrigger>
                </TabsList>

                <TabsContent value="pedidos" className="space-y-6">
                    <div className="flex items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="BUSCAR PEDIDO..." className="pl-10 h-11 bg-black/40 border-white/10 text-[10px] font-black uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="border-white/10 bg-white/5 text-muted-foreground font-black text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl hover:bg-white/10" onClick={() => setIsRequestsHistoryOpen(true)}><History className="mr-2 h-4 w-4" /> Historial</Button>
                            <Button variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 font-black text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl" onClick={() => setIsCotizacionesOpen(true)}><FileSearch className="mr-2 h-4 w-4" /> Directorio de Obra</Button>
                            <Button className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl shadow-lg" onClick={() => setIsNewRequestOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nuevo Pedido</Button>
                            <Button variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-black text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl" onClick={() => setIsNewPOOpen(true)} disabled={selectedRequestIds.length === 0}><FileCheck className="mr-2 h-4 w-4" /> Generar OC ({selectedRequestIds.length})</Button>
                        </div>
                    </div>

                    <Card className="bg-[#0a0a0a] border-white/10 overflow-hidden shadow-2xl">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-white/5">
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="w-12 text-center" />
                                        <TableHead className="py-5 px-6 text-[10px] font-black uppercase">Material / Insumo</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-center">Und.</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right">Cantidad</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase w-64 px-6">Proveedor / Cotización</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-center">Estado</TableHead>
                                        <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.filter(r => r.status !== 'almacenado').filter(r => r.supply.description.toLowerCase().includes(searchTerm.toLowerCase())).map((req) => {
                                        const override = quotationOverrides[req.id];
                                        const dbPreferredCost = req.supply.costs?.find((c: any) => c.isPreferred) || req.supply.costs?.[0];

                                        // Final supplier object to display
                                        let supplier = null;
                                        if (override) {
                                            supplier = suppliers.find(s => s.id === override.supplierId);
                                        } else if (dbPreferredCost?.supplier) {
                                            supplier = dbPreferredCost.supplier;
                                        }

                                        const isExternal = supplier && supplier.userId !== user?.id;
                                        const alreadyInLibrary = supplier && userLibraryContacts.some(c => c.nit === supplier.nit);

                                        return (
                                            <TableRow key={req.id} className="border-white/5 hover:bg-white/2 transition-colors">
                                                <TableCell className="text-center">
                                                    <Checkbox disabled={req.status !== 'pendiente'} checked={selectedRequestIds.includes(req.id)} onCheckedChange={(checked) => setSelectedRequestIds(prev => checked ? [...prev, req.id] : prev.filter(id => id !== req.id))} />
                                                </TableCell>
                                                <TableCell className="py-5 px-6">
                                                    <span className="text-xs font-bold text-white uppercase">{req.supply.description}</span>
                                                </TableCell>
                                                <TableCell className="text-center text-[10px] font-black text-muted-foreground uppercase">{req.supply.unit}</TableCell>
                                                <TableCell className="text-right font-mono text-xs font-black text-white">{req.quantity.toFixed(2)}</TableCell>
                                                <TableCell className="px-6">
                                                    {supplier ? (
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] font-bold text-amber-400 uppercase leading-none">
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
                                                                            <TooltipContent className="text-[8px] uppercase font-black bg-black border-white/10">Importar a mi librería global</TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )}
                                                            </div>
                                                            <div className="text-[9px] font-mono font-black text-white mt-1">
                                                                ${(override ? override.price : (dbPreferredCost?.price || req.supply.price)).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-[9px] text-muted-foreground/30 uppercase italic">— Sin Cotización —</span>}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className={cn("text-[8px] font-black uppercase border-none", req.status === 'pendiente' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500')}>
                                                        {req.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <Button variant="ghost" size="icon" disabled={req.status !== 'pendiente'} onClick={() => handleOpenQuotation(req)}>
                                                        <FileSearch className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ordenes" className="space-y-6">
                    {purchaseOrders.map((po) => (
                        <Card key={po.id} className="bg-[#0a0a0a] border-white/5 hover:border-primary/30 transition-all group">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-primary/10 transition-colors">
                                            <FileCheck className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-black text-white uppercase">{po.number}</h3>
                                            <p className="text-sm font-black text-primary uppercase flex items-center gap-2">
                                                <Building2 className="h-4 w-4" /> {po.supplier?.company || po.supplier?.name || 'PROVEEDOR VARIOS'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 text-right">
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Total</p>
                                            <p className="text-lg font-black text-white font-mono">${po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => handlePrintPO(po)} variant="ghost" size="icon"><Printer className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeletePO(po.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>

            {/* Modal de Cotizaciones / Directorio de Proveedores del Proyecto */}
            <Dialog open={isCotizacionesOpen} onOpenChange={setIsCotizacionesOpen}>
                <DialogContent className="max-w-3xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl flex flex-col h-[80vh]">
                    <DialogHeader className="p-6 border-b border-white/5 bg-white/2 shrink-0 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/20">
                                <FileSearch className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Directorio de Proveedores</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[10px] font-black uppercase mt-1 tracking-widest">Empresas vinculadas a este proyecto específico</DialogDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsCotizacionesOpen(false)}><X className="h-5 w-5" /></Button>
                    </DialogHeader>

                    <div className="p-6 flex-1 overflow-hidden flex flex-col space-y-4">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Proveedores Activos: {suppliers.length}</p>
                            <Button size="sm" className="bg-primary text-black font-black text-[9px] uppercase h-8 px-4" onClick={() => setIsCreateSupplierOpen(true)}>
                                <Plus className="mr-1.5 h-3 w-3" /> Adicionar Nuevo
                            </Button>
                        </div>

                        <div className="flex-1 border border-white/10 rounded-xl overflow-hidden bg-black/40">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-white/5 sticky top-0 z-10">
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Razón Social / Empresa</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Contacto</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Nit / C.I.</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-6">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {suppliers.length > 0 ? (
                                            suppliers.map((s) => {
                                                const alreadyInLibrary = userLibraryContacts.some(c => c.nit === s.nit);
                                                return (
                                                    <TableRow key={s.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                                        <TableCell className="py-4 px-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-white uppercase">{s.company || 'VARIOS'}</span>
                                                                <span className="text-[9px] text-muted-foreground uppercase font-black opacity-40">Proveedor Obra</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs font-bold text-primary uppercase">{s.name}</TableCell>
                                                        <TableCell className="font-mono text-[10px] text-muted-foreground">{s.nit || '—'}</TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            {!alreadyInLibrary && s.userId !== user?.id && (
                                                                <Button variant="outline" size="sm" className="h-7 border-primary/20 text-primary text-[8px] font-black uppercase px-3" onClick={() => handleImportToLibrary(s.id)}>
                                                                    <UserPlus className="h-3 w-3 mr-1.5" /> Importar
                                                                </Button>
                                                            )}
                                                            {alreadyInLibrary && <Badge variant="outline" className="text-[7px] font-black uppercase h-4 opacity-30">En mi librería</Badge>}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-20 text-muted-foreground opacity-20 uppercase text-[10px] font-black">Sin proveedores vinculados.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>
                    <DialogFooter className="p-4 border-t border-white/5 bg-black shrink-0">
                        <Button variant="ghost" onClick={() => setIsCotizacionesOpen(false)} className="w-full text-[9px] font-black uppercase tracking-widest">Cerrar Directorio</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Nuevo Pedido */}
            <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
                <DialogContent className="sm:max-w-[850px] bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden flex flex-col h-[85vh] shadow-2xl">
                    <DialogHeader className="p-6 border-b border-white/5 shrink-0 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <Plus className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase">Nueva Solicitud de Material</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground mt-1 tracking-widest">Seleccione los insumos presupuestados para la obra</DialogDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsNewRequestOpen(false)}><X className="h-5 w-5" /></Button>
                    </DialogHeader>
                    <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="relative shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="BUSCAR INSUMO..." className="pl-10 h-11 bg-white/5 border-white/10 text-[10px] font-bold uppercase" value={requestSearchTerm} onChange={(e) => setRequestSearchTerm(e.target.value)} />
                        </div>
                        <div className="border border-white/10 rounded-xl overflow-hidden flex-1 bg-black/40">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-white/5 sticky top-0 z-10">
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase">Insumo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center w-32">Saldo Pto.</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center w-48 pr-6">Cantidad a Pedir</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {projectSupplies.filter((s: any) => s.description.toLowerCase().includes(requestSearchTerm.toLowerCase())).map((s: any) => (
                                            <TableRow key={s.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                                <TableCell className="py-4 px-6">
                                                    <span className="text-xs font-bold text-white uppercase">{s.description}</span>
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-xs font-black text-amber-500">{s.balance.toFixed(2)}</TableCell>
                                                <TableCell className="pr-6">
                                                    <div className="flex items-center gap-3 justify-end">
                                                        <Input type="number" step="0.01" value={requestQuantities[s.id] || ''} onChange={(e) => setRequestQuantities(prev => ({ ...prev, [s.id]: e.target.value }))} className="h-10 w-32 bg-black border-white/10 text-center font-mono text-sm" placeholder="0.00" />
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase">{s.unit}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t border-white/5 bg-black shrink-0">
                        <Button variant="ghost" onClick={() => setIsNewRequestOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateRequestBatch} disabled={isSaving} className="bg-primary text-black font-black text-[10px] uppercase h-12 px-12 shadow-xl">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} CONFIRMAR PEDIDO
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Cotización */}
            <Dialog open={isQuotationModalOpen} onOpenChange={setIsQuotationModalOpen}>
                <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden flex flex-col shadow-2xl">
                    <DialogHeader className="p-6 border-b border-white/5 bg-white/2 shrink-0 flex flex-row items-center space-y-0 gap-3">
                        <FileSearch className="h-6 w-6 text-amber-500" />
                        <div>
                            <DialogTitle className="text-xl font-bold uppercase">Gestionar Cotización</DialogTitle>
                            <DialogDescription className="text-[10px] font-black uppercase mt-1">Vincule un proveedor y precio específico para este pedido</DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Seleccionar Proveedor</Label>
                                    <Button variant="link" size="sm" className="h-auto p-0 text-primary text-[9px] font-black uppercase" onClick={() => setIsCreateSupplierOpen(true)}>
                                        <Plus className="h-3 w-3 mr-1" /> Nuevo Proveedor
                                    </Button>
                                </div>
                                <Select value={quotationData.supplierId} onValueChange={(v) => setQuotationData(prev => ({ ...prev, supplierId: v }))}>
                                    <SelectTrigger className="h-11 bg-black border-white/10 uppercase font-bold text-xs">
                                        <SelectValue placeholder="Busque proveedor..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0a0a0a] text-white border-white/10">
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={s.id} className="text-[10px] font-bold uppercase">{s.company || s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Precio Unit. (USD)</Label>
                                    <Input type="number" step="0.01" value={quotationData.price} onChange={(e) => setQuotationData(prev => ({ ...prev, price: e.target.value }))} className="h-11 bg-black border-white/10 font-mono text-base font-black text-amber-400" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Fecha Oferta</Label>
                                    <Input type="date" value={quotationData.date} onChange={(e) => setQuotationData(prev => ({ ...prev, date: e.target.value }))} className="h-11 bg-black border-white/10 font-mono text-[11px]" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t border-white/5 bg-black/20 shrink-0">
                        <Button variant="ghost" onClick={() => setIsQuotationModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveQuotation} disabled={!quotationData.price || quotationData.supplierId === 'none'} className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase h-11 px-10 shadow-xl">
                            <Check className="mr-2 h-4 w-4" /> Vincular Oferta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Nuevo Proveedor Directo */}
            <Dialog open={isCreateSupplierOpen} onOpenChange={setIsCreateSupplierOpen}>
                <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl flex flex-col h-auto">
                    <form onSubmit={handleCreateSupplier} className="flex flex-col h-full">
                        <DialogHeader className="p-6 border-b border-white/5 bg-white/2 shrink-0 flex flex-row items-center space-y-0 gap-3">
                            <Building2 className="h-6 w-6 text-primary" />
                            <div>
                                <DialogTitle className="text-lg font-bold uppercase">Nuevo Proveedor Directo</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Alta de contacto en directorio de obra</DialogDescription>
                            </div>
                        </DialogHeader>

                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><UserCircle className="h-3 w-3" /> Nombre de Contacto</Label>
                                <Input value={newSupplierData.name} onChange={(e) => setNewSupplierData(p => ({ ...p, name: e.target.value }))} className="h-11 bg-black border-white/10 uppercase font-bold text-xs" required placeholder="EJ: CARLOS RUIZ" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><Building2 className="h-3 w-3" /> Razón Social (Empresa)</Label>
                                <Input value={newSupplierData.company} onChange={(e) => setNewSupplierData(p => ({ ...p, company: e.target.value }))} className="h-11 bg-black border-white/10 uppercase font-bold text-xs" required placeholder="EJ: MATERIALES EL PINAR" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Nit / C.I.</Label>
                                    <Input value={newSupplierData.nit} onChange={(e) => setNewSupplierData(p => ({ ...p, nit: e.target.value }))} className="h-11 bg-black border-white/10 font-mono text-xs" required placeholder="00000000" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><Phone className="h-3 w-3" /> Teléfono</Label>
                                    <Input value={newSupplierData.phone} onChange={(e) => setNewSupplierData(p => ({ ...p, phone: e.target.value }))} className="h-11 bg-black border-white/10 font-mono text-xs" required placeholder="+591 ..." />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 border-t border-white/5 bg-black/20 shrink-0">
                            <Button type="button" variant="ghost" onClick={() => setIsCreateSupplierOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isCreatingSupplier} className="bg-primary text-black font-black text-[10px] uppercase h-11 px-8 shadow-xl">
                                {isCreatingSupplier ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Registrar y Vincular
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Generar OC */}
            <Dialog open={isNewPOOpen} onOpenChange={setIsNewPOOpen}>
                <DialogContent className="sm:max-w-4xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden flex flex-col h-[85vh] shadow-2xl">
                    <DialogHeader className="p-6 border-b border-white/5 bg-white/2 shrink-0 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg"><FileCheck className="h-6 w-6 text-primary" /></div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Generar Orden de Compra</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground mt-1">Formalice la adquisición de materiales seleccionados</DialogDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsNewPOOpen(false)}><X className="h-5 w-5" /></Button>
                    </DialogHeader>
                    <div className="p-6 space-y-6 flex-1 overflow-hidden flex flex-col">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase text-muted-foreground">Seleccionar Proveedor</Label></div>
                                <Select value={poSupplierId} onValueChange={setPOSupplierId}>
                                    <SelectTrigger className="h-11 bg-black border-white/10 uppercase font-bold text-xs"><SelectValue placeholder="Busque proveedor..." /></SelectTrigger>
                                    <SelectContent className="bg-[#0a0a0a] text-white border-white/10">
                                        {suppliers.map((s) => (<SelectItem key={s.id} value={s.id} className="text-[10px] font-bold uppercase">{s.company || s.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Modalidad de Pago</Label>
                                <Select value={poPaymentType} onValueChange={(v: any) => setPOPaymentType(v)}>
                                    <SelectTrigger className="h-11 bg-black border-white/10 uppercase font-bold text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#0a0a0a] text-white border-white/10">
                                        <SelectItem value="debito" className="text-[10px] font-bold uppercase">Pago al Contado (Egreso Directo)</SelectItem>
                                        <SelectItem value="credito" className="text-[10px] font-bold uppercase">A Crédito (Cuenta por Pagar)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex-1 border border-white/10 rounded-xl overflow-hidden bg-black/40">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-white/5 sticky top-0 z-10">
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase">Insumo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center w-24">Und.</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right w-32">Cant.</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right w-32">P. Unit.</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right w-40 pr-6">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {poCompatibleItems.map((req) => {
                                            const override = quotationOverrides[req.id];
                                            const price = override ? override.price : req.supply.price;
                                            return (
                                                <TableRow key={req.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                                    <TableCell className="py-4 px-6"><span className="text-xs font-bold text-white uppercase">{req.supply.description}</span></TableCell>
                                                    <TableCell className="text-center text-[10px] font-black text-muted-foreground uppercase">{req.supply.unit}</TableCell>
                                                    <TableCell className="text-right font-mono text-xs font-black">{req.quantity.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right font-mono text-xs text-primary">${price.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right pr-6 font-mono text-sm font-black text-white">${(req.quantity * price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t border-white/5 bg-black shrink-0 flex items-center justify-between">
                        <div className="flex flex-col"><span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total de la Orden</span><span className="text-2xl font-black text-primary font-mono">${poTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setIsNewPOOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCreatePO} disabled={isSaving || poSupplierId === 'none' || poCompatibleItems.length === 0} className="bg-primary text-black font-black text-[10px] uppercase h-12 px-12 shadow-xl">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck className="mr-2 h-4 w-4" />} GENERAR ORDEN DE COMPRA
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
