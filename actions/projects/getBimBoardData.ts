'use server';

import prisma from "@/lib/prisma";

export async function getBimBoardData(projectId: string) {
    try {
        if (!projectId) throw new Error("ID de proyecto no proporcionado");

        // Fetch minimal project info and the BIM document with its topics concurrently
        const [project, doc] = await Promise.all([
            prisma.project.findUnique({
                where: { id: projectId },
                select: { id: true, title: true }
            }),
            prisma.bimDocument.findUnique({
                where: { projectId },
                include: {
                    topics: {
                        orderBy: { order: 'asc' }
                    }
                }
            })
        ]);

        if (!project) throw new Error("Proyecto no encontrado");

        let currentDoc = doc;
        if (!currentDoc) {
            currentDoc = await prisma.bimDocument.create({
                data: { projectId },
                include: {
                    topics: {
                        orderBy: { order: 'asc' }
                    }
                }
            });
        }

        // Process topics into a tree structure
        const allTopics = JSON.parse(JSON.stringify(currentDoc.topics));
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

        return { 
            success: true, 
            project: JSON.parse(JSON.stringify(project)),
            topics: rootTopics, 
            document: JSON.parse(JSON.stringify(currentDoc)),
            documentId: currentDoc.id 
        };
    } catch (error: any) {
        console.error('Error fetching BIM board data:', error);
        return { success: false, error: error.message || 'Error al cargar la plataforma BIM.' };
    }
}
