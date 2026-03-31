'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { Supply } from "@/types/types";

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function createSupply(data: Omit<Supply, 'id'> & { 
    supplierId?: string; 
    supplierPrice?: number; 
    supplierPriceDate?: string; 
}) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const supply = await prisma.supply.create({
            data: {
                typology: data.typology,
                description: data.description,
                unit: data.unit,
                price: data.price,
                tag: data.tag,
                userId: userId,
            }
        });

        // Crear costo inicial si se proporciona proveedor
        if (data.supplierId && data.supplierId !== 'none') {
            await prisma.supplyCost.create({
                data: {
                    supplyId: supply.id,
                    supplierId: data.supplierId,
                    price: data.supplierPrice || 0,
                    date: data.supplierPriceDate ? new Date(data.supplierPriceDate) : new Date(),
                    isPreferred: true
                }
            });
        }
        revalidatePath('/library/construction/supplies');
        return { success: true, supply };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}