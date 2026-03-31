'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { WarehouseItem, CreateWarehouseMovementData } from "@/types/types";

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