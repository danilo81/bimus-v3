'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function updateContact(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    type?: string;
    status?: string;
    company?: string;
    nit?: string;
    address?: string;
    notes?: string;
}) {
    try {
        const userId = await getAuthUserId();

        const existing = await prisma.contact.findUnique({
            where: { id }
        });

        if (!existing) {
            return { success: false, error: 'Contacto no encontrado' };
        }

        if (data.nit && data.nit.toLowerCase() !== existing.nit?.toLowerCase()) {
            const nitInUse = await prisma.contact.findFirst({
                where: {
                    nit: { equals: data.nit, mode: 'insensitive' },
                    id: { not: id },
                    userId: userId || undefined
                }
            });

            if (nitInUse) {
                return { success: false, error: 'Este NIT o C.I. ya está asignado a otro contacto.' };
            }
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.company !== undefined) updateData.company = data.company;
        if (data.nit !== undefined) updateData.nit = data.nit;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.notes !== undefined) updateData.notes = data.notes;

        const contact = await prisma.contact.update({
            where: { id },
            data: updateData
        });
        revalidatePath('/contacts');
        return { success: true, contact };
    } catch (error) {
        console.error('Error updating contact:', error);
        return { success: false, error: 'Error al actualizar el contacto' };
    }
}