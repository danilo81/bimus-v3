"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { ProjectConfig, Contact } from '@/types/types';
import { getProjectById } from '@/actions';
import { getContacts } from '@/actions';
import {
    Loader2,
    Info,
    TrendingUp
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { calculateAPU } from '../../../lib/apu-utils';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../hooks/use-auth';

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [project, setProject] = useState<any | null>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isTeamOpen, setIsTeamOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const projectId = useMemo(() => {
        const id = params?.id;
        if (!id) return null;
        const resolvedId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : null;
        const RESERVED = ['reportes', 'construction', 'operations', 'documentation', 'tasks', 'model', 'board', 'desing', 'shop', 'warehouse', 'accounting', 'undefined', 'null'];
        if (!resolvedId || RESERVED.includes(resolvedId)) return null;
        return resolvedId.trim();
    }, [params?.id]);

    const [libraryContacts, setLibraryContacts] = useState<Contact[]>([]);
    const [teamSearchTerm, setTeamSearchTerm] = useState('');
    const [isFetchingLibrary, setIsFetchingLibrary] = useState(false);

    const [editProjectData, setEditProjectData] = useState({
        title: '',
        client: '',
        location: '',
        projectType: 'residencial',
        area: 0,
        status: 'activo',
        startDate: ''
    });

    const [configParams, setConfigParams] = useState<ProjectConfig>({
        id: '',
        projectId: '',
        utility: 10,
        adminExpenses: 5,
        iva: 13,
        it: 3,
        socialCharges: 55,
        toolWear: 3,
        exchangeRate: 6.96,
        financing: 0,
        guaranteeRetention: 7,
        mainCurrency: 'BS',
        secondaryCurrency: 'USD',
        workingDays: 6,
        workingDaysSelection: [1, 2, 3, 4, 5, 6]
    });

    const [localLevels, setLevels] = useState<{ id?: string, name: string }[]>([]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchProject = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            const found = await getProjectById(id);
            if (found) {
                setProject(found);
                setEditProjectData({
                    title: found.title || '',
                    client: found.client || '',
                    location: found.location || '',
                    projectType: found.projectType || 'residencial',
                    area: found.area || 0,
                    status: (found.status || 'activo').toLowerCase(),
                    startDate: found.startDate ? new Date(found.startDate).toISOString().split('T')[0] : ''
                });
                if (found.config) {
                    setConfigParams({
                        ...found.config,
                        mainCurrency: found.config.mainCurrency || 'BS',
                        secondaryCurrency: found.config.secondaryCurrency || 'USD',
                        workingDays: found.config.workingDays || 6,
                        workingDaysSelection: found.config.workingDaysSelection || [1, 2, 3, 4, 5, 6]
                    });
                }
                if (found.levels) {
                    setLevels(found.levels.map((l: any) => ({ id: l.id, name: l.name })));
                }
            } else {
                setProject(null);
            }
        } catch (error) {
            console.error("[Client] Fallo al cargar el proyecto:", error);
            setProject(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isMounted) {
            if (projectId) fetchProject(projectId);
            else setIsLoading(false);
        }
    }, [isMounted, projectId, fetchProject]);

    const fetchLibraryContacts = useCallback(async () => {
        setIsFetchingLibrary(true);
        try {
            const data = await getContacts();
            setLibraryContacts(data as any);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetchingLibrary(false);
        }
    }, []);

    useEffect(() => {
        if (isTeamOpen && libraryContacts.length === 0) fetchLibraryContacts();
    }, [isTeamOpen, libraryContacts.length, fetchLibraryContacts]);


    const totals = useMemo(() => {
        if (!project || !project.items) return { current: 0, changes: 0, original: 0 };

        const currentTotal = project.items.reduce((acc: number, pi: any) => {
            const apu = calculateAPU(pi.item?.supplies || [], project.config);
            return acc + (pi.quantity * apu.totalUnit);
        }, 0);

        const changeOrdersTotal = (project.changeOrders || []).reduce((acc: number, oc: any) => {
            return acc + (oc.amount || 0);
        }, 0);

        return {
            current: currentTotal,
            changes: changeOrdersTotal,
            original: currentTotal - changeOrdersTotal
        };
    }, [project]);

    if (!isMounted) return null;

    if (isLoading) return (
        <div className="flex flex-col min-h-screen  items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando proyecto...</p>
        </div>
    );

    if (!project && !isLoading) return (
        <div className="flex flex-col min-h-screen  items-center justify-center p-8 gap-4 h-[50vh]">
            <div className="p-4 rounded-full bg-white/5 border border-white/10"><Info className="h-12 w-12 text-muted-foreground opacity-40" /></div>
            <div className="text-center space-y-2"><p className="text-primary font-bold uppercase tracking-[0.2em] text-sm">Proyecto no localizado</p></div>
            <Button variant="outline" onClick={() => router.push('/projects')} className="mt-4 border-white/10 hover:bg-white/5 uppercase text-[10px] font-black tracking-widest px-8">Volver a Proyectos</Button>
        </div>
    );

    const getProjectImageUrl = (url: string | null) => {
        if (!url || url === '/project-img.png') return '/project-img.png';
        if (url.startsWith('/')) return url;
        const match = url.match(/https:\/\/pub-[a-z0-9]+\.r2\.dev\/(.+)$/);
        if (match) return `/api/r2/file/${match[1]}`;
        return url;
    };

    return (
        <div className="flex flex-col min-h-screen text-primary pb-20">
            <main className="flex-1 p-4 md:p-8 space-y-12">
                {/* HERO SECTION */}
                <div className="relative h-[400px] md:h-[500px] rounded-[40px] overflow-hidden border border-white/10 bg-black group">
                    <img
                        src={getProjectImageUrl(project?.imageUrl)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-3000 ease-out grayscale-[0.5] group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />

                    <div className="absolute bottom-12 left-8 right-8 flex flex-col md:flex-row items-end justify-between gap-8">
                        <div className="space-y-4 max-w-4xl">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-primary text-background font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full">
                                    {project?.status}
                                </Badge>
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest px-4 py-1.5 border border-white/10 rounded-full backdrop-blur-md">
                                    {project?.projectType}
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-[0.85]">
                                {project?.title}
                            </h1>
                            <p className="text-white/60 text-sm md:text-lg font-medium max-w-2xl uppercase tracking-wide leading-relaxed">
                                {project?.location || 'Ubicación no especificada'} — {project?.client || 'Cliente General'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* FINANCIAL DASHBOARD SECTION */}
                <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000">


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* CONSOLIDATED BUDGET */}
                        <Card className="bg-card border-accent backdrop-blur-2xl rounded-[32px] overflow-hidden group hover:border-primary/20 transition-all duration-500">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Presupuesto Consolidado</CardDescription>
                                <CardTitle className="text-3xl font-black tracking-tighter font-mono">
                                    {configParams.mainCurrency} {totals.original.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 mt-4">
                                    <div className="h-1.5 flex-1 bg-card rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-full" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-primary/60">Original</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ADJUSTMENTS / CHANGE ORDERS */}
                        <Card className="bg-card border-accent backdrop-blur-2xl rounded-[32px] overflow-hidden group hover:border-amber-500/20 transition-all duration-500">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 flex items-center justify-between">
                                    Órdenes de Cambio
                                    <span className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded text-[8px]">{project?.changeOrders?.length || 0} Reg.</span>
                                </CardDescription>
                                <CardTitle className="text-3xl font-black tracking-tighter font-mono text-amber-500">
                                    {totals.changes >= 0 ? '+' : ''}
                                    {configParams.mainCurrency} {totals.changes.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 mt-4">
                                    <div className="h-1.5 flex-1 bg-amber-500/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 transition-all duration-1000"
                                            style={{ width: `${Math.min(100, Math.abs((totals.changes / totals.original) * 100))}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-amber-500">
                                        {((totals.changes / totals.original) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CURRENT BUDGET */}
                        <Card className="bg-card text-primary border-transparent rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all duration-500 ">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Presupuesto Actual</CardDescription>
                                <CardTitle className="text-4xl font-black tracking-tighter font-mono">
                                    {configParams.mainCurrency} {totals.current.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 mt-4">
                                    <div className="h-1.5 flex-1 bg-card rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-full" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-primary/60">Final Estimado</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* PROJECT DETAILS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
                        <div className="p-6 bg-card border border-accent rounded-3xl space-y-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Área Total</p>
                            <p className="text-xl font-black">{project?.area} M²</p>
                        </div>
                        <div className="p-6 bg-card border border-accent rounded-3xl space-y-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Fecha Inicio</p>
                            <p className="text-xl font-black">{project?.startDate ? new Date(project.startDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase() : 'NO DEF.'}</p>
                        </div>
                        <div className="p-6 bg-card border border-accent rounded-3xl space-y-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Capítulos</p>
                            <p className="text-xl font-black">{Array.from(new Set(project?.items?.map((i: any) => i.item.chapter))).length}</p>
                        </div>
                        <div className="p-6 bg-card border border-accent rounded-3xl space-y-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Niveles</p>
                            <p className="text-xl font-black">{project?.levels?.length || 0} Plantas</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
