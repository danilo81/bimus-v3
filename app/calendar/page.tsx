"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Filter,
    Clock,
    Building2,
    MoreVertical,
    Loader2,
    Edit,
    Trash2,
    Save,
    AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    eachDayOfInterval
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { getTasks } from '../tasks/actions';
import { getProjects } from '../projects/actions';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Label } from '../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { useToast } from '../../hooks/use-toast';
import {
    getCalendarEventsDb,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
} from './actions';

function parseLocalDate(isoString: string | Date): Date {
    if (!isoString) return new Date();
    const str = typeof isoString === 'string' ? isoString : isoString.toISOString();
    const [year, month, day] = str.split('T')[0].split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

type EventType = 'hitos' | 'obra' | 'reunion' | 'tarea';

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

export default function CalendarPage() {
    const { toast } = useToast();

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tasks, setTasks] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [projectFilter, setProjectFilter] = useState('all');

    // DB events
    const [dbEvents, setDbEvents] = useState<CalendarEvent[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [form, setForm] = useState(defaultForm);
    const [formError, setFormError] = useState<string | null>(null);

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

    const renderHeader = () => (
        <div className="flex items-center justify-between px-2 mb-8">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-card rounded-xl border border-primary/20">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="w-fit bg-card">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-primary leading-none">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h1>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1.5 opacity-50">Agenda central de eventos</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-card p-1.5 rounded-xl border border-accent">
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft className="h-5 w-5 text-primary" />
                    </Button>
                    <Button variant="ghost" className="text-[10px] text-primary font-black uppercase tracking-widest px-4 h-9 hover:bg-white/5" onClick={() => setCurrentMonth(new Date())}>
                        Hoy
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight className="h-5 w-5 text-primary" />
                    </Button>
                </div>
            </div>
        </div>
    );

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
            <DialogContent className="sm:max-w-md bg-card border-muted/50 shadow-2xl p-0 overflow-hidden">
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
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Título *</Label>
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
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Fecha *</Label>
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

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            {renderModal()}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Lateral Panel */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="bg-card border-accent overflow-hidden">
                        <CardHeader className="bg-card border-b border-accent ">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Filter className="h-3.5 w-3.5" /> Filtros Técnicos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Proyecto Activo</Label>
                                <Select value={projectFilter} onValueChange={setProjectFilter}>
                                    <SelectTrigger className="bg-card text-primary border-accent h-11 text-[10px] font-bold uppercase">
                                        <SelectValue placeholder="Todos los proyectos" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card text-primary border-white/10">
                                        <SelectItem value="all" className="text-[10px] font-bold uppercase">Consolidado Global</SelectItem>
                                        {projects.map(p => (
                                            <SelectItem key={p.id} value={p.title} className="text-[10px] font-bold uppercase">{p.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-4">
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
                        </CardContent>
                    </Card>

                    {/* Selected Day Events */}
                    <Card className="bg-card border-accent flex flex-col">
                        <CardHeader className="bg-card border-b border-accent p-6 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{format(selectedDate, 'EEEE', { locale: es })}</span>
                                    <CardTitle className="text-xl font-black uppercase tracking-tight">
                                        {format(selectedDate, 'dd MMMM', { locale: es })}
                                    </CardTitle>
                                </div>
                                {/* <button
                                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                    onClick={() => openCreateModal()}
                                >
                                    <Plus className="h-4 w-4" />
                                </button> */}
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
                            {renderHeader()}
                            {renderDays()}
                            {renderCells()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
