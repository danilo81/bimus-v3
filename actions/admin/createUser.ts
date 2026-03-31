'use server';

import prisma from '../../lib/prisma';
import type { User, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function createUser(data: Prisma.UserCreateInput): Promise<Omit<User, 'password'> | { error: string }> {
    try {
        if (!data.email || !data.password) {
            return { error: 'El correo electrónico y la contraseña son obligatorios.' };
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            return { error: 'Ya existe un usuario con este correo electrónico.' };
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser = await prisma.user.create({
            data: {
                name: data.name || null,
                email: data.email,
                password: hashedPassword,
                role: data.role,
            },
        });

        const { password, ...userWithoutPassword } = newUser;
        return userWithoutPassword;

    } catch (error) {
        console.error('Error al crear el usuario:', error);
        return { error: 'Error al crear el usuario.' };
    }
}