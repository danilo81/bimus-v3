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
            <div className="flex flex-col min-h-screen bg-card items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Entorno de Diseño...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-fit bg-card text-primary overflow-hidden m-6 rounded-2xl border border-accent">
            {/* Header Técnico de Diseño */}
            <header className="h-16 border-b border-accent bg-card flex items-center justify-between px-6 shrink-0 rounded-t-2xl">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                            <PenTool className="h-4 w-4 text-primary" /> Espacio de Diseño: {project?.title}
                        </h1>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] opacity-50">Terminal de Arquitectura y Modelado Conceptual</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 flex flex-col relative bg-card">
                    <div className="absolute inset-0 p-4 h-screen">
                        {/* 2. Reemplazamos el BimViewer por el ThatOpenViewer */}
                        {/* <ThatOpenViewer /> */}
                    </div>
                </main>
            </div>
        </div>
    );
}