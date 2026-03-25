"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import type { User } from '@prisma/client';
import { UserRole } from '../../lib/types';
import { useToast } from '../../hooks/use-toast';
import { ShieldCheck, Loader2, UserPlus, MoreHorizontal, Search, ExternalLink, Mail, User as UserIcon, X, Briefcase, LayoutGrid, Save, Wrench, Hammer, Users } from 'lucide-react';
import { getUsers, updateUserRole, createUser, getUserProjects } from './actions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import Link from 'next/link';
import { Separator } from '../../components/ui/separator';
import { ScrollArea } from '../../components/ui/scroll-area';

export default function AdminPage() {
    const { loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Omit<User, 'password'> | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'viewer' as UserRole,
    });

    const mockTickets = [
        {
            id: 'TICKET-001',
            subject: 'Problema al exportar presupuesto',
            user: 'Ana García',
            date: '2024-05-20',
            status: 'Abierto',
        },
        {
            id: 'TICKET-002',
            subject: 'Error de cálculo en APU',
            user: 'Carlos Ruiz',
            date: '2024-05-18',
            status: 'Resuelto',
        },
        {
            id: 'TICKET-003',
            subject: 'No se actualiza el stock de almacén',
            user: 'David Vera',
            date: '2024-05-17',
            status: 'Pendiente',
        },
    ];

    useEffect(() => {
        getUsers()
            .then(data => {
                setUsers(data);
            })
            .catch(err => {
                console.error(err);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los usuarios.",
                    variant: "destructive"
                });
            })
            .finally(() => {
                setLoading(false);
            });
    }, [toast]);

    useEffect(() => {
        if (selectedUser && isModalOpen) {
            setIsLoadingProjects(true);
            setProjects([]); // Reset projects before loading
            getUserProjects(selectedUser.id)
                .then(data => {
                    setProjects(data);
                })
                .catch(err => {
                    console.error(err);
                    toast({
                        title: "Error",
                        description: "No se pudieron cargar los proyectos del usuario.",
                        variant: "destructive"
                    });
                })
                .finally(() => {
                    setIsLoadingProjects(false);
                });
        }
    }, [selectedUser, isModalOpen, toast]);

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        const originalUsers = [...users];
        setUsers(currentUsers => currentUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));

        const updatedUser = await updateUserRole(userId, newRole);

        if (updatedUser) {
            toast({
                title: "Rol actualizado",
                description: `El rol del usuario se ha actualizado a ${newRole} con éxito.`,
            });
        } else {
            setUsers(originalProjects);
            toast({
                title: "Error",
                description: "Error al actualizar el rol del usuario.",
                variant: "destructive",
            });
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.password) {
            toast({ title: "La contraseña es obligatoria", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        const result = await createUser(newUser);
        setIsSubmitting(false);

        if (result && 'error' in result) {
            toast({ title: "Error al crear el usuario", description: (result as any).error, variant: "destructive" });
        } else {
            const newUserData = result as Omit<User, 'password'>;
            toast({ title: "Usuario creado", description: `El usuario ${newUserData.name} ha sido creado.` });
            setUsers(prevUsers => [newUserData, ...prevUsers]);
            setIsCreateDialogOpen(false);
            setNewUser({ name: '', email: '', password: '', role: 'viewer' });
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const userProjectsByRole = useMemo(() => {
        if (!selectedUser) return { own: [], collab: [] };
        return {
            own: projects.filter(p => p.authorId === selectedUser.id),
            collab: projects.filter(p => p.authorId !== selectedUser.id)
        };
    }, [projects, selectedUser]);

    if (authLoading || loading) return (
        <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground h-[50vh]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando Usuarios...</span>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className='bg-card w-fit'>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-primary" /> Panel de Administración
                    </h1>
                    <p className="text-muted-foreground mt-1">Administra los permisos y niveles de acceso para todos los usuarios.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-accent ">
                <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o correo..."
                        className="pl-10 bg-background/50 border-muted/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/40 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11 ">
                                <UserPlus className="mr-2 h-4 w-4" /> Crear usuario
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-popover text-primary p-0 overflow-hidden shadow-2xl">
                            <form onSubmit={handleCreateUser} className="flex flex-col">
                                <DialogHeader className="p-6 bg-card border-b ">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                            <UserPlus className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-xl font-bold uppercase tracking-tight">Nuevo Usuario</DialogTitle>
                                            <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Registrar personal en la plataforma</DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Nombre completo</Label>
                                        <Input value={newUser.name} onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))} className="h-11 text-sm font-bold uppercase" placeholder="Ej: Juan Pérez" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Correo electrónico</Label>
                                        <Input type="email" value={newUser.email} onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))} className="h-11 text-sm" placeholder="usuario@ejemplo.com" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Contraseña</Label>
                                            <Input type="password" value={newUser.password} onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))} className="h-11" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Rol</Label>
                                            <Select value={newUser.role} onValueChange={(val: UserRole) => setNewUser(p => ({ ...p, role: val }))}>
                                                <SelectTrigger className="w-full h-11 text-[10px] font-black uppercase">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-secondary text-primary">
                                                    <SelectItem value="admin" className="text-[10px] font-bold uppercase">Administrador</SelectItem>
                                                    <SelectItem value="editor" className="text-[10px] font-bold uppercase">Editor</SelectItem>
                                                    <SelectItem value="viewer" className="text-[10px] font-black uppercase">Lector</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="p-6 bg-card border-t border-accent gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting} className="text-[10px] font-black uppercase tracking-widest">Cancelar</Button>
                                    <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11 ">
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Usuario"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-card overflow-hidden bg-card  p-0">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-card">
                            <TableRow className="hover:bg-card">
                                <TableHead className="py-4 px-6 text-[10px] font-black uppercase">Usuario</TableHead>
                                <TableHead className="text-[10px] font-black uppercase">Correo electrónico</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-center">Rol Actual</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase">Gestionar Rol</TableHead>
                                <TableHead className="text-right px-6 text-[10px] font-black uppercase">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((u) => (
                                <TableRow key={u.id} className="hover:bg-muted/40 transition-colors border-white/5">
                                    <TableCell className="font-bold uppercase text-xs px-6 py-4">{u.name || 'Sin nombre'}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-mono">{u.email}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="border-primary/20 px-2.5 py-0.5 text-[9px] font-black bg-primary/10 text-primary uppercase tracking-widest">
                                            {u.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Select defaultValue={u.role} onValueChange={(val) => handleRoleChange(u.id, val as UserRole)}>
                                            <SelectTrigger className="w-40 ml-auto bg-white/5 border-white/10 h-8 text-[9px] font-black uppercase">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-white/10 text-primary">
                                                <SelectItem value="admin" className="text-[9px] font-bold uppercase">Administrador</SelectItem>
                                                <SelectItem value="editor" className="text-[9px] font-bold uppercase">Editor</SelectItem>
                                                <SelectItem value="viewer" className="text-[9px] font-black uppercase">Lector</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 transition-all">
                                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card border-white/10 text-primary p-1.5 rounded-xl">
                                                <DropdownMenuItem className="text-[10px] font-black uppercase tracking-tight flex items-center gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg" onClick={() => {
                                                    setSelectedUser(u);
                                                    setIsModalOpen(true);
                                                }}>
                                                    <UserIcon className="h-3.5 w-3.5" /> Ver detalles
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* <div className="mt-12 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
                            <Wrench className="h-7 w-7 text-primary" /> Soporte Técnico
                        </h2>
                        <p className="text-muted-foreground mt-1">Gestión de tickets y solicitudes de soporte de los usuarios.</p>
                    </div>
                </div>
                <Card className="border-muted/50 overflow-hidden bg-card/30 p-0">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-4 px-6 text-[10px] font-black uppercase">Ticket ID</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Asunto</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Usuario</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Fecha</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-center">Estado</TableHead>
                                    <TableHead className="text-right px-6 text-[10px] font-black uppercase">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockTickets.map((ticket) => (
                                    <TableRow key={ticket.id} className="hover:bg-white/5 transition-colors border-white/5">
                                        <TableCell className="font-mono text-xs text-primary px-6">{ticket.id}</TableCell>
                                        <TableCell className="font-bold uppercase text-xs text-primary">{ticket.subject}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{ticket.user}</TableCell>
                                        <TableCell className="text-xs font-mono text-muted-foreground">{ticket.date}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={
                                                ticket.status === 'Abierto' ? 'border-red-500/50 bg-red-500/10 text-red-500 text-[9px] font-black uppercase' :
                                                    ticket.status === 'Resuelto' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase' :
                                                        'border-amber-500/50 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase'
                                            }>
                                                {ticket.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10 hover:text-primary">
                                                Ver Ticket
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div> */}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl bg-card border-accent text-primary p-0 overflow-hidden  flex flex-col h-[80vh]">
                    {selectedUser && (
                        <div className="flex flex-col h-full">
                            <DialogHeader className="p-6 bg-card border-b border-accent flex flex-row items-center gap-4 space-y-0">
                                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-black text-primary border-2 border-primary/20 uppercase shadow-inner">
                                    {selectedUser.name?.[0] || 'U'}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <DialogTitle className="text-2xl font-bold tracking-tight uppercase">{selectedUser.name || 'Sin Nombre'}</DialogTitle>
                                    <DialogDescription className="flex items-center gap-3 mt-1.5">
                                        <Badge variant="outline" className="border-primary/20 px-2.5 py-0.5 text-[9px] font-black bg-primary/10 text-primary uppercase tracking-widest">
                                            {selectedUser.role}
                                        </Badge>
                                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> {selectedUser.email}
                                        </span>
                                    </DialogDescription>
                                </div>
                            </DialogHeader>

                            <div className="flex-1 overflow-hidden p-6 space-y-8">
                                <ScrollArea className="h-full pr-4">
                                    {isLoadingProjects ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Sincronizando Terminales...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-10">
                                            {/* Proyectos de Autoría */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                                        <Hammer className="h-4 w-4" /> Proyectos de Autoría
                                                    </h3>
                                                    <Badge variant="outline" className="border-accent bg-card text-[9px] font-black px-2 py-0.5 text-primary">
                                                        {userProjectsByRole.own.length} TOTAL
                                                    </Badge>
                                                </div>
                                                <Separator className="bg-accent" />
                                                <div className="grid grid-cols-1 gap-3">
                                                    {userProjectsByRole.own.length > 0 ? userProjectsByRole.own.map(p => (
                                                        <Link
                                                            key={p.id}
                                                            href={`/projects/${p.id}`}
                                                            className="group flex items-center justify-between p-4 rounded-xl bg-card border border-accent hover:border-primary/30  transition-all"
                                                            onClick={() => setIsModalOpen(false)}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-lg bg-black/40 border border-accent overflow-hidden">
                                                                    <img src={p.imageUrl || 'https://picsum.photos/seed/proj/100/100'} alt={p.title} className="w-full h-full object-cover  group-hover:opacity-100 " />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold uppercase text-primary group-hover:text-primary transition-colors">{p.title}</p>
                                                                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">{p.projectType} • {p.status}</p>
                                                                </div>
                                                            </div>
                                                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        </Link>
                                                    )) : (
                                                        <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/1 opacity-20">
                                                            <p className="text-[9px] font-black uppercase tracking-widest">Sin proyectos de autoría propia</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Proyectos como Colaborador */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
                                                        <Users className="h-4 w-4" /> Colaboraciones Externas
                                                    </h3>
                                                    <Badge variant="outline" className="border-white/10 bg-white/5 text-[9px] font-black px-2 py-0.5 text-blue-400">
                                                        {userProjectsByRole.collab.length} VINCULADOS
                                                    </Badge>
                                                </div>
                                                <Separator className="bg-white/5" />
                                                <div className="grid grid-cols-1 gap-3">
                                                    {userProjectsByRole.collab.length > 0 ? userProjectsByRole.collab.map(p => (
                                                        <Link
                                                            key={p.id}
                                                            href={`/projects/${p.id}`}
                                                            className="group flex items-center justify-between p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all "
                                                            onClick={() => setIsModalOpen(false)}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-lg bg-black/40 border border-blue-500/20 overflow-hidden">
                                                                    <img src={p.imageUrl || 'https://picsum.photos/seed/proj/100/100'} alt={p.title} className="w-full h-full object-cover  group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold uppercase text-primary group-hover:text-blue-400 transition-colors">{p.title}</p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <Badge className="bg-blue-500/20 text-blue-400 border-none text-[7px] font-black uppercase px-1.5 h-3.5">COLABORADOR</Badge>
                                                                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{p.projectType}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                                                        </Link>
                                                    )) : (
                                                        <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/1 opacity-20">
                                                            <p className="text-[9px] font-black uppercase tracking-widest">Sin colaboraciones externas registradas</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>

                            <DialogFooter className="p-6 bg-card border-t border-accent">
                                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-[10px] uppercase tracking-widest w-full h-11 hover:bg-white/5 font-bold bg-primary text-background">
                                    Cerrar Terminal de Usuario
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
