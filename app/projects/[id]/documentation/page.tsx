// /* eslint-disable @typescript-eslint/no-explicit-any */

// "use client";

// import { useParams, useRouter } from 'next/navigation';
// import { useEffect, useState, useMemo, useCallback } from 'react';
// import { Project } from '../../../../lib/types';
// import { getProjectById } from '../../actions';
// import {
//     Folder,
//     FileText,
//     ChevronLeft,
//     Search,
//     MoreVertical,
//     Download,
//     Trash2,
//     Upload,
//     ChevronRight,
//     FolderPlus,
//     Grid,
//     List,
//     FileSearch,
//     ArrowUpCircle
// } from 'lucide-react';
// import { Button } from '../../../../components/ui/button';
// import { Input } from '../../../../components/ui/input';
// import { Card, CardContent } from '../../../../components/ui/card';
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger
// } from '../../../../components/ui/dialog';
// import { Label } from '../../../../components/ui/label';
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger
// } from '../../../../components/ui/dropdown-menu';
// import { useToast } from '../../../../hooks/use-toast';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';

// interface DocItem {
//     id: string;
//     name: string;
//     type: 'folder' | 'file';
//     size?: string;
//     updatedAt: string;
//     parentId: string | null;
// }

// const initialItems: DocItem[] = [
//     { id: '1', name: 'Planos Estructurales', type: 'folder', updatedAt: '2024-03-15', parentId: null },
//     { id: '2', name: 'Presupuestos', type: 'folder', updatedAt: '2024-03-12', parentId: null },
//     { id: '3', name: 'Contrato_Fase_1.pdf', type: 'file', size: '2.4 MB', updatedAt: '2024-03-10', parentId: null },
//     { id: '4', name: 'Plano_Cimentacion.pdf', type: 'file', size: '15.8 MB', updatedAt: '2024-03-18', parentId: '1' },
// ];

// export default function DocumentationPage() {
//     const params = useParams();
//     const router = useRouter();
//     const [project, setProject] = useState<Project | null>(null);
//     const [items, setItems] = useState<DocItem[]>(initialItems);
//     const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
//     const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
//     const [searchTerm, setSearchTerm] = useState('');
//     const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
//     const [newFolderName, setNewFolderName] = useState('');
//     const { toast } = useToast();

//     const fetchProject = useCallback(async () => {
//         if (params.id) {
//             try {
//                 const found = await getProjectById(params.id as string);
//                 if (found) setProject(found as any);
//             } catch (error) {
//                 console.error("Error loading project:", error);
//                 toast({
//                     title: "Error",
//                     description: "No se pudo cargar el proyecto.",
//                     variant: "destructive"
//                 });
//             }
//         }
//     }, [params.id, toast]);

//     useEffect(() => {
//         fetchProject();
//     }, [fetchProject]);

//     const currentItems = useMemo(() => {
//         return items.filter(item =>
//             item.parentId === currentFolderId &&
//             item.name.toLowerCase().includes(searchTerm.toLowerCase())
//         );
//     }, [items, currentFolderId, searchTerm]);

//     const breadcrumbs = useMemo(() => {
//         const path: { id: string | null, name: string }[] = [{ id: null, name: 'Mi Unidad' }];
//         if (currentFolderId) {
//             const folder = items.find(i => i.id === currentFolderId);
//             if (folder) path.push({ id: folder.id, name: folder.name });
//         }
//         return path;
//     }, [currentFolderId, items]);

//     const handleCreateFolder = () => {
//         if (!newFolderName.trim()) return;
//         const newFolder: DocItem = {
//             id: Math.random().toString(36).substr(2, 9),
//             name: newFolderName,
//             type: 'folder',
//             updatedAt: new Date().toISOString().split('T')[0],
//             parentId: currentFolderId
//         };
//         setItems(prev => [...prev, newFolder]);
//         setIsFolderDialogOpen(false);
//         setNewFolderName('');
//         toast({ title: "Carpeta creada", description: `La carpeta "${newFolderName}" ha sido creada.` });
//     };

//     const handleDeleteItem = (id: string) => {
//         setItems(prev => prev.filter(i => i.id !== id));
//         toast({ title: "Eliminado", description: "El elemento ha sido eliminado.", variant: "destructive" });
//     };

