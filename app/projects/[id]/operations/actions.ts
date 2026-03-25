'use server';

import prisma from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";

// --- Supply Requests CRUD ---

export interface CreateSupplyRequestData {
    projectId: string;
    supplyId: string;
    quantity: number;
}

export async function createSupplyRequest(data: CreateSupplyRequestData) {
    try {
        const request = await prisma.supplyRequest.create({
            data: {
                projectId: data.projectId,
                supplyId: data.supplyId,
                quantity: data.quantity,
                status: 'pendiente'
            }
        });

        revalidatePath(`/projects/${data.projectId}/operations`);
        revalidatePath(`/projects/${data.projectId}/shop`);
        return { success: true, request };
    } catch (error) {
        console.error('Error creating supply request:', error);
        return { success: false, error: 'Error al procesar el pedido.' };
    }
}

export async function getSupplyRequests(projectId: string) {
    try {
        const requests = await prisma.supplyRequest.findMany({
            where: { projectId },
            include: {
                supply: {
                    include: {
                        costs: {
                            include: {
                                supplier: true
                            },
                            orderBy: { date: 'desc' }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return requests.map(r => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
            supply: {
                ...r.supply,
                costs: r.supply.costs.map(c => ({
                    ...c,
                    date: c.date.toISOString().split('T')[0]
                }))
            }
        }));
    } catch (error) {
        console.error('Error fetching supply requests:', error);
        return [];
    }
}

export interface InspectionCheckInput {
    qualityControlId: string;
    subPointId?: string;
    passed: boolean;
    observation?: string;
}

export interface CreateInspectionRecordData {
    projectId: string;
    projectItemId: string;
    levelId?: string;
    inspector?: string;
    date?: string;
    notes?: string;
    checks: InspectionCheckInput[];
}

export async function createInspectionRecord(data: CreateInspectionRecordData) {
    try {
        const record = await prisma.inspectionRecord.create({
            data: {
                projectId: data.projectId,
                projectItemId: data.projectItemId,
                levelId: data.levelId || null,
                inspector: data.inspector || null,
                date: data.date ? new Date(data.date) : new Date(),
                notes: data.notes || null,
                status: data.checks.every(c => c.passed) ? 'aprobado' : data.checks.some(c => c.passed) ? 'parcial' : 'rechazado',
                checks: {
                    create: data.checks.map(c => ({
                        qualityControlId: c.qualityControlId,
                        subPointId: c.subPointId || null,
                        passed: c.passed,
                        observation: c.observation || null,
                    }))
                }
            },
            include: { checks: true }
        });

        revalidatePath(`/projects/${data.projectId}/operations`);
        return { success: true, record };
    } catch (error) {
        console.error('Error creating inspection record:', error);
        return { success: false, error: 'Error al registrar la inspección.' };
    }
}

export async function getInspectionRecords(projectId: string) {
    try {
        const records = await prisma.inspectionRecord.findMany({
            where: { projectId },
            include: {
                projectItem: {
                    include: {
                        item: {
                            include: {
                                qualityControls: { include: { subPoints: true } }
                            }
                        }
                    }
                },
                level: { select: { id: true, name: true } },
                checks: true,
            },
            orderBy: { date: 'desc' }
        });

        return records.map(r => ({
            ...r,
            date: r.date.toISOString().split('T')[0],
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
        }));
    } catch (error) {
        console.error('Error fetching inspection records:', error);
        return [];
    }
}

export async function deleteInspectionRecord(id: string, projectId: string) {
    try {
        await prisma.inspectionRecord.delete({ where: { id } });
        revalidatePath(`/projects/${projectId}/operations`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting inspection record:', error);
        return { success: false, error: 'Error al eliminar el registro.' };
    }
}
// --- Project Transactions CRUD ---

export interface CreateTransactionData {
    projectId: string;
    amount: number;
    type: 'ingreso' | 'egreso';
    category: string;
    description: string;
    date?: string;
}

export async function createProjectTransaction(data: CreateTransactionData) {
    try {
        const transaction = await prisma.projectTransaction.create({
            data: {
                projectId: data.projectId,
                amount: data.amount,
                type: data.type,
                category: data.category,
                description: data.description,
                date: data.date ? new Date(data.date) : new Date()
            }
        });

        revalidatePath(`/projects/${data.projectId}/operations`);
        revalidatePath(`/projects/${data.projectId}/accounting`);
        return { success: true, transaction };
    } catch (error) {
        console.error('Error creating project transaction:', error);
        return { success: false, error: 'Error al registrar el movimiento.' };
    }
}

export async function getProjectTransactions(projectId: string) {
    try {
        const transactions = await prisma.projectTransaction.findMany({
            where: { projectId },
            orderBy: {
                date: 'desc'
            }
        });

        return transactions.map(t => ({
            ...t,
            date: t.date.toISOString().split('T')[0],
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
        }));
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

export async function updateProjectTransaction(id: string, data: Partial<CreateTransactionData>) {
    try {
        const transaction = await prisma.projectTransaction.update({
            where: { id },
            data: {
                amount: data.amount,
                type: data.type,
                category: data.category,
                description: data.description,
                date: data.date ? new Date(data.date) : undefined
            }
        });

        revalidatePath(`/projects/${transaction.projectId}/operations`);
        return { success: true, transaction };
    } catch (error) {
        console.error('Error updating project transaction:', error);
        return { success: false, error: 'Error al actualizar el movimiento.' };
    }
}

export async function deleteProjectTransaction(id: string) {
    try {
        const transaction = await prisma.projectTransaction.delete({
            where: { id }
        });

        revalidatePath(`/projects/${transaction.projectId}/operations`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting project transaction:', error);
        return { success: false, error: 'Error al eliminar el movimiento.' };
    }
}

// --- Purchase Orders CRUD ---

export interface CreatePurchaseOrderData {
    projectId: string;
    supplierId: string;
    paymentType: 'debito' | 'credito';
    dueDate?: string;
    items: {
        supplyId: string;
        quantity: number;
        price: number;
    }[];
}

export async function createPurchaseOrder(data: CreatePurchaseOrderData) {
    try {
        const count = await prisma.purchaseOrder.count({
            where: { projectId: data.projectId }
        });
        const number = `OC-${(count + 1).toString().padStart(3, '0')}`;

        const totalAmount = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);

        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.purchaseOrder.create({
                data: {
                    projectId: data.projectId,
                    supplierId: data.supplierId,
                    number,
                    totalAmount,
                    status: 'pendiente',
                    items: {
                        create: data.items.map(item => ({
                            supplyId: item.supplyId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                },
                include: {
                    supplier: true
                }
            });

            // Mark relevant supply requests as processed
            await tx.supplyRequest.updateMany({
                where: {
                    projectId: data.projectId,
                    supplyId: { in: data.items.map(i => i.supplyId) },
                    status: 'pendiente'
                },
                data: {
                    status: 'procesado'
                }
            });

            // If it's Debit, create an instant transaction (Egreso)
            if (data.paymentType === 'debito') {
                await tx.projectTransaction.create({
                    data: {
                        projectId: data.projectId,
                        amount: totalAmount,
                        type: 'egreso',
                        category: 'materiales',
                        description: `PAGO CONTADO: OC ${number} - ${newOrder.supplier?.company || 'Proveedor'}`,
                        date: new Date()
                    }
                });
            }
            // If it's Credit, the PO itself acts as a payable until marked 'completado'

            return newOrder;
        });

        revalidatePath(`/projects/${data.projectId}/operations`);
        revalidatePath(`/projects/${data.projectId}/shop`);
        revalidatePath(`/projects/${data.projectId}/accounting`);
        return { success: true, order };
    } catch (error) {
        console.error('Error creating purchase order:', error);
        return { success: false, error: 'Error al generar la orden de compra.' };
    }
}

export async function getPurchaseOrders(projectId: string) {
    try {
        const orders = await prisma.purchaseOrder.findMany({
            where: { projectId },
            include: {
                items: {
                    include: {
                        supply: true
                    }
                },
                supplier: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return orders.map(o => ({
            ...o,
            date: o.date.toISOString().split('T')[0],
            createdAt: o.createdAt.toISOString(),
            updatedAt: o.updatedAt.toISOString(),
        }));
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        return [];
    }
}

export async function deletePurchaseOrder(id: string) {
    try {
        const order = await prisma.purchaseOrder.findUnique({
            where: { id },
            select: { projectId: true }
        });

        if (!order) return { success: false, error: 'Orden no encontrada' };

        await prisma.purchaseOrder.delete({
            where: { id }
        });

        revalidatePath(`/projects/${order.projectId}/operations`);
        revalidatePath(`/projects/${order.projectId}/shop`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting purchase order:', error);
        return { success: false, error: 'Error al eliminar la orden de compra.' };
    }
}

// --- Warehouse Movement CRUD ---

export interface WarehouseItem {
    supplyId: string;
    quantity: number;
    itemId?: string;
    levelId?: string;
}

export interface CreateWarehouseMovementData {
    projectId: string;
    purchaseOrderId?: string;
    items: WarehouseItem[];
    notes?: string;
}


export async function createWarehouseEntry(data: CreateWarehouseMovementData) {
    try {
        const movements = await prisma.$transaction(async (tx) => {
            const movs = [];
            for (const item of data.items) {
                const m = await tx.warehouseMovement.create({
                    data: {
                        type: 'entry',
                        quantity: item.quantity,
                        notes: data.notes,
                        projectId: data.projectId,
                        supplyId: item.supplyId,
                        purchaseOrderId: data.purchaseOrderId || null,
                    }
                });
                movs.push(m);
            }

            // Si hay una orden de compra vinculada, actualizamos el estado de los pedidos a 'almacenado'
            if (data.purchaseOrderId) {
                const po = await tx.purchaseOrder.findUnique({
                    where: { id: data.purchaseOrderId },
                    include: { items: true }
                });

                if (po) {
                    const supplyIds = po.items.map(i => i.supplyId);
                    await tx.supplyRequest.updateMany({
                        where: {
                            projectId: data.projectId,
                            supplyId: { in: supplyIds },
                            status: 'procesado'
                        },
                        data: {
                            status: 'almacenado'
                        }
                    });

                    // Marcamos la orden de compra como completada tras el ingreso físico total
                    await tx.purchaseOrder.update({
                        where: { id: data.purchaseOrderId },
                        data: { status: 'completado' }
                    });
                }
            }

            return movs;
        });

        revalidatePath(`/projects/${data.projectId}/operations`);
        revalidatePath(`/projects/${data.projectId}/shop`);
        revalidatePath(`/projects/${data.projectId}/warehouse`);
        return { success: true, movements };
    } catch (error) {
        console.error('Error creating warehouse entry:', error);
        return { success: false, error: 'Error al registrar el ingreso a almacén.' };
    }
}


export async function createWarehouseExit(data: CreateWarehouseMovementData) {
    try {
        const movements = await prisma.$transaction(
            data.items.map(item =>
                prisma.warehouseMovement.create({
                    data: {
                        type: 'exit',
                        quantity: item.quantity,
                        notes: data.notes,
                        projectId: data.projectId,
                        supplyId: item.supplyId,
                    }
                })
            )
        );

        revalidatePath(`/projects/${data.projectId}/operations`);
        revalidatePath(`/projects/${data.projectId}/warehouse`);
        return { success: true, movements };
    } catch (error) {
        console.error('Error creating warehouse exit:', error);
        return { success: false, error: 'Error al registrar la salida de almacén.' };
    }
}

export async function getWarehouseStock(projectId: string) {
    try {
        const movements = await prisma.warehouseMovement.findMany({
            where: { projectId },
            select: {
                supplyId: true,
                type: true,
                quantity: true,
            }
        });

        const stockMap: Record<string, { totalIn: number; totalOut: number; currentStock: number }> = {};
        for (const m of movements) {
            if (!stockMap[m.supplyId]) {
                stockMap[m.supplyId] = { totalIn: 0, totalOut: 0, currentStock: 0 };
            }
            if (m.type === 'entry') {
                stockMap[m.supplyId].totalIn += m.quantity;
            } else {
                stockMap[m.supplyId].totalOut += m.quantity;
            }
            stockMap[m.supplyId].currentStock = stockMap[m.supplyId].totalIn - stockMap[m.supplyId].totalOut;
        }

        return stockMap;
    } catch (error) {
        console.error('Error fetching warehouse stock:', error);
        return {};
    }
}

export async function getProjectWarehouseMovements(projectId: string) {
    try {
        const movements = await prisma.warehouseMovement.findMany({
            where: { projectId },
            include: {
                supply: { select: { description: true, unit: true } },
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return movements.map(m => ({
            ...m,
            date: m.createdAt.toISOString(),
            supplyName: m.supply.description,
            unit: m.supply.unit,
            itemName: 'N/A',
            levelName: 'N/A'
        }));
    } catch (error) {
        console.error('Error fetching project movements:', error);
        return [];
    }
}
