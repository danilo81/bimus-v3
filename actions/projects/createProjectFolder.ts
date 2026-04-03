'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function createProjectFolder(projectId: string, folderName: string, parentFolder: string = "/") {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

        const folder = await (prisma.projectDocument.create as any)({
            data: {
                projectId,
                name: folderName,
                type: 'folder',
                size: 0,
                url: '',
                folder: parentFolder,
                isFolder: true,
                authorName: user?.name || 'Usuario Bimus',
                userId
            }
        });

        await prisma.siteLog.create({
            data: {
                projectId,
                authorId: userId,
                type: 'info',
                content: `CARPETA CREADA: Se ha creado la carpeta "${folderName}" en ${parentFolder}.`,
                date: new Date()
            }
        }).catch(() => null);

        revalidatePath(`/projects/${projectId}/documentation`);
        return { success: true, folder };
    } catch (error: any) {
        console.error('Error creating folder:', error);
        return { success: false, error: error.message || 'Error al crear carpeta.' };
    }
}
