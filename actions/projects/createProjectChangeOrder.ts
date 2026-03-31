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

export async function createProjectChangeOrder(projectId: string, reason: string, computations: any[]) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        await prisma.$transaction(async (tx) => {
            for (const row of computations) {

                const projectItem = await tx.projectItem.upsert({
                    where: { projectId_itemId: { projectId, itemId: row.id } },
                    update: { quantity: Number(row.total) || 0 },
                    create: { projectId, itemId: row.id, quantity: Number(row.total) || 0 }
                });


                if (row.values && row.levelIds) {
                    for (let i = 0; i < row.values.length; i++) {
                        await tx.projectItemLevelQuantity.upsert({
                            where: { projectItemId_levelId: { projectItemId: projectItem.id, levelId: row.levelIds[i] } },
                            update: { quantity: Number(row.values[i]) || 0 },
                            create: { projectItemId: projectItem.id, levelId: row.levelIds[i], quantity: Number(row.values[i]) || 0 }
                        });
                    }
                }
            }

            await tx.siteLog.create({
                data: {
                    projectId,
                    authorId: userId,
                    type: 'milestone',
                    content: `ORDEN DE CAMBIO AUTORIZADA: ${reason}`,
                    date: new Date()
                }
            });
        });

        revalidatePath(`/projects/${projectId}`);
        revalidatePath(`/projects/${projectId}/construction`);

        return { success: true };
    } catch (error: any) {
        console.error("Change Order Error:", error);
        return { success: false, error: error.message || "Error al procesar la orden de cambio en base de datos." };
    }
}