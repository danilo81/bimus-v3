'use server';

import prisma from '../../../../lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getChapters(userId: string) {
    try {
        const chapters = await prisma.chapter.findMany({
            where: { userId },
            orderBy: { name: 'asc' }
        });
        return chapters;
    } catch (error) {
        console.error('Error fetching chapters:', error);
        return [];
    }
}

export async function createChapter(data: {
    name: string;
    userId: string;
}) {
    try {
        // Verificar si ya existe un capítulo con el mismo nombre para este usuario
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

export async function updateChapter(id: string, data: {
    name?: string;
}) {
    try {
        // Si se intenta actualizar el nombre, verificar que no cause un duplicado
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

export async function deleteChapter(id: string) {
    try {
        // 1. Obtener el capítulo para conocer su nombre
        const chapter = await prisma.chapter.findUnique({
            where: { id },
            select: { name: true }
        });

        if (!chapter) {
            return { success: false, error: 'Capítulo no encontrado.' };
        }

        // 2. Verificar si algún Item de Construcción utiliza este capítulo
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

        // 3. Proceder con la eliminación si no hay dependencias
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
