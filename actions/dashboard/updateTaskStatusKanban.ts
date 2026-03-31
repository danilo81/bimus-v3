'use server';

import prisma from '../../lib/prisma';

export async function updateTaskStatusKanban(taskId: string, newStatus: string) {
    try {
        await prisma.task.update({
            where: { id: taskId },
            data: { status: newStatus }
        });
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}