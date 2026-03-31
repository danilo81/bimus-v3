'use server';

import prisma from "../../lib/prisma";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

async function getAccessibleProjectIds() {
    const userId = await getAuthUserId();
    if (!userId) return null;
    const userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
    });
    let collaborationIds: string[] = [];
    if (userRecord?.email) {
        const collaborationLinks = await prisma.projectContact.findMany({
            where: {
                contact: {
                    email: { equals: userRecord.email, mode: 'insensitive' },
                    type: { equals: 'personal', mode: 'insensitive' },
                    status: 'active'
                }
            },
            select: { projectId: true }
        });
        collaborationIds = collaborationLinks.map(l => l.projectId);
    }
    return { userId, collabIds: collaborationIds };
}

export async function getGlobalSiteLogs() {
    try {
        const access = await getAccessibleProjectIds();
        if (!access) return [];
        const siteLogs = await prisma.siteLog.findMany({
            where: { project: { OR: [{ authorId: access.userId }, { id: { in: access.collabIds } }] } },
            include: { project: { select: { title: true } }, author: { select: { name: true } } },
            orderBy: { date: 'desc' },
            take: 10
        });
        return siteLogs.map(log => ({
            id: log.id,
            date: log.date.toISOString(),
            type: log.type,
            content: log.content,
            projectName: log.project.title,
            author: log.author.name || 'Usuario'
        }));
    } catch (error) { return []; }
}