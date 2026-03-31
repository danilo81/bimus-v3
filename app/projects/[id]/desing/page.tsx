"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { getProjectById } from '@/actions';
import {
    ChevronLeft,
    Loader2,
    PenTool,
    Maximize2,
    Database,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';

const ThatOpenViewer = dynamic(() => import('@/components/bim/ThatOpenViwer').then(mod => mod.ThatOpenViewer), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#050505] gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inicializando Motor That Open...</p>
        </div>
    )
});

export default function ProjectDesignPage() {
    const params = useParams();
    const router = useRouter();
    const [project, setProject] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProject = useCallback(async () => {
        const id = params?.id;
        const cleanId = Array.isArray(id) ? id[0] : id;

        if (cleanId) {
            setIsLoading(true);
            try {
                const found = await getProjectById(cleanId as string);
                if (found) setProject(found);
            } catch (error) {
                console.error("Error loading project:", error);
            } finally {
                setIsLoading(false);
            }
        }
    }, [params?.id]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-[#050505] items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Entorno de Diseño...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden">
            {/* Header Técnico de Diseño */}
            <header className="h-16 border-b border-white/5 bg-white/2 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                            <PenTool className="h-4 w-4 text-primary" /> Espacio de Diseño: {project?.title}
                        </h1>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] opacity-50">Terminal de Arquitectura y Modelado Conceptual</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-black uppercase text-[9px] h-8 px-4">
                        <Zap className="h-3 w-3 mr-2 animate-pulse" /> LIVE SYNC ACTIVE
                    </Badge>
                    <Button className="bg-primary text-black font-black text-[10px] uppercase h-9 px-6 shadow-xl">
                        Publicar Cambios
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 flex flex-col relative bg-[#050505]">
                    <div className="absolute inset-0 p-4">
                        {/* 2. Reemplazamos el BimViewer por el ThatOpenViewer */}
                        <ThatOpenViewer />
                    </div>

                    {/* Overlay de Herramientas Rápidas */}
                    <div className="absolute top-8 right-8 z-20 flex flex-col gap-4 pointer-events-none">
                        <div className="flex gap-2 justify-end pointer-events-auto">
                            <Button variant="secondary" size="icon" className="h-10 w-10 bg-black/80 border border-white/10 rounded-xl hover:bg-primary/20 hover:text-primary transition-all">
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                            <Button variant="secondary" size="icon" className="h-10 w-10 bg-black/80 border border-white/10 rounded-xl hover:bg-primary/20 hover:text-primary transition-all">
                                <Database className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}