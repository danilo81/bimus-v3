'use server';

import prisma from "../../lib/prisma";

interface PayrollEntryInput {
    contactId: string;
    daysWorked: number;
    dailyRate: number;
    totalAmount: number;
}

interface UpdatePayrollData {
    id: string;
    startDate: Date | string;
    endDate: Date | string;
    totalAmount: number;
    entries: PayrollEntryInput[];
}

export async function updatePayroll(data: UpdatePayrollData) {
    const { id, startDate, endDate, totalAmount, entries } = data;

    if (!id || !startDate || !endDate || entries.length === 0) {
        return { success: false, error: 'Missing required payroll data' };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Delete existing entries (easier than syncing)
            await tx.payrollEntry.deleteMany({
                where: { payrollId: id }
            });

            // 2. Update Payroll Header
            const payroll = await tx.payroll.update({
                where: { id },
                data: {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    totalAmount,
                    entries: {
                        create: entries.map(entry => ({
                            contactId: entry.contactId,
                            daysWorked: entry.daysWorked,
                            dailyRate: entry.dailyRate,
                            totalAmount: entry.totalAmount,
                        }))
                    }
                },
                include: {
                    transaction: true
                }
            });

            // 3. Update associated Transaction
            if (payroll.transaction) {
                await tx.projectTransaction.update({
                    where: { id: payroll.transaction.id },
                    data: {
                        amount: totalAmount,
                        description: `Pago de planilla personal: ${new Date(startDate).toLocaleDateString()} al ${new Date(endDate).toLocaleDateString()}`,
                    }
                });
            } else {
                // Fallback: If for some reason it wasn't linked (existing records), create one
                await tx.projectTransaction.create({
                    data: {
                        projectId: payroll.projectId,
                        amount: totalAmount,
                        type: 'egreso',
                        category: 'pago de planilla',
                        description: `Pago de planilla personal: ${new Date(startDate).toLocaleDateString()} al ${new Date(endDate).toLocaleDateString()}`,
                        payrollId: payroll.id,
                        date: new Date(),
                    }
                });
            }

            return payroll;
        });

        return { success: true, payroll: result };
    } catch (error: any) {
        console.error('Error updating payroll:', error);
        return { success: false, error: error.message };
    }
}
