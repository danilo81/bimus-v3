"use client"
import React, { Suspense, useEffect, useState, useRef, useMemo } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid, GizmoHelper, GizmoViewport, TransformControls, OrthographicCamera, PerspectiveCamera, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { BuildingModel } from './BuildingModel';
import { GripController } from './GripController';
import dynamic from 'next/dynamic';
const PaperDrawingLayer = dynamic(() => import('./PaperDrawingLayer').then(mod => mod.PaperDrawingLayer), { ssr: false });
import { BimElement, WallType, LineType, ScaleSettings, ArcConfig } from '@/types/types';
import { getSnappedPoint } from '@/lib/snapUtils';
import { ifcLoader } from '@/lib/ifc';

interface BimViewerProps {
  elements: BimElement[];
  ifcModels?: THREE.Object3D[];
  selectedIds: string[];
  onSelect: (id: string | null, multi?: boolean) => void;
  onSelectMultiple?: (ids: string[]) => void;
  onUpdateElement: (id: string, updates: Partial<BimElement>) => void;
  wireframe: boolean;
  transformMode: 'translate' | 'rotate' | 'scale' | null;
  activeTool?: string | null;
  setActiveTool?: (tool: string | null) => void;
  onAddLine?: (start: [number, number, number], end: [number, number, number]) => void;
  lineConfig?: {
    color: string;
    opacity: number;
    type: string;
    bimClass: string;
  };
  onAddRectangle?: (position: [number, number, number], args: [number, number, number], rotation: [number, number, number], config: any) => void;
  rectangleConfig?: {
    fillColor: string;
    lineColor: string;
    opacity: number;
    lineType: string;
    creationMode: 'corner' | 'center' | 'edgeCenter' | 'threePoints';
    bimClass: string;
  };
  onAddArc?: (points: [number, number, number][], config: any) => void;
  arcConfig?: ArcConfig;
  activeLevel?: string;
  onAddWall?: (points: [number, number, number][], config: any) => void;
  onAddPolyline?: (points: [number, number, number][]) => void;
  onAddSlab?: (points: [number, number, number][], thickness: number, elevation: number) => void;
  wallConfig?: any;
  activeSlabTypeId?: string | null;
  slabTypes?: any[];
  snapConfig?: any;
  wallTypes?: WallType[];
  lineTypes?: LineType[];
  editingGroupId?: string | null;
  onExitGroupEdit?: () => void;
  showOutsideGroup?: boolean;
  viewMode: '2D' | '3D';
  setViewMode: (mode: '2D' | '3D') => void;
  selectionMode: 'single' | 'rectangle' | 'lasso' | 'similar' | 'visibility';
  modelConfig: {
    showGrid: boolean;
    showShadows: boolean;
    backgroundColor: string;
    gridSize: number;
    gridSpacing: number;
    gridFullCanvas: boolean;
  };
  onContextMenu?: (x: number, y: number) => void;
  scaleSettings: ScaleSettings;
  saveViewTrigger?: number;
  onSaveView?: (position: [number, number, number], target: [number, number, number]) => void;
  restoreView?: { position: [number, number, number], target: [number, number, number] } | null;
  clippingPlaneActive?: boolean;
  clippingPlaneHeight?: number;
  setClippingPlaneHeight?: (height: number) => void;
  mappedElements?: { elementId: string; projectItemId: string; quantity: number }[];
  activeAssignmentTarget?: string | null;
}


