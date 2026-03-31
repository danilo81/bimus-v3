"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar as CalendarIcon, Filter, Clock, Building2, MoreVertical,
    Loader2, Edit, Trash2, Save, AlertCircle, Bell, LayoutDashboard,
    Kanban, Inbox, History, CheckCheck, X, Info, CheckCircle2, AlertTriangle,
    ChevronLeft, ChevronRight,
    Plus
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Notification } from '../../types/types';

// Componentes UI
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { KanbanBoard, KanbanProvider, KanbanHeader, KanbanCards, KanbanCard, KanbanItemProps } from '../../components/kibo-ui/kanban';
import { useToast } from '../../hooks/use-toast';

// Acciones unificadas

import { cn } from '../../lib/utils';

import { createCalendarEvent, deleteCalendarEvent, getCalendarEventsDb, getProjects, updateCalendarEvent, getTasks, getUnifiedWorkspaceData, updateTaskStatusKanban, markAsRead, markAllAsRead, deleteNotification } from '@/actions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenu } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Tipos ---
type EventType = 'hitos' | 'obra' | 'reunion' | 'tarea';

const COLUMNS = [
    { id: "pendiente", name: "Pendiente" },
    { id: "en_progreso", name: "En Progreso" },
    { id: "completado", name: "Completado" }
];

function parseLocalDate(isoString: string | Date): Date {
    if (!isoString) return new Date();
    const str = typeof isoString === 'string' ? isoString : isoString.toISOString();
    const [year, month, day] = str.split('T')[0].split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: EventType;
    project: string;
    description?: string;
    isDb?: boolean; // eventos persistidos en la DB
}

const EVENT_TYPE_STYLES: Record<EventType, string> = {
    hitos: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    obra: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    reunion: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    tarea: 'bg-card text-primary border-accent',
};

const EVENT_BADGE_STYLES: Record<EventType, string> = {
    hitos: 'bg-amber-500/20 text-amber-500',
    obra: 'bg-emerald-500/20 text-emerald-500',
    reunion: 'bg-blue-500/20 text-blue-500',
    tarea: 'bg-primary/20 text-primary',
};

const defaultForm = {
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'reunion' as EventType,
    project: '',
    description: '',
};

