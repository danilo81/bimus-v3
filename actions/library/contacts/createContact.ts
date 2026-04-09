'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function createContact(data: {
    name: string;
    email?: string;
    phone: string;
    type: string;
    status: string;
    company?: string;
    nit?: string;
    address?: string;
    notes?: string;
}) {
    try {
        const userId = await getAuthUserId();

        if (data.nit) {
            const existing = await prisma.contact.findFirst({
                where: {
                    nit: {
                        equals: data.nit,
                        mode: 'insensitive'
                    },
                    userId: userId || undefined
                }
            });

            if (existing) {
                return {
                    success: false,
                    error: 'Ya existe un contacto registrado con este NIT o C.I..'
                };
            }
        }

        const contact = await prisma.contact.create({
            data: {
                name: data.name,
                email: data.email || '',
                phone: data.phone,
                type: data.type,
                status: data.status,
                company: data.company || null,
                nit: data.nit || null,
                address: data.address || null,
                notes: data.notes || null,
                userId: userId || null,
            }
        });
        revalidatePath('/contacts');
        return { success: true, contact };
    } catch (error: any) {
        console.error('Error creating contact:', error);
        return { success: false, error: error?.message || 'Error al crear el contacto' };
    }
}