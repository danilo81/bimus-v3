'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteDocument(id: string, projectId: string) {
    try {
        const doc = await (prisma.projectDocument.findUnique as any)({ where: { id } });
        if (!doc) return { success: false, error: 'Documento no encontrado.' };

        if (doc.isFolder) {
            const childFolderPath = doc.folder === "/" ? `/${doc.name}/` : `${doc.folder}${doc.name}/`;
            await (prisma.projectDocument.deleteMany as any)({
                where: { projectId, folder: { startsWith: childFolderPath } }
            });
        }

        await prisma.projectDocument.delete({ where: { id } });
        revalidatePath(`/projects/${projectId}/documents`);
        return { success: true };
    } catch (error: any) {
        console.error('Delete error:', error);
        return { success: false, error: error.message || 'Error al eliminar el archivo.' };
    }
}