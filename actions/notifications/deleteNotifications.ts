'use server';

import prisma from '../../lib/prisma';
import { revalidatePath } from 'next/cache';

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
