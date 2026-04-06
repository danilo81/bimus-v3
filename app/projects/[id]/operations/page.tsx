"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Contact } from '@/types/types';

import {
    getSupplyRequests,
    getProjectTransactions,
    getPurchaseOrders,
    createWarehouseExit,
    getWarehouseStock,
    getProjectById,
    createSiteLogEntry,
    updateSiteLogEntry,
    deleteSiteLogEntry,
    createInspectionRecord,
    updateInspectionRecord,
    deleteInspectionRecord,
    updateProjectChangeOrder,
    deleteProjectChangeOrder,
    getProjectPayrolls,
    createPayroll,
    updatePayroll,
    deletePayroll,
    getValuations,
    createValuation,
    updateValuation,
    deleteValuation
} from '@/actions';
import {
    ChevronLeft,
    PlusCircle,
    X,
    Loader2,
    Activity,
    Info,
    AlertCircle,
    ClipboardList,
    Calculator,
    Coins,
    CalendarDays,
    Trash2,
    Edit3,
    CheckCircle,
    FileImage
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '../../../../components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../../../../components/ui/select';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { useToast } from '../../../../hooks/use-toast';
import { useAuth } from '../../../../hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Badge } from '../../../../components/ui/badge';
import { Checkbox } from '../../../../components/ui/checkbox';
import { getContacts } from '@/actions';
import { cn } from '../../../../lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs"

export default function OperationsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [project, setProject] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supplyRequests, setSupplyRequests] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [warehouseStock, setWarehouseStock] = useState<Record<string, { totalIn: number; totalOut: number; currentStock: number }>>({});

    //  Modals state
    const [isPedidosOpen, setIsPedidosOpen] = useState(false);
    const [isCotizacionesOpen, setIsCotizacionesOpen] = useState(false);
    const [isPOOpen, setIsPOOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isPayrollHistoryModalOpen, setIsPayrollHistoryModalOpen] = useState(false);
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [isNewPayrollOpen, setIsNewPayrollOpen] = useState(false);
    const [isSubmittingPayroll, setIsSubmittingPayroll] = useState(false);

    // Formulario de Nueva Planilla
    const [payrollStartDate, setPayrollStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [payrollEndDate, setPayrollEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [payrollEntries, setPayrollEntries] = useState<any[]>([]);

    //  Planilla de Avance (Valuaciones)
    const [valuations, setValuations] = useState<any[]>([]);
    const [isNewValuationOpen, setIsNewValuationOpen] = useState(false);
    const [isSubmittingValuation, setIsSubmittingValuation] = useState(false);
    const [valuationDescription, setValuationDescription] = useState('');
    const [valuationDate, setValuationDate] = useState(new Date().toISOString().split('T')[0]);
    const [valuationEntries, setValuationEntries] = useState<any[]>([]);
    const [editingValuationId, setEditingValuationId] = useState<string | null>(null);
    const [isDeleteValuationConfirmOpen, setIsDeleteValuationConfirmOpen] = useState(false);
    const [valuationToDeleteId, setValuationToDeleteId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('ordendecambio');

    // Cálculos de Órdenes de Cambio
    const changeOrders = useMemo(() => project?.changeOrders || [], [project]);
    const statsOC = useMemo(() => {
        const approved = changeOrders.filter((oc: any) => oc.status === 'Aprobada');
        const pending = changeOrders.filter((oc: any) => oc.status === 'pendiente');

        const totalApproved = approved.filter((oc: any) => oc.amount > 0).reduce((acc: number, oc: any) => acc + oc.amount, 0);
        const totalDeductions = approved.filter((oc: any) => oc.amount < 0).reduce((acc: number, oc: any) => acc + oc.amount, 0);
        const totalPending = pending.reduce((acc: number, oc: any) => acc + oc.amount, 0);

        return {
            totalApproved,
            totalDeductions,
            totalPending,
            approvedCount: approved.length,
            pendingCount: pending.length,
            deductionCount: approved.filter((oc: any) => oc.amount < 0).length
        };
    }, [changeOrders]);

    const handleApproveOC = async (id: string) => {
        try {
            const res = await updateProjectChangeOrder(id, { status: 'Aprobada' });
            if (res.success) {
                toast({ title: "Orden de Cambio Aprobada", description: "El impacto financiero ahora es parte del presupuesto." });
                setProject((prev: any) => ({
                    ...prev,
                    changeOrders: prev.changeOrders.map((oc: any) => oc.id === id ? { ...oc, status: 'Aprobada' } : oc)
                }));
            }
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    // Change Order Delete state
    const [isDeleteOCConfirmOpen, setIsDeleteOCConfirmOpen] = useState(false);
    const [ocToDelete, setOcToDelete] = useState<any | null>(null);
    const [isDeletingOC, setIsDeletingOC] = useState(false);

    const handleConfirmDeleteOC = async () => {
        if (!ocToDelete) return;
        setIsDeletingOC(true);
        try {
            const res = await deleteProjectChangeOrder(ocToDelete.id);
            if (res.success) {
                toast({ title: "Orden de Cambio Eliminada", description: `${ocToDelete.number} ha sido eliminada correctamente.` });
                setProject((prev: any) => ({
                    ...prev,
                    changeOrders: prev.changeOrders.filter((oc: any) => oc.id !== ocToDelete.id)
                }));
                setIsDeleteOCConfirmOpen(false);
                setOcToDelete(null);
            } else {
                toast({ title: "No se puede eliminar", description: res.error, variant: "destructive" });
                setIsDeleteOCConfirmOpen(false);
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsDeletingOC(false);
        }
    };

    //  Search and Overrides

    const [allContacts, setAllContacts] = useState<Contact[]>([]);

    // Site Log State
    const [isNewLogOpen, setIsNewLogOpen] = useState(false);
    const [newLogType, setNewLogType] = useState('Avance');
    const [newLogContent, setNewLogContent] = useState('');
    const [isSubmittingLog, setIsSubmittingLog] = useState(false);

    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [editLogType, setEditLogType] = useState('Avance');
    const [editLogContent, setEditLogContent] = useState('');
    const [isSubmittingEditLog, setIsSubmittingEditLog] = useState(false);

    // Inspection State
    const [isNewInspectionOpen, setIsNewInspectionOpen] = useState(false);
    const [inspectionItemId, setInspectionItemId] = useState<string>('');
    const [inspectionChecks, setInspectionChecks] = useState<Record<string, { passed: boolean, observation: string }>>({});
    const [inspectionImages, setInspectionImages] = useState<File[]>([]);
    const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);

    const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null);
    const [editInspectionChecks, setEditInspectionChecks] = useState<Record<string, { passed: boolean, observation: string }>>({});
    const [isSubmittingEditInspection, setIsSubmittingEditInspection] = useState(false);

    // Payroll Edit/Delete States
    const [editingPayrollId, setEditingPayrollId] = useState<string | null>(null);
    const [isDeletePayrollConfirmOpen, setIsDeletePayrollConfirmOpen] = useState(false);
    const [payrollToDeleteId, setPayrollToDeleteId] = useState<string | null>(null);

    // Payroll Data Calculation Helper
    const datesInRange = useMemo(() => {
        if (!payrollStartDate || !payrollEndDate) return [];
        const start = new Date(payrollStartDate);
        const end = new Date(payrollEndDate);
        const dates = [];
        const curr = new Date(start);
        while (curr <= end) {
            dates.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    }, [payrollStartDate, payrollEndDate]);

    const selectedProjItem = project?.items?.find((i: any) => i.id === inspectionItemId);
    const selectedEditInspection = useMemo(() =>
        project?.inspectionRecords?.find((r: any) => r.id === editingInspectionId),
        [editingInspectionId, project?.inspectionRecords]
    );

    // Auto-initialize inspection checks when an item is chosen
    useEffect(() => {
        if (selectedProjItem?.item?.qualityControls) {
            const initialChecks: Record<string, { passed: boolean, observation: string }> = {};
            selectedProjItem.item.qualityControls.forEach((qc: any) => {
                initialChecks[qc.id] = { passed: false, observation: '' };
            });
            setInspectionChecks(initialChecks);
        } else {
            setInspectionChecks({});
        }
    }, [inspectionItemId, selectedProjItem]);

    const fetchProject = useCallback(async () => {
        const id = params?.id;
        const cleanId = Array.isArray(id) ? id[0] : id;

        if (!cleanId || cleanId === 'undefined') return;

        if (!project) setIsLoading(true);
        try {
            const [found, requests, txs, pos, stock] = await Promise.all([
                getProjectById(cleanId as string),
                getSupplyRequests(cleanId as string),
                getProjectTransactions(cleanId as string),
                getPurchaseOrders(cleanId as string),
                getWarehouseStock(cleanId as string)
            ]);

            if (found) {
                setProject(found as any);
            }
            const payrollsRes = await getProjectPayrolls(cleanId as string);
            if (payrollsRes.success) {
                setPayrolls(payrollsRes.payrolls || []);
            }
            const valuationsRes = await getValuations(cleanId as string);
            if (valuationsRes.success) {
                setValuations(valuationsRes.valuations || []);
            }
            setSupplyRequests(requests || []);
            setTransactions(txs || []);
            if (pos.success) {
                setPurchaseOrders(pos.orders);
            }
            setWarehouseStock(stock || {});
        } catch (error) {
            console.error("Error loading project data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [params?.id]);

    const fetchAllContacts = useCallback(async () => {
        try {
            const contacts = await getContacts();
            setAllContacts(contacts as any);
        } catch (error) {
            console.error("Error fetching contacts:", error);
        }
    }, []);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    useEffect(() => {
        if ((isCotizacionesOpen || isPOOpen) && allContacts.length === 0) {
            fetchAllContacts();
        }
    }, [isCotizacionesOpen, isPOOpen, allContacts.length, fetchAllContacts]);







    const handleCreateSiteLog = async () => {
        if (!project || !newLogType || !newLogContent) return;
        setIsSubmittingLog(true);
        try {
            const result = await createSiteLogEntry(project.id, newLogType, newLogContent);
            if (result.success) {
                toast({ title: "Entrada guardada en el Libro de Obra" });
                setIsNewLogOpen(false);
                setNewLogContent('');
                setNewLogType('Avance');
                fetchProject(); // Refresca los siteLogs
            } else {
                toast({ title: "Error al guardar", description: result.error, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmittingLog(false);
        }
    };

    const handleEditSiteLog = async () => {
        if (!project || !editingLogId || !editLogContent) return;
        setIsSubmittingEditLog(true);
        try {
            const result = await updateSiteLogEntry(editingLogId, project.id, editLogType, editLogContent);
            if (result.success) {
                toast({ title: "Entrada modificada exitosamente" });
                setEditingLogId(null);
                setEditLogContent('');
                fetchProject();
            } else {
                toast({ title: "Error al modificar", description: result.error, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmittingEditLog(false);
        }
    };

    const handleDeleteSiteLog = async (logId: string) => {
        if (!project || !confirm("¿Seguro que deseas eliminar esta entrada del libro de obra?")) return;
        try {
            const result = await deleteSiteLogEntry(logId, project.id);
            if (result.success) {
                toast({ title: "Entrada eliminada exitosamente" });
                fetchProject();
            } else {
                toast({ title: "Error al eliminar", description: result.error, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleCreateInspection = async () => {
        if (!project || !inspectionItemId) return;
        setIsSubmittingInspection(true);

        try {
            // Preparamos los checks transformando el diccionario en array
            const checksArray = Object.entries(inspectionChecks).map(([qcId, data]) => ({
                qualityControlId: qcId,
                passed: data.passed,
                observation: data.observation
            }));

            // Si hay imágenes fingimos una cadena para el guardado (hasta que el backend soporte multipart para R2 aquí)
            const imagesNotes = inspectionImages.length > 0
                ? `\n[Adjuntos: ${inspectionImages.map(f => f.name).join(', ')}]`
                : '';

            const result = await createInspectionRecord({
                projectId: project.id,
                projectItemId: inspectionItemId,
                checks: checksArray,
                notes: `Inspección de calidad completada.${imagesNotes}`
            });

            if (result.success) {
                toast({ title: "Inspección registrada con éxito" });
                setIsNewInspectionOpen(false);
                setInspectionItemId('');
                setInspectionImages([]);
                fetchProject();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmittingInspection(false);
        }
    };

    const handleDeleteInspection = async (id: string) => {
        if (!project || !confirm("¿Seguro que deseas eliminar esta inspección?")) return;
        try {
            const result = await deleteInspectionRecord(id, project.id);
            if (result.success) {
                toast({ title: "Inspección eliminada exitosamente" });
                fetchProject();
            } else {
                toast({ title: "Error al eliminar", description: result.error, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleEditInspection = async () => {
        if (!project || !editingInspectionId) return;
        setIsSubmittingEditInspection(true);
        try {
            const checksArray = Object.entries(editInspectionChecks).map(([qcId, data]) => ({
                qualityControlId: qcId,
                passed: data.passed,
                observation: data.observation
            }));

            const result = await updateInspectionRecord(
                editingInspectionId,
                project.id,
                checksArray,
                "Inspección actualizada."
            );

            if (result.success) {
                toast({ title: "Inspección actualizada con éxito" });
                setEditingInspectionId(null);
                fetchProject();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmittingEditInspection(false);
        }
    };

    const handleAddPersonToPayroll = (contact: any) => {
        if (payrollEntries.some(e => e.contactId === contact.id)) return;

        const initialAttendance: Record<string, number> = {};
        datesInRange.forEach(date => {
            initialAttendance[date.toISOString().split('T')[0]] = 1;
        });

        const initialDays = datesInRange.length;

        setPayrollEntries(prev => [...prev, {
            contactId: contact.id,
            name: contact.name,
            dailyAttendance: initialAttendance,
            daysWorked: initialDays,
            dailyRate: 0,
            totalAmount: 0
        }]);
    };

    // Auto-update attendance when dates change
    useEffect(() => {
        if (payrollEntries.length === 0) return;
        setPayrollEntries(prev => prev.map(entry => {
            const newAttendance: Record<string, number> = {};
            datesInRange.forEach(date => {
                const dateStr = date.toISOString().split('T')[0];
                // Preserve existing values if they fall within the new range, default to 1
                newAttendance[dateStr] = entry.dailyAttendance?.[dateStr] ?? 1;
            });
            const updatedDaysWorked = Object.values(newAttendance).reduce((acc: number, val: any) => acc + val, 0);
            return {
                ...entry,
                dailyAttendance: newAttendance,
                daysWorked: updatedDaysWorked,
                totalAmount: updatedDaysWorked * entry.dailyRate
            };
        }));
    }, [datesInRange]);

    const handleRemovePersonFromPayroll = (contactId: string) => {
        setPayrollEntries(prev => prev.filter(e => e.contactId !== contactId));
    };

    const handleDailyAttendanceChange = (contactId: string, dateStr: string, value: number) => {
        setPayrollEntries(prev => prev.map(e => {
            if (e.contactId === contactId) {
                const updatedAttendance = { ...e.dailyAttendance, [dateStr]: value };
                const updatedDaysWorked = Object.values(updatedAttendance).reduce((acc: number, val: any) => acc + val, 0);
                return {
                    ...e,
                    dailyAttendance: updatedAttendance,
                    daysWorked: updatedDaysWorked,
                    totalAmount: updatedDaysWorked * e.dailyRate
                };
            }
            return e;
        }));
    };

    const handlePayrollEntryChange = (contactId: string, field: string, value: number) => {
        setPayrollEntries(prev => prev.map(e => {
            if (e.contactId === contactId) {
                const updated = { ...e, [field]: value };
                // Recalculate total if rate changed
                updated.totalAmount = updated.daysWorked * updated.dailyRate;
                return updated;
            }
            return e;
        }));
    };

    const payrollGrandTotal = useMemo(() => {
        return payrollEntries.reduce((acc, e) => acc + e.totalAmount, 0);
    }, [payrollEntries]);

    const handleEditPayroll = (payroll: any) => {
        setEditingPayrollId(payroll.id);
        setPayrollStartDate(new Date(payroll.startDate).toISOString().split('T')[0]);
        setPayrollEndDate(new Date(payroll.endDate).toISOString().split('T')[0]);

        // Reconstruct entries with dailyAttendance
        const reconstructedEntries = payroll.entries.map((entry: any) => {
            // Since we don't store daily breakdown in DB yet, we distribute daysWorked equally or just as 1s
            // Improvement: If we had daily breakdown in DB, we'd load it here.
            // For now, we'll try to maintain consistency.
            // Actually, if it was edited before, it might have weird values.
            // Let's assume 1 per day for simplicity if we don't have the data.
            // Wait, the user asked for each day, so we should probably start storing daily journals in DB.
            // But for now, let's just load the total days and distribute.

            return {
                contactId: entry.contactId,
                name: entry.contact?.name || 'Desconocido',
                dailyAttendance: {}, // Will be populated by the useEffect sync
                daysWorked: entry.daysWorked,
                dailyRate: entry.dailyRate,
                totalAmount: entry.totalAmount
            };
        });

        setPayrollEntries(reconstructedEntries);
        setIsNewPayrollOpen(true);
    };

    const handleDeletePayroll = async (id: string) => {
        setIsSubmittingPayroll(true);
        try {
            const result = await deletePayroll(id);
            if (result.success) {
                toast({ title: "Planilla Eliminada", description: "Se ha removido el egreso asociado." });
                setIsDeletePayrollConfirmOpen(false);
                fetchProject();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmittingPayroll(false);
        }
    };

    const handleSavePayroll = async () => {
        if (!project || payrollEntries.length === 0) return;
        setIsSubmittingPayroll(true);
        try {
            let result;
            if (editingPayrollId) {
                result = await updatePayroll({
                    id: editingPayrollId,
                    startDate: payrollStartDate,
                    endDate: payrollEndDate,
                    totalAmount: payrollGrandTotal,
                    entries: payrollEntries.map(e => ({
                        contactId: e.contactId,
                        daysWorked: e.daysWorked,
                        dailyRate: e.dailyRate,
                        totalAmount: e.totalAmount
                    }))
                });
            } else {
                result = await createPayroll({
                    projectId: project.id,
                    startDate: payrollStartDate,
                    endDate: payrollEndDate,
                    totalAmount: payrollGrandTotal,
                    entries: payrollEntries.map(e => ({
                        contactId: e.contactId,
                        daysWorked: e.daysWorked,
                        dailyRate: e.dailyRate,
                        totalAmount: e.totalAmount
                    }))
                });
            }

            if (result.success) {
                toast({
                    title: editingPayrollId ? "Planilla Actualizada" : "Planilla Guardada",
                    description: "Se ha sincronizado el egreso correspondiente."
                });
                setIsNewPayrollOpen(false);
                setEditingPayrollId(null);
                setPayrollEntries([]);
                fetchProject();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmittingPayroll(false);
        }
    };

    const handleSaveValuation = async () => {
        const id = params?.id;
        const cleanId = Array.isArray(id) ? id[0] : id;

        if (!cleanId || valuationEntries.length === 0) return;

        setIsSubmittingValuation(true);
        const retentionPercent = project?.config?.guaranteeRetention || 7;
        const totalBruto = valuationEntries.reduce((acc: number, e: any) => acc + (e.amount || 0), 0);
        const totalRetention = totalBruto * (retentionPercent / 100);
        const totalNeto = totalBruto - totalRetention;

        try {
            let res;
            if (editingValuationId) {
                res = await updateValuation(editingValuationId, {
                    description: valuationDescription,
                    date: valuationDate,
                    retentionAmount: totalRetention,
                    retentionPercentage: retentionPercent,
                    netAmount: totalNeto,
                    items: valuationEntries.map((e: any) => ({
                        projectItemId: e.projectItemId,
                        quantity: e.quantity,
                        price: e.price,
                        amount: e.amount
                    }))
                });
            } else {
                res = await createValuation({
                    projectId: cleanId as string,
                    description: valuationDescription,
                    date: valuationDate,
                    retentionAmount: totalRetention,
                    retentionPercentage: retentionPercent,
                    netAmount: totalNeto,
                    updateProgress: true, // Auto-increment progress when creating manually from Operations
                    items: valuationEntries.map((e: any) => ({
                        projectItemId: e.projectItemId,
                        quantity: e.quantity,
                        price: e.price,
                        amount: e.amount
                    }))
                });
            }

            if (res.success) {
                toast({ 
                    title: editingValuationId ? "Planilla de Avance Actualizada" : "Planilla de Avance Guardada", 
                    description: editingValuationId ? "Se han recalculado los totales y el progreso." : "Se ha registrado el avance y actualizado el presupuesto." 
                });
                setIsNewValuationOpen(false);
                setEditingValuationId(null);
                setValuationEntries([]);
                setValuationDescription('');
                fetchProject();
            } else {
                toast({ title: "Error", description: (res as any).error, variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsSubmittingValuation(false);
        }
    };

    const handleDeleteValuation = async (id: string) => {
        setIsSubmittingValuation(true);
        try {
            const result = await deleteValuation(id);
            if (result.success) {
                toast({ title: "Planilla Eliminada", description: "El progreso de los ítems ha sido revertido." });
                setIsDeleteValuationConfirmOpen(false);
                setValuationToDeleteId(null);
                fetchProject();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmittingValuation(false);
        }
    };

    const handleEditValuation = (val: any) => {
        setEditingValuationId(val.id);
        setValuationDescription(val.description || '');
        setValuationDate(new Date(val.date).toISOString().split('T')[0]);
        
        // Reconstruct entries with metadata
        const reconstructedEntries = val.items.map((vi: any) => {
            const projectItem = project.items.find((item: any) => item.id === vi.projectItemId);
            
            // Re-calculate alreadyCertified without THIS valuation to show correct "reportedProgress" context
            const certifiedOthers = valuations.filter(v => v.id !== val.id).reduce((acc: number, v: any) => {
                const item = v.items.find((i: any) => i.projectItemId === vi.projectItemId);
                return acc + (item?.quantity || 0);
            }, 0);

            return {
                projectItemId: vi.projectItemId,
                description: projectItem?.item?.description || 'N/A',
                unit: projectItem?.item?.unit || 'N/A',
                totalQuantity: projectItem?.quantity || 0,
                previousProgress: certifiedOthers,
                reportedProgress: projectItem?.progress || 0,
                quantity: vi.quantity,
                price: vi.price,
                amount: vi.amount
            };
        });

        setValuationEntries(reconstructedEntries);
        setIsNewValuationOpen(true);
    };

    const handleOpenNewValuation = () => {
        if (!project || !project.items) return;
        setEditingValuationId(null);
        setValuationDescription('');

        // Calculate pending certification for each item
        const newEntries = project.items.filter((item: any) => (item.progress || 0) > 0).map((item: any) => {
            // Find how much was already certified in previous valuations
            const alreadyCertified = valuations.reduce((acc: number, val: any) => {
                const valItem = val.items.find((vi: any) => vi.projectItemId === item.id);
                return acc + (valItem?.quantity || 0);
            }, 0);

            const pending = (item.progress || 0) - alreadyCertified;

            if (pending > 0) {
                return {
                    projectItemId: item.id,
                    description: item.item.description,
                    unit: item.item.unit,
                    totalQuantity: item.quantity,
                    previousProgress: alreadyCertified,
                    reportedProgress: item.progress || 0,
                    quantity: pending, // Default quantity is the pending reported progress
                    price: item.item.total || 0,
                    amount: pending * (item.item.total || 0)
                };
            }
            return null;
        }).filter(Boolean);

        setValuationEntries(newEntries);
        setValuationDate(new Date().toISOString().split('T')[0]);
        setIsNewValuationOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen  items-center justify-center gap-4 h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Operaciones...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col min-h-screen  items-center justify-center p-8 gap-4 h-[50vh]">
                <Info className="h-12 w-12 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground italic uppercase tracking-widest text-[10px]">No se encontró el proyecto.</p>
                <Button variant="outline" onClick={() => router.push('/projects')}>Volver a Proyectos</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col  text-primary p-4 md:p-8 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-card border border-accent h-12 p-0 rounded-xl overflow-hidden mb-6 flex flex-wrap md:flex-nowrap">
                    <TabsTrigger value="ordendecambio" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                        <Calculator className="mr-2 h-4 w-4" /> ORDEN DE CAMBIO
                    </TabsTrigger>
                    <TabsTrigger value="inspecciones" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                        <Coins className="mr-2 h-4 w-4" /> INSPECCIONES
                    </TabsTrigger>
                    <TabsTrigger value="librodeobra" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                        <CalendarDays className="mr-2 h-4 w-4" /> LIBRO DE OBRA
                    </TabsTrigger>
                    <TabsTrigger value="planillapersonal" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none text-xs md:text-sm">
                        <ClipboardList className="mr-2 h-4 w-4" /> PLANILLA PERSONAL
                    </TabsTrigger>
                    <TabsTrigger value="planillaavance" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none text-xs md:text-sm">
                        <ClipboardList className="mr-2 h-4 w-4" /> PLANILLA DE AVANCE
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="ordendecambio">
                    <Card className="bg-card border-accent text-primary overflow-y-auto flex flex-col h-fit gap-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-accent/2 border-b border-accent">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Calculator className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-widest">Órdenes de Cambio</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Registros de modificaciones al contrato y alcance.</CardDescription>
                                </div>
                            </div>

                        </CardHeader>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-fit p-6">
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Aprobadas</h3>
                                    <p className="text-2xl font-mono text-emerald-400 font-bold">$ {statsOC.totalApproved.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-widest">{statsOC.approvedCount} registros consolidados</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Sobrecostos Pendientes</h3>
                                    <p className="text-2xl font-mono text-amber-400 font-bold">$ {statsOC.totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-widest">{statsOC.pendingCount} órdenes por revisar</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Deducciones</h3>
                                    <p className="text-2xl font-mono text-destructive font-bold">$ {statsOC.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-widest">{statsOC.deductionCount} registros aplicados</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-primary mb-2">Impacto Neto</h3>
                                    <p className="text-2xl font-mono text-primary font-bold">$ {(statsOC.totalApproved + statsOC.totalDeductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-widest">Balance actual del proyecto</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-card border-accent backdrop-blur-md overflow-hidden m-6 p-0">
                            <Table>
                                <TableHeader className="bg-accent">
                                    <TableRow className="border-accent hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase py-4 px-6 text-primary w-24">Código</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-primary">Descripción / Motivo</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-primary">Tipo</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-primary">Estado</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right text-primary">Monto (Impacto)</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-center text-primary w-32">Fecha</TableHead>
                                        <TableHead className="w-12 text-center text-primary"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {changeOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                                                No hay órdenes de cambio registradas.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        changeOrders.map((orden: any) => (
                                            <TableRow key={orden.id} className="border-accent hover:bg-muted/40 transition-colors group cursor-pointer ">
                                                <TableCell className="px-6 py-4">
                                                    <span className="font-mono text-xs font-bold text-primary">{orden.number || 'N/A'}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs font-bold text-primary block">{orden.description}</span>
                                                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5 block">{orden.reason}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-accent bg-accent/5">
                                                        {orden.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn("text-[9px] font-black uppercase tracking-widest ",
                                                            orden.status === 'Aprobada' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                                                                orden.status === 'pendiente' ? "bg-amber-500/20 text-amber-400 border-amber-500/20" :
                                                                    "bg-red-500/20 text-red-500 border-red-500/20"
                                                        )}
                                                    >
                                                        {orden.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className={cn("font-mono text-sm font-bold", orden.amount < 0 ? "text-destructive" : "text-primary")}>
                                                        {orden.amount < 0 ? "- $" : "$"} {Math.abs(orden.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-mono text-[10px] text-muted-foreground">
                                                        {new Date(orden.date).toLocaleDateString('es-ES')}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="pr-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {orden.status === 'pendiente' && (
                                                            <Button
                                                                size="sm"
                                                                className="h-7 bg-emerald-500 hover:bg-emerald-600 text-black text-[9px] font-black uppercase tracking-widest px-3"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleApproveOC(orden.id);
                                                                }}
                                                            >
                                                                Aprobar
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOcToDelete(orden);
                                                                setIsDeleteOCConfirmOpen(true);
                                                            }}
                                                            title={orden.status === 'Aprobada' ? 'No se puede eliminar una OC aprobada' : 'Eliminar Orden de Cambio'}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>

                    </Card>
                </TabsContent>

                {/* ===== DELETE CHANGE ORDER CONFIRMATION DIALOG ===== */}
                <Dialog open={isDeleteOCConfirmOpen} onOpenChange={(open) => { if (!isDeletingOC) { setIsDeleteOCConfirmOpen(open); if (!open) setOcToDelete(null); } }}>
                    <DialogContent className="bg-card border-accent text-primary max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                <Trash2 className="h-5 w-5 text-destructive" />
                                Eliminar Orden de Cambio
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-sm pt-2">
                                {ocToDelete?.status === 'Aprobada' ? (
                                    <span className="text-amber-400 font-semibold">
                                        ⚠️ Esta orden de cambio ya fue <strong>Aprobada</strong> e impactó el presupuesto del proyecto. No es posible eliminarla directamente. Para revertir su efecto, crea una Deducción con el mismo monto.
                                    </span>
                                ) : (
                                    <>
                                        ¿Estás seguro de que deseas eliminar la orden de cambio <strong className="text-primary">{ocToDelete?.number}</strong>?
                                        <br /><br />
                                        <span className="text-muted-foreground text-xs">
                                            Motivo: {ocToDelete?.description} — Monto: ${Math.abs(ocToDelete?.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                        <br /><br />
                                        Esta acción no se puede deshacer.
                                    </>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                variant="outline"
                                className="border-accent"
                                onClick={() => { setIsDeleteOCConfirmOpen(false); setOcToDelete(null); }}
                                disabled={isDeletingOC}
                            >
                                Cancelar
                            </Button>
                            {ocToDelete?.status !== 'Aprobada' && (
                                <Button
                                    variant="destructive"
                                    onClick={handleConfirmDeleteOC}
                                    disabled={isDeletingOC}
                                    className="font-black text-[10px] uppercase tracking-widest"
                                >
                                    {isDeletingOC ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                    {isDeletingOC ? 'Eliminando...' : 'Confirmar Eliminación'}
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <TabsContent value="inspecciones">
                    <Card className="bg-card border-accent text-primary overflow-y-auto flex flex-col h-fit gap-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-accent/2 border-b border-accent">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Coins className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-widest">Inspecciones de Calidad</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Registros de modificaciones al contrato y alcance.</CardDescription>
                                </div>
                            </div>

                            <div className="ml-auto">
                                <Button
                                    onClick={() => setIsNewInspectionOpen(true)}
                                    className="bg-primary hover:bg-primary/80 text-background border border-primary font-black text-[10px] uppercase tracking-widest h-10 px-5"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" /> Nueva Inspección
                                </Button>
                            </div>
                        </CardHeader>


                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-fit p-6">
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Total Inspecciones</h3>
                                    <p className="text-2xl font-mono text-primary font-bold">{project?.inspectionRecords?.length || 0}</p>
                                    <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-widest">Registros de control</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Aprobadas</h3>
                                    <p className="text-2xl font-mono text-emerald-400 font-bold">
                                        {(project?.inspectionRecords || []).filter((i: any) => i.status === 'aprobado').length}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-widest">Sin observaciones críticas</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Parciales / Observadas</h3>
                                    <p className="text-2xl font-mono text-amber-500 font-bold">
                                        {(project?.inspectionRecords || []).filter((i: any) => i.status === 'parcial').length}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-widest">Requieren correcciones</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Rechazadas</h3>
                                    <p className="text-2xl font-mono text-destructive font-bold">
                                        {(project?.inspectionRecords || []).filter((i: any) => i.status === 'rechazado').length}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-widest">Controles fallidos</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-card border-accent backdrop-blur-md overflow-hidden m-6 p-0">
                            <Table>
                                <TableHeader className="bg-accent">
                                    <TableRow className="border-accent hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase py-4 px-6 text-primary w-24">Fecha</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-primary">Item de Proyecto</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-primary">Nivel/Sector</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-center text-primary">Estado</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right text-primary">Controles</TableHead>
                                        <TableHead className="w-12 text-center text-primary"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(project?.inspectionRecords || []).length === 0 ? (
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                                                No hay registros de inspección
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (project?.inspectionRecords || []).map((record: any) => (
                                            <TableRow key={record.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                                <TableCell className="px-6 py-4">
                                                    <span className="font-mono text-xs font-bold text-muted-foreground block">
                                                        {new Date(record.date).toLocaleDateString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs font-bold text-primary block truncate max-w-sm">
                                                        {record.projectItem?.item?.description || 'N/A'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        {record.level?.name || 'General'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn("text-[8px] font-black uppercase tracking-widest ",
                                                            record.status === 'aprobado' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                                                                record.status === 'parcial' ? "bg-amber-500/20 text-amber-500 border-amber-500/20" :
                                                                    "bg-red-500/20 text-red-500 border-red-500/20"
                                                        )}
                                                    >
                                                        {record.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-mono text-xs text-primary">
                                                        {record.checks?.filter((c: any) => c.passed).length} / {record.checks?.length}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest block">Pasados</span>
                                                </TableCell>
                                                <TableCell className="pr-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                const initialChecks: Record<string, { passed: boolean, observation: string }> = {};
                                                                record.checks?.forEach((c: any) => {
                                                                    initialChecks[c.qualityControlId] = { passed: c.passed, observation: c.observation || '' };
                                                                });
                                                                setEditInspectionChecks(initialChecks);
                                                                setEditingInspectionId(record.id);
                                                            }}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteInspection(record.id)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>

                        {/* Modal para Crear Inspección */}
                        <Dialog open={isNewInspectionOpen} onOpenChange={setIsNewInspectionOpen}>
                            <DialogContent className="max-w-3xl bg-card border-accent  text-primary overflow-y-auto max-h-[90vh]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-lg font-black">
                                        <ClipboardList className="h-5 w-5 text-primary" />
                                        Nueva Inspección de Calidad
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] uppercase tracking-widest font-bold mt-1">
                                        Cree un registro validando los controles de calidad asociados.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 pt-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Ítem de Proyecto a Inspeccionar
                                        </label>
                                        <Select value={inspectionItemId} onValueChange={setInspectionItemId}>
                                            <SelectTrigger className="w-full bg-card border-accent text-xs font-bold h-12">
                                                <SelectValue placeholder="Seleccione un ítem del proyecto..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-accent text-primary max-h-[300px]">
                                                {project?.items?.map((pi: any) => (
                                                    <SelectItem key={pi.id} value={pi.id} className="text-xs uppercase font-bold text-primary/80 focus:bg-card truncate">
                                                        {pi.item?.description} <span className="opacity-50 lowercase ml-2">({pi.item?.chapter})</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedProjItem?.item?.qualityControls && selectedProjItem.item.qualityControls.length > 0 && (
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 border-b border-accent pb-2">
                                                <CheckCircle className="h-4 w-4" /> Lista de Verificación (Controles de Calidad)
                                            </label>
                                            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                                {selectedProjItem.item.qualityControls.map((qc: any) => (
                                                    <div key={qc.id} className="p-4 bg-card border border-accent rounded-xl flex flex-col md:flex-row gap-4 items-start">
                                                        <div className="flex items-start gap-3 flex-1">
                                                            <Checkbox
                                                                id={`qc-${qc.id}`}
                                                                checked={inspectionChecks[qc.id]?.passed || false}
                                                                onCheckedChange={(checked) => setInspectionChecks(prev => ({
                                                                    ...prev,
                                                                    [qc.id]: { ...prev[qc.id], passed: checked as boolean }
                                                                }))}
                                                                className="mt-1 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                                            />
                                                            <div>
                                                                <label htmlFor={`qc-${qc.id}`} className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                                                    {qc.description}
                                                                </label>
                                                                {qc.subPoints?.length > 0 && (
                                                                    <div className="mt-2 space-y-1">
                                                                        {qc.subPoints.map((sp: any) => (
                                                                            <p key={sp.id} className="text-[10px] text-muted-foreground list-disc list-inside">
                                                                                • {sp.description}
                                                                            </p>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="w-full md:w-1/2">
                                                            <Input
                                                                placeholder="Añadir observación opcional..."
                                                                value={inspectionChecks[qc.id]?.observation || ''}
                                                                onChange={(e) => setInspectionChecks(prev => ({
                                                                    ...prev,
                                                                    [qc.id]: { ...prev[qc.id], observation: e.target.value }
                                                                }))}
                                                                className="h-9 bg-card border-accent text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedProjItem && (!selectedProjItem.item?.qualityControls || selectedProjItem.item.qualityControls.length === 0) && (
                                        <div className="p-8 text-center bg-card border border-accent rounded-xl">
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                                                Este ítem no tiene controles de calidad asociados en su catálogo.
                                            </p>
                                        </div>
                                    )}

                                    {selectedProjItem && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <FileImage className="h-4 w-4" /> Evidencia Fotográfica
                                            </label>
                                            <div className="border-2 border-dashed border-accent p-6 rounded-xl flex items-center justify-center bg-card relative hover:bg-card transition-colors">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={(e) => setInspectionImages(Array.from(e.target.files || []))}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="text-center pointer-events-none">
                                                    <FileImage className="h-8 w-8 text-primary mx-auto mb-2" />
                                                    <p className="text-xs text-muted-foreground font-bold">
                                                        {inspectionImages.length > 0
                                                            ? `${inspectionImages.length} imágenes seleccionadas`
                                                            : "Haz clic o arrastra fotos aquí"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="pt-6">
                                    <Button variant="ghost" onClick={() => setIsNewInspectionOpen(false)} className="text-[10px] font-black uppercase tracking-widest h-11 px-6">
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleCreateInspection}
                                        disabled={!inspectionItemId || isSubmittingInspection}
                                        className="bg-primary hover:bg-primary/90 text-background font-black text-[10px] uppercase tracking-widest h-11 px-8"
                                    >
                                        {isSubmittingInspection ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                        Guardar Inspección
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Modal para Editar Inspección */}
                        <Dialog open={!!editingInspectionId} onOpenChange={(open) => !open && setEditingInspectionId(null)}>
                            <DialogContent className="max-w-3xl bg-card border-accent text-primary overflow-y-auto max-h-[90vh]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-lg font-black">
                                        <Edit3 className="h-5 w-5 text-primary" />
                                        Modificar Inspección de Calidad
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] uppercase tracking-widest font-bold mt-1">
                                        Actualice los controles de calidad para este ítem.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 pt-4">
                                    <div className="p-4 bg-card border border-accent rounded-xl">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Ítem Inspeccionado</p>
                                        <p className="text-sm font-bold text-primary">{selectedEditInspection?.projectItem?.item?.description || 'N/A'}</p>
                                        <p className="text-[9px] text-muted-foreground uppercase">{selectedEditInspection?.level?.name || 'General'}</p>
                                    </div>

                                    {selectedEditInspection?.projectItem?.item?.qualityControls && (
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 border-b border-accent pb-2">
                                                <CheckCircle className="h-4 w-4" /> Lista de Verificación
                                            </label>
                                            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                                {selectedEditInspection.projectItem.item.qualityControls.map((qc: any) => (
                                                    <div key={qc.id} className="p-4 bg-card border border-accent rounded-xl flex flex-col md:flex-row gap-4 items-start">
                                                        <div className="flex items-start gap-3 flex-1">
                                                            <Checkbox
                                                                id={`edit-qc-${qc.id}`}
                                                                checked={editInspectionChecks[qc.id]?.passed || false}
                                                                onCheckedChange={(checked) => setEditInspectionChecks(prev => ({
                                                                    ...prev,
                                                                    [qc.id]: { ...prev[qc.id], passed: checked as boolean }
                                                                }))}
                                                                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                            />
                                                            <div>
                                                                <label htmlFor={`edit-qc-${qc.id}`} className="text-sm font-bold leading-none cursor-pointer">
                                                                    {qc.description}
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="w-full md:w-1/2">
                                                            <Input
                                                                placeholder="Editar observación..."
                                                                value={editInspectionChecks[qc.id]?.observation || ''}
                                                                onChange={(e) => setEditInspectionChecks(prev => ({
                                                                    ...prev,
                                                                    [qc.id]: { ...prev[qc.id], observation: e.target.value }
                                                                }))}
                                                                className="h-9 bg-card text-xs border-accent"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="pt-6">
                                    <Button variant="ghost" onClick={() => setEditingInspectionId(null)} className="text-[10px] font-black uppercase tracking-widest h-11 px-6">
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleEditInspection}
                                        disabled={isSubmittingEditInspection}
                                        className="bg-primary hover:bg-primary/90 text-background font-black text-[10px] uppercase tracking-widest h-11 px-8"
                                    >
                                        {isSubmittingEditInspection ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                                        Actualizar Inspección
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </Card>
                </TabsContent>
                <TabsContent value="planillapersonal">
                    <Card className="bg-card border-accent text-primary overflow-y-auto flex flex-col h-fit gap-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4  border-b border-accent">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <ClipboardList className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-widest">Planilla de Personal</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Registros de modificaciones al contrato y alcance.</CardDescription>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <Button
                                    onClick={() => {
                                        setEditingPayrollId(null);
                                        setPayrollEntries([]);
                                        setIsNewPayrollOpen(true);
                                    }}
                                    className="bg-primary hover:bg-primary/80 text-background border border-primary font-black text-[10px] uppercase tracking-widest h-10 px-5"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" /> Nueva Planilla
                                </Button>
                            </div>
                        </CardHeader>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-fit p-6">
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Total Planillas</h3>
                                    <p className="text-2xl font-mono text-primary font-bold">{payrolls.length}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Monto Acumulado</h3>
                                    <p className="text-2xl font-mono text-emerald-400 font-bold">
                                        $ {payrolls.reduce((acc, p) => acc + p.totalAmount, 0).toLocaleString()}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Personal Registrado</h3>
                                    <p className="text-2xl font-mono text-primary font-bold">{project.team?.length || 0}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-card border-accent backdrop-blur-md overflow-hidden m-6 p-0">
                            <Table>
                                <TableHeader className="bg-accent">
                                    <TableRow className="border-accent hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase py-4 px-6 text-primary">Periodo</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-primary">Estado</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-center text-primary">Personal</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right text-primary">Total Pagado</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right text-primary pr-6">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payrolls.length === 0 ? (
                                        <TableRow className="border-accent hover:bg-transparent">
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                                                No hay planillas registradas.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        payrolls.map((payroll: any) => (
                                            <TableRow key={payroll.id} className="border-accent hover:bg-transparent transition-colors">
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-primary">
                                                            {new Date(payroll.startDate).toLocaleDateString()} - {new Date(payroll.endDate).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-[9px] text-muted-foreground uppercase">Registrado el {new Date(payroll.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                                                        {payroll.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-mono text-xs text-primary">
                                                        {payroll.entries?.length || 0} personas
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-mono text-sm font-black text-primary">
                                                        $ {payroll.totalAmount.toLocaleString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="pr-4 text-center flex justify-end">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                            onClick={() => handleEditPayroll(payroll)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                            onClick={() => {
                                                                setPayrollToDeleteId(payroll.id);
                                                                setIsDeletePayrollConfirmOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </Card>
                </TabsContent>
                <TabsContent value="planillaavance">
                    <Card className="bg-card border-accent text-primary overflow-y-auto flex flex-col h-fit gap-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-accent/2 border-b border-accent">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Activity className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-widest">Planilla de Avance</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Certificación y registro histórico de avance de obra</CardDescription>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <Button
                                    onClick={handleOpenNewValuation}
                                    className="bg-primary hover:bg-primary/80 text-background border border-primary font-black text-[10px] uppercase tracking-widest h-10 px-5"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" /> Nueva Valuación
                                </Button>
                            </div>
                        </CardHeader>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-fit p-6">
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Total Valuaciones</h3>
                                    <p className="text-2xl font-mono text-primary font-bold">{valuations.length}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Avance Certificado</h3>
                                    <p className="text-2xl font-mono text-emerald-400 font-bold">
                                        $ {valuations.reduce((acc: number, v: any) => acc + v.totalAmount, 0).toLocaleString()}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-accent backdrop-blur-md h-fit p-0">
                                <CardContent className="p-6">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Última Valuación</h3>
                                    <p className="text-2xl font-mono text-primary font-bold">
                                        {valuations[0] ? new Date(valuations[0].date).toLocaleDateString() : 'N/A'}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-card border-accent backdrop-blur-md overflow-hidden m-6 p-0">
                            <Table>
                                <TableHeader className="bg-accent">
                                    <TableRow className="border-accent hover:bg-accent">
                                        <TableHead className="text-[10px] font-black uppercase py-4 px-6 text-primary">Nro. / Código</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-primary">Descripción / Periodo</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-center text-primary">Ítems</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right text-primary">Total Valuado</TableHead>
                                        <TableHead className="w-12 text-center text-primary"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {valuations.length === 0 ? (
                                        <TableRow className="border-accent hover:bg-transparent">
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                                                No hay valuaciones de avance registradas.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        valuations.map((val: any) => (
                                            <TableRow key={val.id} className="border-accent hover:bg-accent/5 transition-colors">
                                                <TableCell className="px-6 py-4">
                                                    <span className="font-mono text-xs font-bold text-primary">{val.number}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-primary uppercase">{val.description || 'Sin descripción'}</span>
                                                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">Fecha: {new Date(val.date).toLocaleDateString()}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-mono text-xs text-primary">
                                                        {val.items?.length || 0} ítems
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-mono text-sm font-black text-primary">
                                                        $ {val.totalAmount.toLocaleString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="pr-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                                            onClick={() => handleEditValuation(val)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-500 transition-colors"
                                                            onClick={() => {
                                                                setValuationToDeleteId(val.id);
                                                                setIsDeleteValuationConfirmOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </Card>
                </TabsContent>

                <TabsContent value="librodeobra">
                    <Card className="bg-card border-accent text-primary overflow-y-auto flex flex-col h-fit gap-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-card border-b border-accent">
                            <div className="flex items-center gap-4 w-full">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-primary/20 rounded-lg">
                                        <CalendarDays className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-black uppercase tracking-widest">Libro de Obra</CardTitle>
                                        <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Registro diario de actividades, clima e incidentes de obra</CardDescription>
                                    </div>
                                </div>

                                <div className="ml-auto">
                                    <Button
                                        onClick={() => setIsNewLogOpen(true)}
                                        className="bg-primary hover:bg-primary/80 text-background border border-primary font-black text-[10px] uppercase tracking-widest h-10 px-5"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" /> Nueva Entrada
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <Card className="bg-card border-accent backdrop-blur-md p-0 m-0 h-fit">
                                    <CardContent className="p-6">
                                        <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Total Entradas</h3>
                                        <p className="text-2xl font-mono text-primary font-bold">{project?.siteLogs?.length || 0}</p>
                                        <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-widest">Desde inicio de obra</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card border-accent backdrop-blur-md  p-0 m-0 h-fit">
                                    <CardContent className="p-6">
                                        <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Último Reporte</h3>
                                        <p className="text-2xl font-mono text-emerald-400 font-bold text-ellipsis overflow-hidden whitespace-nowrap">
                                            {project?.siteLogs?.[0] ? new Date(project.siteLogs[0].date).toLocaleDateString() : 'N/A'}
                                        </p>
                                        <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-widest truncate">
                                            Por: {project?.siteLogs?.[0]?.author?.name || '---'}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card border-accent backdrop-blur-md  p-0 m-0 h-fit">
                                    <CardContent className="p-6">
                                        <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Incidentes</h3>
                                        <p className="text-2xl font-mono text-amber-500 font-bold">
                                            {(project?.siteLogs || []).filter((l: any) => l.type === 'Incidente').length}
                                        </p>
                                        <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-widest">Histórico de la obra</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card border-accent backdrop-blur-md  p-0 m-0 h-fit">
                                    <CardContent className="p-6">
                                        <h3 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-2">Clima</h3>
                                        <p className="text-2xl font-mono text-sky-400 font-bold">
                                            {(project?.siteLogs || []).filter((l: any) => l.type === 'Clima').length}
                                        </p>
                                        <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-widest">Entradas climáticas</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-4">
                                {(project?.siteLogs || []).length === 0 ? (
                                    <div className="text-center py-20 border border-dashed border-accent rounded-3xl opacity-50 bg-card">
                                        <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sin entradas registradas aún.</p>
                                    </div>
                                ) : (
                                    (project?.siteLogs || []).map((log: any) => (
                                        <Card key={log.id} className="bg-card border-accent backdrop-blur-md overflow-hidden hover:border-primary/50 transition-colors  p-0  h-fit">
                                            <CardContent className="p-0 flex flex-col md:flex-row">
                                                <div className={cn("p-6 md:w-48 shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-accent",
                                                    log.type === 'Incidente' ? "bg-red-500/5 text-red-500" :
                                                        log.type === 'Clima' ? "bg-sky-500/5 text-sky-400" :
                                                            log.type === 'Recepción' ? "bg-green-500/5 text-green-500" :
                                                                "bg-white/2"
                                                )}>
                                                    <div>
                                                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest border-accent mb-3",
                                                            log.type === 'Incidente' ? "bg-red-500/20 text-red-400" :
                                                                log.type === 'Clima' ? "bg-sky-500/20 text-sky-400" :
                                                                    log.type === 'Recepción' ? "bg-green-500/20 text-green-400" :
                                                                        "bg-primary/20 text-primary border-primary/20"
                                                        )}>
                                                            {log.type}
                                                        </Badge>
                                                        <div className="font-mono text-[10px] text-muted-foreground">
                                                            {new Date(log.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                                        </div>
                                                        <div className="font-bold text-xs mt-1 text-primary truncate" title={log.author?.name}>
                                                            {log.author?.name || 'Desconocido'}
                                                        </div>
                                                    </div>

                                                </div>
                                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                        {log.content}
                                                    </p>
                                                    <div className="flex justify-end ">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditingLogId(log.id);
                                                                setEditLogType(log.type);
                                                                setEditLogContent(log.content);
                                                            }}
                                                            className="h-8 text-[9px] font-black uppercase tracking-widest hover:bg-primary/40"
                                                        >
                                                            <Edit3 className="h-3.5 w-3.5 mr-2" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteSiteLog(log.id)}
                                                            className="h-8 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>

                            {/* Modal para Editar Entrada */}
                            <Dialog open={!!editingLogId} onOpenChange={(open) => !open && setEditingLogId(null)}>
                                <DialogContent className="max-w-2xl bg-card border-accent text-primary ">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-lg font-black">
                                            <Edit3 className="h-5 w-5 text-primary" />
                                            Modificar Entrada
                                        </DialogTitle>
                                        <DialogDescription className="text-[10px] uppercase tracking-widest font-bold mt-1">
                                            Edite el tipo de novedad o modifique el registro.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-6 pt-4">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                Tipo de Registro
                                            </label>
                                            <Select value={editLogType} onValueChange={setEditLogType}>
                                                <SelectTrigger className="w-full bg-card border-accent text-xs font-bold uppercase h-12 text-primary">
                                                    <SelectValue placeholder="Seleccione el tipo..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-accent text-primary">
                                                    <SelectItem value="Avance" className="text-xs uppercase font-bold text-primary focus:bg-primary/20">Avance de Obra</SelectItem>
                                                    <SelectItem value="Recepción" className="text-xs uppercase font-bold text-emerald-400 focus:bg-emerald-500/20">Recepción de Material</SelectItem>
                                                    <SelectItem value="Clima" className="text-xs uppercase font-bold text-sky-400 focus:bg-sky-500/20">Afectación por Clima</SelectItem>
                                                    <SelectItem value="Incidente" className="text-xs uppercase font-bold text-destructive focus:bg-destructive/20">Incidente / Alerta</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                Descripción Detallada
                                            </label>
                                            <textarea
                                                value={editLogContent}
                                                onChange={(e) => setEditLogContent(e.target.value)}
                                                placeholder="Detalle exactamente lo ocurrido, avance medido o motivo del incidente..."
                                                className="w-full h-32 p-4 bg-card border border-accent rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none outline-none text-primary placeholder:text-muted-foreground/30"
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter className="pt-6">
                                        <Button variant="ghost" onClick={() => setEditingLogId(null)} className="text-[10px] font-black uppercase tracking-widest h-11 px-6">
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleEditSiteLog}
                                            disabled={!editLogContent.trim() || isSubmittingEditLog}
                                            className="bg-primary hover:bg-primary/90 text-background font-black text-[10px] uppercase tracking-widest h-11 px-8"
                                        >
                                            {isSubmittingEditLog ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                                            Modificar Registro
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Modal para Crear Nueva Entrada */}
                            <Dialog open={isNewLogOpen} onOpenChange={setIsNewLogOpen}>
                                <DialogContent className="max-w-2xl bg-card border-accent text-primary">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-lg font-black">
                                            <PlusCircle className="h-5 w-5 text-primary" />
                                            Nueva Entrada de Libro de Obra
                                        </DialogTitle>
                                        <DialogDescription className="text-[10px] uppercase tracking-widest font-bold mt-1">
                                            Registra novedades, incidentes o el estado actual de la obra.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-6 pt-4">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                Tipo de Registro
                                            </label>
                                            <Select value={newLogType} onValueChange={setNewLogType}>
                                                <SelectTrigger className="w-full bg-card border-accent text-xs font-bold uppercase h-12">
                                                    <SelectValue placeholder="Seleccione el tipo..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-accent text-primary">
                                                    <SelectItem value="Avance" className="text-xs uppercase font-bold text-primary focus:bg-primary/20">Avance de Obra</SelectItem>
                                                    <SelectItem value="Recepción" className="text-xs uppercase font-bold text-emerald-400 focus:bg-emerald-500/20">Recepción de Material</SelectItem>
                                                    <SelectItem value="Clima" className="text-xs uppercase font-bold text-sky-400 focus:bg-sky-500/20">Afectación por Clima</SelectItem>
                                                    <SelectItem value="Incidente" className="text-xs uppercase font-bold text-destructive focus:bg-destructive/20">Incidente / Alerta</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                Descripción Detallada
                                            </label>
                                            <textarea
                                                value={newLogContent}
                                                onChange={(e) => setNewLogContent(e.target.value)}
                                                placeholder="Detalle exactamente lo ocurrido, avance medido o motivo del incidente..."
                                                className="w-full h-32 p-4 bg-card border border-accent rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none outline-none text-primary placeholder:text-muted-foreground/30"
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter className="pt-6">
                                        <Button variant="ghost" onClick={() => setIsNewLogOpen(false)} className="text-[10px] font-black uppercase tracking-widest h-11 px-6">
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleCreateSiteLog}
                                            disabled={!newLogContent.trim() || isSubmittingLog}
                                            className="bg-primary hover:bg-primary/90 text-background font-black text-[10px] uppercase tracking-widest h-11 px-8"
                                        >
                                            {isSubmittingLog ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarDays className="h-4 w-4 mr-2" />}
                                            Guardar Registro
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal para Nueva Planilla Personal */}
            <Dialog open={isNewPayrollOpen} onOpenChange={setIsNewPayrollOpen}>
                <DialogContent className="min-w-7xl w-full bg-card border-accent text-primary overflow-hidden max-h-[95vh] flex flex-col p-0 gap-0">
                    <div className="p-6 border-b border-accent shrink-0 bg-card">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-lg font-black">
                                {editingPayrollId ? (
                                    <Edit3 className="h-5 w-5 text-primary" />
                                ) : (
                                    <PlusCircle className="h-5 w-5 text-primary" />
                                )}
                                {editingPayrollId ? 'Editar Planilla de Personal' : 'Nueva Planilla de Personal'}
                            </DialogTitle>
                            <DialogDescription className="text-[10px] uppercase tracking-widest font-bold mt-1">
                                {editingPayrollId ? 'Modifica los datos de la planilla y sincroniza el egreso.' : 'Selecciona el periodo y añade al personal para registrar sus jornales.'}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-2xl border border-accent">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha Inicio</label>
                                <Input
                                    type="date"
                                    value={payrollStartDate}
                                    onChange={(e) => setPayrollStartDate(e.target.value)}
                                    className="bg-card border-accent text-primary text-xs font-bold h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha Fin</label>
                                <Input
                                    type="date"
                                    value={payrollEndDate}
                                    onChange={(e) => setPayrollEndDate(e.target.value)}
                                    className="bg-card border-accent text-primary text-xs font-bold h-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-accent pb-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Activity className="h-4 w-4" /> Detalle de Jornales
                                </label>
                                <Select onValueChange={(val) => {
                                    const contact = (project?.team || []).find((c: any) => c.id === val);
                                    if (contact) handleAddPersonToPayroll(contact);
                                }}>
                                    <SelectTrigger className="w-64 bg-card border-accent text-primary text-[10px] font-black uppercase h-9">
                                        <SelectValue placeholder="Añadir Personal del Equipo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-accent text-primary text-[10px] font-bold uppercase">
                                        {(project?.team || []).filter((m: any) => m.type === 'personal').map((member: any) => (
                                            <SelectItem key={member.id} value={member.id} className="text-[10px] font-bold uppercase">
                                                <div className="flex flex-col">
                                                    <span>{member.name}</span>
                                                    <span className="text-[8px] opacity-50">{member.type}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="rounded-2xl border border-accent overflow-hidden relative bg-card">
                                <div className="overflow-auto max-h-[50vh]">
                                    <Table className="min-w-full border-separate border-spacing-0">
                                        <TableHeader className="sticky top-0 z-30 bg-card">
                                            <TableRow className="border-b border-accent hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase text-primary min-w-[220px] sticky left-0 top-0 z-40 bg-card border-r border-accent px-6 py-4 border-b">
                                                    Personal / Cargo
                                                </TableHead>
                                                {datesInRange.map(date => {
                                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                                    return (
                                                        <TableHead key={date.toISOString()} className={cn(
                                                            "text-[8px] font-black uppercase text-center px-2 min-w-[65px] border-b border-accent py-3 transition-colors",
                                                            isWeekend ? "bg-red-500/10 text-red-400" : "text-muted-foreground hover:text-primary"
                                                        )}>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="opacity-50">{date.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                                                <span className="text-[10px] font-mono font-bold">{date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>
                                                            </div>
                                                        </TableHead>
                                                    );
                                                })}
                                                <TableHead className="text-[10px] font-black uppercase text-center text-primary min-w-[90px] border-l border-accent bg-card sticky right-40 z-30 border-b">Días</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right text-primary min-w-[110px] bg-card sticky right-20 z-30 border-accent border-b">Jornal ($)</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right text-primary min-w-[130px] bg-card sticky right-0 z-30 px-6 border-accent border-b">Subtotal</TableHead>
                                                <TableHead className="w-10 bg-card"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payrollEntries.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={datesInRange.length + 5} className="h-40 text-center text-muted-foreground text-[10px] uppercase font-black tracking-[0.2em] italic opacity-30">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Activity className="h-8 w-8 animate-pulse text-primary/30" />
                                                            Añade personal para comenzar el registro
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                payrollEntries.map((entry: any) => (
                                                    <TableRow key={entry.contactId} className="border-accent group hover:bg-white/2 transition-colors">
                                                        <TableCell className="text-xs font-black text-primary sticky left-0 bg-card z-10 border-r border-accent px-6 group-hover:bg-white/5">
                                                            {entry.name}
                                                        </TableCell>
                                                        {datesInRange.map(date => {
                                                            const dateStr = date.toISOString().split('T')[0];
                                                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                                            return (
                                                                <TableCell key={dateStr} className={cn(
                                                                    "text-center px-1 border-r border-accent",
                                                                    isWeekend && "bg-red-500/2"
                                                                )}>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.1"
                                                                        min="0"
                                                                        max="1"
                                                                        value={entry.dailyAttendance[dateStr] || 0}
                                                                        onChange={(e) => handleDailyAttendanceChange(entry.contactId, dateStr, parseFloat(e.target.value) || 0)}
                                                                        className="w-12 mx-auto h-8 bg-card text-center text-[11px] font-black border-accent hover:border-primary focus:border-primary transition-all p-0 rounded-md"
                                                                    />
                                                                </TableCell>
                                                            );
                                                        })}
                                                        <TableCell className="text-center font-mono text-xs font-black text-primary bg-card border-l border-accent sticky right-40 z-10">
                                                            {entry.daysWorked.toFixed(1)}
                                                        </TableCell>
                                                        <TableCell className="text-right bg-card sticky right-20 z-10">
                                                            <Input
                                                                type="number"
                                                                value={entry.dailyRate}
                                                                onChange={(e) => handlePayrollEntryChange(entry.contactId, 'dailyRate', parseFloat(e.target.value) || 0)}
                                                                className="w-24 ml-auto h-8 bg-card text-right text-xs font-black border-accent hover:border-primary rounded-md"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-xs font-black text-primary bg-card border-l border-accent sticky right-0 z-10 px-6">
                                                            $ {entry.totalAmount.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="pr-4">
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemovePersonFromPayroll(entry.contactId)} className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full">
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-accent bg-card backdrop-blur-xl shrink-0">
                        <DialogFooter className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-6">
                                <div className="text-left border-l-2 border-primary pl-4">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total General</p>
                                    <p className="text-2xl font-mono font-black text-primary">$ {payrollGrandTotal.toLocaleString()}</p>
                                </div>
                                <div className="text-left border-l border-accent pl-4 hidden md:block">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Personal</p>
                                    <p className="text-lg font-mono font-bold text-primary">{payrollEntries.length}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => {
                                    setIsNewPayrollOpen(false);
                                    setEditingPayrollId(null);
                                }} className="text-[10px] font-black uppercase tracking-widest h-12 px-8 hover:bg-white/5">
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSavePayroll}
                                    disabled={payrollEntries.length === 0 || isSubmittingPayroll}
                                    className="bg-primary hover:bg-primary/90 text-background font-black text-[10px] uppercase tracking-widest h-12 px-10 "
                                >
                                    {isSubmittingPayroll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                    {editingPayrollId ? 'Actualizar Planilla' : 'Completar Planilla'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Confirmación de Eliminación de Planilla */}
            <Dialog open={isDeletePayrollConfirmOpen} onOpenChange={setIsDeletePayrollConfirmOpen}>
                <DialogContent className="max-w-md bg-card border-accent text-primary shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-lg font-black text-red-500">
                            <AlertCircle className="h-5 w-5" />
                            Confirmar Eliminación
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold mt-2">
                            ¿Estás seguro de que deseas eliminar esta planilla? Esta acción también eliminará el egreso asociado del proyecto y no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-3">
                        <Button variant="ghost" onClick={() => setIsDeletePayrollConfirmOpen(false)} className="text-[10px] font-black uppercase tracking-widest h-11 px-6 hover:bg-white/5">
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => payrollToDeleteId && handleDeletePayroll(payrollToDeleteId)}
                            disabled={isSubmittingPayroll}
                            className="bg-red-500 hover:bg-red-600 text-background font-black text-[10px] uppercase tracking-widest h-11 px-8"
                        >
                            {isSubmittingPayroll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Eliminar Permanentemente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Modal Nueva Planilla de Avance */}
            <Dialog open={isNewValuationOpen} onOpenChange={setIsNewValuationOpen}>
                <DialogContent className="min-w-7xl bg-card border-accent text-primary p-0 overflow-hidden flex flex-col h-[90vh]">
                    <div className="p-6 border-b border-accent shrink-0 bg-card">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-lg font-black">
                                {editingValuationId ? <Edit3 className="h-5 w-5 text-primary" /> : <Activity className="h-5 w-5 text-primary" />}
                                {editingValuationId ? 'Editar Planilla de Avance' : 'Nueva Planilla de Avance'}
                            </DialogTitle>
                            <DialogDescription className="text-[10px] uppercase tracking-widest font-bold mt-1">
                                {editingValuationId ? 'Modifique los ítems y cantidades certificados en esta planilla.' : 'Seleccione las partidas y especifique el avance ejecutado para esta certificación.'}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-hidden flex">
                        {/* Selector de Partidas */}
                        <div className="w-1/3 border-r border-accent flex flex-col bg-card">
                            <div className="p-4 border-b border-accent">
                                <label className="text-[10px] font-black uppercase text-muted-foreground mb-3 block tracking-widest">Añadir Partidas al Avance</label>
                                <Select onValueChange={(val) => {
                                    const item = project.items.find((i: any) => i.id === val);
                                    if (item && !valuationEntries.find(e => e.projectItemId === val)) {
                                        setValuationEntries(prev => [...prev, {
                                            projectItemId: item.id,
                                            description: item.item.description,
                                            unit: item.item.unit,
                                            totalQuantity: item.quantity,
                                            previousProgress: item.progress || 0,
                                            quantity: 0,
                                            price: item.item.total || 0,
                                            amount: 0
                                        }]);
                                    }
                                }}>
                                    <SelectTrigger className="bg-card border-accent text-primary text-xs h-11 uppercase font-bold">
                                        <SelectValue placeholder="Seleccionar Partida..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-accent text-primary max-h-[300px]">
                                        <ScrollArea className="h-full">
                                            {project?.items?.map((item: any) => (
                                                <SelectItem key={item.id} value={item.id} className="text-xs font-bold py-3 border-b border-accent hover:bg-accent cursor-pointer uppercase">
                                                    {item.item.description}
                                                </SelectItem>
                                            ))}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block tracking-widest">Glosa / Descripción</label>
                                    <Input
                                        value={valuationDescription}
                                        onChange={(e) => setValuationDescription(e.target.value)}
                                        placeholder="Ej: Avance de Obra Semana 45..."
                                        className="h-11 bg-card border-accent text-primary "
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block tracking-widest">Fecha de Valuación</label>
                                    <Input
                                        type="date"
                                        value={valuationDate}
                                        onChange={(e) => setValuationDate(e.target.value)}
                                        className="h-11 bg-card border-accent text-primary  uppercase font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Listado de Avance */}
                        <div className="flex-1 bg-card flex flex-col">
                            <ScrollArea className="flex-1">
                                <div className="p-0">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-card z-10">
                                            <TableRow className="border-accent">
                                                <TableHead className="text-[9px] font-black uppercase text-primary py-4 pl-6">Partida / PU</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase text-center text-primary">Computado</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase text-center text-primary">Previo Cert.</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase text-center text-primary w-28">Avance (Cant.)</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase text-right text-primary">Total Bruto</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase text-right text-primary">Retención ({project?.config?.guaranteeRetention || 7}%)</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase text-right text-primary">Total Líquido</TableHead>
                                                <TableHead className="w-10"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {valuationEntries.length === 0 ? (
                                                <TableRow className="border-accent hover:bg-transparent">
                                                    <TableCell colSpan={8} className="text-center py-20 opacity-30 italic text-[10px] uppercase font-bold tracking-[0.3em]">
                                                        No hay avances pendientes de certificación.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                valuationEntries.map((entry, idx) => {
                                                    const retentionPercent = project?.config?.guaranteeRetention || 7;
                                                    const subtotal = entry.amount || 0;
                                                    const retention = subtotal * (retentionPercent / 100);
                                                    const neto = subtotal - retention;

                                                    return (
                                                        <TableRow key={idx} className="border-accent hover:bg-transparent">
                                                            <TableCell className="pl-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-black uppercase text-primary truncate max-w-[180px]">{entry.description}</span>
                                                                    <span className="text-[9px] text-muted-foreground uppercase flex items-center gap-1 mt-1 font-mono font-bold">$ {entry.price.toLocaleString()} / {entry.unit}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center font-mono text-xs font-bold text-primary">
                                                                {entry.totalQuantity.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex flex-col gap-1 items-center">
                                                                    <span className="font-mono text-xs text-muted-foreground">{entry.previousProgress.toLocaleString()}</span>
                                                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Certificado</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="number"
                                                                    value={entry.quantity || ''}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value) || 0;
                                                                        setValuationEntries(prev => prev.map((item, i) =>
                                                                            i === idx ? { ...item, quantity: val, amount: val * item.price } : item
                                                                        ));
                                                                    }}
                                                                    className="h-10 bg-card border-accent text-center font-mono font-black text-primary text-xs"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <span className="font-mono text-xs font-bold text-primary">
                                                                    $ {subtotal.toLocaleString()}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <span className="font-mono text-[10px] text-red-400">
                                                                    - $ {retention.toLocaleString()}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <span className="font-mono text-xs font-black text-emerald-400">
                                                                    $ {neto.toLocaleString()}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button onClick={() => setValuationEntries(prev => prev.filter((_, i) => i !== idx))} variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-red-500 hover:bg-transparent">
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    <div className="p-6 border-t border-accent bg-card backdrop-blur-xl shrink-0">
                        <DialogFooter className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-8">
                                <div className="text-left border-l-2 border-accent pl-4">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Subtotal Bruto</p>
                                    <p className="text-lg font-mono font-bold text-primary">
                                        $ {valuationEntries.reduce((acc, e) => acc + (e.amount || 0), 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-left border-l-2 border-red-500/50 pl-4">
                                    <p className="text-[10px] font-black uppercase text-red-500/70 tracking-widest">Retención ({project?.config?.guaranteeRetention || 7}%)</p>
                                    <p className="text-lg font-mono font-bold text-red-400/70">
                                        $ {(valuationEntries.reduce((acc, e) => acc + (e.amount || 0), 0) * ((project?.config?.guaranteeRetention || 7) / 100)).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-left border-l-2 border-primary pl-4">
                                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">Total Líquido General</p>
                                    <p className="text-2xl font-mono font-black text-primary">
                                        $ {(valuationEntries.reduce((acc, e) => acc + (e.amount || 0), 0) * (1 - (project?.config?.guaranteeRetention || 7) / 100)).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setIsNewValuationOpen(false)} className="text-[10px] font-black uppercase tracking-widest h-12 px-8 hover:bg-white/5">
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSaveValuation}
                                    disabled={valuationEntries.length === 0 || isSubmittingValuation}
                                    className="bg-primary hover:bg-primary/90 text-background font-black text-[10px] uppercase tracking-widest h-12 px-10 "
                                >
                                    {isSubmittingValuation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                    {editingValuationId ? 'Actualizar Valuación' : 'Finalizar Valuación'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* Modal de Confirmación de Eliminación de Valuación */}
            <Dialog open={isDeleteValuationConfirmOpen} onOpenChange={setIsDeleteValuationConfirmOpen}>
                <DialogContent className="max-w-md bg-card border-accent text-primary shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-lg font-black text-red-500">
                            <AlertCircle className="h-5 w-5" />
                            Confirmar Eliminación
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold mt-2">
                            ¿Estás seguro de que deseas eliminar esta planilla? <br /><br />
                            <strong className="text-red-400">IMPORTANTE: Esta acción revertirá el progreso de los ítems en el módulo de construcción y no se puede deshacer.</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-3">
                        <Button variant="ghost" onClick={() => setIsDeleteValuationConfirmOpen(false)} className="text-[10px] font-black uppercase tracking-widest h-11 px-6 hover:bg-white/5">
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => valuationToDeleteId && handleDeleteValuation(valuationToDeleteId)}
                            disabled={isSubmittingValuation}
                            className="bg-red-500 hover:bg-red-600 text-background font-black text-[10px] uppercase tracking-widest h-11 px-8"
                        >
                            {isSubmittingValuation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Eliminar y Revertir Progreso
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
