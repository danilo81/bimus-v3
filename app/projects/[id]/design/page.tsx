"use client"
import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { ifcLoader } from '@/lib/ifc';
import { BimViewer } from '@/components/bim/BimViewer';
import { Sidebar } from '@/components/bim/Sidebar';
import { LeftSidebar } from '@/components/bim/LeftSidebar';
import { Toolbar } from '@/components/bim/Toolbar';
import { SettingsModal } from '@/components/bim/SettingsModal';
import { SelectSimilarModal } from '@/components/bim/SelectSimilarModal';
import { ContextMenu } from '@/components/bim/ContextMenu';
import { BimElement, BimClass, WallType, LineType, Level, ScaleSettings, ArcConfig, SlabType, IssueNote, SavedView } from '@/types/types';
import { LevelSettingsModal } from '@/components/bim/LevelSettingsModal';
import { ScaleSettingsModal } from '@/components/bim/ScaleSettingsModal';
import { IfcCloudModal } from '@/components/bim/IfcCloudModal';
import { getProjectDocuments } from '@/actions/projects/getProjectDocuments';
import { getProjectById } from '@/actions';
import { createBimIssue } from '@/actions/projects/bimIssues';
import { assignElementToItem, getMappedElements, removeElementMapping } from '@/actions/projects/bimMapping';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Box, Layers, Play } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { BimAssignmentSidebar } from '@/components/bim/BimAssignmentSidebar';
import { useToast } from '@/hooks/use-toast';

