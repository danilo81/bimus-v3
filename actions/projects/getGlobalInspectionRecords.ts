'use server';

import prisma from "@/lib/prisma";

export async function getGlobalInspectionRecords() {
    try {
        const records = await prisma.inspectionRecord.findMany({
            take: 10,
            include: {
                project: { select: { title: true } },
                projectItem: {
                    include: {
                        item: { select: { description: true } }
                    }
                },
                level: { select: { name: true } }
            },
            orderBy: { date: 'desc' }
        });

        return records.map(r => ({
            ...r,
            projectName: r.project?.title || 'Sin Proyecto',
            itemName: r.projectItem?.item?.description || 'Sin Item',
            levelName: r.level?.name || 'N/A',
            date: r.date.toISOString().split('T')[0],
        }));
    } catch (error) {
        console.error('Error fetching global inspection records:', error);
        return [];
    }
}
