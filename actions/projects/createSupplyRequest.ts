'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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