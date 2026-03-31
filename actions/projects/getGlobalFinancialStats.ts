'use server';

import prisma from "../../lib/prisma";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

async function getAccessibleProjectIds() {
    const userId = await getAuthUserId();
    if (!userId) return null;
    const userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
    });
    let collaborationIds: string[] = [];
    if (userRecord?.email) {
        const collaborationLinks = await prisma.projectContact.findMany({
            where: {
                contact: {
                    email: { equals: userRecord.email, mode: 'insensitive' },
                    type: { equals: 'personal', mode: 'insensitive' },
                    status: 'active'
                }
            },
            select: { projectId: true }
        });
        collaborationIds = collaborationLinks.map(l => l.projectId);
    }
    return { userId, collabIds: collaborationIds };
}

export async function getGlobalFinancialStats() {
    try {
        const access = await getAccessibleProjectIds();
        if (!access) return { totalIncome: 0, totalExpense: 0, netBalance: 0 };
        const transactions = await prisma.projectTransaction.findMany({
            where: {
                project: {
                    status: 'activo',
                    OR: [{ authorId: access.userId }, { id: { in: access.collabIds } }]
                }
            },
            select: { amount: true, type: true }
        });
        const totalIncome = transactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'egreso').reduce((sum, t) => sum + t.amount, 0);
        return { totalIncome, totalExpense, netBalance: totalIncome - totalExpense };
    } catch (error) { return { totalIncome: 0, totalExpense: 0, netBalance: 0 }; }
}