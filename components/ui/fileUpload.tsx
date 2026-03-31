"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { getUploadUrl, saveFileRecordToDB } from '@/actions/upload';
import { CloudUpload, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
    projectId: string;
    onUploadComplete?: () => void;
}

export function FileUpload({ projectId, onUploadComplete }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fileName, setFileName] = useState('');
    const { toast } = useToast();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setProgress(0);
        setFileName(file.name);

        try {
            // 1. Pedir a nuestro Server Action la URL temporal de Cloudflare R2
            const urlResponse = await getUploadUrl(file.name, file.type, file.size);

            if (!urlResponse.success) {
                throw new Error(urlResponse.error);
            }

            // 2. Subir el archivo DIRECTAMENTE a Cloudflare R2 usando XMLHttpRequest 
            // (Usamos XHR en lugar de fetch para poder ver el % de progreso)
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', urlResponse.uploadUrl!, true);
                xhr.setRequestHeader('Content-Type', file.type);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setProgress(percentComplete);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        resolve(true);
                    } else {
                        reject(new Error('Error al subir a R2'));
                    }
                };

                xhr.onerror = () => reject(new Error('Error de red durante la subida'));
                xhr.send(file);
            });

            // 3. El archivo ya está en R2. Ahora guardamos el registro en nuestra BD (Prisma)
            const dbResponse = await saveFileRecordToDB({
                name: file.name,
                key: urlResponse.fileKey!,
                url: urlResponse.publicUrl!,
                size: file.size,
                mimeType: file.type || 'application/octet-stream', // Fallback para archivos raros como .ifc
                projectId: projectId
            });

            if (dbResponse.success) {
                toast({ title: "Archivo Subido", description: `${file.name} guardado correctamente.` });
                if (onUploadComplete) onUploadComplete();
            } else {
                throw new Error("No se pudo registrar en la base de datos");
            }

        } catch (error: any) {
            toast({ title: "Error en la subida", description: error.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
            setTimeout(() => setProgress(0), 1000);
        }
    }, [projectId, onUploadComplete, toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false, // Cámbialo a true si quieres permitir subidas múltiples en el futuro
        disabled: isUploading
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-[#0a0a0a]
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                <input {...getInputProps()} />

                {isUploading ? (
                    <div className="flex flex-col items-center space-y-4 w-full max-w-xs">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-xs font-black uppercase text-white">Subiendo {fileName}...</p>
                        <div className="w-full space-y-1">
                            <Progress value={progress} className="h-2" />
                            <p className="text-[10px] text-primary text-right font-mono font-bold">{progress}%</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-white/5 rounded-full mb-4">
                            <CloudUpload className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-sm font-bold uppercase text-white mb-1">
                            {isDragActive ? "Suelta el archivo aquí" : "Arrastra un archivo o haz clic"}
                        </p>
                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                            Soporta PDF, DWG, IFC, JPG, XLS (Máx 200MB)
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}