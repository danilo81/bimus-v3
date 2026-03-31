'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function addProjectItem(projectId: string, itemId: string, quantity: number = 0) {
    try {
        const projectItem = await prisma.projectItem.upsert({
            where: { projectId_itemId: { projectId, itemId } },
            update: { quantity: Number(quantity) || 0 },
            create: { projectId, itemId, quantity: Number(quantity) || 0 }
        });
        revalidatePath(`/projects/${projectId}`);
        return { success: true, projectItem };
    } catch (error: any) { return { success: false, error: error.message || "Error al añadir" }; }
}