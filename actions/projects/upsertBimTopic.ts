'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { BimTopicStatus } from "@/types/types";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function upsertBimTopic(data: {
    id?: string;
    documentId: string;
    projectId: string;
    parentId?: string | null;
    title: string;
    content?: string | null;
    status: BimTopicStatus;
    order: number;
}) {
    try {
        const userId = await getAuthUserId();
        if (!userId) throw new Error("No autorizado");

        const topic = data.id
            ? await prisma.bimTopic.update({
                where: { id: data.id },
                data: {
                    title: data.title,
                    content: data.content,
                    status: data.status,
                    order: data.order
                }
            })
            : await prisma.bimTopic.create({
                data: {
                    documentId: data.documentId,
                    parentId: data.parentId || null,
                    title: data.title,
                    content: data.content || '',
                    status: data.status,
                    order: data.order
                }
            });

        // Registrar en bitácora
        await prisma.siteLog.create({
            data: {
                projectId: data.projectId,
                authorId: userId,
                type: 'info',
                content: data.id 
                    ? `SECCIÓN BIM ACTUALIZADA: Se ha modificado "${data.title}" (${data.status}).` 
                    : `SECCIÓN BIM CREADA: Se ha añadido "${data.title}" al expediente técnico.`,
                date: new Date()
            }
        }).catch(() => null);

        // Incrementar la versión del documento
        await prisma.bimDocument.update({
            where: { id: data.documentId },
            data: { version: { increment: 1 } }
        });

        revalidatePath(`/projects/${data.projectId}/documentation`);
        revalidatePath(`/projects/${data.projectId}/board`);
        
        return { success: true, topic };
    } catch (error: any) {
        console.error('Error upserting BIM topic:', error);
        return { success: false, error: error.message || 'Error al persistir los cambios en el tópico.' };
    }
}