export default function WorkspacePage() {
    const { toast } = useToast();
    const [tasks, setTasks] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    // DB events
    const [dbEvents, setDbEvents] = useState<CalendarEvent[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [form, setForm] = useState(defaultForm);
    const [formError, setFormError] = useState<string | null>(null);

    // Estados globales unificados
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        events: [] as any[],
        tasks: [] as any[],
        notifications: [] as any[],
        projects: [] as any[]
    });

    // Estados de Calendario
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [projectFilter, setProjectFilter] = useState('all');

    useEffect(() => {
        async function loadWorkspace() {
            setLoading(true);
            const res = await getUnifiedWorkspaceData();
            if (res.success && res.data) {
                // Parseamos las fechas
                setData({
                    events: res.data.events.map((e: any) => ({ ...e, date: new Date(e.date), isDb: true })),
                    tasks: res.data.tasks,
                    notifications: res.data.notifications,
                    projects: res.data.projects
                });
            }
            setLoading(false);
        }
        loadWorkspace();
    }, []);

    // ─────────────────────────────────────────────────────────────────
    // 1. LÓGICA DE CALENDARIO
    // ─────────────────────────────────────────────────────────────────

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [tData, pData, evData] = await Promise.all([
                    getTasks(),
                    getProjects(),
                    getCalendarEventsDb(),
                ]);
                setTasks(tData);
                setProjects(pData);
                if (evData.success) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setDbEvents(evData.events.map((e: any) => ({
                        ...e,
                        date: parseLocalDate(e.date),
                        isDb: true,
                    })));
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Combine all events
    const allEvents = useMemo(() => {
        const taskEvents: CalendarEvent[] = tasks
            .filter(t => t.dueDate)
            .map(t => ({
                id: t.id,
                title: t.title,
                date: parseLocalDate(t.dueDate),
                type: 'tarea' as EventType,
                project: t.projectName || 'Sin Proyecto',
                description: t.description,
                isDb: false,
            }));

        const combined = [...dbEvents, ...taskEvents];

        if (projectFilter === 'all') return combined;
        return combined.filter(e => e.project === projectFilter);
    }, [tasks, dbEvents, projectFilter]);

    const selectedDayEvents = allEvents.filter(e => isSameDay(e.date, selectedDate));

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const openCreateModal = (date?: Date) => {
        setIsEditMode(false);
        setEditingEventId(null);
        setForm({
            ...defaultForm,
            date: format(date ?? selectedDate, 'yyyy-MM-dd'),
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (event: CalendarEvent) => {
        setIsEditMode(true);
        setEditingEventId(event.id);
        setForm({
            title: event.title,
            date: format(event.date, 'yyyy-MM-dd'),
            type: event.type,
            project: event.project ?? '',
            description: event.description ?? '',
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) { setFormError('El título es requerido.'); return; }
        setIsSubmitting(true);
        setFormError(null);

        try {
            if (isEditMode && editingEventId) {
                const res = await updateCalendarEvent(editingEventId, form);
                if (res.success && res.event) {
                    setDbEvents(prev => prev.map(ev =>
                        ev.id === editingEventId
                            ? { ...res.event, date: parseLocalDate(res.event.date), isDb: true }
                            : ev
                    ));
                    toast({ title: 'Evento actualizado', description: 'Los cambios fueron guardados.' });
                    setIsModalOpen(false);
                } else {
                    setFormError(res.error ?? 'Error al actualizar.');
                }
            } else {
                const res = await createCalendarEvent(form);
                if (res.success && res.event) {
                    setDbEvents(prev => [
                        ...prev,
                        { ...res.event, date: parseLocalDate(res.event.date), isDb: true }
                    ]);
                    toast({ title: 'Evento creado', description: 'El evento fue añadido al calendario.' });
                    setIsModalOpen(false);
                } else {
                    setFormError(res.error ?? 'Error al crear el evento.');
                }
            }
        } catch {
            setFormError('Error inesperado.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Deseas eliminar este evento?')) return;
        const res = await deleteCalendarEvent(id);
        if (res.success) {
            setDbEvents(prev => prev.filter(e => e.id !== id));
            toast({ title: 'Evento eliminado' });
        } else {
            toast({ title: 'Error', description: res.error, variant: 'destructive' });
        }
    };

    // ─── Calendar Render ──────────────────────────────────────────────────────


    const renderDays = () => {
        const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
        return (
            <div className="grid grid-cols-7 mb-2 border-b border-white/5">
                {days.map((day, i) => (
                    <div key={i} className="py-3 text-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{day}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
        const rows: React.ReactElement[] = [];
        let days: React.ReactElement[] = [];

        calendarDays.forEach((day, i) => {
            const dayEvents = allEvents.filter(e => isSameDay(e.date, day));

            days.push(
                <div
                    key={day.toString()}
                    className={cn(
                        "relative min-h-35 border-r border-b border-accent p-2 transition-all group cursor-pointer",
                        !isSameMonth(day, monthStart) ? "bg-accent " : "bg-card ",
                        isSameDay(day, new Date()) && "bg-emerald-50"
                    )}
                    onClick={() => setSelectedDate(day)}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                            "text-xs font-mono font-black p-1.5 rounded-lg flex items-center justify-center min-w-7 ",
                            isSameDay(day, new Date()) ? "bg-primary text-background" : "text-muted-foreground "
                        )}>
                            {format(day, 'd')}
                        </span>
                        <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-primary/10"
                            onClick={(ev) => { ev.stopPropagation(); openCreateModal(day); }}
                        >
                            <Plus className="h-3 w-3 text-primary" />
                        </button>
                    </div>

                    <div className="space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((event) => (
                            <div
                                key={event.id}
                                className={cn(
                                    "px-2 py-1 rounded-md text-[9px] font-bold  uppercase truncate border transition-all ",
                                    EVENT_TYPE_STYLES[event.type]
                                )}
                            >
                                {event.title}
                            </div>
                        ))}
                        {dayEvents.length > 3 && (
                            <div className="text-[8px] font-black text-muted-foreground/40 text-center uppercase tracking-tighter ">
                                + {dayEvents.length - 3} actividades
                            </div>
                        )}
                    </div>
                </div>
            );

            if ((i + 1) % 7 === 0) {
                rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
                days = [];
            }
        });

        return <div className="border-t border-l border-accent rounded-2xl overflow-hidden">{rows}</div>;
    };

    // ─── Edit/Create Modal ────────────────────────────────────────────────────

    const renderModal = () => (
        <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) setIsModalOpen(false); }}>
            <DialogContent className="sm:max-w-md bg-card border-muted/50 p-0 overflow-hidden">
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <DialogHeader className="p-6 border-b border-accent">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black uppercase tracking-tight text-primary leading-none">
                                    {isEditMode ? 'Editar Evento' : 'Nuevo Evento'}
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                    {isEditMode ? 'Modifica los datos del evento' : 'Añade un evento a tu agenda'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {formError && (
                        <div className="mx-6 mt-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2 text-destructive text-xs">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <p>{formError}</p>
                        </div>
                    )}

                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Título</Label>
                            <Input
                                className="bg-background/50 border-accent h-11 text-primary uppercase text-xs font-bold"
                                placeholder="Descripción del evento..."
                                value={form.title}
                                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Fecha</Label>
                                <Input
                                    type="date"
                                    className="bg-background/50 border-accent h-11 text-primary text-xs font-bold"
                                    value={form.date}
                                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Tipo</Label>
                                <Select value={form.type} onValueChange={val => setForm(p => ({ ...p, type: val as EventType }))}>
                                    <SelectTrigger className="bg-background/50 border-accent h-11 text-primary text-xs font-bold uppercase w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-white/10">
                                        <SelectItem value="hitos" className="text-[10px] font-bold uppercase">Hito Crítico</SelectItem>
                                        <SelectItem value="obra" className="text-[10px] font-bold uppercase">Actividad de Obra</SelectItem>
                                        <SelectItem value="reunion" className="text-[10px] font-bold uppercase">Reunión / Cita</SelectItem>
                                        <SelectItem value="tarea" className="text-[10px] font-bold uppercase">Tarea</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Proyecto</Label>
                            <Select value={form.project || '__none__'} onValueChange={val => setForm(p => ({ ...p, project: val === '__none__' ? '' : val }))}>
                                <SelectTrigger className="bg-background/50 border-accent h-11 text-primary text-xs font-bold uppercase w-full">
                                    <SelectValue placeholder="Sin proyecto asociado" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-white/10">
                                    <SelectItem value="__none__" className="text-[10px] font-bold uppercase">Sin proyecto</SelectItem>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.title} className="text-[10px] font-bold uppercase">{p.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Descripción</Label>
                            <Textarea
                                className="bg-background/50 border-accent text-primary text-xs font-bold resize-none h-20"
                                placeholder="Detalles adicionales..."
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-accent gap-3 items-center">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}
                            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}
                            className="bg-primary hover:bg-primary/80 text-background font-black text-[10px] uppercase tracking-widest h-11 px-8">
                            {isSubmitting
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <><Save className="mr-2 h-4 w-4" />{isEditMode ? 'Actualizar' : 'Guardar Evento'}</>
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );

    // ─────────────────────────────────────────────────────────────────
    // 2. LÓGICA DE KANBAN (Tareas)
    // ─────────────────────────────────────────────────────────────────
    const kanbanTasks = useMemo(() => {
        return data.tasks.map(t => ({
            id: t.id,
            name: t.title,
            column: t.status || 'pendiente',
            project: t.project?.title
        }));
    }, [data.tasks]);

    const handleKanbanChange = async (newData: KanbanItemProps[]) => {
        // Encontramos qué tarea cambió de columna
        const updatedTasks = data.tasks.map(task => {
            const kTask = newData.find(k => k.id === task.id);
            if (kTask && kTask.column !== task.status) {
                // Actualizar en BD en segundo plano
                updateTaskStatusKanban(task.id, kTask.column as string);
                return { ...task, status: kTask.column };
            }
            return task;
        });
        setData(prev => ({ ...prev, tasks: updatedTasks }));
    };

    const renderKanban = () => (
        <KanbanProvider
            columns={COLUMNS}
            data={kanbanTasks}
            onDataChange={handleKanbanChange}
        >
            {(column) => (
                <KanbanBoard id={column.id} key={column.id}>
                    <KanbanHeader className="bg-muted/30 border-b border-accent py-4 text-center text-primary uppercase tracking-widest text-[10px] font-black">
                        {column.name}
                    </KanbanHeader>
                    <KanbanCards id={column.id}>
                        {(item) => (
                            <KanbanCard key={item.id} id={item.id} name={item.name} column={item.column} className="bg-card border-accent shadow-sm">
                                <div className="flex flex-col gap-2">
                                    <span className="font-bold text-xs uppercase">{item.name}</span>
                                    {typeof item.project === 'string' && item.project && (
                                        <Badge variant="outline" className="w-fit text-[9px] uppercase">{item.project}</Badge>
                                    )}
                                </div>
                            </KanbanCard>
                        )}
                    </KanbanCards>
                </KanbanBoard>
            )}
        </KanbanProvider>
    );

    // ─────────────────────────────────────────────────────────────────
    // 3. LÓGICA DE NOTIFICACIONES
    // ─────────────────────────────────────────────────────────────────

    const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'error': return <X className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const handleNotificationAction = async (id: string, action: 'read' | 'delete') => {
        if (action === 'read') {
            await markAsRead(id);
            setData(prev => ({
                ...prev,
                notifications: prev.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
            }));
        } else {
            await deleteNotification(id);
            setData(prev => ({
                ...prev,
                notifications: prev.notifications.filter(n => n.id !== id)
            }));
        }
    };

    const renderNotifications = () => {
        const unread = data.notifications.filter(n => !n.isRead);
        return (
            <div className="max-w-4xl mx-auto space-y-4">
                {unread.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-40 border border-dashed border-accent rounded-3xl">
                        <Inbox className="h-16 w-16 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No tienes notificaciones pendientes.</p>
                    </div>
                )}
                {unread.map(notif => (
                    <Card key={notif.id} className="bg-white/5 border-primary/20 hover:border-primary/50 transition-all">
                        <CardContent className="p-4 flex justify-between items-start">
                            <div className="space-y-1">
                                <h4 className="text-sm font-black uppercase tracking-tight text-primary">{notif.title}</h4>
                                <p className="text-xs text-muted-foreground uppercase">{notif.message}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleNotificationAction(notif.id, 'read')} className="text-emerald-500"><CheckCheck className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleNotificationAction(notif.id, 'delete')} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────
    // RENDER PRINCIPAL
    // ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargando Área de Trabajo...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500 h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card w-fit">
                <div className="flex items-center gap-4">
                    <LayoutDashboard className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-tight">Área de Trabajo</h1>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Control de gestión</p>
                    </div>
                </div>
            </div>

            {/* Unificación mediante Tabs */}
            <Tabs defaultValue="calendar" className="w-full space-y-6">
                <TabsList className="bg-card border border-accent h-12 p-1 rounded-xl">
                    <TabsTrigger value="calendar" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-background">
                        <CalendarIcon className="h-3.5 w-3.5 mr-2" /> Calendario
                    </TabsTrigger>
                    <TabsTrigger value="kanban" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-background">
                        <Kanban className="h-3.5 w-3.5 mr-2" /> Tablero Tareas
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-background relative">
                        <Bell className="h-3.5 w-3.5 mr-2" /> Notificaciones
                        {data.notifications.filter(n => !n.isRead).length > 0 && (
                            <span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Contenido Calendario */}
                <div className="container mx-auto px-4 space-y-8 animate-in fade-in duration-500">
                    {renderModal()}
                    <TabsContent value="calendar" className='h-[60vh]'>
                        <div className="grid grid-cols-1 lg:grid-cols-12 h-screen gap-6">
                            {/* Lateral Panel */}
                            <div className="lg:col-span-3 h-screen">
                                {/* Selected Day Events */}
                                <Card className="bg-card border-accent flex flex-col">
                                    <CardHeader className="bg-card border-b border-accent p-6 shrink-0 gap-6">
                                        <div className="flex items-center gap-3 flex-col">
                                            <div className="flex items-center gap-1 bg-card p-1.5 rounded-xl border border-accent">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                                                    <ChevronLeft className="h-5 w-5 text-primary" />
                                                </Button>
                                                <Button variant="ghost" className="text-[10px] text-primary font-black uppercase tracking-widest px-4 h-9 hover:bg-white/5" onClick={() => setCurrentMonth(new Date())}>
                                                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{format(selectedDate, 'EEEE', { locale: es })}</span>
                                                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]"> {format(selectedDate, 'dd MMMM', { locale: es })}</span>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                                                    <ChevronRight className="h-5 w-5 text-primary" />
                                                </Button>
                                            </div>
                                            <div className="space-y-3 flex flex-col">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Proyecto Activo</Label>
                                                <Select value={projectFilter} onValueChange={setProjectFilter}>
                                                    <SelectTrigger className="bg-card text-primary border-accent h-11 text-[10px] font-bold uppercase w-full">
                                                        <SelectValue placeholder="Todos los proyectos" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-card text-primary border-white/10 w-full">
                                                        <SelectItem value="all" className="text-[10px] font-bold uppercase w-full">General</SelectItem>
                                                        {projects.map(p => (
                                                            <SelectItem key={p.id} value={p.title} className="text-[10px] font-bold uppercase">{p.title}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-4 flex flex-row">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Leyenda</Label>
                                                <div className="space-y-2.5">
                                                    {[
                                                        { label: 'Hitos Críticos', color: 'bg-amber-500' },
                                                        { label: 'Actividades de Obra', color: 'bg-emerald-500' },
                                                        { label: 'Reuniones / Citas', color: 'bg-blue-500' },
                                                        { label: 'Tareas Pendientes', color: 'bg-primary' },
                                                    ].map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-3">
                                                            <div className={cn("h-2 w-2 rounded-full", item.color)} />
                                                            <span className="text-[10px] font-bold uppercase text-muted-foreground/60">{item.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <ScrollArea className="flex-1 h-50">
                                        <CardContent className="p-4">
                                            {selectedDayEvents.length > 0 ? (
                                                <div className="space-y-3">
                                                    {selectedDayEvents.map((event) => (
                                                        <div key={event.id} className="p-4 rounded-xl bg-card border border-accent hover:border-primary/20 transition-all space-y-2 group">
                                                            <div className="flex justify-between items-start">
                                                                <Badge className={cn("text-[8px] font-black uppercase border-none px-2", EVENT_BADGE_STYLES[event.type])}>
                                                                    {event.type}
                                                                </Badge>

                                                                {event.isDb ? (
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                                                                                <MoreVertical className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="bg-card border-muted/50 text-primary shadow-lg">
                                                                            <DropdownMenuItem
                                                                                className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-tighter"
                                                                                onClick={() => openEditModal(event)}
                                                                            >
                                                                                <Edit className="h-3.5 w-3.5 text-primary" /> Editar
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 text-xs font-bold uppercase tracking-tighter focus:text-destructive"
                                                                                onClick={() => handleDelete(event.id)}
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5 text-destructive" /> Eliminar
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                ) : (
                                                                    <MoreVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-40 transition-opacity" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-bold text-primary uppercase leading-relaxed">{event.title}</p>
                                                            {event.project && (
                                                                <div className="flex flex-col gap-1 mt-2">
                                                                    <span className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
                                                                        <Building2 className="h-2.5 w-2.5" /> {event.project}
                                                                    </span>
                                                                    {event.description && (
                                                                        <p className="text-[9px] text-muted-foreground italic line-clamp-2 mt-1">{event.description}</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-16 opacity-20 text-center space-y-3">
                                                    <Clock className="h-8 w-8" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin actividades programadas</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </ScrollArea>
                                </Card>
                            </div>

                            {/* Main Calendar View */}
                            <div className="lg:col-span-9 space-y-6">
                                {loading ? (
                                    <div className="h-200 flex flex-col items-center justify-center bg-card rounded-3xl border border-accent gap-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Sincronizando Agenda Global...</p>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in duration-700">
                                        {renderDays()}
                                        {renderCells()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </div>
                {/* Contenido Kanban */}
                <TabsContent value="kanban" className="mt-0 focus-visible:ring-0 h-[70vh]">
                    {renderKanban()}
                </TabsContent>

                {/* Contenido Notificaciones */}
                <TabsContent value="notifications" className="mt-0 focus-visible:ring-0">
                    {renderNotifications()}
                </TabsContent>
            </Tabs>
        </div>
    );
}