export default function ProjectDesignPage() {
    const params = useParams();
    const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const [elements, setElements] = useState<BimElement[]>([]);
    const [ifcModels, setIfcModels] = useState<THREE.Object3D[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [showOutsideGroup, setShowOutsideGroup] = useState(true);
    const [wireframe, setWireframe] = useState(false);
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale' | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSelectSimilarOpen, setIsSelectSimilarOpen] = useState(false);
    const [bimClasses, setBimClasses] = useState<BimClass[]>([
        { id: '00', name: '00', parentId: null },
        { id: '1 PROYECCIONES', name: '1 PROYECCIONES', parentId: null },
        { id: '2 ARQUITECTURA', name: '2 ARQUITECTURA', parentId: null },
        { id: '3 ESTRUCTURAS', name: '3 ESTRUCTURAS', parentId: null }
    ]);
    const [wallTypes, setWallTypes] = useState<WallType[]>([]);
    const [slabTypes, setSlabTypes] = useState<SlabType[]>([]);
    const [lineTypes, setLineTypes] = useState<LineType[]>([]);
    const [classVisibility, setClassVisibility] = useState<Record<string, 'visible' | 'hidden' | 'xray'>>({});
    const [levelVisibility, setLevelVisibility] = useState<Record<string, 'visible' | 'hidden' | 'xray'>>({});
    const [activeLevel, setActiveLevel] = useState<string>('L01');
    const [levels, setLevels] = useState<Level[]>([
        {
            id: 'L00', name: 'L00', isStory: true, elevation: 0, defaultWallHeight: 3.0, cutPlane: 1.2,
            projectId: projectId as string
        },
        {
            id: 'L01', name: 'L01', isStory: true, elevation: 4.2, defaultWallHeight: 3.0, cutPlane: 1.2,
            projectId: projectId as string
        },
        {
            id: 'L02', name: 'L02', isStory: true, elevation: 8.4, defaultWallHeight: 3.0, cutPlane: 1.2,
            projectId: projectId as string
        },
        {
            id: 'Roof', name: 'Roof', isStory: false, elevation: 12.6, defaultWallHeight: 1.0, cutPlane: 1.2,
            projectId: projectId as string
        }
    ]);
    const [isLevelSettingsOpen, setIsLevelSettingsOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState<Level | null>(null);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [clippingPlaneActive, setClippingPlaneActive] = useState(false);
    const [clippingPlaneHeight, setClippingPlaneHeight] = useState(5);
    const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
    const [selectionMode, setSelectionMode] = useState<'single' | 'rectangle' | 'lasso' | 'similar' | 'visibility'>('single');
    const [clipboard, setClipboard] = useState<BimElement[]>([]);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean } | null>(null);
    const [lineConfig, setLineConfig] = useState({
        color: '#ffffff',
        opacity: 100,
        type: 'Solid',
        bimClass: '00'
    });

    const [rectangleConfig, setRectangleConfig] = useState({
        fillColor: '#3b82f6',
        lineColor: '#ffffff',
        opacity: 50,
        lineType: 'Solid',
        creationMode: 'corner' as 'corner' | 'center' | 'edgeCenter' | 'threePoints',
        bimClass: '00'
    });

    const [arcConfig, setArcConfig] = useState<ArcConfig>({
        creationMode: 'centerRadiusPoints',
        lineColor: '#ffffff',
        opacity: 100,
        lineType: 'Solid',
        bimClass: '00'
    });

    const [snapConfig, setSnapConfig] = useState({
        enabled: false,
        grid: true,
        vertices: true,
        point: false,
        distance: false,
        angle: false,
        edge: true,
        face: false,
        edgeCenter: false,
        volume: false
    });

    const [wallConfig, setWallConfig] = useState({
        thickness: 0.15,
        height: 3.0,
        alignment: 'center', // 'left', 'center', 'right'
        bimClass: '00'
    });

    const [activeSlabTypeId, setActiveSlabTypeId] = useState<string | null>(null);

    const [modelConfig, setModelConfig] = useState({
        showGrid: true,
        showShadows: true,
        backgroundColor: '#09090b',
        gridSize: 100,
        gridSpacing: 1,
        gridFullCanvas: false
    });

    const [scaleSettings, setScaleSettings] = useState<ScaleSettings>({
        type: 'metric',
        value: '1:100',
        precision: 2,
        allLayers: true,
        scaleText: true
    });
    const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);

    const [savedViews, setSavedViews] = useState<SavedView[]>([]);
    const [saveViewTrigger, setSaveViewTrigger] = useState(0);
    const [restoreView, setRestoreView] = useState<{ position: [number, number, number], target: [number, number, number] } | null>(null);
    const [issueNotes, setIssueNotes] = useState<IssueNote[]>([]);
    const [isIfcCloudModalOpen, setIsIfcCloudModalOpen] = useState(false);

    // Initial Model Selection
    const [assignedModels, setAssignedModels] = useState<any[]>([]);
    const [showInitialSelector, setShowInitialSelector] = useState(false);

    // BIM 5D State
    const [projectItems, setProjectItems] = useState<any[]>([]);
    const [mappedElements, setMappedElements] = useState<any[]>([]);
    const [activeAssignmentTarget, setActiveAssignmentTarget] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (projectId) {
            getProjectDocuments(projectId as string).then(docs => {
                const roleDocs = docs.filter(d => Boolean(d.bimRole));
                setAssignedModels(roleDocs);
                if (roleDocs.length > 0 && ifcModels.length === 0) {
                    setShowInitialSelector(true);
                }
            });
            getProjectById(projectId as string).then(proj => {
                if (proj && proj.items) {
                    setProjectItems(proj.items);
                }
            });
            getMappedElements(projectId as string).then(maps => {
                setMappedElements(maps);
            });
        }
    }, [projectId, ifcModels.length]);

    const selectedElements = elements.filter(e => selectedElementIds.includes(e.id));
    const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

    const handleSelect = async (id: string | null, multi: boolean = false) => {
        if (!id) {
            setSelectedElementIds([]);
            return;
        }

        // If in assign mode and we have an active target
        if (activeTool === 'assign' && activeAssignmentTarget) {
            const el = elements.find(e => e.id === id);
            if (!el) return;

            const targetItem = projectItems.find(pi => pi.id === activeAssignmentTarget);
            if (!targetItem) return;

            // Check if already mapped to this target (Toggle behavior)
            const existingMapping = mappedElements.find(m => m.elementId === id && m.projectItemId === activeAssignmentTarget);

            if (existingMapping) {
                toast({ title: "Desvinculando...", description: "Removiendo elemento de la partida" });
                const res = await removeElementMapping(projectId as string, id);
                if (res.success) {
                    setMappedElements(prev => prev.filter(m => m.elementId !== id));
                    setProjectItems(prev => prev.map(pi => {
                        if (pi.id === activeAssignmentTarget) {
                            return { ...pi, quantity: Math.max(0, (pi.quantity || 0) - existingMapping.quantity) };
                        }
                        return pi;
                    }));
                }
                return;
            }

            // Extract correct quantity (volume or area depending on unit)
            const unit = targetItem.item.unit.toLowerCase();
            let qty = el.volume || 0;
            if (unit.includes('m2') || unit.includes('m²')) qty = el.area || 0;
            if (unit.includes('m') && !unit.includes('2') && !unit.includes('3')) {
                // Approximate length if possible (max bounding box dimension usually)
                if (el.geometry.args && el.geometry.args.length >= 3) {
                    qty = Math.max(...el.geometry.args.slice(0, 3));
                } else {
                    qty = 0;
                }
            }
            if (unit.includes('glb') || unit.includes('und')) qty = 1;

            toast({ title: "Asignando...", description: `Mapeando elemento a ${targetItem.item.description}` });

            const res = await assignElementToItem(
                projectId as string,
                activeAssignmentTarget,
                id,
                el.name || el.category,
                qty,
                unit
            );

            if (res.success) {
                // Update local state to reflect the mapping
                setMappedElements(prev => [...prev.filter(p => p.elementId !== id), { elementId: id, projectItemId: activeAssignmentTarget, quantity: qty }]);

                // Update local project item quantity visually
                setProjectItems(prev => prev.map(pi => {
                    if (pi.id === activeAssignmentTarget) {
                        const sumCurrent = mappedElements.filter(m => m.projectItemId === activeAssignmentTarget && m.elementId !== id).reduce((a, b) => a + b.quantity, 0);
                        return { ...pi, quantity: sumCurrent + qty };
                    }
                    return pi;
                }));
            }
            return;
        }

        if (selectionMode === 'visibility') {
            setElements(prev => prev.map(el =>
                el.id === id ? { ...el, visibility: el.visibility === 'hidden' ? 'visible' : 'hidden' } : el
            ));
            return;
        }

        if (multi) {
            setSelectedElementIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        } else {
            setSelectedElementIds([id]);
        }
    };

    const handleGroup = () => {
        if (selectedElementIds.length < 2) return;
        const groupId = `GROUP-${Date.now()}`;
        setElements(prev => prev.map(el =>
            selectedElementIds.includes(el.id) ? { ...el, groupId } : el
        ));
        setSelectedElementIds([selectedElementIds[0]]); // Select one to show group options
    };

    const handleUngroup = () => {
        if (selectedElementIds.length === 0) return;

        // Find all groups involved in selection
        const groupIdsToUngroup = new Set<string>();
        elements.forEach(el => {
            if (selectedElementIds.includes(el.id) && el.groupId) {
                groupIdsToUngroup.add(el.groupId);
            }
        });

        if (groupIdsToUngroup.size === 0) return;

        setElements(prev => prev.map(el =>
            el.groupId && groupIdsToUngroup.has(el.groupId) ? { ...el, groupId: undefined } : el
        ));
    };

    const handleEnterGroupEdit = (groupId: string) => {
        setEditingGroupId(groupId);
        setSelectedElementIds([]);
    };

    const handleExitGroupEdit = () => {
        setEditingGroupId(null);
        setSelectedElementIds([]);
    };

    const handleSelectCloudIfc = async (url: string, name: string) => {
        setIsIfcCloudModalOpen(false);
        try {
            // Check if the URL is an R2 public URL and redirect through our proxy if so
            let fetchUrl = url;
            if (url.includes('.r2.dev/')) {
                const parts = url.split('.r2.dev/');
                if (parts.length > 1) {
                    const key = parts[1];
                    fetchUrl = `/api/r2/file/${encodeURIComponent(key)}`;
                    console.log(`Routing IFC through proxy: ${fetchUrl}`);
                }
            }

            ifcLoader.load(fetchUrl, async (ifcModel) => {
                setIfcModels(prev => [...prev, ifcModel]);

                try {
                    const spatialTree = await ifcLoader.ifcManager.getSpatialStructure(ifcModel.modelID);
                    const newElements: BimElement[] = [];
                    const newClasses: BimClass[] = [];
                    const newLevels: Level[] = [...levels];

                    const traverse = async (node: any, parentLevelId: string) => {
                        let currentLevelId = parentLevelId;

                        if (node.type === 'IFCBUILDINGSTOREY') {
                            try {
                                const props = await ifcLoader.ifcManager.getItemProperties(ifcModel.modelID, node.expressID);
                                const levelName = props.Name?.value || `Level ${node.expressID}`;
                                const elevation = props.Elevation?.value || 0;

                                let existingLevel = newLevels.find(l => l.name === levelName);
                                if (!existingLevel) {
                                    existingLevel = {
                                        id: `level-${Date.now()}-${Math.random()}`,
                                        name: levelName,
                                        isStory: true,
                                        elevation: elevation,
                                        defaultWallHeight: 3.0,
                                        cutPlane: 1.2,
                                        projectId: projectId as string
                                    };
                                    newLevels.push(existingLevel);
                                }
                                currentLevelId = (existingLevel as Level).id;
                            } catch (e) { }
                        }

                        const spatialTypes = ['IFCPROJECT', 'IFCSITE', 'IFCBUILDING', 'IFCBUILDINGSTOREY'];
                        const isPhysicalElement = !spatialTypes.includes(node.type);

                        if (isPhysicalElement) {
                            let elName = `${node.type} ${node.expressID}`;
                            try {
                                const props = await ifcLoader.ifcManager.getItemProperties(ifcModel.modelID, node.expressID);
                                if (props && props.Name && props.Name.value) {
                                    elName = props.Name.value;
                                }
                            } catch (e) { }

                            const className = node.type;
                            let bimClass = newClasses.find(c => c.name === className) || bimClasses.find(c => c.name === className);
                            if (!bimClass) {
                                bimClass = { id: `class-${className}-${Date.now()}-${Math.random()}`, name: className, parentId: null };
                                newClasses.push(bimClass);
                            }

                            newElements.push({
                                id: `ifc-${ifcModel.modelID}-${node.expressID}`,
                                category: className,
                                name: elName,
                                level: currentLevelId,
                                bimClass: bimClass.id,
                                material: 'IFC Material',
                                volume: 0,
                                area: 0,
                                color: '#cccccc',
                                geometry: {
                                    type: 'ifc',
                                    args: { modelID: ifcModel.modelID, expressID: node.expressID },
                                    position: [0, 0, 0]
                                }
                            });
                        }

                        if (node.children && node.children.length > 0) {
                            for (const child of node.children) {
                                await traverse(child, currentLevelId);
                            }
                        }
                    };

                    await traverse(spatialTree, activeLevel);

                    setBimClasses(prev => [...prev, ...newClasses]);
                    setElements(prev => [...prev, ...newElements]);
                    if (newLevels.length > levels.length) {
                        newLevels.sort((a, b) => a.elevation - b.elevation);
                        setLevels(newLevels);
                    }

                } catch (err) {
                    console.error("Error parsing spatial structure for Cloud IFC:", err);
                }
            });
        } catch (error) {
            console.error("Error loading IFC from Cloud:", error);
        }
    };

    const handleUpdateElement = (id: string, updates: Partial<BimElement>) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const handleUpdateClassVisibility = (bimClassId: string, visibility: 'visible' | 'hidden' | 'xray') => {
        setClassVisibility(prev => ({ ...prev, [bimClassId]: visibility }));

        const getDescendantClasses = (parentId: string): string[] => {
            const children = bimClasses.filter(c => c.parentId === parentId).map(c => c.id);
            return [parentId, ...children.flatMap(getDescendantClasses)];
        };
        const affectedClasses = getDescendantClasses(bimClassId);

        setElements(prev => prev.map(el => affectedClasses.includes(el.bimClass || '00') ? { ...el, visibility } : el));
    };

    const handleUpdateLevelVisibility = (level: string, visibility: 'visible' | 'hidden' | 'xray') => {
        setLevelVisibility(prev => ({ ...prev, [level]: visibility }));
        setElements(prev => prev.map(el => el.level === level ? { ...el, visibility } : el));
    };

    const handleAddWall = (points: [number, number, number][], config: any) => {
        const newWalls: BimElement[] = [];
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = new THREE.Vector3(...points[i]);
            const p2 = new THREE.Vector3(...points[i + 1]);
            const length = p1.distanceTo(p2);
            const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

            const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

            let offset = 0;
            if (config.alignment === 'left') offset = -config.thickness / 2;
            if (config.alignment === 'right') offset = config.thickness / 2;

            const offsetDir = new THREE.Vector3(Math.sin(angle), 0, -Math.cos(angle)).normalize();
            midPoint.add(offsetDir.multiplyScalar(offset));

            const newWall: BimElement = {
                id: `WALL-${Date.now()}-${i}`,
                name: `Wall ${config.thickness * 100}cm`,
                category: 'Walls',
                level: activeLevel,
                bimClass: config.bimClass,
                wallTypeId: config.wallTypeId,
                material: 'Concrete',
                volume: length * config.height * config.thickness,
                area: length * config.height,
                color: '#B22222',
                geometry: {
                    type: 'box',
                    args: [length, config.height, config.thickness],
                    position: [midPoint.x, midPoint.y + config.height / 2, midPoint.z],
                    rotation: [0, -angle, 0],
                    scale: [1, 1, 1],
                }
            };
            newWalls.push(newWall);
        }
        setElements(prev => [...prev, ...newWalls]);
        if (newWalls.length > 0) {
            setSelectedElementIds(newWalls.map(w => w.id));
        }
    };

    const handleAddElement = (type: 'wall' | 'slab' | 'column') => {
        const newElement: BimElement = {
            id: `NEW-${Date.now()}`,
            name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            category: type === 'wall' ? 'Walls' : type === 'slab' ? 'Floors' : 'Structural Columns',
            level: activeLevel,
            bimClass: '00',
            material: 'Concrete',
            volume: type === 'wall' ? 8 : type === 'slab' ? 20 : 0.64,
            area: type === 'wall' ? 40 : type === 'slab' ? 100 : 1.6,
            color: type === 'wall' ? '#B22222' : type === 'slab' ? '#909090' : '#A9A9A9',
            geometry: {
                type: type === 'column' ? 'cylinder' : 'box',
                args: type === 'wall' ? [10, 4, 0.2] : type === 'slab' ? [10, 0.2, 10] : [0.4, 4, 0.4],
                position: [0, 2, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
            }
        };
        setElements([...elements, newElement]);
        setSelectedElementIds([newElement.id]);
        setTransformMode('translate');
    };

    const handleAddLine = (start: [number, number, number], end: [number, number, number]) => {
        const newElement: BimElement = {
            id: `LINE-${Date.now()}`,
            name: `New Line`,
            category: 'Lines',
            level: activeLevel,
            bimClass: lineConfig.bimClass,
            material: lineConfig.type, // Store type in material for now
            volume: 0,
            area: 0,
            color: lineConfig.color,
            opacity: lineConfig.opacity / 100,
            visibility: 'visible',
            geometry: {
                type: 'line',
                args: [...start, ...end] as [number, number, number, number, number, number],
                position: [0, 0, 0],
            }
        };
        setElements([...elements, newElement]);
        setSelectedElementIds([newElement.id]);
    };

    const handleAddPolyline = (points: [number, number, number][]) => {
        // Calculate centroid for position
        const sum = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
        const centroid: [number, number, number] = [sum[0] / points.length, sum[1] / points.length, sum[2] / points.length];

        // Adjust points to be relative to centroid
        const relativePoints = points.map(p => [p[0] - centroid[0], p[1] - centroid[1], p[2] - centroid[2]]);

        const newElement: BimElement = {
            id: `POLYLINE-${Date.now()}`,
            name: `New Polyline`,
            category: 'Lines',
            level: activeLevel,
            bimClass: lineConfig.bimClass,
            material: lineConfig.type,
            volume: 0,
            area: 0, // Should calculate area for polygon
            color: lineConfig.color,
            opacity: lineConfig.opacity / 100,
            visibility: 'visible',
            geometry: {
                type: 'polygon',
                args: relativePoints.flat() as number[],
                position: centroid,
            }
        };
        setElements([...elements, newElement]);
        setSelectedElementIds([newElement.id]);
    };

    const handleAddRectangle = (position: [number, number, number], args: [number, number, number], rotation: [number, number, number], config: any) => {
        const positiveArgs: [number, number, number] = [Math.abs(args[0]), Math.abs(args[1]), args[2]];
        const newElement: BimElement = {
            id: `RECT-${Date.now()}`,
            name: `New Rectangle`,
            category: 'Rectangles',
            level: activeLevel,
            bimClass: config.bimClass,
            material: config.lineType, // Store line type in material
            volume: 0,
            area: positiveArgs[0] * positiveArgs[1],
            color: config.fillColor,
            lineColor: config.lineColor,
            opacity: config.opacity / 100,
            visibility: 'visible',
            geometry: {
                type: 'rectangle',
                args: positiveArgs,
                position: position,
                rotation: rotation,
            }
        };
        setElements([...elements, newElement]);
        setSelectedElementIds([newElement.id]);
    };

    const handleAddArc = (points: [number, number, number][], config: ArcConfig) => {
        // Calculate center and radius based on creationMode
        // For now, simple implementation: centroid as center, distance to first point as radius
        const p1 = new THREE.Vector3(...points[0]);
        const p2 = new THREE.Vector3(...points[1]);
        const p3 = new THREE.Vector3(...points[2]);

        // Simple center calculation (centroid)
        const center = new THREE.Vector3().add(p1).add(p2).add(p3).multiplyScalar(1 / 3);
        const radius = center.distanceTo(p1);

        const newElement: BimElement = {
            id: `ARC-${Date.now()}`,
            name: `New Arc`,
            category: 'Arcs',
            level: activeLevel,
            bimClass: config.bimClass,
            material: config.lineType,
            volume: 0,
            area: 0,
            color: config.lineColor,
            opacity: config.opacity / 100,
            visibility: 'visible',
            geometry: {
                type: 'arc',
                args: [radius, 0, Math.PI * 2], // Radius, startAngle, endAngle
                position: [center.x, center.y, center.z],
            }
        };
        setElements([...elements, newElement]);
        setSelectedElementIds([newElement.id]);
    };

    const handleDeleteSelected = () => {
        if (selectedElementIds.length > 0) {
            setElements(prev => prev.filter(el => !selectedElementIds.includes(el.id)));
            setSelectedElementIds([]);
            setTransformMode(null);
        }
    };

    const handleCopy = () => {
        const toCopy = elements.filter(el => selectedElementIds.includes(el.id));
        setClipboard(toCopy);
        setContextMenu(null);
    };

    const handleCut = () => {
        const toCut = elements.filter(el => selectedElementIds.includes(el.id));
        setClipboard(toCut);
        setElements(prev => prev.filter(el => !selectedElementIds.includes(el.id)));
        setSelectedElementIds([]);
        setContextMenu(null);
    };

    const handlePaste = () => {
        if (clipboard.length === 0) return;
        const newElements = clipboard.map(el => ({
            ...el,
            id: `${el.id}-COPY-${Date.now()}`,
            geometry: {
                ...el.geometry,
                position: [el.geometry.position[0] + 1, el.geometry.position[1], el.geometry.position[2] + 1] as [number, number, number]
            }
        }));
        setElements(prev => [...prev, ...newElements]);
        setSelectedElementIds(newElements.map(el => el.id));
        setContextMenu(null);
    };

    const handleLock = (lock: boolean) => {
        setElements(prev => prev.map(el =>
            selectedElementIds.includes(el.id) ? { ...el, locked: lock } : el
        ));
        setContextMenu(null);
    };

    const handleIsolate = () => {
        if (selectedElementIds.length === 0) return;
        setElements(prev => prev.map(el => ({
            ...el,
            visibility: selectedElementIds.includes(el.id) ? 'visible' : 'hidden'
        })));
        setContextMenu(null);
    };

    const handleShowAll = () => {
        setElements(prev => prev.map(el => ({ ...el, visibility: 'visible' })));
        setContextMenu(null);
    };

    const handleUpdateLevel = (updatedLevel: Level) => {
        setLevels(prev => prev.map(l => l.id === updatedLevel.id ? updatedLevel : l));
    };

    const handleOpenLevelSettings = (levelId: string) => {
        const level = levels.find(l => l.id === levelId);
        if (level) {
            setEditingLevel(level);
            setIsLevelSettingsOpen(true);
        }
    };

    const handleImportIFC = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);

        ifcLoader.load(url, async (ifcModel: any) => {
            setIfcModels(prev => [...prev, ifcModel]);

            try {
                const spatialTree = await ifcLoader.ifcManager.getSpatialStructure(ifcModel.modelID);
                const newElements: BimElement[] = [];
                const newClasses: BimClass[] = [];
                const newLevels: Level[] = [];

                const traverse = async (node: any, levelId: string) => {
                    let currentLevelId = levelId;
                    if (node.type === 'IFCBUILDINGSTOREY') {
                        try {
                            const props = await ifcLoader.ifcManager.getItemProperties(ifcModel.modelID, node.expressID);
                            if (props && props.Name && props.Name.value) {
                                const levelName = props.Name.value;

                                let elevation = 0;
                                if (props.Elevation !== undefined && props.Elevation !== null) {
                                    elevation = props.Elevation.value !== undefined ? props.Elevation.value : props.Elevation;
                                }

                                let existingLevel = newLevels.find(l => l.name === levelName);
                                if (!existingLevel) {
                                    existingLevel = {
                                        id: `level-${Date.now()}-${Math.random()}`,
                                        name: levelName,
                                        isStory: true,
                                        elevation: elevation,
                                        defaultWallHeight: 3.0,
                                        cutPlane: 1.2,
                                        projectId: projectId as string
                                    };
                                    newLevels.push(existingLevel);
                                }
                                currentLevelId = (existingLevel as Level).id;
                            }
                        } catch (e) { }
                    }

                    // List of types that are typically spatial containers rather than physical objects
                    const spatialTypes = ['IFCPROJECT', 'IFCSITE', 'IFCBUILDING', 'IFCBUILDINGSTOREY'];
                    const isPhysicalElement = !spatialTypes.includes(node.type);

                    if (isPhysicalElement) {
                        let name = `${node.type} ${node.expressID}`;
                        try {
                            const props = await ifcLoader.ifcManager.getItemProperties(ifcModel.modelID, node.expressID);
                            if (props && props.Name && props.Name.value) {
                                name = props.Name.value;
                            }
                        } catch (e) { }

                        const className = node.type;
                        let bimClass = newClasses.find(c => c.name === className) || bimClasses.find(c => c.name === className);
                        if (!bimClass) {
                            bimClass = { id: `class-${className}-${Date.now()}-${Math.random()}`, name: className, parentId: null };
                            newClasses.push(bimClass);
                        }

                        newElements.push({
                            id: `ifc-${ifcModel.modelID}-${node.expressID}`,
                            category: className,
                            name: name,
                            level: currentLevelId,
                            bimClass: bimClass.id,
                            material: 'IFC Material',
                            volume: 0,
                            area: 0,
                            color: '#cccccc',
                            geometry: {
                                type: 'ifc',
                                args: { modelID: ifcModel.modelID, expressID: node.expressID },
                                position: [0, 0, 0]
                            }
                        });
                    }

                    if (node.children && node.children.length > 0) {
                        for (const child of node.children) {
                            await traverse(child, currentLevelId);
                        }
                    }
                };

                await traverse(spatialTree, activeLevel);

                setBimClasses(prev => [...prev, ...newClasses]);
                setElements(prev => [...prev, ...newElements]);

                if (newLevels.length > 0) {
                    // Sort levels by elevation
                    newLevels.sort((a, b) => a.elevation - b.elevation);
                    setLevels(newLevels);
                    setActiveLevel(newLevels[0].id);
                }

            } catch (err) {
                console.error("Error parsing IFC structure", err);
            }

        }, undefined, (error: any) => {
            console.error('Error loading IFC:', error);
        });

        // Reset input
        if (event.target) {
            event.target.value = '';
        }
    };

    return (
        <div className="relative h-[90vh] w-full bg-card overflow-hidden font-sans border border-accent rounded-xl m-2">
            <input
                type="file"
                accept=".ifc"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImportIFC}
            />
            <LeftSidebar
                elements={elements}
                selectedId={selectedElementIds.length === 1 ? selectedElementIds[0] : null}
                onSelect={(id) => handleSelect(id)}
                onUpdateElement={handleUpdateElement}
                bimClasses={bimClasses}
                onAddBimClass={(newClass) => setBimClasses([...bimClasses, newClass])}
                onReorderBimClasses={(newClasses) => setBimClasses(newClasses)}
                classVisibility={classVisibility}
                onUpdateClassVisibility={handleUpdateClassVisibility}
                levelVisibility={levelVisibility}
                onUpdateLevelVisibility={handleUpdateLevelVisibility}
                activeLevel={activeLevel}
                onSelectLevel={setActiveLevel}
                levels={levels}
                onOpenLevelSettings={handleOpenLevelSettings}
                wallTypes={wallTypes}
                setWallTypes={setWallTypes}
                slabTypes={slabTypes}
                setSlabTypes={setSlabTypes}
                lineTypes={lineTypes}
                setLineTypes={setLineTypes}
                scaleSettings={scaleSettings}
                savedViews={savedViews}
                setSavedViews={setSavedViews}
                onSaveViewRequest={() => setSaveViewTrigger(prev => prev + 1)}
                onRestoreView={(view) => setRestoreView({ position: view.cameraPosition, target: view.cameraTarget })}
                issueNotes={issueNotes}
                setIssueNotes={setIssueNotes}
                onCreateIssue={async (data) => {
                    if (!projectId) return false;
                    try {
                        const result = await createBimIssue({
                            projectId,
                            elementId: data.elementId,
                            elementName: data.elementName,
                            title: data.title,
                            description: data.description
                        });
                        if (result.success) {
                            toast({ title: 'Incidencia creada', description: `La nota "${data.title}" fue guardada con estado pendiente.` });
                            return true;
                        } else {
                            toast({ title: 'Error', description: result.error || 'No se pudo guardar la incidencia.', variant: 'destructive' });
                            return false;
                        }
                    } catch (e: any) {
                        toast({ title: 'Error', description: e.message, variant: 'destructive' });
                        return false;
                    }
                }}
            />

            <Toolbar
                transformMode={transformMode}
                setTransformMode={setTransformMode}
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                onAddElement={handleAddElement}
                onDeleteSelected={handleDeleteSelected}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenScaleSettings={() => setIsScaleModalOpen(true)}
                hasSelection={selectedElementIds.length > 0}
                selectedElementIds={selectedElementIds}
                elements={elements}
                onGroup={handleGroup}
                onUngroup={handleUngroup}
                editingGroupId={editingGroupId}
                onEnterGroupEdit={handleEnterGroupEdit}
                onExitGroupEdit={handleExitGroupEdit}
                showOutsideGroup={showOutsideGroup}
                setShowOutsideGroup={setShowOutsideGroup}
                lineConfig={lineConfig}
                setLineConfig={setLineConfig}
                rectangleConfig={rectangleConfig}
                setRectangleConfig={setRectangleConfig}
                arcConfig={arcConfig}
                setArcConfig={setArcConfig}
                wallConfig={wallConfig}
                setWallConfig={setWallConfig}
                bimClasses={bimClasses}
                wallTypes={wallTypes}
                slabTypes={slabTypes}
                lineTypes={lineTypes}
                snapConfig={snapConfig}
                setSnapConfig={setSnapConfig}
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectionMode={selectionMode}
                setSelectionMode={(mode) => {
                    if (mode === 'similar') {
                        setIsSelectSimilarOpen(true);
                    } else {
                        setSelectionMode(mode);
                    }
                }}
                scaleSettings={scaleSettings}
                onImportIFC={() => fileInputRef.current?.click()}
                activeSlabTypeId={activeSlabTypeId}
                setActiveSlabTypeId={setActiveSlabTypeId}
                clippingPlaneActive={clippingPlaneActive}
                setClippingPlaneActive={setClippingPlaneActive}
                clippingPlaneHeight={clippingPlaneHeight}
                setClippingPlaneHeight={setClippingPlaneHeight}
                onOpenIfcCloud={() => setIsIfcCloudModalOpen(true)}
            />
            <BimViewer
                elements={elements}
                ifcModels={ifcModels}
                selectedIds={selectedElementIds}
                onSelect={handleSelect}
                onSelectMultiple={(ids) => setSelectedElementIds(ids)}
                onUpdateElement={handleUpdateElement}
                wireframe={wireframe}
                transformMode={transformMode}
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                clippingPlaneActive={clippingPlaneActive}
                clippingPlaneHeight={clippingPlaneHeight}
                setClippingPlaneHeight={setClippingPlaneHeight}
                onAddLine={handleAddLine}
                onAddPolyline={handleAddPolyline}
                lineConfig={lineConfig}
                onAddRectangle={handleAddRectangle}
                rectangleConfig={rectangleConfig}
                onAddArc={handleAddArc}
                arcConfig={arcConfig}
                onAddWall={handleAddWall}
                wallConfig={wallConfig}
                onAddSlab={(points, thickness, elevation) => {
                    const newElement: BimElement = {
                        id: `slab-${Date.now()}`,
                        category: 'Slabs',
                        name: `Slab ${elements.length + 1}`,
                        level: activeLevel,
                        material: 'Default',
                        volume: 0,
                        area: 0,
                        color: '#888888',
                        slabTypeId: activeSlabTypeId || undefined,
                        geometry: {
                            type: 'slab',
                            args: { points, thickness, elevation },
                            position: [0, 0, 0]
                        }
                    };
                    setElements([...elements, newElement]);
                }}
                activeSlabTypeId={activeSlabTypeId}
                slabTypes={slabTypes}
                activeLevel={activeLevel}
                snapConfig={snapConfig}
                wallTypes={wallTypes}
                lineTypes={lineTypes}
                editingGroupId={editingGroupId}
                onExitGroupEdit={handleExitGroupEdit}
                showOutsideGroup={showOutsideGroup}
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectionMode={selectionMode}
                modelConfig={modelConfig}
                onContextMenu={(x, y) => setContextMenu({ x, y, visible: true })}
                scaleSettings={scaleSettings}
                saveViewTrigger={saveViewTrigger}
                onSaveView={(position, target) => {
                    const newView: SavedView = {
                        id: `view-${Date.now()}`,
                        name: `View ${savedViews.length + 1}`,
                        cameraPosition: position,
                        cameraTarget: target
                    };
                    setSavedViews([...savedViews, newView]);
                }}
                restoreView={restoreView}
                mappedElements={mappedElements}
                activeAssignmentTarget={activeAssignmentTarget}
            />
            {selectedElementIds.length === 1 && (
                <Sidebar
                    selectedElement={selectedElement}
                    onClose={() => setSelectedElementIds([])}
                    wireframe={wireframe}
                    onToggleWireframe={() => setWireframe(!wireframe)}
                    onUpdateElement={handleUpdateElement}
                    bimClasses={bimClasses}
                    lineTypes={lineTypes}
                    scaleSettings={scaleSettings}
                />
            )}

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                modelConfig={modelConfig}
                onUpdateModelConfig={setModelConfig}
            />

            <SelectSimilarModal
                isOpen={isSelectSimilarOpen}
                onClose={() => setIsSelectSimilarOpen(false)}
                elements={elements}
                selectedElement={selectedElement}
                onSelect={(ids) => setSelectedElementIds(ids)}
            />

            <ScaleSettingsModal
                isOpen={isScaleModalOpen}
                onClose={() => setIsScaleModalOpen(false)}
                scaleSettings={scaleSettings}
                onUpdateScaleSettings={setScaleSettings}
            />

            {isLevelSettingsOpen && editingLevel && (
                <LevelSettingsModal
                    isOpen={isLevelSettingsOpen}
                    onClose={() => setIsLevelSettingsOpen(false)}
                    level={editingLevel}
                    onSave={handleUpdateLevel}
                    scaleSettings={scaleSettings}
                />
            )}

            {isIfcCloudModalOpen && (
                <IfcCloudModal
                    isOpen={isIfcCloudModalOpen}
                    onClose={() => setIsIfcCloudModalOpen(false)}
                    projectId={projectId as string}
                    onSelect={handleSelectCloudIfc}
                />
            )}

            <Dialog open={showInitialSelector} onOpenChange={setShowInitialSelector}>
                <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-accent text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            Seleccionar Especialidad
                        </DialogTitle>
                        <DialogDescription className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 font-bold">
                            Seleccione el modelo sobre el cual desea trabajar. Puede cargar otros modelos posteriormente desde la barra de herramientas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-4">
                        {assignedModels.map((doc) => (
                            <Button
                                key={doc.id}
                                variant="outline"
                                className="h-auto py-4 flex flex-col items-start gap-2 border-accent hover:bg-accent/10 hover:border-primary transition-colors text-left"
                                onClick={() => {
                                    setShowInitialSelector(false);
                                    handleSelectCloudIfc(doc.url, doc.name);
                                }}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <Box className="h-4 w-4 text-primary" />
                                    <span className="text-[12px] font-black uppercase tracking-wider">{doc.bimRole}</span>
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground truncate w-full">{doc.name}</span>
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {contextMenu?.visible && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onCopy={handleCopy}
                    onCut={handleCut}
                    onPaste={handlePaste}
                    onGroup={handleGroup}
                    onUngroup={handleUngroup}
                    onLock={handleLock}
                    onIsolate={handleIsolate}
                    onShowAll={handleShowAll}
                    hasSelection={selectedElementIds.length > 0}
                    canPaste={clipboard.length > 0}
                    isLocked={selectedElements.some(el => el.locked)}
                />
            )}
            {activeTool === 'assign' && (
                <BimAssignmentSidebar
                    onClose={() => setActiveTool(null)}
                    projectItems={projectItems}
                    mappedElements={mappedElements}
                    activeAssignmentTarget={activeAssignmentTarget}
                    onSelectTarget={setActiveAssignmentTarget}
                />
            )}
        </div>
    );
}
