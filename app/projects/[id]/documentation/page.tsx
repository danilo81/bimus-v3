"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
    getProjectById,
    getProjectDocuments,
    deleteDocument,
    getMyProjectPermissions,
    getStorageStats
} from '@/actions';
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
    Grid,
    List,
    FileSearch,
    Loader2,
    FilePlus2,
    ExternalLink,
    ShieldAlert,
    User,
    Calendar
} from 'lucide-react';
import { Button, buttonVariants } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card, CardContent, CardHeader } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { cn } from '../../../../lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../../../components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '../../../../components/ui/dropdown-menu';
import { useToast } from '../../../../hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { useAuth } from '../../../../hooks/use-auth';
import { Progress } from '../../../../components/ui/progress';
import { createProjectFolder } from '@/actions/projects/createProjectFolder';

// Allowed MIME types and their display labels
const ALLOWED_TYPES: Record<string, { ext: string; color: string; icon: string }> = {
    'application/pdf': { ext: 'PDF', color: 'text-red-400', icon: '📄' },
    'application/vnd.dwg': { ext: 'DWG', color: 'text-blue-400', icon: '📐' },
    'image/vnd.dwg': { ext: 'DWG', color: 'text-blue-400', icon: '📐' },
    'application/acad': { ext: 'DWG', color: 'text-blue-400', icon: '📐' },
    'image/x-dwg': { ext: 'DWG', color: 'text-blue-400', icon: '📐' },
    'application/dxf': { ext: 'DXF', color: 'text-blue-300', icon: '📐' },
    'image/vnd.dxf': { ext: 'DXF', color: 'text-blue-300', icon: '📐' },
    'application/msword': { ext: 'DOC', color: 'text-indigo-400', icon: '📝' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'DOCX', color: 'text-indigo-400', icon: '📝' },
    'application/vnd.ms-excel': { ext: 'XLS', color: 'text-emerald-400', icon: '📊' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'XLSX', color: 'text-emerald-400', icon: '📊' },
    'image/jpeg': { ext: 'JPG', color: 'text-amber-400', icon: '🖼️' },
    'image/png': { ext: 'PNG', color: 'text-amber-400', icon: '🖼️' },
};

