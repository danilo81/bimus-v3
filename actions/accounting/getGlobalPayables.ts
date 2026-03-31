'use server';

import prisma from '../../lib/prisma';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
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