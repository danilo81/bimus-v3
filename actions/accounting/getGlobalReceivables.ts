'use server';

import prisma from '../../lib/prisma';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function getGlobalReceivables() {
    try {
        const userId = await getAuthUserId();
        if (!userId) return null;

        const transactions = await prisma.projectTransaction.findMany({
            where: {
                type: 'ingreso',
                project: {
                    authorId: userId,
                    status: 'activo'
                }
            },
            include: {
                project: {
                    select: {
                        title: true,
                        client: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        const totalReceivable = transactions.reduce((sum, t) => sum + t.amount, 0);
        const thisMonth = new Date().getMonth();
        const collectedThisMonth = transactions
            .filter(t => new Date(t.date).getMonth() === thisMonth)
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalReceivable,
            collectedThisMonth,
            pendingCount: transactions.length,
            items: transactions.map(t => ({
                id: `REC-${t.id.slice(-4).toUpperCase()}`,
                client: t.project.client || 'Cliente General',
                project: t.project.title,
                amount: t.amount,
                dueDate: t.date.toISOString().split('T')[0],
                status: 'pending'
            }))
        };
    } catch (error) {
        console.error('Error fetching global receivables:', error);
        return null;
    }
}