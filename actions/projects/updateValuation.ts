'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

interface ValuationItemInput {
    id?: string;
    projectItemId: string;
    quantity: number;
    price: number;
    amount: number;
}

interface UpdateValuationData {
    description?: string;
    date?: Date | string;
    items: ValuationItemInput[];
    retentionAmount: number;
    retentionPercentage: number;
    netAmount: number;
}

export async function updateValuation(id: string, data: UpdateValuationData) {
    const { 
        description, 
        date, 
        items, 
        retentionAmount, 
        retentionPercentage, 
        netAmount 
    } = data;

    if (!id || items.length === 0) {
        return { success: false, error: 'Missing required valuation data' };
    }

    try {
        const userId = await getAuthUserId();
        if (!userId) throw new Error("No autorizado");

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get existing valuation and its items to revert progress
            const oldValuation = await tx.valuation.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!oldValuation) throw new Error("Valuación no encontrada");

            // 1.1 Revert OLD quantities from ProjectItem.progress
            for (const oldItem of oldValuation.items) {
                await tx.projectItem.update({
                    where: { id: oldItem.projectItemId },
                    data: {
                        progress: {
                            decrement: oldItem.quantity
                        }
                    }
                });
            }

            // 2. Delete OLD ValuationItems
            await tx.valuationItem.deleteMany({
                where: { valuationId: id }
            });

            // 3. Update Valuation Header
            const updatedValuation = await tx.valuation.update({
                where: { id },
                data: {
                    description,
                    date: date ? new Date(date) : undefined,
                    totalAmount: items.reduce((acc, item) => acc + item.amount, 0),
                    retentionAmount,
                    retentionPercentage,
                    netAmount,
                    updatedAt: new Date(),
                    items: {
                        create: items.map(item => ({
                            projectItemId: item.projectItemId,
                            quantity: item.quantity,
                            price: item.price,
                            amount: item.amount,
                        }))
                    }
                }
            });

            // 4. Apply NEW quantities to ProjectItem.progress
            for (const newItem of items) {
                await tx.projectItem.update({
                    where: { id: newItem.projectItemId },
                    data: {
                        progress: {
                            increment: newItem.quantity
                        }
                    }
                });
            }

            // Registrar en bitácora
            await tx.siteLog.create({
                data: {
                    projectId: oldValuation.projectId,
                    authorId: userId,
                    type: 'info',
                    content: `PLANILLA ACTUALIZADA: ${oldValuation.number} - ${description}. Se ha recalculado el progreso de los ítems.`,
                    date: new Date()
                }
            }).catch(() => null);

            return { projectId: oldValuation.projectId };
        });

        revalidatePath(`/projects/${result.projectId}/operations`);
        return { success: true };
    } catch (error: any) {
        console.error('Error updating valuation:', error);
        return { success: false, error: error.message };
    }
}
