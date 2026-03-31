
"use client";

import { Bell, LogOut, Sun, Moon, Box, Layers, Users, FolderOpen, Shield, Ruler, Truck, Settings, User as UserIcon, Bell as BellIcon, Lock, CreditCard, FileText, Wrench, Check, X, Info, AlertTriangle, CheckCircle2, Trash2, Landmark, Receipt, CheckSquare, Clock, Handshake, Palette, Menu, Building2, Calendar, Smartphone, Globe, ShieldCheck, LifeBuoy, FileCode, Activity, Presentation, PlusCircle, Save, UserPlus, Send, Hammer, ShoppingCart, Package, Banknote, BookOpen, Coins, MapPin, TrendingUp, Search, SquareLibrary, Blocks, Loader2, Plus, Mail, Drill, Boxes, Inbox, ChevronRight, PenTool, LayoutGrid, Scale, List } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '../../components/ui/navigation-menu';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Notification, Task, Contact, Project, ProjectConfig, TaskPriority, TaskStatus } from '@/types/types';
import { getNotifications, markAsRead, deleteNotification } from '@/actions';
import { getTasks, createTask, deleteTask, updateTask, getContacts, getUpcomingEvents } from '@/actions';
import { getProjectById, getProjects, updateProject as updateProjectAction, addContactToProject, removeContactFromProject, inviteCollaborator, updateProjectContactPermissions, getMyProjectPermissions, getInboxSummary } from '@/actions';

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

