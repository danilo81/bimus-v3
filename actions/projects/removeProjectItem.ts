'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function removeProjectItem(projectId: string, itemId: string) {
    try {
        await prisma.projectItem.delete({ where: { projectId_itemId: { projectId, itemId } } });
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message || "Error al eliminar" }; }
}