'use server';

import prisma from '../../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function getContacts() {
    try {
        const userId = await getAuthUserId();

        const contacts = await prisma.contact.findMany({
            where: userId ? { userId } : {},
            include: {
                bankAccounts: {
                    orderBy: { isPreferred: 'desc' }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        return contacts;
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return [];
    }
}

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

export async function createContact(data: {
    name: string;
    email?: string;
    phone: string;
    type: string;
    status: string;
    company?: string;
    nit?: string;
    address?: string;
    notes?: string;
}) {
    try {
        const userId = await getAuthUserId();

        if (data.nit) {
            const existing = await prisma.contact.findFirst({
                where: {
                    nit: {
                        equals: data.nit,
                        mode: 'insensitive'
                    },
                    userId: userId || undefined
                }
            });

            if (existing) {
                return {
                    success: false,
                    error: 'Ya existe un contacto registrado con este NIT o C.I..'
                };
            }
        }

        const contact = await prisma.contact.create({
            data: {
                name: data.name,
                email: data.email || '',
                phone: data.phone,
                type: data.type,
                status: data.status,
                company: data.company || null,
                nit: data.nit || null,
                address: data.address || null,
                notes: data.notes || null,
                userId: userId || null,
            }
        });
        revalidatePath('/contacts');
        return { success: true, contact };
    } catch (error: any) {
        console.error('Error creating contact:', error);
        return { success: false, error: error?.message || 'Error al crear el contacto' };
    }
}

export async function updateContact(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    type?: string;
    status?: string;
    company?: string;
    nit?: string;
    address?: string;
    notes?: string;
}) {
    try {
        const userId = await getAuthUserId();

        const existing = await prisma.contact.findUnique({
            where: { id }
        });

        if (!existing) {
            return { success: false, error: 'Contacto no encontrado' };
        }

        if (data.nit && data.nit.toLowerCase() !== existing.nit?.toLowerCase()) {
            const nitInUse = await prisma.contact.findFirst({
                where: {
                    nit: { equals: data.nit, mode: 'insensitive' },
                    id: { not: id },
                    userId: userId || undefined
                }
            });

            if (nitInUse) {
                return { success: false, error: 'Este NIT o C.I. ya está asignado a otro contacto.' };
            }
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.company !== undefined) updateData.company = data.company;
        if (data.nit !== undefined) updateData.nit = data.nit;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.notes !== undefined) updateData.notes = data.notes;

        const contact = await prisma.contact.update({
            where: { id },
            data: updateData
        });
        revalidatePath('/contacts');
        return { success: true, contact };
    } catch (error) {
        console.error('Error updating contact:', error);
        return { success: false, error: 'Error al actualizar el contacto' };
    }
}

export async function deleteContact(id: string) {
    try {
        const existing = await prisma.contact.findUnique({
            where: { id }
        });

        if (!existing) {
            return { success: false, error: 'Contacto no encontrado.' };
        }

        const supplyCount = await prisma.supplyCost.count({
            where: { supplierId: id }
        });

        if (supplyCount > 0) {
            return {
                success: false,
                error: `Integridad referencial: No se puede eliminar el contacto porque está registrado como proveedor en cotizaciones de insumos.`
            };
        }

        const projectCount = await prisma.projectContact.count({
            where: { contactId: id }
        });

        if (projectCount > 0) {
            return {
                success: false,
                error: `Operación bloqueada: Este contacto forma parte activa del equipo de trabajo en ${projectCount} proyecto(s).`
            };
        }

        await prisma.contact.delete({
            where: { id }
        });

        revalidatePath('/contacts');
        return { success: true };
    } catch (error) {
        console.error('Error deleting contact:', error);
        return { success: false, error: 'Error interno al intentar eliminar el contacto.' };
    }
}

export async function createBankAccount(data: {
    contactId: string;
    bankName: string;
    accountNumber: string;
    swiftCode?: string;
    isPreferred?: boolean;
}) {
    try {
        if (data.isPreferred) {
            await prisma.bankAccount.updateMany({
                where: { contactId: data.contactId },
                data: { isPreferred: false }
            });
        }

        const account = await prisma.bankAccount.create({
            data: {
                contactId: data.contactId,
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                swiftCode: data.swiftCode || null,
                isPreferred: data.isPreferred || false,
            }
        });
        revalidatePath('/contacts');
        return { success: true, account };
    } catch (error) {
        console.error('Error creating bank account:', error);
        return { success: false, error: 'Error al registrar la cuenta bancaria' };
    }
}

export async function updateBankAccount(id: string, data: {
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    isPreferred?: boolean;
}) {
    try {
        if (data.isPreferred) {
            const account = await prisma.bankAccount.findUnique({ where: { id }, select: { contactId: true } });
            if (account) {
                await prisma.bankAccount.updateMany({
                    where: { contactId: account.contactId },
                    data: { isPreferred: false }
                });
            }
        }

        const account = await prisma.bankAccount.update({
            where: { id },
            data: {
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                swiftCode: data.swiftCode,
                isPreferred: data.isPreferred,
            }
        });
        revalidatePath('/contacts');
        return { success: true, account };
    } catch (error) {
        console.error('Error updating bank account:', error);
        return { success: false, error: 'Error al actualizar la cuenta bancaria' };
    }
}

export async function deleteBankAccount(id: string) {
    try {
        await prisma.bankAccount.delete({
            where: { id }
        });
        revalidatePath('/contacts');
        return { success: true };
    } catch (error) {
        console.error('Error deleting bank account:', error);
        return { success: false, error: 'Error al eliminar la cuenta bancaria' };
    }
}

export async function importContactToLibrary(contactId: string) {
    try {
        const currentUserId = await getAuthUserId();
        if (!currentUserId) return { success: false, error: 'No autorizado' };

        const sourceContact = await prisma.contact.findUnique({
            where: { id: contactId },
            include: { bankAccounts: true }
        });

        if (!sourceContact) return { success: false, error: 'Contacto original no encontrado' };

        if (sourceContact.nit) {
            const existing = await prisma.contact.findFirst({
                where: {
                    nit: sourceContact.nit,
                    userId: currentUserId
                }
            });
            if (existing) return { success: false, error: 'Este contacto ya existe en tu librería global.' };
        }

        const newContact = await prisma.contact.create({
            data: {
                name: sourceContact.name,
                email: sourceContact.email,
                phone: sourceContact.phone,
                type: sourceContact.type,
                status: sourceContact.status,
                company: sourceContact.company,
                nit: sourceContact.nit,
                address: sourceContact.address,
                notes: sourceContact.notes,
                userId: currentUserId,
                bankAccounts: {
                    create: sourceContact.bankAccounts.map(ba => ({
                        bankName: ba.bankName,
                        accountNumber: ba.accountNumber,
                        swiftCode: ba.swiftCode,
                        isPreferred: ba.isPreferred
                    }))
                }
            }
        });

        revalidatePath('/library/contacts');
        return { success: true, contact: newContact };
    } catch (error: any) {
        console.error('Error importing contact:', error);
        return { success: false, error: error.message || 'Error al importar contacto' };
    }
}