//     const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             const newFile: DocItem = {
//                 id: Math.random().toString(36).substr(2, 9),
//                 name: file.name,
//                 type: 'file',
//                 size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
//                 updatedAt: new Date().toISOString().split('T')[0],
//                 parentId: currentFolderId
//             };
//             setItems(prev => [...prev, newFile]);
//             toast({ title: "Archivo subido", description: `Se ha subido el archivo ${file.name}.` });
//         }
//     };

//     if (!project) {
//         return <div className="p-8 text-center text-muted-foreground">Cargando documentación...</div>;
//     }

//     return (
//         <div className="flex flex-col min-h-screen  text-primary p-4 md:p-8 space-y-6">
//             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//                 <div className="flex items-center gap-4">
//                     <div className='bg-card w-fit'>
//                         <h1 className="text-2xl font-bold flex items-center gap-3 font-headline">
//                             <Folder className="h-7 w-7 text-primary" /> Documentación: {project.title}
//                         </h1>
//                         <p className=" text-muted-foreground  mt-1">Gestión centralizada de archivos y planos</p>
//                     </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                     <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
//                         <DialogTrigger asChild>
//                             <Button variant="default" size="sm" className="border-accent bg-primary hover:bg-primary text-background cursor-pointer hover:text-background">
//                                 <FolderPlus className="mr-2 h-4 w-4" /> Nueva Carpeta
//                             </Button>
//                         </DialogTrigger>
//                         <DialogContent className="bg-card border-accent text-primary">
//                             <DialogHeader>
//                                 <DialogTitle>Nueva Carpeta</DialogTitle>
//                                 <DialogDescription className="text-muted-foreground text-xs">Asigne un nombre a la nueva carpeta.</DialogDescription>
//                             </DialogHeader>
//                             <div className="py-4 ">
//                                 <Label htmlFor="folderName" className="text-xs uppercase font-bold text-muted-foreground mb-2 block">Nombre</Label>
//                                 <Input
//                                     id="folderName"
//                                     value={newFolderName}
//                                     onChange={(e) => setNewFolderName(e.target.value)}
//                                     className="bg-card border-accent h-11"
//                                     placeholder="Ej: Planos Arquitectura"
//                                     autoFocus
//                                 />
//                             </div>
//                             <DialogFooter>
//                                 <Button variant="ghost" onClick={() => setIsFolderDialogOpen(false)}>Cancelar</Button>
//                                 <Button onClick={handleCreateFolder} className="bg-primary hover:bg-primary/90 text-white">Crear</Button>
//                             </DialogFooter>
//                         </DialogContent>
//                     </Dialog>

//                     <div className="relative">
//                         <input
//                             type="file"
//                             id="file-upload"
//                             className="hidden"
//                             accept=".pdf"
//                             onChange={handleFileUpload}
//                         />
//                         <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-background cursor-pointer">
//                             <label htmlFor="file-upload">
//                                 <Upload className="mr-2 h-4 w-4" /> Subir PDF
//                             </label>
//                         </Button>
//                     </div>
//                 </div>
//             </div>

//             <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-accent ">
//                 <div className="flex items-center gap-4 flex-1 w-full">
//                     <div className="relative flex-1 max-w-md">
//                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                         <Input
//                             placeholder="Buscar archivos o carpetas..."
//                             className="pl-10 bg-card border-accent h-9 text-xs"
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                         />
//                     </div>

//                     <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground overflow-x-auto whitespace-nowrap">
//                         {breadcrumbs.map((crumb, idx) => (
//                             <div key={idx} className="flex items-center gap-2">
//                                 {idx > 0 && <ChevronRight className="h-3 w-3" />}
//                                 <button
//                                     onClick={() => setCurrentFolderId(crumb.id)}
//                                     className={`hover:text-white transition-colors ${crumb.id === currentFolderId ? 'text-white font-bold' : ''}`}
//                                 >
//                                     {crumb.name}
//                                 </button>
//                             </div>
//                         ))}
//                     </nav>
//                 </div>

