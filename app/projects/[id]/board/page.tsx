/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { BimTopic, BimTopicStatus } from '../../../../lib/types';
import { getProjectById } from '../../actions';
import { getBimDocument, upsertBimTopic, deleteBimTopic, applyBimTemplate, createTopicWithChildren } from './actions';
import {
    Plus,
    Search,
    MoreVertical,
    Trash2,
    Save,
    X,
    Loader2,
    FileText,
    LayoutTemplate,
    PlusCircle,
    Layers,
    CloudUpload
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { useToast } from '../../../../hooks/use-toast';
import { cn } from '../../../../lib/utils';
import { Label } from '../../../../components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../../components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../../components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../../../components/ui/dialog';
import { Separator } from '../../../../components/ui/separator';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../../../../components/ui/accordion";

import { ParagraphNode, TextNode } from "lexical"

import { InitialConfigType } from '@lexical/react/LexicalComposer';
import { editorTheme } from '@/components/editor/themes/editor-theme';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { EditorRich } from '@/components/layout/EditorRich';


export default function BimDocumentationPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [project, setProject] = useState<any>(null);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [topics, setTopics] = useState<BimTopic[]>([]);
    const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('none');
    const [isMounted, setIsMounted] = useState(false);

    // Local Editor States
    const [localTitle, setLocalTitle] = useState('');
    const [localContent, setLocalContent] = useState('');
    const [localStatus, setLocalStatus] = useState<BimTopicStatus>('in_progress');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createParentId, setCreateParentId] = useState<string | null>(null);
    const [newTopicData, setNewTopicData] = useState({
        title: '',
        children: [] as string[]
    });

    const projectId = useMemo(() => {
        const id = params?.id;
        return Array.isArray(id) ? id[0] : id;
    }, [params?.id]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchData = useCallback(async () => {
        if (!projectId) return;

        setIsLoading(true);
        try {
            const [proj, bimDoc] = await Promise.all([
                getProjectById(projectId),
                getBimDocument(projectId)
            ]);

            if (proj) setProject(proj);
            if (bimDoc.success) {
                setTopics(bimDoc.topics || []);
                setDocumentId(bimDoc.documentId || null);
                if (bimDoc.topics && bimDoc.topics.length > 0 && !selectedTopicId) {
                    setSelectedTopicId(bimDoc.topics[0].id);
                }
            } else {
                toast({ title: "Error", description: bimDoc.error, variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, toast, selectedTopicId]);

    useEffect(() => {
        if (isMounted) {
            fetchData();
        }
    }, [isMounted, fetchData]);

    const findTopicById = useCallback((list: BimTopic[], id: string): BimTopic | null => {
        for (const t of list) {
            if (t.id === id) return t;
            if (t.children) {
                const found = findTopicById(t.children, id);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const selectedTopic = useMemo(() => {
        if (!selectedTopicId) return null;
        return findTopicById(topics, selectedTopicId);
    }, [topics, selectedTopicId, findTopicById]);

    useEffect(() => {
        if (selectedTopic) {
            setLocalTitle(selectedTopic.title || '');
            setLocalContent(selectedTopic.content || '');
            setLocalStatus(selectedTopic.status || 'in_progress');
            setHasUnsavedChanges(false);
        }
    }, [selectedTopic]);

    const filteredTopics = useMemo(() => {
        if (!sidebarSearchTerm.trim()) return topics;

        const term = sidebarSearchTerm.toLowerCase();
        return topics.filter(topic => {
            const matchesParent = topic.title.toLowerCase().includes(term) || (topic.content || '').toLowerCase().includes(term);
            const matchesChildren = topic.children?.some(c => c.title.toLowerCase().includes(term) || (c.content || '').toLowerCase().includes(term));
            return matchesParent || matchesChildren;
        });
    }, [topics, sidebarSearchTerm]);

    const handlePersistChanges = async () => {
        if (!documentId || !selectedTopicId || !projectId) {
            toast({ title: "Error", description: "Datos incompletos para guardar.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const result = await upsertBimTopic({
                id: selectedTopicId,
                documentId,
                projectId,
                title: localTitle,
                content: localContent,
                status: localStatus,
                order: selectedTopic?.order || 0
            });

            if (result.success) {
                setHasUnsavedChanges(false);
                toast({ title: "Cambios guardados exitosamente" });
                await fetchData();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Fallo al guardar", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenCreateModal = (parentId: string | null = null) => {
        setCreateParentId(parentId);
        setNewTopicData({ title: '', children: [''] });
        setIsCreateModalOpen(true);
    };

    const handleAddSubTopicField = () => {
        setNewTopicData(prev => ({
            ...prev,
            children: [...prev.children, '']
        }));
    };

    const handleRemoveSubTopicField = (index: number) => {
        setNewTopicData(prev => ({
            ...prev,
            children: prev.children.filter((_, i) => i !== index)
        }));
    };

    const handleSubTopicChange = (index: number, value: string) => {
        setNewTopicData(prev => {
            const newChildren = [...prev.children];
            newChildren[index] = value;
            return { ...prev, children: newChildren };
        });
    };

    const handleConfirmCreate = async () => {
        if (!projectId) {
            toast({ title: "Error", description: "Proyecto no detectado.", variant: "destructive" });
            return;
        }
        if (!documentId) {
            toast({ title: "Error", description: "Documento BIM no inicializado.", variant: "destructive" });
            return;
        }
        if (!newTopicData.title.trim()) {
            toast({ title: "Validación", description: "El título del tópico es obligatorio.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const validChildren = newTopicData.children.filter(c => c.trim() !== '');
            const result = await createTopicWithChildren({
                documentId,
                projectId,
                parentId: createParentId,
                title: newTopicData.title,
                children: validChildren
            });

            if (result.success) {
                toast({ title: "Estructura creada correctamente" });
                setIsCreateModalOpen(false);
                await fetchData();
                if (result.topic) setSelectedTopicId(result.topic.id);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error de servidor", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!projectId || !confirm('¿Estás seguro de eliminar esta sección permanentemente?')) return;
        setIsSaving(true);
        try {
            const result = await deleteBimTopic(id, projectId);
            if (result.success) {
                toast({ title: "Tópico eliminado", variant: "destructive" });
                if (selectedTopicId === id) setSelectedTopicId(null);
                await fetchData();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleApplyTemplate = async (templateId: string) => {
        if (templateId === 'none' || !projectId) return;
        if (!confirm('Esta acción reemplazará toda la documentación actual con la nueva plantilla. ¿Continuar?')) return;

        setIsSaving(true);
        try {
            const result = await applyBimTemplate(projectId, templateId);
            if (result.success) {
                toast({ title: "Plantilla aplicada con éxito" });
                setSelectedTopicId(null);
                await fetchData();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error técnico", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
            setSelectedTemplate('none');
        }
    };
    ////////////////////////////////////////////
    const editorConfig: InitialConfigType = {
        namespace: "Editor",
        theme: editorTheme,
        nodes: [HeadingNode, ParagraphNode, TextNode, QuoteNode, ListNode, ListItemNode],
        onError: (error: Error) => {
            console.error(error)
        },
    }

    /////////////////////////////
    if (!isMounted) return null;

    return (
        <div className="flex flex-col h-screen text-primary overflow-hidden">

            <div className="flex flex-1 overflow-hidden  ">
                <aside className=" border border-accent  flex flex-col shrink-0 overflow-hidden bg-card rounded-lg opacity-99 m-2 max-h-[90vh]">
                    <div className="p-4 border-b border-accent  space-y-4">
                        <div className="relative bg-card">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                className="pl-9 h-9 bg-card border-accent text-[10px] font-bold"
                                value={sidebarSearchTerm}
                                onChange={(e) => setSidebarSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-primary tracking-widest px-1">Inicializar Estructura</Label>
                            <Select value={selectedTemplate} onValueChange={handleApplyTemplate}>
                                <SelectTrigger className="h-9 bg-card border-accent  text-[10px] font-black uppercase w-full">
                                    <div className="flex items-center gap-2">
                                        <LayoutTemplate className="h-3 w-3 text-primary" />
                                        <SelectValue placeholder="ELEGIR ESTRUCTURA..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-card text-primary border-accent">
                                    <SelectItem value="none" className="text-[9px] font-bold uppercase">Seleccionar...</SelectItem>
                                    <SelectItem value="iso_19650" className="text-[9px] font-bold uppercase">ISO 19650 Requerimientos</SelectItem>
                                    <SelectItem value="bep_only" className="text-[9px] font-bold uppercase">Plan de Ejecución (BEP)</SelectItem>
                                    <SelectItem value="construction_phase" className="text-[9px] font-bold uppercase">Protocolos de Obra</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-3 space-y-2">
                            {filteredTopics.length > 0 ? (
                                filteredTopics.map((topic) => (
                                    <div key={topic.id} className={cn(
                                        "rounded-xl border transition-all group/card overflow-hidden",
                                        selectedTopicId === topic.id ? "border-accent bg-primary/10" : "border-accent bg-card hover:border-accent"
                                    )}>
                                        <div
                                            className="p-2.5 flex items-center justify-between cursor-pointer"
                                            onClick={() => {
                                                if (hasUnsavedChanges && !confirm('Cambios sin guardar en esta sección. ¿Deseas descartarlos?')) return;
                                                setSelectedTopicId(topic.id);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className={cn("h-1.5 w-1.5 rounded-full shrink-0",
                                                    topic.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'
                                                )} />
                                                <span className={cn("text-[10px] font-black uppercase tracking-tight truncate",
                                                    selectedTopicId === topic.id ? "text-primary" : "text-primary"
                                                )}>
                                                    {topic.title}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenCreateModal(topic.id); }}
                                                className="p-1 hover:bg-primary/20 rounded text-primary opacity-0 group-hover/card:opacity-100 transition-opacity"
                                            >
                                                <PlusCircle className="h-3 w-3" />
                                            </button>
                                        </div>

                                        {topic.children && topic.children.length > 0 && (
                                            <Accordion type="single" collapsible className="w-full">
                                                <AccordionItem value="subs" className="border-none">
                                                    <AccordionTrigger className="px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:no-underline hover:text-primary transition-colors bg-card h-6">
                                                        Páginas ({topic.children.length})
                                                    </AccordionTrigger>
                                                    <AccordionContent className="p-0">
                                                        <div className="flex flex-col border-t border-accent bg-card">
                                                            {topic.children.map(child => (
                                                                <div
                                                                    key={child.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (hasUnsavedChanges && !confirm('Cambios sin guardar.')) return;
                                                                        setSelectedTopicId(child.id);
                                                                    }}
                                                                    className={cn(
                                                                        "pl-8 pr-3 py-2 text-[9px] font-bold uppercase cursor-pointer hover:bg-white/5 transition-all border-l-2",
                                                                        selectedTopicId === child.id ? "text-primary border-primary bg-primary/5" : "text-muted-foreground border-transparent"
                                                                    )}
                                                                >
                                                                    {child.title}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        )}
                                    </div>
                                ))
                            ) : isLoading ? (
                                <div className="py-20 text-center opacity-30"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                            ) : (
                                <div className="py-20 text-center opacity-20 flex flex-col items-center gap-3">
                                    <Layers className="h-10 w-10" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin registros documentales</p>
                                </div>
                            )}

                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 h-10 text-[9px] font-black uppercase text-primary hover:bg-primary/10 border border-dashed border-primary/20 rounded-xl mt-2"
                                onClick={() => handleOpenCreateModal(null)}
                            >
                                <PlusCircle className="h-4 w-4" /> Nuevo Tópico
                            </Button>
                        </div>
                    </ScrollArea>
                </aside>

                <main className="flex-1 flex flex-col  overflow-hidden relative">
                    {selectedTopic ? (
                        <div className="flex flex-col h-full animate-in fade-in duration-500">
                            <div className="h-14 border border-accent bg-card flex items-center justify-between px-8 shrink-0 rounded-xl m-2">
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className={cn("text-[8px] font-black uppercase border-none px-2",
                                        localStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                    )}>
                                        {localStatus.replace('_', ' ')}
                                    </Badge>
                                    {hasUnsavedChanges && (
                                        <Badge className="bg-amber-500/20 text-amber-500 border-none text-[8px] font-black uppercase">Pendiente de guardado</Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 bg-card border-accent ">
                                    <Button
                                        onClick={handlePersistChanges}
                                        disabled={!hasUnsavedChanges || isSaving}
                                        className={cn(
                                            "h-9 px-6 text-[9px] font-black uppercase tracking-widest transition-all",
                                            hasUnsavedChanges ? "bg-emerald-500 text-black shadow-lg" : "bg-white/5 text-muted-foreground"
                                        )}
                                    >
                                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <CloudUpload className="h-3.5 w-3.5 mr-2" />}
                                        Guardar Cambios en Servidor
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-card border-accent text-primary  p-1.5 rounded-xl">
                                            <DropdownMenuItem onClick={() => handleDelete(selectedTopic.id)} className="text-red-500 text-[10px] font-black uppercase flex items-center gap-2 focus:bg-red-500/10 cursor-pointer rounded-lg focus:text-destructive">
                                                <Trash2 className="h-3.5 w-3.5 text-destructive" /> Eliminar Sección
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-2  mx-auto space-y-6">
                                    <div className="space-y-4 bg-card border-accent p-6 rounded-2xl border">
                                        <div className='flex flex-row items-center justify-between'>
                                            <div className='flex flex-row items-center justify-between gap-4'>
                                                <div className=''>
                                                    <Label className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground">Título de la Sección Técnica</Label>
                                                    <Input
                                                        value={localTitle}
                                                        onChange={(e) => { setLocalTitle(e.target.value); setHasUnsavedChanges(true); }}
                                                        className="text-[12px] font-bold bg-card border-accent p-0 focus-visible:ring-0 uppercase tracking-tighter pl-4 w-150"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[9px] font-black uppercase text-primary tracking-widest">Validación de Estado</Label>
                                                    <Select value={localStatus} onValueChange={(val: BimTopicStatus) => { setLocalStatus(val); setHasUnsavedChanges(true); }}>
                                                        <SelectTrigger className="h-11 bg-card border-accent uppercase text-[10px] font-black w-72">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card text-primary border-white/10">
                                                            <SelectItem value="in_progress" className="text-[10px] font-bold uppercase">En Desarrollo</SelectItem>
                                                            <SelectItem value="reviewed" className="text-[10px] font-bold uppercase">En Revisión</SelectItem>
                                                            <SelectItem value="approved" className="text-[10px] font-bold uppercase text-emerald-400">Aprobado / Publicado</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Contenido y Especificaciones Técnicas</Label> */}
                                        {/* <Textarea
                                            value={localContent}
                                            onChange={(e) => { setLocalContent(e.target.value); setHasUnsavedChanges(true); }}
                                            className="min-h-[450px] bg-card border-accent focus:border-primary/20 text-sm leading-relaxed uppercase font-medium p-8 rounded-3xl resize-none "
                                            placeholder="Redacte los requerimientos de información o protocolos técnicos aquí..."
                                        /> */}
                                        <div className='w-full'>
                                            <EditorRich></EditorRich>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-20 animate-in fade-in">
                            <FileText className="h-24 w-24 text-primary" />
                            <div className="space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-tight">Terminal de Documentación BIM</h3>
                                <p className="text-[10px] uppercase font-black tracking-widest">Seleccione una sección en el panel lateral para comenzar</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-card border-accent text-primary p-0 overflow-hidden shadow-2xl flex flex-col h-[80vh]">
                    <DialogHeader className="p-6 border-b border-accent bg-card shrink-0">
                        <div className="flex items-center gap-3">
                            <PlusCircle className="h-6 w-6 text-primary" />
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary">Nuevo Tópico Documental</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[10px] font-black uppercase mt-1 tracking-widest">Defina el título principal y sus sub-secciones técnicas de una vez</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden p-6 space-y-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Título de la Sección Maestro</Label>
                            <Input
                                value={newTopicData.title}
                                onChange={(e) => setNewTopicData(prev => ({ ...prev, title: e.target.value }))}
                                className="h-12 bg-card border-accent uppercase font-bold text-sm"
                                placeholder="EJ: PLAN DE EJECUCIÓN BIM (BEP)"
                            />
                        </div>

                        <Separator className="bg-accent" />

                        <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estructura de Sub-tópicos</Label>
                                <Button onClick={handleAddSubTopicField} variant="outline" size="sm" className="h-8 border-primary/20 bg-primary/5 text-[9px] font-black uppercase text-primary">
                                    <Plus className="h-3 w-3 mr-1.5" /> Adicionar Nivel
                                </Button>
                            </div>

                            <ScrollArea className="flex-1 border border-accent rounded-sm p-4">
                                <div className="space-y-3">
                                    {newTopicData.children.map((child, idx) => (
                                        <div key={idx} className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-300">
                                            <div className="h-8 w-8 rounded-lg  border border-accent flex items-center justify-center text-[10px] font-black text-muted-foreground">{idx + 1}</div>
                                            <Input
                                                value={child}
                                                onChange={(e) => handleSubTopicChange(idx, e.target.value)}
                                                className="flex-1 bg-transparent border-accent text-xs font-bold uppercase h-9"
                                                placeholder="Nombre de la sub-sección técnica..."
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveSubTopicField(idx)} className="text-muted-foreground hover:text-destructive h-8 w-8">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {newTopicData.children.length === 0 && (
                                        <div className="py-12 text-center opacity-20 flex flex-col items-center gap-3">
                                            <Layers className="h-10 w-10" />
                                            <p className="text-[9px] font-black uppercase tracking-widest">Sin sub-secciones definidas</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-accent  shrink-0 flex gap-4">
                        <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cancelar</Button>
                        <Button
                            variant="default"
                            onClick={handleConfirmCreate}
                            disabled={isSaving || !newTopicData.title.trim()}
                            className="flex-1 bg-primary text-background font-black uppercase text-[10px] h-12 tracking-widest "
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Estructura Documental
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
