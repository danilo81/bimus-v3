'use server';

import prisma from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { TaskStatus, TaskPriority } from '../../types/types';

export async function updateTask(id: string, data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    assignee?: string;
    projectId?: string;
}) {
    try {
        const updateData: any = { ...data };

        // Convertir fecha a DateTime ISO-8601 si es necesario
        if (data.dueDate && !data.dueDate.includes('T')) {
            updateData.dueDate = new Date(`${data.dueDate}T00:00:00Z`).toISOString();
        }

        const task = await prisma.task.update({
            where: { id },
            data: updateData
        });
        revalidatePath('/tasks');
        if (data.projectId) revalidatePath(`/projects/${data.projectId}/tasks`);
        return { success: true, task };
    } catch (error) {
        console.error('Error updating task:', error);
        return { success: false, error: 'Error al actualizar la tarea' };
    }
}