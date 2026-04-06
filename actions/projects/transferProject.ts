'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

export async function transferProject(projectId: string, targetEmail: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'Sesión no válida o expirada. Por favor, inicie sesión nuevamente.' };

        // 1. Verify the project exists and the current user is the author
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { authorId: true, title: true }
        });

        if (!project) return { success: false, error: 'Proyecto no encontrado.' };
        if (project.authorId !== userId) return { success: false, error: 'No tienes permisos para transferir este proyecto. Solo el autor puede hacerlo.' };

        // 2. Find the target user by email
        const targetUser = await prisma.user.findUnique({
            where: { email: targetEmail },
            select: { id: true, name: true }
        });

        if (!targetUser) return { success: false, error: `El usuario "${targetEmail}" no está registrado en el sistema.` };
        if (targetUser.id === userId) return { success: false, error: 'No puedes transferir el proyecto a ti mismo.' };

        // 3. Update the authorId
        await prisma.project.update({
            where: { id: projectId },
            data: { authorId: targetUser.id }
        });

        // 4. Log the action in the site log
        await prisma.siteLog.create({
            data: {
                projectId,
                authorId: userId,
                type: 'info',
                content: `TRANSFERENCIA DE PROPIEDAD: El proyecto "${project.title}" ha sido transferido a ${targetUser.name || targetEmail}.`,
                date: new Date()
            }
        }).catch(() => null);

        revalidatePath('/projects');
        revalidatePath(`/projects/${projectId}`);

        return { success: true };
    } catch (error: any) {
        console.error("Transfer project error:", error);
        return { success: false, error: error.message || 'Fallo al procesar la transferencia.' };
    }
}
