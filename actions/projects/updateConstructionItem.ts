'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ConstructionItem } from "@/types/types";

export async function updateConstructionItem(id: string, data: Partial<Omit<ConstructionItem, 'id' | 'userId'>>, supplies: { supplyId: string, quantity: number }[]) {
    try {
        const totalCost = await calculateTotalCost(supplies);

        await prisma.constructionItem.update({
            where: { id },
            data: {
                chapter: data.chapter,
                description: data.description,
                unit: data.unit,
                total: totalCost,
                supplies: {
                    deleteMany: {},
                    create: supplies.map((s: any) => ({
                        supplyId: s.supplyId,
                        quantity: s.quantity
                    }))
                }
            }
        });

        revalidatePath('/library/construction/items');
        return { success: true };
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