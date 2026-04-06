'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { addDays } from "date-fns";

async function getAuthUserId() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    return userId;
}

export async function consolidateProjectSchedule(projectId: string) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: "No autorizado" };

        const projectFetch = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                config: true,
                items: {
                    include: {
                        item: true
                    }
                }
            }
        });

        if (!projectFetch) return { success: false, error: "Proyecto no encontrado" };

        const projectStart = projectFetch.startDate ? new Date(projectFetch.startDate) : new Date();
        const workingDays = (projectFetch.config as any)?.workingDaysSelection || [1, 2, 3, 4, 5, 6];
        const computations = projectFetch.items;

        // Simple duration calculation: (Qty * Performance) / 8 hrs + extraDays
        const getDuration = (row: any) => {
            const performance = row.performance || row.item?.performance || 1;
            const baseDuration = Math.ceil(performance > 0 ? (row.quantity * performance) / 8 : 1);
            return Math.max(1, baseDuration + (row.extraDays || 0));
        };

        const addWorkingDaysHelper = (startDate: Date, duration: number) => {
            let date = new Date(startDate);
            while (!workingDays.includes(date.getDay())) {
                date = addDays(date, 1);
            }
            let daysAdded = 0;
            while (daysAdded < duration) {
                date = addDays(date, 1);
                if (workingDays.includes(date.getDay())) {
                    daysAdded++;
                }
            }
            return date;
        };

        const featureMap = new Map<string, { startAt: Date; duration: number }>();
        let defaultOffset = 0;

        const calculateDates = (row: any, visited = new Set<string>()): { startAt: Date; duration: number } => {
            if (featureMap.has(row.id)) return featureMap.get(row.id)!;

            if (visited.has(row.id)) {
                return { startAt: addWorkingDaysHelper(projectStart, defaultOffset), duration: getDuration(row) };
            }
            visited.add(row.id);

            let startAt: Date;
            if (row.predecessorId) {
                const predecessor = computations.find((c: any) => c.id === row.predecessorId);
                if (predecessor) {
                    const predData = calculateDates(predecessor, visited);
                    startAt = addWorkingDaysHelper(predData.startAt, predData.duration); // Finish-to-Start
                } else {
                    startAt = row.startDate ? new Date(row.startDate) : addWorkingDaysHelper(projectStart, defaultOffset);
                }
            } else if (row.startDate) {
                startAt = new Date(row.startDate);
            } else {
                startAt = addWorkingDaysHelper(projectStart, defaultOffset);
            }

            // Ensure start day is working day
            while (!workingDays.includes(startAt.getDay())) {
                startAt = addDays(startAt, 1);
            }

            const duration = getDuration(row);
            if (!row.predecessorId) {
                defaultOffset += Math.ceil(duration / 2);
            }

            const result = { startAt, duration };
            featureMap.set(row.id, result);
            return result;
        };

        // Calculate and build update data
        const updates = computations.map(row => {
            const { startAt, duration } = calculateDates(row);
            return {
                id: row.id,
                consolidatedStartDate: startAt,
                consolidatedDays: duration
            };
        });

        // Batch update using a transaction
        const itemUpdates = updates.map(upd => 
            prisma.projectItem.update({
                where: { id: upd.id },
                data: {
                    consolidatedStartDate: upd.consolidatedStartDate,
                    consolidatedDays: upd.consolidatedDays
                } as any
            })
        );

        await prisma.$transaction([
            ...(itemUpdates as any),
            prisma.project.update({
                where: { id: projectId },
                data: { consolidatedAt: new Date() } as any
            }),
            prisma.siteLog.create({
                data: {
                    projectId,
                    authorId: userId,
                    type: "REPROGRMACIÓN",
                    content: "CRONOGRAMA CONSOLIDADO: Se ha establecido la línea base del proyecto.",
                    date: new Date()
                }
            })
        ]);

        revalidatePath(`/projects/${projectId}/construction`);
        return { success: true };

    } catch (error: any) {
        console.error("Error consolidando proyecto:", error);
        return { success: false, error: error.message };
    }
}
