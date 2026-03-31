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
    Layers,
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
import { Chapter } from '../../../../types/types';
import { useAuth } from '../../../../hooks/use-auth';
import {
    getChapters,
    createChapter,
    updateChapter,
    deleteChapter
} from './actions';
import { ScrollArea } from '../../../../components/ui/scroll-area';

export default function ChaptersPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const [chapterName, setChapterName] = useState('');

    useEffect(() => {
        setIsMounted(true);
        if (user?.id) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const fetchData = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const data = await getChapters(user.id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setChapters(data as any);
        } catch (error) {
            console.error('Error fetching chapters:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los capítulos.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredChapters = chapters.filter(chapter =>
        chapter.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;
        setIsSubmitting(true);

        const result = await createChapter({
            name: chapterName,
            userId: user.id
        });

        if (result.success) {
            toast({
                title: "Capítulo creado",
                description: "El nuevo capítulo ha sido añadido exitosamente.",
            });
            fetchData();
            setIsDialogOpen(false);
            setChapterName('');
        } else {
            toast({
                title: "No se pudo crear!",
                description: result.error,
                variant: "destructive",
            });
        }
        setIsSubmitting(false);
    };

    const handleEditClick = (chapter: Chapter) => {
        setEditingChapterId(chapter.id);
        setChapterName(chapter.name);
        setIsEditOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingChapterId) return;
        setIsSubmitting(true);

        const result = await updateChapter(editingChapterId, { name: chapterName });

        if (result.success) {
            toast({
                title: "Capítulo actualizado",
                description: "Los cambios han sido guardados correctamente.",
            });
            fetchData();
            setIsEditOpen(false);
            setChapterName('');
            setEditingChapterId(null);
        } else {
            toast({
                title: "No se pudo actualizar!",
                description: result.error,
                variant: "destructive",
            });
        }
        setIsSubmitting(false);
    };

    const handleDeleteChapter = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este capítulo?')) return;
        const result = await deleteChapter(id);
        if (result.success) {
            toast({
                title: "Capítulo eliminado!",
                description: "El capítulo ha sido removido del catálogo.",
                variant: "destructive",
            });
            fetchData();
        } else {
            toast({
                title: "No se puede eliminar!",
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
                        <Layers className="h-8 w-8 text-primary" /> Capítulos
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestión de la estructura de capítulos para el presupuesto y control de obra.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-muted/50 backdrop-blur-sm">
                <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre de capítulo..."
                        className="pl-10  h-10 bg-background/50 border-muted/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setChapterName('');
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/40 text-background font-black text-[10px] uppercase tracking-widest px-6 h-11 cursor-pointer ">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Capítulo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-106.25 bg-card border-muted/50 shadow-2xl p-0 overflow-hidden">
                        <form onSubmit={handleSubmit} className="flex flex-col">
                            <DialogHeader className="p-4  border-b border-accent">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                        <Layers className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-bold uppercase tracking-tight">Nuevo Capítulo</DialogTitle>
                                        <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                            Añadir estructura al catálogo
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="px-6 py-8 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-bold uppercase text-muted-foreground">Nombre del Capítulo</Label>
                                    <Input
                                        id="name"
                                        value={chapterName}
                                        onChange={(e) => setChapterName(e.target.value)}
                                        className="h-11 bg-background/50 uppercase text-xs font-bold"
                                        placeholder="Ej: Estructuras"
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter className="p-4 border-t border-accent gap-3 items-center">
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary cursor-pointer">
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-primary hover:bg-primary/40 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11 cursor-pointer " disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Guardar Capítulo
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {filteredChapters.length > 0 ? (
                <Card className="border-muted/50 overflow-hidden bg-card p-0 min-h-[60vh]">
                    <ScrollArea className='h-150 w-auto'>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="py-4 px-8 text-[12px] font-black uppercase text-muted-foreground">Capítulo</TableHead>
                                        <TableHead className="text-right px-6 text-[12px] font-black uppercase text-muted-foreground">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>

                                    {filteredChapters.map((chapter) => (
                                        <TableRow key={chapter.id} className="hover:bg-muted/20 transition-colors border-accent group">
                                            <TableCell className="font-semibold text-primary px-8 py-4 uppercase text-xs tracking-tight ">
                                                {chapter.name}
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 cursor-pointer">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-card border-muted/50 text-primary">
                                                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-tighter" onClick={() => handleEditClick(chapter)}>
                                                            <Edit className="h-3.5 w-3.5 text-primary" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 text-xs font-bold uppercase tracking-tighter focus:text-destructive"
                                                            onClick={() => handleDeleteChapter(chapter.id)}
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
                    <Layers className="h-16 w-16 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No se encontraron capítulos registrados.</p>
                </div>
            )}

            <Dialog open={isEditOpen} onOpenChange={(open) => {
                setIsEditOpen(open);
                if (!open) {
                    setChapterName('');
                    setEditingChapterId(null);
                }
            }}>
                <DialogContent className="sm:max-w-106 bg-card border-muted/50  p-0 overflow-hidden">
                    <form onSubmit={handleUpdate} className="flex flex-col">
                        <DialogHeader className="p-6  border-b border-accent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                    <Edit className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold uppercase tracking-tight">Editar Capítulo</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                        Modificar estructura del catálogo
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="px-6 py-8 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name" className="text-[10px] font-bold uppercase text-muted-foreground">Nombre del Capítulo</Label>
                                <Input
                                    id="edit-name"
                                    value={chapterName}
                                    onChange={(e) => setChapterName(e.target.value)}
                                    className="h-11 bg-background/50 uppercase text-xs font-bold"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter className="p-4  border-t border-accent gap-3 items-center">
                            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isSubmitting} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary cursor-pointer">
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/40 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11 cursor-pointer" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
