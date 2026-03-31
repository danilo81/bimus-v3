'use server';

import prisma from "../../lib/prisma";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function deleteCalendarEvent(id: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        await prisma.calendarEvent.delete({ where: { id, userId } });
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting calendar event:', error);
        return { success: false, error: error.message };
    }
}