function DrawingPlane({ activeTool, onAddLine, setActiveTool, lineConfig, onAddRectangle, rectangleConfig, onAddArc, arcConfig, activeLevel, onAddWall, onAddPolyline, onAddSlab, wallConfig, snapConfig, elements, lineTypes, gridSpacing, scaleSettings, activeSlabTypeId, slabTypes }: { activeTool?: string | null, onAddLine?: (start: [number, number, number], end: [number, number, number]) => void, setActiveTool?: (tool: string | null) => void, lineConfig?: any, onAddRectangle?: (position: [number, number, number], args: [number, number, number], rotation: [number, number, number], config: any) => void, rectangleConfig?: any, onAddArc?: (points: [number, number, number][], config: any) => void, arcConfig?: ArcConfig, activeLevel?: string, onAddWall?: (points: [number, number, number][], config: any) => void, onAddPolyline?: (points: [number, number, number][]) => void, onAddSlab?: (points: [number, number, number][], thickness: number, elevation: number) => void, wallConfig?: any, snapConfig?: any, elements?: BimElement[], lineTypes?: LineType[], gridSpacing?: number, scaleSettings: ScaleSettings, activeSlabTypeId?: string | null, slabTypes?: any[] }) {
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
  const [secondPoint, setSecondPoint] = useState<THREE.Vector3 | null>(null);
  const [currentPoint, setCurrentPoint] = useState<THREE.Vector3 | null>(null);
  const [wallPoints, setWallPoints] = useState<THREE.Vector3[]>([]);
  const [polylinePoints, setPolylinePoints] = useState<THREE.Vector3[]>([]);
  const [slabPoints, setSlabPoints] = useState<THREE.Vector3[]>([]);
  const [arcPoints, setArcPoints] = useState<THREE.Vector3[]>([]);
  const polylinePointsRef = useRef<THREE.Vector3[]>([]);
  const slabPointsRef = useRef<THREE.Vector3[]>([]);
  const [snapType, setSnapType] = useState<string | null>(null);

  useEffect(() => {
    polylinePointsRef.current = polylinePoints;
  }, [polylinePoints]);

  useEffect(() => {
    slabPointsRef.current = slabPoints;
  }, [slabPoints]);

  // Determine plane Y position based on active level
  const planeY = activeLevel === 'L00' ? 0 : activeLevel === 'L01' ? 4.2 : activeLevel === 'L02' ? 8.4 : activeLevel === 'Roof' ? 12.6 : 0;

  if (activeTool !== 'line' && activeTool !== 'wall' && activeTool !== 'rectangle' && activeTool !== 'polyline' && activeTool !== 'arc' && activeTool !== 'slab') {
    if (startPoint) setStartPoint(null);
    if (secondPoint) setSecondPoint(null);
    if (wallPoints.length > 0) setWallPoints([]);
    if (polylinePoints.length > 0) setPolylinePoints([]);
    if (slabPoints.length > 0) setSlabPoints([]);
    if (arcPoints.length > 0) setArcPoints([]);
    if (snapType) setSnapType(null);
    return null;
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    const { point, type } = getSnappedPoint(e.point.clone(), elements, snapConfig, planeY, gridSpacing);
    setCurrentPoint(point);
    setSnapType(type);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const { point } = getSnappedPoint(e.point.clone(), elements, snapConfig, planeY, gridSpacing);

    if (activeTool === 'line') {
      if (!startPoint) {
        setStartPoint(point);
      } else {
        if (onAddLine && setActiveTool) {
          onAddLine(
            [startPoint.x, startPoint.y, startPoint.z],
            [point.x, point.y, point.z]
          );
          setStartPoint(null);
          setCurrentPoint(null);
          setSnapType(null);
          setActiveTool(null);
        }
      }
    } else if (activeTool === 'wall') {
      setWallPoints([...wallPoints, point]);
    } else if (activeTool === 'polyline') {
      const currentPoints = polylinePointsRef.current;
      // Check proximity to first point
      if (currentPoints.length >= 2) {
        const firstPoint = currentPoints[0];
        const distance = firstPoint.distanceTo(point);
        if (distance < 0.5) { // Threshold
          // Close and finalize
          if (onAddPolyline) onAddPolyline([...currentPoints, firstPoint].map(p => [p.x, p.y, p.z]));
          setPolylinePoints([]);
          polylinePointsRef.current = [];
          setCurrentPoint(null);
          setSnapType(null);
          if (setActiveTool) setActiveTool(null);
          return;
        }
      }
      const newPoints = [...currentPoints, point];
      setPolylinePoints(newPoints);
      polylinePointsRef.current = newPoints;
    } else if (activeTool === 'slab') {
      const currentPoints = slabPointsRef.current;
      // Check proximity to first point
      if (currentPoints.length >= 2) {
        const firstPoint = currentPoints[0];
        const distance = firstPoint.distanceTo(point);
        if (distance < 0.5) { // Threshold
          // Close and finalize
          if (onAddSlab && setActiveTool) {
            let thickness = 0.15;
            let elevation = planeY;
            if (activeSlabTypeId && slabTypes) {
              const slabType = slabTypes.find(st => st.id === activeSlabTypeId);
              if (slabType) {
                thickness = slabType.totalThickness;
                if (slabType.datum === 'bottom') {
                  elevation = planeY + thickness;
                }
              }
            }
            onAddSlab([...currentPoints, firstPoint].map(p => [p.x, p.y, p.z]), thickness, elevation);
          }
          setSlabPoints([]);
          slabPointsRef.current = [];
          setCurrentPoint(null);
          setSnapType(null);
          if (setActiveTool) setActiveTool(null);
          return;
        }
      }
      const newPoints = [...currentPoints, point];
      setSlabPoints(newPoints);
      slabPointsRef.current = newPoints;
    } else if (activeTool === 'arc') {
      const newPoints = [...arcPoints, point];
      setArcPoints(newPoints);
      if (newPoints.length === 3) {
        if (onAddArc && setActiveTool) {
          onAddArc(
            newPoints.map(p => [p.x, p.y, p.z]),
            arcConfig
          );
          setArcPoints([]);
          setCurrentPoint(null);
          setSnapType(null);
          setActiveTool(null);
        }
      }
    } else if (activeTool === 'rectangle') {
      const mode = rectangleConfig?.creationMode || 'corner';

      if (mode === 'threePoints') {
        if (!startPoint) {
          setStartPoint(point);
        } else if (!secondPoint) {
          setSecondPoint(point);
        } else {
          // Calculate rectangle from 3 points
          const p1 = startPoint;
          const p2 = secondPoint;
          const p3 = point;

          const lengthVec = new THREE.Vector3().subVectors(p2, p1);
          const length = lengthVec.length();
          const angle = Math.atan2(lengthVec.z, lengthVec.x);

          const dir = lengthVec.clone().normalize();
          const perp = new THREE.Vector3(-dir.z, 0, dir.x);

          const widthVec = new THREE.Vector3().subVectors(p3, p1);
          const width = widthVec.dot(perp);

          const center = p1.clone().add(dir.multiplyScalar(length / 2)).add(perp.normalize().multiplyScalar(width / 2));

          if (onAddRectangle && setActiveTool) {
            onAddRectangle(
              [center.x, center.y, center.z],
              [length, width, 0.01],
              [0, -angle, 0],
              rectangleConfig
            );
            setStartPoint(null);
            setSecondPoint(null);
            setCurrentPoint(null);
            setSnapType(null);
            setActiveTool(null);
          }
        }
      } else {
        // 2-point modes
        if (!startPoint) {
          setStartPoint(point);
        } else {
          let center = new THREE.Vector3();
          let width = 0;
          let height = 0;
          let angle = 0;

          if (mode === 'corner') {
            center = new THREE.Vector3().addVectors(startPoint, point).multiplyScalar(0.5);
            width = Math.abs(point.x - startPoint.x);
            height = Math.abs(point.z - startPoint.z);
          } else if (mode === 'center') {
            center = startPoint.clone();
            width = Math.abs(point.x - startPoint.x) * 2;
            height = Math.abs(point.z - startPoint.z) * 2;
          } else if (mode === 'edgeCenter') {
            // First point is edge center, second is corner
            // Assume the edge is parallel to X or Z for simplicity, or calculate based on the vector
            const dx = point.x - startPoint.x;
            const dz = point.z - startPoint.z;

            if (Math.abs(dx) > Math.abs(dz)) {
              // Edge center is on a vertical edge (parallel to Z)
              width = Math.abs(dx);
              height = Math.abs(dz) * 2;
              center = new THREE.Vector3(startPoint.x + dx / 2, startPoint.y, startPoint.z);
            } else {
              // Edge center is on a horizontal edge (parallel to X)
              width = Math.abs(dx) * 2;
              height = Math.abs(dz);
              center = new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z + dz / 2);
            }
          }

          if (onAddRectangle && setActiveTool) {
            onAddRectangle(
              [center.x, center.y, center.z],
              [width, height, 0.01],
              [0, 0, 0],
              rectangleConfig
            );
            setStartPoint(null);
            setCurrentPoint(null);
            setSnapType(null);
            setActiveTool(null);
          }
        }
      }
    }
  };

  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (activeTool === 'wall' && wallPoints.length > 0) {
      if (onAddWall && setActiveTool) {
        const { point } = getSnappedPoint(e.point.clone(), elements, snapConfig, planeY, gridSpacing);
        // Add the final point on double click
        const finalPoints = [...wallPoints, point];
        onAddWall(
          finalPoints.map(p => [p.x, p.y, p.z]),
          wallConfig
        );
        setWallPoints([]);
        setCurrentPoint(null);
        setSnapType(null);
        setActiveTool(null);
      }
    } else if (activeTool === 'polyline' && polylinePointsRef.current.length > 0) {
      if (onAddPolyline && setActiveTool) {
        const { point } = getSnappedPoint(e.point.clone(), elements, snapConfig, planeY, gridSpacing);

        // Reemplazar el último punto añadido por handleClick con el punto del doble clic
        let lastPoints = polylinePointsRef.current;
        if (polylinePointsRef.current.length > 1) {
          lastPoints = polylinePointsRef.current.slice(0, -1);
        }
        const finalPoints = [...lastPoints, point];

        // Cerrar el perímetro si no está cerrado
        const closedPoints = [...polylinePointsRef.current, polylinePointsRef.current[0]];

        onAddPolyline(closedPoints.map(p => [p.x, p.y, p.z]));
        setPolylinePoints([]);
        polylinePointsRef.current = [];
        setCurrentPoint(null);
        setSnapType(null);
        setActiveTool(null);
      }
    } else if (activeTool === 'slab' && slabPointsRef.current.length > 0) {
      if (onAddSlab && setActiveTool) {
        let thickness = 0.15;
        let elevation = planeY;
        if (activeSlabTypeId && slabTypes) {
          const slabType = slabTypes.find(st => st.id === activeSlabTypeId);
          if (slabType) {
            thickness = slabType.totalThickness;
            if (slabType.datum === 'bottom') {
              elevation = planeY + thickness;
            }
          }
        }

        // Cerrar el perímetro
        const closedPoints = [...slabPointsRef.current, slabPointsRef.current[0]];

        onAddSlab(closedPoints.map(p => [p.x, p.y, p.z]), thickness, elevation);
        setSlabPoints([]);
        slabPointsRef.current = [];
        setCurrentPoint(null);
        setSnapType(null);
        setActiveTool(null);
      }
    }
  };

  let distance = 0;
  let angle = 0;
  const precision = scaleSettings?.precision ?? 2;

  // For line tool
  if (activeTool === 'line' && startPoint && currentPoint) {
    distance = startPoint.distanceTo(currentPoint);
    const dx = currentPoint.x - startPoint.x;
    const dz = currentPoint.z - startPoint.z;
    angle = Math.atan2(dz, dx) * (0 / Math.PI);
    if (angle < 0) angle += 360;
  }

  // For wall tool
  if (activeTool === 'wall' && wallPoints.length > 0 && currentPoint) {
    const lastPoint = wallPoints[wallPoints.length - 1];
    distance = lastPoint.distanceTo(currentPoint);
    const dx = currentPoint.x - lastPoint.x;
    const dz = currentPoint.z - lastPoint.z;
    angle = Math.atan2(dz, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
  }

  // For rectangle tool
  let rectPreview: { center: THREE.Vector3, size: [number, number], rotation: number } | null = null;
  if (activeTool === 'rectangle' && startPoint && currentPoint) {
    const mode = rectangleConfig?.creationMode || 'corner';
    if (mode === 'corner') {
      const center = new THREE.Vector3().addVectors(startPoint, currentPoint).multiplyScalar(0.5);
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.z - startPoint.z);
      rectPreview = { center, size: [width, height], rotation: 0 };
    } else if (mode === 'center') {
      const width = Math.abs(currentPoint.x - startPoint.x) * 2;
      const height = Math.abs(currentPoint.z - startPoint.z) * 2;
      rectPreview = { center: startPoint, size: [width, height], rotation: 0 };
    } else if (mode === 'edgeCenter') {
      const dx = currentPoint.x - startPoint.x;
      const dz = currentPoint.z - startPoint.z;
      let width = 0, height = 0, center = new THREE.Vector3();
      if (Math.abs(dx) > Math.abs(dz)) {
        width = Math.abs(dx);
        height = Math.abs(dz) * 2;
        center = new THREE.Vector3(startPoint.x + dx / 2, startPoint.y, startPoint.z);
      } else {
        width = Math.abs(dx) * 2;
        height = Math.abs(dz);
        center = new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z + dz / 2);
      }
      rectPreview = { center, size: [width, height], rotation: 0 };
    } else if (mode === 'threePoints') {
      if (secondPoint) {
        const p1 = startPoint;
        const p2 = secondPoint;
        const p3 = currentPoint;
        const lengthVec = new THREE.Vector3().subVectors(p2, p1);
        const length = lengthVec.length();
        const angle = Math.atan2(lengthVec.z, lengthVec.x);
        const dir = lengthVec.clone().normalize();
        const perp = new THREE.Vector3(-dir.z, 0, dir.x);
        const widthVec = new THREE.Vector3().subVectors(p3, p1);
        const width = widthVec.dot(perp);
        const center = p1.clone().add(dir.multiplyScalar(length / 2)).add(perp.normalize().multiplyScalar(width / 2));
        rectPreview = { center, size: [length, width], rotation: -angle };
      } else {
        // Just show a line for the first segment
        distance = startPoint.distanceTo(currentPoint);
        const dx = currentPoint.x - startPoint.x;
        const dz = currentPoint.z - startPoint.z;
        angle = Math.atan2(dz, dx) * (180 / Math.PI);
        if (angle < 0) angle += 360;
      }
    }
  }

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, planeY, 0]}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Snap Indicator */}
      {snapType && currentPoint && (
        <group position={currentPoint}>
          {snapType === 'vertex' && (
            <mesh>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshBasicMaterial color="#a855f7" wireframe depthTest={false} />
            </mesh>
          )}
          {snapType === 'edgeCenter' && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.15, 3]} />
              <meshBasicMaterial color="#3b82f6" wireframe depthTest={false} />
            </mesh>
          )}
          {snapType === 'edge' && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.1, 0.15, 4]} />
              <meshBasicMaterial color="#10b981" wireframe depthTest={false} />
            </mesh>
          )}
          {snapType === 'grid' && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.1, 16]} />
              <meshBasicMaterial color="#f59e0b" wireframe depthTest={false} />
            </mesh>
          )}
          <Html position={[0, 0, 0]} center style={{ pointerEvents: 'none', transform: 'translate3d(15px, 15px, 0)' }}>
            <div className="bg-zinc-900/90 text-[10px] text-white px-1.5 py-0.5 rounded shadow-lg border border-zinc-700 capitalize whitespace-nowrap">
              {snapType === 'edgeCenter' ? 'Midpoint' : snapType}
            </div>
          </Html>
        </group>
      )}

      {/* Line Tool Preview */}
      {activeTool === 'line' && startPoint && currentPoint && (() => {
        let isDashed = false;
        let dashSize = 0.5;
        let gapSize = 0.2;
        let lineWidth = 2;

        if (lineConfig?.type === 'Dashed') {
          isDashed = true;
        } else if (lineConfig?.type === 'Dotted') {
          isDashed = true;
          dashSize = 0.1;
        } else if (lineConfig?.type !== 'Solid') {
          const customType = lineTypes?.find(t => t.id === lineConfig?.type);
          if (customType) {
            lineWidth = customType.thickness;
            if (customType.segmentation && customType.segmentation.length > 0) {
              isDashed = true;
              dashSize = customType.segmentation[0] || 0.5;
              gapSize = customType.segmentation.length > 1 ? customType.segmentation[1] : dashSize;
            }
          }
        }

        return (
          <group>
            <Line
              points={[startPoint, currentPoint]}
              color={lineConfig?.color || "#3b82f6"}
              lineWidth={lineWidth}
              transparent={lineConfig?.opacity < 100}
              opacity={lineConfig?.opacity ? lineConfig.opacity / 100 : 1}
              dashed={isDashed}
              dashSize={dashSize}
              gapSize={gapSize}
            />
            {/* Horizontal reference line */}
            <Line
              points={[startPoint, new THREE.Vector3(startPoint.x + distance, startPoint.y, startPoint.z)]}
              color="#9ca3af"
              lineWidth={1}
              dashed
              dashSize={0.5}
              gapSize={0.5}
            />
            <Html position={currentPoint} center style={{ pointerEvents: 'none', transform: 'translate3d(15px, -15px, 0)' }}>
              <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700 text-zinc-300 px-2.5 py-2 rounded shadow-xl flex flex-col gap-1.5 font-mono text-[11px] select-none min-w-[120px]">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-zinc-500 font-medium">Distance</span>
                  <span className="text-indigo-400 font-semibold">{distance.toFixed(precision)}m</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-zinc-500 font-medium">Angle</span>
                  <span className="text-indigo-400 font-semibold">{angle.toFixed(1)}°</span>
                </div>
                <div className="w-full h-px bg-zinc-800 my-0.5"></div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-zinc-500 font-medium">ΔX</span>
                  <span className="text-zinc-400">{Math.abs(currentPoint.x - startPoint.x).toFixed(precision)}m</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-zinc-500 font-medium">ΔY</span>
                  <span className="text-zinc-400">{Math.abs(currentPoint.z - startPoint.z).toFixed(precision)}m</span>
                </div>
              </div>
            </Html>
          </group>
        );
      })()}

      {/* Rectangle Tool Preview */}
      {activeTool === 'rectangle' && startPoint && currentPoint && (
        <group>
          {rectPreview ? (
            <mesh position={rectPreview.center} rotation={[0, rectPreview.rotation, 0]}>
              <boxGeometry args={[rectPreview.size[0], 0.01, rectPreview.size[1]]} />
              <meshBasicMaterial
                color={rectangleConfig?.fillColor || "#3b82f6"}
                transparent
                opacity={(rectangleConfig?.opacity || 50) / 100}
              />
              <Line
                points={[
                  new THREE.Vector3(-rectPreview.size[0] / 2, 0, -rectPreview.size[1] / 2),
                  new THREE.Vector3(rectPreview.size[0] / 2, 0, -rectPreview.size[1] / 2),
                  new THREE.Vector3(rectPreview.size[0] / 2, 0, rectPreview.size[1] / 2),
                  new THREE.Vector3(-rectPreview.size[0] / 2, 0, rectPreview.size[1] / 2),
                  new THREE.Vector3(-rectPreview.size[0] / 2, 0, -rectPreview.size[1] / 2),
                ]}
                color={rectangleConfig?.lineColor || "#ffffff"}
                lineWidth={2}
                dashed={rectangleConfig?.lineType === 'Dashed' || rectangleConfig?.lineType === 'Dotted'}
                dashSize={rectangleConfig?.lineType === 'Dotted' ? 0.1 : 0.5}
                gapSize={rectangleConfig?.lineType === 'Dotted' ? 0.2 : 0.2}
              />
            </mesh>
          ) : (
            /* First segment for 3-point mode */
            <group>
              <Line
                points={[startPoint, currentPoint]}
                color={rectangleConfig?.lineColor || "#ffffff"}
                lineWidth={2}
                dashed
              />
              <Html position={currentPoint} center style={{ pointerEvents: 'none', transform: 'translate3d(15px, -15px, 0)' }}>
                <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700 text-zinc-300 px-2.5 py-2 rounded shadow-xl flex flex-col gap-1.5 font-mono text-[11px] select-none min-w-[120px]">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-zinc-500 font-medium">Length</span>
                    <span className="text-indigo-400 font-semibold">{distance.toFixed(precision)}m</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-zinc-500 font-medium">Angle</span>
                    <span className="text-indigo-400 font-semibold">{angle.toFixed(1)}°</span>
                  </div>
                </div>
              </Html>
            </group>
          )}
        </group>
      )}

      {/* Polyline Tool Preview */}
      {activeTool === 'polyline' && polylinePoints.length > 0 && (
        <group>
          {/* Draw confirmed polyline segments */}
          {polylinePoints.length > 1 && (
            <Line
              points={polylinePoints}
              color="#3b82f6"
              lineWidth={2}
            />
          )}

          {/* Draw current drawing segment */}
          {currentPoint && (
            <group>
              <Line
                points={[polylinePoints[polylinePoints.length - 1], currentPoint]}
                color="#3b82f6"
                lineWidth={2}
                dashed
                dashSize={0.5}
                gapSize={0.5}
              />
              <Html position={currentPoint} center style={{ pointerEvents: 'none', transform: 'translate3d(15px, -15px, 0)' }}>
                <div className="bg-zinc-900/95 backdrop-blur-md border border-blue-500/50 text-zinc-300 px-2.5 py-2 rounded shadow-xl flex flex-col gap-1.5 font-mono text-[11px] select-none min-w-[120px]">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-zinc-500 font-medium">Length</span>
                    <span className="text-blue-400 font-semibold">{polylinePoints[polylinePoints.length - 1].distanceTo(currentPoint).toFixed(precision)}m</span>
                  </div>
                  <div className="w-full h-px bg-zinc-800 my-0.5"></div>
                  <div className="text-center text-zinc-500 text-[9px] mt-1">Double-click to finish</div>
                </div>
              </Html>
            </group>
          )}
        </group>
      )}

      {/* Slab Tool Preview */}
      {activeTool === 'slab' && slabPoints.length > 0 && (
        <group>
          {/* Draw confirmed slab segments */}
          {slabPoints.length > 1 && (
            <Line
              points={slabPoints}
              color="#10b981"
              lineWidth={2}
            />
          )}

          {/* Draw current drawing segment */}
          {currentPoint && (
            <group>
              <Line
                points={[slabPoints[slabPoints.length - 1], currentPoint]}
                color="#10b981"
                lineWidth={2}
                dashed
                dashSize={0.5}
                gapSize={0.5}
              />
              <Html position={currentPoint} center style={{ pointerEvents: 'none', transform: 'translate3d(15px, -15px, 0)' }}>
                <div className="bg-zinc-900/95 backdrop-blur-md border border-emerald-500/50 text-zinc-300 px-2.5 py-2 rounded shadow-xl flex flex-col gap-1.5 font-mono text-[11px] select-none min-w-[120px]">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-zinc-500 font-medium">Length</span>
                    <span className="text-emerald-400 font-semibold">{slabPoints[slabPoints.length - 1].distanceTo(currentPoint).toFixed(precision)}m</span>
                  </div>
                  <div className="w-full h-px bg-zinc-800 my-0.5"></div>
                  <div className="text-center text-zinc-500 text-[9px] mt-1">Click first point or Double-click to finish</div>
                </div>
              </Html>
            </group>
          )}
        </group>
      )}

      {/* Wall Tool Preview */}
      {activeTool === 'wall' && wallPoints.length > 0 && (
        <group>
          {/* Draw confirmed wall segments */}
          {wallPoints.length > 1 && (
            <Line
              points={wallPoints}
              color="#a855f7"
              lineWidth={3}
            />
          )}

          {/* Draw current drawing segment */}
          {currentPoint && (
            <group>
              <Line
                points={[wallPoints[wallPoints.length - 1], currentPoint]}
                color="#a855f7"
                lineWidth={3}
                dashed
                dashSize={0.5}
                gapSize={0.5}
              />
              <Html position={currentPoint} center style={{ pointerEvents: 'none', transform: 'translate3d(15px, -15px, 0)' }}>
                <div className="bg-zinc-900/95 backdrop-blur-md border border-purple-500/50 text-zinc-300 px-2.5 py-2 rounded shadow-xl flex flex-col gap-1.5 font-mono text-[11px] select-none min-w-[120px]">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-zinc-500 font-medium">Length</span>
                    <span className="text-purple-400 font-semibold">{distance.toFixed(precision)}m</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-zinc-500 font-medium">Angle</span>
                    <span className="text-purple-400 font-semibold">{angle.toFixed(1)}°</span>
                  </div>
                  <div className="w-full h-px bg-zinc-800 my-0.5"></div>
                  <div className="text-center text-zinc-500 text-[9px] mt-1">Double-click to finish</div>
                </div>
              </Html>
            </group>
          )}
        </group>
      )}

      {/* Arc Tool Preview */}
      {activeTool === 'arc' && arcPoints.length > 0 && (
        <group>
          {/* Draw confirmed arc segments */}
          {arcPoints.length > 0 && (
            <group>
              {arcPoints.map((p, i) => (
                <mesh key={i} position={p}>
                  <sphereGeometry args={[0.1, 8, 8]} />
                  <meshBasicMaterial color="#ef4444" />
                </mesh>
              ))}
              {arcPoints.length > 1 && (
                <Line
                  points={arcPoints}
                  color="#ef4444"
                  lineWidth={2}
                  dashed
                />
              )}
            </group>
          )}

          {/* Draw current drawing segment */}
          {currentPoint && (
            <group>
              <Line
                points={[arcPoints[arcPoints.length - 1], currentPoint]}
                color="#ef4444"
                lineWidth={2}
                dashed
                dashSize={0.5}
                gapSize={0.5}
              />
            </group>
          )}
        </group>
      )}
    </group>
  );
}

