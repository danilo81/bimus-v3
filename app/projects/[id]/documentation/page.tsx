"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Project } from '@/types/types';
import { getProjectById } from '@/actions';
import {
    Folder,
    FileText,
    ChevronLeft,
    Search,
    MoreVertical,
    Download,
    Trash2,
    Upload,
    ChevronRight,
    FolderPlus,
    Grid,
    List,
    FileSearch,
    ArrowUpCircle
} from 'lucide-react';
import { Button, buttonVariants } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card, CardContent } from '../../../../components/ui/card';
import { cn } from '../../../../lib/utils';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../../components/ui/dropdown-menu';
import { useToast } from '../../../../hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';

interface DocItem {
    id: string;
    name: string;
    type: 'folder' | 'file';
    size?: string;
    updatedAt: string;
    parentId: string | null;
}

const initialItems: DocItem[] = [
    { id: '1', name: 'Planos Estructurales', type: 'folder', updatedAt: '2024-03-15', parentId: null },
    { id: '2', name: 'Presupuestos', type: 'folder', updatedAt: '2024-03-12', parentId: null },
    { id: '3', name: 'Contrato_Fase_1.pdf', type: 'file', size: '2.4 MB', updatedAt: '2024-03-10', parentId: null },
    { id: '4', name: 'Plano_Cimentacion.pdf', type: 'file', size: '15.8 MB', updatedAt: '2024-03-18', parentId: '1' },
];

