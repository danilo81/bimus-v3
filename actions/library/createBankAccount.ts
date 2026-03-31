'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createBankAccount(data: {
    contactId: string;
    bankName: string;
    accountNumber: string;
    swiftCode?: string;
    isPreferred?: boolean;
}) {
    try {
        if (data.isPreferred) {
            await prisma.bankAccount.updateMany({
                where: { contactId: data.contactId },
                data: { isPreferred: false }
            });
        }

        const account = await prisma.bankAccount.create({
            data: {
                contactId: data.contactId,
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                swiftCode: data.swiftCode || null,
                isPreferred: data.isPreferred || false,
            }
        });
        revalidatePath('/contacts');
        return { success: true, account };
    } catch (error) {
        console.error('Error creating bank account:', error);
        return { success: false, error: 'Error al registrar la cuenta bancaria' };
    }
}