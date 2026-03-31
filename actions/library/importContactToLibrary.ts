'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function importContactToLibrary(contactId: string) {
    try {
        const currentUserId = await getAuthUserId();
        if (!currentUserId) return { success: false, error: 'No autorizado' };

        const sourceContact = await prisma.contact.findUnique({
            where: { id: contactId },
            include: { bankAccounts: true }
        });

        if (!sourceContact) return { success: false, error: 'Contacto original no encontrado' };

        if (sourceContact.nit) {
            const existing = await prisma.contact.findFirst({
                where: {
                    nit: sourceContact.nit,
                    userId: currentUserId
                }
            });
            if (existing) return { success: false, error: 'Este contacto ya existe en tu librería global.' };
        }

        const newContact = await prisma.contact.create({
            data: {
                name: sourceContact.name,
                email: sourceContact.email,
                phone: sourceContact.phone,
                type: sourceContact.type,
                status: sourceContact.status,
                company: sourceContact.company,
                nit: sourceContact.nit,
                address: sourceContact.address,
                notes: sourceContact.notes,
                userId: currentUserId,
                bankAccounts: {
                    create: sourceContact.bankAccounts.map(ba => ({
                        bankName: ba.bankName,
                        accountNumber: ba.accountNumber,
                        swiftCode: ba.swiftCode,
                        isPreferred: ba.isPreferred
                    }))
                }
            }
        });

        revalidatePath('/library/contacts');
        return { success: true, contact: newContact };
    } catch (error: any) {
        console.error('Error importing contact:', error);
        return { success: false, error: error.message || 'Error al importar contacto' };
    }
}