'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CreateWarehouseMovementData } from "@/types/types";

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