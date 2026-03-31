'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { WarehouseMovement } from "@/types/types";

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function createWarehouseMovement(data: Omit<WarehouseMovement, 'id' | 'createdAt' | 'authorId'>, projectId: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const movement = await prisma.warehouseMovement.create({
            data: {
                ...data,
                projectId,
                authorId: userId
            }
        });
        revalidatePath(`/projects/${projectId}/warehouse`);
        return { success: true, movement };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}