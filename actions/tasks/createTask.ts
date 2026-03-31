'use server';

import prisma from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { TaskStatus, TaskPriority } from '../../types/types';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function createTask(data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    assignee: string;
    projectId: string;
}) {
    try {
        // Convertir fecha a DateTime ISO-8601 si es necesario
        let dueDateIso = data.dueDate;
        if (!data.dueDate.includes('T')) {
            dueDateIso = new Date(`${data.dueDate}T00:00:00Z`).toISOString();
        }

        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description || '',
                status: data.status,
                priority: data.priority,
                dueDate: dueDateIso,
                assignee: data.assignee,
                projectId: data.projectId || null,
                userId: userId,
            }
        });
        revalidatePath('/tasks');
        revalidatePath(`/projects/${data.projectId}/tasks`);
        return { success: true, task };
    } catch (error) {
        console.error('Error creating task:', error);
        return { success: false, error: 'Error al crear la tarea' };
    }
}