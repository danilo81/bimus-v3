'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignElementToItem(
    projectId: string,
    projectItemId: string,
    elementId: string,
    elementName: string | null = null,
    quantity: number,
    unit: string
) {
    try {
        // Find if this element is already mapped to something else in this project
        // Since elementId is usually unique within a model, we can try to find and delete any existing mapping for this element first to avoid duplicates across items.
        // But elementId might not be globally unique across ALL projects, so we filter by project items belonging to this project.
        
        const existingMappings = await (prisma as any).bimElementMapping.findMany({
            where: {
                elementId: elementId,
                projectItem: {
                    projectId: projectId
                }
            }
        });

        // Delete existing mapping if it exists
        if (existingMappings.length > 0) {
            await (prisma as any).bimElementMapping.deleteMany({
                where: {
                    id: { in: existingMappings.map((m: any) => m.id) }
                }
            });
        }

        // Create new mapping
        const mapping = await (prisma as any).bimElementMapping.create({
            data: {
                projectItemId,
                elementId,
                elementName,
                quantity,
                unit
            }
        });

        // Sum all mappings for this projectItem and update its total quantity
        const total = await (prisma as any).bimElementMapping.aggregate({
            where: { projectItemId },
            _sum: { quantity: true }
        });

        await prisma.projectItem.update({
            where: { id: projectItemId },
            data: { quantity: total._sum.quantity || 0 }
        });

        revalidatePath(`/projects/${projectId}/design`);
        return { success: true, mapping };
    } catch (error: any) {
        console.error("Error asignando elemento BIM:", error);
        return { success: false, error: error.message };
    }
}

export async function removeElementMapping(projectId: string, elementId: string) {
    try {
        const existingMappings = await (prisma as any).bimElementMapping.findMany({
            where: {
                elementId: elementId,
                projectItem: {
                    projectId: projectId
                }
            }
        });

        if (existingMappings.length === 0) return { success: true };

        const projectItemId = existingMappings[0].projectItemId;

        await (prisma as any).bimElementMapping.deleteMany({
            where: {
                id: { in: existingMappings.map((m: any) => m.id) }
            }
        });

        // Update total
        const total = await (prisma as any).bimElementMapping.aggregate({
            where: { projectItemId },
            _sum: { quantity: true }
        });

        await prisma.projectItem.update({
            where: { id: projectItemId },
            data: { quantity: total._sum.quantity || 0 }
        });

        revalidatePath(`/projects/${projectId}/design`);
        return { success: true };
    } catch (error: any) {
        console.error("Error removiendo asignación BIM:", error);
        return { success: false, error: error.message };
    }
}

export async function getMappedElements(projectId: string) {
    try {
        const mappings = await (prisma as any).bimElementMapping.findMany({
            where: {
                projectItem: {
                    projectId: projectId
                }
            },
            select: {
                elementId: true,
                projectItemId: true,
                quantity: true
            }
        });

        return mappings;
    } catch (error) {
        console.error("Error obteniendo elementos mapeados:", error);
        return [];
    }
}

export async function getMappedElementsForItem(projectItemId: string) {
    try {
        const mappings = await (prisma as any).bimElementMapping.findMany({
            where: {
                projectItemId: projectItemId
            },
            select: {
                elementId: true,
                quantity: true
            }
        });

        return mappings;
    } catch (error) {
        console.error("Error obteniendo elementos mapeados por item:", error);
        return [];
    }
}
