// "use client";

// import { useState, useEffect } from 'react';
// import { useDropzone } from 'react-dropzone';
// import { toast } from "sonner";
// import { getUploadUrl, saveFileRecordToDB } from "@/actions/general/upload";
// import {
//     PenTool,
//     Search,
//     Plus,
//     FileCode,
//     Download,
//     MoreVertical,
//     Filter,
//     Layers,
//     Trash2,
//     Edit,
//     Globe,
//     Info,
//     Loader2,
//     Upload,
//     Eye
// } from "lucide-react";
// import { Button } from "../../../../components/ui/button";
// import { Input } from "../../../../components/ui/input";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
// import { Badge } from "../../../../components/ui/badge";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger
// } from '../../../../components/ui/dropdown-menu';
// import { ScrollArea } from '../../../../components/ui/scroll-area';
// import { Dropzone, FileWithMetadata } from '@/components/ui/dropzone';


// // Interfaz para tipar los archivos obtenidos de la base de datos
// interface CadAsset {
//     id: string;
//     name: string;
//     category?: string;
//     size: number | string;
//     version?: string;
//     author?: string;
//     url?: string;
// }

// const formatFileSize = (bytes: number) => {
//     if (bytes === 0) return "0 Bytes";
//     const k = 1024;
//     const sizes = ["Bytes", "KB", "MB", "GB"];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
// };

// const getFileIcon = (type: string) => {
//     if (type.startsWith("image/")) return "🖼️";
//     if (type.includes("pdf")) return "📄";
//     if (type.includes("word")) return "📝";
//     if (type.includes("zip")) return "📦";
//     return "📁";
// };

// export default function CadLibraryPage() {
//     const [searchTerm, setSearchTerm] = useState('');
//     const [isUploading, setIsUploading] = useState(false);
//     const [assets, setAssets] = useState<CadAsset[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [files, setFiles] = useState<FileWithMetadata[]>([]);
//     console.log(files);

//     // Carga inicial de archivos desde la base de datos
//     useEffect(() => {
//         const fetchAssets = async () => {
//             try {
//                 setIsLoading(true);
//                 // TODO: Aquí debes llamar a tu server action real para obtener los documentos de esta librería
//                 // Ejemplo: const data = await getProjectDocuments("libreria-cad-global");
//                 // setAssets(data);

//                 // Inicializamos vacío por ahora
//                 setAssets([]);
//             } catch (error) {
//                 console.error("Error al cargar los archivos:", error);
//                 toast.error("Error al cargar la librería CAD");
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         fetchAssets();
//     }, []);

//     // Utilidad para formatear los bytes que devuelve Prisma a texto legible
//     const formatBytes = (bytes: number | string) => {
//         const size = Number(bytes);
//         if (isNaN(size)) return bytes; // Si ya viene formateado como string
//         if (size === 0) return '0 Bytes';
//         const k = 1024;
//         const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//         const i = Math.floor(Math.log(size) / Math.log(k));
//         return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//     };

//     const onDrop = async (acceptedFiles: File[]) => {
//         const file = acceptedFiles[0];
//         if (!file) return;

//         setIsUploading(true);
//         try {
//             // 1. Obtener URL firmada desde el servidor
//             const urlRes = await getUploadUrl(file.name, file.type, file.size);

//             if (!urlRes.success || !urlRes.uploadUrl) {
//                 throw new Error(urlRes.error || "Error al generar URL de subida");
//             }

//             // 2. Subir directamente a Cloudflare R2
//             const uploadRes = await fetch(urlRes.uploadUrl, {
//                 method: "PUT",
//                 body: file,
//                 headers: { "Content-Type": file.type },
//             });

//             if (!uploadRes.ok) throw new Error("Fallo la subida al servidor de almacenamiento");

//             // 3. Guardar registro en la base de datos
//             const dbRes = await saveFileRecordToDB({
//                 name: file.name,
//                 key: urlRes.fileKey!,
//                 url: urlRes.publicUrl!,
//                 size: file.size,
//                 mimeType: file.type,
//                 projectId: "libreria-cad-global", // Ajusta este ID según tu lógica de negocio
//             });

