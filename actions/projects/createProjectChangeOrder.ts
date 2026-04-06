"use server";

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { calculateAPU } from "../../lib/apu-utils";

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

        // Fetch project config to calculate dynamic APU impacts
        const projectWithConfig = await prisma.project.findUnique({
            where: { id: projectId },
            select: { config: true }
        });
        const config = projectWithConfig?.config;

        const result = await prisma.$transaction(async (tx) => {
            let totalFinancialImpact = 0;

            // Buscamos los items actuales para calcular deltas
            const currentItems = await tx.projectItem.findMany({
                where: { projectId },
                include: { item: { include: { supplies: { include: { supply: true } } } } }
            });

            for (const row of computations) {
                const currentItem = currentItems.find(ci => ci.itemId === row.id);
                const oldQuantity = currentItem?.quantity || 0;
                const newQuantity = Number(row.total) || 0;
                const deltaQuantity = newQuantity - oldQuantity;

                if (deltaQuantity !== 0) {
                    // Calculate dynamic APU for the item in this project's context (overheads included)
                    const apu = calculateAPU(currentItem?.item?.supplies || [], config);
                    const unitPrice = apu.totalUnit || 0;
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

            // Generar número de orden único buscando el máximo numérico real en el sistema
            const allOrders = await (tx as any).projectChangeOrder.findMany({
                where: { number: { startsWith: 'OC-' } },
                select: { number: true }
            });

            let nextNumber = 1;
            if (allOrders.length > 0) {
                const numbers = allOrders
                    .map((o: any) => {
                        const parts = o.number.split('-');
                        return parts[1] ? parseInt(parts[1], 10) : 0;
                    })
                    .filter((n: number) => !isNaN(n));
                
                if (numbers.length > 0) {
                    nextNumber = Math.max(...numbers) + 1;
                }
            }
            const orderNumber = `OC-${nextNumber.toString().padStart(3, '0')}`;

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
        }, {
            timeout: 30000
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