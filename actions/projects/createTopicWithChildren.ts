'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function createTopicWithChildren(data: {
    documentId: string;
    projectId: string;
    parentId?: string | null;
    title: string;
    children: string[];
}) {
    try {
        const userId = await getAuthUserId();
        if (!userId) throw new Error("No autorizado");

        if (!data.documentId) throw new Error("Document ID es requerido");

        const result = await prisma.$transaction(async (tx) => {
            const count = await tx.bimTopic.count({
                where: { documentId: data.documentId, parentId: data.parentId || null }
            });

            const parent = await tx.bimTopic.create({
                data: {
                    documentId: data.documentId,
                    parentId: data.parentId || null,
                    title: data.title,
                    status: 'in_progress',
                    order: count,
                    content: ''
                }
            });

            // Registrar en bitácora
            await tx.siteLog.create({
                data: {
                    projectId: data.projectId,
                    authorId: userId,
                    type: 'info',
                    content: `SECCIÓN BIM CREADA: Se ha añadido "${data.title}" al documento técnico del proyecto.`,
                    date: new Date()
                }
            }).catch(() => null);

            const validChildrenTitles = (data.children || []).filter(title => title.trim() !== '');
            if (validChildrenTitles.length > 0) {
                for (let i = 0; i < validChildrenTitles.length; i++) {
                    await tx.bimTopic.create({
                        data: {
                            documentId: data.documentId,
                            parentId: parent.id,
                            title: validChildrenTitles[i],
                            status: 'in_progress',
                            order: i,
                            content: ''
                        }
                    });
                }
            }

            return parent;
        });

        revalidatePath(`/projects/${data.projectId}/documentation`);
        revalidatePath(`/projects/${data.projectId}/board`);
        return { success: true, topic: result };
    } catch (error: any) {
        console.error('Error creating topic with children:', error);
        return { success: false, error: error.message || 'Fallo al crear el tópico y sus sub-secciones.' };
    }
}