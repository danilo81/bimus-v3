/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Suspense, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Grid, 
  Stage, 
  Environment, 
  PerspectiveCamera,
  OrthographicCamera,
  Float,
  Text,
  Html,
  Sphere,
  Line as ThreeLine,
  Ring,
  Plane,
  TransformControls
} from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { 
  Box, 
  Layers, 
  Eye, 
  EyeOff,
  Zap, 
  MousePointer2, 
  Ruler, 
  X, 
  Search,
  Settings,
  History,
  Clock,
  UserCircle,
  Sun,
  Grid3X3,
  Pencil,
  Circle as CircleIcon,
  Square,
  Eraser,
  ArrowRightLeft,
  Magnet,
  Maximize2,
  Compass,
  Navigation,
  BoxSelect,
  Map as MapIcon,
  Move,
  RotateCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Metadata for procedural BIM objects
 */
const BIM_OBJECTS = [
  { id: 'foundation', name: 'Losa de Fundación', category: 'Estructura', type: 'Slab', value: 144 },
  { id: 'slab-1', name: 'Losa Entrepiso Nivel 1', category: 'Estructura', type: 'Slab', value: 121 },
  { id: 'slab-roof', name: 'Losa de Cubierta', category: 'Estructura', type: 'Slab', value: 121 },
  { id: 'walls-int', name: 'Muros Interiores', category: 'Arquitectura', type: 'Wall', value: 62.4 },
  { id: 'glass', name: 'Muro Cortina Glass', category: 'Arquitectura', type: 'Curtain Wall', value: 62.4 },
  { id: 'col-grid', name: 'Columnas Estructurales', category: 'Estructura', type: 'Column Group', subItems: [
    { id: 'col--5--5', name: 'Columna A-1' },
    { id: 'col--5-0', name: 'Columna A-2' },
    { id: 'col--5-5', name: 'Columna A-3' },
    { id: 'col-0--5', name: 'Columna B-1' },
    { id: 'col-0-0', name: 'Columna B-2' },
    { id: 'col-0-5', name: 'Columna B-3' },
    { id: 'col-5--5', name: 'Columna C-1' },
    { id: 'col-5-0', name: 'Columna C-2' },
    { id: 'col-5-5', name: 'Columna C-3' },
  ]}
];

/**
 * Mock BIM history data
 */
const BIM_HISTORY = [
  { id: 'rev-1', date: '2024-05-20 14:30', user: 'Arq. Carlos Ruiz', action: 'Ajuste de espesor en losa N1', hash: '8F2A1C' },
  { id: 'rev-2', date: '2024-05-19 09:15', user: 'Ing. Maria Delgado', action: 'Actualización de refuerzo en Columnas A-1 a C-3', hash: '3D9E4B' },
  { id: 'rev-3', date: '2024-05-18 16:45', user: 'Bimus System', action: 'Sincronización automática de parámetros ISO 19650', hash: 'AC77D2' },
  { id: 'rev-4', date: '2024-05-17 11:00', user: 'Arq. Luna', action: 'Modificación de material en muro cortina este', hash: 'BB9011' },
];

type DrawingType = 'none' | 'line' | 'circle' | 'rectangle';
type ViewMode = '3D' | '2D';
type TransformMode = 'translate' | 'rotate' | 'scale';

interface DrawnShape {
  id: string;
  type: DrawingType;
  points: THREE.Vector3[];
  color: string;
}

interface Dimension {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  distance: number;
}

/**
 * ArchitecturalStructure Component with Snap capabilities and Transform Refs
 */
function ArchitecturalStructure({ 
  wireframe = false, 
  xray = false,
  selectable = false,
  selectedIds = [],
  hiddenIds = [],
  onToggleSelect,
  activeMode = 'none',
  onInteractionPoint,
  onHoverPoint,
  onRefCreated
}: { 
  wireframe?: boolean, 
  xray?: boolean,
  selectable?: boolean,
  selectedIds?: string[],
  hiddenIds?: string[],
  onToggleSelect?: (id: string, metadata: any) => void,
  activeMode: 'none' | 'measure' | DrawingType | 'cote',
  onInteractionPoint?: (point: THREE.Vector3) => void,
  onHoverPoint?: (point: THREE.Vector3 | null) => void,
  onRefCreated?: (id: string, ref: THREE.Mesh | THREE.Group) => void
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const opacity = xray ? 0.2 : 1;
  const transparent = xray;

  const getElementColor = (id: string, baseColor: string) => {
    if (selectedIds.includes(id)) return "#10b981"; 
    if (selectable && hoveredId === id) return "#3b82f6"; 
    return baseColor;
  };

  /**
   * Helper to find the closest vertex of an intersected face for snapping
   */
  const findSnapPoint = (intersect: any) => {
    if (!intersect.face || !intersect.object.geometry) return intersect.point;
    
    const mesh = intersect.object;
    const geometry = mesh.geometry;
    const position = geometry.attributes.position;
    
    // Get world position of face vertices
    const vA = new THREE.Vector3().fromBufferAttribute(position, intersect.face.a).applyMatrix4(mesh.matrixWorld);
    const vB = new THREE.Vector3().fromBufferAttribute(position, intersect.face.b).applyMatrix4(mesh.matrixWorld);
    const vC = new THREE.Vector3().fromBufferAttribute(position, intersect.face.c).applyMatrix4(mesh.matrixWorld);

    const points = [vA, vB, vC];
    const threshold = 0.6; // Magnet attraction radius
    
    let closest = intersect.point;
    let minDict = Infinity;

    points.forEach(p => {
      const d = intersect.point.distanceTo(p);
      if (d < threshold && d < minDict) {
        minDict = d;
        closest = p;
      }
    });

    return closest;
  };

  const handlePointerDown = (e: any, id: string, name: string, value: number) => {
    if (activeMode !== 'none') {
      e.stopPropagation();
      const point = findSnapPoint(e);
      onInteractionPoint?.(point);
      return;
    }
    if (!selectable) return;
    e.stopPropagation();
    onToggleSelect?.(id, { name, value });
  };

  const handlePointerMove = (e: any) => {
    if (activeMode === 'none') return;
    e.stopPropagation();
    const point = findSnapPoint(e);
    onHoverPoint?.(point);
  };

  const handlePointerOver = (e: any, id: string) => {
    if (!selectable && activeMode === 'none') return;
    e.stopPropagation();
    setHoveredId(id);
    document.body.style.cursor = 'crosshair';
  };

  const handlePointerOut = () => {
    setHoveredId(null);
    onHoverPoint?.(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <group>
      {/* Foundation Slab */}
      <mesh 
        ref={(el) => { if (el && onRefCreated) onRefCreated('foundation', el); }}
        position={[0, -0.05, 0]} 
        receiveShadow 
        visible={!hiddenIds.includes('foundation')}
        onPointerDown={(e) => handlePointerDown(e, 'foundation', 'Losa de Fundación', 144)}
        onPointerMove={handlePointerMove}
        onPointerOver={(e) => handlePointerOver(e, 'foundation')}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[12, 0.1, 12]} />
        <meshStandardMaterial 
          color={getElementColor('foundation', "#222")} 
          metalness={0.8} 
          roughness={0.2} 
          wireframe={wireframe}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>

      {/* Main Structural Grid (Columns) */}
      <group 
        ref={(el) => { if (el && onRefCreated) onRefCreated('col-grid', el); }}
        visible={!hiddenIds.includes('col-grid')}
      >
        {[-5, 0, 5].map((x) => 
          [-5, 0, 5].map((z) => {
            const id = `col-${x}-${z}`;
            return (
              <mesh 
                key={id} 
                position={[x, 3, z]} 
                castShadow 
                visible={!hiddenIds.includes(id)}
                onPointerDown={(e) => handlePointerDown(e, id, `Columna Estructural ${id}`, 0.96)}
                onPointerMove={handlePointerMove}
                onPointerOver={(e) => handlePointerOver(e, id)}
                onPointerOut={handlePointerOut}
              >
                <boxGeometry args={[0.4, 6, 0.4]} />
                <meshStandardMaterial 
                  color={getElementColor(id, "#555")} 
                  wireframe={wireframe}
                  transparent={transparent}
                  opacity={opacity}
                />
              </mesh>
            );
          })
        )}
      </group>

      {/* First Floor Slab */}
      <mesh 
        ref={(el) => { if (el && onRefCreated) onRefCreated('slab-1', el); }}
        position={[0, 3, 0]} 
        castShadow 
        receiveShadow
        visible={!hiddenIds.includes('slab-1')}
        onPointerDown={(e) => handlePointerDown(e, 'slab-1', 'Losa Entrepiso Nivel 1', 121)}
        onPointerMove={handlePointerMove}
        onPointerOver={(e) => handlePointerOver(e, 'slab-1')}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[11, 0.2, 11]} />
        <meshStandardMaterial 
          color={getElementColor('slab-1', "#444")} 
          transparent={true} 
          opacity={xray ? 0.1 : 0.9} 
          wireframe={wireframe}
        />
      </mesh>

      {/* Top Roof Slab */}
      <mesh 
        ref={(el) => { if (el && onRefCreated) onRefCreated('slab-roof', el); }}
        position={[0, 6, 0]} 
        castShadow 
        receiveShadow
        visible={!hiddenIds.includes('slab-roof')}
        onPointerDown={(e) => handlePointerDown(e, 'slab-roof', 'Losa de Cubierta', 121)}
        onPointerMove={handlePointerMove}
        onPointerOver={(e) => handlePointerOver(e, 'slab-roof')}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[11, 0.2, 11]} />
        <meshStandardMaterial 
          color={getElementColor('slab-roof', "#333")} 
          transparent={true} 
          opacity={xray ? 0.1 : 0.7} 
          wireframe={wireframe}
        />
      </mesh>

      {/* Interior Walls */}
      <mesh 
        ref={(el) => { if (el && onRefCreated) onRefCreated('walls-int', el); }}
        position={[-5.3, 3, 0]} 
        castShadow
        visible={!hiddenIds.includes('walls-int')}
        onPointerDown={(e) => handlePointerDown(e, 'walls-int', 'Muros Interiores', 62.4)}
        onPointerMove={handlePointerMove}
        onPointerOver={(e) => handlePointerOver(e, 'walls-int')}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[0.2, 6, 10.4]} />
        <meshStandardMaterial 
          color={getElementColor('walls-int', "#1a1a1a")} 
          wireframe={wireframe}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>
      
      {/* Glass Curtain Wall */}
      <mesh 
        ref={(el) => { if (el && onRefCreated) onRefCreated('glass', el); }}
        position={[5.3, 3, 0]}
        visible={!hiddenIds.includes('glass')}
        onPointerDown={(e) => handlePointerDown(e, 'glass', 'Muro Cortina Glass', 62.4)}
        onPointerMove={handlePointerMove}
        onPointerOver={(e) => handlePointerOver(e, 'glass')}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[0.1, 6, 10.4]} />
        <meshStandardMaterial 
          color={getElementColor('glass', "#88ccff")} 
          transparent={true} 
          opacity={xray ? 0.05 : 0.3} 
          metalness={1} 
          roughness={0} 
          wireframe={wireframe}
        />
      </mesh>

      {/* Labels 3D */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Text
          position={[0, 7, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          BIMUS CORE MODEL
        </Text>
      </Float>
    </group>
  );
}

/**
 * DrawnShapes Renderer
 */
function DrawnShapes({ shapes }: { shapes: DrawnShape[] }) {
  return (
    <group>
      {shapes.map((shape) => {
        if (shape.type === 'line' && shape.points.length === 2) {
          return (
            <ThreeLine
              key={shape.id}
              points={[shape.points[0], shape.points[1]]}
              color={shape.color}
              lineWidth={3}
            />
          );
        }
        if (shape.type === 'circle' && shape.points.length === 2) {
          const radius = shape.points[0].distanceTo(shape.points[1]);
          return (
            <group key={shape.id} position={shape.points[0]} rotation={[-Math.PI / 2, 0, 0]}>
              <Ring args={[radius - 0.05, radius, 64]}>
                <meshBasicMaterial color={shape.color} side={THREE.DoubleSide} />
              </Ring>
            </group>
          );
        }
        if (shape.type === 'rectangle' && shape.points.length === 2) {
          const p1 = shape.points[0];
          const p2 = shape.points[1];
          const width = Math.abs(p2.x - p1.x);
          const height = Math.abs(p2.z - p1.z);
          const center = new THREE.Vector3((p1.x + p2.x) / 2, p1.y + 0.01, (p1.z + p2.z) / 2);
          return (
            <group key={shape.id} position={center} rotation={[-Math.PI / 2, 0, 0]}>
              <Plane args={[width, height]}>
                <meshBasicMaterial color={shape.color} transparent opacity={0.3} side={THREE.DoubleSide} />
              </Plane>
              <ThreeLine
                points={[
                  new THREE.Vector3(-width/2, -height/2, 0),
                  new THREE.Vector3(width/2, -height/2, 0),
                  new THREE.Vector3(width/2, height/2, 0),
                  new THREE.Vector3(-width/2, height/2, 0),
                  new THREE.Vector3(-width/2, -height/2, 0),
                ]}
                color={shape.color}
                lineWidth={2}
              />
            </group>
          );
        }
        return null;
      })}
    </group>
  );
}

/**
 * Persistent Dimensions Renderer
 */
function PersistentDimensions({ dimensions }: { dimensions: Dimension[] }) {
  return (
    <group>
      {dimensions.map((dim) => (
        <group key={dim.id}>
          <Sphere position={dim.start} args={[0.08, 16, 16]}>
            <meshBasicMaterial color="#00f2ff" />
          </Sphere>
          <Sphere position={dim.end} args={[0.08, 16, 16]}>
            <meshBasicMaterial color="#00f2ff" />
          </Sphere>
          <ThreeLine points={[dim.start, dim.end]} color="#00f2ff" lineWidth={2} />
          <Html position={new THREE.Vector3().addVectors(dim.start, dim.end).multiplyScalar(0.5)}>
            <div className="bg-black/90 border border-[#00f2ff]/40 px-2 py-1 rounded text-[9px] font-black text-[#00f2ff] whitespace-nowrap shadow-2xl">
              {dim.distance.toFixed(3)} m
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/**
 * BimViewer Component
 */
export function BimViewer({ 
  branchName, 
  showControls = true,
  selectable = false,
  selectedIds = [],
  onSelectionChange
}: { 
  branchName?: string, 
  showControls?: boolean,
  selectable?: boolean,
  selectedIds?: string[],
  onSelectionChange?: (ids: string[], totalValue: number) => void
}) {
  const [wireframe, setWireframe] = useState(false);
  const [xray, setXray] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('3D');
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [selectionActive, setSelectionActive] = useState(selectable);
  const [measureActive, setMeasureActive] = useState(false);
  const [coteActive, setCoteActive] = useState(false);
  const [drawingMode, setDrawingMode] = useState<DrawingType>('none');
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [interactionPoints, setInteractionPoints] = useState<THREE.Vector3[]>([]);
  const [drawnShapes, setDrawnShapes] = useState<DrawnShape[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(selectedIds);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [elementsData, setElementsData] = useState<Record<string, number>>({});
  const [snapPoint, setSnapPoint] = useState<THREE.Vector3 | null>(null);
  const [activeViewLabel, setActiveViewLabel] = useState('Perspectiva');
  const [isGizmoDragging, setIsGizmoDragging] = useState(false);

  // Visualization Config State
  const [lightIntensity, setLightIntensity] = useState(0.6);
  const [showGrid, setShowGrid] = useState(true);
  const [showShadows, setShowShadows] = useState(true);

  // References
  const controlsRef = useRef<any>(null);
  const meshRefs = useRef<Record<string, THREE.Mesh | THREE.Group>>({});

  // Sync internal state
  const prevSelectedIdsRef = useRef(JSON.stringify(selectedIds));
  useEffect(() => {
    const currentIdsStr = JSON.stringify(selectedIds);
    if (prevSelectedIdsRef.current !== currentIdsStr) {
      setInternalSelectedIds(selectedIds);
      prevSelectedIdsRef.current = currentIdsStr;
    }
  }, [selectedIds]);

  const handleToggleSelect = useCallback((id: string, metadata: any) => {
    const isSelected = internalSelectedIds.includes(id);
    const nextIds = isSelected 
      ? internalSelectedIds.filter(i => i !== id) 
      : [...internalSelectedIds, id];
    
    const nextElementsData = { ...elementsData };
    if (!isSelected) {
      nextElementsData[id] = metadata.value || 0;
    } else {
      delete nextElementsData[id];
    }

    setInternalSelectedIds(nextIds);
    setElementsData(nextElementsData);

    const totalValue = Object.values(nextElementsData).reduce((a, b) => a + b, 0);
    setTimeout(() => { onSelectionChange?.(nextIds, totalValue); }, 0);
  }, [internalSelectedIds, elementsData, onSelectionChange]);

  const handleInteractionPoint = useCallback((point: THREE.Vector3) => {
    if (measureActive || coteActive) {
      setInteractionPoints(prev => {
        const next = [...prev, point];
        if (next.length === 2) {
          const newDim: Dimension = {
            id: Math.random().toString(36).substr(2, 9),
            start: next[0],
            end: next[1],
            distance: next[0].distanceTo(next[1])
          };
          setDimensions(d => [...d, newDim]);
          return [];
        }
        return next;
      });
      return;
    }

    if (drawingMode !== 'none') {
      setInteractionPoints(prev => {
        const next = [...prev, point];
        if (next.length === 2) {
          const newShape: DrawnShape = {
            id: Math.random().toString(36).substr(2, 9),
            type: drawingMode,
            points: next,
            color: drawingMode === 'line' ? '#3b82f6' : drawingMode === 'circle' ? '#f59e0b' : '#10b981'
          };
          setDrawnShapes(s => [...s, newShape]);
          return [];
        }
        return next;
      });
    }
  }, [measureActive, coteActive, drawingMode]);

  const handleToggleVisibility = useCallback((id: string) => {
    setHiddenIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const handleRefCreated = useCallback((id: string, ref: THREE.Mesh | THREE.Group) => {
    meshRefs.current[id] = ref;
  }, []);

  const clearTools = () => { 
    setInteractionPoints([]); 
    setDrawnShapes([]); 
    setDimensions([]);
  };

  /**
   * Technical View Presets Handler
   */
  const setCameraView = useCallback((view: string, label: string) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = controls.object;
    
    setActiveViewLabel(label);
    
    // Set consistent focus target (center of building)
    controls.target.set(0, 3, 0);

    switch(view) {
      case 'north':
        camera.position.set(0, 3, 20);
        setViewMode('3D');
        break;
      case 'south':
        camera.position.set(0, 3, -20);
        setViewMode('3D');
        break;
      case 'east':
        camera.position.set(20, 3, 0);
        setViewMode('3D');
        break;
      case 'west':
        camera.position.set(-20, 3, 0);
        setViewMode('3D');
        break;
      case 'iso':
        camera.position.set(18, 12, 18);
        setViewMode('3D');
        break;
      case 'axon':
        camera.position.set(15, 15, 15);
        setViewMode('2D'); // Force Orthographic for axonometric look
        break;
      case 'top':
        camera.position.set(0, 30, 0);
        setViewMode('2D');
        break;
    }
    controls.update();
  }, []);

  const toggleExplorer = () => { setExplorerOpen(!explorerOpen); if (!explorerOpen) { setConfigOpen(false); setHistoryOpen(false); } };
  const toggleConfig = () => { setConfigOpen(!configOpen); if (!configOpen) { setExplorerOpen(false); setHistoryOpen(false); } };
  const toggleHistory = () => { setHistoryOpen(!historyOpen); if (!historyOpen) { setExplorerOpen(false); setConfigOpen(false); } };

  const currentModeLabel = useMemo(() => {
    if (isGizmoDragging) return `Transformando: ${transformMode.toUpperCase()}`;
    if (measureActive) return "Medición Láser";
    if (coteActive) return "Acotación Persistente";
    if (drawingMode === 'line') return "Dibujando Línea";
    if (drawingMode === 'circle') return "Dibujando Círculo";
    if (drawingMode === 'rectangle') return "Dibujando Rectángulo";
    if (selectionActive) return "Selección & Edición";
    return `Vista: ${activeViewLabel}`;
  }, [measureActive, coteActive, drawingMode, selectionActive, activeViewLabel, isGizmoDragging, transformMode]);

  const isAnyToolActive = useMemo(() => measureActive || coteActive || drawingMode !== 'none' || selectionActive || isGizmoDragging, [measureActive, coteActive, drawingMode, selectionActive, isGizmoDragging]);

  const activeMode = useMemo(() => {
    if (measureActive) return 'measure';
    if (coteActive) return 'cote';
    return drawingMode;
  }, [measureActive, coteActive, drawingMode]);

  return (
    <div className="w-full h-full bg-[#050505] relative overflow-hidden rounded-xl border border-white/5 shadow-inner group">
      <Canvas shadows dpr={[1, 2]}>
        {viewMode === '3D' ? (
          <PerspectiveCamera makeDefault position={[18, 12, 18]} fov={40} />
        ) : (
          <OrthographicCamera makeDefault position={[0, 50, 0]} zoom={40} />
        )}
        
        <Suspense fallback={null}>
          <Stage 
            intensity={lightIntensity} 
            environment="city" 
            adjustCamera={false} 
            shadows={showShadows ? { type: 'contact', opacity: 0.2, blur: 2 } : false}
          >
            <ArchitecturalStructure 
              wireframe={wireframe} 
              xray={xray} 
              selectable={selectionActive || explorerOpen}
              selectedIds={internalSelectedIds}
              hiddenIds={hiddenIds}
              onToggleSelect={handleToggleSelect}
              activeMode={activeMode}
              onInteractionPoint={handleInteractionPoint}
              onHoverPoint={setSnapPoint}
              onRefCreated={handleRefCreated}
            />
            {/* Transform Controls (Gizmo) */}
            {selectionActive && internalSelectedIds.length === 1 && meshRefs.current[internalSelectedIds[0]] && (
              <TransformControls 
                object={meshRefs.current[internalSelectedIds[0]]} 
                mode={transformMode}
                onMouseDown={() => setIsGizmoDragging(true)}
                onMouseUp={() => setIsGizmoDragging(false)}
              />
            )}

            {/* Active Snap Visual Indicator */}
            {activeMode !== 'none' && snapPoint && (
              <group position={snapPoint}>
                <Sphere args={[0.12, 16, 16]}>
                  <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={4} />
                </Sphere>
                <Ring args={[0.15, 0.2, 32]} rotation={[-Math.PI / 2, 0, 0]}>
                  <meshBasicMaterial color="#00f2ff" transparent opacity={0.5} />
                </Ring>
              </group>
            )}

            {activeMode !== 'none' && interactionPoints.length === 1 && (
              <Sphere position={interactionPoints[0]} args={[0.1, 16, 16]}>
                <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={2} />
              </Sphere>
            )}
            <PersistentDimensions dimensions={dimensions} />
            <DrawnShapes shapes={drawnShapes} />
          </Stage>
          {showGrid && <Grid renderOrder={-1} position={[0, -0.06, 0]} infiniteGrid cellSize={1} cellThickness={0.5} sectionSize={5} sectionThickness={1} sectionColor="#333333" fadeDistance={50} />}
          <Environment preset="night" />
        </Suspense>
        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          enableDamping 
          dampingFactor={0.05} 
          maxPolarAngle={viewMode === '3D' ? Math.PI / 2 : 0} 
          minPolarAngle={viewMode === '3D' ? 0 : 0}
          enableRotate={viewMode === '3D' && !isGizmoDragging}
          minDistance={5} 
          maxDistance={100} 
        />
      </Canvas>

      {/* Floating Status Indicator */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className={cn("h-2 w-2 rounded-full", isAnyToolActive ? "bg-primary animate-pulse" : "bg-emerald-500")} />
            <div className="flex flex-col">
              <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">{currentModeLabel}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Magnet className="h-2.5 w-2.5 text-emerald-500" />
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Snap-to-Vertex Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bottom Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-2xl pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <TooltipProvider>
          {/* View Config */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl transition-all", configOpen ? "bg-primary text-black" : "hover:bg-white/5 text-muted-foreground")} onClick={toggleConfig}><Settings className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[9px] font-black uppercase">Configuración Visual</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 bg-white/10" />

          {/* Preset Views Menu */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/5 text-muted-foreground transition-all">
                    <Compass className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[9px] font-black uppercase">Vistas Predefinidas</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="center" className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl p-1.5 rounded-xl w-48">
              <DropdownMenuLabel className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 py-1.5">Alzados / Fachadas</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setCameraView('north', 'Fachada Norte')} className="text-[10px] font-bold uppercase cursor-pointer py-2 focus:bg-primary/10">Fachada Norte</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCameraView('south', 'Fachada Sur')} className="text-[10px] font-bold uppercase cursor-pointer py-2 focus:bg-primary/10">Fachada Sur</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCameraView('east', 'Fachada Este')} className="text-[10px] font-bold uppercase cursor-pointer py-2 focus:bg-primary/10">Fachada Este</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCameraView('west', 'Fachada Oeste')} className="text-[10px] font-bold uppercase cursor-pointer py-2 focus:bg-primary/10">Fachada Oeste</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuLabel className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 py-1.5">Perspectivas</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setCameraView('top', 'Planta Técnica')} className="text-[10px] font-bold uppercase cursor-pointer py-2 focus:bg-primary/10 flex justify-between">Planta <MapIcon className="h-3 w-3 opacity-40" /></DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCameraView('iso', 'Perspectiva')} className="text-[10px] font-bold uppercase cursor-pointer py-2 focus:bg-primary/10 flex justify-between">Perspectiva <Navigation className="h-3 w-3 opacity-40 rotate-45" /></DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCameraView('axon', 'Axonométrica')} className="text-[10px] font-bold uppercase cursor-pointer py-2 focus:bg-primary/10 flex justify-between">Axonométrica <BoxSelect className="h-3 w-3 opacity-40" /></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-4 bg-white/10" />

          {/* Selection & Transform Tool */}
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-lg transition-all", selectionActive ? "bg-primary text-black" : "hover:bg-white/5 text-muted-foreground")} onClick={() => { setSelectionActive(!selectionActive); if (!selectionActive) { setMeasureActive(false); setCoteActive(false); setDrawingMode('none'); } }}><MousePointer2 className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[9px] font-black uppercase">Herramienta de Selección</TooltipContent>
            </Tooltip>
            
            {selectionActive && internalSelectedIds.length === 1 && (
              <>
                <Separator orientation="vertical" className="h-4 bg-white/10" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-lg transition-all", transformMode === 'translate' ? "bg-emerald-500 text-black" : "hover:bg-white/5 text-muted-foreground")} onClick={() => setTransformMode('translate')}><Move className="h-3.5 w-3.5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[9px] font-black uppercase">Mover Objeto</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-lg transition-all", transformMode === 'rotate' ? "bg-amber-500 text-black" : "hover:bg-white/5 text-muted-foreground")} onClick={() => setTransformMode('rotate')}><RotateCw className="h-3.5 w-3.5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[9px] font-black uppercase">Rotar Objeto</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-lg transition-all", transformMode === 'scale' ? "bg-blue-500 text-black" : "hover:bg-white/5 text-muted-foreground")} onClick={() => setTransformMode('scale')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[9px] font-black uppercase">Escalar Objeto</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          <Separator orientation="vertical" className="h-4 bg-white/10" />

          {/* Persistent Cote Tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl transition-all", coteActive ? "bg-[#00f2ff] text-black" : "hover:bg-white/5 text-muted-foreground")} onClick={() => { setCoteActive(!coteActive); if (!coteActive) { setSelectionActive(false); setMeasureActive(false); setDrawingMode('none'); } setInteractionPoints([]); }}><ArrowRightLeft className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[9px] font-black uppercase">Cotas Persistentes</TooltipContent>
          </Tooltip>

          {/* Laser Measure Tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl transition-all", measureActive ? "bg-primary text-black" : "hover:bg-white/5 text-muted-foreground")} onClick={() => { setMeasureActive(!measureActive); if (!measureActive) { setSelectionActive(false); setCoteActive(false); setDrawingMode('none'); } setInteractionPoints([]); }}><Ruler className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[9px] font-black uppercase">Medición Láser</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 bg-white/10" />

          {/* Drawing Tools */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl transition-all", drawingMode === 'line' ? "bg-primary text-black" : "hover:bg-white/5 text-muted-foreground")} onClick={() => { setDrawingMode(drawingMode === 'line' ? 'none' : 'line'); setMeasureActive(false); setCoteActive(false); setSelectionActive(false); setInteractionPoints([]); }}><Pencil className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[9px] font-black uppercase">Dibujar Línea</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl transition-all", drawingMode === 'circle' ? "bg-primary text-black" : "hover:bg-white/5 text-muted-foreground")} onClick={() => { setDrawingMode(drawingMode === 'circle' ? 'none' : 'circle'); setMeasureActive(false); setCoteActive(false); setSelectionActive(false); setInteractionPoints([]); }}><CircleIcon className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[9px] font-black uppercase">Dibujar Círculo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl transition-all", drawingMode === 'rectangle' ? "bg-primary text-black" : "hover:bg-white/5 text-muted-foreground")} onClick={() => { setDrawingMode(drawingMode === 'rectangle' ? 'none' : 'rectangle'); setMeasureActive(false); setCoteActive(false); setSelectionActive(false); setInteractionPoints([]); }}><Square className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[9px] font-black uppercase">Dibujar Rectángulo</TooltipContent>
          </Tooltip>

          {(drawnShapes.length > 0 || dimensions.length > 0) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-500/10" onClick={clearTools}><Eraser className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[9px] font-black uppercase">Limpiar Anotaciones</TooltipContent>
            </Tooltip>
          )}

          <Separator orientation="vertical" className="h-4 bg-white/10" />

          {/* Objects & Toggles */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl transition-all", explorerOpen ? "bg-primary text-black" : "hover:bg-white/5 text-muted-foreground")} onClick={toggleExplorer}><Search className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[9px] font-black uppercase">Explorador de Objetos</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl transition-all", xray ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-muted-foreground")} onClick={() => setXray(!xray)}><Zap className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[9px] font-black uppercase">Modo Rayos X</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl transition-all", wireframe ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-muted-foreground")} onClick={() => setWireframe(!wireframe)}><Layers className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[9px] font-black uppercase">Modo Alámbrico</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 bg-white/10" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl transition-all", historyOpen ? "bg-amber-500 text-black" : "hover:bg-white/5 text-muted-foreground")} onClick={toggleHistory}><History className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[9px] font-black uppercase">Cambios Recientes</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Panels (Left/Right) */}
      {explorerOpen && (
        <div className="absolute top-4 right-4 bottom-4 w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col z-20 animate-in slide-in-from-right-4 duration-300 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
            <div className="flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /><h3 className="text-[10px] font-black uppercase tracking-widest">Explorador de Objetos</h3></div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExplorerOpen(false)}><X className="h-4 w-4" /></Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {BIM_OBJECTS.map((obj) => (
                <div key={obj.id} className="group flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all cursor-pointer" onClick={() => handleToggleSelect(obj.id, { name: obj.name, value: obj.value })}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", internalSelectedIds.includes(obj.id) ? "bg-emerald-500" : "bg-white/20")} />
                    <div className="flex flex-col overflow-hidden"><span className="text-[10px] font-black uppercase truncate tracking-tight">{obj.name}</span><span className="text-[8px] font-bold opacity-40">{obj.type}</span></div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleToggleVisibility(obj.id); }}>{hiddenIds.includes(obj.id) ? <EyeOff className="h-3.5 w-3.5 text-white/20" /> : <Eye className="h-3.5 w-3.5 text-primary" />}</Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {configOpen && (
        <div className="absolute top-4 left-4 bottom-4 w-72 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col z-20 animate-in slide-in-from-left-4 duration-300 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
            <div className="flex items-center gap-2 text-primary"><Settings className="h-4 w-4" /><h3 className="text-[10px] font-black uppercase tracking-widest">Configuración</h3></div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setConfigOpen(false)}><X className="h-4 w-4" /></Button>
          </div>
          <ScrollArea className="flex-1 p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Sun className="h-3.5 w-3.5 text-muted-foreground" /><Label className="text-[10px] font-bold uppercase">Luminosidad</Label></div><span className="text-[10px] font-mono text-primary font-black">{Math.round(lightIntensity * 100)}%</span></div>
              <Slider value={[lightIntensity * 100]} onValueChange={([val]) => setLightIntensity(val / 100)} max={200} step={1} />
            </div>
            <Separator className="bg-white/5" />
            <div className="space-y-4">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Grid3X3 className="h-3.5 w-3.5 text-muted-foreground" /><Label className="text-[10px] font-bold uppercase">Grilla Global</Label></div><Switch checked={showGrid} onCheckedChange={setShowGrid} /></div>
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Box className="h-3.5 w-3.5 text-muted-foreground" /><Label className="text-[10px] font-bold uppercase">Sombras</Label></div><Switch checked={showShadows} onCheckedChange={setShowShadows} /></div>
            </div>
          </ScrollArea>
        </div>
      )}

      {historyOpen && (
        <div className="absolute top-4 right-4 bottom-4 w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col z-20 animate-in slide-in-from-right-4 duration-300 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
            <div className="flex items-center gap-2 text-amber-500"><History className="h-4 w-4" /><h3 className="text-[10px] font-black uppercase tracking-widest">Cambios Recientes</h3></div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setHistoryOpen(false)}><X className="h-4 w-4" /></Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6 relative pl-4">
              <div className="absolute left-[11px] top-4 bottom-4 w-px bg-white/5" />
              {BIM_HISTORY.map((entry) => (
                <div key={entry.id} className="relative pl-8 space-y-2 group cursor-default">
                  <div className="absolute left-0 top-1 h-6 w-6 rounded-full border-2 border-[#050505] bg-white/5 flex items-center justify-center z-10 group-hover:bg-amber-500 transition-colors"><Clock className="h-3 w-3 text-muted-foreground group-hover:text-black" /></div>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-mono text-muted-foreground/60 uppercase">{entry.date}</span>
                      <Badge variant="outline" className="text-[7px] font-mono border-white/10 h-3.5">{entry.hash}</Badge>
                    </div>
                    <p className="text-[10px] font-black text-white uppercase leading-tight">{entry.action}</p>
                    <div className="flex items-center gap-1.5 mt-2 opacity-40"><UserCircle className="h-2.5 w-2.5" /><span className="text-[8px] font-black uppercase tracking-widest">{entry.user}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-10 pointer-events-none opacity-40">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground font-mono">Axis: X-Y-Z Global System</p>
      </div>
    </div>
  );
}
