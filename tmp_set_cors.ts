import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const client = new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
});

async function setCors() {
    console.log("Setting CORS for bucket:", process.env.CLOUDFLARE_R2_BUCKET_NAME);
    
    const command = new PutBucketCorsCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                    AllowedOrigins: ["*"], // In production you should set this to your specific domain
                    ExposeHeaders: ["ETag"],
                    MaxAgeSeconds: 3000,
                },
            ],
        },
    });

    try {
        await client.send(command);
        console.log("✅ CORS configuration updated successfully!");
    } catch (err) {
        console.error("❌ Error updating CORS configuration:", err);
    }
}

setCors();
