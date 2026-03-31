'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';


export async function deleteBankAccount(id: string) {
    try {
        await prisma.bankAccount.delete({
            where: { id }
        });
        revalidatePath('/contacts');
        return { success: true };
    } catch (error) {
        console.error('Error deleting bank account:', error);
        return { success: false, error: 'Error al eliminar la cuenta bancaria' };
    }
}