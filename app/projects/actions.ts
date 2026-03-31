/* eslint-disable @typescript-eslint/no-explicit-any */

'use server';

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies, headers } from 'next/headers';
import { ProjectConfig, CreateProjectData, FixedAsset } from "../../types/types";
import { getSession } from "../../lib/auth";

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') return undefined;
    return userId;
}

export async function getProjects() {
    try {
        const userId = await getAuthUserId();
        if (!userId) return [];

        const userRecord = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        });

        let collaborationIds: string[] = [];

        if (userRecord?.email) {
            const collaborationLinks = await prisma.projectContact.findMany({
                where: {
                    contact: {
                        email: { equals: userRecord.email, mode: 'insensitive' },
                        type: { equals: 'personal', mode: 'insensitive' },
                        status: 'active'
                    }
                },
                select: { projectId: true }
            });
            collaborationIds = collaborationLinks.map(l => l.projectId);
        }

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { authorId: userId },
                    { id: { in: collaborationIds } }
                ]
            },
            include: { levels: true },
            orderBy: { createdAt: 'desc' }
        });

        return JSON.parse(JSON.stringify(projects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            imageUrl: project.imageUrl,
            client: project.client,
            location: project.location,
            projectType: project.projectType,
            area: project.area,
            status: project.status,
            authorId: project.authorId,
            createdAt: project.createdAt.toISOString(),
        }))));
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}

