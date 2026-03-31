'use server';

import prisma from "@/lib/prisma";
import { ProjectDocument } from "@/types/types";

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