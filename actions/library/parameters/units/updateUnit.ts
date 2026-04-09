'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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