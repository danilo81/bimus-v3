"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth"; // Ajusta según tu autenticación
import prisma from "@/lib/prisma";

// Inicializamos el cliente de S3 apuntando a Cloudflare R2
const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export async function getUploadUrl(fileName: string, fileType: string, fileSize: number) {
    try {
        const session = await getSession();
        if (!session?.user?.id) throw new Error("No autorizado");

        // Validar el tamaño máximo (Ej: 200MB)
        const MAX_FILE_SIZE = 200 * 1024 * 1024;
        if (fileSize > MAX_FILE_SIZE) throw new Error("El archivo excede el límite de 200MB");

        // Generar un nombre único para evitar colisiones en el bucket
        const uniqueId = crypto.randomUUID();
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, ""); // Limpiar caracteres raros
        const fileKey = `proyectos/${uniqueId}-${cleanFileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: fileKey,
            ContentType: fileType,
        });

        // Generamos la URL firmada válida por 1 hora (3600 segundos)
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        return {
            success: true,
            uploadUrl: signedUrl,
            fileKey: fileKey,
            publicUrl: `${process.env.R2_PUBLIC_URL}/${fileKey}`
        };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Esta acción se llama DESPUÉS de que el frontend terminó de subir el archivo a R2
export async function saveFileRecordToDB(data: { name: string, key: string, url: string, size: number, mimeType: string, projectId: string }) {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("No autorizado");

    try {
        const newDoc = await prisma.document.create({
            data: {
                name: data.name,
                originalName: data.name,
                url: data.url,
                key: data.key,
                size: data.size,
                mimeType: data.mimeType,
                projectId: data.projectId,
                uploadedById: session.user.id,
            }
        });
        return { success: true, document: newDoc };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Error al guardar en base de datos" };
    }
}