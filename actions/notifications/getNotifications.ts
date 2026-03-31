'use server';

import prisma from '../../lib/prisma';
import { cookies } from 'next/headers';
import { Notification } from '../../types/types';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function getNotifications(userId?: string): Promise<Notification[]> {
    try {
        const authUserId = userId || await getAuthUserId();
        if (!authUserId) return [];

        let notifications = await prisma.notification.findMany({
            where: { userId: authUserId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return notifications.map(n => ({
            id: n.id,
            userId: n.userId,
            title: n.title,
            message: n.message,
            type: n.type as any,
            isRead: n.isRead,
            createdAt: n.createdAt.toISOString()
        }));
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}