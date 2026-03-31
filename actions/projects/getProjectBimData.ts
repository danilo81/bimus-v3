'use server';

import prisma from "../../lib/prisma";

export async function getProjectBimData(projectId: string) {
    try {
        const branches = await prisma.bimBranch.findMany({
            where: { projectId },
            include: {
                versions: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { isMain: 'desc' }
        });

        if (branches.length === 0) {
            // Create main branch if none exist
            const main = await prisma.bimBranch.create({
                data: {
                    projectId,
                    name: 'main',
                    isMain: true
                },
                include: { versions: true }
            });
            return { success: true, branches: [JSON.parse(JSON.stringify(main))] };
        }

        return { success: true, branches: JSON.parse(JSON.stringify(branches)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}