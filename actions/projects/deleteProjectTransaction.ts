'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteProjectTransaction(id: string) {
    try {
        const transaction = await prisma.projectTransaction.delete({
            where: { id }
        });

        revalidatePath(`/projects/${transaction.projectId}/operations`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting project transaction:', error);
        return { success: false, error: 'Error al eliminar el movimiento.' };
    }
}