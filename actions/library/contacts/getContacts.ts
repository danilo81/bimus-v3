'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function getContacts() {
    try {
        const userId = await getAuthUserId();

        const contacts = await prisma.contact.findMany({
            where: userId ? { userId } : {},
            include: {
                bankAccounts: {
                    orderBy: { isPreferred: 'desc' }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        return contacts;
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return [];
    }
}