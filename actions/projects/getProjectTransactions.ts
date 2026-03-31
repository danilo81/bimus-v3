'use server';

import prisma from "@/lib/prisma";

export async function getProjectTransactions(projectId: string) {
    try {
        const transactions = await prisma.projectTransaction.findMany({
            where: { projectId },
            orderBy: {
                date: 'desc'
            }
        });

        return transactions.map(t => ({
            ...t,
            date: t.date.toISOString().split('T')[0],
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
        }));
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}