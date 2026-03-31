'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateSupply(id: string, data: {
    typology?: string;
    description?: string;
    unit?: string;
    price?: number;
    tag?: string;
}) {
    try {
        const supply = await prisma.supply.update({
            where: { id },
            data: data
        });
        revalidatePath('/library/construction/supplies');
        return { success: true, supply };
    } catch (error) {
        console.error('Error updating supply:', error);
        return { success: false, error: 'Fallo al actualizar el insumo.' };
    }
}