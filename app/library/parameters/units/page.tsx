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
    Ruler,
    Search,
    Plus,
    MoreVertical,
    Loader2,
    Edit,
    Trash2,
    Save
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../../components/ui/dropdown-menu';
import { Label } from '../../../../components/ui/label';
import { useToast } from '../../../../hooks/use-toast';
import { UnitOfMeasure } from '../../../../types/types';
import { useAuth } from '../../../../hooks/use-auth';
import {
    getUnits,
    createUnit,
    updateUnit,
    deleteUnit
} from '@/actions';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../../../../components/ui/select';
import { ScrollArea } from '../../../../components/ui/scroll-area';


const magnitudes = ["Longitud", "Masa", "Volumen", "Cantidad", "Global", "Superficie", "Densidad", "Velocidad", "Aceleracion", "Fuerza", "Presion", "Temperatura", "Energia", "Potencia", "Flujo", "Viscosidad", "Tension", "Tasa de Cambio", "Tiempo"];

export default function UnitsPage() {
    const { user } = useAuth();
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        abbreviation: '',
        magnitude: ''
    });

    useEffect(() => {
        setIsMounted(true);
        if (user?.id) {
            fetchData();
        }
    }, [user?.id]);

    const fetchData = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const data = await getUnits(user.id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setUnits(data as any);
        } catch (error) {
            console.error('Error fetching units:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar las unidades de medida.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredUnits = units.filter(unit =>
        unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.magnitude.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        if (id === 'abbreviation') {
            const trimmed = value.slice(0, 4);
            setFormData(prev => ({ ...prev, [id]: trimmed }));
            return;
        }
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, magnitude: value }));
    };

    const resetForm = () => {
        setFormData({ name: '', abbreviation: '', magnitude: '' });
        setEditingUnit(null);
    };

    const handleEditClick = (unit: UnitOfMeasure) => {
        setEditingUnit(unit);
        setFormData({
            name: unit.name,
            abbreviation: unit.abbreviation,
            magnitude: unit.magnitude
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;
        setIsSubmitting(true);

        const result = editingUnit
            ? await updateUnit(editingUnit.id, formData)
            : await createUnit({ ...formData, userId: user.id });

        if (result.success) {
            toast({
                title: editingUnit ? "Unidad actualizada" : "Unidad creada",
                description: editingUnit ? "Los cambios han sido guardados." : "La nueva unidad ha sido añadida.",
            });
            fetchData();
            setIsDialogOpen(false);
            resetForm();
        } else {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        }
        setIsSubmitting(false);
    };

    const handleDeleteUnit = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta unidad?')) return;
        const result = await deleteUnit(id);
        if (result.success) {
            toast({
                title: "Unidad eliminada",
                description: "La unidad de medida ha sido removida del catálogo.",
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

    if (!isMounted) return null;

    if (loading) {
        return (
            <div className="container mx-auto p-8 flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Sincronizando...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card w-fit">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3 text-foreground">
                        <Ruler className="h-8 w-8 text-primary" /> Unidades de Medida
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestión de unidades para el sistema.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-muted/50 backdrop-blur-sm">
                <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, abreviación o magnitud..."
                        className="pl-10 h-11 bg-background/50 border-muted/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/40 text-background font-black text-[10px] uppercase tracking-widest px-6 h-11 cursor-pointer">
                                <Plus className="mr-2 h-4 w-4" /> Nueva Unidad
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-125 bg-card border-muted/50 shadow-2xl p-0 overflow-hidden">
                            <form onSubmit={handleSubmit} className="flex flex-col">
                                <DialogHeader className="p-6 border-b border-accent">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                            <Ruler className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                                                {editingUnit ? 'Editar Unidad' : 'Nueva Unidad de Medida'}
                                            </DialogTitle>
                                            <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                                Registrar parámetros de medición para el catálogo
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="px-6 py-6 space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-[10px] font-bold uppercase text-muted-foreground">Nombre de la Unidad</Label>
                                        <Input id="name" value={formData.name} onChange={handleInputChange} className="h-11 bg-background/50" placeholder="Ej: Metro, Litro, Kilogramo..." required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="abbreviation" className="text-[10px] font-bold uppercase text-muted-foreground">Abreviación</Label>
                                            <Input id="abbreviation" value={formData.abbreviation} onChange={handleInputChange} className="h-11 bg-background/50 font-mono" placeholder="Ej: m, l, kg..." maxLength={4} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="magnitude" className="text-[10px] font-bold uppercase text-muted-foreground">Magnitud Física</Label>
                                            <Select value={formData.magnitude} onValueChange={handleSelectChange} required>
                                                <SelectTrigger className="bg-background/50 w-full h-11">
                                                    <SelectValue placeholder="Seleccione magnitud..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card">
                                                    {magnitudes.map((mag) => (
                                                        <SelectItem key={mag} value={mag} className="text-xs uppercase font-bold">{mag}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="p-6 border-t border-accent gap-3 items-center">
                                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary cursor-pointer">Cancelar</Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary/40 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11 cursor-pointer" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        {editingUnit ? 'Guardar Cambios' : 'Guardar Unidad'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {filteredUnits.length > 0 ? (
                <Card className="border-muted/50 overflow-hidden bg-card p-0 min-h-[60vh]">
                    <ScrollArea className='h-150'>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="py-4 px-8 text-[12px] font-black uppercase text-muted-foreground">Unidad Medida</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase text-muted-foreground">Abreviación</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase text-muted-foreground">Magnitud</TableHead>
                                        <TableHead className="text-right px-6 text-[12px] font-black uppercase text-muted-foreground">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUnits.map((unit) => (
                                        <TableRow key={unit.id} className="hover:bg-muted/20 transition-colors border-muted/50 group">
                                            <TableCell className="font-semibold text-primary px-8 py-4 uppercase text-xs tracking-tight">
                                                {unit.name}
                                            </TableCell>
                                            <TableCell className="font-mono text-primary font-bold text-xs">
                                                {unit.abbreviation}
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-full border border-primary/20 px-2.5 py-0.5 text-[9px] font-black bg-primary/10 text-primary uppercase tracking-widest">
                                                    {unit.magnitude}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 cursor-pointer">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-card border-muted/50 text-primary shadow-lg">
                                                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-tighter" onClick={() => handleEditClick(unit)}>
                                                            <Edit className="h-3.5 w-3.5 text-primary" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 text-xs font-bold uppercase tracking-tighter focus:text-destructive"
                                                            onClick={() => handleDeleteUnit(unit.id)}
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
                        </CardContent>
                    </ScrollArea>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20">
                    <Ruler className="h-16 w-16 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No se encontraron unidades registradas.</p>
                </div>
            )}
        </div>
    );
}
