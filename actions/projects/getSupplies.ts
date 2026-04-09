'use server';

import prisma from "@/lib/prisma";

export async function getSupplies(id: string) {
    try {
        const supplies = await prisma.supply.findMany({
            where: { userId: id },
            include: {
                costs: {
                    include: {
                        supplier: true
                    },
                    orderBy: { date: 'desc' }
                }
            },
            orderBy: { description: 'asc' },
        });

        const formattedSupplies = supplies.map((s: any) => ({
            ...s,
            costs: s.costs.map((c: any) => ({
                ...c,
                date: c.date.toISOString().split('T')[0]
            }))
        }));

        return { success: true, supplies: JSON.parse(JSON.stringify(formattedSupplies)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}