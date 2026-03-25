"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import {
    PieChart,
    ChevronLeft,
    Download,
    Activity,
    Search,
    Loader2,
    Building2,
    Coins
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { getProjectBalances } from '../actions';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';

export default function BalancesPage() {
    const router = useRouter();
    const [balances, setBalances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        getProjectBalances().then(res => {
            setBalances(res);
            setLoading(false);
        });
    }, []);

    const filteredBalances = balances.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex flex-col min-h-screen bg-background items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Analizando Balances...</p>
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
                            <PieChart className="h-8 w-8 text-primary" /> Balances de Obra
                        </h1>
                        <p className="text-muted-foreground mt-1 ">Rendimiento Financiero por Proyecto</p>
                    </div>
                </div>

            </div>

            <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-accent backdrop-blur-xl justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="BUSCAR PROYECTO..."
                        className="pl-10 h-10 bg-card border-accent text-[10px]   tracking-widest"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                {/* <Button variant="outline" className="bg-primary text-background text-[10px] font-black uppercase h-10 px-6">
                    <Download className="mr-2 h-4 w-4" /> Exportar Consolidado
                </Button> */}
                </div>
            </div>

            {filteredBalances.length > 0 ? (
                <Card className="bg-card border-accent overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-card">
                                <TableRow className="border-accent hover:bg-transparent">
                                    <TableHead className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Proyecto / Obra</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Ingresos</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Egresos</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Saldo Actual</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-8 w-62.5">Ejecución Presupuestaria</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBalances.map((b) => (
                                    <TableRow key={b.id} className="border-white/5 hover:bg-white/3 transition-colors group">
                                        <TableCell className="py-6 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                                    <Building2 className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black uppercase tracking-tight text-primary group-hover:text-primary transition-colors">{b.title}</span>
                                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                                        <Activity className="h-3 w-3" /> Estado: Activo
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-emerald-500 text-sm">
                                            ${b.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-red-500 text-sm">
                                            ${b.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={cn("text-sm font-black font-mono", b.balance >= 0 ? "text-primary" : "text-red-500")}>
                                                    ${b.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter mt-1">Margen Operativo</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                    <span className="text-muted-foreground">Presupuesto</span>
                                                    <span className="text-primary">{b.execution.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className={cn("h-full transition-all duration-1000",
                                                            b.execution > 90 ? "bg-red-500" : b.execution > 70 ? "bg-amber-500" : "bg-primary"
                                                        )}
                                                        style={{ width: `${Math.min(b.execution, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20">
                    <Coins className="h-16 w-16 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay datos financieros para mostrar.</p>
                </div>
            )}
        </div>
    );
}
