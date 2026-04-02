'use server';

import prisma from "../../lib/prisma";

export async function getProjectPayrolls(projectId: string) {
    if (!projectId) return { success: false, error: 'Project ID is required' };

    try {
        const payrolls = await prisma.payroll.findMany({
            where: { projectId },
            include: {
                entries: {
                    include: {
                        contact: true
                    }
                }
            },
            orderBy: {
                endDate: 'desc'
            }
        });

        return { success: true, payrolls };
    } catch (error: any) {
        console.error('Error fetching project payrolls:', error);
        return { success: false, error: error.message };
    }
}
