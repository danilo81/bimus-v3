"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateInspectionRecord(
    inspectionId: string,
    projectId: string,
    checks: { qualityControlId: string, passed: boolean, observation: string }[],
    notes?: string
) {
    try {
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

        // Delete existing checks first
        await prisma.inspectionCheck.deleteMany({
            where: { inspectionRecordId: inspectionId }
        });

        // Update record and re-create checks
        await prisma.inspectionRecord.update({
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

        revalidatePath(`/projects/${projectId}/operations`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating inspection record:", error);
        return { success: false, error: error.message || "Failed to update inspection record" };
    }
}