//                 <div className="flex items-center border border-white/10 rounded-lg overflow-hidden h-9">
//                     <Button
//                         variant="ghost"
//                         size="icon"
//                         className={`rounded-none h-full w-9 ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
//                         onClick={() => setViewMode('grid')}
//                     >
//                         <Grid className="h-4 w-4" />
//                     </Button>
//                     <Button
//                         variant="ghost"
//                         size="icon"
//                         className={`rounded-none h-full w-9 ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
//                         onClick={() => setViewMode('list')}
//                     >
//                         <List className="h-4 w-4" />
//                     </Button>
//                 </div>
//             </div>

//             <div className="flex-1">
//                 {currentItems.length > 0 ? (
//                     viewMode === 'grid' ? (
//                         <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
//                             {currentItems.map((item) => (
//                                 <Card
//                                     key={item.id}
//                                     className="bg-black/40 border-white/5 hover:border-primary/50 transition-all group cursor-pointer"
//                                     onDoubleClick={() => item.type === 'folder' && setCurrentFolderId(item.id)}
//                                 >
//                                     <CardContent className="p-4 flex flex-col items-center gap-3 relative">
//                                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                                             <DropdownMenu>
//                                                 <DropdownMenuTrigger asChild>
//                                                     <Button variant="ghost" size="icon" className="h-6 w-6">
//                                                         <MoreVertical className="h-3 w-3" />
//                                                     </Button>
//                                                 </DropdownMenuTrigger>
//                                                 <DropdownMenuContent align="end" className="bg-[#111] border-white/10 text-white">
//                                                     <DropdownMenuItem className="text-xs flex items-center gap-2">
//                                                         <Download className="h-3 w-3" /> Descargar
//                                                     </DropdownMenuItem>
//                                                     <DropdownMenuItem
//                                                         className="text-xs text-destructive flex items-center gap-2 focus:bg-destructive/10"
//                                                         onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
//                                                     >
//                                                         <Trash2 className="h-3 w-3" /> Eliminar
//                                                     </DropdownMenuItem>
//                                                 </DropdownMenuContent>
//                                             </DropdownMenu>
//                                         </div>

//                                         <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-primary/10 transition-colors">
//                                             {item.type === 'folder' ? (
//                                                 <Folder className="h-10 w-10 text-primary" />
//                                             ) : (
//                                                 <FileText className="h-10 w-10 text-red-500" />
//                                             )}
//                                         </div>