//             if (dbRes.success && dbRes.document) {
//                 toast.success("Archivo CAD subido correctamente");

//                 // 4. Agregar el nuevo archivo al estado local para que aparezca instantáneamente
//                 setAssets(prev => [{
//                     id: dbRes.document.id,
//                     name: dbRes.document.name,
//                     size: dbRes.document.size,
//                     url: dbRes.document.url,
//                     category: 'Sin Categoría', // Categoría por defecto hasta que la editen
//                     version: 'v1.0',
//                     author: 'Usuario' // Idealmente viene de la relación del usuario en BD
//                 }, ...prev]);
//             } else {
//                 throw new Error(dbRes.error || "Error al registrar en la base de datos");
//             }

//         } catch (error: any) {
//             toast.error(error.message);
//         } finally {
//             setIsUploading(false);
//         }
//     };
//     const [s3Files, setS3Files] = useState<FileWithMetadata[]>([]);
//     const [r2Files, setR2Files] = useState<FileWithMetadata[]>([]);
//     const [activeProvider, setActiveProvider] = useState<"aws-s3" | "cloudflare-r2">("aws-s3");
//     const currentFiles = activeProvider === "aws-s3" ? s3Files : r2Files;
//     const { getRootProps, getInputProps } = useDropzone({
//         onDrop,
//         accept: {
//             'image/vnd.dwg': ['.dwg'],
//             'image/vnd.dxf': ['.dxf'],
//             'application/acad': ['.dwg']
//         },
//         multiple: false
//     });

//     return (
//         <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
//             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//                 <div>
//                     <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
//                         <PenTool className="h-8 w-8 text-primary" /> Librería CAD
//                     </h1>
//                     <p className="text-muted-foreground mt-1 ">Bloques y Detalles Técnicos Maestro</p>
//                 </div>
//             </div>

//             <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-card p-4 rounded-xl border border-muted/50 backdrop-blur-sm">
//                 <div className="relative flex-1 max-w-md bg-card">
//                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                     <Input
//                         placeholder="Buscar bloque o detalle..."
//                         className="pl-10 h-10 bg-card border-accent text-[12px] tracking-widest"
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                 </div>

//                 <div {...getRootProps()} className="flex items-center gap-3 cursor-pointer">
//                     <input {...getInputProps()} />
//                     <Button
//                         disabled={isUploading}
//                         className="bg-primary text-background font-black text-[10px] uppercase tracking-widest h-10 px-6 hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                         {isUploading ? (
//                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         ) : (
//                             <Plus className="mr-2 h-4 w-4" />
//                         )}
//                         {isUploading ? "Subiendo..." : "Nuevo Bloque"}
//                     </Button>
//                     <Button
//                         disabled={isUploading}
//                         className="bg-primary text-background font-black text-[10px] uppercase tracking-widest h-10 px-6 hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                         {isUploading ? (
//                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         ) : (
//                             <Plus className="mr-2 h-4 w-4" />
//                         )}
//                         {isUploading ? "Subiendo..." : "Nuevo Bloque"}
//                     </Button>
//                 </div>
//             </div>

