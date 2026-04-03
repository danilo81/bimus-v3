"use client";

import { useState, useEffect, useMemo } from 'react';
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
    Trash2,
    Edit,
    Loader2,
    Save,
    X,
    Building2,
    Calendar,
    Check,
    Info,
    Star,
    History,
    UserStar,
    UserPlus
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
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
import { Supply, Contact, UnitOfMeasure } from '../../../../types/types';
import { useToast } from '../../../../hooks/use-toast';
import { useAuth } from '../../../../hooks/use-auth';
import { getSupplies, createSupply, updateSupply, deleteSupply, addSupplyCost, deleteSupplyCost, getContacts, createContact, getUnits } from '@/actions';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Separator } from '../../../../components/ui/separator';
import { cn } from '../../../../lib/utils';
import { ScrollArea, ScrollBar } from '../../../../components/ui/scroll-area';
import { ImportExportSupplies } from '@/components/layout/modals/ImportSuppliesModal';

const typologies = ["Material", "Mano de Obra", "Equipo"];

export default function SuppliesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('all');
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [dbUnits, setDbUnits] = useState<UnitOfMeasure[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [subModalData, setSubModalData] = useState({
        supplierId: 'none',
        price: '0',
        date: new Date().toISOString().split('T')[0],
        isPreferred: editingSupply ? (editingSupply.costs?.length === 0) : true
    });

    const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
    const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
    const [newSupplierData, setNewSupplierData] = useState({
        name: '',
        company: '',
        nit: '',
        phone: '',
    });

    const [formData, setFormData] = useState({
        typology: 'Material',
        description: '',
        unit: '',
        price: '0',
        tag: '',
        supplierId: 'none',
        supplierPrice: '0',
        supplierPriceDate: ''
    });

    useEffect(() => {
        setIsMounted(true);
        if (user?.id) {
            fetchData();
        }
    }, [user?.id]);

    const fetchData = async () => {
        if (!user?.id) return [];
        setLoading(true);
        try {
            const [suppliesData, contactsData, unitsData] = await Promise.all([
                getSupplies(user.id),
                getContacts(),
                getUnits(user.id)
            ]);

            if (suppliesData.success && suppliesData.supplies) {
                setSupplies(suppliesData.supplies);
            } else {
                setSupplies([]);
                if (suppliesData.error) throw new Error(suppliesData.error);
            }

            setContacts(contactsData as unknown as Contact[]);
            setDbUnits(unitsData as UnitOfMeasure[]);
            if (unitsData.length > 0 && !formData.unit) {
                setFormData(prev => ({ ...prev, unit: unitsData[0].abbreviation }));
            }
            return suppliesData.supplies || [];
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos.",
                variant: "destructive",
            });
            return [];
        } finally {
            setLoading(false);
        }
    };

    const filteredSupplies = supplies.filter(supply => {
        const matchesSearch = supply.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supply.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (supply.tag?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || supply.typology === activeTab;
        return matchesSearch && matchesTab;
    });

    const suppliers = useMemo(() => {
        return contacts.filter(c => c.type === 'proveedor');
    }, [contacts]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            typology: 'Material',
            description: '',
            unit: dbUnits.length > 0 ? dbUnits[0].abbreviation : 'und',
            price: '0',
            tag: '',
            supplierId: 'none',
            supplierPrice: '0',
            supplierPriceDate: ''
        });
        setEditingSupply(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;
        setIsSubmitting(true);

        const payload = {
            userId: user.id,
            typology: formData.typology,
            description: formData.description,
            unit: formData.unit,
            price: parseFloat(formData.price) || 0,
            tag: formData.tag || undefined,
            supplierId: formData.supplierId === 'none' ? undefined : formData.supplierId,
            supplierPrice: formData.supplierId === 'none' ? undefined : (parseFloat(formData.supplierPrice) || 0),
            supplierPriceDate: formData.supplierId === 'none' ? undefined : (formData.supplierPriceDate || undefined),
        };

        const result = await createSupply(payload);

        if (result.success) {
            toast({
                title: "Insumo creado",
                description: "El nuevo insumo ha sido añadido exitosamente.",
            });
            fetchData();
            setIsDialogOpen(false);
        } else {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        }
        setIsSubmitting(false);
    };

    const handleEditClick = (supply: Supply) => {
        setEditingSupply(supply);
        setFormData({
            typology: supply.typology,
            description: supply.description,
            unit: supply.unit,
            price: (supply.price ?? 0).toString(),
            tag: supply.tag || '',
            supplierId: 'none',
            supplierPrice: '0',
            supplierPriceDate: ''
        });
        setIsDialogOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSupply) return;
        setIsSubmitting(true);

        const payload = {
            typology: formData.typology,
            description: formData.description,
            unit: formData.unit,
            price: parseFloat(formData.price) || 0,
            tag: formData.tag || undefined,
        };

        const result = await updateSupply(editingSupply.id, payload);

        if (result.success) {
            toast({
                title: "Insumo actualizado",
                description: "Los cambios han sido guardados correctamente.",
            });
            fetchData();
            setIsDialogOpen(false);
        } else {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este insumo?')) return;

        const result = await deleteSupply(id);
        if (result.success) {
            toast({
                title: "Insumo eliminado",
                description: "El insumo ha sido removido exitosamente.",
                variant: "destructive",
            });
            fetchData();
        } else {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        }
    };

    const handleOpenSubModal = () => {
        setSubModalData({
            supplierId: 'none',
            price: '0',
            date: new Date().toISOString().split('T')[0],
            isPreferred: editingSupply ? (editingSupply.costs?.length === 0) : true
        });
        setIsSubModalOpen(true);
    };

    const handleSaveSubModal = async () => {
        if (subModalData.supplierId === 'none') {
            toast({ title: "Error", description: "Debe seleccionar un proveedor.", variant: "destructive" });
            return;
        }

        if (editingSupply) {
            setIsSubmitting(true);
            const result = await addSupplyCost({
                supplyId: editingSupply.id,
                supplierId: subModalData.supplierId,
                price: parseFloat(subModalData.price) || 0,
                date: subModalData.date,
                isPreferred: subModalData.isPreferred,
                notes: ''
            });

            if (result.success) {
                toast({ title: "Costo añadido", description: "Se ha registrado el nuevo precio del proveedor." });
                const updatedSupplies = await fetchData();
                // Actualizar el objeto que se está editando para que el modal refleje los cambios
                const fresh = (updatedSupplies as Supply[]).find((s: Supply) => s.id === editingSupply.id);
                if (fresh) setEditingSupply(fresh);
                setIsSubModalOpen(false);
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
            setIsSubmitting(false);
        } else {
            setFormData(prev => ({
                ...prev,
                supplierId: subModalData.supplierId,
                supplierPrice: subModalData.price,
                supplierPriceDate: subModalData.date
            }));
            setIsSubModalOpen(false);
        }
    };

    const handleDeleteCost = async (costId: string) => {
        if (!confirm('¿Eliminar este costo de proveedor?')) return;
        const result = await deleteSupplyCost(costId);
        if (result.success) {
            toast({ title: "Costo eliminado" });
            const updatedSupplies = await fetchData();
            if (editingSupply) {
                const fresh = (updatedSupplies as Supply[]).find((s: Supply) => s.id === editingSupply.id);
                if (fresh) setEditingSupply(fresh);
            }
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const handleCreateSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsCreatingSupplier(true);
        try {
            const result = await createContact({
                ...newSupplierData,
                type: 'proveedor',
                status: 'active'
            });

            if (result.success && result.contact) {
                toast({
                    title: "Proveedor Creado",
                    description: "El nuevo proveedor ha sido añadido y seleccionado.",
                });
                await fetchData();
                setSubModalData(prev => ({ ...prev, supplierId: result.contact!.id }));
                setIsCreateSupplierOpen(false);
                setNewSupplierData({ name: '', company: '', nit: '', phone: '' });
            } else {
                throw new Error(result.error || 'No se pudo crear el proveedor.');
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsCreatingSupplier(false);
        }
    };

    const getBadgeVariant = (type: string) => {
        switch (type) {
            case 'Material': return 'default';
            case 'Mano de Obra': return 'secondary';
            case 'Equipo': return 'outline';
            default: return 'default';
        }
    };

    if (!isMounted) return null;

    if (loading && supplies.length === 0) {
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
                        <Box className="h-8 w-8 text-primary" /> Insumos
                    </h1>
                    <p className="text-muted-foreground mt-1">Catálogo maestro de materiales, mano de obra y equipos.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between  p-4 rounded-xl border border-muted/50 bg-card">
                <div className="relative w-full lg:max-w-md bg-card">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por descripción, tipo o tag..."
                        className="pl-10 h-10 bg-card border-accent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <Tabs value={activeTab} className="w-full lg:w-auto" onValueChange={setActiveTab}>
                        <TabsList className="bg-background/50 border border-muted/50">
                            <TabsTrigger value="all">Todos</TabsTrigger>
                            <TabsTrigger value="Material">Materiales</TabsTrigger>
                            <TabsTrigger value="Mano de Obra">Mano de obra</TabsTrigger>
                            <TabsTrigger value="Equipo">Equipos</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex items-center gap-2">
                    <ImportExportSupplies currentData={filteredSupplies} dbUnits={dbUnits} />
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/50 text-background font-black text-[10px] uppercase tracking-widest px-6 h-11 cursor-pointer ">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Insumo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-150 bg-card border-muted/50 shadow-2xl p-0 overflow-hidden sm:max-h-[90vh] overflow-y-auto">
                            <form onSubmit={editingSupply ? handleUpdate : handleSubmit} className="flex flex-col">
                                <DialogHeader className="p-6 border-b border-accent">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                            <Box className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                                                {editingSupply ? 'Editar Insumo' : 'Crear Nuevo Insumo'}
                                            </DialogTitle>
                                            <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                                Información técnica y económica del recurso.
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="px-6 py-4 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="typology" className="text-[10px] font-bold uppercase text-muted-foreground">Tipología</Label>
                                            <Select value={formData.typology} onValueChange={(val) => handleSelectChange('typology', val)}>
                                                <SelectTrigger className="bg-background/50 w-full h-11 uppercase font-bold text-xs">
                                                    <SelectValue placeholder="Seleccione tipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {typologies.map(t => <SelectItem key={t} value={t} className="uppercase text-xs font-bold">{t}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="unit" className="text-[10px] font-bold uppercase text-muted-foreground">Unidad</Label>
                                            <Select value={formData.unit} onValueChange={(val) => handleSelectChange('unit', val)}>
                                                <SelectTrigger className="bg-background/50 w-full h-11 uppercase font-bold text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {dbUnits.map(u => <SelectItem key={u.id} value={u.abbreviation} className="uppercase text-xs font-bold">{u.abbreviation}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-[10px] font-bold uppercase text-muted-foreground">Descripción</Label>
                                        <Input id="description" value={formData.description} onChange={handleInputChange} className="h-11 bg-background/50 uppercase text-xs font-bold" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price" className="text-[10px] font-bold uppercase text-muted-foreground">Precio Base Sugerido</Label>
                                        <Input id="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} className="h-11 bg-background/50 font-mono text-primary font-bold" required />
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <History className="h-4 w-4 text-muted-foreground" />
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Precios de Proveedores</Label>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={handleOpenSubModal} className="h-8 text-[9px] font-bold uppercase border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer">
                                                <Plus className="h-3 w-3 mr-1" /> Vincular Nuevo Precio
                                            </Button>
                                        </div>

                                        {editingSupply ? (
                                            <div className="border border-accent/5 rounded-xl overflow-hidden ">
                                                <ScrollArea className={cn("w-full", (editingSupply.costs?.length || 0) > 3 ? "h-48" : "h-auto")}>
                                                    <Table>
                                                        <TableBody>
                                                            {editingSupply.costs && editingSupply.costs.length > 0 ? (
                                                                editingSupply.costs.map((cost) => (
                                                                    <TableRow key={cost.id} className="border-accent/5 hover:bg-accent/5 transition-colors group">
                                                                        <TableCell className="py-3 pl-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-1.5 bg-accent/5 rounded border border-accent/10">
                                                                                    <Building2 className="h-3.5 w-3.5 text-primary" />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[11px] font-bold text-primary uppercase">{cost.supplier?.company || cost.supplier?.name}</p>
                                                                                    <p className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
                                                                                        <Calendar className="h-2 w-2" /> {cost.date}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-right font-mono font-black text-xs text-emerald-500">
                                                                            ${cost.price.toFixed(2)}
                                                                        </TableCell>
                                                                        <TableCell className="text-right pr-4">
                                                                            <div className="flex items-center justify-end gap-1">
                                                                                {cost.isPreferred && (
                                                                                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 mr-2" />
                                                                                )}
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                    onClick={() => handleDeleteCost(cost.id)}
                                                                                >
                                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            ) : (
                                                                <TableRow>
                                                                    <TableCell className="text-center py-10 text-[10px] text-muted-foreground uppercase tracking-widest italic opacity-30">
                                                                        Sin historial de precios
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </ScrollArea>
                                            </div>
                                        ) : (
                                            formData.supplierId !== 'none' ? (
                                                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Building2 className="h-4 w-4 text-primary" />
                                                        <div>
                                                            <p className="text-xs font-bold text-primary uppercase">{suppliers.find(s => s.id === formData.supplierId)?.company || 'Proveedor'}</p>
                                                            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">${formData.supplierPrice} • {formData.supplierPriceDate}</p>
                                                        </div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFormData(prev => ({ ...prev, supplierId: 'none' }))}>
                                                        <X className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 border border-dashed border-white/10 rounded-xl bg-white/1 gap-2">
                                                    <Info className="h-5 w-5 text-muted-foreground/30" />
                                                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">No se ha vinculado un precio de proveedor inicial.</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                                <DialogFooter className="p-6  border-t border-accent gap-3 items-center">
                                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary cursor-pointer">Cancelar</Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary/40 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11 cursor-pointer" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        {editingSupply ? 'Guardar Cambios' : 'Guardar Insumo'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {filteredSupplies.length > 0 ? (
                <Card className="border-muted/50 overflow-hidden bg-card backdrop-blur-sm p-0 min-h-[60vh]">
                    <ScrollArea className='h-[600px]'>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="py-4 px-6 w-24 text-[12px] font-black uppercase tracking-widest text-muted-foreground">ID</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Tipología</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Descripción</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground text-center">Unidad</TableHead>
                                        <TableHead className="text-right text-[12px] font-black uppercase tracking-widest text-muted-foreground">P. Sugerido</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Proveedor</TableHead>
                                        <TableHead className="text-right px-6 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {filteredSupplies.map((supply) => {
                                        const preferredCost = supply.costs?.find(c => c.isPreferred) || supply.costs?.[0];

                                        return (
                                            <TableRow key={supply.id} className="hover:bg-muted/20 transition-colors border-muted/50 group">
                                                <TableCell className="px-6">
                                                    <span className="text-[12px] font-mono text-muted-foreground/60 uppercase">
                                                        {supply.id.slice(-6)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getBadgeVariant(supply.typology)} className="text-[9px] font-black uppercase tracking-widest py-0.5">
                                                        {supply.typology}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm font-bold text-primary uppercase">{supply.description}</TableCell>
                                                <TableCell className="text-muted-foreground uppercase font-black text-[12px] text-center">{supply.unit}</TableCell>
                                                <TableCell className="text-right font-mono font-bold text-muted-foreground text-sm">
                                                    ${(supply.price ?? 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {preferredCost ? (
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs font-bold text-primary uppercase">{preferredCost.supplier?.company || preferredCost.supplier?.name}</span>
                                                                {preferredCost.isPreferred && <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />}
                                                            </div>
                                                            <span className="text-[10px] font-mono font-black text-primary uppercase">
                                                                ${preferredCost.price.toFixed(2)} • {preferredCost.date}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-widest italic">Sin registros</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 cursor-pointer">
                                                                <MoreVertical name='more-options' className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-card border-muted/50 text-primary shadow-lg">
                                                            <DropdownMenuItem onClick={() => handleEditClick(supply)} className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-tighter">
                                                                <Edit className="h-3.5 w-3.5 text-primary" /> Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 text-xs font-bold uppercase tracking-tighter focus:text-destructive"
                                                                onClick={() => handleDelete(supply.id)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 text-destructive" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <ScrollBar orientation="vertical" />
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20">
                    <Box className="h-16 w-16 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No se encontraron insumos registrados.</p>
                </div>
            )}

            {/* Sub-Dialog: Gestionar Precio Proveedor */}
            <Dialog open={isSubModalOpen} onOpenChange={setIsSubModalOpen}>
                <DialogContent className="sm:max-w-125 bg-card border-muted/50 shadow-2xl p-0 overflow-hidden">
                    <div className="flex flex-col">
                        <DialogHeader className="p-6  border-b border-accent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                    <UserStar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold uppercase tracking-tight">Vincular Precio de Proveedor</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                        Registre una cotización específica para este insumo.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seleccionar Proveedor</Label>
                                    <Button
                                        type="button"
                                        variant="default"
                                        size="sm"
                                        className="h-8 w-fit px-4 text-background text-[10px] font-bold cursor-pointer bg-primary hover:bg-primary/40"
                                        onClick={() => setIsCreateSupplierOpen(true)}>
                                        <Plus className="h-3 w-3 mr-1" /> Nuevo Proveedor
                                    </Button>
                                </div>
                                <Select value={subModalData.supplierId} onValueChange={(v) => setSubModalData(p => ({ ...p, supplierId: v }))}>
                                    <SelectTrigger className="bg-background/50 border-muted/50 h-12 text-sm w-full uppercase font-bold">
                                        <SelectValue placeholder="Busque un proveedor..." />
                                    </SelectTrigger>
                                    <SelectContent className='bg-card'>
                                        <SelectItem value="none" className="text-[10px] uppercase font-bold text-muted-foreground">Seleccionar...</SelectItem>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id} className="text-xs uppercase font-bold">
                                                {s.company || s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Precio Unitario (USD)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={subModalData.price}
                                        onChange={(e) => setSubModalData(p => ({ ...p, price: e.target.value }))}
                                        className="h-12 bg-background/50 border-muted/50 font-mono text-emerald-500 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha Vigencia</Label>
                                    <Input
                                        type="date"
                                        value={subModalData.date}
                                        onChange={(e) => setSubModalData(p => ({ ...p, date: e.target.value }))}
                                        className="h-12 bg-background/50 border-muted/50 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
                                <input
                                    type="checkbox"
                                    id="isPreferred"
                                    checked={subModalData.isPreferred}
                                    onChange={(e) => setSubModalData(p => ({ ...p, isPreferred: e.target.checked }))}
                                    className="h-4 w-4 accent-primary"
                                />
                                <Label htmlFor="isPreferred" className="text-[9px] font-bold uppercase cursor-pointer">Marcar como precio preferido para APU</Label>
                            </div>
                        </div>
                        <DialogFooter className="p-6 border-t border-accent gap-3 items-center">
                            <Button variant="ghost" onClick={() => setIsSubModalOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary cursor-pointer">
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveSubModal} className="bg-secondary hover:bg-muted/40 text-primary font-black text-[10px] uppercase tracking-widest px-8 h-11 cursor-pointer">
                                <Check className="mr-2 h-4 w-4" /> Confirmar Precio
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isCreateSupplierOpen} onOpenChange={setIsCreateSupplierOpen}>
                <DialogContent className="sm:max-w-112.5 bg-card border-muted/50 shadow-2xl p-0 overflow-hidden">
                    <form onSubmit={handleCreateSupplier}>
                        <DialogHeader className="p-6 border-b border-accent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <UserPlus className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold uppercase tracking-tight">Nuevo Proveedor</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Registra un nuevo proveedor en tu lista de contactos.</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Razón Social (Empresa)</Label>
                                <Input
                                    value={newSupplierData.company}
                                    onChange={(e) => setNewSupplierData(p => ({ ...p, company: e.target.value }))}
                                    className="h-11 bg-card border-accent uppercase text-xs font-bold"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre de Contacto</Label>
                                <Input
                                    value={newSupplierData.name}
                                    onChange={(e) => setNewSupplierData(p => ({ ...p, name: e.target.value }))}
                                    className="h-11 bg-card border-accent uppercase text-xs font-bold"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">NIT / C.I.</Label>
                                    <Input
                                        value={newSupplierData.nit}
                                        onChange={(e) => setNewSupplierData(p => ({ ...p, nit: e.target.value }))}
                                        className="h-11 bg-card border-accent font-mono"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Teléfono</Label>
                                    <Input
                                        value={newSupplierData.phone}
                                        onChange={(e) => setNewSupplierData(p => ({ ...p, phone: e.target.value }))}
                                        className="h-11 bg-card border-accent font-mono"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="p-6 border-t border-accent gap-3 items-center">
                            <Button type="button" variant="ghost" onClick={() => setIsCreateSupplierOpen(false)} disabled={isCreatingSupplier} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary cursor-pointer">Cancelar</Button>
                            <Button type="submit" disabled={isCreatingSupplier} className="bg-primary hover:bg-primary/40 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11  cursor-pointer">
                                {isCreatingSupplier ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Crear Proveedor
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
