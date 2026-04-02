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
    category: z.string().optional().default("CAD Design"),
    libraryType: z.string().optional().default("cad"),
    isPublic: z.boolean().optional().default(false),
});

function constructPublicUrl(key: string, isPublic: boolean = false): string {
    // If it's a public bucket, we might use a different base URL if provided in .env
    const publicUrlEnv = isPublic ? (process.env.R2_PUBLIC_URL_PUBLIC || process.env.R2_PUBLIC_URL) : process.env.R2_PUBLIC_URL;
    const base = publicUrlEnv || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    
    if (base) {
        return `${base.endsWith("/") ? base : base + "/"}${encodeURIComponent(key)}`;
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

        const { filename, contentType, size, category, libraryType, isPublic } = validation.data;

        const uniqueKey = `${uuidv4()}-${filename}`;

        // Select bucket based on isPublic flag
        const bucketName = isPublic 
            ? (process.env.CLOUDFLARE_R2_BUCKET_NAME_PUBLIC || process.env.CLOUDFLARE_R2_BUCKET_NAME)
            : process.env.CLOUDFLARE_R2_BUCKET_NAME;

        const command = new PutObjectCommand({
            Bucket: bucketName!,
            Key: uniqueKey,
            ContentType: contentType,
            ContentLength: size,
        });

        const presignedUrl = await getSignedUrl(r2Client, command, {
            expiresIn: 3600,
        });

        const publicUrl = constructPublicUrl(uniqueKey, isPublic);

        // Crear registro en BD
        const libraryFile = await prisma.libraryFile.create({
            data: {
                userId: userId,
                r2Key: uniqueKey,
                name: filename,
                size: size,
                mimeType: contentType,
                publicUrl: publicUrl,
                category: category,
                libraryType: libraryType,
            },
        });

        return NextResponse.json({
            presignedUrl,
            key: uniqueKey,
            publicUrl,
            fileId: libraryFile.id,
        });
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return NextResponse.json(
            { error: "Failed to generate upload URL" },
            { status: 500 }
        );
    }
}