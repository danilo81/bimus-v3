'use server';

import prisma from '../../lib/prisma';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function getAccountingOverview() {
    try {
        const userId = await getAuthUserId();
        if (!userId) return null;

        const transactions = await prisma.projectTransaction.findMany({
            where: {
                project: {
                    authorId: userId
                }
            },
            include: {
                project: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        const totalIncome = transactions
            .filter(t => t.type === 'ingreso')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === 'egreso')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            transactionCount: transactions.length,
            recentTransactions: transactions.slice(0, 8).map(t => ({
                id: t.id,
                date: t.date.toISOString(),
                type: t.type,
                category: t.category,
                description: t.description,
                amount: t.amount,
                projectName: t.project.title
            }))
        };
    } catch (error) {
        console.error('Error fetching accounting overview:', error);
        return null;
    }
}