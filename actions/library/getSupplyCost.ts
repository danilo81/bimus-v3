'use server';

import prisma from '@/lib/prisma';

export async function getSupplyCosts(supplyId: string) {
    try {
        const costs = await prisma.supplyCost.findMany({
            where: { supplyId },
            include: {
                supplier: true
            },
            orderBy: {
                date: 'desc'
            }
        });

        return costs.map((c: any) => ({
            ...c,
            date: c.date.toISOString().split('T')[0]
        }));
    } catch (error) {
        console.error('Error fetching supply costs:', error);
        return [];
    }
}