export async function getProjectBimData(projectId: string) {
    try {
        const branches = await prisma.bimBranch.findMany({
            where: { projectId },
            include: {
                versions: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { isMain: 'desc' }
        });

        if (branches.length === 0) {
            // Create main branch if none exist
            const main = await prisma.bimBranch.create({
                data: {
                    projectId,
                    name: 'main',
                    isMain: true
                },
                include: { versions: true }
            });
            return { success: true, branches: [JSON.parse(JSON.stringify(main))] };
        }

        return { success: true, branches: JSON.parse(JSON.stringify(branches)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createBimBranch(projectId: string, name: string) {
    try {
        const branch = await prisma.bimBranch.create({
            data: {
                projectId,
                name: name.toLowerCase().replace(/\s+/g, '-'),
                isMain: false
            }
        });
        revalidatePath(`/projects/${projectId}/model`);
        return { success: true, branch: JSON.parse(JSON.stringify(branch)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createBimVersion(projectId: string, branchId: string, message: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const hash = Math.random().toString(36).substring(2, 10).toUpperCase();

        const version = await prisma.bimVersion.create({
            data: {
                branchId,
                authorId: userId,
                authorName: user?.name || 'Desconocido',
                message,
                hash
            }
        });

        await prisma.siteLog.create({
            data: {
                projectId,
                authorId: userId,
                type: 'info',
                content: `NUEVA VERSIÓN BIM: Branch [${(await prisma.bimBranch.findUnique({ where: { id: branchId } }))?.name}] - Commit: ${hash} - ${message}`,
                date: new Date()
            }
        }).catch(() => null);

        revalidatePath(`/projects/${projectId}/model`);
        return { success: true, version: JSON.parse(JSON.stringify(version)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
/**
 * Gestiona la invitación de un colaborador vinculando su correo al equipo del proyecto.
 */
export async function inviteCollaborator(projectId: string, email: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'Sesión no válida o expirada. Por favor, inicie sesión nuevamente.' };

        // 1. Buscar o crear el contacto en la base de datos para este email
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

        // 2. Vincular el contacto al proyecto registrando quién lo invita
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

        // 3. Registro en bitácora técnica
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

export async function getProjectById(id: string) {
    if (!id || typeof id !== 'string') return null;

    const cleanId = id.trim();
    const RESERVED_KEYWORDS = ['reportes', 'construction', 'operations', 'documentation', 'tasks', 'model', 'board', 'desing', 'shop', 'warehouse', 'accounting', 'undefined', 'null'];

    if (cleanId === '' || RESERVED_KEYWORDS.includes(cleanId)) return null;

    try {
        const project = await prisma.project.findUnique({
            where: { id: cleanId }
        });

        if (!project) return null;

        const [config, levels, items] = await Promise.all([
            prisma.projectConfig.findUnique({ where: { projectId: cleanId } }).catch(() => null),
            prisma.level.findMany({ where: { projectId: cleanId }, orderBy: { name: 'asc' } }).catch(() => []),
            prisma.projectItem.findMany({
                where: { projectId: cleanId },
                include: {
                    item: {
                        include: {
                            supplies: { include: { supply: true } },
                            qualityControls: { include: { subPoints: true } }
                        }
                    },
                    predecessor: true,
                    levelQuantities: true
                }
            }).catch(() => [])
        ]);

        const [contacts, siteLogs, transactions] = await Promise.all([
            prisma.projectContact.findMany({
                where: { projectId: cleanId },
                include: {
                    contact: { include: { bankAccounts: true } },
                    addedBy: { select: { name: true } }
                }
            }).catch(() => []),
            prisma.siteLog.findMany({
                where: { projectId: cleanId },
                include: { author: { select: { name: true } } },
                orderBy: { date: 'desc' },
                take: 30
            }).catch(() => []),
            prisma.projectTransaction.findMany({
                where: { projectId: cleanId },
                orderBy: { date: 'desc' },
                take: 50
            }).catch(() => [])
        ]);

        const team = contacts.map((pc: any) => ({
            ...pc.contact,
            addedBy: pc.addedBy?.name || 'Sistema',
            permissions: pc.permissions || {}
        }));

        return JSON.parse(JSON.stringify({
            ...project,
            config,
            levels,
            team,
            items,
            siteLogs,
            transactions
        }));

    } catch (error: any) {
        console.error(`[Server] Error en carga de proyecto ${cleanId}:`, error.message);
        return null;
    }
}

export async function batchUpdateProjectItemProgress(projectId: string, updates: { itemId: string, increment: number, log: string }[]) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        await prisma.$transaction(async (tx) => {
            for (const update of updates) {
                const projectItem = await tx.projectItem.findUnique({
                    where: { projectId_itemId: { projectId, itemId: update.itemId } }
                });

                if (!projectItem) continue;

                const newProgress = (Number(projectItem.progress) || 0) + Number(update.increment);

                await tx.projectItem.update({
                    where: { id: projectItem.id },
                    data: { progress: newProgress }
                });

                await tx.siteLog.create({
                    data: {
                        projectId,
                        authorId: userId,
                        type: 'info',
                        content: update.log,
                        date: new Date()
                    }
                }).catch(e => console.warn("Fallo registro bitácora:", e.message));
            }
        });

        revalidatePath(`/projects/${projectId}`);
        revalidatePath(`/projects/${projectId}/construction`);
        return { success: true };
    } catch (error: any) {
        console.error("Batch update error:", error);
        return { success: false, error: error.message || "Fallo al actualizar el avance físico." };
    }
}

export async function addContactToProject(projectId: string, contactId: string) {
    if (!projectId || !contactId) return { success: false, error: 'Datos de vinculación incompletos.' };
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'Sesión expirada.' };

        const existing = await prisma.projectContact.findFirst({
            where: { projectId, contactId }
        });
        if (existing) return { success: false, error: 'Este contacto ya está vinculado.' };

        await prisma.projectContact.create({
            data: {
                projectId,
                contactId,
                addedById: userId
            }
        });

        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateProjectContactPermissions(projectId: string, contactId: string, permissions: any) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (project?.authorId !== userId) {
            return { success: false, error: "Sólo el autor puede modificar los permisos" };
        }

        await prisma.projectContact.update({
            where: { projectId_contactId: { projectId, contactId } },
            data: { permissions: permissions as any }
        });

        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removeContactFromProject(projectId: string, contactId: string) {
    try {
        await prisma.projectContact.delete({
            where: { projectId_contactId: { projectId, contactId } }
        });
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function leaveProject(projectId: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        const userRecord = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        });
        if (!userRecord?.email) return { success: false, error: "Correo no encontrado" };

        const contacts = await prisma.contact.findMany({
            where: { email: { equals: userRecord.email, mode: 'insensitive' } },
            select: { id: true }
        });

        if (contacts.length === 0) return { success: true };

        const contactIds = contacts.map((c: any) => c.id);

        await prisma.projectContact.deleteMany({
            where: {
                projectId,
                contactId: { in: contactIds }
            }
        });

        revalidatePath('/projects');
        revalidatePath('/dashboard');

        return { success: true };
    } catch (error: any) {
        console.error("Leave project error:", error);
        return { success: false, error: error.message || "Fallo al abandonar el proyecto." };
    }
}

export async function getProjectAssets(projectId: string) {
    try {
        const assets = await prisma.fixedAsset.findMany({
            where: { projectId },
            orderBy: { name: 'asc' }
        });
        const formattedAssets = assets.map(a => ({
            ...a,
            purchaseDate: a.purchaseDate.toISOString().split('T')[0],
            status: a.status as any,
            userId: a.userId || '',
            projectId: a.projectId || null
        }));
        return { success: true, assets: formattedAssets };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function assignAssetToProject(assetId: string, projectId: string) {
    try {
        const asset = await prisma.fixedAsset.update({
            where: { id: assetId },
            data: { projectId, status: 'en_uso' }
        });
        revalidatePath(`/projects/${projectId}/model`);
        return { success: true, asset };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function unassignAssetFromProject(assetId: string, projectId: string) {
    try {
        const asset = await prisma.fixedAsset.update({
            where: { id: assetId },
            data: { projectId: null, status: 'disponible' }
        });
        revalidatePath(`/projects/${projectId}/model`);
        return { success: true, asset };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateProject(id: string, data: {
    title?: string;
    description?: string;
    client?: string;
    location?: string;
    projectType?: string;
    area?: number;
    status?: string;
    startDate?: string | null;
    config?: Partial<ProjectConfig>;
    levels?: { id?: string, name: string }[];
}) {
    try {
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

                // Identify levels to be deleted to handle children references
                const levelsToDelete = await tx.level.findMany({
                    where: { projectId: id, id: { notIn: newLevelIds } },
                    select: { id: true }
                });
                const levelIdsToDelete = levelsToDelete.map(l => l.id);

                if (levelIdsToDelete.length > 0) {
                    // Delete quantities associated with these levels
                    await tx.projectItemLevelQuantity.deleteMany({
                        where: { levelId: { in: levelIdsToDelete } }
                    });

                    // Nullify levelId in WarehouseMovement
                    await tx.warehouseMovement.updateMany({
                        where: { levelId: { in: levelIdsToDelete } },
                        data: { levelId: null }
                    });

                    // Nullify levelId in InspectionRecord
                    await tx.inspectionRecord.updateMany({
                        where: { levelId: { in: levelIdsToDelete } },
                        data: { levelId: null }
                    });

                    // Now safely delete the levels
                    await tx.level.deleteMany({ where: { id: { in: levelIdsToDelete } } });
                }

                for (const level of levels) {
                    if (level.id) await tx.level.update({ where: { id: level.id }, data: { name: level.name } });
                    else await tx.level.create({ data: { name: level.name, projectId: id } });
                }
            }
        });
        revalidatePath('/projects');
        revalidatePath(`/projects/${id}`);
        return { success: true };
    } catch (error: any) {
        console.error("Server Action Update Error:", error);
        return { success: false, error: error.message || "Fallo técnico al actualizar el proyecto." };
    }
}

export async function updateProjectItem(
    projectId: string,
    itemId: string,
    data: {
        quantity?: number,
        performance?: number,
        extraDays?: number,
        ganttStatus?: string,
        startDate?: Date | null,
        predecessorId?: string | null,
        levelQuantities?: { levelId: string, quantity: number }[]
    }
) {
    try {
        await prisma.$transaction(async (tx) => {
            const updateData: any = {};
            if (data.quantity !== undefined) updateData.quantity = Number(data.quantity);
            if (data.performance !== undefined) updateData.performance = Number(data.performance);
            if (data.extraDays !== undefined) updateData.extraDays = Number(data.extraDays);
            if (data.ganttStatus !== undefined) updateData.ganttStatus = data.ganttStatus;
            if (data.startDate !== undefined) updateData.startDate = data.startDate;

            if (data.predecessorId !== undefined) {
                if (data.predecessorId === "" || data.predecessorId === null) {
                    updateData.predecessorId = null;
                } else {
                    const predItem = await tx.projectItem.findUnique({
                        where: { projectId_itemId: { projectId, itemId: data.predecessorId } }
                    });
                    if (predItem) {
                        updateData.predecessorId = predItem.id;
                    }
                }
            }

            const projectItem = await tx.projectItem.update({
                where: { projectId_itemId: { projectId, itemId } },
                data: updateData
            });

            if (data.levelQuantities && data.levelQuantities.length > 0) {
                for (const lq of data.levelQuantities) {
                    await tx.projectItemLevelQuantity.upsert({
                        where: { projectItemId_levelId: { projectItemId: projectItem.id, levelId: lq.levelId } },
                        update: { quantity: Number(lq.quantity) || 0 },
                        create: { projectItemId: projectItem.id, levelId: lq.levelId, quantity: Number(lq.quantity) || 0 }
                    });
                }
            }
        });
        revalidatePath(`/projects/${projectId}`);
        revalidatePath(`/projects/${projectId}/construction`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al actualizar partida" };
    }
}

export async function updateProjectItemProgress(projectId: string, itemId: string, progressIncrement: number, logDescription?: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };
        await prisma.$transaction(async (tx) => {
            const projectItem = await tx.projectItem.findUnique({
                where: { projectId_itemId: { projectId, itemId } },
                include: { item: true }
            });
            if (!projectItem) throw new Error("Partida no encontrada");
            const newProgress = (Number(projectItem.progress) || 0) + Number(progressIncrement);
            await tx.projectItem.update({ where: { id: projectItem.id }, data: { progress: newProgress } });
            await tx.siteLog.create({
                data: {
                    projectId,
                    authorId: userId,
                    type: 'info',
                    content: logDescription || `AVANCE: +${progressIncrement} en "${projectItem.item.description}".`,
                    date: new Date()
                }
            });
        });
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function createSiteLogEntry(projectId: string, type: 'info' | 'incident' | 'milestone', content: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };
        const log = await prisma.siteLog.create({
            data: { projectId, authorId: userId, type, content, date: new Date() }
        });
        revalidatePath(`/projects/${projectId}`);
        return { success: true, log };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function customizeProjectItem(projectId: string, oldItemId: string, newItemData: any) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };
        return await prisma.$transaction(async (tx) => {
            const oldProjectItem = await tx.projectItem.findUnique({
                where: { projectId_itemId: { projectId, itemId: oldItemId } },
                include: { levelQuantities: true }
            });
            if (!oldProjectItem) throw new Error("Vínculo de proyecto no encontrado");
            const customizedItem = await tx.constructionItem.create({
                data: {
                    chapter: newItemData.chapter,
                    description: `${newItemData.description} (Local)`,
                    unit: newItemData.unit,
                    performance: Number(newItemData.performance) || 1,
                    directCost: Number(newItemData.directCost) || 0,
                    total: Number(newItemData.total) || 0,
                    userId: userId,
                    supplies: {
                        create: newItemData.supplies.map((s: any) => ({
                            supplyId: s.supplyId || s.id,
                            quantity: Number(s.quantity) || 0
                        }))
                    }
                }
            });
            await tx.projectItem.create({
                data: {
                    projectId,
                    itemId: customizedItem.id,
                    quantity: oldProjectItem.quantity,
                    levelQuantities: {
                        create: oldProjectItem.levelQuantities.map((lq: any) => ({
                            levelId: lq.levelId,
                            quantity: lq.quantity
                        }))
                    }
                }
            });
            await tx.projectItem.delete({ where: { projectId_itemId: { projectId, itemId: oldItemId } } });
            return { success: true, newItemId: customizedItem.id };
        });
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function createProjectChangeOrder(projectId: string, reason: string, computations: any[]) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        await prisma.$transaction(async (tx) => {
            for (const row of computations) {
                // Actualizar o crear la partida en el proyecto
                const projectItem = await tx.projectItem.upsert({
                    where: { projectId_itemId: { projectId, itemId: row.id } },
                    update: { quantity: Number(row.total) || 0 },
                    create: { projectId, itemId: row.id, quantity: Number(row.total) || 0 }
                });

                // Si hay desglose por niveles, actualizar cada uno
                if (row.values && row.levelIds) {
                    for (let i = 0; i < row.values.length; i++) {
                        await tx.projectItemLevelQuantity.upsert({
                            where: { projectItemId_levelId: { projectItemId: projectItem.id, levelId: row.levelIds[i] } },
                            update: { quantity: Number(row.values[i]) || 0 },
                            create: { projectItemId: projectItem.id, levelId: row.levelIds[i], quantity: Number(row.values[i]) || 0 }
                        });
                    }
                }
            }

            // Registrar el evento en la bitácora técnica oficial
            await tx.siteLog.create({
                data: {
                    projectId,
                    authorId: userId,
                    type: 'milestone',
                    content: `ORDEN DE CAMBIO AUTORIZADA: ${reason}`,
                    date: new Date()
                }
            });
        });

        // Forzar actualización de cache en las rutas críticas
        revalidatePath(`/projects/${projectId}`);
        revalidatePath(`/projects/${projectId}/construction`);

        return { success: true };
    } catch (error: any) {
        console.error("Change Order Error:", error);
        return { success: false, error: error.message || "Error al procesar la orden de cambio en base de datos." };
    }
}

export async function createProjectPayroll(data: {
    projectId: string;
    title: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    details: any;
}) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };
        return await prisma.$transaction(async (tx) => {
            await tx.projectTransaction.create({
                data: {
                    projectId: data.projectId,
                    amount: data.totalAmount,
                    type: 'egreso',
                    category: 'planillas',
                    description: `PLANILLA: ${data.title} (${data.startDate} a ${data.endDate})`,
                    date: new Date()
                }
            });
            await tx.siteLog.create({
                data: { projectId: data.projectId, authorId: userId, type: 'info', content: `PLANILLA PROCESADA: ${data.title} ($${data.totalAmount.toFixed(2)})`, date: new Date() }
            });
            return { success: true };
        });
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function createProject(data: CreateProjectData) {
    try {
        const userId = await getAuthUserId();

        if (!userId) {
            return { success: false, error: 'Sesión no válida o expirada. Por favor, inicie sesión nuevamente.' };
        }

        // Verificar que el usuario existe en la DB para evitar errores de llave foránea
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
                    imageUrl: data.imageUrl || `https://picsum.photos/seed/${Math.random()}/800/600`,
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
            await tx.level.create({ data: { name: 'Nivel 1', projectId: project.id } });
            await tx.level.create({ data: { name: 'Nivel 2', projectId: project.id } });
            await tx.level.create({ data: { name: 'Azotea', projectId: project.id } });
            return project;
        });
        revalidatePath('/projects');
        return { success: true, project: JSON.parse(JSON.stringify(result)) };
    } catch (error: any) {
        console.error("Create project error:", error);
        return { success: false, error: error.message || "Fallo técnico al crear el proyecto." };
    }
}

export async function deleteProject(id: string) {
    try {
        await prisma.$transaction(async (tx) => {
            await tx.projectContact.deleteMany({ where: { projectId: id } });
            await tx.projectItem.deleteMany({ where: { projectId: id } });
            await tx.level.deleteMany({ where: { projectId: id } });
            await tx.projectConfig.deleteMany({ where: { projectId: id } });
            await tx.project.delete({ where: { id } });
        });
        revalidatePath('/projects');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message || "Error al eliminar" }; }
}

export async function addProjectItem(projectId: string, itemId: string, quantity: number = 0) {
    try {
        const projectItem = await prisma.projectItem.upsert({
            where: { projectId_itemId: { projectId, itemId } },
            update: { quantity: Number(quantity) || 0 },
            create: { projectId, itemId, quantity: Number(quantity) || 0 }
        });
        revalidatePath(`/projects/${projectId}`);
        return { success: true, projectItem };
    } catch (error: any) { return { success: false, error: error.message || "Error al añadir" }; }
}

export async function removeProjectItem(projectId: string, itemId: string) {
    try {
        await prisma.projectItem.delete({ where: { projectId_itemId: { projectId, itemId } } });
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message || "Error al eliminar" }; }
}

export async function getAccessibleProjectIds() {
    const userId = await getAuthUserId();
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) return null;
    const collabs = await prisma.projectContact.findMany({
        where: { contact: { email: { equals: user.email, mode: 'insensitive' }, type: { equals: 'personal', mode: 'insensitive' }, status: 'active' } },
        select: { projectId: true }
    });
    return { userId, collabIds: collabs.map(c => c.projectId) };
}

export async function getMyProjectPermissions(projectId: string) {
    const userId = await getAuthUserId();
    if (!userId) return { isAuthor: false, permissions: {} };
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { authorId: true } });
    if (!project) return { isAuthor: false, permissions: {} };
    if (project.authorId === userId) return { isAuthor: true, permissions: null };
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) return { isAuthor: false, permissions: {} };
    const contact = await prisma.projectContact.findFirst({
        where: {
            projectId,
            contact: { email: { equals: user.email, mode: 'insensitive' }, type: { equals: 'personal', mode: 'insensitive' }, status: 'active' }
        }
    }) as any;
    return { isAuthor: false, permissions: (contact?.permissions ?? {}) as Record<string, { view: boolean; edit: boolean }> };
}

export async function getGlobalFinancialStats() {
    try {
        const access = await getAccessibleProjectIds();
        if (!access) return { totalIncome: 0, totalExpense: 0, netBalance: 0 };
        const transactions = await prisma.projectTransaction.findMany({
            where: {
                project: {
                    status: 'activo',
                    OR: [{ authorId: access.userId }, { id: { in: access.collabIds } }]
                }
            },
            select: { amount: true, type: true }
        });
        const totalIncome = transactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'egreso').reduce((sum, t) => sum + t.amount, 0);
        return { totalIncome, totalExpense, netBalance: totalIncome - totalExpense };
    } catch (error) { return { totalIncome: 0, totalExpense: 0, netBalance: 0 }; }
}

