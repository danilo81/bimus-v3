'use server';

import prisma from '../../../../lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getUnits(userId: string) {
    try {
        const units = await prisma.unit.findMany({
            where: { userId },
            orderBy: { name: 'asc' }
        });
        return units;
    } catch (error) {
        console.error('Error fetching units:', error);
        return [];
    }
}

export async function createUnit(data: {
    name: string;
    abbreviation: string;
    magnitude: string;
    userId: string;
}) {
    try {
        // Verificar duplicados por nombre o abreviación para el mismo usuario
        const existing = await prisma.unit.findFirst({
            where: {
                userId: data.userId,
                OR: [
                    { name: { equals: data.name, mode: 'insensitive' } },
                    { abbreviation: { equals: data.abbreviation, mode: 'insensitive' } }
                ]
            }
        });

        if (existing) {
            const isSameName = existing.name.toLowerCase() === data.name.toLowerCase();
            return {
                success: false,
                error: isSameName
                    ? `La unidad "${data.name}" ya existe en tu catálogo.`
                    : `La abreviación "${data.abbreviation}" ya está asignada a la unidad "${existing.name}".`
            };
        }

        const unit = await prisma.unit.create({
            data: {
                name: data.name,
                abbreviation: data.abbreviation,
                magnitude: data.magnitude,
                userId: data.userId
            }
        });
        revalidatePath('/library/parameters/units');
        return { success: true, unit };
    } catch (error) {
        console.error('Error creating unit:', error);
        return { success: false, error: 'Error al crear la unidad.' };
    }
}
export async function updateUnit(id: string, data: {
    name?: string;
    abbreviation?: string;
    magnitude?: string;
}) {
    try {
        const unit = await prisma.unit.update({
            where: { id },
            data
        });
        revalidatePath('/library/parameters/units');
        return { success: true, unit };
    } catch (error) {
        console.error('Error updating unit:', error);
        return { success: false, error: 'Error al actualizar la unidad.' };
    }
}

export async function deleteUnit(id: string) {
    try {
        // 1. Obtener la unidad para conocer su abreviación
        const unit = await prisma.unit.findUnique({
            where: { id },
            select: { name: true, abbreviation: true }
        });

        if (!unit) {
            return { success: false, error: 'Unidad no encontrada.' };
        }

        // 2. Verificar si algún insumo (Supply) utiliza esta unidad
        const supplyCount = await prisma.supply.count({
            where: {
                unit: unit.abbreviation
            }
        });

        if (supplyCount > 0) {
            return {
                success: false,
                error: `Inconsistencia detectada: No se puede eliminar la unidad "${unit.name}" porque está siendo utilizada por ${supplyCount} insumo(s).`
            };
        }

        // 3. Verificar si algún item de construcción (ConstructionItem) utiliza esta unidad
        const constructionItemCount = await prisma.constructionItem.count({
            where: {
                unit: unit.abbreviation
            }
        });

        if (constructionItemCount > 0) {
            return {
                success: false,
                error: `Inconsistencia detectada: No se puede eliminar la unidad "${unit.name}" porque está siendo utilizada por ${constructionItemCount} item(s) de construcción.`
            };
        }

        // 4. Proceder con la eliminación si no hay dependencias
        await prisma.unit.delete({
            where: { id }
        });

        revalidatePath('/library/parameters/units');
        return { success: true };
    } catch (error) {
        console.error('Error deleting unit:', error);
        return { success: false, error: 'Error interno al intentar eliminar la unidad.' };
    }
}