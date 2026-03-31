'use server';

import prisma from "../../lib/prisma";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

export async function getProjects() {
    try {
        const userId = await getAuthUserId();
        if (!userId) return [];

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

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { authorId: userId },
                    { id: { in: collaborationIds } }
                ]
            },
            include: { levels: true },
            orderBy: { createdAt: 'desc' }
        });

        return JSON.parse(JSON.stringify(projects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            imageUrl: project.imageUrl,
            client: project.client,
            location: project.location,
            projectType: project.projectType,
            area: project.area,
            status: project.status,
            authorId: project.authorId,
            createdAt: project.createdAt.toISOString(),
        }))));
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}