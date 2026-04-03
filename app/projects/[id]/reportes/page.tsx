/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { getProjectById } from "@/actions";
import { calculateAPU } from '@/lib/apu-utils';
import {
    FileText,
    Download,
    BarChart3,
    TrendingUp,
    Calendar,
    DollarSign,
    Loader2,
    FileBarChart,
    ShoppingCart,
    FileCheck,
    Package,
    Users,
    Wrench,
    Truck,
    ArrowUpCircle,
    FileSignature,
    BookOpen
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../../components/ui/table";
import { useToast } from "../../../../hooks/use-toast";


export interface ProjectReport {
    id: string;
    title: string;
    type: "avance" | "financiero" | "presupuesto" | "actas" | "general" | "pedidos" | "compras" | "materiales" | "labor" | "equipo" | "almacen" | "egresos_almacen" | "change_orders" | "libro_obra";
    description: string;
    createdAt: string;
    format: "PDF" | "Excel";
}

const REPORT_TYPES: Omit<ProjectReport, "id" | "createdAt">[] = [
    {
        title: "Reporte de avance de obra",
        type: "avance",
        description: "Resumen de avance por partida y nivel.",
        format: "PDF",
    },
    {
        title: "Reporte financiero detallado",
        type: "financiero",
        description: "Estado de ingresos, egresos y balance neto del proyecto.",
        format: "PDF",
    },
    {
        title: "Reporte de Órdenes de Cambio",
        type: "change_orders",
        description: "Historial de modificaciones técnicas y justificaciones de cambios en obra.",
        format: "PDF",
    },
    {
        title: "Reporte de cantidad de materiales",
        type: "materiales",
        description: "Consolidado total de materiales requeridos con precios y subtotales.",
        format: "PDF",
    },
    {
        title: "Reporte de cantidad de mano de obra",
        type: "labor",
        description: "Consolidado total de horas y haberes de personal y cuadrillas.",
        format: "PDF",
    },
    {
        title: "Reporte de cantidad de equipo",
        type: "equipo",
        description: "Consolidado total de maquinaria y herramientas requeridas.",
        format: "PDF",
    },
    {
        title: "Reporte de ingresos de almacén",
        type: "almacen",
        description: "Detalle de materiales recibidos en almacén de obra.",
        format: "PDF",
    },
    {
        title: "Reporte de egresos de almacén",
        type: "egresos_almacen",
        description: "Control de despacho de materiales con destino a partida y nivel.",
        format: "PDF",
    },
    {
        title: "Presupuesto vs ejecución",
        type: "presupuesto",
        description: "Comparativo presupuestado vs ejecutado por partida.",
        format: "Excel",
    },
    {
        title: "Reporte de Presupuesto General",
        type: "presupuesto",
        description: "Desglose completo del presupuesto de obra.",
        format: "PDF",
    },
    {
        title: "Libro de obra",
        type: "libro_obra",
        description: "Historial completo de registros, bitácora y eventos técnicos.",
        format: "PDF",
    },
    {
        title: "Reporte general del proyecto",
        type: "general",
        description: "Vista consolidada de estado, avance y finanzas.",
        format: "PDF",
    },
    {
        title: "Histórico de pedidos",
        type: "pedidos",
        description: "Registro detallado de solicitudes de materiales realizadas en obra.",
        format: "PDF",
    },
    {
        title: "Histórico de órdenes de compra",
        type: "compras",
        description: "Seguimiento de adquisiciones formalizadas y estados de pago.",
        format: "PDF",
    },
];

function getReportIcon(type: ProjectReport["type"]) {
    switch (type) {
        case "avance":
            return TrendingUp;
        case "financiero":
            return DollarSign;
        case "presupuesto":
            return BarChart3;
        case "libro_obra":
            return BookOpen;
        case "pedidos":
            return ShoppingCart;
        case "compras":
            return FileCheck;
        case "materiales":
            return Package;
        case "labor":
            return Users;
        case "equipo":
            return Wrench;
        case "almacen":
            return Truck;
        case "egresos_almacen":
            return ArrowUpCircle;
        case "change_orders":
            return FileSignature;
        default:
            return FileBarChart;
    }
}

export default function ReportesPage() {
    const params = useParams();
    const router = useRouter();
    const [project, setProject] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchProject = useCallback(async () => {
        if (!params.id) return;
        setLoading(true);
        try {
            const found = await getProjectById(params.id as string);
            if (found) setProject(found);
        } catch (error) {
            console.error("Error loading project:", error);
            toast({
                title: "Error",
                description: "No se pudo cargar el proyecto.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [params.id, toast]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    const reports: ProjectReport[] = REPORT_TYPES.map((r, i) => ({
        ...r,
        id: `rep-${params.id}-${i}`,
        createdAt: new Date().toISOString().split("T")[0],
    }));

    const handleGenerateReport = (report: ProjectReport) => {
        if (!project) return;

        switch (report.type) {
            case "avance":
                generateAvancePDF();
                break;
            case "change_orders":
                generateChangeOrdersPDF();
                break;
            case "libro_obra":
                generateSiteLogPDF();
                break;
            case "presupuesto":
                if (report.title === "Reporte de Presupuesto General") generateBudgetPDF();
                else toast({ title: "Módulo Excel no disponible." });
                break;
            case "financiero":
                generateFinancialPDF();
                break;
            case "materiales":
                generateMaterialsPDF();
                break;
            case "labor":
                generateLaborPDF();
                break;
            case "equipo":
                generateEquipmentPDF();
                break;
            case "pedidos":
                generateOrdersPDF();
                break;
            case "compras":
                generatePurchaseOrdersPDF();
                break;
            case "almacen":
                generateWarehouseEntriesPDF();
                break;
            case "egresos_almacen":
                generateWarehouseExitsPDF();
                break;
            default:
                toast({
                    title: "Generar reporte",
                    description: `Generando "${report.title}"... (próximamente)`,
                });
        }
    };

    const generateSiteLogPDF = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const logs = project.siteLogs || [];

        const rows = logs.map((log: any) => {
            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 10px; font-size: 10px; font-family: monospace; white-space: nowrap;">
                        ${new Date(log.date).toLocaleDateString('es-ES')}
                        <span style="display: block; opacity: 0.5; font-size: 8px;">${new Date(log.date).toLocaleTimeString()}</span>
                    </td>
                    <td style="border: 1px solid #ddd; padding: 10px; font-size: 10px; font-weight: 900; text-transform: uppercase;">
                        ${log.type}
                    </td>
                    <td style="border: 1px solid #ddd; padding: 10px; font-size: 10px; text-transform: uppercase; font-weight: bold;">
                        ${log.author?.name || 'Sistema'}
                    </td>
                    <td style="border: 1px solid #ddd; padding: 10px; font-size: 10px; line-height: 1.4;">
                        ${log.content}
                    </td>
                </tr>
            `;
        }).join('');

        const html = `
            <html>
                <head>
                    <title>Libro de Obra - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; }
                        .brand { font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 12px 10px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                        .project-info { margin-bottom: 30px; font-size: 12px; }
                        @media print { body { padding: 0; } @page { margin: 1.5cm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div><h1 class="brand">BIMUS</h1><p style="font-size: 10px; font-weight: bold; margin: 0;">ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><h2 style="font-size: 14px; font-weight: 900; margin: 0;">LIBRO DE OBRA / BITÁCORA</h2><p style="font-size: 10px; margin: 0;">FECHA EMISIÓN: ${new Date().toLocaleDateString('es-ES')}</p></div>
                    </div>
                    <div class="project-info">
                        <strong>PROYECTO:</strong> ${project.title.toUpperCase()}<br>
                        <strong>CLIENTE:</strong> ${project.client?.toUpperCase() || 'N/A'}<br>
                        <strong>UBICACIÓN:</strong> ${project.location?.toUpperCase() || 'N/A'}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 100px;">Fecha / Hora</th>
                                <th style="width: 100px;">Tipo</th>
                                <th style="width: 150px;">Responsable</th>
                                <th>Contenido del Registro</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #888;">No se registran eventos en el libro de obra.</td></tr>'}</tbody>
                    </table>
                    <div style="margin-top: 100px; display: flex; justify-content: space-around;">
                        <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA RESPONSABLE DE OBRA</div>
                        <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA SUPERVISIÓN / CLIENTE</div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const generateAvancePDF = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const items = project.items || [];
        const config = project.config || {};

        let totalGeneral = 0;
        let totalEjecutado = 0;

        const rows = items.map((pi: any) => {
            const apu = calculateAPU(pi.item?.supplies || [], config);
            const unitPrice = apu.totalUnit;
            const quantity = pi.quantity || 0;
            const progress = pi.progress || 0;
            const totalRow = quantity * unitPrice;
            const ejecutadoRow = progress * unitPrice;
            const percentage = quantity > 0 ? (progress / quantity) * 100 : 0;

            totalGeneral += totalRow;
            totalEjecutado += ejecutadoRow;

            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 9px; font-family: monospace;">${pi.item.id.slice(-6).toUpperCase()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">${pi.item.description}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${pi.item.unit}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">${quantity.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; color: #10b981; font-weight: bold;">${progress.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: 900;">$${ejecutadoRow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center; font-weight: bold;">${percentage.toFixed(1)}%</td>
                </tr>
            `;
        }).join('');

        const globalPercentage = totalGeneral > 0 ? (totalEjecutado / totalGeneral) * 100 : 0;

        const html = `
            <html>
                <head>
                    <title>Reporte de Avance - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; }
                        .brand { font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                        .summary { margin-top: 30px; display: flex; justify-content: flex-end; gap: 40px; }
                        .sum-item { text-align: right; }
                        .sum-label { font-size: 10px; font-weight: 900; color: #666; text-transform: uppercase; }
                        .sum-value { font-size: 18px; font-weight: 900; }
                        @media print { body { padding: 0; } @page { margin: 1.5cm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div><h1 class="brand">BIMUS</h1><p style="font-size: 10px; font-weight: bold; margin: 0;">ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><h2 style="font-size: 14px; font-weight: 900; margin: 0;">PLANILLA DE AVANCE FÍSICO-FINANCIERO</h2><p style="font-size: 10px; margin: 0;">FECHA: ${new Date().toLocaleDateString('es-ES')}</p></div>
                    </div>
                    <div style="margin-bottom: 30px; font-size: 12px;">
                        <strong>PROYECTO:</strong> ${project.title.toUpperCase()}<br>
                        <strong>CLIENTE:</strong> ${project.client?.toUpperCase() || 'N/A'}<br>
                        <strong>AVANCE GLOBAL:</strong> ${globalPercentage.toFixed(1)}%
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Descripción Partida</th>
                                <th>Und.</th>
                                <th style="text-align: right;">Cómputo</th>
                                <th style="text-align: right;">Avance</th>
                                <th style="text-align: right;">Monto Avanzado</th>
                                <th style="text-align: center;">%</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="7" style="text-align: center; padding: 40px;">No se registran partidas en este proyecto.</td></tr>'}</tbody>
                    </table>
                    <div class="summary">
                        <div class="sum-item">
                            <div class="sum-label">Total Presupuestado</div>
                            <div class="sum-value">$${totalGeneral.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div class="sum-item">
                            <div class="sum-label">Total Ejecutado</div>
                            <div class="sum-value" style="color: #10b981;">$${totalEjecutado.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                    <div style="margin-top: 100px; display: flex; justify-content: space-around;">
                        <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA RESPONSABLE DE OBRA</div>
                        <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA SUPERVISIÓN / CLIENTE</div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const generateChangeOrdersPDF = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Filter logs that are Change Orders
        const logs = project.siteLogs || [];
        const changeOrders = logs.filter((log: any) => log.content.includes("ORDEN DE CAMBIO:"));

        const rows = changeOrders.map((log: any) => {
            const reason = log.content.replace("ORDEN DE CAMBIO:", "").trim();
            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 12px; font-size: 10px; font-family: monospace; white-space: nowrap;">
                        ${new Date(log.date).toLocaleDateString('es-ES')} 
                        <span style="display: block; opacity: 0.5; font-size: 8px;">${new Date(log.date).toLocaleTimeString()}</span>
                    </td>
                    <td style="border: 1px solid #ddd; padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #f59e0b;">
                        ${log.author?.name || 'Sistema'}
                    </td>
                    <td style="border: 1px solid #ddd; padding: 12px; font-size: 11px; line-height: 1.5;">
                        ${reason}
                    </td>
                </tr>
            `;
        }).join('');

        const html = `
            <html>
                <head>
                    <title>Reporte de Órdenes de Cambio - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                        .title-brand { font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        .subtitle-brand { font-size: 10px; color: #666; margin-top: 2px; font-weight: bold; letter-spacing: 2px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f8f8f8; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                        .info-section { margin-bottom: 30px; font-size: 12px; }
                        @media print { body { padding: 0; } @page { margin: 1.5cm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div><h1 class="title-brand">BIMUS</h1><p class="subtitle-brand">ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><p style="font-size: 10px; font-weight: 900; margin: 0;">HISTORIAL DE ÓRDENES DE CAMBIO</p></div>
                    </div>
                    <div class="info-section">
                        <strong>PROYECTO:</strong> ${project.title.toUpperCase()}<br>
                        <strong>CLIENTE:</strong> ${project.client?.toUpperCase() || 'N/A'}<br>
                        <strong>TOTAL REGISTROS:</strong> ${changeOrders.length}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 120px;">Fecha / Hora</th>
                                <th style="width: 150px;">Responsable</th>
                                <th>Justificación y Descripción del Cambio</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="3" style="text-align: center; padding: 40px; color: #888; font-style: italic;">No se registran órdenes de cambio autorizadas para este proyecto.</td></tr>'}</tbody>
                    </table>
                    <div style="margin-top: 100px; display: flex; justify-content: space-around;">
                        <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA RESPONSABLE DE OBRA</div>
                        <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px; font-weight: bold;">FIRMA SUPERVISIÓN / CLIENTE</div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const generateWarehouseExitsPDF = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const exits = project.warehouseExits || [];

        let totalItemsDispatched = 0;
        const rows = exits.map((exit: any) => {
            return exit.items.map((item: any) => {
                totalItemsDispatched += item.quantity;
                return `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; font-family: monospace;">${new Date(exit.date).toLocaleDateString('es-ES')}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; font-weight: bold;">${item.supply.description}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${item.supply.unit}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: bold; color: #ef4444;">${item.quantity.toFixed(2)}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; font-size: 9px; text-transform: uppercase;">${item.destinationItem.description}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center; text-transform: uppercase; font-weight: bold;">${item.level.name}</td>
                    </tr>
                `;
            }).join('');
        }).join('');

        const html = `
            <html>
                <head>
                    <title>Reporte de Egresos de Almacén - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                        .title-brand { font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        .subtitle-brand { font-size: 10px; color: #666; margin-top: 2px; font-weight: bold; letter-spacing: 2px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f8f8f8; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                        .summary-box { background: #fef2f2; border: 1px solid #fee2e2; padding: 15px; border-radius: 8px; margin-top: 30px; text-align: right; }
                        .summary-label { font-size: 10px; font-weight: bold; color: #991b1b; text-transform: uppercase; }
                        .summary-value { font-size: 20px; font-weight: 900; color: #b91c1c; }
                        @media print { body { padding: 0; } @page { margin: 1.5cm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div><h1 class="title-brand">BIMUS</h1><p class="subtitle-brand">ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><p style="font-size: 10px; font-weight: 900; margin: 0;">CONTROL DE DESPACHO / EGRESOS DE ALMACÉN</p></div>
                    </div>
                    <h2>${project.title}</h2>
                    <p style="font-size: 11px; margin-bottom: 20px;">Reporte detallado de materiales despachados para ejecución, vinculados a sus respectivas partidas y niveles de obra.</p>
                    <table>
                        <thead><tr><th>Fecha</th><th>Descripción Insumo</th><th>Und.</th><th>Cant.</th><th>Partida Destino</th><th>Nivel</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">No se registran salidas de material en almacén.</td></tr>'}</tbody>
                    </table>
                    <div class="summary-box">
                        <div class="summary-label">Total Unidades Despachadas</div>
                        <div class="summary-value">${totalItemsDispatched.toFixed(2)}</div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const generateWarehouseEntriesPDF = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const entries = project.warehouseEntries || [];

        let totalItemsReceived = 0;
        const rows = entries.map((entry: any) => {
            return entry.items.map((item: any) => {
                totalItemsReceived += item.quantity;
                return `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; font-family: monospace;">${new Date(entry.date).toLocaleDateString('es-ES')}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-transform: uppercase;">${entry.supplier?.company || entry.supplier?.name || 'Varios'}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; font-weight: bold;">${item.supply.description}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${item.supply.unit}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: bold; color: #10b981;">${item.quantity.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');
        }).join('');

        const html = `
            <html>
                <head>
                    <title>Reporte de Ingresos a Almacén - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                        .title-brand { font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        .subtitle-brand { font-size: 10px; color: #666; margin-top: 2px; font-weight: bold; letter-spacing: 2px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f8f8f8; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                        .summary-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-top: 30px; text-align: right; }
                        .summary-label { font-size: 10px; font-weight: bold; color: #166534; text-transform: uppercase; }
                        .summary-value { font-size: 20px; font-weight: 900; color: #15803d; }
                        @media print { body { padding: 0; } @page { margin: 1.5cm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div><h1 class="title-brand">BIMUS</h1><p class="subtitle-brand">ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><p style="font-size: 10px; font-weight: 900; margin: 0;">CONTROL DE INGRESOS A ALMACÉN</p></div>
                    </div>
                    <h2>${project.title}</h2>
                    <p style="font-size: 11px; margin-bottom: 20px;">Historial detallado de materiales y recursos ingresados físicamente al inventario de obra.</p>
                    <table>
                        <thead><tr><th>Fecha</th><th>Proveedor</th><th>Descripción Insumo</th><th>Und.</th><th>Cant. Ingresada</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #888;">No se registran ingresos de material en almacén.</td></tr>'}</tbody>
                    </table>
                    <div class="summary-box">
                        <div class="summary-label">Total Unidades Recibidas</div>
                        <div class="summary-value">${totalItemsReceived.toFixed(2)}</div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const generateEquipmentPDF = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const items = project.items || [];
        const equipmentMap: Record<string, any> = {};

        items.forEach((pi: any) => {
            const itemQty = pi.quantity || 0;
            const supplies = pi.item?.supplies || [];
            supplies.forEach((is: any) => {
                const s = is.supply;
                if (s.typology !== 'Equipo' && s.typology !== 'Herramienta') return;
                const totalQty = itemQty * (is.quantity || 0);
                if (equipmentMap[s.id]) {
                    equipmentMap[s.id].totalQty += totalQty;
                } else {
                    equipmentMap[s.id] = {
                        description: s.description,
                        unit: s.unit,
                        totalQty: totalQty,
                        price: s.price,
                        id: s.id
                    };
                }
            });
        });

        let grandTotal = 0;
        const rows = Object.values(equipmentMap).map((s: any) => {
            const subtotal = s.totalQty * s.price;
            grandTotal += subtotal;
            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; font-family: monospace;">${s.id.slice(-6).toUpperCase()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">${s.description}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${s.unit}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">${s.totalQty.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">$${s.price.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: bold;">$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <html>
                <head>
                    <title>Consolidado de Equipo y Maquinaria - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                        .title-brand { font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        .subtitle-brand { font-size: 10px; color: #666; margin-top: 2px; font-weight: bold; letter-spacing: 2px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f8f8f8; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                        .total-box { background: #000; color: #fff; padding: 20px 30px; border-radius: 4px; text-align: right; margin-top: 30px; }
                        .total-value { font-size: 26px; font-weight: 900; margin-top: 5px; }
                        @media print { body { padding: 0; } @page { margin: 1.5cm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div><h1 class="title-brand">BIMUS</h1><p class="subtitle-brand">ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><p style="font-size: 10px; font-weight: 900; margin: 0;">CONSOLIDADO DE EQUIPO Y MAQUINARIA</p></div>
                    </div>
                    <h2>${project.title}</h2>
                    <p style="font-size: 11px; margin-bottom: 20px;">Relación total de maquinaria, herramientas y equipos necesarios para la obra.</p>
                    <table>
                        <thead><tr><th>ID</th><th>Descripción Equipo</th><th>Und.</th><th>Cant. Total</th><th>Costo Unit.</th><th>Subtotal</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">No se encontró equipo o maquinaria vinculada al proyecto.</td></tr>'}</tbody>
                    </table>
                    <div class="total-box">
                        <div style="font-size: 10px; font-weight: bold; opacity: 0.7;">Inversión Total en Equipo</div>
                        <div class="total-value">$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const generateLaborPDF = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const items = project.items || [];
        const laborMap: Record<string, any> = {};

        items.forEach((pi: any) => {
            const itemQty = pi.quantity || 0;
            const supplies = pi.item?.supplies || [];
            supplies.forEach((is: any) => {
                const s = is.supply;
                if (s.typology !== 'Mano de Obra' && s.typology !== 'Honorario') return;
                const totalQty = itemQty * (is.quantity || 0);
                if (laborMap[s.id]) {
                    laborMap[s.id].totalQty += totalQty;
                } else {
                    laborMap[s.id] = {
                        description: s.description,
                        unit: s.unit,
                        totalQty: totalQty,
                        price: s.price,
                        id: s.id
                    };
                }
            });
        });

        let grandTotal = 0;
        const rows = Object.values(laborMap).map((s: any) => {
            const subtotal = s.totalQty * s.price;
            grandTotal += subtotal;
            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; font-family: monospace;">${s.id.slice(-6).toUpperCase()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">${s.description}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${s.unit}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">${s.totalQty.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">$${s.price.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: bold;">$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <html>
                <head>
                    <title>Consolidado de Mano de Obra - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                        .title-brand { font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        .subtitle-brand { font-size: 10px; color: #666; margin-top: 2px; font-weight: bold; letter-spacing: 2px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f8f8f8; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                        .total-box { background: #000; color: #fff; padding: 20px 30px; border-radius: 4px; text-align: right; margin-top: 30px; }
                        .total-value { font-size: 26px; font-weight: 900; margin-top: 5px; }
                        @media print { body { padding: 0; } @page { margin: 1.5cm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div><h1 class="title-brand">BIMUS</h1><p class="subtitle-brand">ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><p style="font-size: 10px; font-weight: 900; margin: 0;">CONSOLIDADO DE MANO DE OBRA</p></div>
                    </div>
                    <h2>${project.title}</h2>
                    <p style="font-size: 11px; margin-bottom: 20px;">Estimación total de recursos humanos y cuadrillas requeridos para el proyecto.</p>
                    <table>
                        <thead><tr><th>ID</th><th>Especialidad / Cargo</th><th>Und.</th><th>Cant. Total</th><th>Costo Unit.</th><th>Subtotal</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">No se encontró mano de obra vinculada al proyecto.</td></tr>'}</tbody>
                    </table>
                    <div class="total-box">
                        <div style="font-size: 10px; font-weight: bold; opacity: 0.7;">Inversión Total en Personal</div>
                        <div class="total-value">$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const generateMaterialsPDF = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const items = project.items || [];
        const supplyMap: Record<string, any> = {};

        items.forEach((pi: any) => {
            const itemQty = pi.quantity || 0;
            const supplies = pi.item?.supplies || [];
            supplies.forEach((is: any) => {
                const s = is.supply;
                if (s.typology !== 'Material' && s.typology !== 'Insumo') return;
                const totalQty = itemQty * (is.quantity || 0);
                if (supplyMap[s.id]) {
                    supplyMap[s.id].totalQty += totalQty;
                } else {
                    supplyMap[s.id] = {
                        description: s.description,
                        unit: s.unit,
                        totalQty: totalQty,
                        price: s.price,
                        id: s.id
                    };
                }
            });
        });

        let grandTotal = 0;
        const rows = Object.values(supplyMap).map((s: any) => {
            const subtotal = s.totalQty * s.price;
            grandTotal += subtotal;
            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; font-family: monospace;">${s.id.slice(-6).toUpperCase()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">${s.description}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${s.unit}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">${s.totalQty.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">$${s.price.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: bold;">$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <html>
                <head>
                    <title>Consolidado de Materiales - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                        .title-brand { font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        .subtitle-brand { font-size: 10px; color: #666; margin-top: 2px; font-weight: bold; letter-spacing: 2px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f8f8f8; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                        .total-box { background: #000; color: #fff; padding: 20px 30px; border-radius: 4px; text-align: right; margin-top: 30px; }
                        .total-value { font-size: 26px; font-weight: 900; margin-top: 5px; }
                        @media print { body { padding: 0; } @page { margin: 1.5cm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div><h1 class="title-brand">BIMUS</h1><p class="subtitle-brand">ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><p style="font-size: 10px; font-weight: 900; margin: 0;">CONSOLIDADO DE MATERIALES E INSUMOS</p></div>
                    </div>
                    <h2>${project.title}</h2>
                    <p style="font-size: 11px; margin-bottom: 20px;">Listado global de materiales requeridos para la ejecución total del proyecto.</p>
                    <table>
                        <thead><tr><th>ID</th><th>Descripción Material</th><th>Und.</th><th>Cant. Total</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">No se encontraron materiales vinculados al proyecto.</td></tr>'}</tbody>
                    </table>
                    <div class="total-box">
                        <div style="font-size: 10px; font-weight: bold; opacity: 0.7;">Inversión Total en Materiales</div>
                        <div class="total-value">$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const generateBudgetPDF = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const items = project.items || [];
        const config = project.config || {};

        let totalGeneral = 0;
        const rows = items.map((pi: any) => {
            const apu = calculateAPU(pi.item?.supplies || [], config);
            const subtotal = (pi.quantity || 0) * apu.totalUnit;
            totalGeneral += subtotal;
            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">${pi.item.chapter}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">${pi.item.description}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${pi.item.unit}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">${(pi.quantity || 0).toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right;">$${apu.totalUnit.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: bold;">$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <html>
                <head>
                    <title>Reporte de Presupuesto - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                        .title-brand { font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: -1px; }
                        .subtitle-brand { font-size: 10px; color: #666; margin-top: 2px; font-weight: bold; letter-spacing: 2px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f8f8f8; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                        .total-box { background: #000; color: #fff; padding: 20px 30px; border-radius: 4px; text-align: right; margin-top: 30px; }
                        .total-value { font-size: 26px; font-weight: 900; margin-top: 5px; }
                        @media print { body { padding: 0; } @page { margin: 1.5cm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div><h1 class="title-brand">BIMUS</h1><p class="subtitle-brand">ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><p style="font-size: 10px; font-weight: 900; margin: 0;">PRESUPUESTO GENERAL</p></div>
                    </div>
                    <h2>${project.title}</h2>
                    <table>
                        <thead><tr><th>Capítulo</th><th>Descripción de Partida</th><th>Und.</th><th>Cant.</th><th>P. Unit.</th><th>Total Partida</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div class="total-box">
                        <div style="font-size: 10px; font-weight: bold; opacity: 0.7;">Importe Total Presupuestado</div>
                        <div class="total-value">$${totalGeneral.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const generateFinancialPDF = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const transactions = project.transactions || [];

        let totalIngresos = 0;
        let totalEgresos = 0;

        const rows = transactions.map((t: any) => {
            const isIngreso = t.type === 'ingreso';
            if (isIngreso) totalIngresos += t.amount;
            else totalEgresos += t.amount;

            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; font-family: monospace;">${new Date(t.date).toLocaleDateString('es-ES')}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: ${isIngreso ? '#10b981' : '#ef4444'};">${t.type}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-transform: uppercase;">${t.category}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">${t.description}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: bold;">$${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
            `;
        }).join('');

        const balance = totalIngresos - totalEgresos;

        const html = `
            <html>
                <head>
                    <title>Reporte Financiero - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                        .title-brand { font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        .subtitle-brand { font-size: 10px; color: #666; margin-top: 2px; font-weight: bold; letter-spacing: 2px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f8f8f8; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                        .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 30px; }
                        .summary-card { padding: 20px; border-radius: 8px; border: 1px solid #ddd; text-align: right; }
                        .summary-label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #666; }
                        .summary-value { font-size: 20px; font-weight: 900; margin-top: 5px; }
                        .balance-card { background: #000; color: #fff; border: 0; }
                        @media print { body { padding: 0; } @page { margin: 1.5cm; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div><h1 class="title-brand">BIMUS</h1><p class="subtitle-brand">ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><p style="font-size: 10px; font-weight: 900; margin: 0;">ESTADO FINANCIERO DE PROYECTO</p></div>
                    </div>
                    <h2>${project.title}</h2>
                    <table>
                        <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción / Concepto</th><th>Importe</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #888;">Sin transacciones registradas.</td></tr>'}</tbody>
                    </table>
                    <div class="summary-grid">
                        <div class="summary-card"><div class="summary-label">Total Ingresos</div><div class="summary-value" style="color: #10b981;">$${totalIngresos.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div></div>
                        <div class="summary-card"><div class="summary-label">Total Egresos</div><div class="summary-value" style="color: #ef4444;">$${totalEgresos.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div></div>
                        <div class="summary-card balance-card"><div class="summary-label" style="color: rgba(255,255,255,0.6);">Balance Neto</div><div class="summary-value">$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div></div>
                    </div>
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const generateOrdersPDF = () => {
        if (!project) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const items = project.items || [];
        const supplyMap: Record<string, any> = {};
        items.forEach((pi: any) => {
            const itemQty = pi.quantity || 0;
            const supplies = pi.item?.supplies || [];
            supplies.forEach((is: any) => {
                const s = is.supply;
                if (s.typology !== 'Material' && s.typology !== 'Insumo') return;
                const totalQty = itemQty * (is.quantity || 0);
                if (supplyMap[s.id]) supplyMap[s.id].totalQty += totalQty;
                else supplyMap[s.id] = { description: s.description, unit: s.unit, totalQty: totalQty, chapter: pi.item.chapter };
            });
        });

        const rows = Object.values(supplyMap).map((s: any) => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">${s.chapter}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">${s.description}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${s.unit}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: right; font-weight: bold;">${s.totalQty.toFixed(2)}</td>
            </tr>
        `).join('');

        const html = `
            <html><head><style>body{font-family:sans-serif;padding:40px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;font-size:10px;}</style></head>
            <body><h1>Histórico de Pedidos - ${project.title}</h1><table><thead><tr><th>Capítulo</th><th>Insumo</th><th>Und.</th><th>Cant.</th></tr></thead><tbody>${rows}</tbody></table>
            <script>window.onload = function(){ window.print(); window.close(); }</script></body></html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const generatePurchaseOrdersPDF = () => {
        if (!project) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Órdenes de Compra - ${project.title}</title>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                        .title-brand { font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f8f8f8; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 900; }
                        td { border: 1px solid #ddd; padding: 10px 8px; font-size: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div><h1 class="title-brand">BIMUS</h1><p>ARQUITECTURA Y CONSTRUCCIÓN</p></div>
                        <div style="text-align: right;"><p style="font-size: 10px; font-weight: 900; margin: 0;">HISTORIAL DE ÓRDENES DE COMPRA</p></div>
                    </div>
                    <h2>${project.title}</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Orden ID</th>
                                <th>Fecha</th>
                                <th>Proveedor</th>
                                <th style="text-align: center;">Ítems</th>
                                <th style="text-align: right;">Total (USD)</th>
                                <th style="text-align: center;">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 20px; color: #888;">No se registran órdenes de compra formalizadas aún.</td>
                            </tr>
                        </tbody>
                    </table>
                    <script>window.onload = function() { window.print(); window.close(); }</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-card text-primary items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Cargando reportes...</span>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col min-h-screen bg-card text-primary items-center justify-center gap-4 p-8">
                <p className="text-muted-foreground">Proyecto no encontrado.</p>
                <Button variant="outline" onClick={() => router.push("/projects")}>Volver a proyectos</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen text-primary">
            <main className="container mx-auto px-4 py-8 space-y-6 flex-1">
                <div className="w-fit bg-card">
                    <h1 className="text-2xl font-bold font-headline flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        Reportes del proyecto
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Genera y descarga reportes detallados del sistema.
                    </p>
                </div>

                <Card className="bg-card border-accent overflow-hidden gap-0">
                    <CardHeader className="border-b border-accent bg-card">
                        <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            Lista de reportes disponibles
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Selecciona un reporte para generarlo en formato profesional.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-accent">
                                <TableRow className=" border-accent">
                                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground w-10" />
                                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Reporte</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground hidden sm:table-cell">Descripción</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground w-24">Formato</TableHead>
                                    <TableHead className="text-right text-[10px] font-bold uppercase text-muted-foreground w-32 pr-6">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.map((report) => {
                                    const Icon = getReportIcon(report.type);
                                    return (
                                        <TableRow
                                            key={report.id}
                                            className="border-accent hover:bg-muted/40 transition-colors"
                                        >
                                            <TableCell className="py-4">
                                                <div className="p-2 rounded-lg bg-primary/10 w-fit">
                                                    <Icon className="h-4 w-4 text-primary" />
                                                </div>
                                            </TableCell>
                                            <TableCell><span className="font-semibold text-sm">{report.title}</span></TableCell>
                                            <TableCell className="text-muted-foreground text-xs hidden sm:table-cell max-w-xs truncate">{report.description}</TableCell>
                                            <TableCell><span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded">{report.format}</span></TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="border-accent hover:bg-primary/40 text-xs bg-primary text-background"
                                                    onClick={() => handleGenerateReport(report)}
                                                >
                                                    <Download className="h-3.5 w-3.5 mr-1.5" /> Generar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
