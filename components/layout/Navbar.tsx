/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Bell, LogOut, Sun, Moon, Box, Layers, Users, FolderOpen, Shield, Ruler, Truck, Settings, User as UserIcon, Bell as BellIcon, Lock, CreditCard, FileText, Wrench, Check, X, Info, AlertTriangle, CheckCircle2, Trash2, Landmark, Receipt, CheckSquare, Clock, Handshake, Palette, Menu, Building2, Calendar, Smartphone, Globe, ShieldCheck, LifeBuoy, FileCode, Activity, Presentation, PlusCircle, Save, UserPlus, Send, Hammer, ShoppingCart, Package, Banknote, BookOpen, Coins, MapPin, TrendingUp, Search, SquareLibrary, Blocks, Loader2, Plus, Mail, Drill, Boxes } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '../../components/ui/navigation-menu';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Notification, Task, Contact, Project, ProjectConfig, TaskPriority, TaskStatus } from '../../lib/types';
import { getNotifications, markAsRead, deleteNotification } from '../../app/notifications/actions';
import { getTasks, createTask } from '../../app/tasks/actions';
import { getProjectById, getProjects, updateProject as updateProjectAction, addContactToProject, removeContactFromProject, inviteCollaborator, updateProjectContactPermissions, getMyProjectPermissions } from '../../app/projects/actions';
import { getUpcomingEvents } from '../../app/calendar/actions';
import { getContacts, importContactToLibrary } from '../../app/library/contacts/actions';
import { ScrollArea } from '../../components/ui/scroll-area';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { Separator } from '../ui/separator';
import { Switch } from '../../components/ui/switch';
import { useProjectPermissions } from '../../contexts/project-permissions-context';

const PERMISSION_MODULES = [
    { id: 'board', label: 'Dashboard Board', icon: Activity },
    { id: 'design', label: 'Diseño', icon: Palette },
    { id: 'construction', label: 'Construcción', icon: Hammer },
    { id: 'operations', label: 'Operaciones', icon: Settings },
    { id: 'purchasing', label: 'Compras', icon: ShoppingCart },
    { id: 'warehouses', label: 'Almacenes', icon: Package },
    { id: 'accounting', label: 'Contabilidad', icon: Receipt },
    { id: 'documents', label: 'Documentos', icon: FolderOpen },
    { id: 'tasks', label: 'Tareas', icon: CheckSquare }
];

