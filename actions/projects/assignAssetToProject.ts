'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignAssetToProject(assetId: string, projectId: string) {
    try {
        const asset = await prisma.fixedAsset.update({
            where: { id: assetId },
            data: { projectId, status: 'en_uso' }
        });
        revalidatePath(`/projects/${projectId}/model`);
        return { success: true, asset };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}