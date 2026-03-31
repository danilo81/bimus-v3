/* eslint-disable @typescript-eslint/no-explicit-any */

// "use client";

// import { useParams, useRouter } from 'next/navigation';
// import { useEffect, useState, useMemo } from 'react';
// import { Project, Task, TaskStatus, TaskPriority } from '../../../../lib/types';
// import { createTask, updateTask, deleteTask } from '../tasks/actions';
// import { getProjectById } from '../../actions';
// import {
//   CheckSquare,
//   Plus,
//   List,
//   LayoutGrid,
//   MoreVertical,
//   Calendar,
//   Flag,
//   Loader2,
//   Edit,
//   Trash2,
//   X,
//   Save,
//   ChevronLeft,
//   Search,
//   Filter
// } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
// import { Button } from '../../../../components/ui/button';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow
// } from '../../../../components/ui/table';
// import { Badge } from '../../../../components/ui/badge';
// import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger
// } from '../../../../components/ui/dropdown-menu';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger
// } from '../../../../components/ui/dialog';
// import { Label } from '../../../../components/ui/label';
// import { Input } from '../../../../components/ui/input';
// import { Textarea } from '../../../../components/ui/textarea';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue
// } from '../../../../components/ui/select';
// import { cn } from '../../../../lib/utils';
// import { useToast } from '../../../../hooks/use-toast';
// import { getTasks } from '../../../../app/tasks/actions';

// export default function ProjectTasksPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { toast } = useToast();
//   const [project, setProject] = useState<Project | null>(null);
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [view, setView] = useState<'list' | 'kanban'>('kanban');
//   const [isCreateOpen, setIsCreateOpen] = useState(false);
//   const [isEditOpen, setIsEditOpen] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isMounted, setIsMounted] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');

//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     priority: 'medium' as TaskPriority,
//     assignee: '',
//     dueDate: new Date().toISOString().split('T')[0],
//     status: 'pendiente' as TaskStatus
//   });

//   const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

//   useEffect(() => {
//     setIsMounted(true);
//     loadData();
//   }, [params.id]);

//   async function loadData() {
//     if (!params.id) return;
//     setLoading(true);
//     try {
//       const [projData, allTasks] = await Promise.all([
//         getProjectById(params.id as string),
//         getTasks()
//       ]);
//       if (projData) setProject(projData as any);
//       setTasks(allTasks.filter((t: any) => t.projectId === params.id) as any);
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   }

//   const filteredTasks = useMemo(() => {
//     return tasks.filter(task =>
//       task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (task.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
//     );
//   }, [tasks, searchTerm]);

//   const getPriorityColor = (priority: TaskPriority) => {
//     switch (priority) {
//       case 'alta': return 'text-red-500 bg-red-500/10 border-red-500/20';
//       case 'media': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
//       case 'baja': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
//       default: return 'text-muted-foreground';
//     }
//   };

//   const getStatusLabel = (status: TaskStatus) => {
//     switch (status) {
//       case 'pendiente': return 'Pendiente';
//       case 'enprogreso': return 'En Progreso';
//       case 'completado': return 'Completado';
//       default: return status;
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { id, value } = e.target;
//     setFormData(prev => ({ ...prev, [id]: value }));
//   };

//   const handleSelectChange = (field: string, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const resetForm = () => {
//     setFormData({
//       title: '',
//       description: '',
//       priority: 'media',
//       assignee: '',
//       dueDate: new Date().toISOString().split('T')[0],
//       status: 'pendiente'
//     });
//     setEditingTaskId(null);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!project) return;
//     setIsSubmitting(true);

//     const result = await createTask({ ...formData, projectId: project.id } as any);
//     if (result.success) {
//       toast({ title: "Tarea creada", description: "La nueva tarea ha sido añadida exitosamente." });
//       loadData();
//       setIsCreateOpen(false);
//       resetForm();
//     } else {
//       toast({ title: "Error", description: result.error, variant: "destructive" });
//     }
//     setIsSubmitting(false);
//   };

//   const handleEditClick = (task: Task) => {
//     setEditingTaskId(task.id);
//     setFormData({
//       title: task.title,
//       description: task.description,
//       priority: task.priority,
//       assignee: task.assignee,
//       dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
//       status: task.status
//     });
//     setIsEditOpen(true);
//   };

