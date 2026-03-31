'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteSupply(id: string) {
    try {
        // Verificar si el insumo está siendo utilizado en algún item de construcción
        const itemsCount = await prisma.constructionItemSupply.count({
            where: { supplyId: id }
        });

        if (itemsCount > 0) {
            return {
                success: false,
                error: `No se puede eliminar: El insumo está en uso en ${itemsCount} análisis de precios.`
            };
        }

        await prisma.supply.delete({ where: { id } });
        revalidatePath('/library/construction/supplies');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}