'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteContact(id: string) {
    try {
        const existing = await prisma.contact.findUnique({
            where: { id }
        });

        if (!existing) {
            return { success: false, error: 'Contacto no encontrado.' };
        }

        const supplyCount = await prisma.supplyCost.count({
            where: { supplierId: id }
        });

        if (supplyCount > 0) {
            return {
                success: false,
                error: `Integridad referencial: No se puede eliminar el contacto porque está registrado como proveedor en cotizaciones de insumos.`
            };
        }

        const projectCount = await prisma.projectContact.count({
            where: { contactId: id }
        });

        if (projectCount > 0) {
            return {
                success: false,
                error: `Operación bloqueada: Este contacto forma parte activa del equipo de trabajo en ${projectCount} proyecto(s).`
            };
        }

        await prisma.contact.delete({
            where: { id }
        });

        revalidatePath('/contacts');
        return { success: true };
    } catch (error) {
        console.error('Error deleting contact:', error);
        return { success: false, error: 'Error interno al intentar eliminar el contacto.' };
    }
}