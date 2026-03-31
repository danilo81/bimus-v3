'use server';

import prisma from '../../../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { TaskStatus, TaskPriority } from '../../../../types/types';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function getTasks(projectId?: string) {
    try {
        const tasks = await prisma.task.findMany({
            where: projectId ? { projectId } : undefined,
            include: {
                project: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: {
                dueDate: 'asc'
            }
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
        const userId = await getAuthUserId();

        // Convertir fecha a DateTime ISO-8601 si es necesario
        let dueDateIso = data.dueDate;
        if (data.dueDate && !data.dueDate.includes('T')) {
            dueDateIso = new Date(`${data.dueDate}T00:00:00Z`).toISOString();
        }

        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description || '',
                status: data.status,
                priority: data.priority,
                dueDate: dueDateIso || null,
                assignee: data.assignee,
                projectId: data.projectId,
                userId: userId || null,
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
        if (task.projectId) revalidatePath(`/projects/${task.projectId}/tasks`);
        return { success: true, task };
    } catch (error) {
        console.error('Error updating task:', error);
        return { success: false, error: 'Error al actualizar la tarea' };
    }
}

export async function deleteTask(id: string) {
    try {
        const task = await prisma.task.delete({
            where: { id }
        });
        revalidatePath('/tasks');
        revalidatePath(`/projects/${task.projectId}/tasks`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting task:', error);
        return { success: false, error: 'Error al eliminar la tarea' };
    }
}
