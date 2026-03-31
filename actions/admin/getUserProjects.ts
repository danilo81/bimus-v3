'use server';

import prisma from '../../lib/prisma';

export async function getUserProjects(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true }
        });

        if (!user) return [];

        const collaborationLinks = await prisma.projectContact.findMany({
            where: {
                contact: {
                    email: { equals: user.email, mode: 'insensitive' }
                }
            },
            select: { projectId: true }
        });
        const collaborationIds = collaborationLinks.map(l => l.projectId);

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { authorId: userId },
                    { id: { in: collaborationIds } }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return projects.map(p => ({
            id: p.id,
            title: p.title,
            projectType: p.projectType || 'Construcción',
            status: p.status || 'Activo',
            imageUrl: p.imageUrl,
            authorId: p.authorId,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        }));
    } catch (error) {
        console.error('Error al obtener los proyectos:', error);
        return [];
    }
}