'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateBankAccount(id: string, data: {
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    isPreferred?: boolean;
}) {
    try {
        if (data.isPreferred) {
            const account = await prisma.bankAccount.findUnique({ where: { id }, select: { contactId: true } });
            if (account) {
                await prisma.bankAccount.updateMany({
                    where: { contactId: account.contactId },
                    data: { isPreferred: false }
                });
            }
        }

        const account = await prisma.bankAccount.update({
            where: { id },
            data: {
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                swiftCode: data.swiftCode,
                isPreferred: data.isPreferred,
            }
        });
        revalidatePath('/contacts');
        return { success: true, account };
    } catch (error) {
        console.error('Error updating bank account:', error);
        return { success: false, error: 'Error al actualizar la cuenta bancaria' };
    }
}
