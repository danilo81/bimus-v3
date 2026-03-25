'use server';

import prisma from "../../lib/prisma";
import { cookies } from 'next/headers';
import { getAccessibleProjectIds } from '../projects/actions';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

// ─── Calendar Events CRUD ────────────────────────────────────────────────────

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

export async function updateCalendarEvent(
    id: string,
    data: {
        title: string;
        date: string;
        type: string;
        project?: string;
        description?: string;
    }
) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const event = await prisma.calendarEvent.update({
            where: { id, userId },
            data: {
                title: data.title,
                date: new Date(data.date),
                type: data.type,
                project: data.project || '',
                description: data.description || '',
            },
        });

        return { success: true, event: JSON.parse(JSON.stringify(event)) };
    } catch (error: any) {
        console.error('Error updating calendar event:', error);
        return { success: false, error: error.message };
    }
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

// ─── Upcoming Events (for Navbar / Dashboard) ────────────────────────────────

export async function getUpcomingEvents() {
    try {
        const access = await getAccessibleProjectIds();
        if (!access) return [];

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { authorId: access.userId },
                    { id: { in: access.collabIds } }
                ],
                status: { in: ['activo', 'construccion'] }
            },
            select: {
                id: true,
                title: true,
                startDate: true
            }
        });

        const projectIds = projects.map(p => p.id);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tasks = await prisma.task.findMany({
            where: {
                projectId: { in: projectIds },
                status: { not: 'completado' },
                dueDate: { gte: today }
            },
            include: {
                project: { select: { title: true } }
            },
            orderBy: { dueDate: 'asc' },
            take: 10
        });

        const events = [];

        for (const p of projects) {
            if (p.startDate) {
                const startDate = new Date(p.startDate);
                if (startDate >= today) {
                    events.push({
                        id: `start-${p.id}`,
                        title: `Inicio de Obra`,
                        project: p.title,
                        date: startDate.toISOString().split('T')[0],
                        type: 'hitos' as const
                    });
                }
            }
        }

        for (const t of tasks) {
            events.push({
                id: t.id,
                title: t.title,
                project: t.project?.title || 'Sin Proyecto',
                date: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 'Sin fecha',
                type: 'tarea' as const
            });
        }

        const customEvents = await prisma.calendarEvent.findMany({
            where: {
                userId: access.userId,
                date: { gte: today }
            },
            take: 10
        });

        for (const ce of customEvents) {
            events.push({
                id: ce.id,
                title: ce.title,
                project: ce.project || 'Sin Proyecto',
                date: ce.date.toISOString().split('T')[0],
                type: ce.type as any
            });
        }

        return events
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 10);

    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        return [];
    }
}

export async function getCalendarEvents() {
    try {
        const access = await getAccessibleProjectIds();
        if (!access) return { success: false, error: 'Not authorized' };

        const projects = await prisma.project.findMany({
            where: {
                OR: [{ authorId: access.userId }, { id: { in: access.collabIds } }],
                status: 'activo'
            },
            include: {
                items: {
                    include: {
                        item: true
                    }
                }
            },
            orderBy: {
                startDate: 'asc'
            }
        });

        const events = [];

        for (const project of projects) {
            if (!project.startDate) continue;

            let currentTaskDate = new Date(project.startDate);

            events.push({
                date: project.startDate.toISOString().split('T')[0],
                title: `Inicio - ${project.title}`,
                type: 'milestone',
                projectId: project.id
            });

            for (const projectItem of project.items) {
                const performance = projectItem.item.performance;
                const quantity = projectItem.quantity;

                if (!performance || !quantity) continue;

                const durationDays = Math.ceil(quantity / performance);
                const startDate = new Date(currentTaskDate);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + durationDays - 1);

                events.push({
                    date: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0],
                    title: `${project.title}: ${projectItem.item.description}`,
                    type: 'task',
                    projectId: project.id
                });

                currentTaskDate.setDate(endDate.getDate() + 1);
            }
        }

        return { success: true, events: JSON.parse(JSON.stringify(events)) };

    } catch (error: any) {
        console.error("Error fetching calendar events:", error);
        return { success: false, error: error.message };
    }
}
