/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getProjectById } from '../../actions';
import {
    getWarehouseStock,
    getProjectWarehouseMovements,
    getPurchaseOrders,
    createWarehouseEntry,
    createWarehouseExit
} from '../operations/actions';
import {
    Package,
    ArrowUpCircle,
    ArrowDownCircle,
    History,
    Search,
    Boxes,
    Loader2,
    X,
    CheckCircle2,
    Activity,
    Printer,
    ChevronDown,
    AlertCircle
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
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
import { Checkbox } from '../../../../components/ui/checkbox';
import { Label } from '../../../../components/ui/label';
import { useToast } from '../../../../hooks/use-toast';
import { cn } from '../../../../lib/utils';

export default function ProjectWarehousePage() {
    const params = useParams();
    const { toast } = useToast();
    const [project, setProject] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [stock, setStock] = useState<Record<string, any>>({});
    const [movements, setMovements] = useState<any[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('stock');

    // Modal States
    const [isWarehouseEntryOpen, setIsWarehouseEntryOpen] = useState(false);
    const [isWarehouseExitOpen, setIsWarehouseExitOpen] = useState(false);
    const [isSelectStockForExitOpen, setIsSelectStockForExitOpen] = useState(false);

    // Entry State
    const [selectedPOForEntry, setSelectedPOForEntry] = useState<string>('none');
    const [currentWarehouseItems, setCurrentWarehouseItems] = useState<any[]>([]);
    const [warehouseEntryOverrides, setWarehouseEntryOverrides] = useState<Record<string, number>>({});

    // Exit State
    const [selectedStockExitIds, setSelectedStockExitIds] = useState<string[]>([]);
    const [currentExitItems, setCurrentExitItems] = useState<any[]>([]);
    const [exitAssignments, setExitAssignments] = useState<Record<string, { itemId: string, levelId: string, quantity: number }>>({});

    const fetchProjectData = useCallback(async () => {
        const id = params?.id;
        const cleanId = Array.isArray(id) ? id[0] : id;
        if (!cleanId || cleanId === 'undefined') return;

        setIsLoading(true);
        try {
            const [proj, stockData, movs, pos] = await Promise.all([
                getProjectById(cleanId),
                getWarehouseStock(cleanId),
                getProjectWarehouseMovements(cleanId),
                getPurchaseOrders(cleanId)
            ]);
            setProject(proj);
            setStock(stockData);
            setMovements(movs);
            setPurchaseOrders(pos);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [params?.id]);

    useEffect(() => {
        fetchProjectData();
    }, [fetchProjectData]);

    const inventoryItems = useMemo(() => {
        if (!project || !project.items) return [];
        const items: any[] = [];

        const seenSupplies = new Set();
        project.items.forEach((pi: any) => {
            pi.item?.supplies?.forEach((is: any) => {
                const s = is.supply;
                if (s.typology === 'Material' && !seenSupplies.has(s.id)) {
                    seenSupplies.add(s.id);
                    const stockInfo = stock[s.id] || { currentStock: 0 };
                    items.push({
                        id: s.id,
                        description: s.description,
                        unit: s.unit,
                        price: s.price,
                        stock: stockInfo.currentStock,
                        status: stockInfo.currentStock <= 0 ? 'agotado' : stockInfo.currentStock < 10 ? 'bajo' : 'ok'
                    });
                }
            });
        });

        return items.filter(i =>
            i.description.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.description.localeCompare(b.description));
    }, [project, stock, searchTerm]);

    // --- Print Handlers ---
    const handlePrintStock = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const rows = inventoryItems.map((item) => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px;">${item.description}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px; text-align: center;">${item.unit}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px; text-align: right; font-weight: bold;">${item.stock.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 10px; text-align: center; text-transform: uppercase;">${item.status}</td>
            </tr>
        `).join('');

        const html = `
            <html>
                <head>
                    <title>Reporte de Stock Actual - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                        .brand h1 { font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #f8f8f8; border: 1px solid #ddd; padding: 12px 10px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="brand"><h1>BIMUS</h1><p>ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><p style="font-size: 10px; font-weight: 900; margin: 0;">REPORTE DE EXISTENCIAS EN ALMACÉN</p></div>
                    </div>
                    <h2>Proyecto: ${project.title}</h2>
                    <p style="font-size: 11px;">Fecha de emisión: ${new Date().toLocaleDateString()}</p>
                    <table>
                        <thead><tr><th>Descripción Material</th><th>Und.</th><th>Stock Actual</th><th>Estado</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="4" style="text-align: center; padding: 20px;">Sin existencias.</td></tr>'}</tbody>
                    </table>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handlePrintEntries = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const entries = movements.filter(m => m.type === 'entry');
        const rows = entries.map((m) => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 10px; font-family: monospace;">${new Date(m.date).toLocaleDateString()}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px; font-weight: bold;">${m.supplyName}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px; text-align: center;">${m.unit}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px; text-align: right; color: #10b981; font-weight: bold;">+${m.quantity.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 10px;">${m.notes || '—'}</td>
            </tr>
        `).join('');

        const html = `
            <html>
                <head>
                    <title>Reporte de Entradas de Almacén - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                        .brand h1 { font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #f8f8f8; border: 1px solid #ddd; padding: 12px 10px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="brand"><h1>BIMUS</h1><p>ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><p style="font-size: 10px; font-weight: 900; margin: 0;">HISTORIAL DE INGRESOS A ALMACÉN</p></div>
                    </div>
                    <h2>Proyecto: ${project.title}</h2>
                    <table>
                        <thead><tr><th>Fecha</th><th>Insumo</th><th>Und.</th><th>Cant. Ingreso</th><th>Observaciones</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay registros de ingreso.</td></tr>'}</tbody>
                    </table>
                    <script>window.onload = function() { window.print(); window.close(); }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handlePrintExits = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const exits = movements.filter(m => m.type === 'exit');
        const rows = exits.map((m) => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 10px; font-family: monospace;">${new Date(m.date).toLocaleDateString()}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px; font-weight: bold;">${m.supplyName}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px; text-align: center;">${m.unit}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 11px; text-align: right; color: #ef4444; font-weight: bold;">-${m.quantity.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-size: 10px; text-transform: uppercase;">${m.levelName} — ${m.itemName}</td>
            </tr>
        `).join('');

        const html = `
            <html>
                <head>
                    <title>Reporte de Despachos / Salidas - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                        .brand h1 { font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #f8f8f8; border: 1px solid #ddd; padding: 12px 10px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="brand"><h1>BIMUS</h1><p>ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><p style="font-size: 10px; font-weight: 900; margin: 0;">HISTORIAL DE SALIDAS / DESPACHOS DE OBRA</p></div>
                    </div>
                    <h2>Proyecto: ${project.title}</h2>
                    <table>
                        <thead><tr><th>Fecha</th><th>Insumo</th><th>Und.</th><th>Cant. Despacho</th><th>Destino (Nivel / Partida)</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay registros de despacho.</td></tr>'}</tbody>
                    </table>
                    <script>window.onload = function() { window.print(); window.close(); }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    // --- Entry Logic ---
    const handlePOChange = (poId: string) => {
        setSelectedPOForEntry(poId);
        if (poId === 'none') {
            setCurrentWarehouseItems([]);
            return;
        }
        const po = purchaseOrders.find(o => o.id === poId);
        if (po) {
            setCurrentWarehouseItems(po.items.map((i: any) => ({
                id: i.supply.id,
                description: i.supply.description,
                unit: i.supply.unit,
                orderedQuantity: i.quantity
            })));
        }
    };

    const handleEntryQtyChange = (id: string, qty: string) => {
        setWarehouseEntryOverrides(prev => ({ ...prev, [id]: parseFloat(qty) || 0 }));
    };

    const handleConfirmWarehouseEntry = async () => {
        if (!project || currentWarehouseItems.length === 0) return;
        setIsSaving(true);
        const itemsToSave = currentWarehouseItems.map(item => ({
            supplyId: item.id,
            quantity: warehouseEntryOverrides[item.id] ?? item.orderedQuantity
        })).filter(i => i.quantity > 0);

        try {
            const result = await createWarehouseEntry({
                projectId: project.id,
                purchaseOrderId: selectedPOForEntry === 'none' ? undefined : selectedPOForEntry,
                items: itemsToSave
            });
            if (result.success) {
                toast({ title: "Ingreso Registrado", description: "El inventario ha sido actualizado." });
                setIsWarehouseEntryOpen(false);
                setSelectedPOForEntry('none');
                setWarehouseEntryOverrides({});
                fetchProjectData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Exit Logic ---
    const handleToggleStockExitItem = (id: string) => {
        setSelectedStockExitIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const confirmSelectedStockForExit = () => {
        const itemsToExit = inventoryItems.filter(s => selectedStockExitIds.includes(s.id));
        setCurrentExitItems(itemsToExit);
        setIsSelectStockForExitOpen(false);
    };

    const handleExitAssignmentChange = (id: string, field: 'itemId' | 'levelId' | 'quantity', value: string) => {
        setExitAssignments(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { itemId: 'none', levelId: 'none', quantity: 0 }),
                [field]: field === 'quantity' ? parseFloat(value) || 0 : value
            }
        }));
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
            if (assignment.quantity > item.stock) {
                toast({
                    title: "Stock Insuficiente",
                    description: `No hay suficiente stock de "${item.description}" (${item.stock.toFixed(2)} disponible).`,
                    variant: "destructive"
                });
                return;
            }
        }

        setIsSaving(true);
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
                toast({ title: "Salida Procesada", description: "Despacho de materiales confirmado." });
                setIsWarehouseExitOpen(false);
                setSelectedStockExitIds([]);
                setCurrentExitItems([]);
                setExitAssignments({});
                fetchProjectData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center gap-4 h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Almacén...</p>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="flex flex-col min-h-screen text-primary p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className='bg-card w-fit'>
                        <h1 className="text-2xl font-bold flex items-center gap-3 font-headline uppercase tracking-tight">
                            <Package className="h-7 w-7 text-primary" /> Almacén: {project.title}
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Control logístico exclusivo de la obra</p>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-card border border-accent h-12 p-1 rounded-xl w-fit">
                    <TabsTrigger value="stock" className="text-[10px] font-black uppercase tracking-widest px-8 h-full data-[state=active]:bg-card data-[state=active]:text-black">
                        <Boxes className="h-3.5 w-3.5 mr-2" /> Inventario de Obra
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-[10px] font-black uppercase tracking-widest px-8 h-full data-[state=active]:bg-card data-[state=active]:text-black">
                        <History className="h-3.5 w-3.5 mr-2" /> Historial de Movimientos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="stock" className="space-y-6">
                    <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-accent">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="BUSCAR MATERIAL..."
                                className="pl-10 h-11 bg-card border-accent text-[10px] font-black uppercase"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="border-accent bg-card text-muted-foreground font-black text-[10px] uppercase tracking-widest h-11 px-6 rounded-xl hover:bg-card/10">
                                        <Printer className="mr-2 h-4 w-4 text-primary" /> Imprimir Reportes <ChevronDown className="ml-2 h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border-accent text-primary  p-1.5 rounded-xl w-60">
                                    <DropdownMenuItem onClick={handlePrintStock} className="text-[10px] font-black uppercase flex items-center gap-3 cursor-pointer py-3 focus:bg-primary/10">
                                        <Boxes className="h-4 w-4 text-primary" /> Impresión de Stock Actual
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handlePrintEntries} className="text-[10px] font-black uppercase flex items-center gap-3 cursor-pointer py-3 focus:bg-emerald-500/10">
                                        <ArrowDownCircle className="h-4 w-4 text-emerald-500" /> Impresión de Entradas
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handlePrintExits} className="text-[10px] font-black uppercase flex items-center gap-3 cursor-pointer py-3 focus:bg-red-500/10">
                                        <ArrowUpCircle className="h-4 w-4 text-red-500" /> Impresión de Salidas
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                className="bg-emerald-500 hover:bg-emerald-600 text-black font-black text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl "
                                onClick={() => setIsWarehouseEntryOpen(true)}
                            >
                                <ArrowDownCircle className="mr-2 h-4 w-4" /> Nuevo Ingreso
                            </Button>
                            <Button
                                className="bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl "
                                onClick={() => setIsWarehouseExitOpen(true)}
                            >
                                <ArrowUpCircle className="mr-2 h-4 w-4" /> Nueva Salida
                            </Button>
                        </div>
                    </div>

                    {inventoryItems.length > 0 ? (
                        <Card className="bg-card border-accent overflow-hidden p-0 gap-0">
                            <CardContent className="p-0 gap-0">
                                <Table>
                                    <TableHeader className="bg-accent">
                                        <TableRow className="border-accent hover:bg-transparent">
                                            <TableHead className="py-5 px-8 text-[10px] font-black uppercase tracking-widest">Insumo / Material</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center">Unidad</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right">Existencia Actual</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right pr-12">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {inventoryItems.map((item) => (
                                            <TableRow key={item.id} className="border-accent hover:bg-accent/2 transition-colors">
                                                <TableCell className="py-6 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                                            <Package className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <span className="text-sm font-black uppercase tracking-tight text-primary">{item.description}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-muted-foreground uppercase text-xs">{item.unit}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className={cn("font-mono text-base font-black",
                                                        item.stock <= 0 ? "text-red-500" : item.stock < 10 ? "text-amber-500" : "text-emerald-500"
                                                    )}>
                                                        {item.stock.toFixed(2)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right pr-12">
                                                    <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest border-none px-2",
                                                        item.status === 'ok' ? 'bg-emerald-500/10 text-emerald-500' :
                                                            item.status === 'bajo' ? 'bg-amber-500/10 text-amber-500' :
                                                                'bg-red-500/10 text-red-500'
                                                    )}>
                                                        {item.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20">
                            <Package className="h-16 w-16 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay existencias en el almacén de este proyecto.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history">
                    {movements.length > 0 ? (
                        <Card className="bg-[#0a0a0a] border-white/10 overflow-hidden shadow-2xl">
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="py-5 px-8 text-[10px] font-black uppercase tracking-widest">Fecha / Registro</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Tipo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Insumo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right">Cantidad</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right pr-12">Destino / Nota</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {movements.map((m) => (
                                            <TableRow key={m.id} className="border-white/5 hover:bg-white/3 transition-colors group">
                                                <TableCell className="py-5 px-8">
                                                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{new Date(m.date).toLocaleString('es-ES')}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {m.type === 'entry' ?
                                                            <ArrowDownCircle className="h-3.5 w-3.5 text-emerald-500" /> :
                                                            <ArrowUpCircle className="h-3.5 w-3.5 text-red-500" />
                                                        }
                                                        <span className={cn("text-[9px] font-black uppercase tracking-widest", m.type === 'entry' ? "text-emerald-500" : "text-red-500")}>
                                                            {m.type === 'entry' ? 'INGRESO' : 'DESPACHO'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs font-bold text-white uppercase">{m.supplyName}</span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs font-bold">
                                                    {m.quantity.toFixed(2)} {m.unit}
                                                </TableCell>
                                                <TableCell className="text-right pr-12">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{m.levelName !== 'N/A' ? `${m.levelName} — ${m.itemName}` : 'ENTRADA A STOCK'}</span>
                                                        {m.notes && <span className="text-[8px] italic text-muted-foreground/40">{m.notes}</span>}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20">
                            <History className="h-16 w-16 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No se registran movimientos logísticos en esta obra.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Ingreso de Almacén Dialog */}
            <Dialog open={isWarehouseEntryOpen} onOpenChange={setIsWarehouseEntryOpen}>
                <DialogContent className="min-w-300 bg-card border-accent text-primary p-0 overflow-hidden shadow-2xl flex flex-col h-[85vh]">
                    <DialogHeader className="p-6 border-b border-accent  flex flex-row items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <ArrowDownCircle className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Ingreso de Materiales</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mt-1">Registro de recursos recibidos físicamente en obra</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6 flex-1 overflow-hidden flex flex-col">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Vincular a Orden de Compra (Opcional)</Label>
                                <Select value={selectedPOForEntry} onValueChange={handlePOChange}>
                                    <SelectTrigger className="h-11 bg-card border-accent uppercase font-bold text-xs">
                                        <SelectValue placeholder="Seleccione orden..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card text-primary border-accent">
                                        <SelectItem value="none" className="text-[10px] font-bold uppercase">Ingreso Manual (Sin OC)</SelectItem>
                                        {purchaseOrders.filter(o => o.status !== 'completado').map((order) => (
                                            <SelectItem key={order.id} value={order.id} className="text-[10px] font-bold uppercase">
                                                {order.number} — {order.supplier?.company || 'Proveedor'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex-1 border border-accent rounded-xl overflow-hidden bg-card">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-accent border-accent sticky top-0 z-10 backdrop-blur-md">
                                        <TableRow className="border-accent hover:bg-transparent">
                                            <TableHead className="text-[10px] font-black uppercase py-4 px-6">Material / Insumo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center">Unidad</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right">Cant. Esperada</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center w-40">Cant. Recibida</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentWarehouseItems.length > 0 ? (
                                            currentWarehouseItems.map((item) => (
                                                <TableRow key={item.id} className="border-accent hover:bg-accent transition-colors">
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Package className="h-4 w-4 text-primary" />
                                                            <span className="text-xs font-bold text-primary uppercase">{item.description}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-[10px] font-bold text-muted-foreground uppercase text-center">{item.unit}</TableCell>
                                                    <TableCell className="text-xs font-mono text-right text-muted-foreground">{item.orderedQuantity.toFixed(2)}</TableCell>
                                                    <TableCell className="px-4">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={warehouseEntryOverrides[item.id] ?? item.orderedQuantity}
                                                            onChange={(e) => handleEntryQtyChange(item.id, e.target.value)}
                                                            className="h-9 bg-black border-white/10 text-center font-mono text-xs text-emerald-500 font-black"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-20 text-muted-foreground text-[10px] font-black uppercase opacity-20">Seleccione una OC para cargar items o ingrese manualmente.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-accent  shrink-0">
                        <Button variant="ghost" onClick={() => setIsWarehouseEntryOpen(false)} className="text-[10px] font-black uppercase tracking-widest">Cancelar</Button>
                        <Button onClick={handleConfirmWarehouseEntry} disabled={isSaving || currentWarehouseItems.length === 0} className="bg-emerald-500 hover:bg-emerald-600 text-black font-black text-[10px] uppercase tracking-widest px-12 h-11 shadow-xl shadow-emerald-500/10">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Confirmar Ingreso a Almacén
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Salida de Almacén Dialog */}
            <Dialog open={isWarehouseExitOpen} onOpenChange={setIsWarehouseExitOpen}>
                <DialogContent className="min-w-300 bg-card border-accent text-primary p-0 overflow-hidden h-[95vh] flex flex-col shadow-2xl">
                    <DialogHeader className="p-6 border-b border-accent bg-accent/2 flex flex-row items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <ArrowUpCircle className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Despacho de Materiales</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mt-1">Salida de almacén y asignación técnica a frentes de obra</DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pr-8">
                            <Button onClick={() => setIsSelectStockForExitOpen(true)} className="bg-primary hover:bg-primary/40 text-background font-black text-[10px] uppercase tracking-widest px-6 h-10 cursor-pointer">
                                <Boxes className="mr-2 h-4 w-4" /> Seleccionar del Stock
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
                                            const isStockExceeded = assignment.quantity > item.stock;

                                            return (
                                                <TableRow key={item.id} className={cn("border-white/5 hover:bg-white/3 transition-colors", (isExceeded || isStockExceeded) && "bg-red-500/5")}>
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Package className={cn("h-3.5 w-3.5", isExceeded || isStockExceeded ? "text-red-500" : "text-primary")} />
                                                            <span className="text-xs font-bold text-white uppercase">{item.description}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-[10px] font-bold text-muted-foreground uppercase text-center">{item.unit}</TableCell>
                                                    <TableCell className="text-xs font-mono text-right text-emerald-500 font-bold">{item.stock.toFixed(2)}</TableCell>
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
                                                                    isExceeded || isStockExceeded ? "text-red-500 border-red-500 focus-visible:ring-red-500 bg-red-500/10" : "text-red-400"
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
                                        <TableRow><TableCell colSpan={8} className="text-center py-32 text-muted-foreground opacity-20 uppercase text-[10px] font-black">No hay materiales seleccionados para el despacho.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>

                    <DialogFooter className="p-6 border-t border-white/5 bg-black/20 shrink-0">
                        <Button variant="ghost" onClick={() => setIsWarehouseExitOpen(false)} className="text-[10px] font-black uppercase tracking-widest">Cancelar</Button>
                        <Button onClick={handleConfirmWarehouseExit} disabled={isSaving || currentExitItems.length === 0} className="bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-12 h-11 shadow-xl shadow-red-500/10">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
                            Confirmar Despacho a Obra
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sub-Dialog: Seleccionar del Stock */}
            <Dialog open={isSelectStockForExitOpen} onOpenChange={setIsSelectStockForExitOpen}>
                <DialogContent className="max-w-3xl bg-card border-accent text-primary p-0 overflow-hidden h-[80vh] flex flex-col ">
                    <DialogHeader className="p-6 border-b border-accent bg-accent/2 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <Boxes className="h-5 w-5 text-primary" />
                            </div>
                            <DialogTitle className="text-lg font-bold uppercase tracking-tight">Existencias en Almacén</DialogTitle>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsSelectStockForExitOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogHeader>
                    <div className="p-6 flex-1 overflow-hidden">
                        <ScrollArea className="h-full border border-accent rounded-xl bg-card">
                            <Table>
                                <TableHeader className="bg-accent">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-12 text-center" />
                                        <TableHead className="text-[10px] font-black uppercase py-4">Insumo</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-center">Und.</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right pr-6">Stock Actual</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inventoryItems.filter(s => s.stock > 0).map((s) => (
                                        <TableRow key={s.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                            <TableCell className="text-center">
                                                <Checkbox checked={selectedStockExitIds.includes(s.id)} onCheckedChange={() => handleToggleStockExitItem(s.id)} />
                                            </TableCell>
                                            <TableCell className="text-xs font-bold text-primary uppercase">{s.description}</TableCell>
                                            <TableCell className="text-[10px] font-bold text-muted-foreground uppercase text-center">{s.unit}</TableCell>
                                            <TableCell className="text-xs font-mono text-right text-emerald-500 font-bold pr-6">{s.stock.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {inventoryItems.filter(s => s.stock > 0).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-20 text-muted-foreground text-[10px] font-black uppercase opacity-30">No hay stock disponible para despacho.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                    <DialogFooter className="p-6 border-t border-white/5 bg-black/20">
                        <Button onClick={confirmSelectedStockForExit} className="bg-primary text-black font-black text-[10px] uppercase px-8 h-10 shadow-lg">
                            Vincular para Despacho
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
