"use client";

import { useState, useMemo, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../../../../components/ui/table';
import {
    Card,
    CardContent
} from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
    Box,
    Search,
    Plus,
    MoreVertical,
    Layers,
    Trash2,
    Users as UsersIcon,
    Package,
    ClipboardCheck,
    Wrench,
    Save,
    Loader2,
    Edit,
    X,
    AlertCircle,
    Printer,
    ArrowRight,
    Check,
    Boxes
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger
} from '../../../../components/ui/dialog';
import { Label } from '../../../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../../../../components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../../components/ui/dropdown-menu';
import { ConstructionItem, Supply, Chapter, UnitOfMeasure } from '../../../../types/types';
import { useToast } from '../../../../hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Separator } from '../../../../components/ui/separator';
import { ScrollArea, ScrollBar } from '../../../../components/ui/scroll-area';
import { useAuth } from '../../../../hooks/use-auth';
import { cn } from '../../../../lib/utils';
import {
    getConstructionItems,
    getChapters,
    getUnits,
    getSupplies,
    deleteConstructionItem,
    updateConstructionItemLibrary,
    createConstructionItemLibrary
} from '@/actions';
import { Textarea } from '../../../../components/ui/textarea';

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

export default function ItemsPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    type ConstructionItemWithLocalProject = ConstructionItem & { localProjectTitle?: string | null };
    const [items, setItems] = useState<ConstructionItemWithLocalProject[]>([]);
    const [dbChapters, setDbChapters] = useState<Chapter[]>([]);
    const [dbSupplies, setDbSupplies] = useState<Supply[]>([]);
    const [dbUnits, setDbUnits] = useState<UnitOfMeasure[]>([]);

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [supplySearchTerm, setSupplySearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreateSupplyDialogOpen, setIsCreateSupplyDialogOpen] = useState(false);
    const [isLibraryDialogOpen, setIsLibraryDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingSupply, setIsCreatingSupply] = useState(false);
    const [supplyCreationError, setSupplyCreationError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        chapter: '',
        description: '',
        unit: '',
        performance: '1',
        notes: ''
    });
    const [selectedSupplies, setSelectedSupplies] = useState<ItemSupply[]>([]);
    const [selectedSuppliesSearchTerm, setSelectedSuppliesSearchTerm] = useState('');
    const [qualityControls, setQualityControls] = useState<any[]>([]);

    const [newSupplyData, setNewSupplyData] = useState({
        typology: 'Material',
        description: '',
        unit: '',
        price: '0'
    });

    useEffect(() => {
        setIsMounted(true);
        if (user?.id) {
            fetchInitialData();
        }
    }, [user?.id]);

    const fetchInitialData = async () => {
        if (!user?.id) return;
        setIsLoadingData(true);
        try {
            const [chaptersData, suppliesData, unitsData, constructionItemsData] = await Promise.all([
                getChapters(user.id),
                getSupplies(user.id),
                getUnits(user.id),
                getConstructionItems(user.id)
            ]);

            setDbChapters(chaptersData as any);

            if (suppliesData.success && suppliesData.supplies) {
                setDbSupplies(suppliesData.supplies);
            } else {
                setDbSupplies([]);
            }

            setDbUnits(unitsData as any);

            if (constructionItemsData.success && constructionItemsData.items) {
                setItems(constructionItemsData.items);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Fallo al cargar datos de la librería.", variant: "destructive" });
        } finally {
            setIsLoadingData(false);
        }
    };

    const filteredItems = useMemo(() => {
        return items.filter(item =>
            (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.chapter || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    const filteredSuppliesForDropdown = useMemo(() => {
        return dbSupplies.filter(s =>
            (s.description || '').toLowerCase().includes(supplySearchTerm.toLowerCase()) ||
            (s.typology || '').toLowerCase().includes(supplySearchTerm.toLowerCase())
        );
    }, [dbSupplies, supplySearchTerm]);

    const filteredSelectedSupplies = useMemo(() => {
        return selectedSupplies.filter(s =>
            (s.description || '').toLowerCase().includes(selectedSuppliesSearchTerm.toLowerCase()) ||
            (s.typology || '').toLowerCase().includes(selectedSuppliesSearchTerm.toLowerCase())
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

    const handleUpdateQuantity = (id: string, qty: string) => {
        const numQty = parseFloat(qty) || 0;
        setSelectedSupplies(prev => prev.map(s => {
            if (s.id === id) {
                return { ...s, quantity: numQty, subtotal: numQty * s.price };
            }
            return s;
        }));
    };

    const handleRemoveSupply = (id: string) => {
        setSelectedSupplies(prev => prev.filter(s => s.id !== id));
    };

    const handleAddQualityMain = () => {
        setQualityControls(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            description: '',
            subPoints: []
        }]);
    };

    const handleUpdateQualityMain = (id: string, description: string) => {
        setQualityControls(prev => prev.map(qc => qc.id === id ? { ...qc, description } : qc));
    };

    const handleRemoveQualityMain = (id: string) => {
        setQualityControls(prev => prev.filter(qc => qc.id !== id));
    };

    const handleAddQualitySub = (parentId: string) => {
        setQualityControls(prev => prev.map(qc => {
            if (qc.id === parentId) {
                return {
                    ...qc,
                    subPoints: [...qc.subPoints, { id: Math.random().toString(36).substr(2, 9), description: '' }]
                };
            }
            return qc;
        }));
    };

    const handleUpdateQualitySub = (parentId: string, subId: string, description: string) => {
        setQualityControls(prev => prev.map(qc => {
            if (qc.id === parentId) {
                return {
                    ...qc,
                    subPoints: qc.subPoints.map((sp: any) => sp.id === subId ? { ...sp, description } : sp)
                };
            }
            return qc;
        }));
    };

    const handleRemoveQualitySub = (parentId: string, subId: string) => {
        setQualityControls(prev => prev.map(qc => {
            if (qc.id === parentId) {
                return {
                    ...qc,
                    subPoints: qc.subPoints.filter((sp: any) => sp.id !== subId)
                };
            }
            return qc;
        }));
    };

    const handlePrintQuality = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Protocolo de Calidad - ${formData.description}</title>
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
                        <div><strong>Item:</strong> ${formData.description}</div>
                        <div><strong>Capítulo:</strong> ${formData.chapter}</div>
                        <div><strong>Unidad:</strong> ${formData.unit}</div>
                        <div><strong>Fecha:</strong> _________________</div>
                    </div>
                    <div class="section">
                        ${qualityControls.map(qc => `
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

        const mat = supplies.filter(s => s.typology === 'Material' || s.typology === 'Insumo').reduce((a, b) => a + b.subtotal, 0);
        const lab = supplies.filter(s => s.typology === 'Mano de Obra' || s.typology === 'Honorario').reduce((a, b) => a + b.subtotal, 0);
        const equ = supplies.filter(s => s.typology === 'Equipo' || s.typology === 'Herramienta').reduce((a, b) => a + b.subtotal, 0);

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
                        .info-cell { padding: 8px 12px; border-right: 1px solid #ccc; }
                        .info-cell:last-child { border-right: none; }
                        .info-cell .label { font-size: 8px; font-weight: 900; text-transform: uppercase; color: #666; letter-spacing: 1px; }
                        .info-cell .value { font-size: 12px; font-weight: 700; margin-top: 2px; text-transform: uppercase; }
                        .section-title { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #555; background: #f5f5f5; padding: 6px 12px; border: 1px solid #ccc; border-bottom: none; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th { background: #1a1a1a; color: #fff; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; padding: 7px 10px; text-align: left; }
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

                    <div class="info-grid">
                        <div class="info-cell">
                            <div class="label">Capítulo</div>
                            <div class="value">${item.chapter}</div>
                        </div>
                        <div class="info-cell" style="grid-column: span 2">
                            <div class="label">Descripción del Item</div>
                            <div class="value">${item.description}</div>
                        </div>
                        <div class="info-cell">
                            <div class="label">Unidad</div>
                            <div class="value">${item.unit}</div>
                        </div>
                    </div>

                    <div class="section-title">Composición de Insumos</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width:90px">Tipo</th>
                                <th>Descripción</th>
                                <th class="center" style="width:60px">Unidad</th>
                                <th class="right" style="width:90px">P. Unitario</th>
                                <th class="center" style="width:80px">Cantidad</th>
                                <th class="right" style="width:90px">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${supplies.length > 0 ? supplies.map(s => {
            const typeCls = (s.typology === 'Material' || s.typology === 'Insumo') ? 'mat' : (s.typology === 'Mano de Obra' || s.typology === 'Honorario') ? 'lab' : 'equ';
            return `<tr>
                                    <td><span class="type-badge ${typeCls}">${s.typology}</span></td>
                                    <td>${s.description}</td>
                                    <td class="center">${s.unit}</td>
                                    <td class="right">$${(s.price || 0).toFixed(2)}</td>
                                    <td class="center">${(s.quantity || 0).toFixed(4)}</td>
                                    <td class="right"><strong>$${(s.subtotal || 0).toFixed(2)}</strong></td>
                                </tr>`;
        }).join('') : '<tr><td colspan="6" style="text-align:center;padding:20px;color:#999">Sin insumos registrados</td></tr>'}
                        </tbody>
                    </table>
 
                    <table class="summary-table">
                        <tbody>
                            <tr><td>Materiales e Insumos</td><td class="right">$${(mat || 0).toFixed(2)}</td></tr>
                            <tr><td>Mano de Obra</td><td class="right">$${(lab || 0).toFixed(2)}</td></tr>
                            <tr><td>Equipo y Herramienta</td><td class="right">$${(equ || 0).toFixed(2)}</td></tr>
                        </tbody>
                        <tfoot class="summary-total">
                            <tr><td style="padding:10px 10px">COSTO DIRECTO TOTAL</td><td class="right" style="padding:10px 10px">$${(item.directCost || 0).toFixed(2)}</td></tr>
                        </tfoot>
                    </table>

                    <div class="footer">
                        <div class="signature">Elaborado por</div>
                        <div class="signature">Revisado por</div>
                        <div class="signature">Aprobado por</div>
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este ítem de la librería maestro?')) return;

        const result = await deleteConstructionItem(id);

        if (result.success) {
            setItems(prev => prev.filter(item => item.id !== id));
            toast({
                title: "Item eliminado",
                description: "El ítem ha sido removido del catálogo maestro.",
            });
        } else {
            toast({
                title: "Operación bloqueada",
                description: result.error,
                variant: "destructive",
            });
        }
    };

    const handleEditClick = (item: ConstructionItem) => {
        setIsEditMode(true);
        setEditingItemId(item.id);
        setFormData({
            chapter: item.chapter,
            description: item.description,
            unit: item.unit,
            performance: item.performance.toString(),
            notes: ''
        });
        // Transformar los suministros de Prisma al formato de la UI
        const mappedSupplies = (item.supplies as any[] || []).map(s => ({
            id: s.supplyId,
            description: s.supply?.description || '',
            unit: s.supply?.unit || '',
            price: s.supply?.price || 0,
            quantity: s.quantity || 0,
            subtotal: (s.quantity || 0) * (s.supply?.price || 0),
            typology: s.supply?.typology || 'Material'
        }));

        setSelectedSupplies(mappedSupplies);
        setQualityControls((item.qualityControls as any) || []);
        setIsDialogOpen(true);
    };

    const handleCreateSupplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user?.id) return;


        const tempId = `temp-${Date.now()}`;
        const price = parseFloat(newSupplyData.price) || 0;

        const newLocalSupply: ItemSupply = {
            id: tempId,
            description: newSupplyData.description,
            unit: newSupplyData.unit,
            price: price,
            quantity: 1,
            subtotal: price,
            typology: newSupplyData.typology,
            isNew: true
        };

        setSelectedSupplies(prev => [...prev, newLocalSupply]);

        toast({
            title: "Insumo añadido",
            description: "Se ha añadido a la lista del ítem. Se guardará permanentemente al guardar el ítem.",
        });

        // Limpiar campos pero NO cerrar el modal (por petición del usuario)
        setNewSupplyData({
            typology: 'Material',
            description: '',
            unit: newSupplyData.unit, // Mantener la unidad anterior puede ser Ãºtil
            price: '0'
        });
        setSupplyCreationError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;
        setIsSubmitting(true);

        const itemData = {
            chapter: formData.chapter,
            description: formData.description,
            unit: formData.unit,
            performance: parseFloat(formData.performance),
            directCost: summary.directCost,
            total: summary.totalApu,
            userId: user.id,
            supplies: [...selectedSupplies],
            qualityControls
        };

        if (isEditMode && editingItemId) {
            const result = await updateConstructionItemLibrary(editingItemId, itemData);
            if (result.success) {
                toast({ title: "Item actualizado", description: "Los cambios han sido guardados." });
                fetchInitialData();
                setIsDialogOpen(false);
                resetForm();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } else {
            const result = await createConstructionItemLibrary(itemData);
            if (result.success) {
                toast({ title: "Item creado", description: "El nuevo item ha sido añadido al catálogo." });
                fetchInitialData();
                setIsDialogOpen(false);
                resetForm();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        }
        setIsSubmitting(false);
    };

    const resetForm = () => {
        setFormData({ chapter: '', description: '', unit: '', performance: '1', notes: '' });
        setSelectedSupplies([]);
        setQualityControls([]);
        setIsEditMode(false);
        setEditingItemId(null);
        setSupplySearchTerm('');
        setSelectedSuppliesSearchTerm('');
    };

    if (!isMounted) return null;

    if (isLoadingData && items.length === 0) {
        return (
            <div className="container mx-auto p-8 flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Sincronizando...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card w-fit">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3 text-foreground">
                        <Boxes className="h-8 w-8 text-primary" /> Items de Construcción
                    </h1>
                    <p className="text-muted-foreground mt-1">Catálogo de partidas y análisis de costos unitarios.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-muted/50 backdrop-blur-sm">
                <div className="relative w-full max-w-md bg-card">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por descripción o capítulo..."
                        className="pl-10 h-10 bg-card border-muted/50 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/40 text-background font-bold px-8 h-11  shadow-primary/20 cursor-pointer" onClick={() => {
                            resetForm();
                            setIsEditMode(false);
                        }}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-250 w-full max-h-[95vh] overflow-hidden bg-card border-muted/50 p-0 flex flex-col ">
                        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b border-accent  flex flex-row items-center gap-4 shrink-0">
                                <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                    <Boxes className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary leading-none">
                                        {isEditMode ? 'Editar Item' : 'Crear Nuevo Item'}
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">
                                        Análisis de precios unitarios y parámetros de control
                                    </DialogDescription>
                                </div>
                            </div>

                            <Tabs defaultValue="informacion" className="flex-1 flex flex-col overflow-hidden">
                                <div className="px-6 border-accent">
                                    <TabsList className="bg-card border border-accent h-12 p-0 rounded-xl overflow-hidden mb-6 flex flex-wrap md:flex-nowrap">
                                        <TabsTrigger value="informacion" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                                            Análisis Costos
                                        </TabsTrigger>
                                        <TabsTrigger value="calidad" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                                            Control de Calidad
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                                <ScrollArea className="h-100">
                                    <div className="flex">
                                        <TabsContent value="informacion" className="m-0 p-6 space-y-8 outline-none w-full ">
                                            <div className="flex gap-4 flex-row flex-wrap w-full">

                                                <div className="space-y-4 h-100 sm:min-w-[550px] sm:max-w-[550px]">
                                                    <div className="flex gap-4 flex-col  w-full">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Capítulo</Label>
                                                            <Select value={formData.chapter} onValueChange={(val) => setFormData(p => ({ ...p, chapter: val }))} required>
                                                                <SelectTrigger className="bg-background/50 border-accent h-11 text-primary w-full uppercase text-xs font-bold ">
                                                                    <SelectValue placeholder={isLoadingData ? "Cargando..." : "Seleccione capítulo"} />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-card border-white/10">
                                                                    {dbChapters.length > 0 ? (
                                                                        dbChapters.map(c => <SelectItem key={c.id} value={c.name} className="uppercase text-[10px] font-bold">{c.name}</SelectItem>)
                                                                    ) : (
                                                                        <SelectItem value="none" disabled>No hay capítulos definidos</SelectItem>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Descripción Ítem</Label>
                                                            <Input
                                                                className="bg-card border-accent h-11 text-primary uppercase text-xs font-bold "
                                                                placeholder="Nombre de la partida..."
                                                                value={formData.description}
                                                                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="grid grid-rows-2 gap-4 h-0">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Unidad</Label>
                                                                <Select value={formData.unit} onValueChange={(val) => setFormData(p => ({ ...p, unit: val }))} required>
                                                                    <SelectTrigger className="bg-background/50 border-accent h-11 text-primary w-full uppercase text-xs font-bold ">
                                                                        <SelectValue placeholder="Unidad" />
                                                                    </SelectTrigger>
                                                                    <div className="w-full h-0 flex flex-row">
                                                                        <SelectContent className="bg-card border-accent w-full ">
                                                                            {dbUnits.length > 0 ? (
                                                                                dbUnits.map(u => <SelectItem key={u.id} value={u.abbreviation} className="uppercase text-[10px] font-bold">{u.name} ({u.abbreviation})</SelectItem>)
                                                                            ) : (
                                                                                <SelectItem value="none" disabled>No hay unidades</SelectItem>
                                                                            )}
                                                                        </SelectContent>
                                                                    </div>
                                                                    <div className="space-y-2 ">
                                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Rendimiento "unidad"/Hr</Label>
                                                                        <Input
                                                                            className="bg-background/50 border-accent h-11 text-primary font-mono font-bold"
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={formData.performance}
                                                                            onChange={(e) => setFormData(p => ({ ...p, performance: e.target.value }))}
                                                                            required
                                                                        />
                                                                    </div>
                                                                </Select>
                                                                <div className="space-y-2 w-full ">
                                                                    <div className="h-full space-y-2">
                                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Notas</Label>
                                                                        <Textarea
                                                                            className="bg-background/50 border-accent  text-primary font-mono font-bold resize-none tracking-widest h-full"
                                                                            value={formData.notes}
                                                                            onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>


                                                <div className="flex w-full sm:min-w-[380px] sm:max-w-[380px]">
                                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 flex flex-col justify-between w-full h-fit">
                                                        <div className="space-y-3">
                                                            {[
                                                                { label: 'Materiales', value: summary.mat },
                                                                { label: 'Mano de obra', value: summary.lab },
                                                                { label: 'Cargas sociales (0%)', value: 0 },
                                                                { label: 'IVA (0%)', value: 0 },
                                                                { label: 'Equipo', value: summary.equ },
                                                                { label: 'Desgaste (0%)', value: 0 },
                                                                { label: 'Gastos Adm (0%)', value: 0 },
                                                                { label: 'Utilidades (0%)', value: 0 },
                                                                { label: 'IT (0%)', value: 0 },
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
                                                                <p className="text-xl font-bold text-emerald-500">${summary.directCost.toFixed(2)}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">TOTAL APU</p>
                                                                <p className="text-xl font-bold text-emerald-500">${summary.totalApu.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator className="border-accent" />

                                            <div className="space-y-4">
                                                <div className="flex  gap-4 items-center p-4 rounded-xl border ">
                                                    <Dialog open={isCreateSupplyDialogOpen} onOpenChange={(open) => {
                                                        setIsCreateSupplyDialogOpen(open);
                                                        if (!open) setSupplyCreationError(null);
                                                    }}>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="default"
                                                                className="h-11 text-primary font-black text-[10px] uppercase tracking-widest px-8 hover:bg-muted/50 bg-secondary cursor-pointer"
                                                            >
                                                                <Plus className="mr-2 h-4 w-4 text-primary" /> Crear Nuevo Insumo
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-112.5 bg-card border-muted/50 shadow-2xl p-0 overflow-hidden">
                                                            <div className="flex flex-col">
                                                                <div className="p-6 border-b border-accent flex flex-row items-center gap-4 shrink-0">
                                                                    <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                                                        <Package className="h-5 w-5 text-primary" />
                                                                    </div>
                                                                    <div>
                                                                        <DialogTitle className="text-lg font-bold uppercase tracking-tight text-primary leading-none">Nuevo Insumo</DialogTitle>
                                                                        <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">Añadir recurso al catálogo general</DialogDescription>
                                                                    </div>
                                                                </div>
                                                                {supplyCreationError && (
                                                                    <div className="m-6 bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2 text-destructive text-xs">
                                                                        <AlertCircle className="h-4 w-4" />
                                                                        <p>{supplyCreationError}</p>
                                                                    </div>
                                                                )}

                                                                <div className="px-6 py-6 space-y-4">
                                                                    <div className="space-y-2">
                                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Tipología</Label>
                                                                        <Select value={newSupplyData.typology} onValueChange={(val) => setNewSupplyData(p => ({ ...p, typology: val }))}>
                                                                            <SelectTrigger className="bg-background/50 border-accent h-11 text-primary text-xs w-full uppercase font-bold">
                                                                                <SelectValue placeholder="Tipo" />
                                                                            </SelectTrigger>
                                                                            <SelectContent className="bg-card border-accent">
                                                                                <SelectItem value="Material" className="uppercase text-[10px] font-bold">Material</SelectItem>
                                                                                <SelectItem value="Mano de Obra" className="uppercase text-[10px] font-bold">Mano de Obra</SelectItem>
                                                                                <SelectItem value="Equipo" className="uppercase text-[10px] font-bold">Equipo</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Descripción</Label>
                                                                        <Input
                                                                            className="bg-background/50 border-accent h-11 text-primary text-xs uppercase font-bold"
                                                                            placeholder="Nombre del insumo..."
                                                                            value={newSupplyData.description}
                                                                            onChange={(e) => setNewSupplyData(p => ({ ...p, description: e.target.value }))}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    handleCreateSupplySubmit(e as any);
                                                                                }
                                                                            }}
                                                                            required
                                                                        />
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Unidad</Label>
                                                                            <Select value={newSupplyData.unit} onValueChange={(val) => setNewSupplyData(p => ({ ...p, unit: val }))} required>
                                                                                <SelectTrigger className="bg-background/50 border-accent h-11 text-primary text-xs w-full uppercase font-bold">
                                                                                    <SelectValue placeholder="Unidad" />
                                                                                </SelectTrigger>
                                                                                <SelectContent className="bg-card border-white/10">
                                                                                    {dbUnits.map(u => <SelectItem key={u.id} value={u.abbreviation} className="uppercase text-[10px] font-bold">{u.abbreviation}</SelectItem>)}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Precio Base</Label>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.01"
                                                                                className="bg-background/50 border-accent h-11 text-primary text-xs font-mono font-bold"
                                                                                value={newSupplyData.price}
                                                                                onChange={(e) => setNewSupplyData(p => ({ ...p, price: e.target.value }))}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        handleCreateSupplySubmit(e as any);
                                                                                    }
                                                                                }}
                                                                                required
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <DialogFooter className="p-6 border-t border-accent gap-3 items-center">
                                                                    <Button type="button" variant="ghost" onClick={() => setIsCreateSupplyDialogOpen(false)} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary cursor-pointer">Cancelar</Button>
                                                                    <Button type="button" onClick={handleCreateSupplySubmit} className="bg-secondary hover:bg-muted/40 text-primary font-black text-[10px] uppercase tracking-widest h-11 px-8 cursor-pointer">
                                                                        <Save className="mr-2 h-4 w-4" /> Añadir Insumo
                                                                    </Button>
                                                                </DialogFooter>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>

                                                    <div className="relative w-full">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                        <Input
                                                            placeholder="Buscar Item ..."
                                                            className="pl-9 h-11 bg-card border-accent text-[10px] font-black tracking-widest w-full"
                                                            value={selectedSuppliesSearchTerm}
                                                            onChange={(e) => setSelectedSuppliesSearchTerm(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="flex-1"></div>

                                                    <Dialog open={isLibraryDialogOpen} onOpenChange={setIsLibraryDialogOpen}>
                                                        <DialogTrigger asChild>
                                                            <Button type="button" className="h-11 bg-secondary hover:bg-muted/50 text-primary font-black text-[10px] uppercase tracking-widest px-8  cursor-pointer">
                                                                Seleccionar de la Librería
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-175 bg-card border-accent text-primary p-0 overflow-hidden  flex flex-col h-[80vh]">
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
                                                            <div className="p-6 space-y-4 flex-1 flex flex-col overflow-hidden">
                                                                <div className="relative">
                                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                    <Input
                                                                        placeholder="BUSCAR POR DESCRIPCIÓN O TIPO..."
                                                                        className="pl-10 h-11 bg-card border-accent text-xs uppercase font-bold"
                                                                        value={supplySearchTerm}
                                                                        onChange={(e) => setSupplySearchTerm(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="border border-accent rounded-xl overflow-hidden flex-1 flex flex-col">
                                                                    <ScrollArea className="h-100">
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
                                                                                {filteredSuppliesForDropdown.length > 0 ? (
                                                                                    filteredSuppliesForDropdown.map(s => {
                                                                                        const isAdded = selectedSupplies.some(added => added.id === s.id);
                                                                                        return (
                                                                                            <TableRow key={s.id} className="border-accent hover:bg-white/3 transition-colors group">
                                                                                                <TableCell className="px-4 py-3">
                                                                                                    <div className="p-1.5 bg-accent rounded-md border border-white/10 w-fit">
                                                                                                        {s.typology === 'Material' || s.typology === 'Insumo' ? <Package className="h-3.5 w-3.5 text-primary" /> : s.typology === 'Mano de Obra' || s.typology === 'Honorario' ? <UsersIcon className="h-3.5 w-3.5 text-emerald-500" /> : <Wrench className="h-3.5 w-3.5 text-amber-500" />}
                                                                                                    </div>
                                                                                                </TableCell>
                                                                                                <TableCell className="text-[11px] font-bold uppercase text-primary">{s.description}</TableCell>
                                                                                                <TableCell className="text-[9px] text-center font-black text-muted-foreground uppercase">{s.unit}</TableCell>
                                                                                                <TableCell className="text-[10px] text-right font-mono font-bold text-muted-foreground pr-4">${s.price.toFixed(2)}</TableCell>
                                                                                                <TableCell className="text-right pr-4">
                                                                                                    <Button
                                                                                                        type="button"
                                                                                                        variant="ghost"
                                                                                                        size="icon"
                                                                                                        className={cn("h-8 w-8", isAdded ? "text-emerald-500 hover:bg-emerald-500/10" : "text-primary hover:bg-primary/10")}
                                                                                                        onClick={() => handleAddSupply(s)}
                                                                                                        disabled={isAdded}
                                                                                                    >
                                                                                                        {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                                                                                    </Button>
                                                                                                </TableCell>
                                                                                            </TableRow>
                                                                                        );
                                                                                    })
                                                                                ) : (
                                                                                    <TableRow>
                                                                                        <TableCell colSpan={5} className="text-center py-20 text-[10px] font-black uppercase text-muted-foreground opacity-30">No se encontraron insumos</TableCell>
                                                                                    </TableRow>
                                                                                )}
                                                                            </TableBody>
                                                                        </Table>
                                                                        <ScrollBar orientation='vertical' />
                                                                        <ScrollBar orientation='horizontal' />
                                                                    </ScrollArea>
                                                                </div>
                                                            </div>
                                                            <div className="p-6 border-t border-accent flex justify-end items-center gap-4 shrink-0">
                                                                <Button type="button" variant="ghost" onClick={() => setIsLibraryDialogOpen(false)} className="text-muted-foreground hover:text-primary hover:bg-accent font-bold text-[10px] uppercase tracking-widest cursor-pointer">
                                                                    Cancelar
                                                                </Button>
                                                                <Button type="button" onClick={() => setIsLibraryDialogOpen(false)} className="bg-secondary hover:bg-muted/40 text-primary font-black text-[10px] uppercase tracking-widest px-8 h-11 cursor-pointer ">
                                                                    Cerrar Librería
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>

                                                </div>

                                                <div className="border border-accent rounded-2xl overflow-hidden min-h-100 p-0">
                                                    <Table>
                                                        <TableHeader className="bg-accent sticky top-0 z-10 backdrop-blur-md">
                                                            <TableRow className="border-accent hover:bg-transparent">
                                                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-6 py-4">Tipo</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Descripción</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Unidad</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right">P. Unitario</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Cantidad</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right px-6">Subtotal</TableHead>
                                                                <TableHead className="w-10"></TableHead>
                                                            </TableRow>
                                                        </TableHeader>

                                                        <TableBody>
                                                            {filteredSelectedSupplies.length > 0 ? (
                                                                filteredSelectedSupplies.map((s) => (
                                                                    <TableRow key={s.id} className="border-accent hover:bg-white/2 group transition-colors">
                                                                        <TableCell className="px-6 py-4">
                                                                            <div className="p-2 bg-accent rounded-lg border border-accent w-fit">
                                                                                {s.typology === 'Material' || s.typology === 'Insumo' ? <Package className="h-4 w-4 text-primary" /> : s.typology === 'Mano de Obra' || s.typology === 'Honorario' ? <UsersIcon className="h-4 w-4 text-emerald-500" /> : <Wrench className="h-4 w-4 text-amber-500" />}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-xs font-bold text-primary uppercase">{s.description}</TableCell>
                                                                        <TableCell className="text-[10px] text-muted-foreground font-black text-center uppercase tracking-widest">{s.unit}</TableCell>
                                                                        <TableCell className="text-right text-[10px] font-mono font-bold text-muted-foreground">${(s.price || 0).toFixed(2)}</TableCell>
                                                                        <TableCell className="text-center">
                                                                            <Input
                                                                                className="w-24 h-9 bg-card border-accent text-center font-mono text-xs mx-auto focus:ring-1 focus:ring-primary text-primary"
                                                                                type="number"
                                                                                step="0.0001"
                                                                                value={s.quantity}
                                                                                onChange={(e) => handleUpdateQuantity(s.id!, e.target.value)}
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell className="text-right font-mono font-bold text-primary px-6">${(s.subtotal || 0).toFixed(2)}</TableCell>
                                                                        <TableCell className="px-2">
                                                                            <button
                                                                                type="button"
                                                                                className="h-8 w-8 text-destructive flex items-center justify-center hover:bg-destructive/10 rounded-md transition-colors"
                                                                                onClick={() => handleRemoveSupply(s.id)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            ) : (
                                                                <TableRow>
                                                                    <TableCell colSpan={7} className="text-center py-24 text-muted-foreground text-xs italic">
                                                                        <div className="flex flex-col items-center gap-3">
                                                                            <Box className="h-10 w-10 opacity-10" />
                                                                            <p className="text-[10px] font-black uppercase tracking-widest">No hay insumos añadidos.</p>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
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
                                                    <Button
                                                        type="button"
                                                        onClick={handleAddQualityMain}
                                                        className="h-9 bg-secondary hover:bg-muted/50 text-primary font-black text-[10px] uppercase tracking-widest px-6 cursor-pointer"
                                                    >
                                                        <Plus className="mr-2 h-3.5 w-3.5" /> Añadir Punto
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {qualityControls.length > 0 ? (
                                                    qualityControls.map((qc, idx) => (
                                                        <Card key={qc.id} className=" border-accent overflow-hidden group">
                                                            <div className="p-4  border-b border-accent flex items-center gap-4">
                                                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                                                                    {idx + 1}
                                                                </div>
                                                                <Input
                                                                    className="flex-1 bg-transparent border-accent focus:border-primary/30 h-10 text-sm font-bold text-primary placeholder:text-primary/20 uppercase"
                                                                    placeholder="DescripciÃ³n del punto de control..."
                                                                    value={qc.description}
                                                                    onChange={(e) => handleUpdateQualityMain(qc.id, e.target.value)}
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => handleAddQualitySub(qc.id)}>
                                                                        <Plus className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveQualityMain(qc.id)}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="p-4 space-y-3">
                                                                {qc.subPoints.map((sp: any, sidx: number) => (
                                                                    <div key={sp.id} className="flex items-center gap-3 pl-12 group/sub">
                                                                        <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                                                                        <div className="flex-1 relative">
                                                                            <Input
                                                                                className=" border-accent focus:border-primary/20 h-9 text-xs text-muted-foreground pr-10 uppercase"
                                                                                placeholder="Sub-punto especÃ­fico..."
                                                                                value={sp.description}
                                                                                onChange={(e) => handleUpdateQualitySub(qc.id, sp.id, e.target.value)}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-destructive transition-colors"
                                                                                onClick={() => handleRemoveQualitySub(qc.id, sp.id)}
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    type="button"
                                                                    className="pl-12 flex items-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest mt-2 cursor-pointer"
                                                                    onClick={() => handleAddQualitySub(qc.id)}
                                                                >
                                                                    <Plus className="h-3 w-3" /> Añadir sub-punto
                                                                </button>
                                                            </div>
                                                        </Card>
                                                    ))
                                                ) : (
                                                    <div className="h-full min-h-75 flex flex-col items-center justify-center text-muted-foreground text-center gap-4">
                                                        <ClipboardCheck className="h-16 w-16 opacity-5" />
                                                        <p className="font-bold text-primary uppercase text-xs tracking-[0.2em]">Sin Protocolo de Calidad</p>
                                                        <Button type="button" variant="outline" className="border-accent text-[10px] font-black uppercase text-primary hover:bg-primary/5" onClick={handleAddQualityMain}>
                                                            Empezar Checklist
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    </div>
                                </ScrollArea>
                            </Tabs>

                            <div className="p-6 border-t border-accent flex justify-end items-center gap-4 shrink-0">
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-primary hover:bg-primary/5 font-bold text-[10px] uppercase tracking-widest cursor-pointer">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-muted/40 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11 cursor-pointer">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> {isEditMode ? 'Actualizar Item' : 'Guardar Item'}</>}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div >

            {filteredItems.length > 0 ? (
                <Card className="border-muted/50 overflow-hidden bg-card backdrop-blur-sm p-0 min-h-[60vh]">
                    <ScrollArea className='h-[600px]'>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="py-4 px-6 text-[12px] font-black uppercase text-muted-foreground">Capítulo</TableHead>
                                            <TableHead className="text-[12px] font-black uppercase text-muted-foreground">Descripción</TableHead>
                                            <TableHead className="text-[12px] font-black uppercase text-muted-foreground">Unidad</TableHead>
                                            <TableHead className="text-right text-[12px] font-black uppercase text-muted-foreground">Rendimiento Hr</TableHead>
                                            <TableHead className="text-right text-[12px] font-black uppercase text-muted-foreground">Costo Directo</TableHead>
                                            <TableHead className="text-right px-6 text-[12px] font-black uppercase text-muted-foreground">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-muted/20 transition-colors border-muted/50">
                                                <TableCell>
                                                    <div className="flex items-center gap-2 px-4 py-2">

                                                        <span className="text-[14px] font-black text-muted-foreground uppercase tracking-tight">
                                                            {item.chapter?.toString().replace(
                                                                /\(local\)/i,
                                                                item.localProjectTitle ? `(${item.localProjectTitle})` : '(local)'
                                                            )}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-bold text-[14px] max-w-75 truncate uppercase">
                                                    {item.description?.toString().replace(
                                                        /\(local\)/i,
                                                        item.localProjectTitle ? `(${item.localProjectTitle})` : '(local)'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground uppercase font-black text-[14px]">{item.unit}</TableCell>
                                                <TableCell className="text-right font-mono text-[14px] font-bold">{(item.performance || 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-mono font-bold text-emerald-500 text-[14px]">
                                                    ${(item.directCost || 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 cursor-pointer">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-card border-muted/50 text-primary shadow-lg">
                                                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-tighter" onClick={() => handlePrintItem(item)}>
                                                                <Printer className="h-3.5 w-3.5 text-primary" /> Imprimir APU
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-tighter" onClick={() => handleEditClick(item)}>
                                                                <Edit className="h-3.5 w-3.5 text-primary" /> Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 text-xs font-bold uppercase tracking-tighter focus:text-destructive"
                                                                onClick={() => handleDeleteItem(item.id)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 text-destructive" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <ScrollBar orientation="vertical" />
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20">
                    <Boxes className="h-16 w-16 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No se encontraron items registrados.</p>
                </div>
            )}
        </div >
    );
}
