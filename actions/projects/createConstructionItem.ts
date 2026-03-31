'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { ConstructionItem } from "@/types/types";

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function createConstructionItem(data: Omit<ConstructionItem, 'id' | 'userId'>, supplies: { supplyId: string, quantity: number }[]) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const totalCost = await calculateTotalCost(supplies);

        const newItem = await prisma.constructionItem.create({
            data: {
                chapter: data.chapter,
                description: data.description,
                unit: data.unit,
                userId: userId,
                total: totalCost,
                supplies: {
                    create: supplies.map((s: any) => ({
                        supplyId: s.supplyId,
                        quantity: s.quantity
                    }))
                }
            }
        });

        revalidatePath('/library/construction/items');
        return { success: true, item: newItem };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function calculateTotalCost(supplies: { supplyId: string, quantity: number }[]): Promise<number> {
    let total = 0;
    for (const s of supplies) {
        const supplyDetails = await prisma.supply.findUnique({ where: { id: s.supplyId } });
        if (supplyDetails) {
            total += s.quantity * (supplyDetails.price || 0);
        }
    }
    return total;
}