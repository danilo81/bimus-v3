'use server';

import prisma from "../../lib/prisma";
import { getAccessibleProjectIds } from '@/actions';


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