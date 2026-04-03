'use server';

import prisma from '../../lib/prisma';
import type { User, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

function isStrongPassword(password: string): boolean {
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    return hasLowercase && hasUppercase && hasSpecialChar;
}

type RegisterResult = {
    success: true;
    user: Omit<User, 'password'>;
} | {
    success: false;
    error: string;
};

type RegisterData = Omit<Prisma.UserCreateInput, 'role'>;

export async function register(data: RegisterData): Promise<RegisterResult> {
    try {
        if (!data.email || !data.password) {
            return { success: false, error: 'Email and password are required.' };
        }

        if (!isStrongPassword(data.password)) {
            return {
                success: false,
                error: 'La contraseña debe contener al menos una letra minúscula, una mayúscula y un carácter especial.',
            };
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            return { success: false, error: 'User with this email already exists.' };
        }

        const userCount = await prisma.user.count();
        const role = userCount === 0 ? 'admin' : 'viewer';

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser = await (prisma.user.create as any)({
            data: {
                name: data.name || null,
                email: data.email,
                password: hashedPassword,
                role: role as any,
                storageLimit: '1GB',
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                storageLimit: true,
                createdAt: true,
                updatedAt: true,
                password: true,
            },
        }) as User & { storageLimit: string };


        const cookieStore = await cookies();
        cookieStore.set('userId', newUser.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });

        const { password, ...userWithoutPassword } = newUser;
        return { success: true, user: userWithoutPassword };
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}