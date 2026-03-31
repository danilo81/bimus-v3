'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createSupplyLibrary(data: {
    typology: string;
    description: string;
    unit: string;
    price: number;
    userId: string;
    tag?: string;
    supplierId?: string | null;
    supplierPrice?: number | null;
    supplierPriceDate?: string | null;
}) {
    try {
        const existing = await prisma.supply.findFirst({
            where: {
                description: { equals: data.description, mode: 'insensitive' },
                userId: data.userId
            }
        });

        if (existing) {
            return {
                success: false,
                error: `El insumo "${data.description}" ya existe en tu catálogo maestro.`
            };
        }

        const supply = await prisma.$transaction(async (tx: any) => {
            const newSupply = await tx.supply.create({
                data: {
                    typology: data.typology,
                    description: data.description,
                    unit: data.unit,
                    price: data.price,
                    tag: data.tag,
                    userId: data.userId
                }
            });

            if (data.supplierId) {
                await tx.supplyCost.create({
                    data: {
                        supplyId: newSupply.id,
                        supplierId: data.supplierId,
                        price: data.supplierPrice || 0,
                        date: data.supplierPriceDate ? new Date(data.supplierPriceDate) : new Date(),
                        isPreferred: true
                    }
                });
            }

            return newSupply;
        });

        revalidatePath('/library/construction/supplies');
        revalidatePath('/library/construction/items');
        return { success: true, supply };
    } catch (error) {
        console.error('Error creating supply:', error);
        return { success: false, error: 'Error interno al crear el insumo.' };
    }
}