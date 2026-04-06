'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { CreateProjectData } from "../../types/types";

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

export async function createProject(data: CreateProjectData) {
    try {
        const userId = await getAuthUserId();

        if (!userId) {
            return { success: false, error: 'Sesión no válida o expirada. Por favor, inicie sesión nuevamente.' };
        }

        const userExists = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true }
        });

        if (!userExists) {
            return { success: false, error: 'Usuario no encontrado en el sistema.' };
        }

        const result = await prisma.$transaction(async (tx) => {
            const project = await tx.project.create({
                data: {
                    title: data.title,
                    description: data.description,
                    client: data.client,
                    location: data.location,
                    projectType: data.projectType,
                    area: Number(data.area) || 0,
                    status: (data.status || 'activo').toLowerCase(),
                    imageUrl: data.imageUrl || '/project-img.png',
                    authorId: userId,
                    config: {
                        create: {
                            utility: data.config?.utility ?? 10,
                            adminExpenses: data.config?.adminExpenses ?? 5,
                            iva: data.config?.iva ?? 13,
                            it: data.config?.it ?? 3,
                            socialCharges: data.config?.socialCharges ?? 55,
                            toolWear: data.config?.toolWear ?? 3,
                            exchangeRate: data.config?.exchangeRate ?? 6.96,
                            financing: data.config?.financing ?? 0,
                            guaranteeRetention: data.config?.guaranteeRetention ?? 7,
                            mainCurrency: data.config?.mainCurrency ?? 'BS',
                            secondaryCurrency: data.config?.secondaryCurrency ?? 'USD',
                            workingDays: data.config?.workingDays ?? 6
                        }
                    }
                }
            });
            await tx.level.create({ data: { name: 'Fundaciones', projectId: project.id } });
            await tx.level.create({ data: { name: 'Nivel 1', projectId: project.id } });
            await tx.level.create({ data: { name: 'Nivel 2', projectId: project.id } });

            // REGISTRAR EN BITÁCORA
            await tx.siteLog.create({
                data: {
                    projectId: project.id,
                    authorId: userId,
                    type: 'info',
                    content: `PROYECTO INICIADO: El proyecto "${data.title}" ha sido creado con éxito.`,
                    date: new Date()
                }
            }).catch(() => null);

            return project;
        });
        revalidatePath('/projects');
        return { success: true, project: JSON.parse(JSON.stringify(result)) };
    } catch (error: any) {
        console.error("Create project error:", error);
        return { success: false, error: error.message || "Fallo técnico al crear el proyecto." };
    }
}