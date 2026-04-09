
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
import { getTasks, createTask, deleteTask, updateTask, getContacts, getUpcomingEvents, createCalendarEvent } from '@/actions';
import { getProjectById, getProjects, updateProject as updateProjectAction, addContactToProject, removeContactFromProject, inviteCollaborator, updateProjectContactPermissions, getMyProjectPermissions, getInboxSummary, updateProfile } from '@/actions';

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
import { Checkbox } from "../../components/ui/checkbox";
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
    const { user, logout, isAuthenticated, updateUser } = useAuth();
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
        startDate: '',
        imageUrl: ''
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

    // Profile Update State
    const [profileForm, setProfileForm] = useState({
        name: '',
        telefono: '',
        cargo: ''
    });
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || '',
                telefono: user.telefono || '',
                cargo: user.cargo || ''
            });
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        setIsUpdatingProfile(true);
        try {
            const res = await updateProfile(profileForm);
            if (res.success) {
                toast({ title: "Perfil actualizado", description: "Tus datos se han guardado correctamente." });
                updateUser(res.user as any);
            } else {
                toast({ variant: 'destructive', title: "Error", description: res.error });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

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
                const [notifData, tasksData, eventsData, projectsData] = await Promise.all([
                    getNotifications(user.id),
                    getTasks(),
                    getUpcomingEvents(),
                    getProjects()
                ]);

                setNotifications(notifData);
                setUnreadCount(notifData.filter(n => !n.isRead).length);

                const userTasks = tasksData.filter((t: any) => !t.userId || t.userId === user.id);
                setTasks(userTasks as any);
                setPendingTasksCount(userTasks.filter((t: any) => t.status !== 'completado').length);
                setUpcomingEvents(eventsData);
                setProjects(projectsData);
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
                            startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
                            imageUrl: data.imageUrl || ''
                        });
                        if (data.config) {
                            setConfigParams({
                                ...data.config,
                                mainCurrency: data.config.mainCurrency || 'BS',
                                secondaryCurrency: data.config.secondaryCurrency || 'USD',
                                workingDays: data.config.workingDays || 6,
                                workingDaysSelection: data.config.workingDaysSelection || [1, 2, 3, 4, 5, 6]
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
            const result = await createCalendarEvent({
                title: newEventForm.title.trim(),
                description: newEventForm.description || '',
                date: newEventForm.dueDate,
                type: 'evento',
                project: newEventForm.projectId
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
                window.location.reload();
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSubmittingProject(true);
        try {
            const response = await fetch('/api/r2/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    size: file.size,
                    category: 'Project Image',
                    libraryType: 'asset',
                    isPublic: true
                })
            });

            if (!response.ok) throw new Error("Fallo al obtener URL de subida");

            const { presignedUrl, publicUrl } = await response.json();

            // Upload to R2 using PUT
            const uploadRes = await fetch(presignedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file
            });

            if (!uploadRes.ok) throw new Error("Fallo al subir archivo a R2");

            handleProjectDataChange('imageUrl', publicUrl);
            toast({ title: "Imagen subida", description: "La imagen se ha cargado correctamente." });
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message || "No se pudo subir la imagen.", variant: "destructive" });
        } finally {
            setIsSubmittingProject(false);
        }
    };

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
        <nav className="h-14 border-b md:border-2 md:border-foreground/10 bg-card flex items-center px-2 md:px-4 justify-between sticky top-0  md:rounded-lg md:m-3 shadow-sm md:shadow-none z-40">
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
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        className="text-[9px] font-black uppercase tracking-widest h-9 border-accent hover:bg-primary/10 hover:text-primary cursor-pointer"
                                        onClick={() => {
                                            if (projects.length === 0) fetchData();
                                            setIsCreateOpen(true);
                                        }}
                                    >
                                        <PlusCircle className="mr-2 h-3.5 w-3.5" /> Tarea
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="text-[9px] font-black uppercase tracking-widest h-9 border-accent hover:bg-primary/10 hover:text-primary cursor-pointer"
                                        onClick={() => {
                                            if (projects.length === 0) fetchData();
                                            setIsNewEventOpen(true);
                                        }}
                                    >
                                        <Calendar className="mr-2 h-3.5 w-3.5" /> Evento
                                    </Button>
                                </div>
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
                                    <span className="text-[9px] text-primary font-black uppercase tracking-widest mt-0.5">{user?.cargo}</span>
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
                                            <span className="text-[8px] text-primary font-black uppercase tracking-tighter">{user?.cargo}</span>
                                        </div>
                                    </div>
                                </div>

                                <ScrollArea className="flex-1">
                                    <TabsList className="bg-card border border-accent h-12 p-0 rounded-xl overflow-hidden mb-6 flex flex-wrap md:flex-nowrap">
                                        <TabsTrigger value="profile" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                                            <UserIcon className="h-4 w-4" /> Perfil de Usuario
                                        </TabsTrigger>
                                        <TabsTrigger value="security" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                                            <ShieldCheck className="h-4 w-4" /> Seguridad
                                        </TabsTrigger>
                                        <TabsTrigger value="notifications" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                                            <BellIcon className="h-4 w-4" /> Notificaciones
                                        </TabsTrigger>
                                        <TabsTrigger value="appearance" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                                            <Palette className="h-4 w-4" /> Apariencia
                                        </TabsTrigger>
                                        <Separator className="my-4 bg-white/5" />
                                        <TabsTrigger value="subscription" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                                            <CreditCard className="h-4 w-4" /> Suscripción
                                        </TabsTrigger>
                                        <TabsTrigger value="billing" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                                            <Receipt className="h-4 w-4" /> Facturación
                                        </TabsTrigger>
                                        <Separator className="my-4 bg-white/5" />
                                        <TabsTrigger value="support" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
                                            <LifeBuoy className="h-4 w-4" /> Soporte Técnico
                                        </TabsTrigger>
                                        <TabsTrigger value="docs" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">
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
                                                    <Input value={profileForm.name} onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))} className="h-12 bg-card border-accent uppercase font-bold text-sm" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Correo Electrónico</Label>
                                                    <Input defaultValue={user?.email} disabled className="h-12 bg-card border-accent font-mono text-sm opacity-50" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Teléfono</Label>
                                                    <Input value={profileForm.telefono} onChange={(e) => setProfileForm(p => ({ ...p, telefono: e.target.value }))} className="h-12 bg-card border-accent font-bold text-sm" placeholder="Ej: +591 70000000" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Cargo</Label>
                                                    <Input value={profileForm.cargo} onChange={(e) => setProfileForm(p => ({ ...p, cargo: e.target.value }))} className="h-12 bg-card border-accent uppercase font-bold text-sm" placeholder="Ej: Ingeniero Civil" />
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
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                        <Globe className="h-3 w-3" /> Almacenamiento en la Nube
                                                    </Label>
                                                    <div className="h-12 bg-primary/5 border border-primary/20 rounded-md px-4 flex items-center justify-between">
                                                        <span className="text-[11px] font-bold uppercase tracking-tight text-primary">{user?.storageLimit || '1GB'} (Límite Global)</span>
                                                        <Badge variant="outline" className="border-primary/20 text-[9px] font-black">ACTIVO</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-6 flex justify-end">
                                                <Button
                                                    onClick={handleUpdateProfile}
                                                    disabled={isUpdatingProfile}
                                                    className="bg-primary text-background font-black uppercase text-[10px] h-11 px-10 tracking-widest cursor-pointer"
                                                >
                                                    {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar Perfil"}
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
                        </DialogHeader>
                        <Tabs defaultValue="informacion" className="flex-1 flex flex-col overflow-hidden">
                            <div className=" border-b border-accent shrink-0">
                                <TabsList className="bg-card border border-accent h-12 p-0 rounded-xl overflow-hidden mb-6 flex flex-wrap md:flex-nowrap">
                                    <TabsTrigger value="informacion" className="fflex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">INFORMACIÓN</TabsTrigger>
                                    <TabsTrigger value="parametros" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">PARÁMETROS</TabsTrigger>
                                    <TabsTrigger value="niveles" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">NIVELES</TabsTrigger>
                                    <TabsTrigger value="modelobim" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">MODELO</TabsTrigger>
                                    <TabsTrigger value="permisos" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">PERMISOS</TabsTrigger>
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

                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Imagen del Proyecto</Label>
                                        <div className="flex flex-col md:flex-row items-center gap-6 p-6 border border-accent rounded-2xl bg-secondary/30">
                                            <div className="relative h-40 w-full md:w-72 bg-card rounded-xl overflow-hidden border border-accent group">
                                                <img
                                                    src={editProjectData.imageUrl || '/project-img.png'}
                                                    alt="Vista previa"
                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                />
                                                {isSubmittingProject && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
                                                        Sube una imagen representativa para identificar este activo de obra en el portafolio global.
                                                    </p>
                                                    <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">Formatos: JPG, PNG, WEBP (Max 5MB)</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                        id="project-image-upload"
                                                        disabled={isSubmittingProject}
                                                    />
                                                    <Label
                                                        htmlFor="project-image-upload"
                                                        className="h-10 px-6 rounded-xl bg-primary text-background font-black text-[10px] uppercase tracking-widest flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors"
                                                    >
                                                        {isSubmittingProject ? 'Subiendo...' : 'Seleccionar Imagen'}
                                                    </Label>
                                                    {editProjectData.imageUrl && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleProjectDataChange('imageUrl', '')}
                                                            className="text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10"
                                                        >
                                                            Quitar
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
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
                                        <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] border-b border-accent pb-2">Días Laborables</h3>
                                        <div className="flex flex-wrap gap-4">
                                            {[
                                                { id: 1, label: 'Lun' },
                                                { id: 2, label: 'Mar' },
                                                { id: 3, label: 'Mie' },
                                                { id: 4, label: 'Jue' },
                                                { id: 5, label: 'Vie' },
                                                { id: 6, label: 'Sab' },
                                                { id: 0, label: 'Dom' }
                                            ].map((day) => (
                                                <div key={day.id} className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-xl border border-accent/50 hover:border-primary/30 transition-all">
                                                    <Checkbox
                                                        id={`day-${day.id}`}
                                                        checked={configParams.workingDaysSelection?.includes(day.id)}
                                                        onCheckedChange={(checked: boolean) => {
                                                            const current = configParams.workingDaysSelection || [];
                                                            const next = checked
                                                                ? [...current, day.id].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                                                                : current.filter(id => id !== day.id);
                                                            setConfigParams(prev => ({ ...prev, workingDaysSelection: next }));
                                                        }}
                                                    />
                                                    <Label htmlFor={`day-${day.id}`} className="text-[10px] font-black uppercase tracking-widest cursor-pointer select-none">
                                                        {day.label}
                                                    </Label>
                                                </div>
                                            ))}
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
                            <div className="px-6  shrink-0">
                                <TabsList className="bg-card border border-accent h-12 p-0 rounded-xl overflow-hidden mb-6">
                                    <TabsTrigger value="current" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">EQUIPO</TabsTrigger>
                                    <TabsTrigger value="add" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm"> PERSONAL</TabsTrigger>
                                    <TabsTrigger value="invite" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-none border-r  text-xs md:text-sm">COLABORADORES</TabsTrigger>
                                </TabsList>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <TabsContent value="current" className="h-full m-0"><ScrollArea className="h-full p-6"><div className="space-y-3">{activeProject.team?.map((member: any) => (
                                    <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-accent group hover:border-primary/30 transition-all ">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 border border-accent ">
                                                <AvatarFallback className="bg-card text-primary text-xs font-black uppercase">{member.name[0]}</AvatarFallback></Avatar>
                                            <div className="flex flex-col gap-0 items-start">
                                                <span className="text-[14px] font-bold text-primary uppercase">{member.name}</span>
                                                <Badge variant="outline" className="text-[12px] h-6 border-accent bg-card font-bold uppercase mt-1 text-muted-foreground">{member.type}</Badge>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => handleRemoveTeamMember(member.id)} disabled={isSubmittingProject}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}</div></ScrollArea></TabsContent>
                                <TabsContent value="add" className="h-full m-0 flex flex-col overflow-hidden">
                                    <ScrollArea className="flex-1 p-6">
                                        <div className="space-y-3">{isFetchingLibrary ? <div className="flex flex-col items-center justify-center py-20 opacity-20 gap-3"><Loader2 className="h-8 w-8 animate-spin" /><p className="text-[10px] font-black uppercase tracking-widest">Consultando Directorio...</p></div> : filteredLibraryContacts.map((contact) => (
                                            <div key={contact.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-accent hover:bg-accent/5 transition-all group">
                                                <div className="flex items-center gap-4"><Avatar className="h-10 w-10 border border-accent opacity-60 group-hover:opacity-100 transition-opacity"><AvatarFallback className="text-[10px] font-black uppercase">{contact.name[0]}</AvatarFallback></Avatar><div className="flex flex-col"><span className="text-xs font-bold text-primary uppercase">{contact.name}</span><span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mt-1">{contact.type}</span></div></div>
                                                <Button size="sm" className="h-8 bg-secondary hover:bg-primary/90 text-primary hover:text-primary font-black text-[9px] uppercase tracking-widest px-4 rounded-lg cursor-pointer" onClick={() => handleAddTeamMember(contact.id)} disabled={isSubmittingProject}><Plus className="h-3 w-3 mr-1.5" /> Adicionar</Button>
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
                                                    className="h-12 bg-card border-accent font-mono text-sm"
                                                />
                                            </div>
                                            <Button
                                                onClick={handleInviteSubmit}
                                                disabled={isSubmittingProject || !inviteEmail}
                                                className="w-full bg-primary text-background font-black uppercase text-[11px] h-12 tracking-widest  cursor-pointer"
                                            >
                                                {isSubmittingProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                                Enviar Invitación de Colaboración
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                        <DialogFooter className="p-4 border-t border-accent bg-card shrink-0"><Button variant="ghost" onClick={() => setIsTeamOpen(false)} className="w-full text-[9px] font-black uppercase tracking-[0.2em] h-10 hover:bg-accent cursor-pointer">Cerrar</Button></DialogFooter>
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

            {activeProject && isAuthor && (
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
            )}

            {/* Modal Crear Tarea */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md bg-card border-accent text-primary p-0 overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="p-6 bg-card border-b border-accent shrink-0 flex flex-row items-center space-y-0 gap-3">
                            <CheckSquare className="h-6 w-6 text-primary" />
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Crear Nueva Tarea</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[10px] font-black uppercase mt-1">Asigna actividades a tu equipo</DialogDescription>
                            </div>
                        </DialogHeader>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título de la Tarea</Label>
                                <Input id="title" value={formData.title} onChange={handleInputChange} placeholder="EJ: REVISIÓN DE PLANOS" required className="h-11 bg-card border-accent uppercase font-bold text-xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proyecto</Label>
                                    <Select value={formData.projectId} onValueChange={(val) => handleSelectChange('projectId', val)}>
                                        <SelectTrigger className="h-11 bg-card border-accent uppercase font-black text-[9px]"><SelectValue placeholder="SELECCIONAR" /></SelectTrigger>
                                        <SelectContent className="bg-card text-primary border-white/10">
                                            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title?.toUpperCase()}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prioridad</Label>
                                    <Select value={formData.priority} onValueChange={(val) => handleSelectChange('priority', val)}>
                                        <SelectTrigger className="h-11 bg-card border-accent uppercase font-black text-[9px]"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-card text-primary border-white/10">
                                            <SelectItem value="alta">ALTA</SelectItem>
                                            <SelectItem value="media">MEDIA</SelectItem>
                                            <SelectItem value="baja">BAJA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha de Vencimiento</Label>
                                <Input id="dueDate" type="date" value={formData.dueDate} onChange={handleInputChange} className="h-11 bg-card border-accent font-mono text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción</Label>
                                <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder="DETALLES ADICIONALES..." className="bg-card border-accent text-xs uppercase font-medium min-h-[100px]" />
                            </div>
                        </div>
                        <DialogFooter className="p-6 border-t border-accent bg-card">
                            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-[10px] font-black uppercase tracking-widest">CANCELAR</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-primary text-background font-black uppercase text-[10px] h-11 px-8 tracking-widest">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} CREAR TAREA
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Crear Evento */}
            <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
                <DialogContent className="max-w-md bg-card border-accent text-primary p-0 overflow-hidden">
                    <form onSubmit={handleCreateEvent}>
                        <DialogHeader className="p-6 bg-card border-b border-accent shrink-0 flex flex-row items-center space-y-0 gap-3">
                            <Calendar className="h-6 w-6 text-primary" />
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Nuevo Evento</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[10px] font-black uppercase mt-1">Registra hitos o reuniones</DialogDescription>
                            </div>
                        </DialogHeader>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título del Evento</Label>
                                <Input value={newEventForm.title} onChange={(e) => setNewEventForm(prev => ({ ...prev, title: e.target.value }))} placeholder="EJ: REUNIÓN DE COORDINACIÓN" required className="h-11 bg-card border-accent uppercase font-bold text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proyecto</Label>
                                <Select value={newEventForm.projectId} onValueChange={(val) => setNewEventForm(prev => ({ ...prev, projectId: val }))}>
                                    <SelectTrigger className="h-11 bg-card border-accent uppercase font-black text-[9px]"><SelectValue placeholder="SELECCIONAR" /></SelectTrigger>
                                    <SelectContent className="bg-card text-primary border-white/10">
                                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title?.toUpperCase()}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha del Evento</Label>
                                <Input type="date" value={newEventForm.dueDate} onChange={(e) => setNewEventForm(prev => ({ ...prev, dueDate: e.target.value }))} required className="h-11 bg-card border-accent font-mono text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción</Label>
                                <Textarea value={newEventForm.description} onChange={(e) => setNewEventForm(prev => ({ ...prev, description: e.target.value }))} placeholder="DETALLES DEL EVENTO..." className="bg-card border-accent text-xs uppercase font-medium min-h-[100px]" />
                            </div>
                        </div>
                        <DialogFooter className="p-6 border-t border-accent bg-card">
                            <Button type="button" variant="ghost" onClick={() => setIsNewEventOpen(false)} className="text-[10px] font-black uppercase tracking-widest">CANCELAR</Button>
                            <Button type="submit" disabled={isSubmittingEvent} className="bg-primary text-background font-black uppercase text-[10px] h-11 px-8 tracking-widest">
                                {isSubmittingEvent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} REGISTRAR EVENTO
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </nav>
    );
}


