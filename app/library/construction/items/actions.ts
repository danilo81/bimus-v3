'use server';

import prisma from '../../../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function getConstructionItems(userId: string) {
    if (!userId) return [];
    try {
        const items = await prisma.constructionItem.findMany({
            where: { userId },
            orderBy: { chapter: 'asc' },
            select: {
                id: true,
                chapter: true,
                description: true,
                unit: true,
                performance: true,
                directCost: true,
                total: true,
                userId: true,
                supplies: {
                    include: {
                        supply: {
                            select: {
                                id: true,
                                typology: true,
                                description: true,
                                unit: true,
                                price: true
                            }
                        }
                    }
                }
            }
        });

        const itemIds = items.map((item) => item.id);

        // Para items creados "localmente" en un proyecto, reemplazamos el marcador (local)
        // por el nombre del proyecto. Usamos la tabla puente `projectItem`.
        const projectLinks = itemIds.length
            ? await prisma.projectItem.findMany({
                where: { itemId: { in: itemIds } },
                include: {
                    project: { select: { title: true } }
                }
            })
            : [];

        const projectTitleByItemId = projectLinks.reduce((acc, link) => {
            if (!acc[link.itemId] && link.project?.title) acc[link.itemId] = link.project.title;
            return acc;
        }, {} as Record<string, string>);

        const qualityControlsByItem = itemIds.length
            ? await prisma.qualityControl.findMany({
                where: {
                    itemId: { in: itemIds }
                },
                include: {
                    subPoints: true
                }
            })
            : [];
        const groupedQualityControls = qualityControlsByItem.reduce((acc, qc) => {
            if (!acc[qc.itemId]) acc[qc.itemId] = [];
            acc[qc.itemId].push(qc);
            return acc;
        }, {} as Record<string, typeof qualityControlsByItem>);

        return items.map(item => ({
            ...item,
            supplies: item.supplies.map(s => ({
                id: s.supply.id,
                description: s.supply.description,
                unit: s.supply.unit,
                price: s.supply.price,
                quantity: s.quantity,
                subtotal: s.quantity * s.supply.price,
                typology: s.supply.typology
            })),
            qualityControls: (groupedQualityControls[item.id] || []).map(qc => ({
                id: qc.id,
                description: qc.description,
                subPoints: qc.subPoints.map(sp => ({
                    id: sp.id,
                    description: sp.description
                }))
            })),
            // Usado para renderizar items locales en la librería (cuando el chapter/desc trae "(local)").
            localProjectTitle: projectTitleByItemId[item.id] || null
        }));
    } catch (error) {
        console.error('Error fetching construction items:', error);
        return [];
    }
}

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

        const cleanSupplies = (data.supplies || []).map(s => ({
            supplyId: s.id,
            quantity: Number(s.quantity) || 0
        }));

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

        if (cleanSupplies.length > 0) {
            for (const supply of cleanSupplies) {
                await prisma.constructionItemSupply.create({
                    data: {
                        itemId: item.id,
                        supplyId: supply.supplyId,
                        quantity: supply.quantity
                    }
                });
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

            for (const supply of updateData.supplies) {
                await prisma.constructionItemSupply.create({
                    data: {
                        itemId: id,
                        supplyId: supply.id,
                        quantity: Number(supply.quantity) || 0
                    }
                });
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

export async function deleteConstructionItem(id: string) {
    try {
        // Verificar integridad referencial: uso en proyectos
        const usageCount = await prisma.projectItem.count({
            where: { itemId: id }
        });

        if (usageCount > 0) {
            return {
                success: false,
                error: `No se puede eliminar la partida porque está siendo utilizada en ${usageCount} proyecto(s) activos. Debe desvincularla antes de proceder.`
            };
        }

        // Eliminación en cascada manual de relaciones
        await prisma.constructionItemSupply.deleteMany({ where: { itemId: id } });
        await prisma.qualityControl.deleteMany({ where: { itemId: id } });

        await prisma.constructionItem.delete({
            where: { id }
        });

        revalidatePath('/library/construction/items');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting construction item:', error);
        return { success: false, error: 'Error inesperado al intentar eliminar el ítem de la librería.' };
    }
}

export async function getCurrentUserConstructionItems() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        return [];
    }

    return getConstructionItems(userId);
}
