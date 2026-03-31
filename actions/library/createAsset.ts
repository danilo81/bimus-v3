'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { FixedAsset } from '@/types/types';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function createAsset(data: Omit<FixedAsset, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) {
    const userId = await getAuthUserId();

    try {
        const existingCode = await prisma.fixedAsset.findUnique({
            where: { code: data.code }
        });

        if (existingCode) {
            return { success: false, error: 'Ya existe un activo con este código.' };
        }

        const asset = await prisma.fixedAsset.create({
            data: {
                name: data.name,
                code: data.code,
                brand: data.brand || null,
                model: data.model || null,
                serialNumber: data.serialNumber || null,
                purchasePrice: Number(data.purchasePrice),
                purchaseDate: new Date(data.purchaseDate),
                location: data.location || null,
                status: data.status,
                userId: userId || null,
            }
        });
        revalidatePath('/library/construction/assets');
        return { success: true, asset };
    } catch (error: any) {
        console.error('Error creating asset:', error);
        return { success: false, error: error.message || 'Error al crear el activo fijo.' };
    }
}