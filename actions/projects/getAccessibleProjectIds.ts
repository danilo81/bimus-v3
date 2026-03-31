'use server';

import prisma from "../../lib/prisma";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

export async function getAccessibleProjectIds() {
    const userId = await getAuthUserId();
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) return null;
    const collabs = await prisma.projectContact.findMany({
        where: { contact: { email: { equals: user.email, mode: 'insensitive' }, type: { equals: 'personal', mode: 'insensitive' }, status: 'active' } },
        select: { projectId: true }
    });
    return { userId, collabIds: collabs.map(c => c.projectId) };
}