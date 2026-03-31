'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
        const transaction = await prisma.projectTransaction.update({
            where: { id },
            data: {
                amount: data.amount,
                type: data.type,
                category: data.category,
                description: data.description,
                date: data.date ? new Date(data.date) : undefined
            }
        });

        revalidatePath(`/projects/${transaction.projectId}/operations`);
        return { success: true, transaction };
    } catch (error) {
        console.error('Error updating project transaction:', error);
        return { success: false, error: 'Error al actualizar el movimiento.' };
    }
}