function TransformManager({
  selectedElement,
  transformMode,
  onUpdateElement,
  controlsRef,
  editingGroupId
}: {
  selectedElement: BimElement | null,
  transformMode: 'translate' | 'rotate' | 'scale' | null,
  onUpdateElement: (id: string, updates: Partial<BimElement>) => void,
  controlsRef: React.RefObject<OrbitControlsImpl | null>,
  editingGroupId: string | null | undefined
}) {
  const { scene } = useThree();

  if (!selectedElement || !transformMode) return null;

  const obj = scene.getObjectByName(selectedElement.id);
  if (!obj) return null;

  return (
    <TransformControls
      object={obj}
      mode={transformMode}
      onMouseDown={() => {
        if (controlsRef.current) controlsRef.current.enabled = false;
      }}
      onMouseUp={() => {
        if (controlsRef.current) controlsRef.current.enabled = true;
        onUpdateElement(selectedElement.id, {
          geometry: {
            ...selectedElement.geometry,
            position: [obj.position.x, obj.position.y, obj.position.z],
            rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
            scale: [obj.scale.x, obj.scale.y, obj.scale.z],
          }
        });
      }}
      enabled={(!editingGroupId || selectedElement.groupId === editingGroupId) && !selectedElement.locked}
    />
  );
}

