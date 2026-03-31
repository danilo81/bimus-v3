'use server';

import prisma from "@/lib/prisma";

export async function getSupplies(id: string) {
    try {
        const supplies = await prisma.supply.findMany({
            where: { userId: id },
            orderBy: { description: 'asc' },
        });
        return { success: true, supplies: JSON.parse(JSON.stringify(supplies)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}