//             <Card className="bg-card border-accent overflow-hidden p-0">
//                 <CardContent className="p-0">
//                     <Table>
//                         <TableHeader className="bg-muted/50 p-0 ">
//                             <TableRow className="border-accent hover:bg-transparent">
//                                 <TableHead className="py-5 px-8 text-[12px] font-black uppercase text-muted-foreground">Nombre del Archivo</TableHead>
//                                 <TableHead className="text-[12px] font-black uppercase text-muted-foreground">Categoría</TableHead>
//                                 <TableHead className="text-[12px] font-black uppercase text-muted-foreground text-center">Versión</TableHead>
//                                 <TableHead className="text-[12px] font-black uppercase text-muted-foreground text-right">Tamaño</TableHead>
//                                 <TableHead className="text-[12px] font-black uppercase text-muted-foreground text-center pl-16"> Acciones</TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                             {isLoading ? (
//                                 <TableRow>
//                                     <TableCell colSpan={5} className="py-12 text-center">
//                                         <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
//                                     </TableCell>
//                                 </TableRow>
//                             ) : assets.length === 0 ? (
//                                 <TableRow>
//                                     <TableCell colSpan={5} className="py-12 text-center text-muted-foreground text-[10px] uppercase tracking-widest font-black">
//                                         No hay bloques CAD registrados
//                                     </TableCell>
//                                 </TableRow>
//                             ) : (
//                                 assets.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map((asset) => (
//                                     <TableRow key={asset.id} className="border-accent hover:bg-accent/3 transition-colors group">
//                                         <TableCell className="py-6 px-8">
//                                             <div className="flex items-center gap-4">
//                                                 <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
//                                                     <FileCode className="h-5 w-5 text-blue-500" />
//                                                 </div>
//                                                 <div className="flex flex-col">
//                                                     <span className="text-sm font-black uppercase tracking-tight text-primary group-hover:text-primary transition-colors">{asset.name}</span>
//                                                     <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Autor: {asset.author || 'Usuario'}</span>
//                                                 </div>
//                                             </div>
//                                         </TableCell>
//                                         <TableCell>
//                                             <Badge variant="outline" className="text-[12px] font-black uppercase border-white/10 bg-white/5">
//                                                 {asset.category || 'Sin Categoría'}
//                                             </Badge>
//                                         </TableCell>
//                                         <TableCell className="text-center font-mono text-[12px] text-primary font-bold">{asset.version || 'v1.0'}</TableCell>
//                                         <TableCell className="text-right font-mono text-[12px] text-muted-foreground">{formatBytes(asset.size)}</TableCell>
//                                         <TableCell className="text-right px-8 ">
//                                             <div className="flex items-center justify-end gap-2">
//                                                 <Button
//                                                     variant="ghost"
//                                                     size="icon"
//                                                     className="h-8 w-8 hover:bg-white/10 text-primary"
//                                                     onClick={() => asset.url && window.open(asset.url, '_blank')}
//                                                 >
//                                                     <Download className="h-4 w-4" />
//                                                 </Button>
//                                                 <DropdownMenu>
//                                                     <DropdownMenuTrigger asChild>
//                                                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
//                                                             <MoreVertical className="h-4 w-4 text-muted-foreground" />
//                                                         </Button>
//                                                     </DropdownMenuTrigger>
//                                                     <DropdownMenuContent align="end" className="bg-card border-white/10 text-primary p-1.5 rounded-xl">
//                                                         <DropdownMenuItem className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer focus:bg-primary/10 rounded-lg">
//                                                             <Edit className="h-3.5 w-3.5" /> Editar Datos
//                                                         </DropdownMenuItem>
//                                                         <DropdownMenuItem className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 rounded-lg">
//                                                             <Trash2 className="h-3.5 w-3.5" /> Eliminar
//                                                         </DropdownMenuItem>
//                                                     </DropdownMenuContent>
//                                                 </DropdownMenu>
//                                             </div>
//                                         </TableCell>
//                                     </TableRow>
//                                 ))
//                             )}
//                         </TableBody>
//                     </Table>
//                     <Dropzone
//                         provider="cloudflare-r2"
//                         onFilesChange={(files) => setFiles(files)}
//                         accept={{
//                             "image/vnd.dwg": [".dwg"],
//                             "image/vnd.dxf": [".dxf"],
//                             "application/acad": [".dwg"],
//                         }}
//                         maxSize={10485760}
//                         maxFiles={1}
//                         className="mt-6 border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:bg-muted/20 transition-colors cursor-pointer"
//                     >
//                         <div className="flex flex-col items-center gap-2">
//                             <Upload className="h-12 w-12 text-muted-foreground" />
//                             <p className="text-sm font-medium text-foreground">
//                                 Arrastra y suelta archivos DWG/DXF aquí
//                             </p>
//                             <p className="text-xs text-muted-foreground">
//                                 o haz clic para seleccionar archivos
//                             </p>
//                         </div>
//                     </Dropzone>
//                 </CardContent>
//             </Card>
//             {/* File Management Table */}
//             <Card>
//                 <CardHeader>
//                     <CardTitle className="flex items-center justify-between">
//                         <span>Uploaded Files ({currentFiles.length})</span>
//                         <Badge variant="outline">
//                             {activeProvider === "aws-s3" ? "AWS S3" : "Cloudflare R2"}
//                         </Badge>
//                     </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     {currentFiles.length === 0 ? (
//                         <div className="text-center py-8 text-muted-foreground">
//                             No files uploaded yet. Use the dropzone above to upload files.
//                         </div>
//                     ) : (
//                         <Table>
//                             <TableHeader>
//                                 <TableRow>
//                                     <TableHead className="w-[50px]">Type</TableHead>
//                                     <TableHead>Filename</TableHead>
//                                     <TableHead>Size</TableHead>
//                                     <TableHead>Status</TableHead>
//                                     <TableHead>Progress</TableHead>
//                                     <TableHead className="text-right">Actions</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                                 {currentFiles.map((file) => (
//                                     <TableRow key={file.id}>
//                                         <TableCell>
//                                             <span className="text-2xl">
//                                                 {getFileIcon(file.file.type)}
//                                             </span>
//                                         </TableCell>
//                                         <TableCell className="font-medium max-w-[200px] truncate">
//                                             {file.file.name}
//                                         </TableCell>
//                                         <TableCell>{formatFileSize(file.file.size)}</TableCell>
//                                         <TableCell>
//                                             {file.error ? (
//                                                 <Badge variant="destructive">Error</Badge>
//                                             ) : file.uploading ? (
//                                                 <Badge variant="secondary">Uploading</Badge>
//                                             ) : file.isDeleting ? (
//                                                 <Badge variant="secondary">Deleting</Badge>
//                                             ) : (
//                                                 <Badge variant="default">Completed</Badge>
//                                             )}
//                                         </TableCell>
//                                         <TableCell>
//                                             {file.uploading ? (
//                                                 <div className="flex items-center gap-2">
//                                                     <div className="w-20 bg-muted rounded-full h-2">
//                                                         <div
//                                                             className="bg-primary h-2 rounded-full transition-all duration-300"
//                                                             style={{ width: `${file.progress}%` }}
//                                                         />
//                                                     </div>
//                                                     <span className="text-sm text-muted-foreground">
//                                                         {file.progress}%
//                                                     </span>
//                                                 </div>
//                                             ) : file.error ? (
//                                                 <span className="text-sm text-destructive">Failed</span>
//                                             ) : (
//                                                 <span className="text-sm text-muted-foreground">Complete</span>
//                                             )}
//                                         </TableCell>
//                                         <TableCell className="text-right">
//                                             <div className="flex items-center gap-1 justify-end">
//                                                 {file.objectUrl && file.file.type.startsWith("image/") && (
//                                                     <Button
//                                                         variant="ghost"
//                                                         size="sm"
//                                                         onClick={() => window.open(file.objectUrl, '_blank')}
//                                                         disabled={file.uploading || file.isDeleting}
//                                                     >
//                                                         <Eye className="h-4 w-4" />
//                                                     </Button>
//                                                 )}
//                                                 <Button
//                                                     variant="ghost"
//                                                     size="sm"
//                                                     onClick={() => {
//                                                         const link = document.createElement('a');
//                                                         link.href = file.objectUrl!;
//                                                         link.download = file.file.name;
//                                                         link.click();
//                                                     }}
//                                                     disabled={file.uploading || file.isDeleting}
//                                                 >
//                                                     <Download className="h-4 w-4" />
//                                                 </Button>
//                                                 <Button
//                                                     variant="ghost"
//                                                     size="sm"
//                                                     onClick={() => {
//                                                         // This would call the removeFile function from the Dropzone component
//                                                         // For demo purposes, we'll show how it would work
//                                                         console.log('Delete file:', file.id);
//                                                     }}
//                                                     disabled={file.uploading || file.isDeleting}
//                                                     className="text-destructive hover:text-destructive"
//                                                 >
//                                                     <Trash2 className="h-4 w-4" />
//                                                 </Button>
//                                             </div>
//                                         </TableCell>
//                                     </TableRow>
//                                 ))}
//                             </TableBody>
//                         </Table>
//                     )}
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }

