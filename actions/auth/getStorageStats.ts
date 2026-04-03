'use server';

import prisma from "@/lib/prisma";
import { cookies } from 'next/headers';

export async function getStorageStats() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;

        if (!userId) {
            return { success: false, error: 'No autorizado' };
        }

        // Get user's storage limit
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { storageLimit: true } as any
        }) as any;

        if (!user) {
            return { success: false, error: 'Usuario no encontrado' };
        }

        // Parse storage limit (example: "1GB", "500MB")
        const limitStr = user.storageLimit || '1GB';
        let limitBytes = 1024 * 1024 * 1024; // Default 1GB

        const match = limitStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]B|[B])$/i);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            const multipliers: Record<string, number> = {
                'B': 1,
                'KB': 1024,
                'MB': 1024 * 1024,
                'GB': 1024 * 1024 * 1024,
                'TB': 1024 * 1024 * 1024 * 1024,
            };
            limitBytes = value * (multipliers[unit] || multipliers['GB']);
        }

        // Sum LibraryFile sizes
        const libraryFilesSum = await prisma.libraryFile.aggregate({
            where: { userId },
            _sum: { size: true }
        });

        // Sum ProjectDocument sizes
        const projectDocsSum = await (prisma.projectDocument.aggregate as any)({
            where: { userId },
            _sum: { size: true }
        }) as any;

        // Sum ContactDocument sizes
        const contactDocsSum = await (prisma.contactDocument.aggregate as any)({
            where: {
                contact: { 
                    userId: userId 
                }
            },
            _sum: { size: true }
        }) as any;

        const totalUsed = (libraryFilesSum._sum.size || 0) + 
                          (projectDocsSum._sum.size || 0) + 
                          (contactDocsSum._sum.size || 0);

        return {
            success: true,
            used: totalUsed,
            total: limitBytes,
            percentage: Math.min(100, (totalUsed / limitBytes) * 100)
        };
    } catch (error) {
        console.error('Error fetching storage stats:', error);
        return { 
            success: false, 
            used: 0, 
            total: 1024 * 1024 * 1024, 
            percentage: 0, 
            error: 'Error al obtener estadísticas de almacenamiento' 
        };
    }
}