function SelectionManager({
  selectionMode,
  elements,
  onSelectMultiple,
  controlsRef
}: {
  selectionMode: 'single' | 'rectangle' | 'lasso' | 'similar' | 'visibility',
  elements: BimElement[],
  onSelectMultiple?: (ids: string[]) => void,
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}) {
  const { camera, gl, scene, size } = useThree();
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<THREE.Vector2 | null>(null);
  const [currentPos, setCurrentPos] = useState<THREE.Vector2 | null>(null);
  const [lassoPoints, setLassoPoints] = useState<THREE.Vector2[]>([]);

  useEffect(() => {
    if (selectionMode === 'single' || selectionMode === 'similar' || selectionMode === 'visibility') return;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const rect = gl.domElement.getBoundingClientRect();
      const pos = new THREE.Vector2(e.clientX - rect.left, e.clientY - rect.top);
      setIsSelecting(true);
      setStartPos(pos);
      setCurrentPos(pos);
      if (selectionMode === 'lasso') {
        setLassoPoints([pos]);
      }
      if (controlsRef.current) controlsRef.current.enabled = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isSelecting) return;
      const rect = gl.domElement.getBoundingClientRect();
      const pos = new THREE.Vector2(e.clientX - rect.left, e.clientY - rect.top);
      setCurrentPos(pos);
      if (selectionMode === 'lasso') {
        setLassoPoints(prev => {
          const lastPoint = prev[prev.length - 1];
          if (lastPoint && lastPoint.distanceTo(pos) < 5) return prev;
          return [...prev, pos];
        });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isSelecting) return;
      setIsSelecting(false);
      if (controlsRef.current) controlsRef.current.enabled = true;

      const rect = gl.domElement.getBoundingClientRect();
      const endPos = new THREE.Vector2(e.clientX - rect.left, e.clientY - rect.top);

      const selectedIds: string[] = [];

      if (selectionMode === 'rectangle' && startPos) {
        const minX = Math.min(startPos.x, endPos.x);
        const maxX = Math.max(startPos.x, endPos.x);
        const minY = Math.min(startPos.y, endPos.y);
        const maxY = Math.max(startPos.y, endPos.y);

        elements.forEach(el => {
          if (el.visibility === 'hidden') return;
          const obj = scene.getObjectByName(el.id);
          if (obj) {
            const box = new THREE.Box3().setFromObject(obj);
            const corners = [
              new THREE.Vector3(box.min.x, box.min.y, box.min.z),
              new THREE.Vector3(box.max.x, box.min.y, box.min.z),
              new THREE.Vector3(box.min.x, box.max.y, box.min.z),
              new THREE.Vector3(box.max.x, box.max.y, box.min.z),
              new THREE.Vector3(box.min.x, box.min.y, box.max.z),
              new THREE.Vector3(box.max.x, box.min.y, box.max.z),
              new THREE.Vector3(box.min.x, box.max.y, box.max.z),
              new THREE.Vector3(box.max.x, box.max.y, box.max.z),
            ];

            let isInside = true;
            corners.forEach(corner => {
              const screenPos = corner.clone().project(camera);
              const x = (screenPos.x + 1) * size.width / 2;
              const y = (-screenPos.y + 1) * size.height / 2;
              if (x < minX || x > maxX || y < minY || y > maxY) {
                isInside = false;
              }
            });

            if (isInside) {
              selectedIds.push(el.id);
            }
          }
        });
      } else if (selectionMode === 'lasso' && lassoPoints.length > 2) {
        const isPointInPoly = (poly: THREE.Vector2[], pt: THREE.Vector2) => {
          let inside = false;
          for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            if (((poly[i].y > pt.y) !== (poly[j].y > pt.y)) &&
              (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)) {
              inside = !inside;
            }
          }
          return inside;
        };

        elements.forEach(el => {
          if (el.visibility === 'hidden') return;
          const obj = scene.getObjectByName(el.id);
          if (obj) {
            const box = new THREE.Box3().setFromObject(obj);
            const center = new THREE.Vector3();
            box.getCenter(center);
            const screenPos = center.project(camera);
            const x = (screenPos.x + 1) * size.width / 2;
            const y = (-screenPos.y + 1) * size.height / 2;
            if (isPointInPoly(lassoPoints, new THREE.Vector2(x, y))) {
              selectedIds.push(el.id);
            }
          }
        });
      }

      if (selectedIds.length > 0 && onSelectMultiple) {
        onSelectMultiple(selectedIds);
      }

      setStartPos(null);
      setCurrentPos(null);
      setLassoPoints([]);
    };

    gl.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [selectionMode, isSelecting, startPos, lassoPoints, gl, controlsRef, elements, onSelectMultiple, camera, scene, size]);

  if (!isSelecting) return null;

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div className="w-full h-full relative">
        {selectionMode === 'rectangle' && startPos && currentPos && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500/20"
            style={{
              left: Math.min(startPos.x, currentPos.x),
              top: Math.min(startPos.y, currentPos.y),
              width: Math.abs(currentPos.x - startPos.x),
              height: Math.abs(currentPos.y - startPos.y)
            }}
          />
        )}
        {selectionMode === 'lasso' && lassoPoints.length > 1 && (
          <svg className="absolute inset-0 w-full h-full">
            <polyline
              points={lassoPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
            />
          </svg>
        )}
      </div>
    </Html>
  );
}

