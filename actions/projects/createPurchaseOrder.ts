'use server';

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
}) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return { success: false, error: 'No autorizado' };

        const { projectId, supplierId, items, paymentType, dueDate, notes } = data;

        return await prisma.$transaction(async (tx: any) => {
            const count = await tx.purchaseOrder.count({
                where: { projectId }
            });
            const project = await tx.project.findUnique({
                where: { id: projectId },
                select: { title: true }
            });
            const projectPrefix = project?.title?.slice(0, 3).toUpperCase() || 'ORD';
            const poNumber = `${projectPrefix}-${(count + 1).toString().padStart(4, '0')}`;

            const newOrder = await tx.purchaseOrder.create({
                data: {
                    number: poNumber,
                    projectId,
                    supplierId: supplierId === 'none' ? null : supplierId,
                    author: userId ? { connect: { id: userId } } : undefined,
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

            await tx.siteLog.create({
                data: {
                    projectId,
                    authorId: userId,
                    type: 'info',
                    content: `Se generó la Orden de Compra N° ${newOrder.number}.`,
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