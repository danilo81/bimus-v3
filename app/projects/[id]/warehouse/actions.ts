'use server';

import prisma from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { Supply, PurchaseOrder, WarehouseMovement, ConstructionItem } from "../../../../lib/types";

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

// Funciones para Insumos (Supplies)
export async function getSupplies() {
    try {
        const supplies = await prisma.supply.findMany({
            orderBy: { description: 'asc' },
        });
        return { success: true, supplies: JSON.parse(JSON.stringify(supplies)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createSupply(data: Omit<Supply, 'id'>) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const { updatedAt, ...rest } = data;
        const supply = await prisma.supply.create({
            data: {
                typology: rest.typology,
                description: rest.description,
                unit: rest.unit,
                price: rest.price,
                tag: rest.tag,
                userId: userId,
            }
        });
        revalidatePath('/library/construction/supplies');
        return { success: true, supply };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateSupply(id: string, data: Partial<Omit<Supply, 'id'>>) {
    try {
        const { updatedAt, userId: _, ...rest } = data;
        await prisma.supply.update({
            where: { id },
            data: rest as any,
        });
        revalidatePath('/library/construction/supplies');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

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


// Funciones para Órdenes de Compra (Purchase Orders)
export async function getPurchaseOrders(projectId: string) {
    try {
        const orders = await prisma.purchaseOrder.findMany({
            where: { projectId },
            include: {
                supplier: true,
                items: {
                    include: {
                        supply: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, orders: JSON.parse(JSON.stringify(orders)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createPurchaseOrder(data: Omit<PurchaseOrder, 'id' | 'number' | 'createdAt'>, projectId: string, items: { supplyId: string, quantity: number, unitPrice: number }[]) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        return await prisma.$transaction(async (tx: any) => {
            // 1. Crear la Orden de Compra
            const newOrder = await tx.purchaseOrder.create({
                data: {
                    ...data,
                    projectId: projectId,
                    authorId: userId,
                    totalAmount: items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
                    items: {
                        create: items.map(item => ({
                            supplyId: item.supplyId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        }))
                    }
                }
            });

            // 2. Vincular el proveedor al proyecto si no está ya vinculado
            if (data.supplierId) {
                const existingLink = await tx.projectContact.findUnique({
                    where: {
                        projectId_contactId: {
                            projectId: projectId,
                            contactId: data.supplierId
                        }
                    }
                });

                if (!existingLink) {
                    await tx.projectContact.create({
                        data: {
                            projectId: projectId,
                            contactId: data.supplierId
                        }
                    });
                }
            }

            // 3. Crear un registro en la bitácora
            await tx.siteLog.create({
                data: {
                    projectId,
                    authorId: userId,
                    type: 'info',
                    content: `Se generó la Orden de Compra N° ${newOrder.number}.`,
                    date: new Date()
                }
            });

            revalidatePath(`/projects/${projectId}/warehouse`);
            revalidatePath(`/projects/${projectId}`);
            return { success: true, order: newOrder };
        });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Funciones para Movimientos de Almacén (Warehouse Movements)
export async function getWarehouseMovements(projectId: string) {
    try {
        const movements = await prisma.warehouseMovement.findMany({
            where: { projectId },
            include: {
                supply: true,
                author: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, movements: JSON.parse(JSON.stringify(movements)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createWarehouseMovement(data: Omit<WarehouseMovement, 'id' | 'createdAt' | 'authorId'>, projectId: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const movement = await prisma.warehouseMovement.create({
            data: {
                ...data,
                projectId,
                authorId: userId
            }
        });
        revalidatePath(`/projects/${projectId}/warehouse`);
        return { success: true, movement };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Funciones para Items de Construcción (partidas)
export async function getConstructionItems() {
    try {
        const items = await prisma.constructionItem.findMany({
            include: {
                supplies: {
                    include: {
                        supply: true
                    }
                }
            },
            orderBy: { description: 'asc' },
        });
        return { success: true, items: JSON.parse(JSON.stringify(items)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createConstructionItem(data: Omit<ConstructionItem, 'id' | 'userId'>, supplies: { supplyId: string, quantity: number }[]) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const totalCost = await calculateTotalCost(supplies);

        const newItem = await prisma.constructionItem.create({
            data: {
                chapter: data.chapter,
                description: data.description,
                unit: data.unit,
                userId: userId,
                total: totalCost,
                supplies: {
                    create: supplies.map((s: any) => ({
                        supplyId: s.supplyId,
                        quantity: s.quantity
                    }))
                }
            }
        });

        revalidatePath('/library/construction/items');
        return { success: true, item: newItem };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateConstructionItem(id: string, data: Partial<Omit<ConstructionItem, 'id' | 'userId'>>, supplies: { supplyId: string, quantity: number }[]) {
    try {
        const totalCost = await calculateTotalCost(supplies);

        await prisma.constructionItem.update({
            where: { id },
            data: {
                chapter: data.chapter,
                description: data.description,
                unit: data.unit,
                total: totalCost,
                supplies: {
                    deleteMany: {},
                    create: supplies.map((s: any) => ({
                        supplyId: s.supplyId,
                        quantity: s.quantity
                    }))
                }
            }
        });

        revalidatePath('/library/construction/items');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function calculateTotalCost(supplies: { supplyId: string, quantity: number }[]): Promise<number> {
    let total = 0;
    for (const s of supplies) {
        const supplyDetails = await prisma.supply.findUnique({ where: { id: s.supplyId } });
        if (supplyDetails) {
            total += s.quantity * (supplyDetails.price || 0);
        }
    }
    return total;
}

export async function deleteConstructionItem(id: string) {
    try {
        const projectCount = await prisma.projectItem.count({ where: { itemId: id } });
        if (projectCount > 0) {
            return {
                success: false,
                error: `Operación bloqueada: La partida está en uso en ${projectCount} proyecto(s).`
            };
        }

        await prisma.constructionItemSupply.deleteMany({ where: { itemId: id } });
        await prisma.constructionItem.delete({ where: { id } });

        revalidatePath('/library/construction/items');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