const highlightMaterial = new THREE.MeshBasicMaterial({
  color: 0x3b82f6,
  depthTest: false,
  transparent: true,
  opacity: 0.5
});

const xrayMaterial = new THREE.MeshStandardMaterial({
  color: 0x888888,
  transparent: true,
  opacity: 0.2,
  depthWrite: false
});

const mappedMaterial = new THREE.MeshBasicMaterial({
  color: 0x10b981,
  depthTest: false,
  transparent: true,
  opacity: 0.4
});

const activeMappedMaterial = new THREE.MeshBasicMaterial({
  color: 0x059669,
  depthTest: false,
  transparent: true,
  opacity: 0.6
});

function IfcModelRenderer({ model, elements, onSelect, activeTool }: { model: any, elements: BimElement[], onSelect: (id: string, multi: boolean) => void, activeTool: string | null | undefined }) {
  const [visibleSubset, setVisibleSubset] = useState<THREE.Mesh | null>(null);
  const [xraySubset, setXraySubset] = useState<THREE.Mesh | null>(null);

  const modelElements = useMemo(() => 
    elements.filter(el => el.geometry.type === 'ifc' && el.geometry.args.modelID === model.modelID),
  [elements, model.modelID]);

  useEffect(() => {
    // If we have elements defined for this model, we use subsets for visibility/xray
    // If NO elements are defined (still being parsed), we show the original model
    if (modelElements.length > 0) {
      model.visible = false;
      
      const visibleIds = modelElements.filter(el => el.visibility !== 'hidden' && el.visibility !== 'xray').map(el => el.geometry.args.expressID);
      const xrayIds = modelElements.filter(el => el.visibility === 'xray').map(el => el.geometry.args.expressID);

      if (visibleIds.length > 0) {
        const vSubset = ifcLoader.ifcManager.createSubset({
          modelID: model.modelID,
          ids: visibleIds,
          removePrevious: true,
          customID: 'visible-subset'
        }) as THREE.Mesh;
        vSubset.visible = true;
        setVisibleSubset(vSubset);
      } else if (visibleSubset) {
        visibleSubset.visible = false;
        setVisibleSubset(null);
      }

      if (xrayIds.length > 0) {
        const xSubset = ifcLoader.ifcManager.createSubset({
          modelID: model.modelID,
          ids: xrayIds,
          material: xrayMaterial,
          removePrevious: true,
          customID: 'xray-subset'
        }) as THREE.Mesh;
        xSubset.visible = true;
        setXraySubset(xSubset);
      } else if (xraySubset) {
        xraySubset.visible = false;
        setXraySubset(null);
      }
    } else {
      model.visible = true;
    }
  }, [model, modelElements]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (activeTool === 'select' || !activeTool || activeTool === 'assign') {
      e.stopPropagation();
      if (e.faceIndex !== undefined && e.faceIndex !== null) {
        const mesh = e.object as THREE.Mesh;
        const expressId = ifcLoader.ifcManager.getExpressId(mesh.geometry, e.faceIndex);
        if (expressId !== undefined) {
          const elementId = `ifc-${model.modelID}-${expressId}`;
          onSelect(elementId, e.shiftKey || e.ctrlKey || e.metaKey);
        }
      }
    }
  };

  return (
    <group>
      {/* Base model is visible when no subsets are active yet */}
      <primitive object={model} visible={modelElements.length === 0} onClick={handleClick} />
      {visibleSubset && (
        <primitive
          object={visibleSubset}
          dispose={null}
          onClick={handleClick}
        />
      )}
      {xraySubset && (
        <primitive
          object={xraySubset}
          dispose={null}
          onClick={handleClick}
        />
      )}
    </group>
  );
}

