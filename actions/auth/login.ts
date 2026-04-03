'use server';

import prisma from '../../lib/prisma';
import type { User, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

type LoginResult = {
    success: true;
    user: Omit<User, 'password'>;
} | {
    success: false;
    error: string;
};

export async function login(credentials: Pick<User, 'email' | 'password'>): Promise<LoginResult> {
    try {

        const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                password: true,
                storageLimit: true,
            } as any,
        }) as (User & { storageLimit: string }) | null;

        if (!user) {
            return { success: false, error: 'Invalid email or password.' };
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
            return { success: false, error: 'Invalid email or password.' };
        }

        const cookieStore = await cookies();
        cookieStore.set('userId', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });

        const { password, ...userWithoutPassword } = user;
        return { success: true, user: userWithoutPassword };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}
