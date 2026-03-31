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

export async function updateProjectContactPermissions(projectId: string, contactId: string, permissions: any) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (project?.authorId !== userId) {
            return { success: false, error: "Sólo el autor puede modificar los permisos" };
        }

        await prisma.projectContact.update({
            where: { projectId_contactId: { projectId, contactId } },
            data: { permissions: permissions as any }
        });

        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}