function IfcMappedHighlighter({ mappedElements = [], activeAssignmentTarget, ifcModels }: { mappedElements?: any[], activeAssignmentTarget?: string | null, ifcModels: any[] }) {
  const { scene } = useThree();
  useEffect(() => {
    // Clear previous highlights
    ifcModels.forEach((model: any) => {
      ifcLoader.ifcManager.removeSubset(model.modelID, mappedMaterial);
      ifcLoader.ifcManager.removeSubset(model.modelID, activeMappedMaterial);
    });

    const ifcMapped = mappedElements.filter(m => m.elementId.startsWith('ifc-'));
    if (ifcMapped.length === 0) return;

    // Group by model and activity
    const activeByModel: Record<number, number[]> = {};
    const regularByModel: Record<number, number[]> = {};

    ifcMapped.forEach(m => {
      const parts = m.elementId.split('-');
      const modelID = parseInt(parts[1], 10);
      const expressID = parseInt(parts[2], 10);
      
      const isActive = m.projectItemId === activeAssignmentTarget;
      const targetMap = isActive ? activeByModel : regularByModel;

      if (!targetMap[modelID]) targetMap[modelID] = [];
      targetMap[modelID].push(expressID);
    });

    // Create subsets
    const createSubsets = (byModel: Record<number, number[]>, material: THREE.Material) => {
      Object.keys(byModel).forEach(modelIDStr => {
        const modelID = parseInt(modelIDStr, 10);
        const model = ifcModels.find((m: any) => m.modelID === modelID);
        if (model) {
          ifcLoader.ifcManager.createSubset({
            modelID,
            ids: byModel[modelID],
            material: material,
            scene: scene,
            removePrevious: true
          });
        }
      });
    };

    createSubsets(regularByModel, mappedMaterial);
    createSubsets(activeByModel, activeMappedMaterial);

    return () => {
      ifcModels.forEach((model: any) => {
        ifcLoader.ifcManager.removeSubset(model.modelID, mappedMaterial);
        ifcLoader.ifcManager.removeSubset(model.modelID, activeMappedMaterial);
      });
    };
  }, [mappedElements, activeAssignmentTarget, ifcModels, scene]);

  return null;
}

