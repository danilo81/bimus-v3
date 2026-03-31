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
            const newOrder = await tx.purchaseOrder.create({
                data: {
                    projectId,
                    supplierId: supplierId === 'none' ? null : supplierId,
                    authorId: userId,
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