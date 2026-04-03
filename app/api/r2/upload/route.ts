import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client } from "@/lib/r2Client";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const uploadRequestSchema = z.object({
    filename: z.string(),
    contentType: z.string(),
    size: z.number(),
    libraryType: z.string().optional(),
    projectId: z.string().optional(),
    folder: z.string().optional(),
});
function constructCloudflareR2Url(
    key: string,
    bucketName: string,
    customDomain?: string
): string {
    const publicBaseUrl = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    if (publicBaseUrl) {
        return `${publicBaseUrl.endsWith("/") ? publicBaseUrl : publicBaseUrl + "/"}${encodeURIComponent(key)}`;
    }
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || "";
    const match = endpoint.match(/https:\/\/([a-z0-9]+)\.r2\.cloudflarestorage\.com/);
    const accountId = match ? match[1] : "";
    return `https://pub-${accountId}.r2.dev/${encodeURIComponent(key)}`;
}

export async function POST(request: NextRequest) {
    try {
        // Leer userId de la cookie (sistema de auth propio del proyecto)
        const userId = request.cookies.get("userId")?.value;

        if (!userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const validation = uploadRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }
        
        const { filename, contentType, size, libraryType, projectId, folder } = validation.data;
        console.log(`[API/R2/UPLOAD] Request for ${filename}, size: ${size}, type: ${libraryType}, folder: ${folder}`);

        // --- ENFORCE STORAGE LIMIT --- 
        // 1. Get user's current limit
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { storageLimit: true } as any
        }) as any;

        if (!user) {
            console.error(`[API/R2/UPLOAD] User ${userId} not found`);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Parse limit (helper logic reused from action or placed here)
        const limitStr = user.storageLimit || '1GB';
        let limitBytes = 1024 * 1024 * 1024;
        const match = limitStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]B|[B])$/i);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            const multipliers: Record<string, number> = {
                'B': 1, 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024, 'TB': 1024 * 1024 * 1024 * 1024
            };
            limitBytes = value * (multipliers[unit] || multipliers['GB']);
        }

        // 3. Calculate current usage
        console.log(`[API/R2/UPLOAD] Checking storage for user ${userId}...`);
        const librarySum = await prisma.libraryFile.aggregate({ where: { userId }, _sum: { size: true } }) as any;
        const projectSum = await (prisma.projectDocument.aggregate as any)({ where: { userId }, _sum: { size: true } }) as any;
        const currentUsed = (librarySum._sum.size || 0) + (projectSum._sum.size || 0);

        console.log(`[API/R2/UPLOAD] Usage: ${currentUsed} / ${limitBytes}`);

        // 4. Check if new file exceeds limit
        if (currentUsed + size > limitBytes) {
            return NextResponse.json({ 
                error: "Límite de almacenamiento excedido",
                used: currentUsed,
                limit: limitBytes,
                requested: size
            }, { status: 403 });
        }
        // -----------------------------
        const uniqueKey = `${uuidv4()}-${filename}`;

        // Select bucket (defaults to private for now or user can extend schema)
        const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

        console.log(`[API/R2/UPLOAD] Generating presigned URL for key: ${uniqueKey}`);
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: uniqueKey,
            ContentType: contentType,
            ContentLength: size,
        });

        const presignedUrl = await getSignedUrl(r2Client, command, {
            expiresIn: 3600, // URL expires in 1 hour
        });

        const publicUrl = constructCloudflareR2Url(uniqueKey, bucketName);

        // --- CREATE DATABASE RECORD ---
        console.log(`[API/R2/UPLOAD] Creating database record...`);
        let fileId = null;
        if (libraryType === "project" && projectId) {
            const doc = await (prisma.projectDocument.create as any)({
                data: {
                    projectId,
                    userId, // Track who uploaded it
                    name: filename,
                    type: contentType,
                    size,
                    url: publicUrl,
                    folder: folder || "/",
                    isFolder: false,
                    source: "local",
                    status: "uploaded",
                    authorName: "Usuario Bimus" // We could fetch actual name, but userId is enough for limit.
                }
            });
            fileId = doc.id;
        } else {
            // Default to LibraryFile for cad, models, textures, etc.
            const libFile = await prisma.libraryFile.create({
                data: {
                    userId,
                    r2Key: uniqueKey,
                    name: filename,
                    size,
                    mimeType: contentType,
                    publicUrl,
                    libraryType: libraryType || "cad",
                    category: libraryType === "models" ? "BIM Model" : "CAD Design"
                }
            });
            fileId = libFile.id;
        }

        return NextResponse.json({
            presignedUrl,
            key: uniqueKey,
            publicUrl,
            fileId: fileId,
        });
    } catch (error: any) {
        console.error("[API/R2/UPLOAD] CRITICAL ERROR:", error);
        return NextResponse.json(
            { error: "Failed to generate upload URL", message: error.message },
            { status: 500 }
        );
    }
}