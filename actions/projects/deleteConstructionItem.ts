'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteConstructionItem(id: string) {
    try {
        const projectCount = await prisma.projectItem.count({ where: { itemId: id } });
        if (projectCount > 0) {
            return {
                success: false,
                error: `Operación bloqueada: La partida está en uso en ${projectCount} proyecto(s).`
            };
        }

        await prisma.constructionItemSupply.deleteMany({ where: { itemId: id } });
        await prisma.constructionItem.delete({ where: { id } });

        revalidatePath('/library/construction/items');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}