function getFileTypeMeta(mimeType: string, filename?: string) {
    if (ALLOWED_TYPES[mimeType]) return ALLOWED_TYPES[mimeType];
    // Fallback by extension
    const ext = filename?.split('.').pop()?.toUpperCase() || 'FILE';
    return { ext, color: 'text-muted-foreground', icon: '📄' };
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DocumentationPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [project, setProject] = useState<any | null>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Navigation and Hierarchy
    const [currentFolder, setCurrentFolder] = useState("/");

    // Folder Creation Modal
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingFileName, setUploadingFileName] = useState('');
    const [storageStats, setStorageStats] = useState<any>(null);

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Permissions
    const [canEdit, setCanEdit] = useState(false);
    const [isAuthor, setIsAuthor] = useState(false);

    const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

    const fetchData = useCallback(async () => {
        if (!projectId || projectId === 'undefined') return;
        setIsLoading(true);
        try {
            const [proj, docs, perms] = await Promise.all([
                getProjectById(projectId),
                getProjectDocuments(projectId),
                getMyProjectPermissions(projectId)
            ]);
            setProject(proj);
            setDocuments(docs || []);
            setIsAuthor(perms.isAuthor);
            // Author can always edit; collaborator needs docs permission with edit:true
            if (perms.isAuthor) {
                setCanEdit(true);
            } else {
                const docsPerms = (perms.permissions as any)?.documentation || (perms.permissions as any)?.docs || null;
                setCanEdit(docsPerms?.edit === true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    const fetchStats = useCallback(async () => {
        const res = await getStorageStats();
        if (res.success) setStorageStats(res);
    }, []);

    useEffect(() => {
        fetchData();
        fetchStats();
    }, [fetchData, fetchStats]);

    // -------------------------------------------------------
    // Upload to R2 via presigned URL, then register in DB
    // -------------------------------------------------------
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !projectId) return;

        if (file.size > 50 * 1024 * 1024) {
            toast({ title: 'Archivo muy grande', description: 'El tamaño máximo es 50 MB.', variant: 'destructive' });
            return;
        }

        setIsUploading(true);
        setUploadProgress(5);
        setUploadingFileName(file.name);

        try {
            const presignRes = await fetch('/api/r2/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type || 'application/octet-stream',
                    size: file.size,
                    libraryType: "project",
                    projectId: projectId,
                    folder: currentFolder
                })
            });

            if (!presignRes.ok) {
                const err = await presignRes.json();
                throw new Error(err.error || 'No se pudo obtener la URL de subida');
            }

            const resData = await presignRes.json();
            const { presignedUrl, publicUrl, fileId } = resData;
            setUploadProgress(20);

            // 2. PUT file directly to R2
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', presignedUrl, true);
                xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
                xhr.upload.onprogress = (ev) => {
                    if (ev.lengthComputable) {
                        const pct = 20 + Math.round((ev.loaded / ev.total) * 70);
                        setUploadProgress(pct);
                    }
                };
                xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
                xhr.onerror = () => reject(new Error('Error de red durante la subida'));
                xhr.send(file);
            });

            setUploadProgress(100);
            toast({ title: 'Archivo subido', description: `"${file.name}" ha sido registrado correctamente.` });

            // Refresh list and stats
            fetchData();
            fetchStats();
        } catch (err: any) {
            toast({ title: 'Error al subir', description: err.message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadingFileName('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // -------------------------------------------------------
    // Delete
    // -------------------------------------------------------
    const handleConfirmDelete = async () => {
        if (!deleteTarget || !projectId) return;
        setIsDeleting(true);
        try {
            const res = await deleteDocument(deleteTarget.id, projectId);
            if (res.success) {
                toast({ title: 'Archivo eliminado', description: `"${deleteTarget.name}" fue eliminado.` });
                setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id));
                setDeleteTarget(null);
                fetchStats();
            } else {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDownload = (e: React.MouseEvent, url: string, filename: string) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            // Extract the R2 key from the public URL
            let key = "";
            const urlObj = new URL(url);
            // pathname usually starts with /, so we remove it to get the key
            key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;

            if (!key || key === "undefined") {
                throw new Error("Clave de archivo no encontrada");
            }

            // Route through our proxy API which handles CORS and adds Content-Disposition
            const proxyUrl = `/api/r2/file/${encodeURIComponent(key)}?download=true&filename=${encodeURIComponent(filename)}`;

            // Use a temporary link element to trigger the download without changing window.location
            const link = document.createElement('a');
            link.href = proxyUrl;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Download failed:", err);
            // Absolute last resort fallback
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim() || !projectId) return;
        setIsCreatingFolder(true);
        try {
            const res = await createProjectFolder(projectId, newFolderName.trim(), currentFolder);
            if (res.success) {
                toast({ title: 'Carpeta creada', description: `"${newFolderName}" ha sido creada.` });
                setNewFolderName('');
                setIsFolderModalOpen(false);
                fetchData();
            } else {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setIsCreatingFolder(false);
        }
    };

    const navigateToFolder = (folderPath: string) => {
        setCurrentFolder(folderPath);
        setSearchTerm('');
    };

    const breadcrumbs = useMemo(() => {
        if (currentFolder === "/") return [{ name: "Raíz", path: "/" }];
        const parts = currentFolder.split('/').filter(p => p);
        const result = [{ name: "Raíz", path: "/" }];
        let currentPath = "";
        parts.forEach(p => {
            currentPath += `/${p}`;
            result.push({ name: p, path: `${currentPath}/` });
        });
        return result;
    }, [currentFolder]);

    // -------------------------------------------------------
    // Filtered list
    // -------------------------------------------------------
    const filteredDocs = useMemo(() => {
        return documents.filter(d => {
            const matchFolder = d.folder === currentFolder;
            const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchType = typeFilter === 'all' || d.type === typeFilter;
            return matchFolder && matchSearch && matchType;
        });
    }, [documents, searchTerm, typeFilter, currentFolder]);

    const docTypes = useMemo(() => {
        const types = new Set(documents.map(d => d.type));
        return Array.from(types);
    }, [documents]);

    const totalSizeBytes = useMemo(() => {
        return documents.reduce((acc, d) => acc + (d.size || 0), 0);
    }, [documents]);

    // -------------------------------------------------------
    // Loading / empty states
    // -------------------------------------------------------
    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center gap-4 h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargando expediente...</p>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="flex flex-col text-primary p-4 md:p-8 space-y-6  overflow-y-auto">
            <div className="bg-card border border-accent text-primary overflow-hidden gap-0 rounded-lg">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-7 border-b border-accent p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-0">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-3 font-headline uppercase tracking-tight">
                                <Folder className="h-7 w-7 text-primary" /> Documentación: {project.title}
                            </h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                                Expediente técnico y archivos del proyecto
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Permission badge */}
                            {!canEdit && (
                                <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-widest gap-1">
                                    <ShieldAlert className="h-3 w-3" /> Solo Visualización
                                </Badge>
                            )}
                        </div>
                        {/* ── Breadcrumbs ── */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                            {breadcrumbs.map((bc, idx) => (
                                <div key={bc.path} className="flex items-center gap-2 shrink-0">
                                    {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/30" />}
                                    <button
                                        onClick={() => navigateToFolder(bc.path)}
                                        className={cn(
                                            "text-[10px] font-black uppercase tracking-widest transition-colors",
                                            bc.path === currentFolder ? "text-primary" : "text-muted-foreground/60 hover:text-primary"
                                        )}
                                    >
                                        {bc.name}
                                    </button>
                                </div>
                            ))}
                        </div>

                    </div>
                </CardHeader>
                {/* ── Upload progress bar ── */}
                {/* {isUploading && (
                    <div className="bg-card border border-accent rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span className="text-xs font-bold truncate max-w-xs">{uploadingFileName}</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-primary">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-1.5" />
                    </div>
                )} */}

                {/* ── Toolbar ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-accent m-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar documento..."
                            className="pl-10 bg-card border-accent h-9 text-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* ── Storage Stats Indicator ── */}
                    {storageStats && (
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex-1 w-full space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"></p>
                                    <p className="text-xs font-bold text-primary">
                                        {formatFileSize(storageStats.used)} / {formatFileSize(storageStats.total)}
                                        <span className="ml-2 text-muted-foreground opacity-50">({storageStats.percentage.toFixed(1)}%)</span>
                                    </p>
                                </div>
                                <Progress
                                    value={storageStats.percentage}
                                    className={cn(
                                        "h-2",
                                        storageStats.percentage > 90 ? "bg-red-500/20" :
                                            storageStats.percentage > 70 ? "bg-amber-500/20" : "bg-primary/20"
                                    )}
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3 flex-1 w-full justify-end">
                        {/* Type filter pills */}
                        {/* <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                                onClick={() => setTypeFilter('all')}
                                className={cn(
                                    'px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border transition-colors',
                                    typeFilter === 'all'
                                        ? 'bg-primary text-background border-primary'
                                        : 'border-accent text-muted-foreground hover:border-primary/50'
                                )}
                            >
                                Todos
                            </button>
                            {docTypes.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={cn(
                                        'px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border transition-colors',
                                        typeFilter === t
                                            ? 'bg-primary text-background border-primary'
                                            : 'border-accent text-muted-foreground hover:border-primary/50'
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div> */}
                        <div className="flex items-center gap-2 ">
                            {/* Permission badge */}
                            {!canEdit && (
                                <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-widest gap-1">
                                    <ShieldAlert className="h-3 w-3" /> Solo Visualización
                                </Badge>
                            )}
                            <div className="flex items-center border border-accent rounded-lg overflow-hidden h-9 shrink-0">
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
                            {/* Upload button — only if user can edit */}
                            {canEdit && (
                                <>
                                    {/* New Folder Button */}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest h-10 px-4"
                                        onClick={() => setIsFolderModalOpen(true)}
                                    >
                                        <Folder className="mr-2 h-4 w-4" />
                                        Nueva Carpeta
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        id="doc-upload"
                                        className="hidden"
                                        accept=".pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                        onChange={handleFileSelect}
                                        disabled={isUploading}
                                    />
                                    <label
                                        htmlFor="doc-upload"
                                        className={cn(
                                            buttonVariants({ size: 'sm' }),
                                            'bg-primary hover:bg-primary/80 text-background font-black text-[10px] uppercase tracking-widest cursor-pointer px-5 h-10',
                                            isUploading && 'opacity-50 pointer-events-none'
                                        )}
                                    >
                                        {isUploading
                                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            : <Upload className="mr-2 h-4 w-4" />
                                        }
                                        {isUploading ? 'Subiendo...' : 'Subir Archivo'}
                                    </label>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="flex-1 m-4">
                    {filteredDocs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 text-muted-foreground gap-4 bg-card border  border-accent rounded-3xl">
                            <FileSearch className="h-16 w-16 opacity-10" />
                            <div className="text-center">
                                <p className="text-sm font-bold uppercase tracking-widest">
                                    {documents.length === 0 ? 'Sin documentos' : 'Sin resultados'}
                                </p>
                                <p className="text-xs mt-1 opacity-60">
                                    {documents.length === 0
                                        ? canEdit
                                            ? 'Sube el primer archivo del proyecto usando el botón "Subir Archivo".'
                                            : 'El autor del proyecto aún no ha subido documentos.'
                                        : 'Ningún archivo coincide con tu búsqueda.'}
                                </p>
                            </div>
                        </div>
                    ) : viewMode === 'grid' ? (
                        /* ── Grid View ── */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {filteredDocs.map((doc) => {
                                const meta = getFileTypeMeta(doc.type, doc.name);
                                return (
                                    <Card
                                        key={doc.id}
                                        className="bg-card border-accent hover:border-primary/50 transition-all group cursor-pointer"
                                    >
                                        <CardContent className="p-4 flex flex-col items-center gap-3 relative">
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                            <MoreVertical className="h-3 w-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-card border-accent text-primary">
                                                        <DropdownMenuItem asChild className="text-xs flex items-center gap-2 cursor-pointer focus:bg-primary/10">
                                                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="h-3 w-3" /> Ver en Navegador
                                                            </a>
                                                        </DropdownMenuItem>
                                                        {!doc.isFolder && (
                                                            <DropdownMenuItem
                                                                className="text-xs flex items-center gap-2 cursor-pointer focus:bg-primary/10"
                                                                onClick={(e) => handleDownload(e, doc.url, doc.name)}
                                                            >
                                                                <Download className="h-3 w-3" /> Descargar Archivo
                                                            </DropdownMenuItem>
                                                        )}
                                                        {canEdit && (
                                                            <>
                                                                <DropdownMenuSeparator className="bg-accent" />
                                                                <DropdownMenuItem
                                                                    className="text-xs text-destructive flex items-center gap-2 focus:bg-destructive/10 cursor-pointer"
                                                                    onClick={() => setDeleteTarget(doc)}
                                                                >
                                                                    <Trash2 className="h-3 w-3" /> Eliminar
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="p-4 bg-accent rounded-2xl group-hover:bg-primary/10 transition-colors">
                                                {doc.isFolder ? (
                                                    <Folder className="h-10 w-10 text-primary" />
                                                ) : (
                                                    <FileText className={cn('h-10 w-10', meta.color)} />
                                                )}
                                            </div>

                                            <div className="text-center w-full">
                                                <p className="text-[11px] font-bold truncate px-1" title={doc.name}>{doc.name}</p>
                                                {doc.isFolder ? (
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary mt-1">CARPETA</Badge>
                                                ) : (
                                                    <Badge variant="outline" className={cn('text-[8px] font-black uppercase border-accent mt-1', meta.color)}>
                                                        {meta.ext}
                                                    </Badge>
                                                )}
                                                {!doc.isFolder && doc.size && <p className="text-[8px] text-muted-foreground mt-0.5">{formatFileSize(doc.size)}</p>}
                                            </div>
                                        </CardContent>
                                        <div
                                            className="absolute inset-0 z-0"
                                            onClick={(e) => {
                                                if (doc.isFolder) {
                                                    e.stopPropagation();
                                                    const newPath = currentFolder === "/" ? `/${doc.name}/` : `${currentFolder}${doc.name}/`;
                                                    navigateToFolder(newPath);
                                                } else {
                                                    window.open(doc.url, '_blank');
                                                }
                                            }}
                                        />
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        /* ── List View ── */
                        <Card className="bg-card border-accent overflow-hidden p-0">
                            <Table>
                                <TableHeader className="bg-accent">
                                    <TableRow className="border-accent hover:bg-transparent">
                                        <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest">Nombre del Documento</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">Tipo</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">Tamaño</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">Subido por</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-center">Fecha</TableHead>
                                        <TableHead className="w-14 text-center"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDocs.map((doc) => {
                                        const meta = getFileTypeMeta(doc.type, doc.name);
                                        return (
                                            <TableRow
                                                key={doc.id}
                                                className="border-accent hover:bg-accent/30 transition-colors group cursor-pointer"
                                                onClick={() => {
                                                    if (doc.isFolder) {
                                                        const newPath = currentFolder === "/" ? `/${doc.name}/` : `${currentFolder}${doc.name}/`;
                                                        navigateToFolder(newPath);
                                                    } else {
                                                        window.open(doc.url, '_blank');
                                                    }
                                                }}
                                            >
                                                <TableCell className="py-5 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-accent rounded-xl shrink-0">
                                                            {doc.isFolder ? (
                                                                <Folder className="h-4 w-4 text-primary" />
                                                            ) : (
                                                                <FileText className={cn('h-4 w-4', meta.color)} />
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-bold text-primary truncate max-w-xs">{doc.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {doc.isFolder ? (
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary">Carpeta</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className={cn('text-[9px] font-black uppercase border-accent', meta.color)}>
                                                            {meta.ext}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs font-mono text-muted-foreground">{!doc.isFolder && doc.size ? formatFileSize(doc.size) : '—'}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-[10px] font-semibold text-muted-foreground">{doc.authorName || '—'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                                        <span className="font-mono text-[10px] text-muted-foreground">
                                                            {new Date(doc.createdAt).toLocaleDateString('es-ES')}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center pr-4" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-card border-accent text-primary">
                                                            <DropdownMenuItem asChild className="text-xs flex items-center gap-2 cursor-pointer">
                                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                                    <ExternalLink className="h-3 w-3" /> Ver en Navegador
                                                                </a>
                                                            </DropdownMenuItem>
                                                            {!doc.isFolder && (
                                                                <DropdownMenuItem
                                                                    className="text-xs flex items-center gap-2 cursor-pointer"
                                                                    onClick={(e) => handleDownload(e, doc.url, doc.name)}
                                                                >
                                                                    <Download className="h-3 w-3" /> Descargar Archivo
                                                                </DropdownMenuItem>
                                                            )}
                                                            {canEdit && (
                                                                <>
                                                                    <DropdownMenuSeparator className="bg-accent" />
                                                                    <DropdownMenuItem
                                                                        className="text-xs text-destructive flex items-center gap-2 focus:bg-destructive/10 cursor-pointer"
                                                                        onClick={() => setDeleteTarget(doc)}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" /> Eliminar
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </div>

                {/* ── Footer stats ── */}
                {/* <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-accent">
                <div className="flex items-center gap-6 text-[10px] font-black uppercase text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span>{documents.length} documento{documents.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Total: {formatFileSize(totalSizeBytes)}</span>
                    </div>
                </div>
                <div className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                    {isAuthor ? (
                        <Badge variant="outline" className="border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">Autor del Proyecto</Badge>
                    ) : canEdit ? (
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-widest">Colaborador — Edición</Badge>
                    ) : (
                        <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-widest">Colaborador — Lectura</Badge>
                    )}
                </div>
            </div> */}

                {/* ── Delete Confirm Dialog ── */}
                <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!isDeleting) { if (!open) setDeleteTarget(null); } }}>
                    <DialogContent className="bg-card border-accent text-primary max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                                <Trash2 className="h-5 w-5 text-destructive" /> Eliminar Documento
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-sm pt-2">
                                ¿Estás seguro de que deseas eliminar <strong className="text-primary">"{deleteTarget?.name}"</strong>?
                                <br /><br />
                                El archivo será eliminado del registro del proyecto. Esta acción no se puede deshacer.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                variant="outline"
                                className="border-accent"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="font-black text-[10px] uppercase tracking-widest"
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                {isDeleting ? 'Eliminando...' : 'Confirmar Eliminación'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Folder Creation Dialog ── */}
                <Dialog open={isFolderModalOpen} onOpenChange={(open) => { if (!isCreatingFolder) setIsFolderModalOpen(open); }}>
                    <DialogContent className="bg-card border-accent text-primary max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                                <Folder className="h-5 w-5 text-primary" /> Nueva Carpeta
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-xs pt-1">
                                Se creará en: <strong className="text-primary">{currentFolder}</strong>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                placeholder="Nombre de la carpeta..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="bg-accent border-transparent h-10 text-sm font-bold"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                autoFocus
                            />
                        </div>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                className="border-accent flex-1 font-black text-[10px] uppercase tracking-widest h-10"
                                onClick={() => setIsFolderModalOpen(false)}
                                disabled={isCreatingFolder}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className="bg-primary hover:bg-primary/80 text-background flex-1 font-black text-[10px] uppercase tracking-widest h-10"
                                onClick={handleCreateFolder}
                                disabled={isCreatingFolder || !newFolderName.trim()}
                            >
                                {isCreatingFolder ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                                Crear
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div >
    );
}