//   const handleUpdate = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!editingTaskId) return;
//     setIsSubmitting(true);

//     const result = await updateTask(editingTaskId, formData as any);
//     if (result.success) {
//       toast({ title: "Tarea actualizada", description: "Los cambios han sido guardados correctamente." });
//       loadData();
//       setIsEditOpen(false);
//       resetForm();
//     } else {
//       toast({ title: "Error", description: result.error, variant: "destructive" });
//     }
//     setIsSubmitting(false);
//   };

//   const handleDeleteTask = async (id: string) => {
//     if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
//     const result = await deleteTask(id);
//     if (result.success) {
//       toast({ title: "Tarea eliminada", description: "La tarea ha sido removida del proyecto.", variant: "destructive" });
//       loadData();
//     } else {
//       toast({ title: "Error", description: result.error, variant: "destructive" });
//     }
//   };

//   const ListView = () => (
//     <Card className="bg-[#0a0a0a] border-white/10 text-white overflow-hidden shadow-2xl">
//       <CardContent className="p-0">
//         <Table>
//           <TableHeader className="bg-white/5">
//             <TableRow className="border-white/5 hover:bg-transparent">
//               <TableHead className="text-[10px] font-bold uppercase px-6 py-4">Tarea</TableHead>
//               <TableHead className="text-[10px] font-bold uppercase">Estado</TableHead>
//               <TableHead className="text-[10px] font-bold uppercase">Prioridad</TableHead>
//               <TableHead className="text-[10px] font-bold uppercase">Responsable</TableHead>
//               <TableHead className="text-[10px] font-bold uppercase">Vencimiento</TableHead>
//               <TableHead className="text-[10px] font-bold uppercase text-right px-6">Acciones</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {filteredTasks.length > 0 ? filteredTasks.map((task) => (
//               <TableRow key={task.id} className="border-white/5 hover:bg-white/5 transition-colors">
//                 <TableCell className="py-4 px-6">
//                   <div className="flex flex-col gap-1">
//                     <span className="text-xs font-bold uppercase">{task.title}</span>
//                     <span className="text-[10px] text-muted-foreground line-clamp-1">{task.description}</span>
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2",
//                     task.status === 'completado' ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5' :
//                       task.status === 'enprogreso' ? 'border-primary/50 text-primary bg-primary/5' :
//                         'border-white/20 text-muted-foreground'
//                   )}>
//                     {getStatusLabel(task.status)}
//                   </Badge>
//                 </TableCell>
//                 <TableCell>
//                   <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase w-fit", getPriorityColor(task.priority))}>
//                     <Flag className="h-3 w-3" />
//                     {task.priority}
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
//                     <div className="h-5 w-5 rounded-full bg-white/5 flex items-center justify-center text-[8px] font-bold border border-white/10 text-primary">
//                       {task.assignee?.[0]?.toUpperCase() || 'U'}
//                     </div>
//                     {task.assignee}
//                   </div>
//                 </TableCell>
//                 <TableCell className="text-[10px] font-mono text-muted-foreground font-bold uppercase">
//                   <div className="flex items-center gap-1.5">
//                     <Calendar className="h-3.5 w-3.5" />
//                     {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
//                   </div>
//                 </TableCell>
//                 <TableCell className="text-right px-6">
//                   <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                       <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
//                         <MoreVertical className="h-4 w-4" />
//                       </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl">
//                       <DropdownMenuItem className="text-[10px] font-bold uppercase flex items-center gap-2 cursor-pointer focus:bg-white/5" onClick={() => handleEditClick(task)}>
//                         <Edit className="h-3.5 w-3.5 text-primary" />
//                         <span>Editar</span>
//                       </DropdownMenuItem>
//                       <DropdownMenuItem
//                         className="text-[10px] font-bold uppercase flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10"
//                         onClick={() => handleDeleteTask(task.id)}
//                       >
//                         <Trash2 className="h-3.5 w-3.5 text-destructive" />
//                         <span>Eliminar</span>
//                       </DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 </TableCell>
//               </TableRow>
//             )) : (
//               <TableRow>
//                 <TableCell colSpan={6} className="text-center py-20 text-muted-foreground text-xs italic">
//                   No se encontraron tareas.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </CardContent>
//     </Card>
//   );

