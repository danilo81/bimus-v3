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

export async function updateProjectItemProgress(projectId: string, itemId: string, progressIncrement: number, logDescription?: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };
        await prisma.$transaction(async (tx) => {
            const projectItem = await tx.projectItem.findUnique({
                where: { projectId_itemId: { projectId, itemId } },
                include: { item: true }
            });
            if (!projectItem) throw new Error("Partida no encontrada");
            const newProgress = (Number(projectItem.progress) || 0) + Number(progressIncrement);
            await tx.projectItem.update({ where: { id: projectItem.id }, data: { progress: newProgress } });
            await tx.siteLog.create({
                data: {
                    projectId,
                    authorId: userId,
                    type: 'info',
                    content: logDescription || `AVANCE: +${progressIncrement} en "${projectItem.item.description}".`,
                    date: new Date()
                }
            });
        });
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}