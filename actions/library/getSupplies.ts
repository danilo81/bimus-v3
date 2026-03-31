'use server';

import prisma from '@/lib/prisma';

export async function getSupplies(userId: string) {
    if (!userId) return [];
    try {
        const supplies = await prisma.supply.findMany({
            where: { userId },
            include: {
                costs: {
                    include: {
                        supplier: true
                    },
                    orderBy: { date: 'desc' }
                }
            },
            orderBy: { description: 'asc' }
        });

        return supplies.map((s: any) => ({
            ...s,
            updatedAt: s.updatedAt.toISOString(),
            costs: s.costs.map((c: any) => ({
                ...c,
                date: c.date.toISOString().split('T')[0]
            }))
        }));
    } catch (error) {
        console.error('Error fetching supplies:', error);
        return [];
    }
}