'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Supply } from "@/types/types";

export async function updateSupply(id: string, data: Partial<Omit<Supply, 'id'>>) {
    try {
        const { updatedAt, userId: _, ...rest } = data;
        await prisma.supply.update({
            where: { id },
            data: rest as any,
        });
        revalidatePath('/library/construction/supplies');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}