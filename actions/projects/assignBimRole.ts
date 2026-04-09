'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignBimRoleToDocument(projectId: string, documentId: string, role: string) {
    try {
        // Find if this project already has a document with this role. If so, remove the role.
        await prisma.projectDocument.updateMany({
            where: {
                projectId: projectId,
                bimRole: role
            },
            data: {
                bimRole: null
            }
        });

        // Assign the role to the selected document
        const updatedDoc = await prisma.projectDocument.update({
            where: {
                id: documentId
            },
            data: {
                bimRole: role
            }
        });

        revalidatePath(`/projects/${projectId}/model`);
        revalidatePath(`/projects/${projectId}/design`);

        return { success: true, document: updatedDoc };
    } catch (error: any) {
        console.error("Error assigning BIM role:", error);
        return { success: false, error: error.message || "Error al asignar rol estructurado" };
    }
}
