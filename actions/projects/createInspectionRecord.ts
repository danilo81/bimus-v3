'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface InspectionCheckInput {
    qualityControlId: string;
    subPointId?: string;
    passed: boolean;
    observation?: string;
}

export interface CreateInspectionRecordData {
    projectId: string;
    projectItemId: string;
    levelId?: string;
    inspector?: string;
    date?: string;
    notes?: string;
    checks: InspectionCheckInput[];
}

export async function createInspectionRecord(data: CreateInspectionRecordData) {
    try {
        const record = await prisma.inspectionRecord.create({
            data: {
                projectId: data.projectId,
                projectItemId: data.projectItemId,
                levelId: data.levelId || null,
                inspector: data.inspector || null,
                date: data.date ? new Date(data.date) : new Date(),
                notes: data.notes || null,
                status: data.checks.every(c => c.passed) ? 'aprobado' : data.checks.some(c => c.passed) ? 'parcial' : 'rechazado',
                checks: {
                    create: data.checks.map(c => ({
                        qualityControlId: c.qualityControlId,
                        subPointId: c.subPointId || null,
                        passed: c.passed,
                        observation: c.observation || null,
                    }))
                }
            },
            include: { checks: true }
        });

        revalidatePath(`/projects/${data.projectId}/operations`);
        return { success: true, record };
    } catch (error) {
        console.error('Error creating inspection record:', error);
        return { success: false, error: 'Error al registrar la inspección.' };
    }
}