/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import prisma from '@/lib/prisma'; // Asegúrate de que la ruta a prisma sea la correcta en tu proyecto
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function importSuppliesBatch(data: any[]) {
    try {
        // 1. Obtener el usuario autenticado (Opcional, pero recomendado si los insumos están ligados a un User)
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;

        if (!userId) {
            return { success: false, error: 'Usuario no autenticado.' };
        }

        // 2. Obtener las unidades válidas de la base de datos
        // Si las unidades son globales, quita el where. Si son por usuario, déjalo.
        const validUnits = await prisma.unit.findMany({
            select: { abbreviation: true }
        });

        // Convertimos a mayúsculas para hacer una comparación exacta
        const validAbbreviations = validUnits.map(u => u.abbreviation.toUpperCase());

        const formattedData = [];
        let errorCount = 0;

        // 3. Procesar y validar cada fila del Excel
        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            // --- A. Validar Unidad ---
            const unit = (row.Unidad || '').toString().trim().toUpperCase();
            if (!validAbbreviations.includes(unit)) {
                errorCount++;
                continue; // Saltamos este registro si es inválido
            }

            // --- B. Validar Costo ---
            let rawCost = row.Costo;
            let parsedCost = 0;

            if (rawCost === undefined || rawCost === null || rawCost === '') {
                errorCount++;
                continue;
            }

            if (typeof rawCost === 'string') {
                // Reemplazamos coma por punto por si viene de un Excel en español
                rawCost = rawCost.replace(',', '.');
            }
            parsedCost = parseFloat(rawCost);

            // Verificamos si es un número real y no es negativo
            if (isNaN(parsedCost) || parsedCost < 0) {
                errorCount++;
                continue;
            }

            // --- C. Formatear para Prisma ---
            formattedData.push({
                userId: userId, 
                description: row.Nombre || 'Sin descripción',
                typology: row.Tipologia || 'Material',
                unit: unit,
                price: parsedCost,
            });
        }

        // 4. Bloqueo de seguridad
        // Si el servidor detecta errores (alguien intentó saltarse el paso del Frontend)
        if (errorCount > 0) {
            return { 
                success: false, 
                error: `Se detectaron ${errorCount} registros con unidades o costos inválidos. La importación fue bloqueada por seguridad.` 
            };
        }

        if (formattedData.length === 0) {
            return { success: false, error: 'No hay datos válidos para importar.' };
        }

        // 5. Inserción masiva en la Base de Datos
        await prisma.supply.createMany({
            data: formattedData,
            skipDuplicates: true // Si tienes IDs o campos únicos, evita que el servidor crashee
        });

        // 6. Refrescar la caché de la página
        revalidatePath('/library/construction/supplies');
        
        return { success: true, count: formattedData.length };

    } catch (error: any) {
        console.error("Error importando insumos en el servidor:", error);
        return { success: false, error: 'Error interno del servidor al guardar los datos.' };
    }
}