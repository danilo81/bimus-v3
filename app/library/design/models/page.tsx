"use client";

import { useState } from 'react';
import {
    LayoutGrid,
    Search,
    Plus,
    Box,
    Database,
    MoreVertical,
    Filter,
    HardDrive,
    Trash2,
    Edit,
    Eye,
    Info,
    Share2,
    Download
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { cn } from "../../../../lib/utils";

const MOCK_MODELS = [
    { id: '1', name: 'Familia_Ascensor_Otis.rfa', type: 'Revit', lod: 'LOD 400', weight: '12.4 MB', updatedAt: '2024-05-10' },
    { id: '2', name: 'Estructura_Metalica_Tipo.ifc', type: 'IFC', lod: 'LOD 350', weight: '45.2 MB', updatedAt: '2024-05-08' },
    { id: '3', name: 'Mobiliario_Cocina_Premium.fbx', type: '3D Mesh', lod: 'High Poly', weight: '120 MB', updatedAt: '2024-05-12' },
    { id: '4', name: 'Sistema_HVAC_Componente.rfa', type: 'Revit', lod: 'LOD 500', weight: '8.7 MB', updatedAt: '2024-05-01' },
    { id: '5', name: 'Panel_Solar_Parametrizado.rfa', type: 'Revit', lod: 'LOD 400', weight: '5.1 MB', updatedAt: '2024-05-15' },
    { id: '6', name: 'Nube_Puntos_Terreno.laz', type: 'Cloud', lod: 'Point Cloud', weight: '1.2 GB', updatedAt: '2024-04-20' },
];

export default function ModelsLibraryPage() {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <Box className="h-8 w-8 text-primary" /> Modelos BIM
                    </h1>
                    <p className="text-muted-foreground mt-1 ">Librería de Componentes y Familias 3D</p>
                </div>

            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-muted/50 backdrop-blur-sm">
                <div className="relative flex-1 max-w-md bg-card">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar componente o familia..."
                        className="pl-10 h-10 bg-card border-accent text-[10px] font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 justify-between">

                    <Button className="bg-primary text-background font-black text-[10px] uppercase tracking-widest h-10 px-6 hover:bg-primary/40 ">
                        <Plus className="mr-2 h-4 w-4" /> Subir Componente
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {MOCK_MODELS.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map((model) => (
                    <Card key={model.id} className="bg-card border-accent hover:border-primary/50 transition-all group p-0 overflow-hidden ">
                        <CardHeader className="p-0 aspect-video bg-secondary flex items-center justify-center relative border-b border-accent">
                            <Box className="h-16 w-16 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute top-3 left-3">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black uppercase tracking-widest">
                                    {model.type}
                                </Badge>
                            </div>
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-7 w-7 bg-card rounded-full border border-accent backdrop-blur-md">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold uppercase truncate text-primary tracking-tight">{model.name}</h3>
                                <div className="flex justify-between items-center text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                                    <span>{model.lod}</span>
                                    <span>{model.weight}</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-accent flex items-center justify-between gap-3">
                                <Button variant="ghost" size="sm" className="flex-1 h-8 text-[9px] font-black uppercase tracking-widest hover:bg-accent">
                                    <Eye className="h-3 w-3 mr-1.5" /> Ver 3D
                                </Button>
                                <Button variant="secondary" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary">
                                    <Download className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