export function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { toast } = useToast();

    // Project Modals State
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isTeamOpen, setIsTeamOpen] = useState(false);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isSubmittingProject, setIsSubmittingProject] = useState(false);

    const handleTogglePermission = async (contactId: string, moduleId: string, field: 'view' | 'edit', value: boolean) => {
        if (!activeProject?.id) return;

        const previousTeam = [...(activeProject.team || [])];
        const newTeam = previousTeam.map((c: any) => {
            if (c.id === contactId) {
                const currentPerms = c.permissions || {};
                const modPerms = currentPerms[moduleId] || { view: false, edit: false };
                const newModPerms = { ...modPerms, [field]: value };
                if (field === 'edit' && value) newModPerms.view = true;
                if (field === 'view' && !value) newModPerms.edit = false;

                return {
                    ...c,
                    permissions: { ...currentPerms, [moduleId]: newModPerms }
                };
            }
            return c;
        });

        setActiveProject((prev: any) => prev ? { ...prev, team: newTeam } : null);

        try {
            const contact = newTeam.find((c: any) => c.id === contactId);
            if (contact) {
                const res = await updateProjectContactPermissions(activeProject.id, contactId, contact.permissions);
                if (!res.success) throw new Error(res.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error de permisos', description: error.message || 'No se pudieron guardar los cambios.' });
            setActiveProject((prev: any) => prev ? { ...prev, team: previousTeam } : null);
        }
    };

    // Notifications State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Tasks State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [pendingTasksCount, setPendingTasksCount] = useState(0);

    // New Task Modal State
    const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
    const [taskProjects, setTaskProjects] = useState<Project[]>([]);
    const [isFetchingTaskProjects, setIsFetchingTaskProjects] = useState(false);
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);
    const [newTaskForm, setNewTaskForm] = useState<{
        title: string;
        description: string;
        dueDate: string;
        projectId: string;
        assignee: string;
        status: TaskStatus;
        priority: TaskPriority;
    }>({
        title: '',
        description: '',
        dueDate: new Date().toISOString().slice(0, 10),
        projectId: '',
        assignee: user?.name || 'Usuario',
        status: 'pendiente',
        priority: 'media'
    });

    // New Event Modal State (se guarda como tarea con fecha)
    const [isNewEventOpen, setIsNewEventOpen] = useState(false);
    const [eventProjects, setEventProjects] = useState<Project[]>([]);
    const [isFetchingEventProjects, setIsFetchingEventProjects] = useState(false);
    const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
    const [newEventForm, setNewEventForm] = useState<{
        title: string;
        description: string;
        dueDate: string;
        projectId: string;
    }>({
        title: '',
        description: '',
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        projectId: ''
    });

    // Events State
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

    // Project Context State
    const [activeProject, setActiveProject] = useState<any>(null);
    const [myPermissions, setMyPermissions] = useState<Record<string, { view: boolean; edit: boolean }> | null>(null);
    const [isProjectAuthor, setIsProjectAuthor] = useState(false);
    const [libraryContacts, setLibraryContacts] = useState<Contact[]>([]);
    const [teamSearchTerm, setTeamSearchTerm] = useState('');
    const [isFetchingLibrary, setIsFetchingLibrary] = useState(false);

    // Project Config Form State
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

    const isAuthor = useMemo(() => user?.id === activeProject?.authorId, [user?.id, activeProject?.authorId]);

    const fetchData = useCallback(async () => {
        if (user?.id) {
            const [notifData, tasksData, eventsData] = await Promise.all([
                getNotifications(user.id),
                getTasks(),
                getUpcomingEvents()
            ]);

            setNotifications(notifData);
            setUnreadCount(notifData.filter(n => !n.isRead).length);

            const userTasks = tasksData.filter((t: any) => !t.userId || t.userId === user.id);
            setTasks(userTasks as any);
            setPendingTasksCount(userTasks.filter((t: any) => t.status !== 'completado').length);
            setUpcomingEvents(eventsData);
        }
    }, [user?.id]);

    const fetchProjectContext = useCallback(async () => {
        const match = pathname.match(/^\/projects\/([^\/]+)/);
        const projectId = match ? match[1] : null;

        const excluded = ['undefined', 'null', 'reportes', 'actions', 'construction', 'operations', 'documentation', 'tasks', 'model', 'new'];

        if (projectId && !excluded.includes(projectId)) {
            if (activeProject?.id !== projectId) {
                try {
                    const [data, permData] = await Promise.all([
                        getProjectById(projectId),
                        getMyProjectPermissions(projectId)
                    ]);
                    if (data) {
                        setActiveProject(data);
                        setIsProjectAuthor(permData.isAuthor);
                        setMyPermissions(permData.isAuthor ? null : (permData.permissions as any));
                        setEditProjectData({
                            title: data.title || '',
                            client: data.client || '',
                            location: data.location || '',
                            projectType: data.projectType || 'residencial',
                            area: data.area || 0,
                            status: (data.status || 'activo').toLowerCase(),
                            startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : ''
                        });
                        if (data.config) {
                            setConfigParams({
                                ...data.config,
                                mainCurrency: data.config.mainCurrency || 'BS',
                                secondaryCurrency: data.config.secondaryCurrency || 'USD',
                                workingDays: data.config.workingDays || 6
                            });
                        }
                        if (data.levels) {
                            setLevels(data.levels.map((l: any) => ({ id: l.id, name: l.name })));
                        }
                    }
                } catch (e) {
                    setActiveProject(null);
                }
            }
        } else {
            setActiveProject(null);
        }
    }, [pathname, activeProject?.id]);

    useEffect(() => {
        setMounted(true);
        if (isAuthenticated) {
            fetchData();
            fetchProjectContext();
        }
    }, [isAuthenticated, fetchData, fetchProjectContext]);

    useEffect(() => {
        if (!isNewTaskOpen) return;

        // Reset form values when the modal opens.
        setNewTaskForm(prev => ({
            ...prev,
            title: '',
            description: '',
            projectId: '',
            dueDate: new Date().toISOString().slice(0, 10),
            assignee: user?.name || 'Usuario',
            status: 'pendiente',
            priority: 'media'
        }));

        (async () => {
            setIsFetchingTaskProjects(true);
            try {
                const data = await getProjects();
                setTaskProjects(data as any);
            } catch (e) {
                console.error('Error al cargar proyectos:', e);
                setTaskProjects([]);
            } finally {
                setIsFetchingTaskProjects(false);
            }
        })();
    }, [isNewTaskOpen, user?.name]);

    useEffect(() => {
        if (!isNewEventOpen) return;

        // Reset form values when the modal opens.
        setNewEventForm({
            title: '',
            description: '',
            dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            projectId: ''
        });

        (async () => {
            setIsFetchingEventProjects(true);
            try {
                const data = await getProjects();
                setEventProjects(data as any);
            } catch (e) {
                console.error('Error al cargar proyectos:', e);
                setEventProjects([]);
            } finally {
                setIsFetchingEventProjects(false);
            }
        })();
    }, [isNewEventOpen, user?.name]);

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

    const handleMarkAsRead = async (id: string) => {
        const result = await markAsRead(id);
        if (result.success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const handleDeleteNotification = async (id: string) => {
        const result = await deleteNotification(id);
        if (result.success) {
            const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newTaskForm.title.trim()) {
            toast({ variant: "destructive", title: "Falta el título de la tarea" });
            return;
        }

        if (!newTaskForm.projectId) {
            toast({ variant: "destructive", title: "Selecciona un proyecto" });
            return;
        }

        setIsSubmittingTask(true);
        try {
            const result = await createTask({
                title: newTaskForm.title.trim(),
                description: newTaskForm.description || '',
                status: newTaskForm.status,
                priority: newTaskForm.priority,
                dueDate: newTaskForm.dueDate,
                assignee: newTaskForm.assignee || user?.name || 'Usuario',
                projectId: newTaskForm.projectId
            });

            if (result?.success) {
                toast({ title: "Tarea creada" });
                setIsNewTaskOpen(false);
                setNewTaskForm(prev => ({
                    ...prev,
                    title: '',
                    description: '',
                    projectId: '',
                    dueDate: new Date().toISOString().slice(0, 10),
                    assignee: user?.name || 'Usuario',
                    status: 'pendiente',
                    priority: 'media'
                }));
                fetchData();
            } else {
                toast({ variant: "destructive", title: "Error al crear la tarea", description: (result as any)?.error });
            }
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Error al crear la tarea", description: error?.message || 'Intenta nuevamente' });
        } finally {
            setIsSubmittingTask(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newEventForm.title.trim()) {
            toast({ variant: "destructive", title: "Falta el título del evento" });
            return;
        }

        if (!newEventForm.projectId) {
            toast({ variant: "destructive", title: "Selecciona un proyecto" });
            return;
        }

        if (!newEventForm.dueDate) {
            toast({ variant: "destructive", title: "Selecciona una fecha" });
            return;
        }

        setIsSubmittingEvent(true);
        try {
            // Los "próximos eventos" del Navbar se alimentan de tareas con vencimiento,
            // así que el "evento" aquí se crea como una tarea pendiente.
            const result = await createTask({
                title: newEventForm.title.trim(),
                description: newEventForm.description || '',
                status: 'pendiente',
                priority: 'media',
                dueDate: newEventForm.dueDate,
                assignee: user?.name || 'Usuario',
                projectId: newEventForm.projectId
            });

            if (result?.success) {
                toast({ title: "Evento creado" });
                setIsNewEventOpen(false);
                setNewEventForm({
                    title: '',
                    description: '',
                    dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
                    projectId: ''
                });
                fetchData();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error al crear el evento",
                    description: (result as any)?.error
                });
            }
        } catch (error: any) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error al crear el evento",
                description: error?.message || 'Intenta nuevamente'
            });
        } finally {
            setIsSubmittingEvent(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!activeProject) return;
        setIsSubmittingProject(true);
        try {
            const result = await updateProjectAction(activeProject.id, {
                ...editProjectData,
                area: Number(editProjectData.area) || 0,
                config: configParams,
                levels: localLevels
            });
            if (result && result.success) {
                toast({ title: "Configuración guardada" });
                setIsConfigOpen(false);
                fetchProjectContext();
            } else {
                toast({ title: "Error", description: (result as any).error, variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmittingProject(false);
        }
    };

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProject || !inviteEmail) return;
        setIsSubmittingProject(true);
        try {
            const result = await inviteCollaborator(activeProject.id, inviteEmail);
            if (result.success) {
                toast({ title: "Invitación enviada", description: `Se ha enviado una solicitud a ${inviteEmail}.` });
                setIsInviteModalOpen(false);
                setInviteEmail('');
                fetchProjectContext();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error al invitar", description: error.message });
        } finally {
            setIsSubmittingProject(false);
        }
    };

    const handleAddTeamMember = async (contactId: string) => {
        if (!activeProject) return;
        setIsSubmittingProject(true);
        try {
            const result = await addContactToProject(activeProject.id, contactId);
            if (result.success) {
                toast({ title: "Miembro añadido" });
                fetchProjectContext();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmittingProject(false);
        }
    };

    const handleRemoveTeamMember = async (contactId: string) => {
        if (!activeProject || !confirm('¿Remover a este miembro?')) return;
        setIsSubmittingProject(true);
        try {
            const result = await removeContactFromProject(activeProject.id, contactId);
            if (result.success) {
                toast({ title: "Miembro removido", variant: "destructive" });
                fetchProjectContext();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmittingProject(false);
        }
    };

    const handleImportToLibrary = async (contactId: string) => {
        setIsSubmittingProject(true);
        try {
            const result = await importContactToLibrary(contactId);
            if (result.success) {
                toast({ title: "Contacto importado" });
                fetchLibraryContacts();
            } else {
                toast({ title: "Aviso", description: result.error, variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmittingProject(false);
        }
    };

    const updateConfigParam = (key: keyof ProjectConfig, value: string) => {
        setConfigParams(prev => ({ ...prev, [key]: (key === 'mainCurrency' || key === 'secondaryCurrency') ? value : (parseFloat(value) || 0) }));
    };

    const handleAddLevel = () => setLevels(prev => [...prev, { name: `Nuevo Nivel ${prev.length + 1}` }]);
    const handleRemoveLevel = (index: number) => setLevels(prev => prev.filter((_, i) => i !== index));
    const handleLevelNameChange = (index: number, name: string) => setLevels(prev => prev.map((l, i) => i === index ? { ...l, name } : l));
    const handleProjectDataChange = (field: string, value: string) => setEditProjectData(prev => ({ ...prev, [field]: value }));

    const projectTools = useMemo(() => [
        { name: 'PIZARRA', icon: Presentation, url: `/projects/${activeProject?.id}/board`, permissionId: 'board' },
        { name: 'DISEÑO', icon: Layers, url: `/projects/${activeProject?.id}/desing`, permissionId: 'design' },
        { name: 'OBRA', icon: Hammer, url: `/projects/${activeProject?.id}/construction`, permissionId: 'construction' },
        { name: 'OPERACIONES', icon: Activity, url: `/projects/${activeProject?.id}/operations`, permissionId: 'operations' },
        { name: 'BIM', icon: Box, url: `/projects/${activeProject?.id}/model`, permissionId: null },
        { name: 'COMPRAS', icon: ShoppingCart, url: `/projects/${activeProject?.id}/shop`, permissionId: 'purchasing' },
        { name: 'ALMACENES', icon: Package, url: `/projects/${activeProject?.id}/warehouse`, permissionId: 'warehouses' },
        { name: 'CONTABILIDAD', icon: Banknote, url: `/projects/${activeProject?.id}/accounting`, permissionId: 'accounting' },
        { name: 'DOCUMENTOS', icon: FolderOpen, url: `/projects/${activeProject?.id}/documentation`, permissionId: 'documents' },
        { name: 'TAREAS', icon: CheckSquare, url: `/projects/${activeProject?.id}/tasks`, permissionId: 'tasks' },
        { name: 'BITACORA', icon: BookOpen, url: null, onClick: () => setIsLogOpen(true), permissionId: null },
        { name: 'EQUIPO', icon: Users, url: null, onClick: () => setIsTeamOpen(true), permissionId: null },
        { name: 'REPORTES', icon: FileText, url: `/projects/${activeProject?.id}/reportes`, permissionId: null },
        { name: 'CONFIG', icon: Settings, url: null, onClick: () => setIsConfigOpen(true), permissionId: null },
    ].filter(tool => {
        if (!isAuthor && (tool.name === 'CONFIG' || tool.name === 'INVITAR' || tool.name === 'BIM' || tool.name === 'BITACORA' || tool.name === 'EQUIPO')) return false;
        return true;
    }), [activeProject?.id, isAuthor]);

    // Permissions resolved via server action (see getMyProjectPermissions in actions.ts)
    const { canView, canEdit, isAuthor: ctxIsAuthor } = useProjectPermissions(); // kept for Permisos tab only
    const canView2 = (moduleId: string | null): boolean => {
        if (isProjectAuthor || moduleId === null) return true;
        if (!myPermissions) return true; // not on a project page
        return myPermissions[moduleId]?.view === true;
    };

    const availableLibraryContacts = useMemo(() => {
        if (!activeProject?.team) return libraryContacts;
        const teamIds = new Set(activeProject.team.map((m: any) => m.id));
        return libraryContacts.filter(c => !teamIds.has(c.id));
    }, [libraryContacts, activeProject?.team]);

    const filteredLibraryContacts = useMemo(() => {
        return availableLibraryContacts.filter(c =>
            c.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
            (c.company?.toLowerCase() || '').includes(teamSearchTerm.toLowerCase())
        );
    }, [availableLibraryContacts, teamSearchTerm]);

    if (!isAuthenticated && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
        return null;
    }

    if (!mounted) return (
        <nav className="h-16 border-b border-border bg-background/50 flex items-center px-4 justify-between sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <div className="size-7" />
            </div>
        </nav>
    );

    const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'error': return <X className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <nav className="h-14 border-2 border-foreground/10 bg-card flex items-center px-4 justify-between sticky top-0 z-40  rounded-lg m-3 ">
            <div className="flex items-center gap-6">
                <Link href="/dashboard" className="flex items-center space-x-2 mr-4">
                    <div>
                        <Image src="/Grupo.svg" className='h-8 w-8' alt="grupo" width={24} height={24} />
                    </div>
                    <span className="text-lg font-black tracking-tighter font-headline text-primary uppercase hidden sm:block">
                        Bim<span className="text-primary/50">us</span>
                    </span>
                </Link>

                <div className="hidden lg:flex items-center gap-4">
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:bg-secondary">
                                    <Menu className="h-6 w-6" />
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-100 gap-3 p-4 md:w-125 md:grid-cols-2 lg:w-150 bg-card border border-accent">
                                        <li className="row-span-3">
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    className="flex h-full w-full select-none flex-col justify-end rounded-md from-primary/20 to-primary/5 p-6 no-underline outline-none focus:shadow-md hover:bg-secondary"
                                                    href="/projects"
                                                >
                                                    <Blocks className="h-6 w-6 text-primary" />
                                                    <div className="mb-2 mt-4 text-lg font-black uppercase tracking-tighter text-primary">Gestión de Proyectos</div>
                                                    <p className="text-[10px] leading-tight text-muted-foreground font-bold uppercase">
                                                        Gestión y supervisión de proyectos.
                                                    </p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <li>
                                            <NavigationMenuLink asChild>
                                                <Link href="/accounting" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary">
                                                    <div className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                                                        <Landmark className="h-3.5 w-3.5" /> Contabilidad de Proyectos
                                                    </div>
                                                    <p className="line-clamp-2 text-[9px] font-bold uppercase text-muted-foreground">Control financiero y balances globales.</p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <li>
                                            <NavigationMenuLink asChild>
                                                <Link href="/community" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary">
                                                    <div className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                                                        <Handshake className="h-3.5 w-3.5" /> Comunidad
                                                    </div>
                                                    <p className="line-clamp-2 text-[9px] font-bold uppercase text-muted-foreground">Explora y conecta con otros profesionales.</p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:bg-secondary">
                                    <SquareLibrary className="h-6 w-6" />
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <div className="p-4 w-70 space-y-2 bg-popover border border-accent rounded-xl  ">
                                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 mb-1 py-2">Construcción</div>
                                        <NavigationMenuLink asChild>
                                            <Link href="/library/construction/supplies" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all">
                                                <Box className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Insumos</span>
                                            </Link>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink asChild>
                                            <Link href="/library/construction/items" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all">
                                                <Boxes className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Items / Partidas</span>
                                            </Link>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink asChild>
                                            <Link href="/library/construction/assets" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all">
                                                <Drill className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Activos Fijos</span>
                                            </Link>
                                        </NavigationMenuLink>

                                        {/* <div className="h-px bg-accent my-2"></div>
                                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 mb-1">Diseño y Modelo</div>
                                        <NavigationMenuLink asChild>
                                            <Link href="/library/design/cad" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all">
                                                <PenTool className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Cad</span>
                                            </Link>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink asChild>
                                            <Link href="/library/design/models" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all">
                                                <LayoutGrid className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Modelos</span>
                                            </Link>
                                        </NavigationMenuLink> */}

                                        <div className="h-px bg-accent my-2"></div>
                                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 mb-1">Directorio</div>
                                        <NavigationMenuLink asChild>
                                            <Link href="/library/contacts" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all">
                                                <Users className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Contactos</span>
                                            </Link>
                                        </NavigationMenuLink>

                                        <div className="h-px bg-accent my-2"></div>
                                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 mb-1">Parámetros</div>
                                        <NavigationMenuLink asChild>
                                            <Link href="/library/parameters/units" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all">
                                                <Ruler className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Unidades</span>
                                            </Link>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink asChild>
                                            <Link href="/library/parameters/chapters" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all">
                                                <Layers className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Capítulos</span>
                                            </Link>
                                        </NavigationMenuLink>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>

                    {activeProject && (
                        <div className="flex items-center gap-4 ml-2 pl-4 border-l border-card animate-in fade-in slide-in-from-left-4 duration-500">
                            <Link
                                href={`/projects/${activeProject.id}`}
                                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer"
                            >
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <div className="p-1.5 bg-primary rounded-lg border border-accent">
                                    <Building2 className="h-4 w-4 text-background" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none truncate max-w-37.5 pl-2">
                                            {activeProject.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Badge variant="outline" className={cn(
                                            "text-[7px] h-3.5 font-black uppercase px-1.5 border-none",
                                            activeProject.status === 'activo' || activeProject.status === 'construccion' ? "bg-emerald-500/0 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                        )}>
                                            {activeProject.status}
                                        </Badge>
                                    </div>
                                </div>
                            </Link>

                            {/* TOOLBAR INTEGRADO */}
                            <div className="flex items-center gap-1.5 p-1 bg-card rounded-xl   ml-2">
                                <TooltipProvider>
                                    {projectTools.map((tool, idx) => {
                                        const allowed = canView2(tool.permissionId);
                                        return (
                                            <Tooltip key={idx}>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={() => allowed ? (tool.url ? router.push(tool.url) : tool.onClick?.()) : undefined}
                                                        disabled={!allowed}
                                                        className={cn(
                                                            "relative flex items-center justify-center h-8 w-8 border-none rounded-lg transition-all group active:scale-90",
                                                            allowed
                                                                ? "hover:bg-primary/40 cursor-pointer"
                                                                : "opacity-30 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <tool.icon className={cn("w-3.5 h-3.5 transition-colors", allowed ? "text-muted-foreground group-hover:text-primary" : "text-muted-foreground")} />
                                                        {!allowed && (
                                                            <Lock className="absolute bottom-0 right-0 h-2.5 w-2.5 text-muted-foreground/60" />
                                                        )}
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="bg-primary border-accent text-[9px] font-black uppercase tracking-widest text-background">
                                                    {allowed ? tool.name : `${tool.name} (Sin acceso)`}
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </TooltipProvider>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary h-9 w-9 rounded-xl hover:bg-secondary transition-all cursor-pointer"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                    {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative h-9 w-9 rounded-xl hover:bg-secondary transition-all cursor-pointer">
                            <Calendar className="h-4.5 w-4.5" />
                            {upcomingEvents.length > 0 && (
                                <span className="absolute top-2 right-2 w-3 h-3 bg-amber-500 rounded-full border-2 border-background animate-pulse"></span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 bg-card border-accent text-primary shadow-sm p-0 overflow-hidden rounded-xl">
                        <div className="p-4 bg-card border-b border-accent flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Próximos Eventos</span>
                            <Badge variant="secondary" className="text-[10px] h-4 bg-primary/20 text-primary border-primary/20">{upcomingEvents.length} Eventos</Badge>
                        </div>
                        <ScrollArea className="h-80">
                            <div className="flex flex-col">
                                {upcomingEvents.length > 0 ? (
                                    upcomingEvents.map((event) => (
                                        <div key={event.id} className="p-4 border-b border-accent last:border-0  transition-colors group">
                                            <div className="flex gap-3">
                                                <div className="mt-0.5">
                                                    <div className={cn("h-2 w-2 rounded-full mt-1.5",
                                                        event.type === 'hitos' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                                            event.type === 'obra' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                                event.type === 'reunion' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                                                                    'bg-primary shadow-[0_0_8px_rgba(255,255,255,0.2)]'
                                                    )} />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <p className="text-[11px] font-bold uppercase leading-tight">{event.title}</p>
                                                        <span className="text-[11px] font-mono text-muted-foreground/60 uppercase">{event.date}</span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter flex items-center gap-1.5">
                                                        <Building2 className="h-3 w-3" /> {event.project}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-3 opacity-20">
                                        <Calendar className="h-10 w-10" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Sin eventos próximos</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <div className="p-3 bg-card border-t border-accent text-center flex flex-col gap-2">
                            <Button
                                variant="default"
                                className="w-full text-[9px] font-black uppercase tracking-widest h-8 hover:bg-primary/40 bg-primary text-background cursor-pointer"
                                onClick={() => router.push('/calendar')}
                            >
                                Abrir Calendario Completo
                            </Button>
                            <Button
                                variant="default"
                                className="w-full text-[9px] font-black uppercase tracking-widest h-8 hover:bg-primary/40 bg-primary text-background border border-accent cursor-pointer"
                                onClick={() => setIsNewEventOpen(true)}
                            >
                                Nuevo evento
                            </Button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative h-9 w-9 rounded-xl hover:bg-secondary transition-all cursor-pointer">
                            <CheckSquare className="h-4.5 w-4.5" />
                            {pendingTasksCount > 0 && (
                                <span className="absolute top-2 right-2 w-3 h-3 bg-amber-500 rounded-full border-2 border-background animate-pulse"></span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 bg-card border-accent text-primary shadow-sm p-0 overflow-hidden rounded-xl">
                        <div className="p-4 bg-white/2 border-b border-accent flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Tareas Pendientes</span>
                            {pendingTasksCount > 0 && <Badge variant="secondary" className="text-[10px] h-4 bg-amber-500/20 text-amber-500 border-amber-500/20">{pendingTasksCount} Pendientes</Badge>}
                        </div>
                        <ScrollArea className="h-80">
                            {tasks.filter(t => t.status !== 'completado').length > 0 ? (
                                <div className="flex flex-col">
                                    {tasks.filter(t => t.status !== 'completado').slice(0, 5).map((task) => (
                                        <div key={task.id} className="p-4 border-b border-accent last:border-0  transition-colors group">
                                            <div className="flex gap-3">
                                                <div className="mt-0.5">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <p className="text-[12px] font-bold uppercase leading-tight">{task.title}</p>
                                                        <Badge variant="outline" className={cn("text-[10px] py-0 border-white/10 font-black uppercase",
                                                            task.priority === 'alta' ? 'text-red-500 border-red-500/40' :
                                                                task.priority === 'media' ? 'text-amber-500 border-amber-500/40' : 'text-emerald-500 border-emerald-500/40'
                                                        )}>
                                                            {task.priority}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">{task.description || 'Sin descripción'}</p>
                                                    <p className="text-[10px] font-mono text-muted-foreground/40 uppercase mt-1">
                                                        Vence: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Sin fecha'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-3 opacity-20">
                                    <CheckSquare className="h-10 w-10" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin tareas pendientes</p>
                                </div>
                            )}
                        </ScrollArea>
                        <div className="p-3 bg-card border-t border-accent text-center flex flex-col gap-2">
                            <Button variant="default" className="w-full text-[9px] font-black uppercase tracking-widest h-8 hover:bg-primary/50 bg-primary text-background cursor-pointer" onClick={() => router.push('/tasks')}>
                                Gestionar Tareas Generales
                            </Button>
                            <Button
                                variant="default"
                                className="w-full text-[9px] font-black uppercase tracking-widest h-8 hover:bg-primary/50 bg-primary text-background cursor-pointer"
                                onClick={() => setIsNewTaskOpen(true)}
                            >
                                Nueva tarea
                            </Button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>


                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative h-9 w-9 rounded-xl hover:bg-secondary transition-all cursor-pointer">
                            <Bell className="h-4.5 w-4.5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-3 h-3 bg-amber-500 rounded-full border-2 border-background animate-pulse"></span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 bg-card border-accent text-primary shadow-sm p-0 overflow-hidden rounded-xl">
                        <div className="p-4 bg-white/2 border-b border-accent flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Notificaciones</span>
                            {unreadCount > 0 && <Badge variant="secondary" className="text-[8px] h-4 bg-primary/20 text-primary border-primary/20">{unreadCount} Nuevas</Badge>}
                        </div>
                        <ScrollArea className="h-80">
                            {notifications.length > 0 ? (
                                <div className="flex flex-col">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={cn(
                                                "p-4 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors relative group",
                                                !n.isRead && "bg-primary/5"
                                            )}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-0.5">
                                                    <NotificationIcon type={n.type as any} />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <p className="text-[11px] font-bold uppercase leading-tight">{n.title}</p>
                                                        <button
                                                            onClick={() => handleDeleteNotification(n.id)}
                                                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed">{n.message}</p>
                                                    <p className="text-[8px] font-mono text-muted-foreground/40 uppercase mt-1">
                                                        {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            {!n.isRead && (
                                                <button
                                                    onClick={() => handleMarkAsRead(n.id)}
                                                    className="absolute bottom-2 right-2 p-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary transition-all cursor-pointer"
                                                    title="Marcar como leída"
                                                >
                                                    <Check className="h-2.5 w-2.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-3 opacity-20">
                                    <BellIcon className="h-10 w-10" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin notificaciones</p>
                                </div>
                            )}
                        </ScrollArea>
                        <div className="p-3 bg-card border-t border-accent text-center">
                            <Button variant="default" className="w-full text-[9px] font-black uppercase tracking-widest h-8 hover:bg-primary/40 bg-primary text-background cursor-pointer" onClick={() => router.push('/notifications')}>
                                Ver todo el historial
                            </Button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-6 w-px bg-accent mx-2"></div>

                <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                    <DialogContent className="max-w-150 bg-card border-accent text-primary p-0 overflow-hidden ">
                        <DialogHeader className="p-6  border-b border-primary/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                    <CheckSquare className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary">Nueva Tarea</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                        Registrar tarea en el catálogo operativo
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <form onSubmit={handleCreateTask}>
                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Título</Label>
                                    <Input
                                        value={newTaskForm.title}
                                        onChange={(e) => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="h-12 bg-card border-accent uppercase font-bold text-sm"
                                        placeholder="Ej: Revisar planos"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Descripción</Label>
                                    <Textarea
                                        value={newTaskForm.description}
                                        onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="min-h-22.5 bg-card border-accent text-primary font-bold"
                                        placeholder="Opcional"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fecha de vencimiento</Label>
                                    <Input
                                        type="date"
                                        value={newTaskForm.dueDate}
                                        onChange={(e) => setNewTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                                        className="h-12 bg-card border-accent uppercase font-bold text-sm"
                                    />
                                </div>

                                <div className="space-y-2 w-full">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Proyecto</Label>
                                    <Select
                                        value={newTaskForm.projectId || undefined}
                                        onValueChange={(val) => setNewTaskForm(prev => ({ ...prev, projectId: val }))}
                                    >
                                        <SelectTrigger className="h-12 bg-card border-accent uppercase font-black text-[10px] w-full">
                                            <SelectValue placeholder="Selecciona un proyecto" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card text-primary border-white/10">
                                            {isFetchingTaskProjects ? (
                                                <SelectItem value="__loading" disabled>
                                                    Cargando proyectos...
                                                </SelectItem>
                                            ) : taskProjects.length === 0 ? (
                                                <SelectItem value="__none" disabled>
                                                    No hay proyectos disponibles
                                                </SelectItem>
                                            ) : (
                                                taskProjects.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.title}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Asignado a</Label>
                                    <Input
                                        value={newTaskForm.assignee}
                                        disabled
                                        className="h-12 bg-card border-accent uppercase font-bold text-sm opacity-50"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="p-6 border-t border-accent bg-card">
                                <Button type="button" variant="ghost" onClick={() => setIsNewTaskOpen(false)} className="text-[11px] font-black uppercase tracking-widest h-12 px-8 cursor-pointer">
                                    CANCELAR
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmittingTask || isFetchingTaskProjects}
                                    className="bg-primary text-background font-black uppercase text-[11px] h-12 px-10 tracking-widest cursor-pointer"
                                >
                                    {isSubmittingTask ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                    CREAR
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
                    <DialogContent className="max-w-150 bg-card border-white/10 text-primary p-0 overflow-hidden shadow-2xl">
                        <DialogHeader className="p-6 bg-card border-b border-accent">
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Nuevo Evento</DialogTitle>
                            <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                Crea un evento con descripción y selección de proyecto.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateEvent}>
                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Título del evento</Label>
                                    <Input
                                        value={newEventForm.title}
                                        onChange={(e) => setNewEventForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="h-12 bg-card border-accent uppercase font-bold text-sm"
                                        placeholder="Ej: Reunión de inicio"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Descripción</Label>
                                    <Textarea
                                        value={newEventForm.description}
                                        onChange={(e) => setNewEventForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="min-h-22.5 bg-card border-accent text-primary font-bold"
                                        placeholder="Escribe la descripción del evento"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fecha</Label>
                                    <Input
                                        type="date"
                                        value={newEventForm.dueDate}
                                        onChange={(e) => setNewEventForm(prev => ({ ...prev, dueDate: e.target.value }))}
                                        className="h-12 bg-card border-accent uppercase font-bold text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Proyecto</Label>
                                    <Select
                                        value={newEventForm.projectId || undefined}
                                        onValueChange={(val) => setNewEventForm(prev => ({ ...prev, projectId: val }))}
                                    >
                                        <SelectTrigger className="h-12 bg-card border-accent uppercase font-black text-[10px] w-full">
                                            <SelectValue placeholder="Selecciona un proyecto" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card text-primary border-white/10">
                                            {isFetchingEventProjects ? (
                                                <SelectItem value="__loading" disabled>
                                                    Cargando proyectos...
                                                </SelectItem>
                                            ) : eventProjects.length === 0 ? (
                                                <SelectItem value="__none" disabled>
                                                    No hay proyectos disponibles
                                                </SelectItem>
                                            ) : (
                                                eventProjects.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.title}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter className="p-6 border-t border-accent bg-card">
                                <Button type="button" variant="ghost" onClick={() => setIsNewEventOpen(false)} className="text-[11px] font-black uppercase tracking-widest h-12 px-8 cursor-pointer">
                                    CANCELAR
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmittingEvent || isFetchingEventProjects}
                                    className="bg-primary text-background font-black uppercase text-[11px] h-12 px-10 tracking-widest cursor-pointer"
                                >
                                    {isSubmittingEvent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                    CREAR
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* USER MENU & DIALOGS */}
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-11 flex items-center gap-3 px-3 hover:bg-secondary rounded-xl border border-transparent hover:border-white/5 transition-all cursor-pointer">
                                <div className="flex flex-col items-end leading-none sm:flex">
                                    <span className="text-xs font-bold text-primary uppercase tracking-tight">{user?.name || 'Usuario'}</span>
                                    <span className="text-[9px] text-primary font-black uppercase tracking-widest mt-0.5">{user?.role || 'Viewer'}</span>
                                </div>
                                <Avatar className="h-8 w-8 border-2 border-primary/20 bg-primary/10 shadow-primary/5">
                                    <AvatarFallback className="bg-transparent text-primary text-xs font-black">
                                        {user?.name?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60 bg-card border-white/10 text-primary shadow-sm p-1.5 rounded-xl">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2 py-2">Mi Perfil</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-[11px] font-bold uppercase tracking-tight focus:bg-primary/10 focus:text-primary rounded-lg py-2.5 px-3">
                                    <Settings className="mr-2.5 h-4 w-4" />
                                    Configuración
                                </DropdownMenuItem>
                            </DialogTrigger>

                            {user?.role === 'admin' && (
                                <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer text-[11px] font-bold uppercase tracking-tight focus:bg-primary/10 focus:text-primary rounded-lg py-2.5 px-3">
                                    <Shield className="mr-2.5 h-4 w-4 text-primary" />
                                    Panel Admin
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem onClick={logout} className="text-destructive  focus:text-destrctive focus:bg-destructive/10 cursor-pointer text-[11px] font-black uppercase tracking-widest rounded-lg py-2.5 px-3 mt-1">
                                <LogOut className="mr-2.5 h-4 w-4 text-destructive" />
                                CERRAR SESIÓN
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DialogContent className="sm:max-w-300 h-[85vh] bg-card border-accent text-primary p-0 overflow-hidden flex flex-col">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Configuración del Sistema</DialogTitle>
                            <DialogDescription>Gestione su perfil, preferencias y seguridad</DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="profile" orientation="vertical" className="w-full flex h-full">
                            <div className="flex flex-col h-full bg-card border-r border-accent w-72 shrink-0">
                                <div className="p-8 border-b border-accent bg-card">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                            <Settings className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-primary uppercase tracking-tighter">AJUSTES</h3>
                                            {/* <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-50">Terminal Maestro</p> */}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-accent">
                                        <Avatar className="h-8 w-8 border border-accent">
                                            <AvatarFallback className="text-[10px] font-black">{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-[12px] font-bold text-primary uppercase truncate">{user?.name}</span>
                                            <span className="text-[8px] text-primary font-black uppercase tracking-tighter">{user?.role}</span>
                                        </div>
                                    </div>
                                </div>

                                <ScrollArea className="flex-1">
                                    <TabsList className="flex flex-col h-auto bg-card p-4 justify-start w-full rounded-none gap-1.5">
                                        <TabsTrigger value="profile" className="w-full justify-start gap-3 h-11 px-4 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-secondary data-[state=active]:text-primary border border-transparent data-[state=active]:border-secondary transition-all rounded-sm">
                                            <UserIcon className="h-4 w-4" /> Perfil de Usuario
                                        </TabsTrigger>
                                        <TabsTrigger value="security" className="w-full justify-start gap-3 h-11 px-4 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all rounded-xl">
                                            <ShieldCheck className="h-4 w-4" /> Seguridad
                                        </TabsTrigger>
                                        <TabsTrigger value="notifications" className="w-full justify-start gap-3 h-11 px-4 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all rounded-xl">
                                            <BellIcon className="h-4 w-4" /> Notificaciones
                                        </TabsTrigger>
                                        <TabsTrigger value="appearance" className="w-full justify-start gap-3 h-11 px-4 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all rounded-xl">
                                            <Palette className="h-4 w-4" /> Apariencia
                                        </TabsTrigger>
                                        <Separator className="my-4 bg-white/5" />
                                        <TabsTrigger value="subscription" className="w-full justify-start gap-3 h-11 px-4 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all rounded-xl">
                                            <CreditCard className="h-4 w-4" /> Suscripción
                                        </TabsTrigger>
                                        <TabsTrigger value="billing" className="w-full justify-start gap-3 h-11 px-4 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all rounded-xl">
                                            <Receipt className="h-4 w-4" /> Facturación
                                        </TabsTrigger>
                                        <Separator className="my-4 bg-white/5" />
                                        <TabsTrigger value="support" className="w-full justify-start gap-3 h-11 px-4 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all rounded-xl">
                                            <LifeBuoy className="h-4 w-4" /> Soporte Técnico
                                        </TabsTrigger>
                                        <TabsTrigger value="docs" className="w-full justify-start gap-3 h-11 px-4 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all rounded-xl">
                                            <FileCode className="h-4 w-4" /> Privacidad y terminos de uso
                                        </TabsTrigger>
                                    </TabsList>
                                </ScrollArea>

                                <div className="p-6 border-t border-white/5">
                                    <Button variant="ghost" onClick={logout} className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive text-[10px] font-black uppercase tracking-widest h-11 rounded-xl cursor-pointer">
                                        <LogOut className="h-4 w-4" /> Cerrar Sesión
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col overflow-hidden bg-card">
                                {/* modificar despues */}
                                {/* <div className="h-16 border border-white/5 bg-card flex items-center justify-between px-8 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Sesión Activa:</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{user?.name}</span>
                                    </div>

                                    <div className="flex items-center gap-3 bg-card px-4 py-1.5 rounded-xl border border-accent">
                                        <div className="flex items-center gap-2">
                                            <Sun className="h-3 w-3 text-muted-foreground" />
                                            <Switch
                                                checked={theme === 'dark'}
                                                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                                            />
                                            <Moon className="h-3 w-3 text-primary" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 border-l border-white/10 pl-3">
                                            {theme === 'dark' ? 'MODO OSCURO ON' : 'MODO CLARO ON'}
                                        </span>
                                    </div>
                                </div> */}

                                <ScrollArea className="flex-1">
                                    <div className="p-10 max-w-3xl mx-auto space-y-10">
                                        <TabsContent value="profile" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black uppercase tracking-tight">Perfil de Usuario</h3>
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider ">Gestione su identidad digital y datos de contacto.</p>
                                            </div>
                                            <Separator className="bg-card" />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Nombre Completo</Label>
                                                    <Input defaultValue={user?.name} className="h-12 bg-card border-accent uppercase font-bold text-sm" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Correo Electrónico</Label>
                                                    <Input defaultValue={user?.email} disabled className="h-12 bg-card border-accent font-mono text-sm opacity-50" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Rol en la Plataforma</Label>
                                                    <div className="h-12 bg-primary/5 border border-primary/20 rounded-md px-4 flex items-center">
                                                        <Badge className="bg-primary text-background font-black uppercase text-[10px]">{user?.role}</Badge>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">ID de Usuario</Label>
                                                    <Input defaultValue={user?.id} disabled className="h-12 bg-card border-accent font-mono text-[10px] opacity-30" />
                                                </div>
                                            </div>
                                            <div className="pt-6 flex justify-end">
                                                <Button className="bg-primary text-background font-black uppercase text-[10px] h-11 px-10 tracking-widest cursor-pointer">
                                                    Actualizar Perfil
                                                </Button>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="security" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black uppercase tracking-tight">Seguridad y Acceso</h3>
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-60">Contraseñas y autenticación de dos factores.</p>
                                            </div>
                                            <Separator className="bg-card" />
                                            <div className="space-y-6">
                                                <div className="p-6 rounded-2xl bg-card border border-accent flex items-center justify-between group transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-card rounded-xl">
                                                            <Lock className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold uppercase">Contraseña</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black opacity-40">Último cambio: Hace 3 meses</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="default" className="text-[10px] font-black uppercase h-9 px-6 border-accent hover:bg-primary/40 cursor-pointer">Cambiar</Button>
                                                </div>
                                                <div className="p-6 rounded-2xl bg-card border border-accent flex items-center justify-between group transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-card rounded-xl">
                                                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold uppercase">Autenticación 2FA</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black opacity-40">Aumente la seguridad de su cuenta</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="default" className="text-[10px] font-black uppercase h-9 px-6 border-accent hover:bg-primary/40 cursor-pointer">Configurar</Button>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="appearance" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black uppercase tracking-tight">Apariencia</h3>
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-60">Personalice su entorno de trabajo visual.</p>
                                            </div>
                                            <Separator className="bg-card" />
                                            <div className="grid grid-cols-3 gap-6">
                                                <button
                                                    onClick={() => setTheme('light')}
                                                    className={cn("p-6 rounded-2xl border transition-all space-y-4 group", theme === 'light' ? 'bg-primary/10 border-primary shadow-xl shadow-primary/5' : 'bg-white/2 border-white/5 hover:border-white/20')}
                                                >
                                                    <div className="h-20 bg-card rounded-lg border border-neutral-200 flex items-center justify-center">
                                                        <Sun className="h-8 w-8 text-neutral-400 group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest block text-center">Claro</span>
                                                </button>
                                                <button
                                                    onClick={() => setTheme('dark')}
                                                    className={cn("p-6 rounded-2xl border transition-all space-y-4 group", theme === 'dark' ? 'bg-primary/10 border-primary shadow-xl shadow-primary/5' : 'bg-white/2 border-white/5 hover:border-white/20')}
                                                >
                                                    <div className="h-20 bg-card rounded-lg border border-white/10 flex items-center justify-center">
                                                        <Moon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest block text-center">Oscuro</span>
                                                </button>
                                                <button
                                                    onClick={() => setTheme('system')}
                                                    className={cn("p-6 rounded-2xl border transition-all space-y-4 group", theme === 'system' ? 'bg-primary/10 border-primary shadow-xl shadow-primary/5' : 'bg-white/2 border-white/5 hover:border-white/20')}
                                                >
                                                    <div className="h-20 bg-neutral-500 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden relative">
                                                        <div className="absolute inset-0 bg-white w-1/2" />
                                                        <Globe className="h-8 w-8 text-primary mix-blend-difference z-10 group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest block text-center">Sistema</span>
                                                </button>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="notifications" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black uppercase tracking-tight">Notificaciones</h3>
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-60">Configura cómo y cuándo deseas recibir avisos.</p>
                                            </div>
                                            <Separator className="bg-card" />
                                            <div className="p-6 rounded-2xl bg-card border border-accent">
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-60">
                                                    Contenido de Notificaciones en construcción.
                                                </p>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="subscription" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black uppercase tracking-tight">Suscripción</h3>
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-60">Gestiona tu plan y límites del sistema.</p>
                                            </div>
                                            <Separator className="bg-card" />
                                            <div className="p-6 rounded-2xl bg-card border border-accent">
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-60">
                                                    Contenido de Suscripción en construcción.
                                                </p>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="billing" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black uppercase tracking-tight">Facturación</h3>
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-60">Revisa pagos, métodos y facturas.</p>
                                            </div>
                                            <Separator className="bg-card" />
                                            <div className="p-6 rounded-2xl bg-card border border-accent">
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-60">
                                                    Contenido de Facturación en construcción.
                                                </p>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="support" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black uppercase tracking-tight">Soporte Técnico</h3>
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-60">Accede a ayuda y abre tickets.</p>
                                            </div>
                                            <Separator className="bg-card" />
                                            <div className="p-6 rounded-2xl bg-card border border-accent">
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-60">
                                                    Contenido de Soporte Técnico en construcción.
                                                </p>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="docs" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black uppercase tracking-tight">Documentación</h3>
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-60">Guías y recursos para aprender más.</p>
                                            </div>
                                            <Separator className="bg-card" />
                                            <div className="p-6 rounded-2xl bg-card border border-accent">
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-60">
                                                    Contenido de Documentación en construcción.
                                                </p>
                                            </div>
                                        </TabsContent>
                                    </div>
                                </ScrollArea>

                                {/* <div className="p-8 border-t border-accent bg-card shrink-0 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Info className="h-3.5 w-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Versión de Sistema v2.4.0 (Stable)</span>
                                    </div>
                                    <Button variant="ghost" onClick={() => setIsSettingsOpen(false)} className="text-[10px] font-black uppercase tracking-widest px-8 hover:bg-white/5">
                                        Cerrar Panel
                                    </Button>
                                </div> */}
                            </div>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>

            {/* PROJECT MANAGEMENT DIALOGS */}
            {activeProject && isAuthor && (
                <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                    <DialogContent className="min-w-300  bg-card border-accent text-primary p-0 overflow-hidden  flex flex-col h-[90vh]">
                        <DialogHeader className="p-8 bg-card border-b border-accent shrink-0 flex flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-card rounded-2xl border border-accent"><Settings className="h-6 w-6 text-muted-foreground" /></div>
                                <div>
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">CONFIGURACIÓN DEL PROYECTO</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Gestione la información general y los parámetros económicos.</DialogDescription>
                                </div>
                            </div>
                            {/* <Button variant="ghost" size="icon" onClick={() => setIsConfigOpen(false)} className="text-muted-foreground hover:text-[rimary"><X className="h-6 w-6" /></Button> */}
                        </DialogHeader>
                        <Tabs defaultValue="informacion" className="flex-1 flex flex-col overflow-hidden">
                            <div className="bg-secondary border-b border-accent shrink-0">
                                <TabsList className="h-14 bg-transparent p-0 gap-0 w-full" variant="default">
                                    <TabsTrigger value="informacion" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-white/5 text-[11px] font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-primary">INFORMACIÓN</TabsTrigger>
                                    <TabsTrigger value="parametros" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-white/5 text-[11px] font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-primary border-x">PARÁMETROS</TabsTrigger>
                                    <TabsTrigger value="niveles" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-white/5 text-[11px] font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-primary">NIVELES</TabsTrigger>
                                    <TabsTrigger value="modelobim" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-white/5 text-[11px] font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-primary">MODELO</TabsTrigger>
                                    <TabsTrigger value="permisos" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-white/5 text-[11px] font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-primary">PERMISOS</TabsTrigger>
                                </TabsList>
                            </div>
                            <ScrollArea className="flex-1 p-8">
                                <TabsContent value="informacion" className="mt-0 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nombre del Proyecto</Label><Input value={editProjectData.title} onChange={(e) => handleProjectDataChange('title', e.target.value)} className="h-12 bg-card border-accent uppercase font-bold text-sm" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cliente</Label><Input value={editProjectData.client} onChange={(e) => handleProjectDataChange('client', e.target.value)} className="h-12 bg-card border-accent uppercase font-bold text-sm" /></div>
                                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Ubicación</Label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={editProjectData.location} onChange={(e) => handleProjectDataChange('location', e.target.value)} className="h-12 pl-10 bg-card border-accent uppercase font-bold text-sm" /></div></div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Estado del Proyecto</Label>
                                            <Select value={editProjectData.status} onValueChange={(val) => handleProjectDataChange('status', val)}>
                                                <SelectTrigger className="h-12 bg-card border-accent uppercase font-black text-[10px]"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-card text-primary border-white/10"><SelectItem value="activo">ACTIVO</SelectItem><SelectItem value="construccion">EN CONSTRUCCIÓN</SelectItem><SelectItem value="espera">EN ESPERA</SelectItem><SelectItem value="finalizado">FINALIZADO</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="parametros" className="mt-0 space-y-10">
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] border-b border-accent pb-2">Coeficientes de Sobrecosto (%)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Utilidad</Label>
                                                <Input type="number" value={configParams.utility} onChange={(e) => updateConfigParam('utility', e.target.value)} className="h-11 bg-card border-accent font-mono text-primary font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Users className="h-3 w-3" /> Cargas Sociales</Label>
                                                <Input type="number" value={configParams.socialCharges} onChange={(e) => updateConfigParam('socialCharges', e.target.value)} className="h-11 bg-card border-accent font-mono text-primary font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Gastos Admin.</Label>
                                                <Input type="number" value={configParams.adminExpenses} onChange={(e) => updateConfigParam('adminExpenses', e.target.value)} className="h-11 bg-card border-accent font-mono text-primary font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Wrench className="h-3 w-3" /> Desgaste Herr.</Label>
                                                <Input type="number" value={configParams.toolWear} onChange={(e) => updateConfigParam('toolWear', e.target.value)} className="h-11 bg-card border-accent font-mono text-primary font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Lock className="h-3 w-3" /> Retención Gtia.</Label>
                                                <Input type="number" value={configParams.guaranteeRetention} onChange={(e) => updateConfigParam('guaranteeRetention', e.target.value)} className="h-11 bg-card border-accent font-mono text-primary font-bold" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] border-b border-accent pb-2">Impuestos de Ley (%)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Coins className="h-3 w-3" /> IVA</Label>
                                                <Input type="number" value={configParams.iva} onChange={(e) => updateConfigParam('iva', e.target.value)} className="h-11 bg-card border-accent font-mono text-primary font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Banknote className="h-3.5 w-3.5" /> Impuesto Transacción (IT)</Label>
                                                <Input type="number" value={configParams.it} onChange={(e) => updateConfigParam('it', e.target.value)} className="h-11 bg-card border-accent font-mono text-primary font-bold" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] border-b border-accent pb-2">Configuración Monetaria</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">Moneda Principal</Label>
                                                <Input value={configParams.mainCurrency} onChange={(e) => updateConfigParam('mainCurrency', e.target.value)} className="h-11 bg-card border-accent uppercase font-bold text-xs" placeholder="EJ: BS" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">Moneda Secundaria</Label>
                                                <Input value={configParams.secondaryCurrency} onChange={(e) => updateConfigParam('secondaryCurrency', e.target.value)} className="h-11 bg-card border-accent uppercase font-bold text-xs" placeholder="EJ: USD" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">Tipo de Cambio</Label>
                                                <Input type="number" step="0.01" value={configParams.exchangeRate} onChange={(e) => updateConfigParam('exchangeRate', e.target.value)} className="h-11 bg-card border-accent font-mono text-emerald-500 font-bold" />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="niveles" className="mt-0 space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div><h3 className="text-sm font-bold uppercase">Gestión de Niveles</h3></div>
                                        <Button onClick={handleAddLevel} size="sm" variant="default" className="bg-primary border-accent text-[10px] font-black uppercase text-background cursor-pointer"><PlusCircle className="h-3.5 w-3.5 mr-2" /> Añadir Nivel</Button>
                                    </div>
                                    <div className="space-y-3">{localLevels.map((lvl, idx) => (
                                        <div key={idx} className="flex items-center gap-4 bg-card border border-accent p-3 rounded-xl group hover:border-accent transition-all">
                                            <div className="h-8 w-8 rounded-lg bg-card flex items-center justify-center text-[10px] font-black text-muted-foreground">{idx + 1}</div>
                                            <Input value={lvl.name} onChange={(e) => handleLevelNameChange(idx, e.target.value)} className="flex-1 bg-card border-accent font-bold uppercase text-xs focus-visible:ring-0" />
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveLevel(idx)} className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 cursor-pointer"><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    ))}</div>
                                </TabsContent>
                                <TabsContent value="permisos" className="mt-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-tight">Permisos de Colaboradores</h3>
                                            <p className="text-[10px] text-muted-foreground uppercase mt-1 tracking-widest font-black">Configure el acceso por módulo para los usuarios de su obra.</p>
                                        </div>
                                    </div>
                                    <ScrollArea className="h-[420px] pr-2">
                                        <div className="space-y-4">
                                            {activeProject?.team?.filter((member: any) => member.id !== activeProject.authorId && member.type === 'personal').map((member: any) => (
                                                <div key={member.id} className="bg-card border border-accent rounded-xl overflow-hidden shadow-lg">
                                                    <div className="bg-secondary/50 p-4 border-b border-accent flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px] font-black">{member.name[0]}</AvatarFallback></Avatar>
                                                            <div>
                                                                <p className="text-xs font-black uppercase text-primary">{member.name}</p>
                                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{member.email}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-0 overflow-x-auto">
                                                        <table className="w-full text-left min-w-[400px]">
                                                            <thead>
                                                                <tr className="border-b border-accent bg-background/50">
                                                                    <th className="px-4 py-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Módulo</th>
                                                                    <th className="px-4 py-3 text-[10px] font-black uppercase text-center text-muted-foreground tracking-widest w-24">Ver</th>
                                                                    <th className="px-4 py-3 text-[10px] font-black uppercase text-center text-muted-foreground tracking-widest w-24">Editar</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-accent/50">
                                                                {PERMISSION_MODULES.map(mod => {
                                                                    const modPerms = member.permissions?.[mod.id] || { view: false, edit: false };
                                                                    return (
                                                                        <tr key={mod.id} className="hover:bg-white/5 transition-colors">
                                                                            <td className="px-4 py-3 text-[11px] font-bold text-primary uppercase flex items-center gap-2">
                                                                                {mod.icon && <mod.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                                                                                {mod.label}
                                                                            </td>
                                                                            <td className="px-4 py-3 text-center">
                                                                                <Switch
                                                                                    checked={modPerms.view}
                                                                                    onCheckedChange={(val) => handleTogglePermission(member.id, mod.id, 'view', val)}
                                                                                />
                                                                            </td>
                                                                            <td className="px-4 py-3 text-center">
                                                                                <Switch
                                                                                    checked={modPerms.edit}
                                                                                    onCheckedChange={(val) => handleTogglePermission(member.id, mod.id, 'edit', val)}
                                                                                />
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                            {activeProject?.team?.filter((member: any) => member.id !== activeProject.authorId && member.type === 'personal').length === 0 && (
                                                <div className="text-center py-10 opacity-50 bg-card border border-accent rounded-xl border-dashed">
                                                    <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Requieres invitar como mínimo a un colaborador para ajustar sus permisos.</p>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                                <TabsContent value="modelobim" className="mt-0 space-y-6">
                                    <div className="flex items-center justify-between mb-4">modelobim
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                            <DialogFooter className="p-8 border-t border-accent  shrink-0">
                                <Button variant="ghost" onClick={() => setIsConfigOpen(false)} className="text-[11px] font-black uppercase tracking-widest h-12 px-8 cursor-pointer">CANCELAR</Button>
                                <Button onClick={handleSaveConfig} disabled={isSubmittingProject} className="bg-primary text-background font-black uppercase text-[11px] h-12 px-10 tracking-widest cursor-pointer">{isSubmittingProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} GUARDAR</Button>
                            </DialogFooter>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            )}

            {activeProject && (
                <Dialog open={isTeamOpen} onOpenChange={setIsTeamOpen}>
                    <DialogContent className="max-w-2xl bg-card border-accent text-primary p-0 overflow-hidden shadow-2xl flex flex-col h-[85vh]">
                        <DialogHeader className="p-6 bg-card border-b border-accent shrink-0 flex flex-row items-center space-y-0 gap-3">
                            <Users className="h-6 w-6 text-primary" />
                            <div><DialogTitle className="text-xl font-bold uppercase tracking-tight">Personal del Proyecto</DialogTitle><DialogDescription className="text-muted-foreground text-[10px] font-black uppercase mt-1">Gestión de equipo y responsables</DialogDescription></div>
                        </DialogHeader>
                        <Tabs defaultValue="current" className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 bg-secondary border-b border-accent shrink-0">
                                <TabsList className="h-12 bg-transparent p-0 gap-0 w-full" variant="line">
                                    <TabsTrigger value="current" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-[10px] font-black uppercase">EQUIPO TÉCNICO</TabsTrigger>
                                    <TabsTrigger value="add" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-[10px] font-black uppercase border-l">AÑADIR PERSONAL</TabsTrigger>
                                    <TabsTrigger value="invite" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-[10px] font-black uppercase border-l">COLABORADORES</TabsTrigger>
                                </TabsList>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <TabsContent value="current" className="h-full m-0"><ScrollArea className="h-full p-6"><div className="space-y-3">{activeProject.team?.map((member: any) => (
                                    <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-accent group hover:border-primary/30 transition-all shadow-lg">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 border border-white/10"><AvatarFallback className="bg-card text-primary text-xs font-black uppercase">{member.name[0]}</AvatarFallback></Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-white uppercase">{member.name}</span>
                                                <Badge variant="outline" className="text-[7px] h-4 border-accent bg-card font-black uppercase mt-1">{member.type}</Badge>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => handleRemoveTeamMember(member.id)} disabled={isSubmittingProject}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}</div></ScrollArea></TabsContent>
                                <TabsContent value="add" className="h-full m-0 flex flex-col overflow-hidden">
                                    <div className="p-6 border-b border-accent bg-card space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="BUSCAR EN EL DIRECTORIO..." className="pl-10 h-11 bg-white/5 border-white/10 text-[10px] font-bold uppercase tracking-widest" value={teamSearchTerm} onChange={(e) => setTeamSearchTerm(e.target.value)} />
                                        </div>
                                    </div>
                                    <ScrollArea className="flex-1 p-6">
                                        <div className="space-y-3">{isFetchingLibrary ? <div className="flex flex-col items-center justify-center py-20 opacity-20 gap-3"><Loader2 className="h-8 w-8 animate-spin" /><p className="text-[10px] font-black uppercase tracking-widest">Consultando Directorio...</p></div> : filteredLibraryContacts.map((contact) => (
                                            <div key={contact.id} className="flex items-center justify-between p-4 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all group">
                                                <div className="flex items-center gap-4"><Avatar className="h-10 w-10 border border-white/10 opacity-60 group-hover:opacity-100 transition-opacity"><AvatarFallback className="text-[10px] font-black uppercase">{contact.name[0]}</AvatarFallback></Avatar><div className="flex flex-col"><span className="text-xs font-bold text-white uppercase">{contact.name}</span><span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mt-1">{contact.type}</span></div></div>
                                                <Button size="sm" className="h-8 bg-secondary hover:bg-primary/90 text-primary hover:text-black font-black text-[9px] uppercase tracking-widest px-4 rounded-lg cursor-pointer" onClick={() => handleAddTeamMember(contact.id)} disabled={isSubmittingProject}><Plus className="h-3 w-3 mr-1.5" /> Adicionar</Button>
                                            </div>
                                        ))}</div>
                                    </ScrollArea>
                                </TabsContent>
                                <TabsContent value="invite" className="h-full m-0 flex flex-col overflow-hidden">
                                    <div className="p-8 space-y-8">
                                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/20 rounded-lg"><UserPlus className="h-5 w-5 text-primary" /></div>
                                                <h3 className="text-sm font-black uppercase tracking-tight">Invitar Colaborador Externo</h3>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold leading-relaxed">
                                                El usuario invitado recibirá acceso completo de edición a esta terminal de proyecto una vez que inicie sesión con su correo.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <Mail className="h-3.5 w-3.5 text-primary" /> Correo Electrónico
                                                </Label>
                                                <Input
                                                    type="email"
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                    placeholder="ejemplo@correo.com"
                                                    className="h-12 bg-white/5 border-white/10 font-mono text-sm"
                                                />
                                            </div>
                                            <Button
                                                onClick={handleInviteSubmit}
                                                disabled={isSubmittingProject || !inviteEmail}
                                                className="w-full bg-primary text-black font-black uppercase text-[11px] h-12 tracking-widest shadow-xl shadow-primary/20 cursor-pointer"
                                            >
                                                {isSubmittingProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                                Enviar Invitación de Colaboración
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                        <DialogFooter className="p-4 border-t border-white/5 bg-black shrink-0"><Button variant="ghost" onClick={() => setIsTeamOpen(false)} className="w-full text-[9px] font-black uppercase tracking-[0.2em] h-10 hover:bg-white/5 cursor-pointer">Cerrar Terminal de Equipo</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            )}


            {activeProject && (
                <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
                    <DialogContent className="max-w-2xl bg-card border-accent text-primary p-0 overflow-hidden  flex flex-col h-[85vh]">
                        <DialogHeader className="p-6 bg-card border-b border-accent shrink-0 flex flex-row items-center space-y-0 gap-3">
                            <BookOpen className="h-6 w-6 text-primary" />
                            <div><DialogTitle className="text-xl font-bold uppercase tracking-tight">Bitácora Maestra</DialogTitle><DialogDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Historial cronológico de obra</DialogDescription></div>
                        </DialogHeader>
                        <div className="flex-1 overflow-hidden p-6">
                            <ScrollArea className="h-full pr-4">
                                {activeProject.siteLogs?.length > 0 ? (
                                    <div className="space-y-6 relative pl-4">
                                        <div className="absolute left-2.75 top-2 bottom-2 w-px bg-primary" />
                                        {activeProject.siteLogs.map((log: any) => (
                                            <div key={log.id} className="relative pl-10 group">
                                                <div className={cn("absolute left-0 top-1.5 h-6 w-6 rounded-full border-2 border-accent flex items-center justify-center z-10", log.type === 'incident' ? 'bg-red-500' : log.type === 'milestone' ? 'bg-emerald-500' : 'bg-secondary')}>
                                                    <Clock className="h-3 w-3 text-primary" />
                                                </div>
                                                <div className="p-4 rounded-2xl bg-card border border-accent hover:border-primary transition-all space-y-2">
                                                    <div className="flex items-center justify-between"><span className="text-[10px] font-mono font-black text-muted-foreground uppercase">{new Date(log.date).toLocaleString('es-ES')}</span><Badge variant="default" className="text-[7px] font-black uppercase border-none h-4 ">{log.type}</Badge></div>
                                                    <p className="text-xs font-bold text-primary leading-relaxed uppercase">{log.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-40 opacity-20 gap-4"><BookOpen className="h-12 w-12" /><p className="text-[10px] font-black uppercase tracking-widest">Sin registros en bitácora</p></div>
                                )}
                            </ScrollArea>
                        </div>
                        <DialogFooter className="p-4 border-t border-accent bg-card shrink-0"><Button variant="ghost" onClick={() => setIsLogOpen(false)} className="w-full text-[9px] font-black uppercase h-10 hover:bg-white/5 bg-primary text-background cursor-pointer">Cerrar Historial</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* {activeProject && isAuthor && (
                <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                    <DialogContent className="sm:max-w-106.25 bg-[#0a0a0a] border-white/10 text-primary p-0 overflow-hidden ">
                        <form onSubmit={handleInviteSubmit}>
                            <DialogHeader className="p-6 bg-white/2 border-b border-white/5"><div className="flex items-center gap-3"><div className="p-2 bg-blue-500/20 rounded-lg"><UserPlus className="h-6 w-6 text-blue-400" /></div><div><DialogTitle className="text-xl font-bold uppercase tracking-tight">Invitar Colaborador</DialogTitle></div></div></DialogHeader>
                            <div className="p-6 space-y-6">
                                <div className="space-y-3"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Correo del Usuario</Label><Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="ejemplo@correo.com" required className="h-12 bg-white/5 border-white/10 font-mono text-sm" /></div>
                            </div>
                            <DialogFooter className="p-6 border-t border-white/5 bg-black/20"><Button type="button" variant="ghost" onClick={() => setIsInviteModalOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSubmittingProject} className="bg-blue-500 text-primary font-black text-[10px] uppercase h-11 px-8 shadow-xl">{isSubmittingProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Enviar</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )} */}
        </nav>
    );
}
