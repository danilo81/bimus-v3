"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreateProjectData, Project } from '../../lib/types';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, LayoutGrid, List, Search, MoreVertical, Loader2, Building2, ChevronRight, MapPin, Ruler, Trash2, ArrowRight, UserPlus, Calendar, Mail, Send } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../../components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '../../components/ui/dialog';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import { useToast } from '../../hooks/use-toast';
import { createProject, deleteProject, getProjects, inviteCollaborator, leaveProject } from './actions';
import { useAuth } from '../../hooks/use-auth';
import { cn } from '../../lib/utils';

export default function ProjectsPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto p-8 flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Sincronizando...</span>
            </div>
        }>
            <ProjectsPageContent />
        </Suspense>
    );
}

function ProjectsPageContent() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedProjectForInvite, setSelectedProjectForInvite] = useState<Project | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams?.get('access') === 'denied') {
            toast({ variant: 'destructive', title: 'Acceso Denegado', description: 'No tienes permiso para acceder a ese proyecto.' });
        }
    }, [searchParams, toast]);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        client: '',
        location: '',
        projectType: 'residencial',
        area: '',
        status: 'activo' as 'activo' | 'espera' | 'finalizado' | 'construccion',
        imageUrl: 'https://picsum.photos/seed/project/800/600'
    });

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const userProjects = await getProjects();
            setProjects(userProjects as any);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        fetchProjects();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const dataToSubmit: CreateProjectData = {
                title: formData.title,
                description: formData.description,
                client: formData.client,
                location: formData.location,
                projectType: formData.projectType,
                area: parseFloat(formData.area) || 0,
                status: formData.status as any,
                imageUrl: formData.imageUrl
            };

            const result = await createProject(dataToSubmit);

            if (result && 'error' in result) {
                toast({
                    variant: "destructive",
                    title: "Fallo en la creación",
                    description: String(result.error),
                });
            } else if (result.success && result.project) {
                await fetchProjects();
                setIsCreateModalOpen(false);
                setFormData({
                    title: '',
                    description: '',
                    client: '',
                    location: '',
                    projectType: 'residencial',
                    area: '',
                    status: 'activo',
                    imageUrl: 'https://picsum.photos/seed/project/800/600'
                });
                toast({
                    title: "Proyecto creado",
                    description: "El nuevo proyecto ha sido registrado exitosamente.",
                });
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error inesperado",
                description: error.message || "Ocurrió un fallo al intentar registrar el proyecto.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProjectForInvite || !inviteEmail) return;
        setIsSubmitting(true);

        try {
            const result = await inviteCollaborator(selectedProjectForInvite.id, inviteEmail);
            if (result.success) {
                toast({
                    title: "Invitación enviada",
                    description: `Se ha enviado una solicitud de colaboración a ${inviteEmail}.`,
                });
                setIsInviteModalOpen(false);
                setInviteEmail('');
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error al invitar",
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Deseas eliminar este proyecto permanentemente?')) return;

        const originalProjects = [...projects];
        setProjects(prev => prev.filter(p => p.id !== id));

        try {
            const result = await deleteProject(id);

            if (result && 'error' in result) {
                setProjects(originalProjects);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: String(result.error),
                });
            } else {
                toast({ title: "Proyecto eliminado", variant: "destructive" });
            }
        } catch (error) {
            setProjects(originalProjects);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo eliminar el proyecto.",
            });
        }
    };

    const handleLeave = async (id: string) => {
        if (!confirm('¿Estás seguro que deseas abandonar este proyecto? Dejarás de tener acceso a él.')) return;

        const originalProjects = [...projects];
        setProjects(prev => prev.filter(p => p.id !== id));

        try {
            const result = await leaveProject(id);

            if (result && 'error' in result) {
                setProjects(originalProjects);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: String(result.error),
                });
            } else {
                toast({ title: "Has abandonado el proyecto exitosamente" });
            }
        } catch (error) {
            setProjects(originalProjects);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo abandonar el proyecto.",
            });
        }
    };

    if (!isMounted) return null;

    if (loading && projects.length === 0) {
        return (
            <div className="container mx-auto p-8 flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Sincronizando...</span>
            </div>
        );
    }

    const ProjectListView = () => (
        <Card className="bg-card border-accent overflow-hidden p-0  ">
            <CardContent className="p-0 ">
                <Table>
                    <TableHeader className="bg-card">
                        <TableRow className="border-accent hover:bg-transparent">
                            <TableHead className="py-4 px-6 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Proyecto / Obra</TableHead>
                            <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Cliente</TableHead>
                            <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Ubicación</TableHead>
                            <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground text-right">Área (m²)</TableHead>
                            <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground text-center">Estado</TableHead>
                            <TableHead className="text-right px-6 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-card">
                        {projects.map((project) => (
                            <TableRow key={project.id} className="border-accent hover:bg-muted/40 transition-colors group">
                                <TableCell className="py-4 px-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg overflow-hidden border border-accent shrink-0 bg-accent ">
                                            <img src={project.imageUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/projects/${project.id}`} className="text-xs font-black text-primary uppercase group-hover:text-primary transition-colors line-clamp-1">
                                                    {project.title}
                                                </Link>
                                                {project.authorId !== user?.id && (
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase border-blue-500/20 text-blue-500 bg-blue-500/5 px-1.5 h-4">
                                                        Colaborador
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-[12px] text-muted-foreground uppercase font-bold tracking-tighter line-clamp-1 opacity-60">
                                                {project.projectType}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-[12px] font-bold text-muted-foreground uppercase">{project.client || 'N/A'}</TableCell>
                                <TableCell className="text-[12px] font-bold text-muted-foreground uppercase">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        {project.location || 'N/A'}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-[12px] font-bold text-primary">
                                    {project.area ? `${project.area.toLocaleString()} m²` : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={cn("text-[12px] font-black uppercase border-none px-2",
                                        project.status === 'activo' || project.status === 'construccion' ? 'bg-primary/10 text-primary' :
                                            project.status === 'finalizado' ? 'bg-emerald-500/10 text-emerald-500' :
                                                'bg-amber-500/10 text-amber-500'
                                    )}>
                                        {project.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right px-6">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/40 bg-transparent">
                                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-card border-white/10 text-primary shadow-2xl p-1.5 rounded-xl">
                                            <DropdownMenuItem asChild className="text-[10px] font-black uppercase tracking-widest cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg">
                                                <Link href={`/projects/${project.id}`}>
                                                    <ArrowRight className="h-3.5 w-3.5 text-primary" />Gestionar
                                                </Link>
                                            </DropdownMenuItem>
                                            {project.authorId === user?.id && (
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedProjectForInvite(project);
                                                        setIsInviteModalOpen(true);
                                                    }}
                                                    className="text-[10px] font-black uppercase tracking-widest cursor-pointer rounded-lg"
                                                >
                                                    <UserPlus className="h-3.5 w-3.5 text-primary" /> Invitar Colaborador
                                                </DropdownMenuItem>
                                            )}
                                            {project.authorId === user?.id ? (
                                                <DropdownMenuItem
                                                    className="text-[10px] font-black uppercase tracking-widest text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg mt-1"
                                                    onClick={() => handleDelete(project.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-destructive" /> Eliminar Proyecto
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem
                                                    className="text-[10px] font-black uppercase tracking-widest text-amber-500 focus:bg-amber-500/10 focus:text-amber-500 cursor-pointer rounded-lg mt-1"
                                                    onClick={() => handleLeave(project.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-amber-500" /> Abandonar Proyecto
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    const ProjectGridView = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
                <Card key={project.id} className="group bg-card overflow-hidden opacity-99 border-accent hover:border-primary/50 transition-all flex flex-col p-0 ">
                    <div className="relative aspect-video overflow-hidden border-b border-accent">
                        <Link href={`/projects/${project.id}`}>
                            <img
                                src={project.imageUrl}
                                alt={project.title}
                                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110 cursor-pointer"
                            />
                        </Link>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border-accent text-primary  p-1.5 rounded-xl">
                                    <DropdownMenuItem asChild className="text-[10px] font-black uppercase tracking-widest cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg">
                                        <Link href={`/projects/${project.id}`}> <ArrowRight className="h-3.5 w-3.5 text-primary" /> Gestionar</Link>
                                    </DropdownMenuItem>
                                    {project.authorId === user?.id && (
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setSelectedProjectForInvite(project);
                                                setIsInviteModalOpen(true);
                                            }}
                                            className="text-[10px] font-black uppercase tracking-widest cursor-pointer rounded-lg"
                                        >
                                            <UserPlus className="h-3.5 w-3.5 text-primary" /> Invitar Colaborador
                                        </DropdownMenuItem>
                                    )}
                                    {project.authorId === user?.id ? (
                                        <DropdownMenuItem
                                            className="text-[10px] font-black uppercase tracking-widest text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg mt-1"
                                            onClick={() => handleDelete(project.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-destructive" /> Eliminar Proyecto
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem
                                            className="text-[10px] font-black uppercase tracking-widest text-amber-500 focus:bg-amber-500/10 focus:text-amber-500 cursor-pointer rounded-lg mt-1"
                                            onClick={() => handleLeave(project.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-amber-500" /> Abandonar Proyecto
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        {project.authorId !== user?.id && (
                            <div className="absolute top-2 left-2">
                                <Badge variant="secondary" className="bg-blue-500/80 text-white border-none text-[10px] font-black uppercase backdrop-blur-md shadow-lg">
                                    Colaborador
                                </Badge>
                            </div>
                        )}
                    </div>

                    <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                                <Link href={`/projects/${project.id}`} className="flex-1">
                                    <h3 className="text-[20px] font-black uppercase tracking-tight text-primary group-hover:text-primary transition-colors line-clamp-1">
                                        {project.title}
                                    </h3>
                                </Link>
                                <Badge variant="outline" className={cn("text-[10px] font-black uppercase h-4 px-1.5 border-none",
                                    project.status === 'activo' || project.status === 'construccion' ? 'bg-primary/10 text-primary' :
                                        project.status === 'finalizado' ? 'bg-emerald-500/10 text-emerald-500' :
                                            'bg-amber-500/10 text-amber-500'
                                )}>
                                    {project.status}
                                </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 uppercase font-bold opacity-60">
                                {project.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cliente</span>
                                <span className="text-[16px] font-bold text-primary uppercase truncate max-w-[120px]">{project.client || 'N/A'}</span>
                            </div>
                            <Link href={`/projects/${project.id}`}>
                                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 hover:text-primary group/btn cursor-pointer">
                                    Detalles <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500 ">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card w-fit">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3 text-primary">
                        <Building2 className="h-8 w-8 text-primary" /> Mis Proyectos
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestión y supervisión de proyectos</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-accent backdrop-blur-xl">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar Proyectos..." className="pl-10 h-11 bg-card border-accent text-[10px] font-medium tracking-widest" />
                </div>

                <div className="flex items-center gap-4">
                    <Tabs value={view} onValueChange={(v: any) => setView(v)} className="w-auto">
                        <TabsList className="bg-card border border-accent p-1 rounded-xl h-11">
                            <TabsTrigger value="grid" className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest px-6 data-[state=active]:bg-card h-full">
                                <LayoutGrid className="h-3.5 w-3.5" /> Cuadrícula
                            </TabsTrigger>
                            <TabsTrigger value="list" className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest px-6 h-full data-[state=active]:bg-card">
                                <List className="h-3.5 w-3.5" /> Lista
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/40 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11 rounded-xl cursor-pointer">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Proyecto
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-card border-accent text-primary overflow-y-auto max-h-[90vh] p-0 shadow-2xl">
                            <form onSubmit={handleSubmit} className="flex flex-col">
                                <DialogHeader className="p-6 border-b border-accent">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                            <Building2 className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-xl font-bold uppercase tracking-tight">Nuevo Proyecto</DialogTitle>
                                            <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Configuración inicial del activo de obra</DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="p-6 space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del Proyecto</Label>
                                        <Input id="title" value={formData.title} onChange={handleInputChange} className="h-11 bg-card border-accent text-sm font-bold uppercase" placeholder="Ej: Edificio Los Pinos" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción Corta</Label>
                                        <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder="Breve descripción..." className="min-h-[80px] bg-card border-accent text-xs uppercase font-bold" required />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="client" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliente</Label>
                                            <Input id="client" value={formData.client} onChange={handleInputChange} className="h-11 bg-card border-accent text-xs uppercase font-bold" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ubicación</Label>
                                            <Input id="location" value={formData.location} onChange={handleInputChange} className="h-11 bg-card border-accent text-xs uppercase font-bold" required />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="projectType" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-full">Tipo</Label>
                                            <Select value={formData.projectType} onValueChange={(val) => handleSelectChange('projectType', val)}>
                                                <SelectTrigger className="bg-card border-accent h-11 text-[10px] font-black uppercase w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-accent text-primary">
                                                    <SelectItem value="residencial" className="text-[10px] font-black uppercase">Residencial</SelectItem>
                                                    <SelectItem value="comercial" className="text-[10px] font-black uppercase">Comercial y Oficinas</SelectItem>
                                                    <SelectItem value="industrial" className="text-[10px] font-black uppercase">Industrial</SelectItem>
                                                    <SelectItem value="infraestructura" className="text-[10px] font-black uppercase">Infraestructura</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="area" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Área (m²)</Label>
                                            <Input id="area" type="number" step="0.01" value={formData.area} onChange={handleInputChange} className="h-11 bg-card border-accent font-mono text-xs font-bold" required />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado Inicial</Label>
                                        <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                                            <SelectTrigger className="bg-card border-accent h-11 text-[10px] font-black uppercase w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-accent text-primary">
                                                <SelectItem value="activo" className="text-[10px] font-black uppercase text-primary">ACTIVO</SelectItem>
                                                <SelectItem value="construccion" className="text-[10px] font-black uppercase text-blue-400">EN CONSTRUCCIÓN</SelectItem>
                                                <SelectItem value="espera" className="text-[10px] font-black uppercase text-amber-400">EN ESPERA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter className="p-6 border-t border-accent gap-3 items-center ">
                                    <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary cursor-pointer">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary/40 text-background font-black text-[10px] uppercase tracking-widest px-12 h-11 cursor-pointer" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Registrar Proyecto"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="py-40 flex flex-col items-center justify-center gap-4 opacity-30">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Portafolio...</p>
                </div>
            ) : projects.length > 0 ? (
                view === 'grid' ? <ProjectGridView /> : <ProjectListView />
            ) : (
                <div className="py-32 flex flex-col items-center justify-center text-muted-foreground gap-4 opacity-20">
                    <Building2 className="h-16 w-16" />
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay proyectos registrados en el portafolio operativo.</p>
                    </div>
                </div>
            )}

            {/* Modal de Invitación */}
            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-accent text-primary p-0 overflow-hidden shadow-2xl">
                    <form onSubmit={handleInviteSubmit}>
                        <DialogHeader className="p-6 bg-card border-b border-accent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <UserPlus className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold uppercase tracking-tight">Invitar Colaborador</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                        Otorgar acceso de lectura y edición al proyecto
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="p-6 space-y-6">
                            <div className="bg-card p-4 rounded-xl border border-accent">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Proyecto Seleccionado</p>
                                <p className="text-sm font-bold text-primary uppercase">{selectedProjectForInvite?.title}</p>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5" /> Correo del Usuario
                                </Label>
                                <Input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                    required
                                    className="h-12 bg-card border-accent font-mono text-sm"
                                />
                            </div>
                            <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                <p className="text-[9px] text-blue-400 font-bold leading-relaxed uppercase">
                                    El usuario invitado podrá ver y modificar cómputos, bitácoras y registros financieros de esta terminal.
                                </p>
                            </div>
                        </div>
                        <DialogFooter className="p-6 border-t border-accent bg-card">
                            <Button type="button" variant="ghost" onClick={() => setIsInviteModalOpen(false)} className="text-[10px] font-black uppercase tracking-widest cursor-pointer">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting || !inviteEmail} className="bg-blue-500 hover:bg-blue-600 text-primary font-black text-[10px] uppercase h-11 px-8 tracking-widest cursor-pointer">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Enviar Invitación
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
