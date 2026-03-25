'use server';

import prisma from '../../../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { FixedAsset, AssetStatus } from '../../../../lib/types';

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

export async function updateAsset(id: string, data: Partial<Omit<FixedAsset, 'id' | 'userId'>>) {
    try {
        const asset = await prisma.fixedAsset.update({
            where: { id },
            data: {
                name: data.name,
                code: data.code,
                brand: data.brand || null,
                model: data.model || null,
                serialNumber: data.serialNumber || null,
                purchasePrice: data.purchasePrice !== undefined ? Number(data.purchasePrice) : undefined,
                purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
                location: data.location || null,
                status: data.status,
            }
        });
        revalidatePath('/library/construction/assets');
        return { success: true, asset };
    } catch (error: any) {
        console.error('Error updating asset:', error);
        if (error.code === 'P2002') {
            return { success: false, error: 'Ya existe un activo con este código.' };
        }
        return { success: false, error: 'Error al actualizar el activo fijo.' };
    }
}

export async function deleteAsset(id: string) {
    try {
        await prisma.fixedAsset.delete({
            where: { id }
        });
        revalidatePath('/library/construction/assets');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting asset:', error);
        return { success: false, error: 'Error al eliminar el activo fijo.' };
    }
}
