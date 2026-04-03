"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Search,
    Plus,
    Box,
    MoreVertical,
    Trash2,
    Eye,
    Download,
    RefreshCw,
    Loader2,
    Upload,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dropzone, FileWithMetadata } from "@/components/ui/dropzone";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStorageStats } from '@/actions';
import { Progress } from '@/components/ui/progress';

interface ModelAsset {
    id: string;
    key: string;
    name: string;
    size: number;
    mimeType: string;
    publicUrl: string;
    category?: string;
    lastModified: string;
    uploadedBy: string;
    uploadedById: string;
    isOwner: boolean;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals < 0 ? 0 : decimals)) + " " + sizes[i];
};

// ==========================================
// CONFIGURACIÓN DE EXTENSIONES PERMITIDAS (MODELOS 3D)
// Agrega o quita extensiones aquí para controlar qué archivos se pueden subir
// ==========================================
const MODELS_ALLOWED_EXTENSIONS = {
    // Catch-all genérico para extensiones de software 3D pesado que no tienen MIME específico registrado en navegadores
    "application/octet-stream": [".rvt", ".rfa", ".fbx", ".obj", ".ifc", ".skp", ".nwd", ".step", ".stp"],
    // Opcionales para renderizados u otros formatos BIM
    "model/vnd.collada+xml": [".dae"],
    "model/gltf-binary": [".glb"],
    "model/gltf+json": [".gltf"],
    "application/zip": [".zip"]
};

const getFileType = (name: string) => name.split('.').pop()?.toUpperCase() || 'MOD';

