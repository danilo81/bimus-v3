'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

interface ValuationItemInput {
    projectItemId: string;
    quantity: number; // Quantity certificated in THIS valuation
    price: number;
    amount: number;
}

interface CreateValuationData {
    projectId: string;
    description: string;
    date: Date | string;
    items: ValuationItemInput[];
    retentionAmount: number;
    retentionPercentage: number;
    netAmount: number;
    updateProgress?: boolean; // New flag: should we increment ProjectItem.progress?
}

export async function createValuation(data: CreateValuationData) {
    const { 
        projectId, 
        description, 
        date, 
        items, 
        retentionAmount, 
        retentionPercentage, 
        netAmount,
        updateProgress = false 
    } = data;

    if (!projectId || items.length === 0) {
        return { success: false, error: 'Missing required valuation data' };
    }

    try {
        const userId = await getAuthUserId();
        if (!userId) throw new Error("No autorizado");

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get the next valuation number for this project
            const count = await tx.valuation.count({
                where: { projectId }
            });
            const valuationNumber = `VAL-${String(count + 1).padStart(3, '0')}`;

            // 2. Create Valuation Header
            const valuation = await tx.valuation.create({
                data: {
                    projectId,
                    number: valuationNumber,
                    description,
                    date: new Date(date),
                    totalAmount: items.reduce((acc, item) => acc + item.amount, 0),
                    retentionAmount,
                    retentionPercentage,
                    netAmount,
                    status: 'completado',
                    items: {
                        create: items.map(item => ({
                            projectItemId: item.projectItemId,
                            quantity: item.quantity,
                            price: item.price,
                            amount: item.amount,
                        }))
                    }
                },
                include: {
                    items: true
                }
            });

            // Registrar en bitácora
            await tx.siteLog.create({
                data: {
                    projectId,
                    authorId: userId,
                    type: 'info',
                    content: `PLANILLA DE AVANCE: Generada ${valuationNumber} - ${description}. Total: ${valuation.totalAmount.toLocaleString('es-ES')} BOB.`,
                    date: new Date()
                }
            }).catch(() => null);

            // 3. Update ProjectItem progress ONLY if requested (usually for on-the-fly certifications)
            if (updateProgress) {
                for (const item of items) {
                    await tx.projectItem.update({
                        where: { id: item.projectItemId },
                        data: {
                            progress: {
                                increment: item.quantity
                            }
                        }
                    });
                }
            }

            return valuation;
        });

        revalidatePath(`/projects/${projectId}/operations`);
        return { success: true, valuation: result };
    } catch (error: any) {
        console.error('Error creating valuation:', error);
        return { success: false, error: error.message };
    }
}
