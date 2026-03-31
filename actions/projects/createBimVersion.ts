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

export async function createBimVersion(projectId: string, branchId: string, message: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const hash = Math.random().toString(36).substring(2, 10).toUpperCase();

        const version = await prisma.bimVersion.create({
            data: {
                branchId,
                authorId: userId,
                authorName: user?.name || 'Desconocido',
                message,
                hash
            }
        });

        await prisma.siteLog.create({
            data: {
                projectId,
                authorId: userId,
                type: 'info',
                content: `NUEVA VERSIÓN BIM: Branch [${(await prisma.bimBranch.findUnique({ where: { id: branchId } }))?.name}] - Commit: ${hash} - ${message}`,
                date: new Date()
            }
        }).catch(() => null);

        revalidatePath(`/projects/${projectId}/model`);
        return { success: true, version: JSON.parse(JSON.stringify(version)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}