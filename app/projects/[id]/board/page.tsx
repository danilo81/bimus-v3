/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { BimTopic, BimTopicStatus } from '../../../../types/types';
import { getBimDocument, upsertBimTopic, deleteBimTopic, applyBimTemplate, createTopicWithChildren, getProjectById, saveBimTemplateToCloud, applyCloudBimTemplate, getCloudBimTemplates } from '@/actions';
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
    SelectGroup,
    SelectItem,
    SelectLabel,
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
    const activeTopicIdRef = useRef<string | null>(null);
    activeTopicIdRef.current = selectedTopicId;
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('none');
    const [isMounted, setIsMounted] = useState(false);

    const [cloudTemplates, setCloudTemplates] = useState<any[]>([]);
    const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');

    const [drafts, setDrafts] = useState<Record<string, { title: string, content: string, status: BimTopicStatus }>>({});
    const [visitedTopics, setVisitedTopics] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (selectedTopicId) {
            setVisitedTopics(prev => prev.has(selectedTopicId) ? prev : new Set(prev).add(selectedTopicId));
        }
    }, [selectedTopicId]);

    const findTopicById = useCallback(function recursiveFind(list: BimTopic[], id: string): BimTopic | null {
        for (const t of list) {
            if (t.id === id) return t;
            if (t.children) {
                const found = recursiveFind(t.children, id);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const selectedTopic = useMemo(() => {
        if (!selectedTopicId) return null;
        return findTopicById(topics, selectedTopicId);
    }, [topics, selectedTopicId, findTopicById]);

    const activeValues = useMemo(() => {
        if (!selectedTopic) return null;
        return drafts[selectedTopic.id] || {
            title: selectedTopic.title || '',
            content: selectedTopic.content || '',
            status: selectedTopic.status || 'in_progress'
        };
    }, [selectedTopic, drafts]);

    const updateDraft = useCallback((topicId: string, updates: Partial<{ title: string, content: string, status: BimTopicStatus }>) => {
        setDrafts(prev => {
            const topic = findTopicById(topics, topicId);
            const currentDraft = prev[topicId] || {
                title: topic?.title || '',
                content: topic?.content || '',
                status: topic?.status || 'in_progress'
            };
            return {
                ...prev,
                [topicId]: { ...currentDraft, ...updates }
            };
        });
    }, [topics, findTopicById]);

    const handleSaveAsTemplate = async () => {
        if (!projectId) return;
        if (!newTemplateName.trim()) {
            toast({ title: "Validación", description: "El nombre de la plantilla es obligatorio.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const result = await saveBimTemplateToCloud(projectId, newTemplateName.trim());

            if (result.success) {
                toast({ title: "Plantilla guardada en la nube con éxito" });
                setIsSaveTemplateModalOpen(false);
                setNewTemplateName('');
                const templates = await getCloudBimTemplates();
                setCloudTemplates(templates);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectTopic = (newTopicId: string) => {
        setSelectedTopicId(newTopicId);
    };

    const hasAnyUnsaved = Object.keys(drafts).length > 0;

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
            const [proj, bimDoc, cTemplates] = await Promise.all([
                getProjectById(projectId),
                getBimDocument(projectId),
                getCloudBimTemplates()
            ]);

            if (cTemplates) setCloudTemplates(cTemplates);

            if (proj) setProject(proj);
            if (bimDoc.success) {
                setTopics(bimDoc.topics || []);
                setDocumentId(bimDoc.documentId || null);
                if (bimDoc.topics && bimDoc.topics.length > 0) {
                    setSelectedTopicId(prev => prev || bimDoc.topics[0].id);
                }
            } else {
                toast({ title: "Error", description: bimDoc.error, variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, toast]);

    useEffect(() => {
        if (isMounted) {
            fetchData();
        }
    }, [isMounted, fetchData]);

    useEffect(() => {
        const handleAnchorClick = (e: MouseEvent) => {
            if (!hasAnyUnsaved) return;
            const target = (e.target as HTMLElement).closest('a');
            if (!target) return;

            const currentUrl = window.location.pathname;
            const newUrl = new URL(target.href, window.location.origin).pathname;

            if (newUrl !== currentUrl) {
                if (!window.confirm('Tienes cambios sin guardar. Si abandonas la página se perderán en todos los tópicos modificados. ¿Estás seguro?')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        };

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasAnyUnsaved) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        document.addEventListener('click', handleAnchorClick, { capture: true });
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('click', handleAnchorClick, { capture: true });
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasAnyUnsaved]);

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
        if (!documentId || !projectId) {
            toast({ title: "Error", description: "Datos incompletos para guardar.", variant: "destructive" });
            return;
        }

        const draftIds = Object.keys(drafts);
        if (draftIds.length === 0) return;

        setIsSaving(true);
        try {
            const promises = draftIds.map(id => {
                const topic = findTopicById(topics, id);
                const draft = drafts[id];
                return upsertBimTopic({
                    id,
                    documentId,
                    projectId,
                    title: draft.title,
                    content: draft.content,
                    status: draft.status,
                    order: topic?.order || 0
                });
            });

            await Promise.all(promises);

            setDrafts({});
            toast({ title: "Todos los cambios han sido guardados exitosamente" });
            await fetchData();
        } catch (error: any) {
            toast({ title: "Fallo al guardar", description: error.message || "Error desconocido al procesar cambios", variant: "destructive" });
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
        setSelectedTemplate(templateId);
        if (!confirm('Esta acción cargará la plantilla seleccionada. Si ya tienes tópicos serán reemplazados. ¿Continuar?')) {
            setSelectedTemplate('none');
            return;
        }

        setIsSaving(true);
        try {
            let result;
            if (templateId.startsWith('cloud_')) {
                const fileId = templateId.replace('cloud_', '');
                result = await applyCloudBimTemplate(projectId, fileId);
            } else {
                result = await applyBimTemplate(projectId, templateId);
            }
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
        <div className="flex flex-col h-[calc(100vh-100px)] text-primary overflow-hidden ">

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
                                    <SelectGroup>
                                        <SelectLabel className="text-[8px] text-muted-foreground uppercase font-black tracking-widest pl-2">General</SelectLabel>
                                        <SelectItem value="iso_19650" className="text-[9px] font-bold uppercase">ISO 19650 Requerimientos</SelectItem>
                                        <SelectItem value="bep_only" className="text-[9px] font-bold uppercase">Plan de Ejecución (BEP)</SelectItem>
                                        <SelectItem value="construction_phase" className="text-[9px] font-bold uppercase">Protocolos de Obra</SelectItem>
                                    </SelectGroup>
                                    {cloudTemplates.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mt-2 border-t border-accent pt-2 pl-2">Mis Plantillas en Nube</SelectLabel>
                                            {cloudTemplates.map(t => (
                                                <SelectItem key={t.id} value={`cloud_${t.id}`} className="text-[9px] font-bold uppercase">{t.name}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    )}
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
                                            onClick={() => handleSelectTopic(topic.id)}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className={cn("h-1.5 w-1.5 rounded-full shrink-0",
                                                    drafts[topic.id] ? "bg-amber-500 ring-2 ring-amber-500/20" :
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
                                                                        handleSelectTopic(child.id);
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
                            <div className="border border-accent bg-card flex flex-col px-8 py-5 shrink-0 rounded-2xl m-2 gap-6 ">
                                {/* Top row: Badges and Save */}
                                {/* <div className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className={cn("text-[8px] font-black uppercase border-none px-2",
                                            activeValues?.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                        )}>
                                            {activeValues?.status.replace('_', ' ')}
                                        </Badge>
                                        {hasAnyUnsaved && (
                                            <Badge className="bg-amber-500/20 text-amber-500 border-none text-[8px] font-black uppercase shadow-sm">Cambios sin guardar</Badge>
                                        )}
                                    </div>

                                </div> */}

                                {/* Bottom row: Title and Status Inputs */}
                                <div className="flex flex-row items-end gap-6 w-full">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Título de la Sección Técnica</Label>
                                        <Input
                                            value={activeValues?.title || ''}
                                            onChange={(e) => updateDraft(selectedTopicId!, { title: e.target.value })}
                                            className="text-[14px] font-bold bg-background h-12 border-accent p-0 outline-none focus-visible:ring-0 uppercase tracking-tighter pl-5 w-full rounded-xl"
                                        />
                                    </div>
                                    <div className="w-72 space-y-2">
                                        <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-2">Validación de Estado</Label>
                                        <Select value={activeValues?.status || 'in_progress'} onValueChange={(val: BimTopicStatus) => updateDraft(selectedTopicId!, { status: val })}>
                                            <SelectTrigger className="h-12 bg-background border-accent uppercase text-[10px] font-black rounded-xl px-4  w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card text-primary border-white/10 w-full">
                                                <SelectItem value="in_progress" className="text-[10px] font-bold uppercase">En Desarrollo</SelectItem>
                                                <SelectItem value="reviewed" className="text-[10px] font-bold uppercase">En Revisión</SelectItem>
                                                <SelectItem value="approved" className="text-[10px] font-bold uppercase text-emerald-400">Aprobado / Publicado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={handlePersistChanges}
                                            disabled={!hasAnyUnsaved || isSaving}
                                            className={cn(
                                                "h-9 px-6 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer",
                                                hasAnyUnsaved ? "bg-primary text-background " : "bg-white/5 text-muted-foreground"
                                            )}
                                        >
                                            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <CloudUpload className="h-3.5 w-3.5 mr-2" />}
                                            Guardar Todo
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card border-accent text-primary  p-1.5 rounded-xl">
                                                <DropdownMenuItem onClick={() => setIsSaveTemplateModalOpen(true)} className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg">
                                                    <Save className="h-3.5 w-3.5" /> Guardar como plantilla
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(selectedTopic.id)} className="text-red-500 text-[10px] font-black uppercase flex items-center gap-2 focus:bg-red-500/10 cursor-pointer rounded-lg focus:text-destructive">
                                                    <Trash2 className="h-3.5 w-3.5 text-destructive" /> Eliminar Sección
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 px-2 pb-2">
                                {Array.from(visitedTopics).map(topicId => {
                                    const topic = findTopicById(topics, topicId);
                                    if (!topic) return null;
                                    return (
                                        <div key={topicId} className={topicId === selectedTopicId ? "w-full block h-full" : "w-full hidden h-full"}>
                                            <EditorRich
                                                className="min-h-[calc(100vh-270px)] h-full w-full bg-card"
                                                initialContent={topic.content || undefined}
                                                onChange={(json) => updateDraft(topicId, { content: json })}
                                            />
                                        </div>
                                    );
                                })}
                            </ScrollArea>
                        </div>
                    ) : topics.length === 0 && !isLoading ? (
                        // Empty state: no topics yet — prompt the user to pick a template
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in">
                            <div className="opacity-20">
                                <LayoutTemplate className="h-24 w-24 text-primary mx-auto" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-tight">Documento BIM sin estructura</h3>
                                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                    Selecciona una plantilla en el panel lateral para inicializar los tópicos documentales,<br />
                                    o crea el primer tópico manualmente.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <div className="space-y-2 w-64">
                                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Inicializar con Plantilla</Label>
                                    <Select value={selectedTemplate} onValueChange={handleApplyTemplate}>
                                        <SelectTrigger className="h-11 bg-card border-accent text-[10px] font-black uppercase w-full">
                                            <div className="flex items-center gap-2">
                                                <LayoutTemplate className="h-3 w-3 text-primary" />
                                                <SelectValue placeholder="ELEGIR PLANTILLA..." />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-card text-primary border-accent">
                                            <SelectItem value="none" className="text-[9px] font-bold uppercase">Seleccionar...</SelectItem>
                                            <SelectGroup>
                                                <SelectLabel className="text-[8px] text-muted-foreground uppercase font-black tracking-widest pl-2">General</SelectLabel>
                                                <SelectItem value="iso_19650" className="text-[9px] font-bold uppercase">ISO 19650 Requerimientos</SelectItem>
                                                <SelectItem value="bep_only" className="text-[9px] font-bold uppercase">Plan de Ejecución (BEP)</SelectItem>
                                                <SelectItem value="construction_phase" className="text-[9px] font-bold uppercase">Protocolos de Obra</SelectItem>
                                            </SelectGroup>
                                            {cloudTemplates.length > 0 && (
                                                <SelectGroup>
                                                    <SelectLabel className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mt-2 border-t border-accent pt-2 pl-2">Mis Plantillas en Nube</SelectLabel>
                                                    {cloudTemplates.map(t => (
                                                        <SelectItem key={t.id} value={`cloud_${t.id}`} className="text-[9px] font-bold uppercase">{t.name}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest pt-4">ó</div>
                                <Button
                                    variant="outline"
                                    className="h-11 border-dashed border-primary/30 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
                                    onClick={() => handleOpenCreateModal(null)}
                                >
                                    <PlusCircle className="h-4 w-4 mr-2" /> Crear Tópico Manual
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-20 animate-in fade-in">
                            <FileText className="h-24 w-24 text-primary" />
                            <div className="space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-tight">Documentación BIM</h3>
                                <p className="text-[10px] uppercase font-black tracking-widest">Seleccione una sección en el panel lateral para comenzar</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <Dialog open={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen}>
                <DialogContent className="sm:max-w-md bg-card border-accent text-primary">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary">Guardar como Plantilla</DialogTitle>
                        <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground">
                            Se guardará toda la estructura actual y su contenido en la nube para uso posterior.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Nombre de la Plantilla</Label>
                        <Input
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            placeholder="Ej. Plantilla Institucional V1"
                            className="bg-background border-accent font-bold text-sm h-12 uppercase"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground" onClick={() => setIsSaveTemplateModalOpen(false)}>Cancelar</Button>
                        <Button disabled={isSaving || !newTemplateName.trim()} onClick={handleSaveAsTemplate} className="font-black uppercase tracking-widest text-[10px] bg-primary h-12 text-background hover:bg-primary/90">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-card border-accent text-primary p-0 overflow-hidden  flex flex-col h-[80vh] max-h-[350px]">
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
