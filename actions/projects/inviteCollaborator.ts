'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

export async function inviteCollaborator(projectId: string, email: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'Sesión no válida o expirada. Por favor, inicie sesión nuevamente.' };

        let contact = await prisma.contact.findFirst({
            where: {
                email: { equals: email, mode: 'insensitive' },
                userId: userId
            }
        });

        if (!contact) {
            contact = await prisma.contact.create({
                data: {
                    name: email.split('@')[0].toUpperCase(),
                    email: email,
                    phone: '',
                    type: 'personal',
                    status: 'active',
                    userId: userId
                }
            });
        }

        const existingLink = await prisma.projectContact.findUnique({
            where: { projectId_contactId: { projectId, contactId: contact.id } }
        });

        if (!existingLink) {
            await prisma.projectContact.create({
                data: {
                    projectId,
                    contactId: contact.id,
                    addedById: userId
                }
            });
        }

        await prisma.siteLog.create({
            data: {
                projectId,
                authorId: userId,
                type: 'info',
                content: `COLABORACIÓN ACTIVADA: "${email}" ha sido vinculado al equipo técnico del proyecto.`,
                date: new Date()
            }
        }).catch(() => null);

        revalidatePath(`/projects/${projectId}`);
        revalidatePath('/projects');

        return { success: true };
    } catch (error: any) {
        console.error("Invite error:", error);
        return { success: false, error: error.message || 'Fallo al procesar la invitación.' };
    }
}