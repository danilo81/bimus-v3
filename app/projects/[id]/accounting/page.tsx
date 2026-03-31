
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    getProjectTransactions,
    createProjectTransaction,
    deleteProjectTransaction,
    getProjectById
} from '@/actions';
import {
    Banknote,
    ChevronLeft,
    Plus,
    ArrowDownLeft,
    ArrowUpRight,
    TrendingUp,
    History,
    Search,
    Loader2,
    DollarSign,
    MoreVertical,
    Trash2,
    Calendar,
    X,
    CheckCircle2,
    PieChart,
    Wallet
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Badge } from '../../../../components/ui/badge';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '../../../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../../components/ui/select";
import { Label } from '../../../../components/ui/label';
import { useToast } from '../../../../hooks/use-toast';
import { cn } from '../../../../lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../../components/ui/dropdown-menu';

export default function ProjectAccountingPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [project, setProject] = useState<any | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        amount: '',
        category: 'varios',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const fetchProjectData = useCallback(async () => {
        const id = params?.id;
        const cleanId = Array.isArray(id) ? id[0] : id;
        if (!cleanId || cleanId === 'undefined') return;

        setIsLoading(true);
        try {
            const [proj, txs] = await Promise.all([
                getProjectById(cleanId),
                getProjectTransactions(cleanId)
            ]);
            setProject(proj);
            setTransactions(txs);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [params?.id]);

    useEffect(() => {
        fetchProjectData();
    }, [fetchProjectData]);

    const financialSummary = useMemo(() => {
        const income = transactions
            .filter(t => t.type === 'ingreso')
            .reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions
            .filter(t => t.type === 'egreso')
            .reduce((acc, t) => acc + t.amount, 0);
        return { income, expense, balance: income - expense };
    }, [transactions]);

    const handleCreateTransaction = async (type: 'ingreso' | 'egreso') => {
        if (!project || !formData.amount || !formData.description) return;
        setIsSaving(true);
        try {
            const result = await createProjectTransaction({
                projectId: project.id,
                amount: parseFloat(formData.amount),
                type,
                category: formData.category,
                description: formData.description,
                date: formData.date
            });

            if (result.success) {
                toast({ title: "Movimiento Registrado", description: `Se ha asentado el ${type} correctamente.` });
                setIsIncomeModalOpen(false);
                setIsExpenseModalOpen(false);
                setFormData({ amount: '', category: 'varios', description: '', date: new Date().toISOString().split('T')[0] });
                fetchProjectData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTx = async (id: string) => {
        if (!confirm('¿Eliminar este registro financiero?')) return;
        try {
            const result = await deleteProjectTransaction(id);
            if (result.success) {
                toast({ title: "Registro eliminado" });
                fetchProjectData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen  items-center justify-center gap-4 h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Finanzas...</p>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="flex flex-col min-h-screen text-primary p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 bg-card">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3 font-headline uppercase tracking-tight">
                            <Banknote className="h-7 w-7 text-primary" /> Contabilidad: {project.title}
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Control financiero y flujo de caja de obra</p>
                    </div>
                </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-emerald-500/20 relative overflow-hidden ">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <CardHeader className="pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Ingresos Totales</span>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-emerald-500/50">$</span>
                            <p className="text-4xl font-black text-primary tracking-tighter">
                                {financialSummary.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <p className="text-[9px] font-black text-muted-foreground uppercase mt-2">Certificaciones y Cobros</p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-red-500/20 relative overflow-hidden ">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    <CardHeader className="pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500/70">Egresos Consolidados</span>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-red-500/50">$</span>
                            <p className="text-4xl font-black text-primary tracking-tighter">
                                {financialSummary.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <p className="text-[9px] font-black text-muted-foreground uppercase mt-2">Compras y Gastos Operativos</p>
                    </CardContent>
                </Card>

                <Card className={cn("relative overflow-hidden border-accent", financialSummary.balance >= 0 ? "bg-card" : "bg-red-900/10")}>
                    <div className={cn("absolute top-0 left-0 w-1 h-full", financialSummary.balance >= 0 ? "bg-primary" : "bg-red-500")} />
                    <CardHeader className="pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Balance Neto</span>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold opacity-30">$</span>
                            <p className={cn("text-4xl font-black tracking-tighter", financialSummary.balance >= 0 ? "text-primary" : "text-red-500")}>
                                {financialSummary.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <p className="text-[9px] font-black text-muted-foreground uppercase mt-2 flex items-center gap-2">
                            <PieChart className="h-3 w-3" /> Rentabilidad Actual
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Area */}
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-accent">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="BUSCAR MOVIMIENTO..."
                            className="pl-10 h-11 bg-card border-accent text-[10px] font-black uppercase"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            className="bg-emerald-500 hover:bg-emerald-600 text-black font-black text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl "
                            onClick={() => setIsIncomeModalOpen(true)}
                        >
                            <ArrowDownLeft className="mr-2 h-4 w-4" /> Registrar Ingreso
                        </Button>
                        <Button
                            className="bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl "
                            onClick={() => setIsExpenseModalOpen(true)}
                        >
                            <ArrowUpRight className="mr-2 h-4 w-4" /> Registrar Egreso
                        </Button>
                    </div>
                </div>

                <Card className="bg-card border-accent overflow-hidden gap-0 p-0">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-accent gap-0">
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="py-5 px-8 text-[10px] font-black uppercase tracking-widest">Fecha / Registro</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Categoría</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Descripción / Concepto</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-right pr-12">Importe (USD)</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length > 0 ? (
                                    transactions
                                        .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((t) => (
                                            <TableRow key={t.id} className="border-accent hover:bg-accent/2 transition-colors group">
                                                <TableCell className="py-6 px-8">
                                                    <span className="text-[12px] font-mono text-muted-foreground uppercase">{t.date}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[12px] font-black uppercase border-primary/10 bg-primary/5">
                                                        {t.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-primary uppercase">{t.description}</span>
                                                        <span className={cn("text-[8px] font-black uppercase tracking-widest flex items-center gap-1 mt-1",
                                                            t.type === 'ingreso' ? "text-emerald-500" : "text-red-500")}>
                                                            {t.type === 'ingreso' ? <ArrowDownLeft className="h-2 w-2" /> : <ArrowUpRight className="h-2 w-2" />}
                                                            {t.type}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-12">
                                                    <span className={cn("font-mono text-sm font-black",
                                                        t.type === 'ingreso' ? "text-emerald-500" : "text-red-500")}>
                                                        {t.type === 'ingreso' ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="pr-4">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="default" size="icon" className="h-8 w-8 hover:bg-muted/40 text-muted-foreground bg-transparent">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-card border-accent text-primary ">
                                                            <DropdownMenuItem onClick={() => handleDeleteTx(t.id)} className="text-[10px] font-black uppercase text-red-500 focus:bg-red-500/10 focus:text-destructive">
                                                                <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" /> Eliminar Registro
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-32 text-muted-foreground opacity-20 uppercase text-[10px] font-black">
                                            No se registran transacciones en el libro de este proyecto.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction Modals */}
            <Dialog
                open={isIncomeModalOpen || isExpenseModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsIncomeModalOpen(false);
                        setIsExpenseModalOpen(false);
                    }
                }}
            >
                <DialogContent className="max-w-md bg-card border-accent text-primary p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-6  border-b border-accent">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", isIncomeModalOpen ? "bg-emerald-500/20" : "bg-red-500/20")}>
                                {isIncomeModalOpen ? <ArrowDownLeft className="h-6 w-6 text-emerald-500" /> : <ArrowUpRight className="h-6 w-6 text-red-500" />}
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                                    {isIncomeModalOpen ? 'Registrar Ingreso' : 'Registrar Egreso'}
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground mt-1">
                                    Asentar movimiento de caja en el proyecto
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Monto (USD)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                    className="h-11 bg-card border-accent font-mono text-lg font-black text-primary"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Fecha</Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="h-11 bg-card border-accent text-xs font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Categoría</Label>
                            <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                                <SelectTrigger className="h-11 bg-card border-accent uppercase text-[10px] font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card text-primary border-accent">
                                    {isIncomeModalOpen ? (
                                        <>
                                            <SelectItem value="certificacion" className="text-[10px] font-bold uppercase">Certificación de Obra</SelectItem>
                                            <SelectItem value="adelanto" className="text-[10px] font-bold uppercase">Adelanto de Cliente</SelectItem>
                                            <SelectItem value="financiamiento" className="text-[10px] font-bold uppercase">Financiamiento</SelectItem>
                                            <SelectItem value="varios" className="text-[10px] font-bold uppercase">Ingresos Varios</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="materiales" className="text-[10px] font-bold uppercase">Compra Materiales</SelectItem>
                                            <SelectItem value="planillas" className="text-[10px] font-bold uppercase">Pago de Planillas</SelectItem>
                                            <SelectItem value="honorarios" className="text-[10px] font-bold uppercase">Honorarios Profesionales</SelectItem>
                                            <SelectItem value="servicios" className="text-[10px] font-bold uppercase">Servicios / Alquileres</SelectItem>
                                            <SelectItem value="varios" className="text-[10px] font-bold uppercase">Gastos Varios</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Descripción / Concepto</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="h-11 bg-card border-accent text-xs uppercase font-bold"
                                placeholder="Ej: Pago de planilla semana 24..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-accent">
                        <Button variant="ghost" onClick={() => { setIsIncomeModalOpen(false); setIsExpenseModalOpen(false); }} className="text-[10px] font-black uppercase tracking-widest">Cancelar</Button>
                        <Button
                            variant="default"
                            onClick={() => handleCreateTransaction(isIncomeModalOpen ? 'ingreso' : 'egreso')}
                            disabled={isSaving || !formData.amount || !formData.description}
                            className={cn("font-black uppercase text-[10px] h-11 px-8 shadow-xl",
                                isIncomeModalOpen ? "bg-emerald-500 hover:bg-emerald-600 text-black" : "bg-red-500 hover:bg-red-600 text-white")}
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Confirmar {isIncomeModalOpen ? 'Ingreso' : 'Egreso'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
