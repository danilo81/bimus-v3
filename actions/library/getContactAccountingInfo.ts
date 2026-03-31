'use server';

import prisma from '@/lib/prisma';

export async function getContactAccountingInfo(contactId: string) {
    try {
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
            include: {
                projects: {
                    include: {
                        project: {
                            include: {
                                transactions: true,
                                purchaseOrders: {
                                    where: { supplierId: contactId }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!contact) return null;

        let totalIn = 0;
        let totalOut = 0;
        let recentMovements: any[] = [];

        // Lógica para Clientes: Consolidar ingresos de sus proyectos vinculados
        if (contact.type === 'cliente') {
            contact.projects.forEach((link: any) => {
                const projectIncome = link.project.transactions.filter((t: any) => t.type === 'ingreso');
                projectIncome.forEach((t: any) => {
                    totalIn += t.amount;
                    recentMovements.push({
                        date: t.date.toISOString().split('T')[0],
                        type: 'ingreso',
                        status: 'PAGO',
                        desc: t.description,
                        project: link.project.title,
                        amount: t.amount
                    });
                });
            });
        }

        // Lógica para Proveedores: Consolidar órdenes de compra
        if (contact.type === 'proveedor') {
            contact.projects.forEach((link: any) => {
                const supplierPOs = link.project.purchaseOrders;
                supplierPOs.forEach((po: any) => {
                    totalOut += po.totalAmount;
                    recentMovements.push({
                        date: po.createdAt.toISOString().split('T')[0],
                        type: 'egreso',
                        status: po.status.toUpperCase(),
                        desc: `ORDEN DE COMPRA: ${po.number}`,
                        project: link.project.title,
                        amount: po.totalAmount
                    });
                });
            });
        }

        recentMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            totalIn,
            totalOut,
            balance: contact.type === 'cliente' ? (totalIn - totalOut) : (totalOut),
            recentMovements: recentMovements.slice(0, 10)
        };
    } catch (error) {
        console.error('Error fetching contact accounting info:', error);
        return null;
    }
}