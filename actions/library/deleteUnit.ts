'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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