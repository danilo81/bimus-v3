'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteAsset(id: string) {
    try {
        await prisma.fixedAsset.delete({
            where: { id }
        });
        revalidatePath('/library/construction/assets');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting asset:', error);
        return { success: false, error: 'Error al eliminar el activo fijo.' };
    }
}
