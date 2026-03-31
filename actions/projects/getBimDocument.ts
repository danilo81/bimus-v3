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
                data: {
                    projectId,
                    topics: {
                        create: [
                            { title: 'OIR - Organizational Information Requirements', order: 0, status: 'in_progress', content: '' },
                            { title: 'PIR - Project Information Requirements', order: 1, status: 'in_progress', content: '' },
                            { title: 'AIR - Asset Information Requirements', order: 2, status: 'in_progress', content: '' },
                            { title: 'EIR - Exchange Information Requirements', order: 3, status: 'in_progress', content: '' },
                            { title: 'BEP - BIM Execution Plan', order: 4, status: 'in_progress', content: '' },
                            { title: 'Common Data Environment (CDE) Protocols', order: 5, status: 'in_progress', content: '' },
                        ]
                    }
                },
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