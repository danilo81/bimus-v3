'use server';

import prisma from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { Notification } from '../../lib/types';

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

export async function markAsRead(id: string) {
    try {
        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        revalidatePath('/notifications');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function markAllAsRead() {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false };

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        revalidatePath('/notifications');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function deleteNotification(id: string) {
    try {
        await prisma.notification.delete({
            where: { id }
        });
        revalidatePath('/notifications');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
