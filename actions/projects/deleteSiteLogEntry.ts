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

export async function deleteSiteLogEntry(logId: string, projectId: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        const existingLog = await prisma.siteLog.findUnique({ where: { id: logId } });
        if (!existingLog) return { success: false, error: "Registro no encontrado" };

        await prisma.siteLog.delete({
            where: { id: logId }
        });

        revalidatePath(`/projects/${projectId}`);
        revalidatePath(`/projects/${projectId}/operations`);
        return { success: true };
    } catch (error: any) { 
        return { success: false, error: error.message }; 
    }
}
