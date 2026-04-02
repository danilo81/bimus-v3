'use server';

import prisma from "@/lib/prisma";
import { r2Client } from "@/lib/r2Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

function constructPublicUrl(key: string): string {
    const publicUrlEnv = process.env.R2_PUBLIC_URL_PUBLIC || process.env.R2_PUBLIC_URL;
    const base = publicUrlEnv || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    if (base) {
        return `${base.endsWith("/") ? base : base + "/"}${encodeURIComponent(key)}`;
    }
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || "";
    const match = endpoint.match(/https:\/\/([a-z0-9]+)\.r2\.cloudflarestorage\.com/);
    const accountId = match ? match[1] : "";
    return `https://pub-${accountId}.r2.dev/${encodeURIComponent(key)}`;
}

export async function saveBimTemplateToCloud(projectId: string, templateName: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) throw new Error("No autorizado");

        // 1. Fetch all topics for the project
        const doc = await prisma.bimDocument.findUnique({
            where: { projectId },
            include: { topics: true }
        });

        if (!doc) throw new Error("Documento BIM no encontrado");

        // 2. Serialize to JSON
        const topicsData = doc.topics.map(t => ({
            id: t.id,
            parentId: t.parentId,
            title: t.title,
            content: t.content,
            order: t.order,
            status: t.status
        }));

        const jsonContent = JSON.stringify(topicsData);
        const buffer = Buffer.from(jsonContent, 'utf-8');

        // 3. Upload to R2
        const uniqueKey = `${uuidv4()}-bim-template.json`;
        const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME_PUBLIC || process.env.CLOUDFLARE_R2_BUCKET_NAME;

        const command = new PutObjectCommand({
            Bucket: bucketName!,
            Key: uniqueKey,
            ContentType: 'application/json',
            Body: buffer,
            ContentLength: buffer.length,
        });

        await r2Client.send(command);

        const publicUrl = constructPublicUrl(uniqueKey);

        // 4. Save to LibraryFile
        const libraryFile = await prisma.libraryFile.create({
            data: {
                userId: userId,
                r2Key: uniqueKey,
                name: templateName,
                size: buffer.length,
                mimeType: 'application/json',
                publicUrl: publicUrl,
                category: 'BIM Template',
                libraryType: 'bim_template',
            }
        });

        return { success: true, file: libraryFile };
    } catch (error: any) {
        console.error('Error saving template:', error);
        return { success: false, error: error.message || 'Fallo al guardar la plantilla.' };
    }
}
