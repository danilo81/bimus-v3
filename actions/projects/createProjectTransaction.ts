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

export async function createProjectTransaction(data: CreateTransactionData) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const transaction = await prisma.$transaction(async (tx) => {
            const newTransaction = await tx.projectTransaction.create({
                data: {
                    projectId: data.projectId,
                    amount: data.amount,
                    type: data.type,
                    category: data.category,
                    description: data.description,
                    date: data.date ? new Date(data.date) : new Date()
                }
            });

            // Registrar en bitácora
            await tx.siteLog.create({
                data: {
                    projectId: data.projectId,
                    authorId: userId,
                    type: 'info',
                    content: `MOVIMIENTO TESORERÍA (${data.type.toUpperCase()}): Se registró "${data.description}" por ${data.amount.toLocaleString('es-ES')} BOB en la categoría ${data.category.toUpperCase()}.`,
                    date: new Date()
                }
            }).catch(() => null);

            return newTransaction;
        });

        revalidatePath(`/projects/${data.projectId}/operations`);
        revalidatePath(`/projects/${data.projectId}/accounting`);
        return { success: true, transaction };
    } catch (error: any) {
        console.error('Error creating project transaction:', error);
        return { success: false, error: error.message || 'Error al registrar el movimiento.' };
    }
}