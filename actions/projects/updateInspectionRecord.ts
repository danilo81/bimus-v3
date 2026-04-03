"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function updateInspectionRecord(
    inspectionId: string,
    projectId: string,
    checks: { qualityControlId: string, passed: boolean, observation: string }[],
    notes?: string
) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const result = await prisma.$transaction(async (tx) => {
            const passedChecks = checks.filter(c => c.passed).length;
            const totalChecks = checks.length;
            let status = 'pendiente';

            if (totalChecks > 0) {
                if (passedChecks === totalChecks) {
                    status = 'aprobado';
                } else if (passedChecks === 0) {
                    status = 'rechazado';
                } else {
                    status = 'parcial';
                }
            }

            // Get original record to know the item description
            const inspection = await tx.inspectionRecord.findUnique({
                where: { id: inspectionId },
                include: { projectItem: { include: { item: true } } }
            });

            // Delete existing checks first
            await tx.inspectionCheck.deleteMany({
                where: { inspectionRecordId: inspectionId }
            });

            // Update record and re-create checks
            const updated = await tx.inspectionRecord.update({
                where: { id: inspectionId },
                data: {
                    status,
                    notes,
                    checks: {
                        create: checks.map(c => ({
                            passed: c.passed,
                            observation: c.observation,
                            qualityControlId: c.qualityControlId
                        }))
                    }
                }
            });

            // Registrar en bitácora
            await tx.siteLog.create({
                data: {
                    projectId: projectId,
                    authorId: userId,
                    type: 'info',
                    content: `INSPECCIÓN ACTUALIZADA: "${inspection?.projectItem.item.description || 'Partida'}" re-evaluada como ${status.toUpperCase()}.`,
                    date: new Date()
                }
            }).catch(() => null);

            return updated;
        });

        revalidatePath(`/projects/${projectId}/operations`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating inspection record:", error);
        return { success: false, error: error.message || "Failed to update inspection record" };
    }
}
