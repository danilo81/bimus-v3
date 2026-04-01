// app/api/r2/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2Client";
import prisma from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
    try {
        // Leer userId de la cookie (sistema de auth propio del proyecto)
        const userId = request.cookies.get("userId")?.value;
        if (!userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { key } = body;

        if (!key) {
            return NextResponse.json(
                { error: "File key is required" },
                { status: 400 }
            );
        }

        // 2. Buscar el registro en BD (Uso de 'libraryFile' generado por Prisma)
        const libraryFile = await prisma.libraryFile.findUnique({
            where: { r2Key: key },
        });

        if (!libraryFile) {
            return NextResponse.json(
                { error: "File record not found in database" },
                { status: 404 }
            );
        }

        // 3. Verificar propiedad: solo el dueño o un admin puede eliminar
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        const isAdmin = user?.role === "admin";
        const isOwner = libraryFile.userId === userId;

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "No tienes permiso para eliminar este archivo" },
                { status: 403 }
            );
        }

        // 4. Eliminar de Cloudflare R2
        const command = new DeleteObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            Key: key,
        });
        await r2Client.send(command);

        // 5. Eliminar registro de la base de datos
        await prisma.libraryFile.delete({
            where: { r2Key: key },
        });

        return NextResponse.json(
            { message: "File deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting file:", error);
        return NextResponse.json(
            { error: "Failed to delete file" },
            { status: 500 }
        );
    }
}
