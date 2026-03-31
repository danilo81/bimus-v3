'use server';

import prisma from "@/lib/prisma";

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