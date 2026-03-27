/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Contact } from '../../../../lib/types';
import { getProjectById } from '../../actions';
import {
    getSupplyRequests,
    getProjectTransactions,
    getPurchaseOrders,
    createWarehouseExit,
    getWarehouseStock
} from './actions';
import {
    ChevronLeft,
    Package,
    PlusCircle,
    ArrowUpCircle,
    X,
    Loader2,
    Activity,
    Info,
    AlertCircle,
    ClipboardList
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../../../../components/ui/select';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { useToast } from '../../../../hooks/use-toast';
import { useAuth } from '../../../../hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Checkbox } from '../../../../components/ui/checkbox';
import { getContacts } from '../../../library/contacts/actions';
import { cn } from '../../../../lib/utils';

export default function OperationsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [project, setProject] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supplyRequests, setSupplyRequests] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [warehouseStock, setWarehouseStock] = useState<Record<string, { totalIn: number; totalOut: number; currentStock: number }>>({});

    // Modals state
    const [isPedidosOpen, setIsPedidosOpen] = useState(false);
    const [isCotizacionesOpen, setIsCotizacionesOpen] = useState(false);
    const [isPOOpen, setIsPOOpen] = useState(false);
    const [isIngresosOpen, setIsIngresosOpen] = useState(false);
    const [isEgresosOpen, setIsEgresosOpen] = useState(false);
    const [isBalanceOpen, setIsBalanceOpen] = useState(false);
    const [isWarehouseEntryOpen, setIsWarehouseEntryOpen] = useState(false);
    const [isStockOpen, setIsStockOpen] = useState(false);
    const [isWarehouseExitOpen, setIsWarehouseExitOpen] = useState(false);
    const [isSelectStockForExitOpen, setIsSelectStockForExitOpen] = useState(false);

    // Search and Overrides
    const [pedidosSearchTerm, setPedidosSearchTerm] = useState('');
    const [cotizacionesSearchTerm, setCotizacionesSearchTerm] = useState('');
    const [stockSearchTerm, setStockSearchTerm] = useState('');
    const [requestedOverrides, setRequestedOverrides] = useState<Record<string, number>>({});
    const [quotationOverrides, setQuotationOverrides] = useState<Record<string, { price: number, supplierId: string }>>({});
    const [allContacts, setAllContacts] = useState<Contact[]>([]);

    const [currentPOItems, setCurrentPOItems] = useState<any[]>([]);
    const [selectedPOItemIds, setSelectedPOItemIds] = useState<string[]>([]);
    const [poQuantityOverrides, setPOQuantityOverrides] = useState<Record<string, number>>({});
    const [poPaymentType, setPOPaymentType] = useState<'debito' | 'credito'>('debito');
    const [poDueDate, setPODueDate] = useState(new Date().toISOString().split('T')[0]);

    const [selectedPOForEntry, setSelectedPOForEntry] = useState<any | null>(null);
    const [currentWarehouseItems, setCurrentWarehouseItems] = useState<any[]>([]);
    const [warehouseEntryOverrides, setWarehouseEntryOverrides] = useState<Record<string, number>>({});
    const [isInspectionOpen, setIsInspectionOpen] = useState(false);

    const [selectedStockExitIds, setSelectedStockExitIds] = useState<string[]>([]);
    const [currentExitItems, setCurrentExitItems] = useState<any[]>([]);
    const [exitAssignments, setExitAssignments] = useState<Record<string, { itemId: string, levelId: string, quantity: number }>>({});

    const fetchProject = useCallback(async () => {
        const id = params?.id;
        const cleanId = Array.isArray(id) ? id[0] : id;

        if (!cleanId || cleanId === 'undefined') return;

        setIsLoading(true);
        try {
            const [found, requests, txs, pos, stock] = await Promise.all([
                getProjectById(cleanId as string),
                getSupplyRequests(cleanId as string),
                getProjectTransactions(cleanId as string),
                getPurchaseOrders(cleanId as string),
                getWarehouseStock(cleanId as string)
            ]);

            if (found) {
                setProject(found as any);
            }
            setSupplyRequests(requests || []);
            setTransactions(txs || []);
            setPurchaseOrders(pos || []);
            setWarehouseStock(stock || {});
        } catch (error) {
            console.error("Error loading project data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [params?.id]);

    const fetchAllContacts = useCallback(async () => {
        try {
            const contacts = await getContacts();
            setAllContacts(contacts as any);
        } catch (error) {
            console.error("Error fetching contacts:", error);
        }
    }, []);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    useEffect(() => {
        if ((isCotizacionesOpen || isPOOpen) && allContacts.length === 0) {
            fetchAllContacts();
        }
    }, [isCotizacionesOpen, isPOOpen, allContacts.length, fetchAllContacts]);

    const projectSupplies = useMemo(() => {
        if (!project || !project.items) return [];
        const supplyMap: Record<string, any> = {};

        project.items.forEach((pi: any) => {
            const itemQty = pi.quantity || 0;
            const supplies = pi.item?.supplies || [];
            supplies.forEach((itemSupply: any) => {
                const s = itemSupply.supply;
                if (s.typology !== 'Material') return;
                const requiredQty = itemQty * (itemSupply.quantity || 0);
                if (supplyMap[s.id]) {
                    supplyMap[s.id].totalRequired += requiredQty;
                } else {
                    supplyMap[s.id] = { id: s.id, description: s.description, unit: s.unit, price: s.price, supplierId: s.supplierId, totalRequired: requiredQty, costs: s.costs || [] };
                }
            });
        });

        return Object.values(supplyMap).map((s: any) => {
            const pendingRequests = supplyRequests.filter(r => r.supplyId === s.id && r.status === 'pendiente').reduce((acc, r) => acc + (r.quantity || 0), 0);
            const everRequested = supplyRequests.filter(r => r.supplyId === s.id).reduce((acc, r) => acc + (r.quantity || 0), 0);
            const currentOverride = requestedOverrides[s.id] || 0;
            const totalRequestedEver = everRequested + currentOverride;
            const quotation = quotationOverrides[s.id] || { price: s.price, supplierId: s.supplierId || 'none' };

            return {
                ...s,
                totalRequested: pendingRequests,
                totalRequestedEver: totalRequestedEver,
                balance: s.totalRequired - totalRequestedEver,
                quotedPrice: quotation.price,
                quotedSupplierId: quotation.supplierId,
                mockStock: warehouseStock[s.id]?.currentStock || 0
            };
        }).sort((a, b) => a.description.localeCompare(b.description));
    }, [project, requestedOverrides, quotationOverrides, supplyRequests, warehouseStock]);

    const handleExitAssignmentChange = (id: string, field: 'itemId' | 'levelId' | 'quantity', value: string) => {
        setExitAssignments(prev => ({ ...prev, [id]: { ...(prev[id] || { itemId: 'none', levelId: 'none', quantity: 0 }), [field]: field === 'quantity' ? parseFloat(value) || 0 : value } }));
    };

    const getSupplyComputeForLevel = (supplyId: string, levelId: string): number => {
        if (!project?.items || levelId === 'none') return 0;
        let total = 0;
        for (const pi of project.items) {
            const levelQty = pi.levelQuantities?.find((lq: any) => lq.levelId === levelId)?.quantity ?? 0;
            if (levelQty === 0) continue;
            const itemSupply = pi.item?.supplies?.find((s: any) => s.supplyId === supplyId);
            if (!itemSupply) continue;
            total += levelQty * (itemSupply.quantity || 0);
        }
        return total;
    };

    const handleConfirmWarehouseExit = async () => {
        if (!project || currentExitItems.length === 0) return;

        // Validaciones de negocio
        for (const item of currentExitItems) {
            const assignment = exitAssignments[item.id];
            if (!assignment || assignment.quantity <= 0) continue;

            // Validar contra cómputo de nivel
            if (assignment.levelId !== 'none') {
                const computeLimit = getSupplyComputeForLevel(item.id, assignment.levelId);
                if (assignment.quantity > (computeLimit + 0.001)) {
                    toast({
                        title: "Exceso de Despacho",
                        description: `La cantidad de "${item.description}" supera el cómputo del nivel (${computeLimit.toFixed(2)} ${item.unit}).`,
                        variant: "destructive"
                    });
                    return;
                }
            }

            // Validar contra stock físico
            if (assignment.quantity > item.mockStock) {
                toast({
                    title: "Stock Insuficiente",
                    description: `No hay suficiente stock de "${item.description}" (${item.mockStock.toFixed(2)} disponible).`,
                    variant: "destructive"
                });
                return;
            }
        }

        const itemsToSave = currentExitItems.map(item => {
            const assignment = exitAssignments[item.id];
            return {
                supplyId: item.id,
                quantity: assignment?.quantity || 0,
                itemId: assignment?.itemId === 'none' ? undefined : assignment?.itemId,
                levelId: assignment?.levelId === 'none' ? undefined : assignment?.levelId,
            };
        }).filter(i => i.quantity > 0);

        try {
            const result = await createWarehouseExit({ projectId: project.id, items: itemsToSave });
            if (result.success) {
                toast({ title: "Salida Procesada" });
                setIsWarehouseExitOpen(false);
                fetchProject();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleStockExitItem = (id: string) => {
        setSelectedStockExitIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const confirmSelectedStockForExit = () => {
        const itemsToExit = projectSupplies.filter(s => selectedStockExitIds.includes(s.id)).map(s => ({ ...s, currentStock: s.mockStock }));
        setCurrentExitItems(itemsToExit);
        setIsSelectStockForExitOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen  items-center justify-center gap-4 h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Operaciones...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col min-h-screen  items-center justify-center p-8 gap-4 h-[50vh]">
                <Info className="h-12 w-12 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground italic uppercase tracking-widest text-[10px]">No se encontró el proyecto.</p>
                <Button variant="outline" onClick={() => router.push('/projects')}>Volver a Proyectos</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen  text-primary p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 font-headline">
                        <Activity className="h-7 w-7 text-primary" /> Operaciones: {project?.title}
                    </h1>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Gestión administrativa y logística de obra</p>
                </div>
                <div className="ml-auto">
                    <Button
                        onClick={() => setIsInspectionOpen(true)}
                        className="bg-primary hover:bg-primary/80 text-background border border-primary font-black text-[10px] uppercase tracking-widest h-10 px-5"
                    >
                        <ClipboardList className="mr-2 h-4 w-4" /> Nueva Inspección
                    </Button>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20 bg-white/1">
                <Activity className="h-16 w-16 mb-4 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Terminal de operaciones listo. Use los menús superiores para gestionar la obra.</p>
            </div>

            {/* Salida de Almacén Dialog
            <Dialog open={isWarehouseExitOpen} onOpenChange={setIsWarehouseExitOpen}>
                <DialogContent className="max-w-[95vw] bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden h-[95vh] flex flex-col shadow-2xl">
                    <DialogHeader className="p-6 border-b border-white/5 bg-white/2 flex flex-row items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/20">
                                <ArrowUpCircle className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Salida de Materiales de Almacén</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mt-1">Despacho de insumos y asignación a frentes de obra</DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={() => setIsSelectStockForExitOpen(true)} className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest px-6 h-10 shadow-lg">
                                <PlusCircle className="mr-2 h-4 w-4" /> Seleccionar del Stock
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setIsWarehouseExitOpen(false)} className="text-muted-foreground hover:text-white">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <Table>
                                <TableHeader className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase py-4 px-6">Insumo</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-center">Und.</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right">Stock</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase w-64">Asignar a Partida (Item)</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase w-48">Nivel de Obra</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right w-32 pr-4 text-amber-400/80">Cómputo Requerido</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-center w-40">Cant. Salida</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentExitItems.length > 0 ? (
                                        currentExitItems.map((item) => {
                                            const assignment = exitAssignments[item.id] || { itemId: 'none', levelId: 'none', quantity: 0 };
                                            const availableItems = (project?.items || []).filter((pi: any) => pi.item?.supplies?.some((is: any) => is.supplyId === item.id));
                                            const selectedPI = availableItems.find((pi: any) => pi.item.id === assignment.itemId);
                                            const availableLevels = project?.levels?.filter((lvl: any) => {
                                                if (!selectedPI) return false;
                                                const lq = selectedPI.levelQuantities?.find((q: any) => q.levelId === lvl.id);
                                                return lq && lq.quantity > 0;
                                            }) || [];

                                            const computeLimit = getSupplyComputeForLevel(item.id, assignment.levelId);
                                            const isExceeded = assignment.levelId !== 'none' && assignment.quantity > (computeLimit + 0.001);
                                            const isStockExceeded = assignment.quantity > item.mockStock;

                                            return (
                                                <TableRow key={item.id} className={cn("border-white/5 hover:bg-white/3 transition-colors", (isExceeded || isStockExceeded) && "bg-red-500/5")}>
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Package className={cn("h-3.5 w-3.5", isExceeded || isStockExceeded ? "text-red-500" : "text-primary")} />
                                                            <span className="text-xs font-bold text-white uppercase">{item.description}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-[10px] font-bold text-muted-foreground uppercase text-center">{item.unit}</TableCell>
                                                    <TableCell className="text-xs font-mono text-right text-emerald-500 font-bold">{item.mockStock.toFixed(2)}</TableCell>
                                                    <TableCell className="px-4">
                                                        <Select value={assignment.itemId} onValueChange={(val) => handleExitAssignmentChange(item.id, 'itemId', val)}>
                                                            <SelectTrigger className="h-9 bg-black border-white/10 text-[10px] font-bold uppercase w-full">
                                                                <SelectValue placeholder="Partida..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#0a0a0a] text-white border-white/10">
                                                                <SelectItem value="none" className="text-[10px] font-bold uppercase">Sin asignar</SelectItem>
                                                                {availableItems.map((pi: any) => (
                                                                    <SelectItem key={pi.item.id} value={pi.item.id} className="text-[10px] font-bold uppercase">{pi.item.description}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="px-4">
                                                        <Select value={assignment.levelId} onValueChange={(val) => handleExitAssignmentChange(item.id, 'levelId', val)} disabled={assignment.itemId === 'none'}>
                                                            <SelectTrigger className="h-9 bg-black border-white/10 text-[10px] font-bold uppercase w-full">
                                                                <SelectValue placeholder={assignment.itemId === 'none' ? "Primero asigne partida" : "Nivel..."} />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#0a0a0a] text-white border-white/10">
                                                                <SelectItem value="none" className="text-[10px] font-bold uppercase">Sin asignar</SelectItem>
                                                                {availableLevels.map((lvl: any) => (
                                                                    <SelectItem key={lvl.id} value={lvl.id} className="text-[10px] font-bold uppercase">{lvl.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="text-right px-4">
                                                        {assignment.levelId !== 'none' ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-mono text-xs font-black text-amber-400">{computeLimit.toFixed(2)}</span>
                                                                <span className="text-[9px] font-bold text-muted-foreground">{item.unit}</span>
                                                            </div>
                                                        ) : <span className="text-muted-foreground/30 text-[10px]">—</span>}
                                                    </TableCell>
                                                    <TableCell className="px-4">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={assignment.quantity === 0 ? '' : assignment.quantity}
                                                                onChange={(e) => handleExitAssignmentChange(item.id, 'quantity', e.target.value)}
                                                                className={cn("h-9 w-24 bg-black border-white/10 text-center font-mono text-xs",
                                                                    isExceeded || isStockExceeded ? "text-red-500 border-red-500 focus-visible:ring-red-500 bg-red-500/10" : "text-white"
                                                                )}
                                                                placeholder="0.00"
                                                            />
                                                            {isExceeded && <span className="text-[7px] font-black text-red-500 uppercase animate-pulse flex items-center gap-1"><AlertCircle className="h-2 w-2" /> Exceso Nivel</span>}
                                                            {isStockExceeded && <span className="text-[7px] font-black text-red-500 uppercase animate-pulse flex items-center gap-1"><AlertCircle className="h-2 w-2" /> Sin Stock</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="pr-4">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setCurrentExitItems(prev => prev.filter(i => i.id !== item.id))}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow><TableCell colSpan={8} className="text-center py-32 text-muted-foreground opacity-20 uppercase text-[10px] font-black">No hay insumos seleccionados para la salida.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>

                    <DialogFooter className="p-6 border-t border-white/5 bg-black/20 shrink-0">
                        <Button variant="ghost" onClick={() => setIsWarehouseExitOpen(false)} className="text-[10px] font-black uppercase tracking-widest">Cancelar</Button>
                        <Button onClick={handleConfirmWarehouseExit} disabled={currentExitItems.length === 0} className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest px-12 h-11 shadow-xl shadow-primary/10">
                            <ArrowUpCircle className="mr-2 h-4 w-4" /> Confirmar Despacho de Materiales
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             Sub-Dialog: Seleccionar del Stock 
            <Dialog open={isSelectStockForExitOpen} onOpenChange={setIsSelectStockForExitOpen}>
                <DialogContent className="max-w-3xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden h-[80vh] flex flex-col shadow-2xl">
                    <DialogHeader className="p-6 border-b border-white/5 bg-white/2">
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-emerald-500" />
                            <DialogTitle className="text-lg font-bold uppercase tracking-tight">Inventario Disponible</DialogTitle>
                        </div>
                    </DialogHeader>
                    <div className="p-6 flex-1 overflow-hidden">
                        <ScrollArea className="h-full border border-white/10 rounded-xl bg-black/40">
                            <Table>
                                <TableHeader className="bg-white/5"><TableRow><TableHead className="w-12 text-center" /><TableHead className="text-[10px] font-black uppercase py-4">Insumo</TableHead><TableHead className="text-[10px] font-black uppercase text-center">Und.</TableHead><TableHead className="text-[10px] font-black uppercase text-right pr-6">Stock Actual</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {projectSupplies.filter(s => s.mockStock > 0).map((s) => (
                                        <TableRow key={s.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                            <TableCell className="text-center"><Checkbox checked={selectedStockExitIds.includes(s.id)} onCheckedChange={() => handleToggleStockExitItem(s.id)} /></TableCell>
                                            <TableCell className="text-xs font-bold text-white uppercase">{s.description}</TableCell>
                                            <TableCell className="text-[10px] font-bold text-muted-foreground uppercase text-center">{s.unit}</TableCell>
                                            <TableCell className="text-xs font-mono text-right text-emerald-500 font-bold pr-6">{s.mockStock.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                    <DialogFooter className="p-6 border-t border-white/5 bg-black/20">
                        <Button onClick={confirmSelectedStockForExit} className="bg-primary text-black font-black text-[10px] uppercase px-8 h-10">Vincular para Salida</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog> */}
        </div>
    );
}
