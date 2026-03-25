'use server';

import prisma from '../../../../lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSupplies(userId: string) {
    if (!userId) return [];
    try {
        const supplies = await prisma.supply.findMany({
            where: { userId },
            include: {
                costs: {
                    include: {
                        supplier: true
                    },
                    orderBy: { date: 'desc' }
                }
            },
            orderBy: { description: 'asc' }
        });

        return supplies.map((s: any) => ({
            ...s,
            updatedAt: s.updatedAt.toISOString(),
            costs: s.costs.map((c: any) => ({
                ...c,
                date: c.date.toISOString().split('T')[0]
            }))
        }));
    } catch (error) {
        console.error('Error fetching supplies:', error);
        return [];
    }
}

export async function createSupply(data: {
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

export async function updateSupply(id: string, data: {
    typology?: string;
    description?: string;
    unit?: string;
    price?: number;
    tag?: string;
}) {
    try {
        const supply = await prisma.supply.update({
            where: { id },
            data: data
        });
        revalidatePath('/library/construction/supplies');
        return { success: true, supply };
    } catch (error) {
        console.error('Error updating supply:', error);
        return { success: false, error: 'Fallo al actualizar el insumo.' };
    }
}

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
        });

        revalidatePath('/library/construction/supplies');
        return { success: true };
    } catch (error) {
        console.error('Error adding supply cost:', error);
        return { success: false, error: 'Fallo al registrar el costo del proveedor.' };
    }
}

export async function deleteSupplyCost(costId: string) {
    try {
        await prisma.supplyCost.delete({
            where: { id: costId }
        });
        revalidatePath('/library/construction/supplies');
        return { success: true };
    } catch (error) {
        console.error('Error deleting supply cost:', error);
        return { success: false, error: 'Fallo al eliminar el costo.' };
    }
}

export async function deleteSupply(id: string) {
    try {
        await prisma.supply.delete({
            where: { id }
        });

        revalidatePath('/library/construction/supplies');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting supply:', error);
        if (error.code === 'P2003') {
            return { success: false, error: 'No se puede eliminar el insumo porque está vinculado a una o más partidas.' };
        }
        return { success: false, error: 'Error al eliminar el insumo.' };
    }
}

export async function getSupplyCosts(supplyId: string) {
    try {
        const costs = await prisma.supplyCost.findMany({
            where: { supplyId },
            include: {
                supplier: true
            },
            orderBy: {
                date: 'desc'
            }
        });

        return costs.map((c: any) => ({
            ...c,
            date: c.date.toISOString().split('T')[0]
        }));
    } catch (error) {
        console.error('Error fetching supply costs:', error);
        return [];
    }
}
