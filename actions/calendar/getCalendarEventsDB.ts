'use server';

import prisma from "../../lib/prisma";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function getCalendarEventsDb() {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, events: [] };

        const events = await prisma.calendarEvent.findMany({
            where: { userId },
            orderBy: { date: 'asc' },
        });

        return { success: true, events: JSON.parse(JSON.stringify(events)) };
    } catch (error: any) {
        console.error('Error fetching calendar events:', error);
        return { success: false, events: [] };
    }
}