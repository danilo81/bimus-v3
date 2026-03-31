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
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    let collabIds: string[] = [];
    if (user?.email) {
        const links = await prisma.projectContact.findMany({
            where: { contact: { email: { equals: user.email, mode: 'insensitive' }, type: 'personal', status: 'active' } },
            select: { projectId: true }
        });
        collabIds = links.map(l => l.projectId);
    }
    return { userId, collabIds };
}

export async function getGlobalPurchaseOrders() {
    try {
        const access = await getAccessibleProjectIds();
        if (!access) return [];
        const orders = await prisma.purchaseOrder.findMany({
            where: {
                project: {
                    status: 'activo',
                    OR: [{ authorId: access.userId }, { id: { in: access.collabIds } }]
                }
            },
            include: { project: { select: { title: true } }, supplier: { select: { company: true, name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        return orders.map(o => ({
            id: o.number,
            supplier: o.supplier?.company || o.supplier?.name || 'Proveedor',
            project: o.project.title,
            amount: o.totalAmount,
            status: o.status === 'pendiente' ? 'pending' : o.status === 'procesado' ? 'processed' : 'completed',
            label: o.status.toUpperCase(),
            date: o.createdAt.toISOString()
        }));
    } catch (error) { return []; }
}
