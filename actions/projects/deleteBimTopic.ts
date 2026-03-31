'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteBimTopic(id: string, projectId: string) {
    try {
        await prisma.bimTopic.delete({
            where: { id }
        });
        revalidatePath(`/projects/${projectId}/documentation`);
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting BIM topic:', error);
        return { success: false, error: error.message || 'Error al eliminar el tópico de la base de datos.' };
    }
}