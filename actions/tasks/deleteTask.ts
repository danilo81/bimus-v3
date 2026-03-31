'use server';

import prisma from '../../lib/prisma';
import { revalidatePath } from 'next/cache';

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