'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteChapter(id: string) {
    try {
        const chapter = await prisma.chapter.findUnique({
            where: { id },
            select: { name: true }
        });

        if (!chapter) {
            return { success: false, error: 'Capítulo no encontrado.' };
        }

        const usageCount = await prisma.constructionItem.count({
            where: {
                chapter: chapter.name
            }
        });

        if (usageCount > 0) {
            return {
                success: false,
                error: `No se puede eliminar el capítulo "${chapter.name}" porque está siendo utilizado por ${usageCount} ítem(s) en la librería de construcción.`
            };
        }

        await prisma.chapter.delete({
            where: { id }
        });

        revalidatePath('/library/parameters/chapters');
        return { success: true };
    } catch (error) {
        console.error('Error deleting chapter:', error);
        return { success: false, error: 'Error interno al intentar eliminar el capítulo.' };
    }
}