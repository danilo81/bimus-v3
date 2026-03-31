'use server';
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