export default function ModelsLibraryPage() {
    const [assets, setAssets] = useState<ModelAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
    const [storageStats, setStorageStats] = useState<any>(null);
    const hasMultipleOwners = assets.some((a) => !a.isOwner);

    const fetchAssets = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/r2/list?type=models", {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.status === 401) {
                toast.error("Debes iniciar sesión para acceder a la librería");
                return;
            }

            const data = await response.json();

            if (data.success && data.files) {
                setAssets(data.files);
            } else {
                toast.error(data.error ?? "Error al cargar los modelos");
            }
        } catch (error) {
            console.error("Error loading models:", error);
            toast.error("Error de conexión al servidor");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        const res = await getStorageStats();
        if (res.success) setStorageStats(res);
    };

    useEffect(() => {
        fetchAssets();
        fetchStats();
    }, []);

    const handleDelete = async (key: string, name: string) => {
        if (!confirm(`¿Eliminar permanentemente "${name}"?`)) return;

        try {
            setIsDeletingId(key);
            const response = await fetch("/api/r2/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Modelo eliminado correctamente");
                setAssets((prev) => prev.filter((a) => a.key !== key));
                fetchStats();
            } else {
                toast.error(data.error ?? "Error al eliminar el modelo");
            }
        } catch (error) {
            toast.error("Error al eliminar el modelo");
        } finally {
            setIsDeletingId(null);
        }
    };

    const processedUploads = useRef<Set<string>>(new Set());

    const handleFilesChange = useCallback((newFiles: FileWithMetadata[]) => {
        const newlyFinished = newFiles.filter(
            (f) => !f.uploading && !f.error && f.publicUrl && !processedUploads.current.has(f.id)
        );

        if (newlyFinished.length > 0) {
            newlyFinished.forEach((f) => processedUploads.current.add(f.id));
            setTimeout(() => {
                fetchAssets();
                fetchStats();
            }, 800);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredAssets = assets.filter((a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border-accent w-fit">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <Box className="h-8 w-8 text-primary" /> Modelos BIM
                    </h1>
                    <p className="text-muted-foreground mt-1">Librería de Componentes y Familias 3D</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-muted/50 backdrop-blur-sm">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar componente o familia..."
                        className="pl-10 h-10 border-accent text-[12px] font-medium tracking-widest uppercase w-full bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                    {/* --- STORAGE STATS --- */}
                    {storageStats && (
                        <div className="rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shrink-0">
                            <div className="flex-1 w-full space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <p className="text-xs font-bold text-primary">
                                        {formatBytes(storageStats.used)} / {formatBytes(storageStats.total)}
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

                    {hasMultipleOwners && (
                        <Badge
                            variant="outline"
                            className="flex items-center gap-1.5 text-amber-400 border-amber-400/30 bg-amber-400/5 px-3 py-1.5"
                        >
                            <Shield className="h-3.5 w-3.5" />
                            Vista Administrador — todos los archivos
                        </Badge>
                    )}
                    <Button
                        onClick={() => fetchAssets()}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        className="h-10 px-4"
                    >
                        <RefreshCw className={cn("h-4 w-4 ", isLoading && "animate-spin")} />
                    </Button>
                    <Button
                        onClick={() => {
                            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                            if (fileInput) fileInput.click();
                        }}
                        className="bg-primary text-background font-black text-[10px] uppercase tracking-widest h-10 px-6 hover:bg-primary/40 truncate"
                        disabled={isLoading}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Subir Componente
                    </Button>
                </div>
            </div>

            {isLoading && assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                        Cargando modelos...
                    </p>
                </div>
            ) : filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                    <Box className="h-12 w-12 opacity-20" />
                    <p className="text-[10px] uppercase tracking-widest font-black">
                        {searchTerm ? "Sin resultados para la búsqueda" : "Aún no has subido archivos a la librería"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAssets.map((model) => (
                        <Card key={model.key} className="bg-card border-accent hover:border-primary/50 transition-all group p-0 overflow-hidden flex flex-col justify-between">
                            <CardHeader className="p-0 aspect-video bg-secondary flex items-center justify-center relative border-b border-accent h-44">
                                <Box className="h-16 w-16 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black uppercase tracking-widest">
                                        {getFileType(model.name)}
                                    </Badge>
                                </div>
                                {(model.isOwner || hasMultipleOwners) && (
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 bg-card rounded-md border border-accent backdrop-blur-md" disabled={isDeletingId === model.key}>
                                                    {isDeletingId === model.key ? (
                                                        <Loader2 className="h-3 w-3 animate-spin text-destructive" />
                                                    ) : (
                                                        <MoreVertical className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card border-white/10 p-1.5 rounded-xl">
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(model.key, model.name)}
                                                    className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 rounded-lg"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" /> Eliminar Permanente
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-1">
                                    <h3 title={model.name} className="text-sm font-bold uppercase truncate text-primary tracking-tight">{model.name}</h3>
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                                        <span className="truncate max-w-[50%]">{model.uploadedBy}</span>
                                        <span>{formatBytes(model.size)}</span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-accent flex items-center justify-between gap-3">
                                    <Button disabled variant="ghost" size="sm" className="flex-1 h-8 text-[9px] font-black uppercase tracking-widest hover:bg-accent opacity-50 cursor-not-allowed">
                                        <Eye className="h-3 w-3 mr-1.5" /> Ver 3D (Pronto)
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-primary/20 hover:text-primary shrink-0"
                                        onClick={() => {
                                            const downloadUrl = `/api/r2/file/${encodeURIComponent(model.key)}?download=true&name=${encodeURIComponent(model.name)}`;
                                            const link = document.createElement("a");
                                            link.href = downloadUrl;
                                            link.setAttribute("download", model.name);
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                        title="Descargar Modelo"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Hidden Dropzone Area handled by 'Subir Componente' button */}
            <div className="hidden">
                <Dropzone
                    provider="cloudflare-r2"
                    libraryType="models"
                    onFilesChange={handleFilesChange}
                    accept={MODELS_ALLOWED_EXTENSIONS}
                    maxSize={209715200} // Aumentado a 200MB para Modelos 3D
                    maxFiles={5}
                />
            </div>
        </div>
    );
}
