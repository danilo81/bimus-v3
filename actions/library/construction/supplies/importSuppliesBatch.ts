/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function importSuppliesBatch(data: any[]) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;

        if (!userId) {
            return { success: false, error: 'Usuario no autenticado.' };
        }

        // 1. Obtener datos de validación de la DB
        const [validUnits, existingSupplies] = await Promise.all([
            prisma.unit.findMany({
                select: { abbreviation: true }
            }),
            prisma.supply.findMany({
                where: { userId },
                select: { description: true }
            })
        ]);

        // Normalizamos a mayúsculas para comparaciones precisas
        const validAbbreviations = validUnits.map(u => u.abbreviation.toUpperCase());
        const existingDescriptions = new Set(existingSupplies.map(s => s.description.toUpperCase()));

        const formattedData = [];
        const errors = [];

        // 2. Procesar y validar cada fila del Excel
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;

            const nombre = (row.Nombre || '').toString().trim();
            const unit = (row.Unidad || '').toString().trim().toUpperCase();

            // --- A. Validar que la Unidad exista en la DB ---
            if (!validAbbreviations.includes(unit)) {
                errors.push(`Fila ${rowNum}: La unidad "${unit}" no existe en el sistema.`);
                continue;
            }

            // --- B. Validar si el insumo ya existe (Duplicado) ---
            if (existingDescriptions.has(nombre.toUpperCase())) {
                errors.push(`Fila ${rowNum}: El insumo "${nombre}" ya existe en su catálogo.`);
                continue;
            }

            // --- C. Validar y formatear Costo ---
            let rawCost = row.Costo;
            if (typeof rawCost === 'string') {
                rawCost = rawCost.replace(',', '.');
            }
            const parsedCost = parseFloat(rawCost);

            if (isNaN(parsedCost) || parsedCost < 0) {
                errors.push(`Fila ${rowNum}: Costo inválido.`);
                continue;
            }

            formattedData.push({
                userId: userId,
                description: nombre || 'Sin descripción',
                typology: row.Tipologia || 'Material',
                unit: unit,
                price: parsedCost,
            });
        }

        // 3. Si hay errores de validación, abortamos y reportamos
        if (errors.length > 0) {
            return {
                success: false,
                error: `Se encontraron ${errors.length} problemas.`,
                details: errors
            };
        }

        if (formattedData.length === 0) {
            return { success: false, error: 'No hay datos válidos o nuevos para importar.' };
        }

        // 4. Inserción masiva
        await prisma.supply.createMany({
            data: formattedData,
            skipDuplicates: true
        });

        revalidatePath('/library/construction/supplies');
        return { success: true, count: formattedData.length };

    } catch (error: any) {
        console.error("Error en importación:", error);
        return { success: false, error: 'Error interno del servidor.' };
    }
}