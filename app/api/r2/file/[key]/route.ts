// app/api/r2/file/[key]/route.ts
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2Client";

interface Props {
    params: { key: string };
}

export async function GET(request: Request, { params }: Props) {
    try {
        const key = decodeURIComponent(params.key);
        
        if (!key) {
            return NextResponse.json(
                { error: "File key is required" },
                { status: 400 }
            );
        }

        const command = new GetObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            Key: key,
        });

        const response = await r2Client.send(command);
        
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
        return NextResponse.json(
            { error: "Failed to fetch file content" },
            { status: 500 }
        );
    }
}
