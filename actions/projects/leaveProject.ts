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

export async function leaveProject(projectId: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        const userRecord = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        });
        if (!userRecord?.email) return { success: false, error: "Correo no encontrado" };

        const contacts = await prisma.contact.findMany({
            where: { email: { equals: userRecord.email, mode: 'insensitive' } },
            select: { id: true }
        });

        if (contacts.length === 0) return { success: true };

        const contactIds = contacts.map((c: any) => c.id);

        await prisma.projectContact.deleteMany({
            where: {
                projectId,
                contactId: { in: contactIds }
            }
        });

        revalidatePath('/projects');
        revalidatePath('/dashboard');

        return { success: true };
    } catch (error: any) {
        console.error("Leave project error:", error);
        return { success: false, error: error.message || "Fallo al abandonar el proyecto." };
    }
}