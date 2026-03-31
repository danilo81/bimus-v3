'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteSupply(id: string) {
    try {
        await prisma.supply.delete({
            where: { id }
        });

        revalidatePath('/library/construction/supplies');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting supply:', error);
        if (error.code === 'P2003') {
            return { success: false, error: 'No se puede eliminar el insumo porque está vinculado a una o más partidas.' };
        }
        return { success: false, error: 'Error al eliminar el insumo.' };
    }
}