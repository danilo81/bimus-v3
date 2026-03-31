'use server';

import prisma from "../../lib/prisma";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function createCalendarEvent(data: {
    title: string;
    date: string;
    type: string;
    project?: string;
    description?: string;
}) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const event = await prisma.calendarEvent.create({
            data: {
                title: data.title,
                date: new Date(data.date),
                type: data.type,
                project: data.project || '',
                description: data.description || '',
                userId,
            },
        });

        return { success: true, event: JSON.parse(JSON.stringify(event)) };
    } catch (error: any) {
        console.error('Error creating calendar event:', error);
        return { success: false, error: error.message };
    }
}