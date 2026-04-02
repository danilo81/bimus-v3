// hooks/use-cloudflare-upload.ts
import { useState } from 'react';
import { toast } from 'sonner';
import { getUploadUrl, saveFileRecordToDB } from '@/actions/general/upload';

interface UseUploadOptions {
    projectId: string; // Puede ser un ID de proyecto o un identificador como "libreria-cad"
    onSuccess?: (document: any) => void;
    onError?: (error: Error) => void;
}

export function useCloudflareUpload({ projectId, onSuccess, onError }: UseUploadOptions) {
    const [isUploading, setIsUploading] = useState(false);

    const uploadFile = async (file: File) => {
        setIsUploading(true);

        try {
            // 1. Obtener la URL firmada (Presigned URL) de Cloudflare R2
            const urlRes = await getUploadUrl(file.name, file.type, file.size);

            if (!urlRes.success || !urlRes.uploadUrl) {
                throw new Error(urlRes.error || "Error al generar URL de subida");
            }

            // 2. Subir directamente el archivo desde el navegador a Cloudflare R2
            const uploadRes = await fetch(urlRes.uploadUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            if (!uploadRes.ok) {
                throw new Error("Fallo la subida al servidor de almacenamiento (R2)");
            }

            // 3. Registrar el archivo en la base de datos (Prisma)
            const dbRes = await saveFileRecordToDB({
                name: file.name,
                key: urlRes.fileKey!,
                url: urlRes.publicUrl!,
                size: file.size,
                mimeType: file.type,
                projectId: projectId,
            });

            if (!dbRes.success || !dbRes.document) {
                throw new Error(dbRes.error || "Error al guardar el registro en la base de datos");
            }

            // Ejecutar callback de éxito si existe
            if (onSuccess) onSuccess(dbRes.document);

            return dbRes.document;

        } catch (error: any) {
            console.error("Error en useCloudflareUpload:", error);
            if (onError) {
                onError(error);
            } else {
                toast.error(error.message || "Ocurrió un error inesperado al subir el archivo");
            }
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        uploadFile,
        isUploading
    };
}