'use server';

import prisma from '../../lib/prisma';
import { getAccessibleProjectIds } from '@/actions';

export async function getTasks() {
    try {
        const access = await getAccessibleProjectIds();
        if (!access) return [];

        const tasks = await prisma.task.findMany({
            where: {
                OR: [
                    { userId: access.userId },
                    { project: { OR: [{ authorId: access.userId }, { id: { in: access.collabIds } }] } }
                ]
            },
            include: {
                project: { select: { title: true } }
            },
            orderBy: { dueDate: 'asc' }
        });

        return tasks.map(task => ({
            ...task,
            projectName: task.project?.title || 'Sin proyecto'
        }));
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
}