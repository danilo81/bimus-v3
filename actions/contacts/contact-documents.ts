'use server';

import { cookies } from 'next/headers';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '@/lib/r2Client';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

async function getCurrentUserId(): Promise<string> {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) throw new Error('No autorizado');
    return userId;
}

function buildPublicUrl(key: string): string {
    const base = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (base) return `${base.endsWith('/') ? base : base + '/'}${encodeURIComponent(key)}`;
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || '';
    const match = endpoint.match(/https:\/\/([a-z0-9]+)\.r2\.cloudflarestorage\.com/);
    const accountId = match ? match[1] : '';
    return `https://pub-${accountId}.r2.dev/${encodeURIComponent(key)}`;
}

/** Genera una presigned URL para subir un PDF de contacto + crea el registro en BD */
export async function getContactDocumentUploadUrl(
    contactId: string,
    fileName: string,
    contentType: string,
    fileSize: number,
) {
    await getCurrentUserId();

    const r2Key = `contacts/${contactId}/${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        Key: r2Key,
        ContentType: contentType,
        ContentLength: fileSize,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    const publicUrl = buildPublicUrl(r2Key);

    // Crear registro en BD
    const doc = await prisma.contactDocument.create({
        data: {
            contactId,
            r2Key,
            name: fileName,
            size: fileSize,
            mimeType: contentType,
            publicUrl,
        },
    });

    return { success: true, presignedUrl, doc };
}

/** Elimina un documento de contacto de R2 y de la BD */
export async function deleteContactDocument(documentId: string) {
    await getCurrentUserId();

    const doc = await prisma.contactDocument.findUnique({ where: { id: documentId } });
    if (!doc) return { success: false, error: 'Documento no encontrado' };

    // Eliminar de R2
    await r2Client.send(new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        Key: doc.r2Key,
    }));

    // Eliminar de BD
    await prisma.contactDocument.delete({ where: { id: documentId } });

    return { success: true };
}

/** Obtiene todos los documentos de un contacto */
export async function getContactDocuments(contactId: string) {
    await getCurrentUserId();

    const docs = await prisma.contactDocument.findMany({
        where: { contactId },
        orderBy: { createdAt: 'desc' },
    });

    return docs;
}
