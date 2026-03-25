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

export async function getGlobalPayables() {
    try {
        const userId = await getAuthUserId();
        if (!userId) return null;

        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where: {
                project: {
                    authorId: userId,
                    status: 'activo'
                },
                status: {
                    not: 'completado'
                }
            },
            include: {
                project: { select: { title: true } },
                supplier: { select: { company: true, name: true } }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const totalPayable = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);

        return {
            totalPayable,
            pendingCount: purchaseOrders.length,
            overdueCount: purchaseOrders.filter(po => po.status === 'pendiente').length,
            items: purchaseOrders.map(po => ({
                id: po.number,
                supplier: po.supplier?.company || po.supplier?.name || 'Varios',
                project: po.project.title,
                amount: po.totalAmount,
                dueDate: po.createdAt.toISOString().split('T')[0],
                status: po.status === 'pendiente' ? 'pending' : 'procesado'
            }))
        };
    } catch (error) {
        console.error('Error fetching global payables:', error);
        return null;
    }
}

export async function getGlobalReceivables() {
    try {
        const userId = await getAuthUserId();
        if (!userId) return null;

        // Consultamos ingresos proyectados/registrados en proyectos activos
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
