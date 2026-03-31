'use server';

import prisma from '../../lib/prisma';
import type { User } from '@prisma/client';
import type { UserRole } from '../../types/types';

export async function updateUserRole(userId: string, newRole: UserRole): Promise<Omit<User, 'password'> | null> {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });
        const { password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    } catch (error) {
        console.error(`Error al actualizar el rol para el usuario ${userId}:`, error);
        return null;
    }
}