//   const KanbanView = () => {
//     const columns: TaskStatus[] = ['pendiente', 'enprogreso', 'completado'];

//     return (
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {columns.map((column) => (
//           <div key={column} className="flex flex-col gap-4">
//             <div className="flex items-center justify-between px-2">
//               <div className="flex items-center gap-3">
//                 <h3 className="font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">
//                   {getStatusLabel(column)}
//                 </h3>
//                 <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black px-2 py-0">
//                   {filteredTasks.filter(t => t.status === column).length}
//                 </Badge>
//               </div>
//             </div>

//             <div className="flex flex-col gap-3 min-h-[600px] p-3 rounded-2xl bg-black/20 border border-dashed border-white/5">
//               {filteredTasks
//                 .filter(t => t.status === column)
//                 .map(task => (
//                   <Card key={task.id} className="bg-[#0d0d0d] border-white/5 hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing group shadow-lg">
//                     <CardHeader className="p-4 space-y-3">
//                       <div className="flex justify-between items-start">
//                         <div className={cn("px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest", getPriorityColor(task.priority))}>
//                           {task.priority}
//                         </div>
//                         <DropdownMenu>
//                           <DropdownMenuTrigger asChild>
//                             <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
//                               <MoreVertical className="h-3 w-3" />
//                             </Button>
//                           </DropdownMenuTrigger>
//                           <DropdownMenuContent align="end" className="bg-[#111] border-white/10 text-white shadow-2xl">
//                             <DropdownMenuItem className="text-[10px] font-bold uppercase flex items-center gap-2 cursor-pointer focus:bg-white/5" onClick={() => handleEditClick(task)}>
//                               <Edit className="h-3.5 w-3.5 text-primary" /> Editar
//                             </DropdownMenuItem>
//                             <DropdownMenuItem
//                               className="text-[10px] font-bold uppercase text-destructive flex items-center gap-2 cursor-pointer focus:bg-destructive/10"
//                               onClick={() => handleDeleteTask(task.id)}
//                             >
//                               <Trash2 className="h-3.5 w-3.5 text-destructive" /> Eliminar
//                             </DropdownMenuItem>
//                           </DropdownMenuContent>
//                         </DropdownMenu>
//                       </div>
//                       <CardTitle className="text-xs font-bold text-white line-clamp-2 leading-relaxed uppercase">{task.title}</CardTitle>
//                       <CardDescription className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</CardDescription>
//                     </CardHeader>
//                     <CardContent className="p-4 pt-0 flex items-center justify-between mt-2">
//                       <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground font-bold uppercase">
//                         <Calendar className="h-3 w-3" />
//                         {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }) : '-'}
//                       </div>
//                       <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary uppercase">
//                         {task.assignee?.[0]?.toUpperCase() || 'U'}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   if (!isMounted) return null;

//   if (loading) return (
//     <div className="flex flex-col min-h-screen bg-[#050505] items-center justify-center gap-4">
//       <Loader2 className="h-8 w-8 animate-spin text-primary" />
//       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Tareas...</p>
//     </div>
//   );

//   return (
//     <div className="flex flex-col min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div className="flex items-center gap-4">
//           <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={() => router.back()}>
//             <ChevronLeft className="h-6 w-6" />
//           </Button>
//           <div>
//             <h1 className="text-2xl font-bold flex items-center gap-3 font-headline">
//               <CheckSquare className="h-7 w-7 text-primary" /> Tareas: {project?.title}
//             </h1>
//             <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Gestión operativa del proyecto</p>
//           </div>
//         </div>
//       </div>

//       <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card/30 p-4 rounded-xl border border-muted/50 backdrop-blur-sm">
//         <div className="relative w-full lg:max-w-md">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input
//             placeholder="Buscar tareas..."
//             className="pl-10 bg-background/50 border-muted/50"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         <div className="flex items-center gap-4">
//           <Tabs value={view} onValueChange={(v: any) => setView(v as 'list' | 'kanban')} className="w-auto">
//             <TabsList className="bg-background/50 border border-muted/50">
//               <TabsTrigger value="list" className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest px-6">
//                 <List className="h-3.5 w-3.5" /> Lista
//               </TabsTrigger>
//               <TabsTrigger value="kanban" className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest px-6">
//                 <LayoutGrid className="h-3.5 w-3.5" /> Kanban
//               </TabsTrigger>
//             </TabsList>
//           </Tabs>

//           <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
//             <DialogTrigger asChild>
//               <Button className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest px-8 h-11 shadow-lg shadow-primary/20">
//                 <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
//               </Button>
//             </DialogTrigger>
//             <DialogContent className="max-w-lg bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl">
//               <form onSubmit={handleSubmit}>
//                 <DialogHeader className="p-6 border-b border-white/5 bg-white/2">
//                   <div className="flex items-center gap-3">
//                     <div className="p-2 bg-primary/20 rounded-lg">
//                       <CheckSquare className="h-6 w-6 text-primary" />
//                     </div>
//                     <div>
//                       <DialogTitle className="text-lg font-bold uppercase tracking-tight">Crear Actividad</DialogTitle>
//                       <DialogDescription className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mt-1">Defina los detalles de la nueva tarea para el proyecto.</DialogDescription>
//                     </div>
//                   </div>
//                 </DialogHeader>
//                 <div className="p-6 space-y-5">
//                   <div className="space-y-2">
//                     <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título de la Tarea</Label>
//                     <Input id="title" value={formData.title} onChange={handleInputChange} className="bg-black/40 border-white/10 h-11 text-xs uppercase font-bold" placeholder="Ej: Revisión de planos..." required />
//                   </div>

//                   <div className="space-y-2">
//                     <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción</Label>
//                     <Textarea id="description" value={formData.description} onChange={handleInputChange} className="bg-black/40 border-white/10 min-h-[100px] text-xs resize-none" placeholder="Detalles de la actividad..." />
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                       <Label htmlFor="priority" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prioridad</Label>
//                       <Select value={formData.priority} onValueChange={(val) => handleSelectChange('priority', val)}>
//                         <SelectTrigger className="bg-black/40 border-white/10 h-11 text-xs uppercase font-bold">
//                           <SelectValue placeholder="Prioridad" />
//                         </SelectTrigger>
//                         <SelectContent className="bg-[#111] border-white/10 text-white shadow-2xl">
//                           <SelectItem value="low" className="text-[10px] font-bold uppercase">Baja</SelectItem>
//                           <SelectItem value="medium" className="text-[10px] font-bold uppercase">Media</SelectItem>
//                           <SelectItem value="high" className="text-[10px] font-bold uppercase">Alta</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="assignee" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Responsable</Label>
//                       <Input id="assignee" value={formData.assignee} onChange={handleInputChange} className="bg-black/40 border-white/10 h-11 text-xs uppercase font-bold" placeholder="Nombre..." />
//                     </div>
//                   </div>

//                   <div className="space-y-2">
//                     <Label htmlFor="dueDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha de Vencimiento</Label>
//                     <Input id="dueDate" type="date" value={formData.dueDate} onChange={handleInputChange} className="bg-black/40 border-white/10 h-11 text-xs font-mono" />
//                   </div>
//                 </div>
//                 <DialogFooter className="p-6 border-t border-white/5 bg-black/20 gap-3">
//                   <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting} className="text-[10px] font-black uppercase tracking-widest hover:bg-white/5">
//                     Cancelar
//                   </Button>
//                   <Button type="submit" className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest px-8 h-11 shadow-xl shadow-primary/10" disabled={isSubmitting}>
//                     {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
//                     Guardar Tarea
//                   </Button>
//                 </DialogFooter>
//               </form>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       <div className="space-y-6">
//         <div className="flex flex-col gap-4">
//           <div className="flex items-center justify-end gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-4">
//             <div className="flex items-center gap-1.5">
//               <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Alta
//             </div>
//             <div className="flex items-center gap-1.5">
//               <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> Media
//             </div>
//             <div className="flex items-center gap-1.5">
//               <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Baja
//             </div>
//           </div>

//           <div className="mt-4">
//             {view === 'list' ? <ListView /> : <KanbanView />}
//           </div>
//         </div>
//       </div>

//       <Dialog open={isEditOpen} onOpenChange={(open) => !open && resetForm()}>
//         <DialogContent className="max-w-lg bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden shadow-2xl">
//           <form onSubmit={handleUpdate}>
//             <DialogHeader className="p-6 border-b border-white/5 bg-white/2">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 bg-primary/20 rounded-lg">
//                   <Edit className="h-6 w-6 text-primary" />
//                 </div>
//                 <div>
//                   <DialogTitle className="text-lg font-bold uppercase tracking-tight">Editar Tarea</DialogTitle>
//                   <DialogDescription className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mt-1">Modifique los parámetros de la actividad seleccionada.</DialogDescription>
//                 </div>
//               </div>
//             </DialogHeader>
//             <div className="p-6 space-y-5">
//               <div className="space-y-2">
//                 <Label htmlFor="edit-title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título</Label>
//                 <Input id="title" value={formData.title} onChange={handleInputChange} className="bg-black/40 border-white/10 h-11 text-xs uppercase font-bold" required />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="edit-description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción</Label>
//                 <Textarea id="description" value={formData.description} onChange={handleInputChange} className="bg-black/40 border-white/10 min-h-[100px] text-xs resize-none" />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="edit-status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</Label>
//                   <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val as TaskStatus)}>
//                     <SelectTrigger className="bg-black/40 border-white/10 h-11 text-xs uppercase font-bold">
//                       <SelectValue placeholder="Estado" />
//                     </SelectTrigger>
//                     <SelectContent className="bg-[#111] border-white/10 text-white">
//                       <SelectItem value="pendiente" className="text-[10px] font-bold uppercase">Pendiente</SelectItem>
//                       <SelectItem value="enprogreso" className="text-[10px] font-bold uppercase">En Progreso</SelectItem>
//                       <SelectItem value="completado" className="text-[10px] font-bold uppercase">Completado</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="edit-priority" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prioridad</Label>
//                   <Select value={formData.priority} onValueChange={(val) => handleSelectChange('priority', val as TaskPriority)}>
//                     <SelectTrigger className="bg-black/40 border-white/10 h-11 text-xs uppercase font-bold">
//                       <SelectValue placeholder="Prioridad" />
//                     </SelectTrigger>
//                     <SelectContent className="bg-[#111] border-white/10 text-white">
//                       <SelectItem value="low" className="text-[10px] font-bold uppercase">Baja</SelectItem>
//                       <SelectItem value="medium" className="text-[10px] font-bold uppercase">Media</SelectItem>
//                       <SelectItem value="high" className="text-[10px] font-bold uppercase">Alta</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="edit-assignee" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Responsable</Label>
//                   <Input id="assignee" value={formData.assignee} onChange={handleInputChange} className="bg-black/40 border-white/10 h-11 text-xs uppercase font-bold" />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="edit-dueDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha Vencimiento</Label>
//                   <Input id="dueDate" type="date" value={formData.dueDate} onChange={handleInputChange} className="bg-black/40 border-white/10 h-11 text-xs font-mono" />
//                 </div>
//               </div>
//             </div>
//             <DialogFooter className="p-6 border-t border-white/5 bg-black/20 gap-3">
//               <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isSubmitting} className="text-[10px] font-black uppercase tracking-widest hover:bg-white/5">
//                 <X className="mr-2 h-4 w-4" /> Cancelar
//               </Button>
//               <Button type="submit" className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest px-8 h-11 shadow-xl shadow-primary/10" disabled={isSubmitting}>
//                 {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
//                 Actualizar Tarea
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }


"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
    Card,
    CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    CheckSquare,
    Plus,
    List,
    LayoutGrid,
    MoreVertical,
    Calendar,
    Flag,
    Loader2,
    Edit,
    Trash2,
    X,
    Save,
    Briefcase,
    Search,
    GripVertical,
    User
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Task, TaskStatus, TaskPriority } from '@/types/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getTasks, createTask, updateTask, deleteTask } from './actions';
import { getProjects } from '@/app/projects/actions';

// DnD Kit Imports
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    closestCorners,
    DragStartEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function TasksPage() {
    const params = useParams();
    const projectId = params?.id as string;
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
    const { toast } = useToast();

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
        projectId: projectId || '',
        assignee: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pendiente' as TaskStatus
    });

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
        if (projectId) {
            loadData();
        }
    }, [projectId]);

    async function loadData() {
        setLoading(true);
        try {
            const [tasksData, projectsData] = await Promise.all([
                getTasks(projectId),
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
            projectId: projectId || '',
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
            loadData();
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
            loadData();
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
            loadData();
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
            loadData();
        }
    };

    const ListView = () => (
        <Card className="border-accent bg-transparent backdrop-blur-md overflow-hidden  p-0">
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-accent">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[30%] px-6 py-4 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Tarea</TableHead>
                            <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Proyecto</TableHead>
                            <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Estado</TableHead>
                            <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Prioridad</TableHead>
                            <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Responsable</TableHead>
                            <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Vencimiento</TableHead>
                            <TableHead className="text-right px-6 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                            <TableRow key={task.id} className="hover:bg-primary/5 transition-colors border-primary/5">
                                <TableCell className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-primary uppercase text-[12px] tracking-tight">{task.title}</span>
                                        <span className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{task.description}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground uppercase">
                                        <Briefcase className="h-3 w-3 text-primary" />
                                        {task.projectName}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("text-[12px] font-black tracking-widest uppercase py-0.5 border-accent",
                                        task.status === 'completado' ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20' :
                                            task.status === 'enprogreso' ? 'text-primary bg-primary/5 border-primary/20' :
                                                'text-muted-foreground'
                                    )}>
                                        {getStatusLabel(task.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[12px] font-black uppercase w-fit", getPriorityColor(task.priority))}>
                                        <Flag className="h-2.5 w-2.5" />
                                        {task.priority}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-primary/5 flex items-center justify-center text-[12px] text-primary font-black border border-accent">
                                            {task.assignee?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <span className="text-[12px] font-bold uppercase text-muted-foreground">{task.assignee}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-[12px] text-muted-foreground font-mono font-bold">
                                    <div className="flex items-center gap-1.5 uppercase">
                                        <Calendar className="h-3 w-3" />
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right px-6">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-card border-accent text-primary shadow-2xl">
                                            <DropdownMenuItem className="text-[10px] font-black uppercase tracking-tighter" onClick={() => handleEditClick(task)}>
                                                <Edit className="h-3.5 w-3.5 text-primary" />
                                                <span>Editar</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-[10px] font-black uppercase text-destructive flex items-center gap-2 cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                                                onClick={() => handleDeleteTask(task.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                <span>Eliminar</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-32 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-3">
                                        <CheckSquare className="h-12 w-12 opacity-5" />
                                        <p className="text-lg font-bold">No se encontraron tareas</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    const KanbanView = () => {
        const columns: TaskStatus[] = ['pendiente', 'enprogreso', 'completado'];

        return (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-accent">
                    {columns.map((column) => (
                        <KanbanColumn
                            key={column}
                            id={column}
                            title={getStatusLabel(column)}
                            tasks={filteredTasks.filter(t => t.status === column)}
                            handleEditClick={handleEditClick}
                            handleDeleteTask={handleDeleteTask}
                            getPriorityColor={getPriorityColor}

                        />
                    ))}
                </div>
                <DragOverlay dropAnimation={null}>
                    {activeId ? (
                        <div className="opacity-90 cursor-grabbing rotate-2 scale-105 pointer-events-none ">
                            <TaskCard
                                task={tasks.find(t => t.id === activeId)!}
                                getPriorityColor={getPriorityColor}
                                isOverlay
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        );
    };

    if (!isMounted) return null;

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card w-fit">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3 text-primary">
                        <CheckSquare className="h-8 w-8 text-primary" /> Tareas del proyecto
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Control de tareas del proyecto</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-accent ">
                <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar tareas por titulo, descripción o proyecto..."
                        className="pl-10 bg-card border-accent h-11 text-[10px] font-bold  tracking-widest w-140"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-end gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-4">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> ALTA
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> MEDIA
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> BAJA
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Tabs value={view} onValueChange={(v: any) => setView(v as 'list' | 'kanban')} className="w-auto">
                        <TabsList className="bg-card border border-accent p-1 rounded-xl h-11">
                            <TabsTrigger value="list" className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest px-6 data-[state=active]:bg-card data-[state=active]:text-primary h-full">
                                <List className="h-3.5 w-3.5" /> Lista
                            </TabsTrigger>
                            <TabsTrigger value="kanban" className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest px-6 data-[state=active]:bg-card data-[state=active]:text-primary h-full">
                                <LayoutGrid className="h-3.5 w-3.5" /> Kanban
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/20 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11  rounded-xl">
                                <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-131.25 bg-card border-accent text-primary p-0 overflow-hidden shadow-2xl">
                            <form onSubmit={handleSubmit} className="flex flex-col">
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
                                <div className="px-6 py-6 space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título de la Tarea</Label>
                                        <Input id="title" value={formData.title} onChange={handleInputChange} placeholder="Ej: Revisión de planos..." className="bg-card border-accent h-11 uppercase text-xs font-bold" required />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción</Label>
                                        <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder="Detalles de la actividad..." className="min-h-20 bg-card border-accent text-xs" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="projectId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proyecto Destino</Label>
                                            <Select value={formData.projectId} onValueChange={(val: any) => handleSelectChange('projectId', val)} required>
                                                <SelectTrigger className="bg-card border-accent h-11 w-full text-[10px] uppercase font-black">
                                                    <SelectValue placeholder="Seleccione..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-accent">
                                                    {projects.map(p => (
                                                        <SelectItem key={p.id} value={p.id} className="uppercase text-[10px] font-bold">{p.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="priority" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prioridad</Label>
                                            <Select value={formData.priority} onValueChange={(val) => handleSelectChange('priority', val)}>
                                                <SelectTrigger className="bg-card border-accent h-11 w-full text-[10px] uppercase font-black">
                                                    <SelectValue placeholder="Prioridad" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-accent">
                                                    <SelectItem value="baja" className="uppercase text-[10px] font-bold">Baja</SelectItem>
                                                    <SelectItem value="media" className="uppercase text-[10px] font-bold">Media</SelectItem>
                                                    <SelectItem value="alta" className="uppercase text-[10px] font-bold">Alta</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="assignee" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Responsable</Label>
                                            <Input id="assignee" value={formData.assignee} onChange={handleInputChange} className="bg-card border-accent h-11 uppercase text-xs font-bold" placeholder="Nombre..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dueDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vencimiento</Label>
                                            <Input id="dueDate" type="date" value={formData.dueDate} onChange={handleInputChange} className="bg-card border-accent h-11 font-mono text-xs" />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="p-6  border-t border-primary/5 gap-3 items-center justify-between">
                                    <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="bg-primary hover:bg-muted/40 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11 " disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Guardar Tarea
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex flex-col gap-4">

                    <div className="mt-4">
                        {view === 'list' ? <ListView /> : <KanbanView />}
                    </div>
                </div>
            </div>

            <Dialog open={isEditOpen} onOpenChange={(open: any) => !open && resetForm()}>
                <DialogContent className="sm:max-w-131.25 bg-card border-accent text-primary p-0 overflow-hidden shadow-2xl">
                    <form onSubmit={handleUpdate} className="flex flex-col">
                        <DialogHeader className="p-6 border-b border-primary/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                                    <Edit className="h-5 w-5 text-primary" />
                                </div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary">Editar Actividad</DialogTitle>
                            </div>
                        </DialogHeader>
                        <div className="px-6 py-6 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título</Label>
                                <Input id="title" value={formData.title} onChange={handleInputChange} className="bg-card border-accent h-11 uppercase text-xs font-bold" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción</Label>
                                <Textarea id="description" value={formData.description} onChange={handleInputChange} className="min-h-20 bg-card border-accent text-xs resize-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</Label>
                                    <Select value={formData.status} onValueChange={(val: any) => handleSelectChange('status', val as TaskStatus)}>
                                        <SelectTrigger className="bg-card border-accent h-11 w-full text-[10px] font-black uppercase">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-accent text-primary">
                                            <SelectItem value="pendiente" className="uppercase text-[10px] font-bold">Pendiente</SelectItem>
                                            <SelectItem value="enprogreso" className="uppercase text-[10px] font-bold">En Progreso</SelectItem>
                                            <SelectItem value="completado" className="uppercase text-[10px] font-bold">Completado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-priority" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prioridad</Label>
                                    <Select value={formData.priority} onValueChange={(val: any) => handleSelectChange('priority', val as TaskPriority)}>
                                        <SelectTrigger className="bg-card border-accent h-11 w-full text-[10px] font-black uppercase">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-accent text-primary">
                                            <SelectItem value="baja" className="uppercase text-[10px] font-bold">Baja</SelectItem>
                                            <SelectItem value="media" className="uppercase text-[10px] font-bold">Media</SelectItem>
                                            <SelectItem value="alta" className="uppercase text-[10px] font-bold">Alta</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-assignee" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Responsable</Label>
                                    <Input id="assignee" value={formData.assignee} onChange={handleInputChange} className="bg-card border-accent h-11 uppercase text-xs font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-dueDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vencimiento</Label>
                                    <Input id="dueDate" type="date" value={formData.dueDate} onChange={handleInputChange} className="bg-card border-accent h-11 font-mono text-xs" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="p-6 border-t border-primary/5 gap-3 items-center justify-center">
                            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isSubmitting} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
                                <X className="mr-2 h-4 w-4" /> Cancelar
                            </Button>
                            <Button type="submit" className="bg-secondary hover:bg-muted/40 text-primary font-black text-[10px] uppercase tracking-widest px-8 h-11 " disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Actualizar Tarea
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    );
}

function KanbanColumn({ id, title, tasks, handleEditClick, handleDeleteTask, getPriorityColor }: any) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col gap-4 ">
            <div className="flex items-center justify-between px-3 ">
                <div className="flex items-center gap-3 ">
                    <h3 className="font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground ">
                        {title}
                    </h3>
                    <div className="h-5 w-5 rounded-full bg-card flex items-center justify-center text-[10px] font-black text-muted-foreground border border-accent">
                        {tasks.length}
                    </div>
                </div>
            </div>

            <SortableContext id={id} items={tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
                <div
                    ref={setNodeRef}
                    className="flex flex-col gap-3 min-h-150 p-3 rounded-2xl  border border-dashed border-primary/5 bg-card"
                >
                    {tasks.map((task: any) => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            handleEditClick={handleEditClick}
                            handleDeleteTask={handleDeleteTask}
                            getPriorityColor={getPriorityColor}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}

function SortableTaskCard({ task, handleEditClick, handleDeleteTask, getPriorityColor }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <TaskCard
                task={task}
                handleEditClick={handleEditClick}
                handleDeleteTask={handleDeleteTask}
                getPriorityColor={getPriorityColor}
                dragListeners={listeners}
            />
        </div>
    );
}

function TaskCard({ task, handleEditClick, handleDeleteTask, getPriorityColor, dragListeners, isOverlay }: any) {
    return (
        <Card className={cn(
            "border-accent bg-card hover:border-primary/50 transition-all group shadow-sm relative overflow-hidden flex flex-col p-0",
            isOverlay ? "cursor-grabbing" : "cursor-grab"
        )}>
            {/* Priority Side Bar */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-4", getPriorityColor(task.priority))} />

            <div className="p-3.5 space-y-3.5">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            {!isOverlay && (
                                <div className="flex flex-row items-center justify-between gap-2 ">
                                    <div {...dragListeners} className="p-0 hover:bg-white/5 rounded text-muted-foreground/20 cursor-grab active:cursor-grabbing">
                                        <GripVertical className="h-8 w-8" />
                                    </div>
                                    <div className="flex flex-col gap-2 w-60">
                                        <div className="text-[16px] font-bold text-primary leading-tight uppercase tracking-tight line-clamp-2">
                                            {task.title}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground uppercase font-black tracking-tighter opacity-60">
                                            <Briefcase className="h-4 w-4 text-primary" /> {task.projectName || 'Sin Proyecto'}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-center">
                                        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground uppercase font-black tracking-tighter opacity-60">
                                            <User className="h-4 w-4 text-primary" /> {task.assignee || 'Sin Asignar'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-mono font-bold uppercase opacity-60 bg-white/5 px-2 py-1 rounded">
                                            <Calendar className="h-4 w-4" />
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' }) : '--/--/--'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {!isOverlay && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="default" size="icon" className="h-7 w-7 bg-transparent hover:bg-muted/40">
                                    <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-accent text-primary shadow-lg">
                                <DropdownMenuItem className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer" onClick={() => handleEditClick(task)}>
                                    <Edit className="h-3.5 w-3.5 text-primary" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-[10px] font-black uppercase text-destructive flex items-center gap-2 cursor-pointer focus:bg-destructive/10"
                                    onClick={() => handleDeleteTask(task.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" /> Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </Card>
    );
}
