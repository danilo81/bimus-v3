'use server';

import prisma from '@/lib/prisma';

export async function getChapters(userId: string) {
    try {
        const chapters = await prisma.chapter.findMany({
            where: { userId },
            orderBy: { name: 'asc' }
        });
        return chapters;
    } catch (error) {
        console.error('Error fetching chapters:', error);
        return [];
    }
}