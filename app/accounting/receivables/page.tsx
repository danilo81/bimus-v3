"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import {
    HandCoins,
    Search,
    ChevronLeft,
    Filter,
    Download,
    Clock,
    CheckCircle2,
    AlertTriangle,
    MoreVertical,
    FileText,
    Building2,
    Plus,
    Loader2
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../components/ui/dropdown-menu';
import { getGlobalReceivables } from '../actions';

export default function ReceivablesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getGlobalReceivables().then(res => {
            setData(res);
            setLoading(false);
        });
    }, []);

    const filteredItems = data?.items?.filter((rec: any) =>
        rec.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.project.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (loading) return (
        <div className="flex flex-col min-h-screen bg-background items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Cobros...</p>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="hover:bg-white/5" onClick={() => router.push('/accounting')}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                            <HandCoins className="h-8 w-8 text-emerald-500" /> Cuentas por Cobrar
                        </h1>
                        <p className="text-muted-foreground mt-1 text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Control de Ingresos Pendientes</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* <Button variant="outline" className="border-white/10 text-[10px] font-black uppercase h-10 px-6">
                        <Download className="mr-2 h-4 w-4" /> Exportar Reporte
                    </Button>
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest h-10 px-6">
                        <Plus className="mr-2 h-4 w-4" /> Registrar Cobro
                    </Button> */}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-emerald-500/20  relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <CardHeader className="pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Total por Cobrar</span>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-primary tracking-tighter">
                            ${(data?.totalReceivable || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[9px] font-black text-muted-foreground uppercase mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {data?.pendingCount || 0} Facturas Pendientes
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-red-500/20  relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    <CardHeader className="pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500/70">Monto Vencido</span>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-primary tracking-tighter">$0.00</p>
                        <p className="text-[9px] font-black text-red-500 uppercase mt-2 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> 0 Facturas con retraso
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-white/10  relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-white/20" />
                    <CardHeader className="pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cobrado este Mes</span>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-primary tracking-tighter">
                            ${(data?.collectedThisMonth || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[9px] font-black text-emerald-500 uppercase mt-2 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Procesado en ciclo actual
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-accent backdrop-blur-xl">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="BUSCAR CLIENTE O PROYECTO..."
                        className="pl-10 h-11 bg-card border-accent text-[10px] font-black uppercase tracking-widest"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest hover:bg-white/5">
                    <Filter className="mr-2 h-4 w-4" /> Filtros Avanzados
                </Button> */}
            </div>

            {filteredItems.length > 0 ? (
                <Card className="bg-card border-white/5 overflow-hidden shadow-2xl pt-0">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-card">
                                <TableRow className="border-card hover:bg-transparent">
                                    <TableHead className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliente / Proyecto</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ID Registro</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Vencimiento</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Monto (USD)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Estado</TableHead>
                                    <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.map((rec: any) => (
                                    <TableRow key={rec.id} className="border-white/5 hover:bg-white/3 transition-colors group">
                                        <TableCell className="py-6 px-8">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white uppercase group-hover:text-emerald-500 transition-colors">{rec.client}</span>
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                                    <Building2 className="h-3 w-3" /> {rec.project}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{rec.id}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={cn("text-xs font-bold", rec.status === 'overdue' ? 'text-red-500' : 'text-white')}>{rec.dueDate}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-black text-emerald-500 text-sm">
                                            ${rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={cn("text-[8px] font-black uppercase border-white/10 tracking-widest",
                                                rec.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    rec.status === 'overdue' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-amber-500/10 text-amber-500'
                                            )}>
                                                {rec.status === 'paid' ? 'Pagado' : rec.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                                                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-card border-white/10 text-white shadow-2xl">
                                                    <DropdownMenuItem className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer">
                                                        <FileText className="h-3.5 w-3.5" /> Ver Comprobante
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer text-emerald-500 focus:text-emerald-500">
                                                        <HandCoins className="h-3.5 w-3.5" /> Conciliar Pago
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20">
                    <HandCoins className="h-16 w-16 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No se encontraron cuentas por cobrar activas.</p>
                </div>
            )}
        </div>
    );
}
