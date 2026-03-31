"use client";

import { useState } from 'react';
import {
    PenTool,
    Search,
    Plus,
    FileCode,
    Download,
    MoreVertical,
    Filter,
    Layers,
    Trash2,
    Edit,
    Globe,
    Info,
    Loader2
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Badge } from "../../../../components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../../components/ui/dropdown-menu';
import { ScrollArea } from '../../../../components/ui/scroll-area';

const MOCK_CAD_ASSETS = [
    { id: '1', name: 'Detalle_Zapata_Aislada.dwg', category: 'Estructuras', size: '1.2 MB', version: 'v2.1', author: 'Ing. Perez' },
    { id: '2', name: 'Bloque_Mobiliario_Oficina.dwg', category: 'Arquitectura', size: '4.5 MB', version: 'v1.0', author: 'Arq. Luna' },
    { id: '3', name: 'Plano_Tipo_Electrico.dxf', category: 'Instalaciones', size: '2.8 MB', version: 'v3.4', author: 'Ing. Diaz' },
    { id: '4', name: 'Simbolos_Seguridad_Ind.dwg', category: 'Seguridad', size: '850 KB', version: 'v1.2', author: 'Bimus Studio' },
];

export default function CadLibraryPage() {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <PenTool className="h-8 w-8 text-primary" /> Librería CAD
                    </h1>
                    <p className="text-muted-foreground mt-1 ">Bloques y Detalles Técnicos Maestro</p>
                </div>

            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-card p-4 rounded-xl border border-muted/50 backdrop-blur-sm">
                <div className="relative flex-1 max-w-md bg-card">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar bloque o detalle..."
                        className="pl-10 h-10 bg-card border-accent text-[12px] tracking-widest"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-primary text-background font-black text-[10px] uppercase tracking-widest h-10 px-6 hover:bg-primary/40">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Bloque
                    </Button>
                </div>
            </div>

            <Card className="bg-card border-accent overflow-hidden p-0">

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50 p-0 ">
                            <TableRow className="border-accent hover:bg-transparent">
                                <TableHead className="py-5 px-8 text-[12px] font-black uppercase text-muted-foreground">Nombre del Archivo</TableHead>
                                <TableHead className="text-[12px] font-black uppercase text-muted-foreground">Categoría</TableHead>
                                <TableHead className="text-[12px] font-black uppercase text-muted-foreground text-center">Versión</TableHead>
                                <TableHead className="text-[12px] font-black uppercase text-muted-foreground text-right">Tamaño</TableHead>
                                <TableHead className="text-[12px] font-black uppercase text-muted-foreground text-center pl-16"> Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_CAD_ASSETS.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map((asset) => (
                                <TableRow key={asset.id} className="border-accent hover:bg-accent/3 transition-colors group">
                                    <TableCell className="py-6 px-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                                <FileCode className="h-5 w-5 text-blue-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black uppercase tracking-tight text-primary group-hover:text-primary transition-colors">{asset.name}</span>
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Autor: {asset.author}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[12px] font-black uppercase border-white/10 bg-white/5">
                                            {asset.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-mono text-[12px] text-primary font-bold">{asset.version}</TableCell>
                                    <TableCell className="text-right font-mono text-[12px] text-muted-foreground">{asset.size}</TableCell>
                                    <TableCell className="text-right px-8 ">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-primary">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                                                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-card border-white/10 text-primary  p-1.5 rounded-xl">
                                                    <DropdownMenuItem className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer focus:bg-primary/10 rounded-lg">
                                                        <Edit className="h-3.5 w-3.5" /> Editar Datos
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 rounded-lg">
                                                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
