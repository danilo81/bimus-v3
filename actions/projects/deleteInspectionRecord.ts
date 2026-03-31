'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteInspectionRecord(id: string, projectId: string) {
    try {
        await prisma.inspectionRecord.delete({ where: { id } });
        revalidatePath(`/projects/${projectId}/operations`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting inspection record:', error);
        return { success: false, error: 'Error al eliminar el registro.' };
    }
}