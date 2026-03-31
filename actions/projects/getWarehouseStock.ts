'use server';

import prisma from "@/lib/prisma";

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