function IfcHighlighter({ selectedIds, ifcModels }: { selectedIds: string[], ifcModels: any[] }) {
  const { scene } = useThree();

  useEffect(() => {
    // Clear previous highlights
    ifcModels.forEach((model: any) => {
      ifcLoader.ifcManager.removeSubset(model.modelID, highlightMaterial);
    });

    const ifcSelectedIds = selectedIds.filter(id => id.startsWith('ifc-'));
    if (ifcSelectedIds.length === 0) return;

    // Group by modelID
    const byModel: Record<number, number[]> = {};
    ifcSelectedIds.forEach(id => {
      const parts = id.split('-');
      const modelID = parseInt(parts[1], 10);
      const expressID = parseInt(parts[2], 10);
      if (!byModel[modelID]) byModel[modelID] = [];
      byModel[modelID].push(expressID);
    });

    Object.keys(byModel).forEach(modelIDStr => {
      const modelID = parseInt(modelIDStr, 10);
      const model = ifcModels.find((m: any) => m.modelID === modelID);
      if (model) {
        ifcLoader.ifcManager.createSubset({
          modelID,
          ids: byModel[modelID],
          material: highlightMaterial,
          scene: scene,
          removePrevious: true
        });
      }
    });

    return () => {
      ifcModels.forEach((model: any) => {
        ifcLoader.ifcManager.removeSubset(model.modelID, highlightMaterial);
      });
    };
  }, [selectedIds, ifcModels, scene]);

  return null;
}

