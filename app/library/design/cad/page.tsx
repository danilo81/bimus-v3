"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    PenTool,
    Search,
    FileCode,
    Download,
    MoreVertical,
    Trash2,
    Edit,
    Loader2,
    Upload,
    Eye,
    RefreshCw,
    User as UserIcon,
    Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dropzone, FileWithMetadata } from "@/components/ui/dropzone";
import { cn } from "@/lib/utils";

// Interface matching what the API now returns (from DB)
interface CadAsset {
    id: string;
    key: string;
    name: string;
    size: number;
    mimeType: string;
    lastModified?: string | Date;
    publicUrl: string;
    category: string;
    uploadedBy: string;
    uploadedById: string;
    isOwner: boolean;
}

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function CadLibraryPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [assets, setAssets] = useState<CadAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
    // If admin is viewing, the API will return files from multiple users
    const hasMultipleOwners = assets.some((a) => !a.isOwner);

    // Load files from DB via API
    const fetchAssets = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/r2/list?type=cad", {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                toast.error("Debes iniciar sesión para acceder a la librería");
                return;
            }

            const data = await response.json();

            if (data.success && data.files) {
                setAssets(data.files);
            } else {
                toast.error(data.error ?? "Error al cargar los archivos");
            }
        } catch (error) {
            console.error("Error loading files:", error);
            toast.error("Error de conexión al servidor");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
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
                toast.success("Archivo eliminado correctamente");
                setAssets((prev) => prev.filter((a) => a.key !== key));
            } else {
                toast.error(data.error ?? "Error al eliminar el archivo");
            }
        } catch (error) {
            toast.error("Error al eliminar el archivo");
        } finally {
            setIsDeletingId(null);
        }
    };

    // When new uploads finish, refresh the asset list so the DB record appears
    const handleFilesChange = (newFiles: FileWithMetadata[]) => {
        const justFinished = newFiles.filter(
            (f) => !f.uploading && !f.error && f.publicUrl
        );
        if (justFinished.length > 0) {
            // Small delay so the DB record is committed before we re-fetch
            setTimeout(() => fetchAssets(), 800);
        }
    };

    const filteredAssets = assets.filter((a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <PenTool className="h-8 w-8 text-primary" /> Librería CAD
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestión de Bloques y Detalles Técnicos — Cloudflare R2
                    </p>
                </div>
                {hasMultipleOwners && (
                    <Badge
                        variant="outline"
                        className="flex items-center gap-1.5 text-amber-400 border-amber-400/30 bg-amber-400/5 px-3 py-1.5"
                    >
                        <Shield className="h-3.5 w-3.5" />
                        Vista Administrador — todos los archivos
                    </Badge>
                )}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-card p-4 rounded-xl border border-muted/50">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar bloque o detalle..."
                        className="pl-10 h-10 bg-card border-accent text-[12px] tracking-widest uppercase"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                        {assets.length} archivo{assets.length !== 1 ? "s" : ""}
                    </span>
                    <Button
                        onClick={() => fetchAssets()}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        className="h-10 px-4"
                    >
                        <RefreshCw
                            className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
                        />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* File Table */}
            <Card className="bg-card border-accent overflow-hidden p-0">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-accent hover:bg-transparent">
                                <TableHead className="py-5 px-8 text-[11px] font-black uppercase text-muted-foreground tracking-widest">
                                    Archivo
                                </TableHead>
                                <TableHead className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">
                                    Categoría
                                </TableHead>
                                {hasMultipleOwners && (
                                    <TableHead className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">
                                        Subido por
                                    </TableHead>
                                )}
                                <TableHead className="text-[11px] font-black uppercase text-muted-foreground tracking-widest text-center">
                                    Fecha
                                </TableHead>
                                <TableHead className="text-[11px] font-black uppercase text-muted-foreground tracking-widest text-right">
                                    Tamaño
                                </TableHead>
                                <TableHead className="text-[11px] font-black uppercase text-muted-foreground tracking-widest text-center">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && assets.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={hasMultipleOwners ? 6 : 5}
                                        className="py-20 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                                Cargando librería...
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredAssets.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={hasMultipleOwners ? 6 : 5}
                                        className="py-20 text-center text-muted-foreground"
                                    >
                                        <div className="flex flex-col items-center gap-4">
                                            <FileCode className="h-12 w-12 opacity-20" />
                                            <p className="text-[10px] uppercase tracking-widest font-black">
                                                {searchTerm
                                                    ? "Sin resultados para la búsqueda"
                                                    : "Aún no has subido archivos a la librería CAD"}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <TableRow
                                        key={asset.key}
                                        className="border-accent hover:bg-white/[0.02] transition-colors group"
                                    >
                                        {/* Nombre */}
                                        <TableCell className="py-5 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/10 group-hover:border-primary/30 transition-colors">
                                                    <FileCode className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold tracking-tight text-foreground truncate max-w-[220px] md:max-w-xs">
                                                        {asset.name}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                                                        {asset.mimeType}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Categoría */}
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] font-black uppercase border-white/5 bg-white/[0.03] tracking-tighter"
                                            >
                                                {asset.category}
                                            </Badge>
                                        </TableCell>

                                        {/* Subido por (solo visible para admin) */}
                                        {hasMultipleOwners && (
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                    <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                                                        {asset.uploadedBy}
                                                    </span>
                                                    {asset.isOwner && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[9px] px-1.5 py-0"
                                                        >
                                                            Tú
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}

                                        {/* Fecha */}
                                        <TableCell className="text-center font-mono text-[11px] text-muted-foreground">
                                            {asset.lastModified
                                                ? new Date(asset.lastModified).toLocaleDateString(
                                                    "es-ES",
                                                    { day: "2-digit", month: "short", year: "numeric" }
                                                )
                                                : "—"}
                                        </TableCell>

                                        {/* Tamaño */}
                                        <TableCell className="text-right font-mono text-[11px] text-muted-foreground font-bold">
                                            {formatFileSize(asset.size)}
                                        </TableCell>

                                        {/* Acciones */}
                                        <TableCell className="px-8">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-primary/20 text-primary"
                                                    onClick={() =>
                                                        window.open(asset.publicUrl, "_blank")
                                                    }
                                                    title="Ver en nueva pestaña"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-primary/20 text-primary"
                                                    onClick={() => {
                                                        const link = document.createElement("a");
                                                        link.href = asset.publicUrl;
                                                        link.download = asset.name;
                                                        link.click();
                                                    }}
                                                    title="Descargar"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                {/* Menú contextual — solo si eres dueño o admin */}
                                                {(asset.isOwner || hasMultipleOwners) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:bg-white/10"
                                                                disabled={isDeletingId === asset.key}
                                                            >
                                                                {isDeletingId === asset.key ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                                                                ) : (
                                                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                                )}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="bg-card border-white/10 p-1.5 rounded-xl"
                                                        >
                                                            <DropdownMenuItem className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer focus:bg-primary/10 rounded-lg">
                                                                <Edit className="h-3.5 w-3.5" /> Editar
                                                                Metadata
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleDelete(asset.key, asset.name)
                                                                }
                                                                className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 rounded-lg"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" /> Eliminar
                                                                Permanente
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Upload zone */}
            <div className="pt-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold">Subida Directa a R2</h2>
                    </div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                        Máx. 100 MB por archivo
                    </p>
                </div>

                <Dropzone
                    provider="cloudflare-r2"
                    onFilesChange={handleFilesChange}
                    accept={{
                        "image/vnd.dwg": [".dwg"],
                        "image/vnd.dxf": [".dxf"],
                        "application/acad": [".dwg"],
                        "image/png": [".png"],
                        "image/jpeg": [".jpg", ".jpeg"],
                        "application/pdf": [".pdf"],
                    }}
                    maxSize={104857600}
                    maxFiles={5}
                />
            </div>
        </div>
    );
}