export default function DocumentationPage() {
    const params = useParams();
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [items, setItems] = useState<DocItem[]>(initialItems);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const { toast } = useToast();

    const fetchProject = useCallback(async () => {
        if (params.id) {
            try {
                const found = await getProjectById(params.id as string);
                if (found) setProject(found as any);
            } catch (error) {
                console.error("Error loading project:", error);
                toast({
                    title: "Error",
                    description: "No se pudo cargar el proyecto.",
                    variant: "destructive"
                });
            }
        }
    }, [params.id, toast]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    const currentItems = useMemo(() => {
        return items.filter(item =>
            item.parentId === currentFolderId &&
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, currentFolderId, searchTerm]);

    const breadcrumbs = useMemo(() => {
        const path: { id: string | null, name: string }[] = [{ id: null, name: 'Mi Unidad' }];
        if (currentFolderId) {
            const folder = items.find(i => i.id === currentFolderId);
            if (folder) path.push({ id: folder.id, name: folder.name });
        }
        return path;
    }, [currentFolderId, items]);

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        const newFolder: DocItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: newFolderName,
            type: 'folder',
            updatedAt: new Date().toISOString().split('T')[0],
            parentId: currentFolderId
        };
        setItems(prev => [...prev, newFolder]);
        setIsFolderDialogOpen(false);
        setNewFolderName('');
        toast({ title: "Carpeta creada", description: `La carpeta "${newFolderName}" ha sido creada.` });
    };

    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
        toast({ title: "Eliminado", description: "El elemento ha sido eliminado.", variant: "destructive" });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const newFile: DocItem = {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                type: 'file',
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                updatedAt: new Date().toISOString().split('T')[0],
                parentId: currentFolderId
            };
            setItems(prev => [...prev, newFile]);
            toast({ title: "Archivo subido", description: `Se ha subido el archivo ${file.name}.` });
        }
    };

    if (!project) {
        return <div className="p-8 text-center text-muted-foreground">Cargando documentación...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen  text-primary p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className='bg-card w-fit'>
                        <h1 className="text-2xl font-bold flex items-center gap-3 font-headline">
                            <Folder className="h-7 w-7 text-primary" /> Documentación: {project.title}
                        </h1>
                        <p className=" text-muted-foreground  mt-1">Gestión centralizada de archivos y planos</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default" size="sm" className="border-accent bg-primary hover:bg-primary text-background cursor-pointer hover:text-background">
                                <FolderPlus className="mr-2 h-4 w-4" /> Nueva Carpeta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-accent text-primary">
                            <DialogHeader>
                                <DialogTitle>Nueva Carpeta</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-xs">Asigne un nombre a la nueva carpeta.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 ">
                                <Label htmlFor="folderName" className="text-xs uppercase font-bold text-muted-foreground mb-2 block">Nombre</Label>
                                <Input
                                    id="folderName"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    className="bg-card border-accent h-11"
                                    placeholder="Ej: Planos Arquitectura"
                                    autoFocus
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsFolderDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreateFolder} className="bg-primary hover:bg-primary/90 text-white">Crear</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <div className="relative">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".pdf"
                            onChange={handleFileUpload}
                        />
                        <label
                            htmlFor="file-upload"
                            className={cn(
                                buttonVariants({ size: "sm" }),
                                "bg-primary hover:bg-primary/80 text-background cursor-pointer h-8"
                            )}
                        >
                            <Upload className="mr-2 h-4 w-4" /> Subir PDF
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-accent ">
                <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar archivos o carpetas..."
                            className="pl-10 bg-card border-accent h-9 text-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground overflow-x-auto whitespace-nowrap">
                        {breadcrumbs.map((crumb, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                {idx > 0 && <ChevronRight className="h-3 w-3" />}
                                <button
                                    onClick={() => setCurrentFolderId(crumb.id)}
                                    className={`hover:text-white transition-colors ${crumb.id === currentFolderId ? 'text-white font-bold' : ''}`}
                                >
                                    {crumb.name}
                                </button>
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center border border-white/10 rounded-lg overflow-hidden h-9">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`rounded-none h-full w-9 ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`rounded-none h-full w-9 ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1">
                {currentItems.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            {currentItems.map((item) => (
                                <Card
                                    key={item.id}
                                    className="bg-black/40 border-white/5 hover:border-primary/50 transition-all group cursor-pointer"
                                    onDoubleClick={() => item.type === 'folder' && setCurrentFolderId(item.id)}
                                >
                                    <CardContent className="p-4 flex flex-col items-center gap-3 relative">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                                        <MoreVertical className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#111] border-white/10 text-white">
                                                    <DropdownMenuItem className="text-xs flex items-center gap-2">
                                                        <Download className="h-3 w-3" /> Descargar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-xs text-destructive flex items-center gap-2 focus:bg-destructive/10"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                                                    >
                                                        <Trash2 className="h-3 w-3" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-primary/10 transition-colors">
                                            {item.type === 'folder' ? (
                                                <Folder className="h-10 w-10 text-primary" />
                                            ) : (
                                                <FileText className="h-10 w-10 text-red-500" />
                                            )}
                                        </div>

                                        <div className="text-center w-full">
                                            <p className="text-[11px] font-bold truncate px-1" title={item.name}>{item.name}</p>
                                            {item.type === 'file' && <p className="text-[8px] text-muted-foreground uppercase">{item.size}</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="bg-black/40 border-white/5 text-white overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="hover:bg-transparent border-white/10">
                                            <TableHead className="text-[10px] font-bold uppercase">Nombre</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase">Modificado</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase">Tamaño</TableHead>
                                            <TableHead className="text-right text-[10px] font-bold uppercase">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentItems.map((item) => (
                                            <TableRow
                                                key={item.id}
                                                className="hover:bg-white/5 border-white/5 transition-colors cursor-pointer"
                                                onDoubleClick={() => item.type === 'folder' && setCurrentFolderId(item.id)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {item.type === 'folder' ? (
                                                            <Folder className="h-4 w-4 text-primary" />
                                                        ) : (
                                                            <FileText className="h-4 w-4 text-red-500" />
                                                        )}
                                                        <span className="text-xs font-medium">{item.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground font-mono">{item.updatedAt}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground font-mono">{item.size || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-[#111] border-white/10 text-white">
                                                            <DropdownMenuItem className="text-xs flex items-center gap-2">
                                                                <Download className="h-3 w-3" /> Descargar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-xs text-destructive flex items-center gap-2 focus:bg-destructive/10"
                                                                onClick={() => handleDeleteItem(item.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 text-muted-foreground gap-4 bg-card border border-dashed border-accent rounded-3xl">
                        <FileSearch className="h-16 w-16 opacity-10" />
                        <div className="text-center">
                            <p className="text-sm font-bold uppercase tracking-widest">Carpeta Vacía</p>
                            <p className="text-xs mt-1">Arrastra archivos aquí o usa el botón de subir.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-accent">
                <div className="flex items-center gap-4 flex-1">
                    <ArrowUpCircle className="h-5 w-5 text-primary animate-pulse" />
                    <div className="flex-1 max-w-xs">
                        <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                            <span>Almacenamiento Utilizado</span>
                            <span className="text-primary">2.4 GB / 10 GB</span>
                        </div>
                        <div className="w-full bg-card h-1 rounded-full overflow-hidden">
                            <div className="bg-primary h-full w-[24%]" />
                        </div>
                    </div>
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-6">
                    <span>{items.filter(i => i.type === 'folder').length} Carpetas</span>
                    <span>{items.filter(i => i.type === 'file').length} Archivos</span>
                </div>
            </div>
        </div>
    );
}