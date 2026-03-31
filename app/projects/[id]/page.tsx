"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { ProjectConfig, Contact } from '@/types/types';
import { getProjectById } from '@/actions';
import { getContacts } from '@/actions';
import {
    Loader2,
    Info
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
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
        workingDays: 6
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
                        workingDays: found.config.workingDays || 6
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

    return (
        <div className="flex flex-col min-h-screen  text-primary">
            <main className="flex-1 p-4 md:p-8">
                <div className="relative h-[500px] rounded-3xl overflow-hidden border border-white/10  bg-black">
                    <img src={project?.imageUrl || 'https://picsum.photos/seed/project/1920/1080'} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50  hover:grayscale-0 transition-all duration-1000" />
                    <div className="absolute inset-0 " />
                    <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row items-end justify-between gap-6">
                        <div className="space-y-4">
                            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-primary drop-shadow-2xl">{project?.title}</h2>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
