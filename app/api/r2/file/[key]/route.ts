import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2Client";

interface Props {
    params: Promise<{ key: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
    try {
        // Leer userId de la cookie (sistema de auth propio del proyecto)
        const userId = request.cookies.get("userId")?.value;

        if (!userId) {
            return new Response("No autorizado", { status: 401 });
        }

        const { key } = await params;
        const keyToFetch = decodeURIComponent(key);

        if (!keyToFetch) {
            return NextResponse.json({ error: "File key is required" }, { status: 400 });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            Key: keyToFetch,
        });

        let response;
        try {
            response = await r2Client.send(command);
        } catch (r2Error: any) {
            if (r2Error.name === "NoSuchKey") {
                return new Response(
                    "El archivo físico no se encuentra en el servidor. Es muy probable que la carga original se haya interrumpido antes de terminar.", 
                    { status: 404, headers: { "Content-Type": "text/plain" } }
                );
            }
            throw r2Error;
        }

        if (!response.Body) throw new Error("Empty body from R2");

        const headers = new Headers();
        if (response.ContentType) headers.set("Content-Type", response.ContentType);
        if (response.ContentLength) headers.set("Content-Length", response.ContentLength.toString());

        const urlParams = new URL(request.url);
        if (urlParams.searchParams.get("download") === "true") {
            const fileName = urlParams.searchParams.get("name") || keyToFetch;
            // Clean filename to prevent header injection vulnerabilities
            const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
            headers.set("Content-Disposition", `attachment; filename="${safeFileName}"`);
        }

        return new Response(response.Body as any, {
            status: 200,
            headers: headers,
        });
    } catch (error) {
        console.error("Error viewing file from R2:", error);
        return NextResponse.json({ error: "Failed to fetch file content" }, { status: 500 });
    }
}