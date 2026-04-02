'use server';

import prisma from "../../lib/prisma";

interface PayrollEntryInput {
    contactId: string;
    daysWorked: number;
    dailyRate: number;
    totalAmount: number;
}

interface CreatePayrollData {
    projectId: string;
    startDate: Date | string;
    endDate: Date | string;
    totalAmount: number;
    entries: PayrollEntryInput[];
}

export async function createPayroll(data: CreatePayrollData) {
    const { projectId, startDate, endDate, totalAmount, entries } = data;

    if (!projectId || !startDate || !endDate || entries.length === 0) {
        return { success: false, error: 'Missing required payroll data' };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Payroll and linked Transaction
            const payroll = await tx.payroll.create({
                data: {
                    projectId,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    totalAmount,
                    status: 'completado',
                    entries: {
                        create: entries.map(entry => ({
                            contactId: entry.contactId,
                            daysWorked: entry.daysWorked,
                            dailyRate: entry.dailyRate,
                            totalAmount: entry.totalAmount,
                        }))
                    },
                    transaction: {
                        create: {
                            projectId,
                            amount: totalAmount,
                            type: 'egreso',
                            category: 'pago de planilla',
                            description: `Pago de planilla personal: ${new Date(startDate).toLocaleDateString()} al ${new Date(endDate).toLocaleDateString()}`,
                            date: new Date(),
                        }
                    }
                },
                include: {
                    entries: true,
                    transaction: true
                }
            });

            return payroll;
        });

        return { success: true, payroll: result };
    } catch (error: any) {
        console.error('Error creating payroll:', error);
        return { success: false, error: error.message };
    }
}
