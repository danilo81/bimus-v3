'use server';

import prisma from "../../lib/prisma";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

export async function getMyProjectPermissions(projectId: string) {
    const userId = await getAuthUserId();
    if (!userId) return { isAuthor: false, permissions: {} };
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { authorId: true } });
    if (!project) return { isAuthor: false, permissions: {} };
    if (project.authorId === userId) return { isAuthor: true, permissions: null };
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) return { isAuthor: false, permissions: {} };
    const contact = await prisma.projectContact.findFirst({
        where: {
            projectId,
            contact: { email: { equals: user.email, mode: 'insensitive' }, type: { equals: 'personal', mode: 'insensitive' }, status: 'active' }
        }
    }) as any;
    return { isAuthor: false, permissions: (contact?.permissions ?? {}) as Record<string, { view: boolean; edit: boolean }> };
}