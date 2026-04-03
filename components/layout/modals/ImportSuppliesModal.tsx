/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Upload, CheckCircle2, FileSpreadsheet, Loader2, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { importSuppliesBatch } from '@/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SheetDescription } from '@/components/ui/sheet';

// NUEVO: Añadimos dbUnits a los props
export function ImportExportSupplies({ currentData, dbUnits = [] }: { currentData?: any[], dbUnits?: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [hasErrors, setHasErrors] = useState(false); // NUEVO: Estado de errores
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    // Extraemos las abreviaciones válidas en mayúsculas para comparar
    const validUnitAbbreviations = dbUnits.map(u => u.abbreviation.toUpperCase());

    const handleExport = () => {
        if (!currentData || currentData.length === 0) {
            toast({ title: "Sin datos", description: "No hay insumos para exportar.", variant: "destructive" });
            return;
        }
        const formattedData = currentData.map(item => ({
            Nombre: item.description, // Ajustado a description según tu modelo
            Unidad: item.unit,
            Costo: item.price, // Ajustado a price según tu modelo
            Tipologia: item.typology // Ajustado a typology
        }));

        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Insumos");
        XLSX.writeFile(wb, "catalogo_insumos.xlsx");
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([{
            Nombre: "Cemento Portland",
            Unidad: "KG",
            Costo: "10,50",
            Tipologia: "Material"
        }]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
        XLSX.writeFile(wb, "plantilla_insumos.xlsx");
        setStep(2);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            let errorFound = false;

            // NUEVO: Validación de cada fila
            const validatedData = data.map((row: any) => {
                // 1. Validar Unidad
                const unit = (row.Unidad || '').toString().trim().toUpperCase();

                const validUnitAbbreviations = dbUnits.map(u => u.abbreviation.toUpperCase());
                const isValidUnit = validUnitAbbreviations.includes(unit);

                // 2. Validar Costo (Convertir comas a puntos si viene como string)
                let rawCost = row.Costo;
                let parsedCost = 0;
                let isValidCost = true;

                if (rawCost === undefined || rawCost === null || rawCost === '') {
                    isValidCost = false;
                } else {
                    if (typeof rawCost === 'string') {
                        // Reemplazar comas por puntos para asegurar formato de flotante
                        rawCost = rawCost.replace(',', '.');
                    }
                    parsedCost = parseFloat(rawCost);

                    // Verificamos si es un número válido y si es mayor o igual a 0
                    if (isNaN(parsedCost) || parsedCost < 0) {
                        isValidCost = false;
                    }
                }

                if (!isValidUnit || !isValidCost) {
                    errorFound = true;
                }

                return {
                    ...row,
                    Unidad: unit,
                    Costo: isValidCost ? parsedCost : row.Costo, // Si es válido, guardamos el numero formateado
                    _isValidUnit: isValidUnit,
                    _isValidCost: isValidCost,
                    _isValid: isValidUnit && isValidCost
                };
            });

            setHasErrors(errorFound);
            setPreviewData(validatedData);
        };
        reader.readAsBinaryString(file);
    };

    const handleImportToDB = async () => {
        if (previewData.length === 0 || hasErrors) return;
        setIsUploading(true);

        try {
            const res = await importSuppliesBatch(previewData);
            if (res.success) {
                toast({ title: "¡Importación Exitosa!", description: `Se añadieron ${res.count} insumos.` });
                setIsOpen(false);
                setStep(1);
                setPreviewData([]);

            } else {
                throw new Error(res.error);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error en la importación", description: error.message });
        } finally {
            setIsUploading(false);
        }
    };

    const resetModal = () => {
        setStep(1);
        setPreviewData([]);
        setHasErrors(false);
    };

    return (
        <div className="flex items-center gap-2">
            <Button variant="default" size="sm" name='export-supplies' onClick={handleExport} className="text-[10px] font-black uppercase tracking-widest gap-2 bg-primary text-background">
                <Download className="h-3.5 w-3.5" />
            </Button>

            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetModal(); }}>
                <DialogTrigger asChild>
                    <Button variant="default" size="sm" name='import-supplies' className="text-[10px] font-black uppercase tracking-widest gap-2 bg-primary text-background">
                        <Upload className="h-3.5 w-3.5" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-175 bg-card border-accent text-primary">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                            Importar Catálogo de Insumos
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-black uppercase tracking-widest">
                            Paso {step} de 3
                        </DialogDescription>
                        <SheetDescription />
                    </DialogHeader>

                    {step === 1 && (
                        <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                <Download className="h-8 w-8 text-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold uppercase">Descarga la plantilla oficial</h3>
                                <p className="text-xs text-muted-foreground">Las unidades ingresadas deben coincidir exactamente con los parámetros del sistema.</p>
                            </div>
                            <Button onClick={downloadTemplate} className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest cursor-pointer">
                                Descargar Plantilla .XLSX
                            </Button>
                            <Button variant="ghost" onClick={() => setStep(2)} className="text-[10px] uppercase font-bold text-muted-foreground mt-2 cursor-pointer">
                                Ya tengo mi archivo preparado <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="py-6 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold uppercase">Sube tu archivo Excel</h3>
                                <Input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="h-12 bg-secondary border-accent cursor-pointer" />
                            </div>

                            {previewData.length > 0 && (
                                <div className="space-y-2 border border-accent rounded-xl overflow-hidden">
                                    <div className={cn("p-3 border-b border-accent flex items-center justify-between", hasErrors ? "bg-red-500/10" : "bg-secondary")}>
                                        <p className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", hasErrors ? "text-red-500" : "text-emerald-500")}>
                                            {hasErrors ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                            {previewData.length} Registros leídos
                                        </p>
                                        {hasErrors && (
                                            <span className="text-[9px] font-bold uppercase text-red-500">Corrige las unidades o costos inválidas</span>
                                        )}
                                    </div>
                                    <ScrollArea className="h-48">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-background/50">
                                                    <TableHead className="text-[9px] uppercase font-black">Nombre</TableHead>
                                                    <TableHead className="text-[9px] uppercase font-black text-center">Unidad</TableHead>
                                                    <TableHead className="text-[9px] uppercase font-black text-right">Costo</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {previewData.map((row, i) => (
                                                    <TableRow key={i} className={cn(!row._isValid && "bg-red-500/5")}>
                                                        <TableCell className="text-[10px] font-bold uppercase">{row.Nombre}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className={cn("text-[9px] font-black border-none", row._isValid ? "text-primary bg-primary/10" : "bg-red-500 text-white")}>
                                                                {row.Unidad}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-[10px] font-mono text-right font-bold">
                                                            <span className={cn("px-2 py-0.5 rounded", row._isValidCost ? "" : "bg-red-500 text-white")}>
                                                                {row._isValidCost ? `$${row.Costo.toFixed(2)}` : row.Costo}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="p-4 bg-primary/10 rounded-full border border-primary/20">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold uppercase">Confirmar Importación</h3>
                                <p className="text-xs text-muted-foreground">Se añadirán <span className="text-primary font-black">{previewData.length}</span> nuevos insumos validados a la base de datos.</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="border-t border-accent pt-4 flex sm:justify-between items-center">
                        <div>
                            {step > 1 && (
                                <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={isUploading} className="text-[10px] font-black uppercase tracking-widest gap-2 cursor-pointer">
                                    <ArrowLeft className="h-3 w-3" /> Atrás
                                </Button>
                            )}
                        </div>
                        <div>
                            {step === 2 && previewData.length > 0 && (
                                <Button
                                    onClick={() => setStep(3)}
                                    disabled={hasErrors} // NUEVO: Bloqueamos si hay errores
                                    className={cn("text-[10px] font-black uppercase tracking-widest gap-2 cursor-pointer", hasErrors && "opacity-50 cursor-not-allowed")}
                                >
                                    Siguiente <ArrowRight className="h-3 w-3" />
                                </Button>
                            )}
                            {step === 3 && (
                                <Button onClick={handleImportToDB} disabled={isUploading} className="bg-primary text-background text-[10px] font-black uppercase tracking-widest gap-2 px-6 cursor-pointer">
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Procesar y Guardar
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}