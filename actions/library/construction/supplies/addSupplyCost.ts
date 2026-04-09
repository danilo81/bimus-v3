'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addSupplyCost(data: {
    supplyId: string;
    supplierId: string;
    price: number;
    date: string;
    isPreferred?: boolean;
    notes?: string;
}) {
    try {
        await prisma.$transaction(async (tx: any) => {
            if (data.isPreferred) {
                await tx.supplyCost.updateMany({
                    where: { supplyId: data.supplyId },
                    data: { isPreferred: false }
                });
            }

            await tx.supplyCost.create({
                data: {
                    supplyId: data.supplyId,
                    supplierId: data.supplierId,
                    price: data.price,
                    date: new Date(data.date),
                    isPreferred: data.isPreferred || false,
                    notes: data.notes
                }
            });

            // Si es el precio preferido, actualizamos el precio base del insumo
            if (data.isPreferred) {
                await tx.supply.update({
                    where: { id: data.supplyId },
                    data: { price: data.price }
                });
            }
        });

        revalidatePath('/library/construction/supplies');
        return { success: true };
    } catch (error) {
        console.error('Error adding supply cost:', error);
        return { success: false, error: 'Fallo al registrar el costo del proveedor.' };
    }
}