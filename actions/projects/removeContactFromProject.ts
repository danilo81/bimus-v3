'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function removeContactFromProject(projectId: string, contactId: string) {
    try {
        await prisma.projectContact.delete({
            where: { projectId_contactId: { projectId, contactId } }
        });
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}