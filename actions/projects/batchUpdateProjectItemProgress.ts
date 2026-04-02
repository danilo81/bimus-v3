'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

export async function batchUpdateProjectItemProgress(projectId: string, updates: { itemId: string, increment: number, log: string }[]) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        await prisma.$transaction(async (tx) => {
            for (const update of updates) {
                const projectItem = await tx.projectItem.findUnique({
                    where: { projectId_itemId: { projectId, itemId: update.itemId } }
                });

                if (!projectItem) continue;

                const newProgress = (Number(projectItem.progress) || 0) + Number(update.increment);

                await tx.projectItem.update({
                    where: { id: projectItem.id },
                    data: { progress: newProgress }
                });

                await tx.siteLog.create({
                    data: {
                        projectId,
                        authorId: userId,
                        type: 'progress',
                        content: update.log,
                        date: new Date()
                    }
                }).catch(e => console.warn("Fallo registro bitácora:", e.message));
            }
        });

        revalidatePath(`/projects/${projectId}`);
        revalidatePath(`/projects/${projectId}/construction`);
        return { success: true };
    } catch (error: any) {
        console.error("Batch update error:", error);
        return { success: false, error: error.message || "Fallo al actualizar el avance físico." };
    }
}