function CameraManager({ saveViewTrigger, onSaveView, restoreView, controlsRef }: { saveViewTrigger?: number, onSaveView?: (position: [number, number, number], target: [number, number, number]) => void, restoreView?: { position: [number, number, number], target: [number, number, number] } | null, controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree();
  const prevTrigger = useRef(saveViewTrigger);

  useEffect(() => {
    if (saveViewTrigger !== undefined && saveViewTrigger !== prevTrigger.current) {
      prevTrigger.current = saveViewTrigger;
      if (onSaveView && controlsRef.current) {
        onSaveView(
          [camera.position.x, camera.position.y, camera.position.z],
          [controlsRef.current.target.x, controlsRef.current.target.y, controlsRef.current.target.z]
        );
      }
    }
  }, [saveViewTrigger, onSaveView, camera, controlsRef]);

  useEffect(() => {
    if (restoreView && controlsRef.current) {
      camera.position.set(...restoreView.position);
      controlsRef.current.target.set(...restoreView.target);
      controlsRef.current.update();
    }
  }, [restoreView, camera, controlsRef]);

  return null;
}

function ClippingPlaneManager({ active, height }: { active: boolean, height: number }) {
  const { gl } = useThree();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), height));

  useEffect(() => {
    if (active) {
      gl.localClippingEnabled = true;
      planeRef.current.constant = height;
      gl.clippingPlanes = [planeRef.current];
    } else {
      gl.localClippingEnabled = false;
      gl.clippingPlanes = [];
    }
  }, [active, height, gl]);

  if (!active) return null;

  return (
    <group position={[0, height - 0.01, 0]}>
      {/* Visual helper for the clipping plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial
          color={0xff0000}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <gridHelper args={[100, 100, 0xff0000, 0xff0000]} position={[0, 0.01, 0]}>
        <lineBasicMaterial attach="material" transparent opacity={0.2} depthWrite={false} color={0xff0000} />
      </gridHelper>
    </group>
  );
}

export function BimViewer({
  elements,
  ifcModels = [],
  selectedIds,
  onSelect,
  onSelectMultiple,
  onUpdateElement,
  wireframe,
  transformMode,
  activeTool,
  setActiveTool,
  onAddLine,
  lineConfig,
  onAddRectangle,
  rectangleConfig,
  onAddArc,
  arcConfig,
  activeLevel,
  onAddWall,
  onAddPolyline,
  onAddSlab,
  wallConfig,
  snapConfig,
  wallTypes,
  lineTypes,
  editingGroupId,
  onExitGroupEdit,
  showOutsideGroup = true,
  viewMode,
  setViewMode,
  selectionMode,
  modelConfig,
  onContextMenu,
  scaleSettings,
  saveViewTrigger,
  onSaveView,
  restoreView,
  activeSlabTypeId,
  slabTypes,
  clippingPlaneActive = false,
  clippingPlaneHeight = 5,
  mappedElements = [],
  activeAssignmentTarget
}: BimViewerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const selectedElement = elements.find(el => selectedIds.includes(el.id)) || null;
  const isTransforming = transformMode !== null && selectedElement !== null;

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [viewMode]);

  return (
    <div
      className="w-full h-full relative"
      style={{ backgroundColor: modelConfig.backgroundColor }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onContextMenu) onContextMenu(e.clientX, e.clientY);
      }}
    >
      <Canvas
        shadows={modelConfig.showShadows ? { type: THREE.PCFShadowMap } : false}
        onPointerMissed={() => onSelect(null)}
      >
        <ClippingPlaneManager active={clippingPlaneActive} height={clippingPlaneHeight} />
        <CameraManager
          saveViewTrigger={saveViewTrigger}
          onSaveView={onSaveView}
          restoreView={restoreView}
          controlsRef={controlsRef}
        />
        {viewMode === '2D' ? (
          <OrthographicCamera makeDefault position={[0, 50, 0]} zoom={40} near={0.1} far={1000} />
        ) : (
          <PerspectiveCamera makeDefault position={[25, 20, 25]} fov={45} near={0.1} far={1000} />
        )}

        <color attach="background" args={[modelConfig.backgroundColor]} />

        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow={modelConfig.showShadows}
          position={[10, 20, 10]}
          intensity={1.5}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />

        <Suspense fallback={null}>

          <group position={[0, -0.5, 0]}>
            {modelConfig.showGrid && (
              <gridHelper
                args={[
                  modelConfig.gridFullCanvas ? 2000 : modelConfig.gridSize,
                  Math.floor((modelConfig.gridFullCanvas ? 2000 : modelConfig.gridSize) / (modelConfig.gridSpacing || 1)),
                  "#27272a",
                  "#18181b"
                ]}
                rotation={[0, 0, 0]}
                position={[0, 0.01, 0]}
              />
            )}
            <BuildingModel
              elements={elements}
              selectedIds={selectedIds}
              onSelect={(el, multi) => {
                if (editingGroupId && el && el.groupId !== editingGroupId) return;
                onSelect(el?.id || null, multi);
              }}
              onUpdateElement={onUpdateElement}
              wireframe={wireframe}
              wallTypes={wallTypes}
              lineTypes={lineTypes}
              editingGroupId={editingGroupId}
              showOutsideGroup={showOutsideGroup}
              mappedElements={mappedElements}
              activeAssignmentTarget={activeAssignmentTarget}
            />

            {/* Render imported IFC models */}
            {ifcModels.map((model: any, index) => (
              <IfcModelRenderer
                key={`ifc-${index}`}
                model={model}
                elements={elements}
                onSelect={(id, multi) => onSelect(id, multi)}
                activeTool={activeTool}
              />
            ))}

            <IfcHighlighter selectedIds={selectedIds} ifcModels={ifcModels} />
            <IfcMappedHighlighter
              mappedElements={mappedElements}
              activeAssignmentTarget={activeAssignmentTarget}
              ifcModels={ifcModels}
            />

            <DrawingPlane
              activeTool={activeTool}
              onAddLine={onAddLine}
              setActiveTool={setActiveTool}
              lineConfig={lineConfig}
              onAddRectangle={onAddRectangle}
              rectangleConfig={rectangleConfig}
              activeLevel={activeLevel}
              onAddWall={onAddWall}
              onAddPolyline={onAddPolyline}
              wallConfig={wallConfig}
              snapConfig={snapConfig}
              elements={elements}
              lineTypes={lineTypes}
              gridSpacing={modelConfig.gridSpacing}
              scaleSettings={scaleSettings}
            />

            <TransformManager
              selectedElement={selectedElement}
              transformMode={transformMode}
              onUpdateElement={onUpdateElement}
              controlsRef={controlsRef}
              editingGroupId={editingGroupId}
            />

            <SelectionManager
              selectionMode={selectionMode}
              elements={elements}
              onSelectMultiple={onSelectMultiple}
              controlsRef={controlsRef}
            />

            {selectedElement && (
              <GripController
                element={selectedElement}
                onUpdate={(updates) => onUpdateElement(selectedElement.id, updates)}
                is2D={viewMode === '2D'}
                disabled={(editingGroupId !== null && selectedElement.groupId !== editingGroupId) || selectedElement.locked}
                snapConfig={snapConfig}
                elements={elements}
                gridSpacing={modelConfig.gridSpacing}
                activeLevel={activeLevel}
              />
            )}

            {modelConfig.showShadows && (
              <ContactShadows
                position={[0, -0.26, 0]}
                opacity={0.4}
                scale={50}
                blur={2}
                far={10}
              />
            )}

            {modelConfig.showGrid && (
              <Grid
                position={[0, -0.25, 0]}
                args={[50, 50]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#3f3f46"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#52525b"
                fadeDistance={50}
                fadeStrength={1}
              />
            )}
          </group>
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableRotate={viewMode === '3D'}
          minPolarAngle={0}
          maxPolarAngle={viewMode === '3D' ? Math.PI / 2 - 0.05 : 0}
          minDistance={5}
          maxDistance={100}
          minZoom={10}
          maxZoom={200}
        />

        {viewMode === '3D' && (
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
          </GizmoHelper>
        )}
      </Canvas>
      <PaperDrawingLayer activeTool={activeTool || null} onAddElement={(type, data) => console.log(type, data)} />
    </div>
  );
}