// app/demo/page.tsx
"use client";

import { useState } from "react";
import { Dropzone, FileWithMetadata } from "@/components/ui/dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Download, Eye } from "lucide-react";

export default function DemoPage() {
    const [s3Files, setS3Files] = useState<FileWithMetadata[]>([]);
    const [r2Files, setR2Files] = useState<FileWithMetadata[]>([]);
    const [activeProvider, setActiveProvider] = useState<"aws-s3" | "cloudflare-r2">("aws-s3");

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith("image/")) return "🖼️";
        if (type.includes("pdf")) return "📄";
        if (type.includes("word")) return "📝";
        if (type.includes("zip")) return "📦";
        return "📁";
    };

    const currentFiles = activeProvider === "aws-s3" ? s3Files : r2Files;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">File Upload Demo</h1>
                <p className="text-muted-foreground">
                    Test file uploads with AWS S3 and Cloudflare R2 using our reusable dropzone component.
                </p>
            </div>

            <Tabs value={activeProvider} onValueChange={(v) => setActiveProvider(v as any)} className="mb-8">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="aws-s3">AWS S3</TabsTrigger>
                    <TabsTrigger value="cloudflare-r2">Cloudflare R2</TabsTrigger>
                </TabsList>

                <TabsContent value="aws-s3" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>AWS S3 Upload</span>
                                <Badge variant="secondary">Reliable & Mature</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Dropzone
                                provider="aws-s3"
                                variant="default"
                                maxFiles={10}
                                maxSize={1024 * 1024 * 50} // 50MB
                                onFilesChange={setS3Files}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cloudflare-r2" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>Cloudflare R2 Upload</span>
                                <Badge variant="secondary">Cost Effective</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Dropzone
                                provider="cloudflare-r2"
                                variant="default"
                                maxFiles={10}
                                maxSize={1024 * 1024 * 50} // 50MB
                                onFilesChange={setR2Files}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* File Management Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Uploaded Files ({currentFiles.length})</span>
                        <Badge variant="outline">
                            {activeProvider === "aws-s3" ? "AWS S3" : "Cloudflare R2"}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {currentFiles.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No files uploaded yet. Use the dropzone above to upload files.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Type</TableHead>
                                    <TableHead>Filename</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentFiles.map((file) => (
                                    <TableRow key={file.id}>
                                        <TableCell>
                                            <span className="text-2xl">
                                                {getFileIcon(file.file.type)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[200px] truncate">
                                            {file.file.name}
                                        </TableCell>
                                        <TableCell>{formatFileSize(file.file.size)}</TableCell>
                                        <TableCell>
                                            {file.error ? (
                                                <Badge variant="destructive">Error</Badge>
                                            ) : file.uploading ? (
                                                <Badge variant="secondary">Uploading</Badge>
                                            ) : file.isDeleting ? (
                                                <Badge variant="secondary">Deleting</Badge>
                                            ) : (
                                                <Badge variant="default">Completed</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {file.uploading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 bg-muted rounded-full h-2">
                                                        <div
                                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${file.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        {file.progress}%
                                                    </span>
                                                </div>
                                            ) : file.error ? (
                                                <span className="text-sm text-destructive">Failed</span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Complete</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center gap-1 justify-end">
                                                {(file.publicUrl || file.objectUrl) && file.file.type.startsWith("image/") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => window.open(file.publicUrl || file.objectUrl, '_blank')}
                                                        disabled={file.uploading || file.isDeleting}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const link = document.createElement('a');
                                                        link.href = file.publicUrl || file.objectUrl!;
                                                        link.download = file.file.name;
                                                        link.click();
                                                    }}
                                                    disabled={file.uploading || file.isDeleting}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        // This would call the removeFile function from the Dropzone component
                                                        // For demo purposes, we'll show how it would work
                                                        console.log('Delete file:', file.id);
                                                    }}
                                                    disabled={file.uploading || file.isDeleting}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{currentFiles.length}</div>
                        <p className="text-xs text-muted-foreground">Total Files</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                            {formatFileSize(
                                currentFiles.reduce((total, file) => total + file.file.size, 0)
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Total Size</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                            {currentFiles.filter(f => !f.uploading && !f.error).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Completed</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
