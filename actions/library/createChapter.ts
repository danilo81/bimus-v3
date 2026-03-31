'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createChapter(data: {
    name: string;
    userId: string;
}) {
    try {
        const existing = await prisma.chapter.findFirst({
            where: {
                name: {
                    equals: data.name,
                    mode: 'insensitive'
                },
                userId: data.userId
            }
        });

        if (existing) {
            return {
                success: false,
                error: `El capítulo "${data.name}" ya existe en tu catálogo.`
            };
        }

        const chapter = await prisma.chapter.create({
            data: {
                name: data.name,
                userId: data.userId
            }
        });
        revalidatePath('/library/parameters/chapters');
        return { success: true, chapter };
    } catch (error) {
        console.error('Error creating chapter:', error);
        return { success: false, error: 'Error al crear el capítulo.' };
    }
}