//                                         <div className="text-center w-full">
//                                             <p className="text-[11px] font-bold truncate px-1" title={item.name}>{item.name}</p>
//                                             {item.type === 'file' && <p className="text-[8px] text-muted-foreground uppercase">{item.size}</p>}
//                                         </div>
//                                     </CardContent>
//                                 </Card>
//                             ))}
//                         </div>
//                     ) : (
//                         <Card className="bg-black/40 border-white/5 text-white overflow-hidden">
//                             <div className="overflow-x-auto">
//                                 <Table>
//                                     <TableHeader className="bg-white/5">
//                                         <TableRow className="hover:bg-transparent border-white/10">
//                                             <TableHead className="text-[10px] font-bold uppercase">Nombre</TableHead>
//                                             <TableHead className="text-[10px] font-bold uppercase">Modificado</TableHead>
//                                             <TableHead className="text-[10px] font-bold uppercase">Tamaño</TableHead>
//                                             <TableHead className="text-right text-[10px] font-bold uppercase">Acciones</TableHead>
//                                         </TableRow>
//                                     </TableHeader>
//                                     <TableBody>
//                                         {currentItems.map((item) => (
//                                             <TableRow
//                                                 key={item.id}
//                                                 className="hover:bg-white/5 border-white/5 transition-colors cursor-pointer"
//                                                 onDoubleClick={() => item.type === 'folder' && setCurrentFolderId(item.id)}
//                                             >
//                                                 <TableCell>
//                                                     <div className="flex items-center gap-3">
//                                                         {item.type === 'folder' ? (
//                                                             <Folder className="h-4 w-4 text-primary" />
//                                                         ) : (
//                                                             <FileText className="h-4 w-4 text-red-500" />
//                                                         )}
//                                                         <span className="text-xs font-medium">{item.name}</span>
//                                                     </div>
//                                                 </TableCell>
//                                                 <TableCell className="text-xs text-muted-foreground font-mono">{item.updatedAt}</TableCell>
//                                                 <TableCell className="text-xs text-muted-foreground font-mono">{item.size || '-'}</TableCell>
//                                                 <TableCell className="text-right">
//                                                     <DropdownMenu>
//                                                         <DropdownMenuTrigger asChild>
//                                                             <Button variant="ghost" size="icon" className="h-7 w-7">
//                                                                 <MoreVertical className="h-4 w-4" />
//                                                             </Button>
//                                                         </DropdownMenuTrigger>
//                                                         <DropdownMenuContent align="end" className="bg-[#111] border-white/10 text-white">
//                                                             <DropdownMenuItem className="text-xs flex items-center gap-2">
//                                                                 <Download className="h-3 w-3" /> Descargar
//                                                             </DropdownMenuItem>
//                                                             <DropdownMenuItem
//                                                                 className="text-xs text-destructive flex items-center gap-2 focus:bg-destructive/10"
//                                                                 onClick={() => handleDeleteItem(item.id)}
//                                                             >
//                                                                 <Trash2 className="h-3 w-3" /> Eliminar
//                                                             </DropdownMenuItem>
//                                                         </DropdownMenuContent>
//                                                     </DropdownMenu>
//                                                 </TableCell>
//                                             </TableRow>
//                                         ))}
//                                     </TableBody>
//                                 </Table>
//                             </div>
//                         </Card>
//                     )
//                 ) : (
//                     <div className="flex flex-col items-center justify-center py-40 text-muted-foreground gap-4 bg-white/2 border border-dashed border-white/5 rounded-3xl">
//                         <FileSearch className="h-16 w-16 opacity-10" />
//                         <div className="text-center">
//                             <p className="text-sm font-bold uppercase tracking-widest">Carpeta Vacía</p>
//                             <p className="text-xs mt-1">Arrastra archivos aquí o usa el botón de subir.</p>
//                         </div>
//                     </div>
//                 )}
//             </div>

