'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { FixedAsset } from '@/types/types';

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