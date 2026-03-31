'use server';

import prisma from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
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