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

export async function addContactToProject(projectId: string, contactId: string) {
    if (!projectId || !contactId) return { success: false, error: 'Datos de vinculación incompletos.' };
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'Sesión expirada.' };

        const existing = await prisma.projectContact.findFirst({
            where: { projectId, contactId }
        });
        if (existing) return { success: false, error: 'Este contacto ya está vinculado.' };

        await prisma.projectContact.create({
            data: {
                projectId,
                contactId,
                addedById: userId
            }
        });

        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}