'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { FixedAsset, AssetStatus } from '@/types/types';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function getAssets(): Promise<FixedAsset[]> {
    const userId = await getAuthUserId();

    try {
        const assets = await prisma.fixedAsset.findMany({
            where: userId ? { userId } : {},
            orderBy: { name: 'asc' }
        });
        return assets.map((a: any) => ({
            ...a,
            purchaseDate: a.purchaseDate.toISOString().split('T')[0],
            status: a.status as AssetStatus,
            userId: a.userId || ''
        }));
    } catch (error) {
        console.error('Error fetching assets:', error);
        return [];
    }
}