import { AiChatModal } from '@/components/layout/modals/IAChatModal';
import { useSensors, useSensor, PointerSensor, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import Logo from '../logo';

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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Estado para menú móvil
    const { toast } = useToast();

    // Project Modals State
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isTeamOpen, setIsTeamOpen] = useState(false);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isSubmittingProject, setIsSubmittingProject] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Tasks State
    const [tasks, setTasks] = useState<(Task & { projectName?: string })[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'kanban'>('kanban');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [pendingTasksCount, setPendingTasksCount] = useState(0);
    // const { toast } = useToast();

    // New Event Modal State
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

    const [inboxSummary, setInboxSummary] = useState({
        notifications: 0,
        tasks: 0,
        events: 0,
        hasUpdates: false,
        totalUnread: 0
    });

    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [hasFetchedDetails, setHasFetchedDetails] = useState(false);

    useEffect(() => {
        const fetchInbox = async () => {
            const summary = await getInboxSummary();
            if (summary) {
                setInboxSummary(summary);
                // Also update individual counts to keep them in sync
                setUnreadCount(summary.notifications);
                setPendingTasksCount(summary.tasks);
            }
        };

        fetchInbox();

        // Opcional: Polling cada 3 minutos para mantenerlo actualizado 
        // sin saturar el servidor si el usuario deja la pestaña abierta
        const interval = setInterval(fetchInbox, 3 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const [localLevels, setLevels] = useState<{ id?: string, name: string }[]>([]);

    const isAuthor = useMemo(() => user?.id === activeProject?.authorId, [user?.id, activeProject?.authorId]);

    const fetchData = useCallback(async () => {
        if (user?.id && !isFetchingDetails) {
            setIsFetchingDetails(true);
            try {
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
                setHasFetchedDetails(true);
            } catch (error) {
                console.error("Error fetching inbox details:", error);
            } finally {
                setIsFetchingDetails(false);
            }
        }
    }, [user?.id, isFetchingDetails]);

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
            // Note: fetchData is now called on demand when opening the inbox
            fetchProjectContext();
        }
    }, [isAuthenticated, fetchProjectContext]);

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

                return { ...c, permissions: { ...currentPerms, [moduleId]: newModPerms } };
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
            toast({ variant: 'destructive', title: 'Error de permisos', description: error.message });
            setActiveProject((prev: any) => prev ? { ...prev, team: previousTeam } : null);
        }
    };

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


    ////////////// task ///////////////////
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'media' as TaskPriority,
        projectId: '',
        assignee: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pendiente' as TaskStatus
    });

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
        // Note: loadDataTasks is now called on demand when opening the inbox
    }, []);

    async function loadDataTasks() {
        setLoading(true);
        try {
            const [tasksData, projectsData] = await Promise.all([
                getTasks(),
                getProjects()
            ]);
            setTasks(tasksData as any);
            setProjects(projectsData);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudieron cargar las tareas.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    const filteredTasks = useMemo(() => {
        return tasks.filter(task =>
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (task.projectName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [tasks, searchTerm]);

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case 'alta': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'media': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'baja': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            default: return 'text-muted-foreground';
        }
    };

    const getStatusLabel = (status: TaskStatus) => {
        switch (status) {
            case 'pendiente': return 'Pendiente';
            case 'enprogreso': return 'En Progreso';
            case 'completado': return 'Completado';
            default: return status;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            priority: 'media',
            projectId: '',
            assignee: '',
            dueDate: new Date().toISOString().split('T')[0],
            status: 'pendiente'
        });
        setEditingTaskId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.projectId) {
            toast({ title: "Error", description: "Debe seleccionar un proyecto.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);

        const result = await createTask(formData as any);
        if (result.success) {
            toast({ title: "Tarea creada", description: "La nueva tarea ha sido añadida exitosamente." });
            loadDataTasks();
            setIsCreateOpen(false);
            resetForm();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    const handleEditClick = (task: any) => {
        setEditingTaskId(task.id);
        setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            projectId: task.projectId || '',
            assignee: task.assignee || '',
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            status: task.status
        });
        setIsEditOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTaskId) return;
        setIsSubmitting(true);

        const result = await updateTask(editingTaskId, formData as any);
        if (result.success) {
            toast({ title: "Tarea actualizada", description: "Los cambios han sido guardados correctamente." });
            loadDataTasks();
            setIsEditOpen(false);
            resetForm();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

        const result = await deleteTask(id);
        if (result.success) {
            toast({ title: "Tarea eliminada", description: "La tarea ha sido removida del sistema.", variant: "destructive" });
            loadDataTasks();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;

        let newStatus: TaskStatus;
        if (['pendiente', 'enprogreso', 'completado'].includes(overId)) {
            newStatus = overId as TaskStatus;
        } else {
            const overTask = tasks.find(t => t.id === overId);
            if (!overTask) return;
            newStatus = overTask.status as TaskStatus;
        }

        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status === newStatus) return;

        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
        setTasks(updatedTasks);

        try {
            const result = await updateTask(taskId, { status: newStatus });
            if (!result.success) throw new Error(result.error);
        } catch (error) {
            toast({ title: "Error al mover tarea", variant: "destructive" });
            loadDataTasks();
        }
    };
    ///////////// eventos ///////////    
    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventForm.title.trim() || !newEventForm.projectId || !newEventForm.dueDate) return;

        setIsSubmittingEvent(true);
        try {
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
                fetchData();
            } else {
                toast({ variant: "destructive", title: "Error", description: (result as any)?.error });
            }
        } catch (error: any) {
            console.error(error);
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

    const updateConfigParam = (key: keyof ProjectConfig, value: string) => {
        setConfigParams(prev => ({ ...prev, [key]: (key === 'mainCurrency' || key === 'secondaryCurrency') ? value : (parseFloat(value) || 0) }));
    };

    const handleAddLevel = () => setLevels(prev => [...prev, { name: `Nuevo Nivel ${prev.length + 1}` }]);
    const handleRemoveLevel = (index: number) => setLevels(prev => prev.filter((_, i) => i !== index));
    const handleLevelNameChange = (index: number, name: string) => setLevels(prev => prev.map((l, i) => i === index ? { ...l, name } : l));
    const handleProjectDataChange = (field: string, value: string) => setEditProjectData(prev => ({ ...prev, [field]: value }));

    const projectTools = useMemo(() => [
        { name: 'PIZARRA', icon: Presentation, url: `/projects/${activeProject?.id}/board`, permissionId: 'board' },
        { name: 'DISEÑO', icon: Layers, url: `/projects/${activeProject?.id}/design`, permissionId: 'design' },
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

    const { canView, canEdit } = useProjectPermissions();
    const canView2 = (moduleId: string | null): boolean => {
        if (isProjectAuthor || moduleId === null) return true;
        if (!myPermissions) return true;
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
            <div className="flex items-center gap-4"><div className="size-7" /></div>
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
        <nav className="h-14 border-b md:border-2 md:border-foreground/10 bg-card flex items-center px-2 md:px-4 justify-between sticky top-0 z-40 md:rounded-lg md:m-3 shadow-sm md:shadow-none">
            <div className="flex items-center gap-2 md:gap-6">

                {/* MENÚ MÓVIL (SHEET) */}
                <div className="block lg:hidden">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[85vw] max-w-[350px] bg-card border-accent p-0 flex flex-col">
                            <SheetHeader className="p-4 border-b border-accent text-left">
                                <SheetDescription />
                                <SheetTitle className="text-lg font-black uppercase tracking-tighter text-primary flex items-center gap-2">
                                    <Link href='/dashboard'><Logo size={24} className="grayscale" /></Link>
                                    Bimus
                                </SheetTitle>
                            </SheetHeader>
                            <ScrollArea className="flex-1 pb-4 h-[600px]">
                                <div className="p-4 space-y-6">
                                    {/* Módulos Principales */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Módulos Globales</p>
                                        <Link href="/projects" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-primary/10 text-primary transition-colors">
                                            <Blocks className="h-5 w-5" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Proyectos</span>
                                        </Link>
                                        <Link href="/accounting" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-primary/10 text-primary transition-colors h-fit">
                                            <Landmark className="h-5 w-5" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Contabilidad de Proyectos</span>
                                        </Link>
                                        <Link href="/community" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-primary/10 text-primary transition-colors">
                                            <Handshake className="h-5 w-5" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Comunidad</span>
                                        </Link>
                                    </div>

                                    <Separator className="bg-accent" />

                                    {/* Librería */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Librería Maestro</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Link href="/library/construction/supplies" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-primary transition-colors border border-accent">
                                                <Box className="h-4 w-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Insumos</span>
                                            </Link>
                                            <Link href="/library/construction/items" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-primary transition-colors border border-accent">
                                                <Boxes className="h-4 w-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Items / Partidas</span>
                                            </Link>
                                            <Link href="/library/construction/assets" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-primary transition-colors border border-accent">
                                                <Truck className="h-4 w-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Activos Fijos</span>
                                            </Link>
                                            <Link href="/library/design/cad" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-primary transition-colors border border-accent">
                                                <PenTool className="h-4 w-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Cad</span>
                                            </Link>
                                            <Link href="/library/design/models" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-primary transition-colors border border-accent">
                                                <LayoutGrid className="h-4 w-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Modelos</span>
                                            </Link>
                                            <Link href="/library/contacts" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-primary transition-colors border border-accent">
                                                <Users className="h-4 w-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Directorio Contactos</span>
                                            </Link>
                                            <Link href="/library/parameters/units" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-primary transition-colors border border-accent">
                                                <Scale className="h-4 w-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Unidades de Medida</span>
                                            </Link>
                                            <Link href="/library/parameters/chapters" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-primary transition-colors border border-accent">
                                                <List className="h-4 w-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Capitulos</span>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Proyecto Activo Herramientas (Si hay uno) */}
                                    {activeProject && (
                                        <>
                                            <Separator className="bg-accent" />
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                                                    <Building2 className="h-3 w-3" /> Proyecto Activo
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {projectTools.map((tool, idx) => {
                                                        const allowed = canView2(tool.permissionId);
                                                        return (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    if (allowed) {
                                                                        setIsMobileMenuOpen(false);
                                                                        tool.url ? router.push(tool.url) : tool.onClick?.();
                                                                    }
                                                                }}
                                                                disabled={!allowed}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-center transition-all",
                                                                    allowed ? "bg-card border-accent text-primary hover:border-primary" : "bg-card/50 border-accent/50 text-muted-foreground/30"
                                                                )}
                                                            >
                                                                <tool.icon className="h-5 w-5" />
                                                                <span className="text-[8px] font-black uppercase tracking-widest leading-tight">{tool.name}</span>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>
                </div>

                <Link href="/dashboard" className="items-center space-x-2 mr-2 md:mr-4 cursor-pointer  hidden md:flex">
                    <div><Image src="/Grupo.svg" className='h-6 w-6 md:h-8 md:w-8' alt="grupo" width={24} height={24} /></div>
                    <span className="text-lg font-black tracking-tighter font-headline text-primary uppercase hidden sm:block">Bim<span className="text-primary/50">us</span></span>
                </Link>

                {/* MENÚ ESCRITORIO (Oculto en móviles) */}
                <div className="hidden lg:flex items-center gap-4">
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:bg-secondary">
                                    <Menu className="h-6 w-6" />
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-100 gap-3 p-4 md:w-125 md:grid-cols-2 lg:w-150 bg-card border border-accent h-fit">
                                        <li className="row-span-3">
                                            <NavigationMenuLink asChild>
                                                <Link className="flex h-full w-full select-none flex-col justify-end rounded-md from-primary/20 to-primary/5 p-6 no-underline outline-none focus:shadow-md hover:bg-secondary" href="/projects">
                                                    <Blocks className="h-6 w-6 text-primary" />
                                                    <div className="mb-2 mt-4 text-lg font-black uppercase tracking-tighter text-primary">Gestión de Proyectos</div>
                                                    <p className="text-[10px] leading-tight text-muted-foreground font-bold uppercase">Gestión y supervisión de proyectos.</p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <li>
                                            <NavigationMenuLink asChild>
                                                <Link href="/accounting" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary">
                                                    <div className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Landmark className="h-3.5 w-3.5" /> Contabilidad de Proyectos</div>
                                                    <p className="line-clamp-2 text-[9px] font-bold uppercase text-muted-foreground">Control financiero y balances globales.</p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <li>
                                            <NavigationMenuLink asChild>
                                                <Link href="/community" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary">
                                                    <div className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Handshake className="h-3.5 w-3.5" /> Comunidad</div>
                                                    <p className="line-clamp-2 text-[9px] font-bold uppercase text-muted-foreground">Interacción y colaboración entre usuarios.</p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                                    <SquareLibrary className="h-6 w-6" />
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <div className="p-4 w-70 space-y-2 bg-popover border border-muted/50 rounded-xl shadow-lg">
                                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 mb-1 py-2">Construcción</div>
                                        <NavigationMenuLink asChild>
                                            <Link href="/library/construction/supplies" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all">
                                                <Box className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Insumos</span>
                                            </Link>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink asChild>
                                            <Link href="/library/construction/items" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all">
                                                <Layers className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Items / Partidas</span>
                                            </Link>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink asChild>
                                            <Link href="/library/construction/assets" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all">
                                                <Truck className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Activos Fijos</span>
                                            </Link>
                                        </NavigationMenuLink>

                                        <div className="h-px bg-white/5 my-2"></div>
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
                                        </NavigationMenuLink>

                                        <div className="h-px bg-white/5 my-2"></div>
                                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 mb-1">Directorio</div>
                                        <NavigationMenuLink asChild>
                                            <Link href="/library/contacts" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all">
                                                <Users className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Contactos</span>
                                            </Link>
                                        </NavigationMenuLink>

                                        <div className="h-px bg-white/5 my-2"></div>
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
                            <Link href={`/projects/${activeProject.id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <div className="p-1.5 bg-primary rounded-lg border border-accent"><Building2 className="h-4 w-4 text-background" /></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none truncate max-w-37.5 pl-2">{activeProject.title}</span>
                                    <Badge variant="outline" className={cn("text-[7px] h-3.5 font-black uppercase px-1.5 border-none mt-1", activeProject.status === 'activo' || activeProject.status === 'construccion' ? "text-emerald-500" : "text-amber-500")}>
                                        {activeProject.status}
                                    </Badge>
                                </div>
                            </Link>

                            <div className="flex items-center gap-1.5 p-1 bg-card rounded-xl ml-2">
                                <TooltipProvider>
                                    {projectTools.map((tool, idx) => {
                                        const allowed = canView2(tool.permissionId);
                                        return (
                                            <Tooltip key={idx}>
                                                <TooltipTrigger asChild>
                                                    <button onClick={() => allowed ? (tool.url ? router.push(tool.url) : tool.onClick?.()) : undefined} disabled={!allowed} className={cn("relative flex items-center justify-center h-8 w-8 border-none rounded-lg transition-all group active:scale-90", allowed ? "hover:bg-primary/40 cursor-pointer" : "opacity-30 cursor-not-allowed")}>
                                                        <tool.icon className={cn("w-3.5 h-3.5 transition-colors", allowed ? "text-muted-foreground group-hover:text-primary" : "text-muted-foreground")} />
                                                        {!allowed && <Lock className="absolute bottom-0 right-0 h-2.5 w-2.5 text-muted-foreground/60" />}
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

            <div className="flex items-center gap-1 md:gap-2">
                {/* <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-9 w-9 rounded-xl hover:bg-secondary transition-all cursor-pointer" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun className="h-4 w-4 md:h-4.5 md:w-4.5" /> : <Moon className="h-4 w-4 md:h-4.5 md:w-4.5" />}
                </Button> */}

                <AiChatModal />

                <DropdownMenu onOpenChange={(open) => {
                    if (open && !hasFetchedDetails) {
                        fetchData();
                    }
                }}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative h-9 w-9 rounded-xl hover:bg-secondary transition-all cursor-pointer">
                            <Inbox className="h-4 w-4 md:h-4.5 md:w-4.5" />
                            {/* {(unreadCount > 0 || pendingTasksCount > 0 || upcomingEvents.length > 0) && (
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 md:w-3 md:h-3 bg-amber-500 rounded-full border-2 border-background animate-pulse"></span>
                            )} */}
                            {inboxSummary.hasUpdates && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                    {inboxSummary.totalUnread}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[calc(100vw-1rem)] sm:w-96 bg-card border-accent text-primary p-0 overflow-hidden rounded-xl">
                        <Tabs defaultValue="notifications" className="w-full gap-0">
                            <div className="p-3 bg-card border-b border-accent flex flex-col gap-3">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Bandeja Área de trabajo</span>
                                </div>
                                <TabsList className="grid grid-cols-3 h-9 bg-card border border-accent p-1 rounded-lg w-full">
                                    <TabsTrigger value="notifications" className="text-[9px] font-black uppercase tracking-widest rounded-md">Notificaciones
                                        {(unreadCount > 0) && (
                                            <span className="absolute top-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-amber-500 rounded-full border-2 border-background animate-pulse"></span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="tasks" className="text-[9px] font-black uppercase tracking-widest rounded-md">Tareas
                                        {(pendingTasksCount > 0) && (
                                            <span className="absolute top-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-amber-500 rounded-full border-2 border-background animate-pulse"></span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="events" className="text-[9px] font-black uppercase tracking-widest rounded-md">Eventos
                                        {(upcomingEvents.length > 0) && (
                                            <span className="absolute top-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-amber-500 rounded-full border-2 border-background animate-pulse"></span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            <ScrollArea className="h-[50vh] sm:h-80">

                                {/* TAB NOTIFICACIONES */}
                                <TabsContent value="notifications" className="m-0 border-none outline-none">
                                    {isFetchingDetails && !hasFetchedDetails ? (
                                        <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-3 opacity-20">
                                            <Loader2 className="h-10 w-10 animate-spin" />
                                            <p className="text-[10px] font-black uppercase">Cargando...</p>
                                        </div>
                                    ) : notifications.length > 0 ? (
                                        <div className="flex flex-col">
                                            {notifications.map((n) => (
                                                <div key={n.id} className={cn("p-4 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors relative group", !n.isRead && "bg-primary/5")}>
                                                    <div className="flex gap-3">
                                                        <NotificationIcon type={n.type as any} />
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <p className="text-[11px] font-bold uppercase leading-tight">{n.title}</p>
                                                                <button onClick={() => handleDeleteNotification(n.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 className="h-3 w-3" /></button>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground leading-relaxed">{n.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-3 opacity-20"><BellIcon className="h-10 w-10" /><p className="text-[10px] font-black uppercase">Sin Notificaciones</p></div>
                                    )}
                                </TabsContent>

                                {/* TAB TAREAS */}
                                <TabsContent value="tasks" className="m-0 border-none outline-none">
                                    {isFetchingDetails && !hasFetchedDetails ? (
                                        <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-3 opacity-20">
                                            <Loader2 className="h-10 w-10 animate-spin" />
                                            <p className="text-[10px] font-black uppercase">Cargando...</p>
                                        </div>
                                    ) : tasks.filter(t => t.status !== 'completado').length > 0 ? (
                                        <div className="flex flex-col p-0 m-0 gap-0">
                                            {tasks.filter(t => t.status !== 'completado').map((t) => (
                                                <div key={t.id} className={cn("p-4 border-b border-accent last:border-0 hover:bg-muted/40 transition-colors relative group")}>
                                                    <div className="flex gap-3">
                                                        <CheckSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <p className="text-[11px] font-bold uppercase leading-tight">{t.title}</p>
                                                                {/* Nota: si tienes función handleDeleteTask, reemplaza el console.log */}
                                                                <button onClick={() => console.log('Eliminar', t.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 className="h-3 w-3" /></button>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{t.description || 'Sin descripción'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-3 opacity-20"><CheckSquare className="h-10 w-10" /><p className="text-[10px] font-black uppercase">Sin Tareas</p></div>
                                    )}
                                </TabsContent>

                                {/* TAB EVENTOS */}
                                <TabsContent value="events" className="m-0 border-none outline-none">
                                    {isFetchingDetails && !hasFetchedDetails ? (
                                        <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-3 opacity-20">
                                            <Loader2 className="h-10 w-10 animate-spin" />
                                            <p className="text-[10px] font-black uppercase">Cargando...</p>
                                        </div>
                                    ) : upcomingEvents.length > 0 ? (
                                        <div className="flex flex-col">
                                            {upcomingEvents.map((e) => (
                                                <div key={e.id} className="p-4 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors relative group">
                                                    <div className="flex gap-3">
                                                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <p className="text-[11px] font-bold uppercase leading-tight">{e.title}</p>
                                                                {/* Nota: si tienes función handleDeleteEvent, reemplaza el console.log */}
                                                                <button onClick={() => console.log('Eliminar', e.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 className="h-3 w-3" /></button>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground leading-relaxed">{e.project || 'Evento general'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-3 opacity-20"><Calendar className="h-10 w-10" /><p className="text-[10px] font-black uppercase">Sin Eventos</p></div>
                                    )}
                                </TabsContent>
                            </ScrollArea>

                            <div className="p-3 bg-card border-t border-accent text-center flex flex-col gap-2">
                                <Button variant="default" className="w-full text-[10px] font-black uppercase tracking-widest h-9 hover:bg-primary/80 bg-primary text-background cursor-pointer" onClick={() => router.push('/workspace')}>
                                    Abrir Área de Trabajo
                                </Button>
                            </div>
                        </Tabs>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-11 flex items-center gap-3 px-3 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all">
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
                            <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 cursor-pointer text-[11px] font-black uppercase tracking-widest rounded-lg py-2.5 px-3 mt-1">
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
                                <div className="h-16 border border-white/5 bg-card flex items-center justify-between px-8 shrink-0">
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
                                </div>

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

                            </div>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>
        </nav>
    );
}


