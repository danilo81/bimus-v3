'use server';

import prisma from '../../lib/prisma';
import type { User } from '@prisma/client';

export async function getUsers(): Promise<Omit<User, 'password'>[]> {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return users.map(({ password, ...user }) => ({
            ...user,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return [];
    }
}