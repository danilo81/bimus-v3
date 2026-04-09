'use server';

import prisma from "@/lib/prisma";

export async function getGlobalSupplyPriceUpdates() {
    try {
        const updates = await prisma.supplyCost.findMany({
            take: 10,
            include: {
                supply: { select: { description: true, unit: true } },
                supplier: { select: { name: true } }
            },
            orderBy: { date: 'desc' }
        });

        return updates.map(u => ({
            ...u,
            supplyName: u.supply?.description || 'Sin Supply',
            unit: u.supply?.unit || '',
            supplierName: u.supplier?.name || 'Desconocido',
            date: u.date.toISOString().split('T')[0],
        }));
    } catch (error) {
        console.error('Error fetching global supply price updates:', error);
        return [];
    }
}
