'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProjectChangeOrder(id: string, data: { status: string }) {
    try {
        const updated = await (prisma as any).projectChangeOrder.update({
            where: { id },
            data: { status: data.status }
        });

        revalidatePath(`/projects/${updated.projectId}/operations`);
        return { success: true, order: updated };
    } catch (error: any) {
        console.error('Error updating change order:', error);
        return { success: false, error: error.message };
    }
}
