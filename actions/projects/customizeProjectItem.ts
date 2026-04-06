'use server';

import prisma from "../../lib/prisma";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

export async function customizeProjectItem(projectId: string, oldItemId: string, newItemData: any) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };
        return await prisma.$transaction(async (tx) => {
            const oldProjectItem = await tx.projectItem.findUnique({
                where: { projectId_itemId: { projectId, itemId: oldItemId } },
                include: { levelQuantities: true }
            });
            if (!oldProjectItem) throw new Error("Vínculo de proyecto no encontrado");
            const customizedItem = await tx.constructionItem.create({
                data: {
                    chapter: newItemData.chapter,
                    description: `${newItemData.description} (Local)`,
                    unit: newItemData.unit,
                    performance: Number(newItemData.performance) || 1,
                    directCost: Number(newItemData.directCost) || 0,
                    total: Number(newItemData.total) || 0,
                    userId: userId,
                    supplies: {
                        create: newItemData.supplies.map((s: any) => ({
                            supplyId: s.supplyId || s.id,
                            quantity: Number(s.quantity) || 0
                        }))
                    }
                }
            });
            await tx.projectItem.create({
                data: {
                    projectId,
                    itemId: customizedItem.id,
                    quantity: oldProjectItem.quantity,
                    levelQuantities: {
                        create: oldProjectItem.levelQuantities.map((lq: any) => ({
                            levelId: lq.levelId,
                            quantity: lq.quantity
                        }))
                    }
                }
            });
            await tx.projectItem.delete({ where: { projectId_itemId: { projectId, itemId: oldItemId } } });

            // REGISTRAR EN BITÁCORA
            await tx.siteLog.create({
                data: {
                    projectId,
                    authorId: userId,
                    type: 'info',
                    content: `APU PERSONALIZADO: Se creó un análisis de costos local para "${newItemData.description}".`,
                    date: new Date()
                }
            }).catch(() => null);

            return { success: true, newItemId: customizedItem.id };
        });
    } catch (error: any) { return { success: false, error: error.message }; }
}