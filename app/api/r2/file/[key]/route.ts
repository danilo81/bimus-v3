import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2Client";

interface Props {
    params: Promise<{ key: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
    try {
        const { key } = await params;
        const keyToFetch = decodeURIComponent(key);

        if (!keyToFetch) {
            return NextResponse.json({ error: "File key is required" }, { status: 400 });
        }

        // Try Public Bucket first for images/public assets
        let bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME_PUBLIC || process.env.CLOUDFLARE_R2_BUCKET_NAME!;
        let command = new GetObjectCommand({
            Bucket: bucketName,
            Key: keyToFetch,
        });

        let response;
        try {
            response = await r2Client.send(command);
        } catch (e) {
            // Fallback to private bucket if public fails
            bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
            command = new GetObjectCommand({
                Bucket: bucketName,
                Key: keyToFetch,
            });
            response = await r2Client.send(command);
        }

        if (!response.Body) {
            throw new Error("Empty body from R2");
        }

        // Return the body with correct Content-Type if possible
        const headers = new Headers();
        if (response.ContentType) {
            headers.set("Content-Type", response.ContentType);
        }
        if (response.ContentLength) {
            headers.set("Content-Length", response.ContentLength.toString());
        }
        // Force inline display if it's common browser types, or download otherwise?
        // For "visualizing", inline is better.

        return new Response(response.Body as any, {
            status: 200,
            headers: headers,
        });
    } catch (error) {
        console.error("Error viewing file from R2:", error);
        return NextResponse.json({ error: "Failed to fetch file content" }, { status: 500 });
    }
}