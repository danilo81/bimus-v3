'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { BimTopicStatus } from "@/types/types";

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

        revalidatePath(`/projects/${data.projectId}/documentation`);
        return { success: true, topic };
    } catch (error: any) {
        console.error('Error upserting BIM topic:', error);
        return { success: false, error: error.message || 'Error al persistir los cambios en el tópico.' };
    }
}