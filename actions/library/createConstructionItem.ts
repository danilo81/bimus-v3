'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createConstructionItem(data: {
    chapter: string;
    description: string;
    unit: string;
    performance: number;
    directCost: number;
    total: number;
    userId: string;
    supplies?: any[];
    qualityControls?: any[];
}) {
    try {
        if (!data.userId) {
            return { success: false, error: 'Usuario no autenticado. Inicie sesión nuevamente.' };
        }

        const existing = await prisma.constructionItem.findFirst({
            where: {
                description: { equals: data.description, mode: 'insensitive' },
                userId: data.userId
            }
        });

        if (existing) {
            return {
                success: false,
                error: `Ya existe una partida con la descripción "${data.description}" en tu catálogo.`
            };
        }

        const performance = Number(data.performance) || 0;
        const directCost = Number(data.directCost) || 0;
        const total = Number(data.total) || 0;

        const item = await prisma.constructionItem.create({
            data: {
                chapter: data.chapter,
                description: data.description,
                unit: data.unit,
                performance: performance,
                directCost: directCost,
                total: total,
                userId: data.userId
            }
        });

        // Procesar suministros: vincular existentes y crear nuevos
        if (data.supplies && data.supplies.length > 0) {
            for (const s of data.supplies) {
                let supplyId = s.id;

                // Si es un nuevo insumo creado desde el modal de items
                if (s.isNew) {
                    // Verificar si ya existe en el catálogo maestro
                    const existingSupply = await prisma.supply.findFirst({
                        where: {
                            description: { equals: s.description, mode: 'insensitive' },
                            userId: data.userId
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
                                userId: data.userId
                            }
                        });
                        supplyId = newSupply.id;
                    }
                }

                if (supplyId) {
                    await prisma.constructionItemSupply.create({
                        data: {
                            itemId: item.id,
                            supplyId: supplyId,
                            quantity: Number(s.quantity) || 0
                        }
                    });
                }
            }
        }

        const qualityControlsToCreate = data.qualityControls || [];
        if (qualityControlsToCreate.length > 0) {
            for (const qc of qualityControlsToCreate) {
                await prisma.qualityControl.create({
                    data: {
                        description: qc.description,
                        itemId: item.id,
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
        console.error('Error creating construction item:', error);
        return {
            success: false,
            error: error.message || 'Error interno al registrar el ítem.'
        };
    }
}