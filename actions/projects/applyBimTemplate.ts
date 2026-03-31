'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function applyBimTemplate(projectId: string, templateType: string) {
    try {
        const doc = await prisma.bimDocument.findUnique({
            where: { projectId }
        });

        if (!doc) throw new Error("Documento no encontrado");

        await prisma.bimTopic.deleteMany({
            where: { documentId: doc.id }
        });

        let topicsToCreate: any[] = [];

        switch (templateType) {
            case 'iso_19650':
                topicsToCreate = [
                    { title: 'OIR - Organizational Information Requirements', order: 0 },
                    { title: 'PIR - Project Information Requirements', order: 1 },
                    { title: 'AIR - Asset Information Requirements', order: 2 },
                    { title: 'EIR - Exchange Information Requirements', order: 3 },
                    { title: 'BEP - BIM Execution Plan', order: 4 },
                    { title: 'CDE - Common Data Environment', order: 5 },
                ];
                break;
            case 'bep_only':
                topicsToCreate = [
                    { title: '1. Introducción y Alcance', order: 0 },
                    { title: '2. Información del Proyecto', order: 1 },
                    { title: '3. Roles y Responsabilidades', order: 2 },
                    { title: '4. Usos BIM y Objetivos', order: 3 },
                    { title: '5. Estándares de Entrega', order: 4 },
                    { title: '6. Software y Formatos', order: 5 },
                    { title: '7. Coordinación y Colaboración', order: 6 },
                ];
                break;
            case 'design_phase':
                topicsToCreate = [
                    { title: 'Protocolo de Diseño Conceptual', order: 0 },
                    { title: 'Estándares de Modelado Arquitectónico', order: 1 },
                    { title: 'Criterios de Estructuras y MEP', order: 2 },
                    { title: 'Coordinación 3D y Detección de Interferencias', order: 3 },
                ];
                break;
            case 'construction_phase':
                topicsToCreate = [
                    { title: 'Control de Avance 4D (Planificación)', order: 0 },
                    { title: 'Gestión de Costos 5D', order: 1 },
                    { title: 'Protocolos de Calidad en Obra', order: 2 },
                    { title: 'Registro de As-Built', order: 3 },
                ];
                break;
        }

        if (topicsToCreate.length > 0) {
            for (const t of topicsToCreate) {
                await prisma.bimTopic.create({
                    data: {
                        documentId: doc.id,
                        title: t.title,
                        order: t.order,
                        status: 'in_progress',
                        content: ''
                    }
                });
            }
        }

        revalidatePath(`/projects/${projectId}/documentation`);
        return { success: true };
    } catch (error: any) {
        console.error('Error applying template:', error);
        return { success: false, error: error.message || 'Fallo al aplicar la plantilla.' };
    }
}