// app/api/r2/list/route.ts
import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2Client";

export async function GET() {
    try {
        const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

        const command = new ListObjectsV2Command({
            Bucket: bucketName,
        });

        const response = await r2Client.send(command);
        
        const files = response.Contents?.map(item => {
            const key = item.Key || "";
            const publicBaseUrl = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
            const publicUrl = publicBaseUrl 
                ? `${publicBaseUrl.endsWith("/") ? publicBaseUrl : publicBaseUrl + "/"}${encodeURIComponent(key)}`
                : `https://pub-${bucketName}.r2.dev/${encodeURIComponent(key)}`;
                
            return {
                key: key,
                size: item.Size,
                lastModified: item.LastModified,
                publicUrl: publicUrl,
            };
        }) || [];

        return NextResponse.json({
            success: true,
            files: files,
        });
    } catch (error) {
        console.error("Error listing files from R2:", error);
        return NextResponse.json(
            { error: "Failed to list files" },
            { status: 500 }
        );
    }
}
