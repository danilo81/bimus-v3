'use server';

import prisma from "@/lib/prisma";

export async function getInspectionRecords(projectId: string) {
    try {
        const records = await prisma.inspectionRecord.findMany({
            where: { projectId },
            include: {
                projectItem: {
                    include: {
                        item: {
                            include: {
                                qualityControls: { include: { subPoints: true } }
                            }
                        }
                    }
                },
                level: { select: { id: true, name: true } },
                checks: true,
            },
            orderBy: { date: 'desc' }
        });

        return records.map(r => ({
            ...r,
            date: r.date.toISOString().split('T')[0],
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
        }));
    } catch (error) {
        console.error('Error fetching inspection records:', error);
        return [];
    }
}