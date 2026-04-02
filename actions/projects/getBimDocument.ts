'use server';

import prisma from "@/lib/prisma";

export async function getBimDocument(projectId: string) {
    try {
        if (!projectId) throw new Error("ID de proyecto no proporcionado");

        let doc = await prisma.bimDocument.findUnique({
            where: { projectId },
            include: {
                topics: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!doc) {
            doc = await prisma.bimDocument.create({
                data: { projectId },
                include: {
                    topics: {
                        orderBy: { order: 'asc' }
                    }
                }
            });
        }

        const allTopics = JSON.parse(JSON.stringify(doc.topics));
        const topicMap: Record<string, any> = {};

        allTopics.forEach((t: any) => {
            t.children = [];
            topicMap[t.id] = t;
        });

        const rootTopics: any[] = [];
        allTopics.forEach((t: any) => {
            if (t.parentId && topicMap[t.parentId]) {
                topicMap[t.parentId].children.push(t);
            } else {
                rootTopics.push(t);
            }
        });

        return { success: true, topics: rootTopics, documentId: doc.id };
    } catch (error: any) {
        console.error('Error fetching BIM document:', error);
        return { success: false, error: error.message || 'Error al cargar la documentación técnica BIM.' };
    }
}