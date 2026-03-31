'use server';

import prisma from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";
import { BimTopicStatus } from "../../../../types/types";

/**
 * Obtiene el documento BIM de un proyecto y construye la estructura jerárquica de tópicos.
 */
export async function getBimDocument(projectId: string) {
    try {
        if (!projectId) throw new Error("ID de proyecto no proporcionado");

        let doc = await prisma.bimDocument.findUnique({
            where: { projectId },
            include: {
                topics: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        // Si no existe, creamos el documento base con la estructura ISO 19650 inicial
        if (!doc) {
            doc = await prisma.bimDocument.create({
                data: {
                    projectId,
                    topics: {
                        create: [
                            { title: 'OIR - Organizational Information Requirements', order: 0, status: 'in_progress', content: '' },
                            { title: 'PIR - Project Information Requirements', order: 1, status: 'in_progress', content: '' },
                            { title: 'AIR - Asset Information Requirements', order: 2, status: 'in_progress', content: '' },
                            { title: 'EIR - Exchange Information Requirements', order: 3, status: 'in_progress', content: '' },
                            { title: 'BEP - BIM Execution Plan', order: 4, status: 'in_progress', content: '' },
                            { title: 'Common Data Environment (CDE) Protocols', order: 5, status: 'in_progress', content: '' },
                        ]
                    }
                },
                include: {
                    topics: {
                        orderBy: { order: 'asc' }
                    }
                }
            });
        }

        // Construir árbol jerárquico
        const allTopics = JSON.parse(JSON.stringify(doc.topics));
        const topicMap: Record<string, any> = {};

        allTopics.forEach((t: any) => {
            t.children = [];
            topicMap[t.id] = t;
        });

        const rootTopics: any[] = [];
        allTopics.forEach((t: any) => {
            if (t.parentId && topicMap[t.parentId]) {
                topicMap[t.parentId].children.push(t);
            } else {
                rootTopics.push(t);
            }
        });

        return { success: true, topics: rootTopics, documentId: doc.id };
    } catch (error: any) {
        console.error('Error fetching BIM document:', error);
        return { success: false, error: error.message || 'Error al cargar la documentación técnica BIM.' };
    }
}

/**
 * Crea o actualiza un tópico dentro del documento BIM.
 */
export async function upsertBimTopic(data: {
    id?: string;
    documentId: string;
    projectId: string;
    parentId?: string | null;
    title: string;
    content?: string | null;
    status: BimTopicStatus;
    order: number;
}) {
    try {
        const topic = data.id
            ? await prisma.bimTopic.update({
                where: { id: data.id },
                data: {
                    title: data.title,
                    content: data.content,
                    status: data.status,
                    order: data.order
                }
            })
            : await prisma.bimTopic.create({
                data: {
                    documentId: data.documentId,
                    parentId: data.parentId || null,
                    title: data.title,
                    content: data.content || '',
                    status: data.status,
                    order: data.order
                }
            });

        revalidatePath(`/projects/${data.projectId}/documentation`);
        return { success: true, topic };
    } catch (error: any) {
        console.error('Error upserting BIM topic:', error);
        return { success: false, error: error.message || 'Error al persistir los cambios en el tópico.' };
    }
}

/**
 * Crea un tópico y sus hijos en una sola transacción.
 */
export async function createTopicWithChildren(data: {
    documentId: string;
    projectId: string;
    parentId?: string | null;
    title: string;
    children: string[];
}) {
    try {
        if (!data.documentId) throw new Error("Document ID es requerido");

        const result = await prisma.$transaction(async (tx) => {
            const count = await tx.bimTopic.count({
                where: { documentId: data.documentId, parentId: data.parentId || null }
            });

            // 1. Crear padre
            const parent = await tx.bimTopic.create({
                data: {
                    documentId: data.documentId,
                    parentId: data.parentId || null,
                    title: data.title,
                    status: 'in_progress',
                    order: count,
                    content: ''
                }
            });

            // 2. Crear hijos
            const validChildrenTitles = (data.children || []).filter(title => title.trim() !== '');
            if (validChildrenTitles.length > 0) {
                for (let i = 0; i < validChildrenTitles.length; i++) {
                    await tx.bimTopic.create({
                        data: {
                            documentId: data.documentId,
                            parentId: parent.id,
                            title: validChildrenTitles[i],
                            status: 'in_progress',
                            order: i,
                            content: ''
                        }
                    });
                }
            }

            return parent;
        });

        revalidatePath(`/projects/${data.projectId}/documentation`);
        return { success: true, topic: result };
    } catch (error: any) {
        console.error('Error creating topic with children:', error);
        return { success: false, error: error.message || 'Fallo al crear el tópico y sus sub-secciones.' };
    }
}

/**
 * Elimina un tópico.
 */
export async function deleteBimTopic(id: string, projectId: string) {
    try {
        await prisma.bimTopic.delete({
            where: { id }
        });
        revalidatePath(`/projects/${projectId}/documentation`);
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting BIM topic:', error);
        return { success: false, error: error.message || 'Error al eliminar el tópico de la base de datos.' };
    }
}

/**
 * Aplica una plantilla predefinida al documento BIM.
 */
export async function applyBimTemplate(projectId: string, templateType: string) {
    try {
        const doc = await prisma.bimDocument.findUnique({
            where: { projectId }
        });

        if (!doc) throw new Error("Documento no encontrado");

        // Limpiar tópicos actuales
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
