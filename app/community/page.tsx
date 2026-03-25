"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Handshake, Search, Filter, MessageSquare, Heart, Share2, ExternalLink } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import Image from 'next/image';

const MOCK_COMMUNITY_PROJECTS = [
    {
        id: '1',
        title: 'Residencial Aurora',
        author: 'Arq. Carlos Ruiz',
        category: 'Residencial',
        image: 'https://picsum.photos/seed/aurora/800/600',
        likes: 124,
        comments: 18,
    },
    {
        id: '2',
        title: 'Centro Logístico Sur',
        author: 'Ing. María Delgado',
        category: 'Industrial',
        image: 'https://picsum.photos/seed/logistic/800/600',
        likes: 89,
        comments: 5,
    },
    {
        id: '3',
        title: 'Torre Empresarial Sigma',
        author: 'Bimus Studio',
        category: 'Comercial',
        image: 'https://picsum.photos/seed/sigma/800/600',
        likes: 210,
        comments: 42,
    },
];

export default function CommunityPage() {
    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <Handshake className="h-8 w-8 text-primary" /> Comunidad Bimus
                    </h1>
                    <p className="text-muted-foreground mt-1">Explora proyectos destacados y conecta con otros profesionales.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card/50 p-4 rounded-xl border border-muted/50 backdrop-blur-sm">
                <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar proyectos en la comunidad..."
                        className="pl-10 bg-background/50 border-muted/50"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white">
                        <Filter className="mr-2 h-3.5 w-3.5" /> Filtrar por Categoría
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_COMMUNITY_PROJECTS.map((project) => (
                    <Card key={project.id} className="group overflow-hidden border-muted/50 hover:border-primary/50 transition-all bg-card/30 backdrop-blur-sm">
                        <div className="relative aspect-video overflow-hidden">
                            <img
                                src={project.image}
                                alt={project.title}
                                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-2 right-2">
                                <Badge className="bg-black/60 text-white border-white/10 backdrop-blur-md uppercase text-[9px] font-black">
                                    {project.category}
                                </Badge>
                            </div>
                        </div>
                        <CardHeader className="p-4 space-y-1">
                            <CardTitle className="text-lg font-bold">{project.title}</CardTitle>
                            <CardDescription className="text-xs">Por {project.author}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex items-center justify-between mt-2 pt-4 border-t border-muted/20">
                                <div className="flex items-center gap-4 text-muted-foreground">
                                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                                        <Heart className="h-4 w-4" />
                                        <span className="text-xs font-bold">{project.likes}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="text-xs font-bold">{project.comments}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                                        <Share2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                                        <ExternalLink className="h-4 w-4 text-primary" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-primary/20 rounded-full">
                    <Handshake className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h3 className="text-xl font-bold">¿Quieres compartir tu trabajo?</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
                        Publica tus proyectos en la comunidad Bimus para ganar visibilidad y recibir feedback de otros expertos del sector.
                    </p>
                </div>
                <Button className="bg-primary text-white font-black text-xs uppercase tracking-widest h-11 px-8 rounded-full">
                    Empezar a Publicar
                </Button>
            </div>
        </div>
    );
}
