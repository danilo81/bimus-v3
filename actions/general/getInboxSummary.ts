"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getInboxSummary() {
    try {

        const session = await getSession();
        if (!session?.user?.id) return null;

        const userId = session.user.id;

        const [unreadNotifications, pendingTasks, upcomingEvents] = await Promise.all([
            prisma.notification.count({
                where: { userId: userId, isRead: false }
            }),
            prisma.task.count({
                where: { userId: userId, status: 'pendiente' }
            }),
            prisma.calendarEvent.count({
                where: {
                    userId: userId,
                    date: { gte: new Date() }
                }
            })
        ]);

        return {
            notifications: unreadNotifications,
            tasks: pendingTasks,
            events: upcomingEvents,
            hasUpdates: (unreadNotifications + pendingTasks + upcomingEvents) > 0,
            totalUnread: unreadNotifications + pendingTasks + upcomingEvents
        };

    } catch (error) {
        console.error("Error fetching inbox summary:", error);
        return null;
    }
}