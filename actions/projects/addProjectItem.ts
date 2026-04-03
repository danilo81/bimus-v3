'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function addProjectItem(projectId: string, itemId: string, quantity: number = 0) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        const item = await prisma.constructionItem.findUnique({ where: { id: itemId } });
        if (!item) throw new Error("Item no encontrado");

        const existing = await prisma.projectItem.findUnique({
            where: { projectId_itemId: { projectId, itemId } }
        });

        const projectItem = await prisma.projectItem.upsert({
            where: { projectId_itemId: { projectId, itemId } },
            update: { quantity: Number(quantity) || 0 },
            create: { projectId, itemId, quantity: Number(quantity) || 0 }
        });

        // REGISTRAR EN BITÁCORA DEL PROYECTO
        await prisma.siteLog.create({
            data: {
                projectId,
                authorId: userId,
                type: 'info',
                content: existing 
                    ? `CÓMPUTO MODIFICADO: Se actualizó "${item.description}" a ${quantity} ${item.unit || ''}.` 
                    : `NUEVA PARTIDA: Se añadió "${item.description}" (${quantity} ${item.unit || ''}) al presupuesto.`,
                date: new Date()
            }
        }).catch(() => null);

        revalidatePath(`/projects/${projectId}`);
        revalidatePath(`/projects/${projectId}/construction`);
        return { success: true, projectItem };
    } catch (error: any) { 
        return { success: false, error: error.message || "Error al añadir" }; 
    }
}