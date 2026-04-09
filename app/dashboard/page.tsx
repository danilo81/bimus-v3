"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
    LayoutDashboard,
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
    Blocks,
    Settings,
    Check,
    AlertCircle,
    RefreshCcw,
    Users,
    Hammer,
    ShieldCheck,
    Banknote,
    Clock,
    MapPin,
    ClipboardCheck,
    DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
    getProjects,
    getGlobalFinancialStats,
    getGlobalWarehouseMovements,
    getGlobalSiteLogs,
    getGlobalPurchaseOrders,
    getProjectBalances,
    getContacts,
    getAssets,
    getGlobalInspectionRecords,
    getGlobalSupplyPriceUpdates
} from '@/actions';
import { cn } from '../../lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';


export default function DashboardPage() {
    // 1. Estados de Datos
    const [activeProjectsCount, setActiveProjectsCount] = useState('0');
    const [projectBalances, setProjectBalances] = useState<any[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [warehouseMovements, setWarehouseMovements] = useState<any[]>([]);
    const [siteLogs, setSiteLogs] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [inspections, setInspections] = useState<any[]>([]);
    const [supplyUpdates, setSupplyUpdates] = useState<any[]>([]);

    // 2. Estados de Interfaz
    const [currentDate, setCurrentDate] = useState('');
    const [mounted, setMounted] = useState(false);
    const [showConfigMenu, setShowConfigMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [configLoaded, setConfigLoaded] = useState(false);

    // 3. Estados de Carga y Error independientes
    const [isLoading, setIsLoading] = useState({
        activeProjects: false, balances: false, orders: false, warehouse: false, logs: false,
        contacts: false, assets: false, inspections: false, supplyUpdates: false
    });
    const [isError, setIsError] = useState({
        activeProjects: false, balances: false, orders: false, warehouse: false, logs: false,
        contacts: false, assets: false, inspections: false, supplyUpdates: false
    });

    // 4. Memoria de sesión para no repetir peticiones
    const fetchedData = useRef({
        activeProjects: false, balances: false, orders: false, warehouse: false, logs: false,
        contacts: false, assets: false, inspections: false, supplyUpdates: false
    });

    // 5. Configuración de visibilidad de widgets (Ahora incluye Proyectos Activos)
    const [widgetConfig, setWidgetConfig] = useState({
        activeProjects: true, balances: true, orders: true, warehouse: true, logs: true,
        contacts: true, assets: true, inspections: true, supplyUpdates: true
    });

    // Inicialización general
    useEffect(() => {
        setMounted(true);
        const now = new Date();
        setCurrentDate(now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }));

        const savedConfig = localStorage.getItem('dashboardWidgetConfig');
        if (savedConfig) {
            setWidgetConfig(JSON.parse(savedConfig));
        }
        setConfigLoaded(true);

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowConfigMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleWidget = (key: keyof typeof widgetConfig) => {
        const newConfig = { ...widgetConfig, [key]: !widgetConfig[key] };
        setWidgetConfig(newConfig);
        localStorage.setItem('dashboardWidgetConfig', JSON.stringify(newConfig));
    };

    // Funciones de carga independientes
    const loadActiveProjects = async () => {
        setIsLoading(prev => ({ ...prev, activeProjects: true }));
        setIsError(prev => ({ ...prev, activeProjects: false }));
        try {
            const projects = await getProjects();
            const activeCount = projects.filter((p: any) => p.status === 'activo' || p.status === 'construccion').length;
            setActiveProjectsCount(activeCount.toString());
            fetchedData.current.activeProjects = true;
        } catch (e) {
            console.error(e);
            setIsError(prev => ({ ...prev, activeProjects: true }));
        } finally {
            setIsLoading(prev => ({ ...prev, activeProjects: false }));
        }
    };

    const loadBalances = async () => {
        setIsLoading(prev => ({ ...prev, balances: true }));
        setIsError(prev => ({ ...prev, balances: false }));
        try {
            const balances = await getProjectBalances();
            setProjectBalances(balances.filter((b: any) => b.status === 'activo' || b.status === 'construccion'));
            fetchedData.current.balances = true;
        } catch (e) {
            console.error(e);
            setIsError(prev => ({ ...prev, balances: true }));
        } finally {
            setIsLoading(prev => ({ ...prev, balances: false }));
        }
    };

    const loadOrders = async () => {
        setIsLoading(prev => ({ ...prev, orders: true }));
        setIsError(prev => ({ ...prev, orders: false }));
        try {
            const pos = await getGlobalPurchaseOrders();
            setPurchaseOrders(pos);
            fetchedData.current.orders = true;
        } catch (e) {
            console.error(e);
            setIsError(prev => ({ ...prev, orders: true }));
        } finally {
            setIsLoading(prev => ({ ...prev, orders: false }));
        }
    };

    const loadWarehouse = async () => {
        setIsLoading(prev => ({ ...prev, warehouse: true }));
        setIsError(prev => ({ ...prev, warehouse: false }));
        try {
            const movements = await getGlobalWarehouseMovements();
            setWarehouseMovements(movements);
            fetchedData.current.warehouse = true;
        } catch (e) {
            console.error(e);
            setIsError(prev => ({ ...prev, warehouse: true }));
        } finally {
            setIsLoading(prev => ({ ...prev, warehouse: false }));
        }
    };

    const loadLogs = async () => {
        setIsLoading(prev => ({ ...prev, logs: true }));
        setIsError(prev => ({ ...prev, logs: false }));
        try {
            const logs = await getGlobalSiteLogs();
            setSiteLogs(logs);
            fetchedData.current.logs = true;
        } catch (e) {
            console.error(e);
            setIsError(prev => ({ ...prev, logs: true }));
        } finally {
            setIsLoading(prev => ({ ...prev, logs: false }));
        }
    };

    const loadContacts = async () => {
        setIsLoading(prev => ({ ...prev, contacts: true }));
        setIsError(prev => ({ ...prev, contacts: false }));
        try {
            const data = await getContacts();
            setContacts(data.slice(0, 5));
            fetchedData.current.contacts = true;
        } catch (e) {
            console.error(e);
            setIsError(prev => ({ ...prev, contacts: true }));
        } finally {
            setIsLoading(prev => ({ ...prev, contacts: false }));
        }
    };

    const loadAssets = async () => {
        setIsLoading(prev => ({ ...prev, assets: true }));
        setIsError(prev => ({ ...prev, assets: false }));
        try {
            const data = await getAssets();
            setAssets(data.slice(0, 5));
            fetchedData.current.assets = true;
        } catch (e) {
            console.error(e);
            setIsError(prev => ({ ...prev, assets: true }));
        } finally {
            setIsLoading(prev => ({ ...prev, assets: false }));
        }
    };

    const loadInspections = async () => {
        setIsLoading(prev => ({ ...prev, inspections: true }));
        setIsError(prev => ({ ...prev, inspections: false }));
        try {
            const data = await getGlobalInspectionRecords();
            setInspections(data.slice(0, 5));
            fetchedData.current.inspections = true;
        } catch (e) {
            console.error(e);
            setIsError(prev => ({ ...prev, inspections: true }));
        } finally {
            setIsLoading(prev => ({ ...prev, inspections: false }));
        }
    };

    const loadSupplyUpdates = async () => {
        setIsLoading(prev => ({ ...prev, supplyUpdates: true }));
        setIsError(prev => ({ ...prev, supplyUpdates: false }));
        try {
            const data = await getGlobalSupplyPriceUpdates();
            setSupplyUpdates(data.slice(0, 5));
            fetchedData.current.supplyUpdates = true;
        } catch (e) {
            console.error(e);
            setIsError(prev => ({ ...prev, supplyUpdates: true }));
        } finally {
            setIsLoading(prev => ({ ...prev, supplyUpdates: false }));
        }
    };

    // Efecto para escuchar la configuración y descargar datos bajo demanda
    useEffect(() => {
        if (!configLoaded) return;

        if (widgetConfig.activeProjects && !fetchedData.current.activeProjects) loadActiveProjects();
        if (widgetConfig.balances && !fetchedData.current.balances) loadBalances();
        if (widgetConfig.orders && !fetchedData.current.orders) loadOrders();
        if (widgetConfig.warehouse && !fetchedData.current.warehouse) loadWarehouse();
        if (widgetConfig.logs && !fetchedData.current.logs) loadLogs();
        if (widgetConfig.contacts && !fetchedData.current.contacts) loadContacts();
        if (widgetConfig.assets && !fetchedData.current.assets) loadAssets();
        if (widgetConfig.inspections && !fetchedData.current.inspections) loadInspections();
        if (widgetConfig.supplyUpdates && !fetchedData.current.supplyUpdates) loadSupplyUpdates();

    }, [widgetConfig, configLoaded]);

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            {/* CABECERA Y MENÚ DE CONFIGURACIÓN */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
                <div className='bg-card h-fit'>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3 text-primary">
                        <LayoutDashboard className="h-8 w-8 text-primary" /> Dashboard Principal
                    </h1>
                    <p className="text-muted-foreground mt-1 text-[10px] font-black uppercase tracking-[0.3em] opacity-50">SISTEMA DE CONTROL OPERATIVO</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="rounded-xl px-4 h-8 flex items-center gap-3 bg-card">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-[14px] font-black uppercase tracking-widest text-primary">{currentDate || 'Cargando...'}</span>
                    </div>

                    <div className="relative" ref={menuRef}>
                        <div className='h-fit'>
                            <Button
                                variant="default"
                                size="icon"
                                className="h-10 w-10 rounded-xl bg-card hover:bg-primary/10 cursor-pointer"
                                onClick={() => setShowConfigMenu(!showConfigMenu)}
                            >
                                <Settings className="h-4 w-4 text-primary" />
                            </Button>
                        </div>
                        {showConfigMenu && (
                            <div className="absolute right-0 mt-2 w-64 bg-card border border-accent rounded-xl z-50 overflow-hidden">
                                <div className="p-3 border-b border-accent bg-card flex items-center gap-2">
                                    <Settings className="h-4 w-4 text-primary" /><p className="text-xs font-black uppercase tracking-widest text-primary">Configurar Widgets</p>
                                </div>
                                <div className="p-2 flex flex-col gap-1">
                                    <button onClick={() => toggleWidget('activeProjects')} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors w-full text-left">
                                        <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                            <Blocks className="h-3.5 w-3.5" /> Proyectos Activos
                                        </span>
                                        {widgetConfig.activeProjects && <Check className="h-4 w-4 text-emerald-500" />}
                                    </button>
                                    <button onClick={() => toggleWidget('balances')} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors w-full text-left">
                                        <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                            <PieChart className="h-3.5 w-3.5" /> Balances
                                        </span>
                                        {widgetConfig.balances && <Check className="h-4 w-4 text-emerald-500" />}
                                    </button>
                                    <button onClick={() => toggleWidget('orders')} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors w-full text-left">
                                        <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                            <ShoppingCart className="h-3.5 w-3.5" /> Órdenes
                                        </span>
                                        {widgetConfig.orders && <Check className="h-4 w-4 text-emerald-500" />}
                                    </button>
                                    <button onClick={() => toggleWidget('warehouse')} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors w-full text-left">
                                        <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                            <Package className="h-3.5 w-3.5" /> Almacenes
                                        </span>
                                        {widgetConfig.warehouse && <Check className="h-4 w-4 text-emerald-500" />}
                                    </button>
                                    <button onClick={() => toggleWidget('logs')} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors w-full text-left">
                                        <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                            <BookOpen className="h-3.5 w-3.5" /> Libro de Obras
                                        </span>
                                        {widgetConfig.logs && <Check className="h-4 w-4 text-emerald-500" />}
                                    </button>
                                    <button onClick={() => toggleWidget('contacts')} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors w-full text-left">
                                        <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5" /> Contactos
                                        </span>
                                        {widgetConfig.contacts && <Check className="h-4 w-4 text-emerald-500" />}
                                    </button>
                                    <button onClick={() => toggleWidget('assets')} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors w-full text-left">
                                        <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                            <Hammer className="h-3.5 w-3.5" /> Activos Fijos
                                        </span>
                                        {widgetConfig.assets && <Check className="h-4 w-4 text-emerald-500" />}
                                    </button>
                                    <button onClick={() => toggleWidget('inspections')} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors w-full text-left">
                                        <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                            <ShieldCheck className="h-3.5 w-3.5" /> Inspecciones
                                        </span>
                                        {widgetConfig.inspections && <Check className="h-4 w-4 text-emerald-500" />}
                                    </button>
                                    <button onClick={() => toggleWidget('supplyUpdates')} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors w-full text-left">
                                        <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                            <Banknote className="h-3.5 w-3.5" /> Precios Insumos
                                        </span>
                                        {widgetConfig.supplyUpdates && <Check className="h-4 w-4 text-emerald-500" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* WIDGET: PROYECTOS ACTIVOS (Mini-Card) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 ">
                {widgetConfig.activeProjects && (

                    <Link href="/projects" className="block">
                        <Card className="bg-card border-accent hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden h-fit">
                            {isLoading.activeProjects && (
                                <div className="absolute inset-0 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary/40" />
                                </div>
                            )}
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <span className="text-[14px] font-black uppercase tracking-[0.2em] text-muted-foreground">Proyectos Activos</span>
                                <div className="p-2 rounded-lg group-hover:scale-110 transition-transform bg-primary/10">
                                    <Blocks className="h-4 w-4 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isError.activeProjects ? (
                                    <div className="flex flex-col items-start gap-2 pt-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> Error de carga
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => { e.preventDefault(); loadActiveProjects(); }}
                                            className="h-6 text-[10px] px-2"
                                        >
                                            <RefreshCcw className="h-3 w-3 mr-1" /> Reintentar
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-4xl font-black text-primary tracking-tighter">
                                            {activeProjectsCount}
                                        </div>
                                        <div className="flex items-center justify-end mt-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Ver Detalles</span>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Link>

                )}


                {/* WIDGET: BALANCES */}
                {widgetConfig.balances && (

                    <Card className="bg-card border-accent overflow-hidden p-0 lg:col-span-2 gap-0 ">
                        <CardHeader className="border-b border-accent bg-white/2 flex flex-row items-center justify-between h-16 p-0 ">
                            <div>
                                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-4 px-6 pt-6">
                                    <PieChart className="h-4 w-4 text-primary" /> Resumen balance de obras
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <ScrollArea className="h-[220px]">
                            <CardContent className="p-0">
                                {isError.balances ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-80">
                                        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                            <AlertCircle className="h-6 w-6 text-red-500" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-[12px] font-black uppercase tracking-widest text-red-500">Error de conexión</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">No se pudieron cargar los balances.</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={loadBalances} className="mt-2 text-[10px] font-black uppercase tracking-widest gap-2">
                                            <RefreshCcw className="h-3 w-3" /> Reintentar
                                        </Button>
                                    </div>
                                ) : isLoading.balances ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando balances...</p>
                                    </div>
                                ) : projectBalances.length > 0 ? (
                                    <ScrollArea className="w-full max-w-screen whitespace-nowrap border-b border-accent ">
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
                                                    <TableRow key={i} className="border-accent  transition-all tracking-widest w-full">
                                                        <TableCell className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20">
                                                                    <Building2 className="h-3.5 w-3.5 text-primary" />
                                                                </div>
                                                                <span className="text-xs font-bold text-primary uppercase">{item.title}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className={cn("text-[12px] font-black uppercase px-1.5 border-none",
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
                                        <ScrollBar orientation="horizontal" />
                                        <ScrollBar orientation="vertical" />
                                    </ScrollArea>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 opacity-20">
                                        <TrendingUp className="h-10 w-10" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Sin proyectos activos</p>
                                    </div>
                                )}
                            </CardContent>
                        </ScrollArea>
                    </Card>
                )}

                {/* WIDGET: ÓRDENES */}
                {widgetConfig.orders && (
                    <Card className="bg-card border-accent overflow-hidden p-0 gap-0 ">
                        <CardHeader className="border-b border-accent bg-white/2 flex flex-row items-center justify-between h-16 pt-6">
                            <div>
                                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4 text-primary" /> Órdenes Activas
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1 p-0">
                            {isError.orders ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-80">
                                    <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <AlertCircle className="h-6 w-6 text-red-500" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-[12px] font-black uppercase tracking-widest text-red-500">Error de conexión</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">No se pudieron cargar las órdenes.</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={loadOrders} className="mt-2 text-[10px] font-black uppercase tracking-widest gap-2">
                                        <RefreshCcw className="h-3 w-3" /> Reintentar
                                    </Button>
                                </div>
                            ) : isLoading.orders ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Cargando órdenes...</p>
                                </div>
                            ) : purchaseOrders.length > 0 ? (
                                purchaseOrders.map((order, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 border-b border-accent transition-all last:border-0 m-0">
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
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
                {/* WIDGET: ALMACENES */}
                {widgetConfig.warehouse && (
                    <Card className="bg-card border-accent overflow-hidden p-0 gap-0">
                        <CardHeader className="border-b border-accent bg-card flex flex-row items-center justify-between h-16 pt-6">
                            <div>
                                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <Package className="h-4 w-4 text-primary" /> Movimientos almacenes
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 ">
                            {isError.warehouse ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-80">
                                    <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <AlertCircle className="h-6 w-6 text-red-500" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-[12px] font-black uppercase tracking-widest text-red-500">Error de conexión</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">No se pudo cargar el inventario.</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={loadWarehouse} className="mt-2 text-[10px] font-black uppercase tracking-widest gap-2">
                                        <RefreshCcw className="h-3 w-3" /> Reintentar
                                    </Button>
                                </div>
                            ) : isLoading.warehouse ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
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
                                                    {m.type === 'ingreso' ? '+' : '-'}{m.itemCount}   Item
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
                )}

                {/* WIDGET: LOGS */}
                {widgetConfig.logs && (
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
                                {isError.logs ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-80">
                                        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                            <AlertCircle className="h-6 w-6 text-red-500" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-[12px] font-black uppercase tracking-widest text-red-500">Error de conexión</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">No se pudieron cargar las bitácoras.</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={loadLogs} className="mt-2 text-[10px] font-black uppercase tracking-widest gap-2">
                                            <RefreshCcw className="h-3 w-3" /> Reintentar
                                        </Button>
                                    </div>
                                ) : isLoading.logs ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
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
                                                        <p className="text-[14px] font-bold text-muted-foreground/40 italic">   {log.author}</p>
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
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* WIDGET: ÚLTIMOS CONTACTOS */}
                {widgetConfig.contacts && (
                    <Card className="bg-card border-accent overflow-hidden p-0 gap-0">
                        <CardHeader className="border-b border-accent bg-card flex flex-row items-center justify-between h-16 pt-6 px-6">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" /> Últimos Contactos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading.contacts ? (
                                <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                            ) : contacts.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {contacts.map((c, i) => (
                                        <div key={i} className="p-4 hover:bg-white/2 transition-colors flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20">
                                                {c.name?.[0] || 'C'}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-[11px] font-bold text-primary uppercase truncate">{c.name}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase font-black opacity-50 truncate">{c.company || 'Personal'}</p>
                                            </div>
                                            <Badge variant="outline" className="text-[8px] font-black uppercase border-accent shrink-0">{c.type}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center opacity-20">
                                    <p className="text-[9px] font-black uppercase">Sin contactos recientes</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* WIDGET: ACTIVOS FIJOS */}
                {widgetConfig.assets && (
                    <Card className="bg-card border-accent overflow-hidden p-0 gap-0">
                        <CardHeader className="border-b border-accent bg-card flex flex-row items-center justify-between h-16 pt-6 px-6">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Hammer className="h-4 w-4 text-primary" /> Activos Fijos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading.assets ? (
                                <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                            ) : assets.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {assets.map((a, i) => (
                                        <div key={i} className="p-4 hover:bg-white/2 transition-colors space-y-2">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[11px] font-bold text-primary uppercase">{a.name}</p>
                                                <Badge className={cn("text-[8px] font-black uppercase px-1.5 h-4 border-none",
                                                    a.status === 'disponible' ? 'bg-emerald-500/20 text-emerald-500' :
                                                        a.status === 'mantenimiento' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'
                                                )}>
                                                    {a.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-50">
                                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-[9px] text-muted-foreground uppercase font-black">{a.location || 'Depósito Central'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center opacity-20">
                                    <p className="text-[9px] font-black uppercase">Sin activos registrados</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* WIDGET: INSPECCIONES */}
                {widgetConfig.inspections && (
                    <Card className="bg-card border-accent overflow-hidden p-0 gap-0">
                        <CardHeader className="border-b border-accent bg-card flex flex-row items-center justify-between h-16 pt-6 px-6">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <ClipboardCheck className="h-4 w-4 text-primary" /> Inspecciones Recientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading.inspections ? (
                                <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                            ) : inspections.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {inspections.map((ins, i) => (
                                        <div key={i} className="p-4 hover:bg-white/2 transition-colors space-y-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[11px] font-bold text-primary uppercase truncate flex-1">{ins.itemName}</p>
                                                <span className="text-[8px] font-mono text-muted-foreground ml-2 shrink-0">{new Date(ins.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-2.5 w-2.5 text-muted-foreground/50" />
                                                    <span className="text-[9px] text-muted-foreground uppercase font-black truncate">{ins.projectName}</span>
                                                </div>
                                                <Badge className={cn("text-[8px] font-black uppercase px-1.5 h-3.5 border-none",
                                                    ins.status === 'aprobado' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
                                                )}>
                                                    {ins.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center opacity-20">
                                    <p className="text-[9px] font-black uppercase">Sin inspecciones recientes</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* WIDGET: PRECIOS INSUMOS */}
                {widgetConfig.supplyUpdates && (
                    <Card className="bg-card border-accent overflow-hidden p-0 gap-0">
                        <CardHeader className="border-b border-accent bg-card flex flex-row items-center justify-between h-16 pt-6 px-6">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" /> Actualización de Precios
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading.supplyUpdates ? (
                                <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                            ) : supplyUpdates.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {supplyUpdates.map((up, i) => (
                                        <div key={i} className="p-4 hover:bg-white/2 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[11px] font-bold text-primary uppercase truncate flex-1">{up.supplyName}</p>
                                                <span className="text-[11px] font-mono font-black text-primary ml-2 shrink-0">${up.price.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[9px] text-muted-foreground uppercase font-black truncate max-w-[120px]">{up.supplierName}</span>
                                                <span className="text-[8px] font-mono text-muted-foreground/40">{new Date(up.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center opacity-20">
                                    <p className="text-[9px] font-black uppercase">Sin actualizaciones recientes</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}