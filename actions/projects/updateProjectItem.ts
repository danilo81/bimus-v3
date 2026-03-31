'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProjectItem(
    projectId: string,
    itemId: string,
    data: {
        quantity?: number,
        performance?: number,
        extraDays?: number,
        ganttStatus?: string,
        startDate?: Date | null,
        predecessorId?: string | null,
        levelQuantities?: { levelId: string, quantity: number }[]
    }
) {
    try {
        await prisma.$transaction(async (tx) => {
            const updateData: any = {};
            if (data.quantity !== undefined) updateData.quantity = Number(data.quantity);
            if (data.performance !== undefined) updateData.performance = Number(data.performance);
            if (data.extraDays !== undefined) updateData.extraDays = Number(data.extraDays);
            if (data.ganttStatus !== undefined) updateData.ganttStatus = data.ganttStatus;
            if (data.startDate !== undefined) updateData.startDate = data.startDate;

            if (data.predecessorId !== undefined) {
                if (data.predecessorId === "" || data.predecessorId === null) {
                    updateData.predecessorId = null;
                } else {
                    const predItem = await tx.projectItem.findUnique({
                        where: { projectId_itemId: { projectId, itemId: data.predecessorId } }
                    });
                    if (predItem) {
                        updateData.predecessorId = predItem.id;
                    }
                }
            }

            const projectItem = await tx.projectItem.update({
                where: { projectId_itemId: { projectId, itemId } },
                data: updateData
            });

            if (data.levelQuantities && data.levelQuantities.length > 0) {
                for (const lq of data.levelQuantities) {
                    await tx.projectItemLevelQuantity.upsert({
                        where: { projectItemId_levelId: { projectItemId: projectItem.id, levelId: lq.levelId } },
                        update: { quantity: Number(lq.quantity) || 0 },
                        create: { projectItemId: projectItem.id, levelId: lq.levelId, quantity: Number(lq.quantity) || 0 }
                    });
                }
            }
        });
        revalidatePath(`/projects/${projectId}`);
        revalidatePath(`/projects/${projectId}/construction`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al actualizar partida" };
    }
}