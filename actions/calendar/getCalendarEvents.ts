'use server';

import prisma from "../../lib/prisma";
import { getAccessibleProjectIds } from '@/actions';

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