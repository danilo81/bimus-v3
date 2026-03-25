'use server';

import prisma from '../../lib/prisma';
import type { User, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

/**
 * @fileOverview Acciones de servidor para autenticación.
 * Se ha refinado la configuración de cookies para asegurar la persistencia en el navegador.
 */


function isStrongPassword(password: string): boolean {
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    return hasLowercase && hasUppercase && hasSpecialChar;
}

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
            },
        });

        if (!user) {
            return { success: false, error: 'Invalid email or password.' };
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
            return { success: false, error: 'Invalid email or password.' };
        }

        // Set cookie for session management
        const cookieStore = await cookies();
        cookieStore.set('userId', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/', // Ensure cookie is available everywhere
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        const { password, ...userWithoutPassword } = user;
        return { success: true, user: userWithoutPassword };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
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

        // Check if any user exists. If not, the first one is an admin.
        const userCount = await prisma.user.count();
        const role = userCount === 0 ? 'admin' : 'viewer';

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser = await prisma.user.create({
            data: {
                name: data.name || null,
                email: data.email,
                password: hashedPassword,
                role: role as any, // Assign role dynamically
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                password: true,
            },
        });

        // Set cookie for session management
        const cookieStore = await cookies();
        cookieStore.set('userId', newUser.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/', // Ensure cookie is available everywhere
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        const { password, ...userWithoutPassword } = newUser;
        return { success: true, user: userWithoutPassword };
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

/**
 * Logout function - clears the user session cookie
 */
export async function logout(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete({ name: 'userId', path: '/' });
}
