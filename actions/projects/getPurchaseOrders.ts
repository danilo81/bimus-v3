'use server';

import prisma from "@/lib/prisma";

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