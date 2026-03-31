'use server';

import prisma from '../../lib/prisma';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function getProjectBalances() {
    try {
        const userId = await getAuthUserId();
        if (!userId) return [];

        const projects = await prisma.project.findMany({
            where: { authorId: userId },
            include: {
                transactions: true,
                items: {
                    include: {
                        item: true
                    }
                }
            }
        });

        return projects.map(p => {
            const income = p.transactions
                .filter(t => t.type === 'ingreso')
                .reduce((sum, t) => sum + t.amount, 0);

            const expense = p.transactions
                .filter(t => t.type === 'egreso')
                .reduce((sum, t) => sum + t.amount, 0);

            const budget = p.items.reduce((sum, pi) => sum + (pi.quantity * (pi.item?.total || 0)), 0);

            return {
                id: p.id,
                title: p.title,
                status: p.status,
                income,
                expense,
                balance: income - expense,
                budget,
                execution: budget > 0 ? (expense / budget) * 100 : 0
            };
        });
    } catch (error) {
        console.error('Error fetching project balances:', error);
        return [];
    }
}