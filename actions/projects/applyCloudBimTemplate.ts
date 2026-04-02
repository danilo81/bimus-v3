'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function applyCloudBimTemplate(projectId: string, fileId: string) {
    try {
        const file = await prisma.libraryFile.findUnique({
            where: { id: fileId }
        });

        if (!file || !file.publicUrl) {
            throw new Error("Plantilla no encontrada");
        }

        const doc = await prisma.bimDocument.findUnique({
            where: { projectId }
        });

        if (!doc) throw new Error("Documento no encontrado");

        // Fetch JSON from R2
        const response = await fetch(file.publicUrl);
        if (!response.ok) {
            throw new Error(`Error al leer archivo de plantilla: ${response.statusText}`);
        }

        const topicsData: any[] = await response.json();
        
        await prisma.bimTopic.deleteMany({
            where: { documentId: doc.id }
        });

        const oldToNew = new Map<string, string>();
        let remaining = [...topicsData];

        // Process loops until all are created (topological sort by parent presence)
        while (remaining.length > 0) {
            const readyToProcess = remaining.filter(t => !t.parentId || oldToNew.has(t.parentId));
            
            if (readyToProcess.length === 0) {
                // If there are remaining topics but none are ready, it means there is an invalid/orphaned parentId. Just create them at root to avoid infinite loop
                console.warn(`Orphaned topics detected: ${remaining.length}`);
                readyToProcess.push(...remaining);
                readyToProcess.forEach(t => t.parentId = null); 
            }

            for (const t of readyToProcess) {
                const newParentId = t.parentId ? oldToNew.get(t.parentId) : null;
                const newTopic = await prisma.bimTopic.create({
                    data: {
                        documentId: doc.id,
                        parentId: newParentId,
                        title: t.title,
                        order: t.order,
                        status: t.status,
                        content: t.content
                    }
                });
                oldToNew.set(t.id, newTopic.id);
            }

            remaining = remaining.filter(t => !readyToProcess.includes(t));
        }

        revalidatePath(`/projects/${projectId}/documentation`);
        return { success: true };
    } catch (error: any) {
        console.error('Error applying cloud template:', error);
        return { success: false, error: error.message || 'Fallo al aplicar la plantilla en la nube.' };
    }
}
