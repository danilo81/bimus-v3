'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteSupplyCost(costId: string) {
    try {
        await prisma.supplyCost.delete({
            where: { id: costId }
        });
        revalidatePath('/library/construction/supplies');
        return { success: true };
    } catch (error) {
        console.error('Error deleting supply cost:', error);
        return { success: false, error: 'Fallo al eliminar el costo.' };
    }
}