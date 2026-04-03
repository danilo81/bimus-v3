'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

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
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const record = await prisma.$transaction(async (tx) => {
            const projectItem = await tx.projectItem.findUnique({
                where: { id: data.projectItemId },
                include: { item: true }
            });

            const status = data.checks.every(c => c.passed) ? 'aprobado' : data.checks.some(c => c.passed) ? 'parcial' : 'rechazado';

            const newRecord = await tx.inspectionRecord.create({
                data: {
                    projectId: data.projectId,
                    projectItemId: data.projectItemId,
                    levelId: data.levelId || null,
                    inspector: data.inspector || null,
                    date: data.date ? new Date(data.date) : new Date(),
                    notes: data.notes || null,
                    status: status,
                    checks: {
                        create: data.checks.map(c => ({
                            qualityControlId: c.qualityControlId,
                            subPointId: c.subPointId || null,
                            passed: c.passed,
                            observation: c.observation || null,
                        }))
                    }
                }
            });

            // Registrar en bitácora
            await tx.siteLog.create({
                data: {
                    projectId: data.projectId,
                    authorId: userId,
                    type: 'info',
                    content: `INSPECCIÓN DE CALIDAD: "${projectItem?.item.description || 'Partida'}" evaluada como ${status.toUpperCase()}.`,
                    date: new Date()
                }
            }).catch(() => null);

            return newRecord;
        });

        revalidatePath(`/projects/${data.projectId}/operations`);
        return { success: true, record };
    } catch (error: any) {
        console.error('Error creating inspection record:', error);
        return { success: false, error: error.message || 'Error al registrar la inspección.' };
    }
}