'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export interface CreateTransactionData {
    projectId: string;
    amount: number;
    type: 'ingreso' | 'egreso';
    category: string;
    description: string;
    date?: string;
}

export async function updateProjectTransaction(id: string, data: Partial<CreateTransactionData>) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const transaction = await prisma.$transaction(async (tx) => {
            const updated = await tx.projectTransaction.update({
                where: { id },
                data: {
                    amount: data.amount,
                    type: data.type,
                    category: data.category,
                    description: data.description,
                    date: data.date ? new Date(data.date) : undefined
                }
            });

            // Registrar en bitácora
            await tx.siteLog.create({
                data: {
                    projectId: updated.projectId,
                    authorId: userId,
                    type: 'info',
                    content: `MOVIMIENTO TESORERÍA ACTUALIZADO: Se modificó el registro "${updated.description}" (${updated.type.toUpperCase()}) por ${updated.amount.toLocaleString('es-ES')} BOB.`,
                    date: new Date()
                }
            }).catch(() => null);

            return updated;
        });

        revalidatePath(`/projects/${transaction.projectId}/operations`);
        revalidatePath(`/projects/${transaction.projectId}/accounting`);
        return { success: true, transaction };
    } catch (error: any) {
        console.error('Error updating project transaction:', error);
        return { success: false, error: error.message || 'Error al actualizar el movimiento.' };
    }
}