"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { PurchaseOrder } from "@/types/types";

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function createPurchaseOrder(data: { 
    projectId: string; 
    supplierId: string; 
    items: { supplyId: string, quantity: number, price: number }[];
    paymentType?: string;
    dueDate?: string;
    notes?: string;
    requestIds?: string[];
}) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const { projectId, supplierId, items, paymentType, dueDate, notes, requestIds } = data;

        return await prisma.$transaction(async (tx: any) => {
            if (requestIds && requestIds.length > 0) {
                await tx.supplyRequest.updateMany({
                    where: { id: { in: requestIds } },
                    data: { status: 'completado' }
                });
            }
            const project = await tx.project.findUnique({
                where: { id: projectId },
                select: { title: true }
            });
            const projectPrefix = project?.title?.slice(0, 3).toUpperCase() || 'ORD';

            // Buscar la última orden con este prefijo (a nivel global para evitar colisiones de prefijos iguales en distintos proyectos)
            const lastOrder = await tx.purchaseOrder.findFirst({
                where: {
                    number: {
                        startsWith: `${projectPrefix}-`
                    }
                },
                orderBy: {
                    number: 'desc'
                }
            });

            let nextNumber = 1;
            if (lastOrder) {
                const lastNumStr = lastOrder.number.split('-').pop();
                const lastNum = parseInt(lastNumStr || '0');
                if (!isNaN(lastNum)) {
                    nextNumber = lastNum + 1;
                }
            }

            const poNumber = `${projectPrefix}-${nextNumber.toString().padStart(4, '0')}`;

            const newOrder = await tx.purchaseOrder.create({
                data: {
                    number: poNumber,
                    projectId,
                    supplierId: supplierId === 'none' ? null : supplierId,
                    authorId: userId || null,
                    paymentType: paymentType || 'contado',
                    dueDate: dueDate ? new Date(dueDate) : null,
                    notes,
                    totalAmount: items.reduce((acc, item) => acc + item.quantity * item.price, 0),
                    items: {
                        create: items.map(item => ({
                            supplyId: item.supplyId,
                            quantity: item.quantity,
                            price: item.price,
                        }))
                    }
                }
            });

            // --- DETECCIÓN DE SOBRECOSTOS ---
            let totalOvercost = 0;
            const supplyIds = items.map(i => i.supplyId);
            const baseSupplies = await tx.supply.findMany({
                where: { id: { in: supplyIds } }
            });

            for (const item of items) {
                const baseSupply = baseSupplies.find((s: any) => s.id === item.supplyId);
                if (baseSupply && item.price > baseSupply.price) {
                    const unitDiff = item.price - baseSupply.price;
                    totalOvercost += unitDiff * item.quantity;
                }
            }

            if (totalOvercost > 0) {
                // Buscar la última orden de cambio con el prefijo OC-P- (globalmente)
                const lastOCP = await tx.projectChangeOrder.findFirst({
                    where: {
                        number: {
                            startsWith: 'OC-P-'
                        }
                    },
                    orderBy: {
                        number: 'desc'
                    }
                });

                let nextOCNum = 1;
                if (lastOCP && lastOCP.number) {
                    const lastNumStr = lastOCP.number.split('-').pop();
                    const lastNum = parseInt(lastNumStr || '0');
                    if (!isNaN(lastNum)) {
                        nextOCNum = lastNum + 1;
                    }
                }

                const ocNumber = `OC-P-${nextOCNum.toString().padStart(3, '0')}`;
                
                await tx.projectChangeOrder.create({
                    data: {
                        projectId,
                        number: ocNumber,
                        description: `Sobrecosto en Orden de Compra ${poNumber}`,
                        amount: totalOvercost,
                        type: "Incremento de Precio",
                        status: "pendiente", // El usuario pidió que fuera pendiente para revisión manual
                        reason: "Sobreprecio en Compra"
                    }
                });
            }
            // --------------------------------

            if (supplierId && supplierId !== 'none') {
                const existingLink = await tx.projectContact.findUnique({
                    where: {
                        projectId_contactId: {
                            projectId,
                            contactId: supplierId
                        }
                    }
                });

                if (!existingLink) {
                    await tx.projectContact.create({
                        data: {
                            projectId,
                            contactId: supplierId
                        }
                    });
                }
            }

            const supplier = supplierId && supplierId !== 'none' 
                ? await tx.contact.findUnique({ where: { id: supplierId }, select: { name: true } })
                : null;

            await tx.siteLog.create({
                data: {
                    projectId,
                    authorId: userId,
                    type: 'info',
                    content: `ORDEN DE COMPRA: Generada N° ${newOrder.number} para ${supplier?.name || "Sin proveedor asignado"} por ${newOrder.totalAmount.toLocaleString('es-ES')} BOB.${totalOvercost > 0 ? ' Se detectó UN SOBRECOSTO y se generó una Orden de Cambio pendiente.' : ''}`,
                    date: new Date()
                }
            });

            revalidatePath(`/projects/${projectId}/operations`);
            revalidatePath(`/projects/${projectId}/shop`);
            return { success: true, order: newOrder };
        });
    } catch (error: any) {
        console.error('Error creating purchase order:', error);
        return { success: false, error: error.message };
    }
}