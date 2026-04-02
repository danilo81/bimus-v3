'use server';

import prisma from "../../lib/prisma";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

export async function getProjectSiteLogs(projectId: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        const siteLogs = await prisma.siteLog.findMany({
            where: {
                projectId: projectId,
                type: 'progress'
            },
            include: {
                author: { select: { name: true } }
            },
            orderBy: { date: 'desc' }
        });

        return {
            success: true,
            logs: siteLogs.map(log => ({
                id: log.id,
                date: log.date.toISOString(),
                type: log.type,
                content: log.content,
                author: log.author.name || 'Usuario'
            }))
        };
    } catch (error: any) {
        console.error("Error fetching project logs:", error);
        return { success: false, error: error.message || "Error al obtener el historial." };
    }
}
