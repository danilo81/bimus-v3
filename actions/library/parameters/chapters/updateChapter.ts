'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateChapter(id: string, data: {
    name?: string;
}) {
    try {
        if (data.name) {
            const chapterToUpdate = await prisma.chapter.findUnique({
                where: { id },
                select: { userId: true }
            });

            if (chapterToUpdate) {
                const existing = await prisma.chapter.findFirst({
                    where: {
                        id: { not: id },
                        name: { equals: data.name, mode: 'insensitive' },
                        userId: chapterToUpdate.userId
                    }
                });

                if (existing) {
                    return { success: false, error: `Ya existe otro capítulo con el nombre "${data.name}".` };
                }
            }
        }

        const chapter = await prisma.chapter.update({
            where: { id },
            data
        });
        revalidatePath('/library/parameters/chapters');
        return { success: true, chapter };
    } catch (error) {
        console.error('Error updating chapter:', error);
        return { success: false, error: 'Error al actualizar el capítulo.' };
    }
}