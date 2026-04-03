'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export interface CreateSupplyRequestData {
    projectId: string;
    supplyId: string;
    quantity: number;
}

export async function createSupplyRequest(data: CreateSupplyRequestData) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const supply = await prisma.supply.findUnique({
            where: { id: data.supplyId },
            select: { description: true, unit: true }
        });

        const request = await prisma.supplyRequest.create({
            data: {
                projectId: data.projectId,
                supplyId: data.supplyId,
                quantity: data.quantity,
                status: 'pendiente'
            }
        });

        // Registrar en bitácora
        await prisma.siteLog.create({
            data: {
                projectId: data.projectId,
                authorId: userId,
                type: 'info',
                content: `PEDIDO DE OBRA: Se ha solicitado ${data.quantity} ${supply?.unit || ''} de "${supply?.description || 'Insumo'}".`,
                date: new Date()
            }
        }).catch(() => null);

        revalidatePath(`/projects/${data.projectId}/operations`);
        revalidatePath(`/projects/${data.projectId}/shop`);
        return { success: true, request };
    } catch (error: any) {
        console.error('Error creating supply request:', error);
        return { success: false, error: error.message || 'Error al procesar el pedido.' };
    }
}