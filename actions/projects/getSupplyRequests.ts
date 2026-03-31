'use server';

import prisma from "@/lib/prisma";

export async function getSupplyRequests(projectId: string) {
    try {
        const requests = await prisma.supplyRequest.findMany({
            where: { projectId },
            include: {
                supply: {
                    include: {
                        costs: {
                            include: {
                                supplier: true
                            },
                            orderBy: { date: 'desc' }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return requests.map(r => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
            supply: {
                ...r.supply,
                costs: r.supply.costs.map(c => ({
                    ...c,
                    date: c.date.toISOString().split('T')[0]
                }))
            }
        }));
    } catch (error) {
        console.error('Error fetching supply requests:', error);
        return [];
    }
}