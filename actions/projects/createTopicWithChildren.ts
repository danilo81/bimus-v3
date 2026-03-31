'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTopicWithChildren(data: {
    documentId: string;
    projectId: string;
    parentId?: string | null;
    title: string;
    children: string[];
}) {
    try {
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
        return { success: true, topic: result };
    } catch (error: any) {
        console.error('Error creating topic with children:', error);
        return { success: false, error: error.message || 'Fallo al crear el tópico y sus sub-secciones.' };
    }
}