//             <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
//                 <div className="flex items-center gap-4 flex-1">
//                     <ArrowUpCircle className="h-5 w-5 text-primary animate-pulse" />
//                     <div className="flex-1 max-w-xs">
//                         <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
//                             <span>Almacenamiento Utilizado</span>
//                             <span className="text-primary">2.4 GB / 10 GB</span>
//                         </div>
//                         <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden">
//                             <div className="bg-primary h-full w-[24%]" />
//                         </div>
//                     </div>
//                 </div>
//                 <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-6">
//                     <span>{items.filter(i => i.type === 'folder').length} Carpetas</span>
//                     <span>{items.filter(i => i.type === 'file').length} Archivos</span>
//                 </div>
//             </div>
//         </div>
//     );
// }
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getProjectById } from '../../actions';
import { getProjectDocuments, registerDocument, deleteDocument } from './actions';
import {
    ChevronLeft,
    Cloud,
    FileText,
    Search,
    Plus,
    Loader2,
    HardDrive,
    Trash2,
    Eye,
    Download,
    X,
    FileCode,
    FileImage,
    MoreVertical,
    CheckCircle2,
    ExternalLink,
    UploadCloud,
    AlertCircle,
    Info,
    Smartphone,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function ProjectDocumentsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [project, setProject] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Simulated Google Drive state
    const [isDriveConnected, setIsDriveConnected] = useState(false);

    const projectId = useMemo(() => {
        const id = params?.id;
        return Array.isArray(id) ? id[0] : id;
    }, [params?.id]);

    const fetchProjectData = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const [proj, docs] = await Promise.all([
                getProjectById(projectId),
                getProjectDocuments(projectId)
            ]);
            if (proj) setProject(proj);
            setDocuments(docs);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        setIsMounted(true);
        fetchProjectData();
    }, [fetchProjectData]);

    const handleUploadLocal = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !projectId) return;

        if (file.type !== 'application/pdf') {
            toast({ title: "Formato no permitido", description: "Solo se admiten archivos PDF.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const result = await registerDocument({
                projectId,
                name: file.name.toUpperCase(),
                type: 'PDF',
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                url: '#', 
                source: 'local'
            });

            if (result.success) {
                toast({ title: "Archivo Cargado", description: "El documento se ha añadido al expediente." });
                setIsUploadModalOpen(false);
                fetchProjectData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLinkDriveFile = async (name: string, size: string) => {
        if (!projectId) return;
        setIsSaving(true);
        try {
            const result = await registerDocument({
                projectId,
                name: name.toUpperCase(),
                type: 'PDF',
                size,
                url: '#', 
                source: 'google_drive'
            });

            if (result.success) {
                toast({ title: "Vínculo de Drive Creado", description: "El archivo de la nube se ha sincronizado." });
                fetchProjectData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!projectId || !confirm('¿Eliminar este archivo del expediente?')) return;
        try {
            const result = await deleteDocument(id, projectId);
            if (result.success) {
                toast({ title: "Archivo removido", variant: "destructive" });
                fetchProjectData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const filteredDocs = documents.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isMounted) return null;

    return (
        <div className="flex flex-col min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-white/10">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3 font-headline uppercase tracking-tight">
                            <Cloud className="h-7 w-7 text-primary" /> Expediente Técnico: {project?.title}
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Gestión de planos, memorias y documentos digitales</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => setIsDriveModalOpen(true)}
                        className="bg-white/5 border-white/10 text-[10px] font-black uppercase h-11 px-6 rounded-xl hover:bg-white/10"
                    >
                        <Globe className="mr-2 h-4 w-4 text-[#4285F4]" /> Google Drive
                    </Button>
                    <Button 
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-primary text-black font-black text-[10px] uppercase h-11 px-8 rounded-xl shadow-xl shadow-primary/10"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Subir PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-[#0a0a0a] border-white/10 shadow-2xl">
                        <CardHeader className="bg-white/2 border-b border-white/5 p-6">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <HardDrive className="h-4 w-4" /> Resumen Almacenamiento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span className="text-muted-foreground">Archivos Totales</span>
                                    <span className="text-white">{documents.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span className="text-muted-foreground">Espacio en Uso</span>
                                    <span className="text-white">12.4 MB</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[5%]" />
                                </div>
                            </div>
                            <Separator className="bg-white/5" />
                            <div className="space-y-3">
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Fuentes de Datos</p>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-white/2 border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="h-3 w-3 text-primary" />
                                        <span className="text-[9px] font-bold uppercase">Local</span>
                                    </div>
                                    <span className="text-[9px] font-black">{documents.filter(d => d.source === 'local').length}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-white/2 border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-3 w-3 text-[#4285F4]" />
                                        <span className="text-[9px] font-bold uppercase">Drive</span>
                                    </div>
                                    <span className="text-[9px] font-black">{documents.filter(d => d.source === 'google_drive').length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    <Card className="bg-[#0a0a0a] border-white/10 overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
                        <CardHeader className="p-6 bg-white/2 border-b border-white/5 flex flex-row items-center justify-between shrink-0">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="BUSCAR EN EXPEDIENTE..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-10 bg-black/40 border-white/10 text-[10px] font-black uppercase"
                                />
                            </div>
                        </CardHeader>
                        
                        <div className="flex-1">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full py-40 opacity-20">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    <p className="text-[10px] font-black uppercase tracking-widest mt-4">Leyendo Expediente...</p>
                                </div>
                            ) : filteredDocs.length > 0 ? (
                                <Table>
                                    <TableHeader className="bg-white/2">
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Documento / Planimetría</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center">Formato</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-center">Peso</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Origen</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-right pr-12">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDocs.map((doc) => (
                                            <TableRow key={doc.id} className="border-white/5 hover:bg-white/2 transition-colors group">
                                                <TableCell className="py-5 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                                                            <FileText className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-white uppercase group-hover:text-primary transition-colors">{doc.name}</span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[8px] font-black text-muted-foreground uppercase opacity-50">{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                                <span className="text-[8px] font-black text-muted-foreground uppercase opacity-50">• POR: {doc.authorName}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 bg-white/5 px-2">{doc.type}</Badge>
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-[10px] text-muted-foreground">{doc.size}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {doc.source === 'local' ? (
                                                            <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                                                        ) : (
                                                            <Globe className="h-3.5 w-3.5 text-[#4285F4]" />
                                                        )}
                                                        <span className="text-[9px] font-black uppercase text-muted-foreground">{doc.source.replace('_', ' ')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10"><Eye className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-primary"><Download className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10 text-red-500" onClick={() => handleDelete(doc.id)}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-40 opacity-20 gap-4">
                                    <FileText className="h-16 w-16" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay documentos en el expediente del proyecto.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Local Upload Modal */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-6 bg-white/2 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg"><UploadCloud className="h-6 w-6 text-primary" /></div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase">Subir Documento PDF</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Expediente Técnico de Obra</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="p-8">
                        <div className="relative group">
                            <input 
                                type="file" 
                                accept=".pdf" 
                                onChange={handleUploadLocal}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
                                <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                                    <FileText className="h-10 w-10 text-muted-foreground group-hover:text-primary" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-xs font-bold uppercase">Haz clic o arrastra un archivo</p>
                                    <p className="text-[9px] text-muted-foreground uppercase font-black">SOLO FORMATO PDF (MÁX. 50MB)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t border-white/5 bg-black/20">
                        <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)} className="text-[10px] font-black uppercase">Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Google Drive Integration Modal */}
            <Dialog open={isDriveModalOpen} onOpenChange={setIsDriveModalOpen}>
                <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl flex flex-col h-[70vh]">
                    <DialogHeader className="p-6 bg-white/2 border-b border-white/5 flex flex-row items-center justify-between shrink-0 space-y-0">
                        <div className="flex items-center gap-3">
                            <Globe className="h-6 w-6 text-[#4285F4]" />
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase">Google Drive Integration</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Sincronización remota de planimetría</DialogDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsDriveModalOpen(false)}><X className="h-5 w-5" /></Button>
                    </DialogHeader>

                    {!isDriveConnected ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                            <div className="p-6 bg-white/2 rounded-full border border-white/5 relative">
                                <Globe className="h-16 w-16 text-[#4285F4] opacity-40" />
                                <div className="absolute inset-0 animate-ping border border-[#4285F4]/20 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold uppercase">Vincular cuenta de Google</h3>
                                <p className="text-xs text-muted-foreground max-w-sm mx-auto uppercase font-bold leading-relaxed">Conecta tu Google Drive para importar planos y memorias técnicas directamente al expediente del proyecto.</p>
                            </div>
                            <Button 
                                onClick={() => setIsDriveConnected(true)}
                                className="bg-[#4285F4] hover:bg-[#3b78e7] text-white font-black text-[10px] uppercase h-12 px-12 tracking-widest shadow-xl shadow-[#4285F4]/20"
                            >
                                Autorizar Google Drive
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-4 bg-white/2 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Conectado: drive@estudio.com</span>
                                </div>
                                <Button variant="ghost" size="xs" onClick={() => setIsDriveConnected(false)} className="text-red-500 text-[8px] font-black uppercase">Desconectar</Button>
                            </div>
                            
                            <ScrollArea className="flex-1">
                                <div className="p-4 space-y-2">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-4">Seleccionar archivos de la Nube:</p>
                                    {[
                                        { name: 'MEMORIA_CALCULO_V2.pdf', size: '1.4 MB' },
                                        { name: 'PLANO_TOPOGRAFICO_CURVAS.pdf', size: '12.8 MB' },
                                        { name: 'ACTA_RECEPCION_MUNICIPIO.pdf', size: '850 KB' },
                                        { name: 'INFORME_SUELOS_GEOTECNIA.pdf', size: '4.2 MB' },
                                    ].map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5 hover:border-[#4285F4]/40 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold uppercase">{file.name}</span>
                                                    <span className="text-[8px] font-mono text-muted-foreground">{file.size}</span>
                                                </div>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-8 px-4 bg-[#4285F4]/10 text-[#4285F4] font-black text-[9px] uppercase hover:bg-[#4285F4] hover:text-white"
                                                onClick={() => handleLinkDriveFile(file.name, file.size)}
                                            >
                                                Vincular
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    <DialogFooter className="p-6 border-t border-white/5 bg-black shrink-0">
                        <p className="text-[8px] font-black uppercase text-muted-foreground/40 text-center w-full">Google Drive es una marca registrada de Google LLC. Integración certificada por Bimus Platform.</p>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
