'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteProject(id: string) {
    try {
        await prisma.$transaction(async (tx) => {
            await tx.projectContact.deleteMany({ where: { projectId: id } });
            await tx.projectItem.deleteMany({ where: { projectId: id } });
            await tx.level.deleteMany({ where: { projectId: id } });
            await tx.projectConfig.deleteMany({ where: { projectId: id } });
            await tx.project.delete({ where: { id } });
        });
        revalidatePath('/projects');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message || "Error al eliminar" }; }
}