export async function getGlobalWarehouseMovements() {
    try {
        const access = await getAccessibleProjectIds();
        if (!access) return [];
        const movements = await prisma.warehouseMovement.findMany({
            where: { project: { OR: [{ authorId: access.userId }, { id: { in: access.collabIds } }] } },
            include: { project: { select: { title: true } }, supply: { select: { description: true } } },
            orderBy: { createdAt: 'desc' },
            take: 8
        });
        return movements.map(m => ({
            id: m.id,
            date: m.createdAt.toISOString(),
            type: m.type === 'entry' ? 'ingreso' : 'salida',
            projectName: m.project.title,
            itemCount: 1,
            description: m.supply.description ?? 'Material'
        }));
    } catch (error) { return []; }
}

export async function getGlobalSiteLogs() {
    try {
        const access = await getAccessibleProjectIds();
        if (!access) return [];
        const siteLogs = await prisma.siteLog.findMany({
            where: { project: { OR: [{ authorId: access.userId }, { id: { in: access.collabIds } }] } },
            include: { project: { select: { title: true } }, author: { select: { name: true } } },
            orderBy: { date: 'desc' },
            take: 10
        });
        return siteLogs.map(log => ({
            id: log.id,
            date: log.date.toISOString(),
            type: log.type,
            content: log.content,
            projectName: log.project.title,
            author: log.author.name || 'Usuario'
        }));
    } catch (error) { return []; }
}
