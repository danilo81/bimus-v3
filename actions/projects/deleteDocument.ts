'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteDocument(id: string, projectId: string) {
    try {
        await prisma.projectDocument.delete({
            where: { id }
        });
        revalidatePath(`/projects/${projectId}/documents`);
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al eliminar el archivo.' };
    }
}