"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
    Landmark,
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    Wallet,
    Receipt,
    PieChart,
    Calendar,
    ArrowRight,
    Loader2,
    Plus,
    Building2,
    History
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { getAccountingOverview } from './actions';
import { cn } from '../../lib/utils';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AccountingPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAccountingOverview().then(res => {
            setData(res);
            setLoading(false);
        });
    }, []);

    const sections = [
        // { title: 'Cuentas Bancarias', desc: 'Gestión de saldos y conciliaciones.', icon: Landmark, url: '/accounting/accounts', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
        { title: 'Cuentas por Cobrar', desc: 'Seguimiento de cobros a clientes.', icon: ArrowDownLeft, url: '/accounting/receivables', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
        { title: 'Cuentas por Pagar', desc: 'Control de deudas con proveedores.', icon: ArrowUpRight, url: '/accounting/payables', color: 'text-red-500', bgColor: 'bg-red-500/10' },
        { title: 'Pagos y Egresos', desc: 'Control de salidas de capital.', icon: Wallet, url: '/accounting/payments', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
        // { title: 'Facturación', desc: 'Emisión y seguimiento de cobros.', icon: Receipt, url: '/accounting/invoices', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
        { title: 'Balances de Obra', desc: 'Análisis de rentabilidad por proyecto.', icon: PieChart, url: '/accounting/balance', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    ];

    if (loading) return (
        <div className="flex flex-col min-h-screen bg-card items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Finanzas...</p>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <Landmark className="h-8 w-8 text-primary" /> Contabilidad General
                    </h1>
                    <p className="text-muted-foreground mt-1 text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Consolidado Financiero</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-white/10 text-[10px] font-black uppercase h-10 px-6">
                        <Calendar className="mr-2 h-4 w-4" /> Mayo 2024
                    </Button>

                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-emerald-500/20  relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <CardHeader className="pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Ingresos Totales</span>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-emerald-500/50">$</span>
                            <p className="text-4xl font-black text-primary tracking-tighter">
                                {data?.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-4 text-[9px] font-black text-emerald-500 uppercase">
                            <TrendingUp className="h-3 w-3" /> +12.5% vs Mes Anterior
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-red-500/20  relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    <CardHeader className="pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500/70">Egresos Totales</span>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-red-500/50">$</span>
                            <p className="text-4xl font-black text-primary tracking-tighter">
                                {data?.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-4 text-[9px] font-black text-red-500 uppercase">
                            <ArrowUpRight className="h-3 w-3" /> +5.2% vs Mes Anterior
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <CardHeader className="pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Balance Neto</span>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-primary/50">$</span>
                            <p className="text-4xl font-black text-primary tracking-tighter">
                                {data?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-4 text-[9px] font-black text-primary uppercase">
                            <History className="h-3 w-3" /> Basado en {data?.transactionCount} movimientos
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sections.map((s, i) => (
                    <Link key={i} href={s.url}>
                        <Card className="bg-card border-accent hover:border-primary/50 transition-all cursor-pointer group h-full">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", s.bgColor)}>
                                    <s.icon className={cn("h-5 w-5", s.color)} />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold uppercase tracking-tight">{s.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">Acceder a Módulo</span>
                                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <Card className="bg-card border-accent lg:col-span-2 overflow-hidden h-fit gap-0 p-0 ">
                    <CardHeader className="border-b border-accent bg-accent flex flex-row items-center justify-between h-16">
                        <div className='items-center justify-center'>
                            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 ">
                                <History className="h-4 w-4 text-primary" /> Historial Reciente de Transacciones
                            </CardTitle>
                        </div>
                        {/* <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest hover:text-primary">Ver Libro Mayor</Button> */}
                    </CardHeader>

                    <CardContent className="p-0">

                        {data?.recentTransactions.length > 0 ? (
                            data.recentTransactions.map((t: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 p-5 hover:bg-muted/40 border-b border-accent transition-all last:border-0">
                                    <div className={cn("p-2.5 rounded-xl border border-accent",
                                        t.type === 'ingreso' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                    )}>
                                        {t.type === 'ingreso' ? <ArrowDownLeft className="h-4 w-4 text-emerald-500" /> : <ArrowUpRight className="h-4 w-4 text-red-500" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs font-bold text-primary uppercase tracking-tight text-[14px]">{t.description}</p>
                                            <p className={cn("text-sm font-black font-mono", t.type === 'ingreso' ? 'text-emerald-500' : 'text-red-500')}>
                                                {t.type === 'ingreso' ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <Badge variant="outline" className="text-[12px] font-black uppercase h-4 px-1.5 border-accent text-primary/40">{t.projectName}</Badge>
                                            <p className="text-[12px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                                                <Calendar className="h-2.5 w-2.5" /> {new Date(t.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20 gap-3">
                                <Landmark className="h-12 w-12" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sin transacciones registradas</p>
                            </div>
                        )}
                    </CardContent>

                </Card>

                {/* <Card className="bg-card/30 border-white/5 overflow-hidden shadow-2xl h-fit">
                    <CardHeader className="border-b border-white/5 bg-white/2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" /> Distribución por Categoría
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {[
                            { label: 'Materiales', value: 45, color: 'bg-blue-500' },
                            { label: 'Mano de Obra', value: 30, color: 'bg-emerald-500' },
                            { label: 'Maquinaria', value: 15, color: 'bg-amber-500' },
                            { label: 'Administración', value: 10, color: 'bg-purple-500' },
                        ].map((cat, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-muted-foreground">{cat.label}</span>
                                    <span className="text-white">{cat.value}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all", cat.color)} style={{ width: `${cat.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card> */}
            </div>
        </div>
    );
}
