'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getUnits(userId: string) {
    try {
        const units = await prisma.unit.findMany({
            where: { userId },
            orderBy: { name: 'asc' }
        });
        return units;
    } catch (error) {
        console.error('Error fetching units:', error);
        return [];
    }
}