'use server';

import prisma from "../../lib/prisma";

export async function deletePayroll(id: string) {
    if (!id) return { success: false, error: 'Payroll ID is required' };

    try {
        await prisma.$transaction(async (tx) => {
            // Find if there is a linked transaction (redundant but safe)
            const payroll = await tx.payroll.findUnique({
                where: { id },
                include: { transaction: true }
            });

            if (payroll?.transaction) {
                await tx.projectTransaction.delete({
                    where: { id: payroll.transaction.id }
                });
            }

            // Delete Payroll (entries should be cascade deleted per schema)
            await tx.payroll.delete({
                where: { id }
            });
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting payroll:', error);
        return { success: false, error: error.message };
    }
}
