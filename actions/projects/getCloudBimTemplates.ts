'use server';

import prisma from "@/lib/prisma";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

export async function getCloudBimTemplates() {
    try {
        const userId = await getAuthUserId();
        if (!userId) return [];

        const templates = await prisma.libraryFile.findMany({
            where: {
                libraryType: 'bim_template',
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Parse to plain JSON objects for Client Components
        return JSON.parse(JSON.stringify(templates));
    } catch (error) {
        console.error('Error fetching cloud templates:', error);
        return [];
    }
}
