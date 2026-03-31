'use server';

import prisma from "@/lib/prisma";

export async function getConstructionItems(id: string) {
    try {
        const items = await prisma.constructionItem.findMany({
            include: {
                supplies: {
                    include: {
                        supply: true
                    }
                }
            },
            orderBy: { description: 'asc' },
            where: { userId: id },
        });
        return { success: true, items: JSON.parse(JSON.stringify(items)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}