"use client";

import { useState, useEffect } from 'react';
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
    Truck,
    Search,
    Plus,
    MoreVertical,
    Trash2,
    Edit,
    Loader2,
    Save,
    MapPin,
    CheckCircle2,
    Wrench,
    XCircle,
    Drill
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
import { FixedAsset, AssetStatus } from '../../../../lib/types';
import { useToast } from '../../../../hooks/use-toast';
import { useAuth } from '../../../../hooks/use-auth';
import { getAssets, createAsset, updateAsset, deleteAsset } from './actions';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { cn } from '../../../../lib/utils';
import { ScrollArea } from '../../../../components/ui/scroll-area';

export default function AssetsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('all');
    const [assets, setAssets] = useState<FixedAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        brand: '',
        model: '',
        serialNumber: '',
        purchasePrice: '0',
        purchaseDate: new Date().toISOString().split('T')[0],
        location: '',
        status: 'disponible' as AssetStatus
    });

    useEffect(() => {
        setIsMounted(true);
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getAssets();
            setAssets(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los activos fijos.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (asset.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || asset.status === activeTab;
        return matchesSearch && matchesTab;
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            brand: '',
            model: '',
            serialNumber: '',
            purchasePrice: '0',
            purchaseDate: new Date().toISOString().split('T')[0],
            location: '',
            status: 'disponible'
        });
        setEditingAsset(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            name: formData.name,
            code: formData.code,
            brand: formData.brand,
            model: formData.model,
            serialNumber: formData.serialNumber,
            purchasePrice: parseFloat(formData.purchasePrice) || 0,
            purchaseDate: formData.purchaseDate,
            location: formData.location,
            status: formData.status
        };

        try {
            const result = editingAsset
                ? await updateAsset(editingAsset.id, payload)
                : await createAsset(payload);

            if (result.success) {
                toast({
                    title: editingAsset ? "Activo actualizado" : "Activo creado",
                    description: `El activo fijo ha sido ${editingAsset ? 'actualizado' : 'registrado'} exitosamente.`,
                });
                await fetchData();
                setIsDialogOpen(false);
                resetForm();
            } else {
                toast({
                    title: "Error",
                    description: (result as any).error,
                    variant: "destructive",
                });
            }
        } catch (err) {
            toast({
                title: "Error técnico",
                description: "No se pudo procesar la solicitud al servidor.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (asset: FixedAsset) => {
        setEditingAsset(asset);
        setFormData({
            name: asset.name,
            code: asset.code,
            brand: asset.brand || '',
            model: asset.model || '',
            serialNumber: asset.serialNumber || '',
            purchasePrice: asset.purchasePrice.toString(),
            purchaseDate: asset.purchaseDate,
            location: asset.location || '',
            status: asset.status
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este activo fijo del catálogo?')) return;

        const result = await deleteAsset(id);
        if (result.success) {
            toast({
                title: "Activo eliminado",
                description: "El activo ha sido removido del catálogo maestro.",
                variant: "destructive",
            });
            fetchData();
        } else {
            toast({
                title: "Error",
                description: (result as any).error,
                variant: "destructive",
            });
        }
    };

    const getStatusIcon = (status: AssetStatus) => {
        switch (status) {
            case 'disponible': return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
            case 'en_uso': return <Truck className="h-3 w-3 text-primary" />;
            case 'mantenimiento': return <Wrench className="h-3 w-3 text-amber-500" />;
            case 'baja': return <XCircle className="h-3 w-3 text-destructive" />;
        }
    };

    const getStatusBadge = (status: AssetStatus) => {
        switch (status) {
            case 'disponible': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case 'en_uso': return "bg-primary/10 text-primary border-primary/20";
            case 'mantenimiento': return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case 'baja': return "bg-destructive/10 text-destructive border-destructive/20";
        }
    };

    if (!isMounted) return null;

    if (loading && assets.length === 0) {
        return (
            <div className="container mx-auto p-8 flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Sincronizando Activos...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card w-fit">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3 text-foreground">
                        <Drill className="h-8 w-8 text-primary" /> Activos Fijos
                    </h1>
                    <p className="text-muted-foreground mt-1 S tracking-widest ">Control de maquinaria, herramientas y equipos de obra.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-accent ">
                <div className="relative w-full lg:max-w-md bg-card">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, activo o marca..."
                        className="pl-10 h-10 bg-background/50 border-muted/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <Tabs value={activeTab} className="w-full lg:w-auto" onValueChange={setActiveTab}>
                        <TabsList className="bg-background/50 border border-muted/50">
                            <TabsTrigger value="all" className="text-[10px] font-black uppercase data-[state=active]:bg-card data-[state=active]:text-primary">Todos</TabsTrigger>
                            <TabsTrigger value="disponible" className="text-[10px] font-black uppercase data-[state=active]:bg-card data-[state=active]:text-primary">Disponibles</TabsTrigger>
                            <TabsTrigger value="en_uso" className="text-[10px] font-black uppercase data-[state=active]:bg-card data-[state=active]:text-primary">En Uso</TabsTrigger>
                            <TabsTrigger value="mantenimiento" className="text-[10px] font-black uppercase data-[state=active]:bg-card data-[state=active]:text-primary">Mantenimiento</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex items-center gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/20 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11 cursor-pointer">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Activo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-card border-accent text-primary p-0 overflow-hidden shadow-2xl">
                            <form onSubmit={handleSubmit} className="flex flex-col">
                                <DialogHeader className="p-6 border-b border-accent">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                            <Drill className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                                                {editingAsset ? 'Editar Activo Fijo' : 'Registrar Nuevo Activo'}
                                            </DialogTitle>
                                            <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                                Información técnica y contable del equipo de obra
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="px-6 py-6 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del Equipo</Label>
                                            <Input id="name" value={formData.name} onChange={handleInputChange} className="h-11 uppercase text-xs font-bold" placeholder="Ej: Retroexcavadora" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="code" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Código Interno</Label>
                                            <Input id="code" value={formData.code} onChange={handleInputChange} className="h-11 font-mono text-xs font-bold text-primary uppercase" placeholder="Ej: MAQ-001" required />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="brand" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Marca</Label>
                                            <Input id="brand" value={formData.brand} onChange={handleInputChange} className="h-11 uppercase text-xs" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="model" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Modelo</Label>
                                            <Input id="model" value={formData.model} onChange={handleInputChange} className="h-11 uppercase text-xs" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="serialNumber" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">N° Serie</Label>
                                            <Input id="serialNumber" value={formData.serialNumber} onChange={handleInputChange} className="h-11 font-mono text-xs" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="purchasePrice" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Precio Compra (USD)</Label>
                                            <Input id="purchasePrice" type="number" step="0.01" value={formData.purchasePrice} onChange={handleInputChange} className="h-11 font-mono text-xs font-bold text-emerald-500" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="purchaseDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha Adquisición</Label>
                                            <Input id="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleInputChange} className="h-11 text-xs" required />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ubicación Actual</Label>
                                            <Input id="location" value={formData.location} onChange={handleInputChange} className="h-11 uppercase text-xs" placeholder="Ej: Almacén Central" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado Operativo</Label>
                                            <Select value={formData.status} onValueChange={(val: any) => handleSelectChange('status', val)}>
                                                <SelectTrigger className="h-11 text-[10px] font-black uppercase w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-white/10 text-primary">
                                                    <SelectItem value="disponible" className="text-[10px] font-black uppercase">Disponible</SelectItem>
                                                    <SelectItem value="en_uso" className="text-[10px] font-black uppercase">En Uso</SelectItem>
                                                    <SelectItem value="mantenimiento" className="text-[10px] font-black uppercase">Mantenimiento</SelectItem>
                                                    <SelectItem value="baja" className="text-[10px] font-black uppercase">Baja de Activo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="p-6 border-t border-accent gap-3 items-center">
                                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary cursor-pointer">Cancelar</Button>
                                    <Button type="submit" className="bg-primary hover:bg-muted/40 text-background font-black text-[10px] uppercase tracking-widest px-12 h-11 cursor-pointer " disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        {editingAsset ? 'Actualizar Activo' : 'Guardar Activo'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {filteredAssets.length > 0 ? (
                <Card className="border-accent overflow-hidden bg-card p-0 min-h-[60vh]">
                    <ScrollArea className='h-[600px]'>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="py-4 px-6 w-32 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Código</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Activo / Equipo</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Ficha Técnica</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground text-center">Estado</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground text-right">Valor Adq.</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground pr-6 text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAssets.map((asset) => (
                                        <TableRow key={asset.id} className="hover:bg-muted/40 transition-colors border-accent group ">
                                            <TableCell className="px-6 py-4">
                                                <span className="text-[11px] font-mono font-black text-primary uppercase bg-primary/5 px-2 py-1 rounded border border-primary/10">
                                                    {asset.code}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-primary uppercase">{asset.name}</span>
                                                    <span className="text-[9px] text-muted-foreground uppercase flex items-center gap-1 mt-0.5">
                                                        <MapPin className="h-2 w-2" /> {asset.location || 'No asignado'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">MARCA: {asset.brand || '-'}</span>
                                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">MODELO: {asset.model || '-'}</span>
                                                    <span className="text-[9px] font-mono text-muted-foreground/60">SN: {asset.serialNumber || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className={cn("text-[12px] font-black uppercase tracking-widest px-2.5 py-0.5 border-white/10 gap-1.5", getStatusBadge(asset.status))}>
                                                    {getStatusIcon(asset.status)}
                                                    {asset.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-black text-emerald-500 text-xs">
                                                ${asset.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 cursor-pointer">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-card border-white/10 text-primary shadow-lg p-1.5 rounded-xl">
                                                        <DropdownMenuItem onClick={() => handleEditClick(asset)} className="flex items-center gap-2 cursor-pointer text-[10px] font-black uppercase tracking-tighter rounded-lg focus:bg-primary/10 focus:text-primary">
                                                            <Edit className="h-3.5 w-3.5" /> Editar Activo
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 text-[10px] font-black uppercase tracking-tighter rounded-lg mt-1 focus:text-destructive "
                                                            onClick={() => handleDelete(asset.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 text-destructive" /> Dar de Baja
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </ScrollArea>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20">
                    <Drill className="h-16 w-16 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay activos fijos registrados en el catálogo.</p>
                </div>
            )}
        </div>
    );
}
