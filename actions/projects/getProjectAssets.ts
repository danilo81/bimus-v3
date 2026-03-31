'use server';

import prisma from "../../lib/prisma";

export async function getProjectAssets(projectId: string) {
    try {
        const assets = await prisma.fixedAsset.findMany({
            where: { projectId },
            orderBy: { name: 'asc' }
        });
        const formattedAssets = assets.map(a => ({
            ...a,
            purchaseDate: a.purchaseDate.toISOString().split('T')[0],
            status: a.status as any,
            userId: a.userId || '',
            projectId: a.projectId || null
        }));
        return { success: true, assets: formattedAssets };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}