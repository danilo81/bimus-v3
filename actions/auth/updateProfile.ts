'use server';

import prisma from '../../lib/prisma';
import { cookies } from 'next/headers';

export async function updateProfile(data: { name?: string, telefono?: string, cargo?: string }) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;

        if (!userId) {
            return { error: 'No autorizado' };
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                telefono: data.telefono,
                cargo: data.cargo,
            } as any,
        });

        const { password, ...userWithoutPassword } = updatedUser;
        return { success: true, user: userWithoutPassword };

    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        return { error: 'Error al actualizar el perfil' };
    }
}
