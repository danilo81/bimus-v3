'use server';

import prisma from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { ProjectDocument } from "@/types/types";

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

/**
 * Obtiene los documentos vinculados a un proyecto.
 */
export async function getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    try {
        const docs = await prisma.projectDocument.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });

        return docs.map(d => ({
            ...d,
            createdAt: d.createdAt.toISOString()
        })) as any;
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
}

/**
 * Registra un nuevo documento (local o Drive).
 */
export async function registerDocument(data: {
    projectId: string;
    name: string;
    type: string;
    size: string;
    url: string;
    source: 'local' | 'google_drive';
}) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

        const doc = await prisma.projectDocument.create({
            data: {
                projectId: data.projectId,
                name: data.name,
                type: data.type,
                size: data.size,
                url: data.url,
                source: data.source,
                status: data.source === 'local' ? 'uploaded' : 'linked',
                authorName: user?.name || 'Usuario Bimus'
            }
        });

        // Registrar en bitácora
        await prisma.siteLog.create({
            data: {
                projectId: data.projectId,
                authorId: userId,
                type: 'info',
                content: `ARCHIVO REGISTRADO: Se ha añadido "${data.name}" (${data.source.toUpperCase()}) al expediente técnico.`,
                date: new Date()
            }
        }).catch(() => null);

        revalidatePath(`/projects/${data.projectId}/documents`);
        return { success: true, document: doc };
    } catch (error: any) {
        console.error('Error registering document:', error);
        return { success: false, error: error.message || 'Error al vincular archivo.' };
    }
}

/**
 * Elimina un documento.
 */
export async function deleteDocument(id: string, projectId: string) {
    try {
        await prisma.projectDocument.delete({
            where: { id }
        });
        revalidatePath(`/projects/${projectId}/documents`);
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al eliminar el archivo.' };
    }
}
