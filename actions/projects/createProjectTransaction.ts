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

export async function createProjectTransaction(data: CreateTransactionData) {
    try {
        const transaction = await prisma.projectTransaction.create({
            data: {
                projectId: data.projectId,
                amount: data.amount,
                type: data.type,
                category: data.category,
                description: data.description,
                date: data.date ? new Date(data.date) : new Date()
            }
        });

        revalidatePath(`/projects/${data.projectId}/operations`);
        revalidatePath(`/projects/${data.projectId}/accounting`);
        return { success: true, transaction };
    } catch (error) {
        console.error('Error creating project transaction:', error);
        return { success: false, error: 'Error al registrar el movimiento.' };
    }
}