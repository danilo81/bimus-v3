'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { ProjectConfig } from "../../types/types";

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

export async function updateProject(id: string, data: {
    title?: string;
    description?: string;
    client?: string;
    location?: string;
    projectType?: string;
    area?: number;
    status?: string;
    imageUrl?: string;
    startDate?: string | null;
    config?: Partial<ProjectConfig>;
    levels?: { id?: string, name: string }[];
}) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        const { config, levels, startDate, ...restProjectData } = data;
        await prisma.$transaction(async (tx) => {
            const updateData: any = { ...restProjectData };
            if (startDate !== undefined) {
                if (startDate && startDate.trim() !== '') {
                    const parsedDate = new Date(startDate);
                    if (!isNaN(parsedDate.getTime())) updateData.startDate = parsedDate;
                } else {
                    updateData.startDate = null;
                }
            }
            if (updateData.status) updateData.status = updateData.status.toLowerCase();
            await tx.project.update({ where: { id }, data: updateData });

            if (config) {
                const { id: _confId, projectId: _projId, ...configData } = config;
                await tx.projectConfig.upsert({
                    where: { projectId: id },
                    update: { ...configData },
                    create: { projectId: id, ...configData as any }
                });
            }

            if (levels) {
                const newLevelIds = levels.map(l => l.id).filter(Boolean) as string[];

                const levelsToDelete = await tx.level.findMany({
                    where: { projectId: id, id: { notIn: newLevelIds } },
                    select: { id: true }
                });
                const levelIdsToDelete = levelsToDelete.map(l => l.id);

                if (levelIdsToDelete.length > 0) {

                    await tx.projectItemLevelQuantity.deleteMany({
                        where: { levelId: { in: levelIdsToDelete } }
                    });

                    await tx.warehouseMovement.updateMany({
                        where: { levelId: { in: levelIdsToDelete } },
                        data: { levelId: null }
                    });

                    await tx.inspectionRecord.updateMany({
                        where: { levelId: { in: levelIdsToDelete } },
                        data: { levelId: null }
                    });

                    await tx.level.deleteMany({ where: { id: { in: levelIdsToDelete } } });
                }

                for (const level of levels) {
                    if (level.id) await tx.level.update({ where: { id: level.id }, data: { name: level.name } });
                    else await tx.level.create({ data: { name: level.name, projectId: id } });
                }
            }

            // REGISTRAR EN BITÁCORA
            await tx.siteLog.create({
                data: {
                    projectId: id,
                    authorId: userId,
                    type: 'info',
                    content: `CONFIGURACIÓN ACTUALIZADA: Se modificaron los parámetros generales o la estructura del proyecto.`,
                    date: new Date()
                }
            }).catch(() => null);
        });
        revalidatePath('/projects');
        revalidatePath(`/projects/${id}`);
        return { success: true };
    } catch (error: any) {
        console.error("Server Action Update Error:", error);
        return { success: false, error: error.message || "Fallo técnico al actualizar el proyecto." };
    }
}