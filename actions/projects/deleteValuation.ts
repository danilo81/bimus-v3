'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function deleteValuation(id: string) {
    if (!id) return { success: false, error: 'Valuation ID is required' };

    try {
        const userId = await getAuthUserId();
        if (!userId) throw new Error("No autorizado");

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get the valuation and its items to know what to revert
            const valuation = await tx.valuation.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!valuation) throw new Error("Valuación no encontrada");

            // 2. Revert progress in ProjectItem for each valuation item
            for (const item of valuation.items) {
                await tx.projectItem.update({
                    where: { id: item.projectItemId },
                    data: {
                        progress: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            // 3. Delete the valuation (ValuationItems will be deleted in cascade because of the schema)
            await tx.valuation.delete({
                where: { id }
            });

            // Registrar en bitácora
            await tx.siteLog.create({
                data: {
                    projectId: valuation.projectId,
                    authorId: userId,
                    type: 'info',
                    content: `PLANILLA ELIMINADA: ${valuation.number} - ${valuation.description}. El progreso de los ítems ha sido revertido.`,
                    date: new Date()
                }
            }).catch(() => null);

            return { projectId: valuation.projectId };
        });

        revalidatePath(`/projects/${result.projectId}/operations`);
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting valuation:', error);
        return { success: false, error: error.message };
    }
}
