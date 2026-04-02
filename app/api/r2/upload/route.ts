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

        const { filename, contentType, size } = validation.data;
        const uniqueKey = `${uuidv4()}-${filename}`;

        // Select bucket (defaults to private for now or user can extend schema)
        const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

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

        return NextResponse.json({
            presignedUrl,
            key: uniqueKey,
            publicUrl,
            // Returning an empty id if no DB file is created here yet,
            // or we could create a DB record if needed.
            fileId: null,
        });
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return NextResponse.json(
            { error: "Failed to generate upload URL" },
            { status: 500 }
        );
    }
}