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

export async function createSiteLogEntry(projectId: string, type: 'info' | 'incident' | 'milestone', content: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };
        const log = await prisma.siteLog.create({
            data: { projectId, authorId: userId, type, content, date: new Date() }
        });
        revalidatePath(`/projects/${projectId}`);
        return { success: true, log };
    } catch (error: any) { return { success: false, error: error.message }; }
}