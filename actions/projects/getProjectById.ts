'use server';

import prisma from "../../lib/prisma";

export async function getProjectById(id: string) {
    if (!id || typeof id !== 'string') return null;

    const cleanId = id.trim();
    const RESERVED_KEYWORDS = ['reportes', 'construction', 'operations', 'documentation', 'tasks', 'model', 'board', 'desing', 'shop', 'warehouse', 'accounting', 'undefined', 'null'];

    if (cleanId === '' || RESERVED_KEYWORDS.includes(cleanId)) return null;

    try {
        const project = await prisma.project.findUnique({
            where: { id: cleanId }
        });

        if (!project) return null;

        const [config, levels, items] = await Promise.all([
            prisma.projectConfig.findUnique({ where: { projectId: cleanId } }).catch(() => null),
            prisma.level.findMany({ where: { projectId: cleanId }, orderBy: { name: 'asc' } }).catch(() => []),
            prisma.projectItem.findMany({
                where: { projectId: cleanId },
                include: {
                    item: {
                        include: {
                            supplies: { include: { supply: true } },
                            qualityControls: { include: { subPoints: true } }
                        }
                    },
                    predecessor: true,
                    levelQuantities: true
                }
            }).catch(() => [])
        ]);

        const [contacts, siteLogs, transactions] = await Promise.all([
            prisma.projectContact.findMany({
                where: { projectId: cleanId },
                include: {
                    contact: { include: { bankAccounts: true } },
                    addedBy: { select: { name: true } }
                }
            }).catch(() => []),
            prisma.siteLog.findMany({
                where: { projectId: cleanId },
                include: { author: { select: { name: true } } },
                orderBy: { date: 'desc' },
                take: 30
            }).catch(() => []),
            prisma.projectTransaction.findMany({
                where: { projectId: cleanId },
                orderBy: { date: 'desc' },
                take: 50
            }).catch(() => [])
        ]);

        const team = contacts.map((pc: any) => ({
            ...pc.contact,
            addedBy: pc.addedBy?.name || 'Sistema',
            permissions: pc.permissions || {}
        }));

        return JSON.parse(JSON.stringify({
            ...project,
            config,
            levels,
            team,
            items,
            siteLogs,
            transactions
        }));

    } catch (error: any) {
        console.error(`[Server] Error en carga de proyecto ${cleanId}:`, error.message);
        return null;
    }
}