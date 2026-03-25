'use server';

import prisma from '../../lib/prisma';
import type { User, Prisma } from '@prisma/client';
import type { UserRole } from '../../lib/types';
import bcrypt from 'bcryptjs';

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

export async function getUserProjects(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true }
        });

        if (!user) return [];

        // Buscar colaboraciones mediante el correo del usuario en el equipo de proyectos
        const collaborationLinks = await prisma.projectContact.findMany({
            where: {
                contact: {
                    email: { equals: user.email, mode: 'insensitive' }
                }
            },
            select: { projectId: true }
        });
        const collaborationIds = collaborationLinks.map(l => l.projectId);

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { authorId: userId },
                    { id: { in: collaborationIds } }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return projects.map(p => ({
            id: p.id,
            title: p.title,
            projectType: p.projectType || 'Construcción',
            status: p.status || 'Activo',
            imageUrl: p.imageUrl,
            authorId: p.authorId,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        }));
    } catch (error) {
        console.error('Error al obtener los proyectos:', error);
        return [];
    }
}
