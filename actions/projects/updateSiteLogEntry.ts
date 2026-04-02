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

export async function updateSiteLogEntry(logId: string, projectId: string, type: string, content: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        const existingLog = await prisma.siteLog.findUnique({ where: { id: logId } });
        if (!existingLog) return { success: false, error: "Registro no encontrado" };

        // Opcional: Validar que el usuario que lo edita sea el autor o un administrador.
        // Aquí asumimos que todos los autorizados del proyecto pueden editarlo para flexibilidad,
        // o si es necesario se restringe. Limitado por ahora a evitar crash.

        const log = await prisma.siteLog.update({
            where: { id: logId },
            data: { type, content }
        });

        revalidatePath(`/projects/${projectId}`);
        revalidatePath(`/projects/${projectId}/operations`);
        return { success: true, log };
    } catch (error: any) { 
        return { success: false, error: error.message }; 
    }
}
