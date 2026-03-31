'use server';

import prisma from '@/lib/prisma';

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