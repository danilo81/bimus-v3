'use server';

import prisma from '../../lib/prisma';
import { revalidatePath } from 'next/cache';

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