'use server';

import prisma from "../../lib/prisma";

export async function getValuations(projectId: string) {
    if (!projectId) return { success: false, error: 'Project ID is required' };

    try {
        const valuations = await prisma.valuation.findMany({
            where: { projectId },
            include: {
                items: {
                    include: {
                        projectItem: {
                            include: {
                                item: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, valuations };
    } catch (error: any) {
        console.error('Error fetching valuations:', error);
        return { success: false, error: error.message };
    }
}
