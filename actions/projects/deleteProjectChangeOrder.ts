'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function deleteProjectChangeOrder(id: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        // Fetch the change order first to verify it exists and get projectId
        const changeOrder = await (prisma as any).projectChangeOrder.findUnique({
            where: { id },
            select: { id: true, projectId: true, status: true, number: true, description: true }
        });

        if (!changeOrder) {
            return { success: false, error: "Orden de cambio no encontrada." };
        }

        // Business rule: cannot delete an approved change order since it already
        // impacts the project budget and may have associated transactions
        if (changeOrder.status === 'Aprobada') {
            return {
                success: false,
                error: "No se puede eliminar una orden de cambio aprobada. Por favor, cree una deducción para revertir el impacto financiero."
            };
        }

        await (prisma as any).$transaction(async (tx: any) => {
            // Registrar en bitácora
            await tx.siteLog.create({
                data: {
                    projectId: changeOrder.projectId,
                    authorId: userId,
                    type: 'info',
                    content: `ORDEN DE CAMBIO ELIMINADA: Se ha removido la ${changeOrder.number} (${changeOrder.description}).`,
                    date: new Date()
                }
            }).catch(() => null);

            await tx.projectChangeOrder.delete({
                where: { id }
            });
        });

        revalidatePath(`/projects/${changeOrder.projectId}/operations`);
        return { success: true, projectId: changeOrder.projectId };
    } catch (error: any) {
        console.error('Error deleting change order:', error);
        return { success: false, error: error.message };
    }
}
