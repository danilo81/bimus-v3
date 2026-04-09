'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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