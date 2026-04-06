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

export async function removeProjectItem(projectId: string, itemId: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        const projectItem = await prisma.projectItem.findUnique({
            where: { projectId_itemId: { projectId, itemId } },
            include: { item: true }
        });

        if (!projectItem) throw new Error("Partida no encontrada");

        await prisma.projectItem.delete({ where: { id: projectItem.id } });

        // REGISTRAR EN BITÁCORA
        await prisma.siteLog.create({
            data: {
                projectId,
                authorId: userId,
                type: 'info',
                content: `PARTIDA ELIMINADA: Se quitó "${projectItem.item.description}" del presupuesto del proyecto.`,
                date: new Date()
            }
        }).catch(() => null);

        revalidatePath(`/projects/${projectId}`);
        revalidatePath(`/projects/${projectId}/construction`);
        return { success: true };
    } catch (error: any) { 
        return { success: false, error: error.message || "Error al eliminar" }; 
    }
}