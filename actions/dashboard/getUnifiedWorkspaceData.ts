'use server';

import prisma from '../../lib/prisma';
import { cookies } from 'next/headers';
import { getAccessibleProjectIds } from '@/actions';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function getUnifiedWorkspaceData() {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const access = await getAccessibleProjectIds();
        const projectIds = access ? access.collabIds.concat(access.userId) : [];

        const [events, tasks, notifications, projects] = await Promise.all([

            prisma.calendarEvent.findMany({
                where: { userId },
                orderBy: { date: 'asc' },
            }),

            prisma.task.findMany({
                where: {
                    OR: [
                        { userId: userId },
                        { projectId: { in: projectIds } }
                    ]
                },
                include: { project: { select: { title: true } } },
                orderBy: { dueDate: 'asc' }
            }),

            prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50
            }),

            prisma.project.findMany({
                where: {
                    OR: [
                        { authorId: userId },
                        { id: { in: projectIds } }
                    ],
                    status: { in: ['activo', 'construccion'] }
                },
                select: { id: true, title: true }
            })
        ]);

        return {
            success: true,
            data: {
                events: JSON.parse(JSON.stringify(events)),
                tasks: JSON.parse(JSON.stringify(tasks)),
                notifications: JSON.parse(JSON.stringify(notifications)),
                projects: JSON.parse(JSON.stringify(projects))
            }
        };
    } catch (error: any) {
        console.error('Error fetching workspace data:', error);
        return { success: false, error: error.message };
    }
}