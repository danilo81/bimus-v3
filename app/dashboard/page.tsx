
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import {
    LayoutDashboard,
    Hammer,
    ListTodo,
    Users,
    TrendingUp,
    Calendar,
    ArrowRight,
    Loader2,
    PieChart,
    Building2,
    ShoppingCart,
    Package,
    ArrowRightLeft,
    BookOpen,
    Activity,
    Clock,
    Blocks
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { getProjects, getGlobalFinancialStats, getGlobalWarehouseMovements, getGlobalSiteLogs, getGlobalPurchaseOrders } from '../../app/projects/actions';
import { getTasks } from '../../app/tasks/actions';
import { getContacts } from '../../app/library/contacts/actions';
import { getProjectBalances } from '../../app/accounting/actions';
import { cn } from '../../lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

export default function DashboardPage() {
    const [statsData, setStatsData] = useState({
        activeProjects: '0',
        pendingTasks: '0',
        contactsCount: '0',
        upcomingEvents: '3' // Valor inicial mockeado
    });
    const [projectBalances, setProjectBalances] = useState<any[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [warehouseMovements, setWarehouseMovements] = useState<any[]>([]);
    const [siteLogs, setSiteLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        setCurrentDate(now.toLocaleDateString('es-ES', options));

        async function fetchDashboardStats() {
            try {
                const [projects, tasks, contacts, finStats, balances, movements, logs, pos] = await Promise.all([
                    getProjects(),
                    getTasks(),
                    getContacts(),
                    getGlobalFinancialStats(),
                    getProjectBalances(),
                    getGlobalWarehouseMovements(),
                    getGlobalSiteLogs(),
                    getGlobalPurchaseOrders()
                ]);

                const activeCount = projects.filter((p: { status: string; }) => p.status === 'activo' || p.status === 'construccion').length;
                const activeBalances = balances.filter(b => b.status === 'activo' || b.status === 'construccion');
                const pendingCount = tasks.filter((t: any) => t.status !== 'completado').length;

                setStatsData({
                    activeProjects: activeCount.toString(),
                    pendingTasks: pendingCount.toString(),
                    contactsCount: contacts.length.toString(),
                    upcomingEvents: '3' // Aquí podrías integrar el conteo real de eventos de calendario
                });

                setProjectBalances(activeBalances);
                setWarehouseMovements(movements);
                setSiteLogs(logs);
                setPurchaseOrders(pos);
            } catch (error) {
                console.error("Error al cargar estadísticas del dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchDashboardStats();
    }, []);

    const stats = [
        { label: 'Proyectos Activos', value: statsData.activeProjects, icon: Blocks, color: 'text-primary', bgColor: 'bg-primary/10', url: '/projects' },
        { label: 'Tareas Pendientes', value: statsData.pendingTasks, icon: ListTodo, color: 'text-amber-500', bgColor: 'bg-amber-500/10', url: '/tasks' },
        { label: 'Contactos Directorio', value: statsData.contactsCount, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10', url: '/library/contacts' },
        { label: 'Eventos Programados', value: statsData.upcomingEvents, icon: Calendar, color: 'text-blue-400', bgColor: 'bg-blue-400/10', url: '/calendar' },
    ];

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className='bg-card h-fit'>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3 text-primary">
                        <LayoutDashboard className="h-8 w-8 text-primary" /> Dashboard Principal
                    </h1>
                    <p className="text-muted-foreground mt-1 text-[10px] font-black uppercase tracking-[0.3em] opacity-50">SISTEMA DE CONTROL OPERATIVO GLOBAL</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="rounded-xl px-4 h-10 flex items-center gap-3 bg-card">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{currentDate || 'Cargando...'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Link key={i} href={stat.url}>
                        <Card className="bg-card border-accent hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden">
                            {isLoading && (
                                <div className="absolute inset-0  flex items-center justify-center z-10 backdrop-blur-[1px]">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary/40" />
                                </div>
                            )}
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <span className="text-[14px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</span>
                                <div className={cn("p-2 rounded-lg  group-hover:scale-110 transition-transform", stat.bgColor)}>
                                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-black text-primary tracking-tighter">{stat.value}</div>
                                <div className="flex items-center justify-end mt-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Ver Detalles</span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
                <Card className="bg-card border-accent overflow-hidden p-0 lg:col-span-2 gap-0 ">
                    <CardHeader className="border-b border-accent bg-white/2 flex flex-row items-center justify-between h-16 p-0 ">
                        <div>
                            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-4 px-6 pt-6">
                                <PieChart className="h-4 w-4 text-primary" /> Resumen balance de obras
                            </CardTitle>

                        </div>
                        <Button variant="default" size="sm" className="text-[10px] font-black uppercase tracking-widest text-background mr-4 bg-primary mt-6" render={<Link href="/accounting/balance" />} nativeButton={false}>
                            Ver Balances Detallados
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando balances...</p>
                            </div>
                        ) : projectBalances.length > 0 ? (
                            <Table>
                                <TableHeader className="bg-accent">
                                    <TableRow className="border-accent hover:bg-transparent">
                                        <TableHead className="text-[9px] font-black uppercase px-6 py-3">Proyecto / Obra</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-center">Estado</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-right">Ingresos</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-right">Egresos</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-right pr-6">Saldo Neto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projectBalances.map((item, i) => (
                                        <TableRow key={i} className="border-accent  transition-all">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20">
                                                        <Building2 className="h-3.5 w-3.5 text-primary" />
                                                    </div>
                                                    <span className="text-xs font-bold text-primary uppercase">{item.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className={cn(
                                                    "text-[12px] font-black uppercase px-1.5 border-none",
                                                    item.status === 'activo' || item.status === 'construccion' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                                )}>
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-emerald-500 font-bold text-xs">
                                                {mounted ? item.income.toLocaleString(undefined, { minimumFractionDigits: 2 }) : item.income.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-red-500 font-bold text-xs">
                                                {mounted ? item.expense.toLocaleString(undefined, { minimumFractionDigits: 2 }) : item.expense.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <span className={cn("text-xs font-black font-mono px-2 py-1 rounded",
                                                    item.balance >= 0 ? "text-primary bg-primary/10" : "text-red-500 bg-red-500/10"
                                                )}>
                                                    ${mounted ? item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : item.balance.toFixed(2)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 opacity-20">
                                <TrendingUp className="h-10 w-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sin proyectos activos con movimientos</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card border-accent overflow-hidden p-0 gap-0 ">
                    <CardHeader className="border-b border-accent bg-white/2 flex flex-row items-center justify-between h-16 pt-6">
                        <div>
                            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-primary" /> Órdenes de Compra Activas
                            </CardTitle>

                        </div>
                        <Button variant="default" size="sm" className="text-[10px] font-black uppercase tracking-widest mr-4" render={<Link href="/accounting/payables" />} nativeButton={false}>
                            Gestionar
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-1 p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Cargando órdenes...</p>
                            </div>
                        ) : purchaseOrders.length > 0 ? (
                            purchaseOrders.map((order, i) => (
                                <div key={i} className="flex items-center justify-between p-5  border-b border-accent transition-all last:border-0 m-0">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-2.5 w-2.5 rounded-full",
                                            order.status === 'pending' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                                order.status === 'processed' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                                                    'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                        )} />
                                        <div>
                                            <p className="text-[14px] font-bold text-primary uppercase tracking-tight">{order.id} — {order.supplier}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[12px] font-black uppercase h-4 px-1.5 border-accent opacity-50">{order.label}</Badge>
                                                <span className="text-[12px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1">
                                                    <Building2 className="h-2.5 w-2.5" /> {order.project}
                                                </span>
                                                <span className="text-[12px] text-muted-foreground/40 font-mono flex items-center gap-1 ml-1 border-l border-accent pl-2">
                                                    <Calendar className="h-2 w-2" /> {new Date(order.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[14px] font-mono font-black text-primary uppercase">
                                            ${mounted ? order.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : order.amount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20 gap-3">
                                <ShoppingCart className="h-8 w-8" />
                                <p className="text-[10px] font-black uppercase">Sin órdenes de compra</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
                <Card className="bg-card border-accent overflow-hidden p-0 gap-0">
                    <CardHeader className="border-b border-accent bg-card flex flex-row items-center justify-between h-16 pt-6">
                        <div>
                            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" /> Movimientos de almacenes
                            </CardTitle>

                        </div>
                    </CardHeader>
                    <CardContent className="p-0 ">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-[10px] font-black uppercase">Leyendo inventarios...</p>
                            </div>
                        ) : warehouseMovements.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {warehouseMovements.map((m, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 transition-colors border-b border-accent">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("p-2 rounded-lg border",
                                                m.type === 'ingreso' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                                            )}>
                                                <ArrowRightLeft className="h-3.5 w-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-primary uppercase">{m.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[12px] font-black uppercase text-muted-foreground">{m.projectName}</span>
                                                    <span className="text-[12px] font-mono text-muted-foreground opacity-50">• {new Date(m.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className={cn("text-[12px] font-black uppercase border-accent",
                                                m.type === 'ingreso' ? 'text-emerald-500' : 'text-red-500'
                                            )}>
                                                {m.type === 'ingreso' ? '+' : '-'}{m.itemCount}   Item
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-20 gap-3">
                                <Package className="h-12 w-12" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sin movimientos de almacén</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card border-accent overflow-hidden p-0 gap-0">
                    <CardHeader className="border-b border-accent bg-card flex flex-row items-center justify-between h-16 pt-6">
                        <div>
                            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" /> Libro de obras
                            </CardTitle>

                        </div>

                    </CardHeader>
                    <CardContent className="gap-0 p-0">
                        <div className="h-100 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-[10px] font-black uppercase">Consultando bitácoras...</p>
                                </div>
                            ) : siteLogs.length > 0 ? (
                                <div className="p-0">
                                    {siteLogs.map((log, i) => (
                                        <div key={i} className="flex gap-4 p-5 hover:bg-white/2 border-b border-accent last:border-0 transition-colors group">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                <div className="w-px flex-1 bg-accent group-last:hidden" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[12px] font-mono font-black text-amber-500/70 uppercase">{new Date(log.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                                                    <Badge className={cn("text-[12px] font-black uppercase px-1.5 h-4 border-none",
                                                        log.type === 'incident' ? 'bg-red-500/20 text-red-500' :
                                                            log.type === 'milestone' ? 'bg-emerald-500/20 text-emerald-500' :
                                                                'bg-blue-500/20 text-blue-500'
                                                    )}>
                                                        {log.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs font-bold text-primary leading-relaxed uppercase">{log.content}</p>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[12px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
                                                        <Building2 className="h-2.5 w-2.5" /> {log.projectName}
                                                    </p>
                                                    <p className="text-[14px] font-bold text-muted-foreground/40 italic">   {log.author}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-20 gap-3">
                                    <BookOpen className="h-12 w-12" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin registros de libros de obra</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
