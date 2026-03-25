"use client";

import { useEffect, useState, useMemo } from 'react';
import {
    Bell,
    CheckCheck,
    Trash2,
    Clock,
    CheckCircle2,
    AlertTriangle,
    X,
    Info,
    Loader2,
    Inbox,
    History
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { useAuth } from '../../hooks/use-auth';
import { useToast } from '../../hooks/use-toast';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from './actions';
import { Notification } from '../../lib/types';
import { cn } from '../../lib/utils';

export default function NotificationsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isActionInProgress, setIsActionInProgress] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadNotifications();
        }
    }, [user?.id]);

    async function loadNotifications() {
        setLoading(true);
        try {
            const data = await getNotifications(user?.id);
            setNotifications(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const unreadNotifications = useMemo(() =>
        notifications.filter(n => !n.isRead),
        [notifications]);

    const readNotifications = useMemo(() =>
        notifications.filter(n => n.isRead),
        [notifications]);

    const handleMarkAsRead = async (id: string) => {
        setIsActionInProgress(true);
        const result = await markAsRead(id);
        if (result.success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        }
        setIsActionInProgress(false);
    };

    const handleMarkAllAsRead = async () => {
        setIsActionInProgress(true);
        const result = await markAllAsRead();
        if (result.success) {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast({ title: "Bandeja de entrada limpia", description: "Todas las notificaciones han sido marcadas como leídas." });
        }
        setIsActionInProgress(false);
    };

    const handleDelete = async (id: string) => {
        setIsActionInProgress(true);
        const result = await deleteNotification(id);
        if (result.success) {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
        setIsActionInProgress(false);
    };

    const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'error': return <X className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const TimelineItem = ({ notification }: { notification: Notification }) => (
        <div className="relative pl-10 pb-8 last:pb-0 group">
            <div className="absolute left-[11px] top-2 bottom-0 w-px bg-white/5 group-last:hidden" />
            <div className={cn(
                "absolute left-0 top-1 h-6 w-6 rounded-full border-2 border-card flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                notification.type === 'success' ? 'bg-emerald-500/20' :
                    notification.type === 'warning' ? 'bg-amber-500/20' :
                        notification.type === 'error' ? 'bg-red-500/20' : 'bg-primary/20'
            )}>
                <NotificationIcon type={notification.type} />
            </div>

            <Card className={cn(
                "bg-white/2 border-white/5 hover:border-white/10 transition-all shadow-lg",
                !notification.isRead && "border-primary/20 bg-primary/5"
            )}>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-3">
                                <h4 className="text-sm font-black uppercase tracking-tight text-primary">{notification.title}</h4>
                                {!notification.isRead && <Badge className="bg-primary text-black font-black text-[8px] h-4 uppercase">Nuevo</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed uppercase font-medium">{notification.message}</p>
                            <div className="flex items-center gap-2 mt-3 text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                                <Clock className="h-3 w-3" /> {new Date(notification.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.isRead && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-emerald-500/10 text-emerald-500"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    disabled={isActionInProgress}
                                >
                                    <CheckCheck className="h-4 w-4" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-500/10 text-red-500"
                                onClick={() => handleDelete(notification.id)}
                                disabled={isActionInProgress}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-fit bg-card">
                    <div className="">
                        <Bell className="h-8 w-8 text-primary" />
                    </div>
                    <div className="w-fit bg-card">
                        <h1 className="text-3xl font-bold font-headline uppercase tracking-tight">Centro de Notificaciones</h1>
                        <p className="text-muted-foreground mt-1 text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Timeline Operativo del Sistema</p>
                    </div>
                </div>
                {unreadNotifications.length > 0 && (
                    <Button
                        onClick={handleMarkAllAsRead}
                        disabled={isActionInProgress}
                        className="bg-white text-black font-black text-[10px] uppercase tracking-widest h-11 px-8 shadow-xl"
                    >
                        <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas como leídas
                    </Button>
                )}
            </div>

            <Tabs defaultValue="unread" className="w-full space-y-8">
                <TabsList className="bg-card border border-accent h-12 p-1 rounded-xl w-fit">
                    <TabsTrigger value="unread" className="text-[10px] font-black uppercase tracking-widest px-8 h-full data-[state=active]:bg-card data-[state=active]:text-black">
                        <Inbox className="h-3.5 w-3.5 mr-2" /> Sin leer ({unreadNotifications.length})
                    </TabsTrigger>
                    <TabsTrigger value="read" className="text-[10px] font-black uppercase tracking-widest px-8 h-full data-[state=active]:bg-card data-[state=active]:text-black">
                        <History className="h-3.5 w-3.5 mr-2" /> Histórico ({readNotifications.length})
                    </TabsTrigger>
                </TabsList>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-30">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Bandeja...</p>
                    </div>
                ) : (
                    <>
                        <TabsContent value="unread" className="m-0 focus-visible:ring-0">
                            {unreadNotifications.length > 0 ? (
                                <div className="max-w-4xl">
                                    {unreadNotifications.map(notification => (
                                        <TimelineItem key={notification.id} notification={notification} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20 bg-white/1">
                                    <Inbox className="h-16 w-16 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No tienes notificaciones pendientes.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="read" className="m-0 focus-visible:ring-0">
                            {readNotifications.length > 0 ? (
                                <div className="max-w-4xl">
                                    {readNotifications.map(notification => (
                                        <TimelineItem key={notification.id} notification={notification} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl opacity-20 bg-white/1">
                                    <History className="h-16 w-16 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">El historial de notificaciones está vacío.</p>
                                </div>
                            )}
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}
