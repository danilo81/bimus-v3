'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteConstructionItemLibrary(id: string) {
    try {

        const usageCount = await prisma.projectItem.count({
            where: { itemId: id }
        });

        if (usageCount > 0) {
            return {
                success: false,
                error: `No se puede eliminar la partida porque está siendo utilizada en ${usageCount} proyecto(s) activos. Debe desvincularla antes de proceder.`
            };
        }

        await prisma.constructionItemSupply.deleteMany({ where: { itemId: id } });
        await prisma.qualityControl.deleteMany({ where: { itemId: id } });

        await prisma.constructionItem.delete({
            where: { id }
        });

        revalidatePath('/library/construction/items');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting construction item:', error);
        return { success: false, error: 'Error inesperado al intentar eliminar el ítem de la librería.' };
    }
}