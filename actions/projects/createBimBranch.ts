'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function createBimBranch(projectId: string, name: string) {
    try {
        const branch = await prisma.bimBranch.create({
            data: {
                projectId,
                name: name.toLowerCase().replace(/\s+/g, '-'),
                isMain: false
            }
        });
        revalidatePath(`/projects/${projectId}/model`);
        return { success: true, branch: JSON.parse(JSON.stringify(branch)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
