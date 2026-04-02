"use server";

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

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

        const result = await prisma.$transaction(async (tx) => {
            let totalFinancialImpact = 0;

            // Buscamos los items actuales para calcular deltas
            const currentItems = await tx.projectItem.findMany({
                where: { projectId },
                include: { item: true }
            });

            for (const row of computations) {
                const currentItem = currentItems.find(ci => ci.itemId === row.id);
                const oldQuantity = currentItem?.quantity || 0;
                const newQuantity = Number(row.total) || 0;
                const deltaQuantity = newQuantity - oldQuantity;

                if (deltaQuantity !== 0) {
                    // Usamos el costo unitario del item (total) para calcular el impacto
                    const unitPrice = currentItem?.item?.total || 0;
                    totalFinancialImpact += deltaQuantity * unitPrice;
                }

                const projectItem = await tx.projectItem.upsert({
                    where: { projectId_itemId: { projectId, itemId: row.id } },
                    update: { quantity: newQuantity },
                    create: { projectId, itemId: row.id, quantity: newQuantity }
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

            // Crear registro de Orden de Cambio
            const count = await (tx as any).projectChangeOrder.count({ where: { projectId } });
            const orderNumber = `OC-${(count + 1).toString().padStart(3, '0')}`;

            await (tx as any).projectChangeOrder.create({
                data: {
                    projectId,
                    number: orderNumber,
                    description: reason,
                    amount: totalFinancialImpact,
                    type: totalFinancialImpact >= 0 ? "Adición" : "Deducción",
                    status: "Aprobada",
                    reason: "Cambio de Cómputo"
                }
            });

            await tx.siteLog.create({
                data: {
                    projectId,
                    authorId: userId,
                    type: 'milestone',
                    content: `ORDEN DE CAMBIO AUTORIZADA: ${reason}. Impacto financiero: ${totalFinancialImpact.toFixed(2)}`,
                    date: new Date()
                }
            });

            return { success: true };
        });

        revalidatePath(`/projects/${projectId}`);
        revalidatePath(`/projects/${projectId}/construction`);
        revalidatePath(`/projects/${projectId}/operations`);

        return result;
    } catch (error: any) {
        console.error("Change Order Error:", error);
        return { success: false, error: error.message || "Error al procesar la orden de cambio en base de datos." };
    }
}