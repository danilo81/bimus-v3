// app/api/r2/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        // Leer userId de la cookie (sistema de auth propio del proyecto)
        const userId = request.cookies.get("userId")?.value;

        if (!userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const libraryType = searchParams.get("type") ?? "cad";

        // Verificar rol del usuario
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const isAdmin = user.role === "admin";

        // Consultar BD: admin ve todos, usuario normal solo los suyos
        const files = await prisma.libraryFile.findMany({
            where: {
                libraryType,
                ...(!isAdmin && { userId }),
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            success: true,
            files: (files || []).map((f: any) => ({
                id: f.id,
                key: f.r2Key,
                name: f.name,
                size: f.size,
                mimeType: f.mimeType,
                publicUrl: f.publicUrl,
                category: f.category,
                lastModified: f.createdAt,
                uploadedBy: f.user?.name ?? f.user?.email ?? "Unknown",
                uploadedById: f.userId,
                isOwner: f.userId === userId,
            })),
        });
    } catch (error) {
        console.error("Error listing files from DB:", error);
        return NextResponse.json(
            { error: "Failed to list files" },
            { status: 500 }
        );
    }
}