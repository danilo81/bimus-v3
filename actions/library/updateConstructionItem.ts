'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function updateConstructionItem(id: string, data: {
    chapter?: string;
    description?: string;
    unit?: string;
    performance?: number;
    directCost?: number;
    total?: number;
    supplies?: any[];
    qualityControls?: any[];
    userId?: string;
}) {
    try {
        const { userId, ...updateData } = data;

        if (data.description && userId) {
            const existing = await prisma.constructionItem.findFirst({
                where: {
                    id: { not: id },
                    description: { equals: data.description, mode: 'insensitive' },
                    userId: userId
                }
            });

            if (existing) {
                return { success: false, error: `Ya existe otra partida con la descripción "${data.description}".` };
            }
        }

        const item = await prisma.constructionItem.update({
            where: { id },
            data: {
                chapter: updateData.chapter,
                description: updateData.description,
                unit: updateData.unit,
                performance: updateData.performance !== undefined ? Number(updateData.performance) || 0 : undefined,
                directCost: updateData.directCost !== undefined ? Number(updateData.directCost) || 0 : undefined,
                total: updateData.total !== undefined ? Number(updateData.total) || 0 : undefined
            }
        });

        if (updateData.supplies) {
            await prisma.constructionItemSupply.deleteMany({
                where: { itemId: id }
            });

            for (const s of updateData.supplies) {
                let supplyId = s.id;

                if (s.isNew && userId) {
                    const existingSupply = await prisma.supply.findFirst({
                        where: {
                            description: { equals: s.description, mode: 'insensitive' },
                            userId: userId
                        }
                    });

                    if (existingSupply) {
                        supplyId = existingSupply.id;
                    } else {
                        const newSupply = await prisma.supply.create({
                            data: {
                                typology: s.typology,
                                description: s.description,
                                unit: s.unit,
                                price: Number(s.price) || 0,
                                userId: userId
                            }
                        });
                        supplyId = newSupply.id;
                    }
                }

                if (supplyId) {
                    await prisma.constructionItemSupply.create({
                        data: {
                            itemId: id,
                            supplyId: supplyId,
                            quantity: Number(s.quantity) || 0
                        }
                    });
                }
            }
        }

        if (updateData.qualityControls) {
            await prisma.qualityControl.deleteMany({
                where: { itemId: id }
            });

            for (const qc of updateData.qualityControls) {
                await prisma.qualityControl.create({
                    data: {
                        description: qc.description,
                        itemId: id,
                        subPoints: {
                            create: (qc.subPoints || []).map((sp: any) => ({
                                description: sp.description
                            }))
                        }
                    }
                });
            }
        }

        revalidatePath('/library/construction/items');
        return { success: true, item };
    } catch (error: any) {
        console.error('Error updating construction item:', error);
        return { success: false, error: error.message || 'Fallo al actualizar el ítem.' };
    }
}