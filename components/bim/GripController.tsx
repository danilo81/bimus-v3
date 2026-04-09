"use client"
import React, { useState, useRef, useMemo } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import { useCursor, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BimElement } from '@/types/types';
import { getSnappedPoint } from '@/lib/snapUtils';

interface GripControllerProps {
  element: BimElement;
  onUpdate: (updates: Partial<BimElement>) => void;
  is2D?: boolean;
  disabled?: boolean;
  snapConfig?: any;
  elements?: BimElement[];
  gridSpacing?: number;
  activeLevel?: string;
}

export function GripController({ element, onUpdate, is2D, disabled, snapConfig, elements, gridSpacing, activeLevel }: GripControllerProps) {
  const { camera, gl, scene, raycaster } = useThree();
  const [draggingGrip, setDraggingGrip] = useState<number | null>(null);
  const [hoveredGrip, setHoveredGrip] = useState<number | null>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  const dragStartRef = useRef<{
    fixedPoint: THREE.Vector3;
    originalPos: THREE.Vector3;
    originalRot: THREE.Euler;
    originalArgs: any;
  } | null>(null);

  if (disabled) return null;

  useCursor(hoveredGrip !== null);

  const { type, args, position, rotation } = element.geometry;
  const pos = new THREE.Vector3(...position);
  const rot = new THREE.Euler(...(rotation || [0, 0, 0]));
  const scale = new THREE.Vector3(...(element.geometry.scale || [1, 1, 1]));

  const grips = useMemo(() => {
    if (type === 'rectangle') {
      const [w, h] = args as unknown as [number, number];
      return [
        new THREE.Vector3(-w / 2, 0, -h / 2), // 0: Top-Left
        new THREE.Vector3(0, 0, -h / 2),      // 1: Top-Center
        new THREE.Vector3(w / 2, 0, -h / 2),  // 2: Top-Right
        new THREE.Vector3(w / 2, 0, 0),       // 3: Right-Center
        new THREE.Vector3(w / 2, 0, h / 2),   // 4: Bottom-Right
        new THREE.Vector3(0, 0, h / 2),       // 5: Bottom-Center
        new THREE.Vector3(-w / 2, 0, h / 2),  // 6: Bottom-Left
        new THREE.Vector3(-w / 2, 0, 0),      // 7: Left-Center
      ].map(p => p.applyEuler(rot).add(pos));
    } else if (type === 'line') {
      const lineArgs = args as [number, number, number, number, number, number];
      return [
        new THREE.Vector3(lineArgs[0], lineArgs[1], lineArgs[2]).add(pos),
        new THREE.Vector3(lineArgs[3], lineArgs[4], lineArgs[5]).add(pos),
      ];
    } else if (type === 'box' && element.category === 'Walls') {
      const [length] = args as [number, number, number];
      return [
        new THREE.Vector3(-length / 2, 0, 0).applyEuler(rot).add(pos),
        new THREE.Vector3(length / 2, 0, 0).applyEuler(rot).add(pos),
      ];
    } else if (type === 'arc') {
      const [radius, startAngle, endAngle] = args as [number, number, number];
      // Grip at start point
      const startPoint = new THREE.Vector3(Math.cos(startAngle) * radius, 0, Math.sin(startAngle) * radius);
      // Grip at end point
      const endPoint = new THREE.Vector3(Math.cos(endAngle) * radius, 0, Math.sin(endAngle) * radius);
      // Grip at midpoint
      const midAngle = startAngle + (endAngle - startAngle) / 2;
      const midPoint = new THREE.Vector3(Math.cos(midAngle) * radius, 0, Math.sin(midAngle) * radius);

      return [
        startPoint.applyEuler(rot).add(pos),
        midPoint.applyEuler(rot).add(pos),
        endPoint.applyEuler(rot).add(pos),
      ];
    }
    return [];
  }, [type, args, pos, rot, element.category]);

  const distance = useMemo(() => {
    if (grips.length === 2) {
      return grips[0].distanceTo(grips[1]);
    }
    return null;
  }, [grips]);

  const midPoint = useMemo(() => {
    if (grips.length === 2) {
      return new THREE.Vector3().addVectors(grips[0], grips[1]).multiplyScalar(0.5);
    }
    return null;
  }, [grips]);

  const rectangleDimensions = useMemo(() => {
    if (type === 'rectangle' && (draggingGrip !== null || hoveredGrip !== null)) {
      const [w, h] = args as unknown as [number, number];
      return { w, h };
    }
    return null;
  }, [type, args, draggingGrip, hoveredGrip]);

  const angle = useMemo(() => {
    if (grips.length === 2) {
      const dir = new THREE.Vector3().subVectors(grips[1], grips[0]).normalize();
      let a = (Math.atan2(dir.x, dir.z) * 180) / Math.PI;
      // Normalize to 0-360
      if (a < 0) a += 360;
      return a;
    }
    return null;
  }, [grips]);

  const handleGripPointerDown = (e: ThreeEvent<PointerEvent>, index: number) => {
    e.stopPropagation();
    (e.target as any).setPointerCapture(e.pointerId);

    // Calculate fixed point at start of drag
    let fixedPoint = new THREE.Vector3();
    if (type === 'line') {
      const lineArgs = args as [number, number, number, number, number, number];
      if (index === 0) {
        fixedPoint.set(lineArgs[3], lineArgs[4], lineArgs[5]).add(pos);
      } else {
        fixedPoint.set(lineArgs[0], lineArgs[1], lineArgs[2]).add(pos);
      }
    } else if (type === 'box' && element.category === 'Walls') {
      const [length] = args as [number, number, number];
      const oppIndex = 1 - index;
      const oppPointLocal = new THREE.Vector3(oppIndex === 0 ? -length / 2 : length / 2, 0, 0);
      fixedPoint = oppPointLocal.clone().applyEuler(rot).add(pos);
    } else if (type === 'rectangle') {
      const [w, h] = args as unknown as [number, number];
      const oppIndex = (index + 4) % 8;
      const oppPointLocal = new THREE.Vector3();
      if (oppIndex === 0) oppPointLocal.set(-w / 2, 0, -h / 2);
      else if (oppIndex === 1) oppPointLocal.set(0, 0, -h / 2);
      else if (oppIndex === 2) oppPointLocal.set(w / 2, 0, -h / 2);
      else if (oppIndex === 3) oppPointLocal.set(w / 2, 0, 0);
      else if (oppIndex === 4) oppPointLocal.set(w / 2, 0, h / 2);
      else if (oppIndex === 5) oppPointLocal.set(0, 0, h / 2);
      else if (oppIndex === 6) oppPointLocal.set(-w / 2, 0, h / 2);
      else if (oppIndex === 7) oppPointLocal.set(-w / 2, 0, 0);
      fixedPoint = oppPointLocal.applyEuler(rot).add(pos);
    }

    dragStartRef.current = {
      fixedPoint,
      originalPos: pos.clone(),
      originalRot: rot.clone(),
      originalArgs: args ? JSON.parse(JSON.stringify(args)) : []
    };

    setDraggingGrip(index);
  };

  const handleGripPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    (e.target as any).releasePointerCapture(e.pointerId);
    setDraggingGrip(null);
    dragStartRef.current = null;
  };

  const handleGripPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (draggingGrip === null || !planeRef.current || !dragStartRef.current) return;
    e.stopPropagation();

    const { fixedPoint } = dragStartRef.current;

    // Use the raycaster from useThree which is updated by the pointer
    const intersects = raycaster.intersectObject(planeRef.current);
    if (intersects.length === 0) return;

    const planeY = activeLevel === 'L00' ? 0 : activeLevel === 'L01' ? 4.2 : activeLevel === 'L02' ? 8.4 : activeLevel === 'Roof' ? 12.6 : 0;
    const { point: snappedPoint } = getSnappedPoint(intersects[0].point.clone(), elements, snapConfig, planeY, gridSpacing);
    const newPoint = snappedPoint;

    if (type === 'rectangle') {
      const [w, h] = args as unknown as [number, number];

      let newW = w;
      let newH = h;
      let newPos = pos.clone();

      const oppPointWorld = fixedPoint;

      if (draggingGrip % 2 === 0) { // Corners
        // New center is midpoint between dragged point and opposite corner
        const midPointWorld = new THREE.Vector3().addVectors(newPoint, oppPointWorld).multiplyScalar(0.5);
        newPos = midPointWorld;

        // New size
        const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(rot);
        const inverseRotationMatrix = rotationMatrix.clone().invert();
        const diffLocal = newPoint.clone().sub(oppPointWorld).applyMatrix4(inverseRotationMatrix);
        newW = Math.max(0.01, Math.abs(diffLocal.x));
        newH = Math.max(0.01, Math.abs(diffLocal.z));
      } else { // Midpoints
        // Project newPoint onto the axis passing through fixedPoint and the original grip position
        // This ensures the rectangle only resizes along its local axes
        const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(rot);
        const inverseRotationMatrix = rotationMatrix.clone().invert();
        const localNewPoint = newPoint.clone().sub(oppPointWorld).applyMatrix4(inverseRotationMatrix);

        if (draggingGrip === 1 || draggingGrip === 5) { // Top or Bottom
          // Keep local X at 0 (relative to the axis)
          localNewPoint.x = 0;
          const projectedNewPoint = localNewPoint.applyMatrix4(rotationMatrix).add(oppPointWorld);

          const midPointWorld = new THREE.Vector3().addVectors(projectedNewPoint, oppPointWorld).multiplyScalar(0.5);
          newPos = midPointWorld;
          newH = Math.max(0.01, Math.abs(localNewPoint.z));
        } else if (draggingGrip === 3 || draggingGrip === 7) { // Right or Left
          // Keep local Z at 0
          localNewPoint.z = 0;
          const projectedNewPoint = localNewPoint.applyMatrix4(rotationMatrix).add(oppPointWorld);

          const midPointWorld = new THREE.Vector3().addVectors(projectedNewPoint, oppPointWorld).multiplyScalar(0.5);
          newPos = midPointWorld;
          newW = Math.max(0.01, Math.abs(localNewPoint.x));
        }
      }

      onUpdate({
        geometry: {
          ...element.geometry,
          position: [newPos.x, newPos.y, newPos.z],
          args: [newW, newH, 0.01]
        },
        area: newW * newH
      });
    } else if (type === 'line') {
      const lineArgs = [...(args as number[])];
      if (draggingGrip === 0) {
        lineArgs[0] = newPoint.x - pos.x;
        lineArgs[1] = newPoint.y - pos.y;
        lineArgs[2] = newPoint.z - pos.z;
      } else {
        lineArgs[3] = newPoint.x - pos.x;
        lineArgs[4] = newPoint.y - pos.y;
        lineArgs[5] = newPoint.z - pos.z;
      }
      onUpdate({
        geometry: {
          ...element.geometry,
          args: lineArgs as any
        }
      });
    } else if (type === 'box' && element.category === 'Walls') {
      const [length, height, thickness] = args as [number, number, number];

      const oppPointWorld = fixedPoint;

      // New center is midpoint between dragged point and opposite point
      const newPos = new THREE.Vector3().addVectors(newPoint, oppPointWorld).multiplyScalar(0.5);

      // New length is distance between points
      const newLength = newPoint.distanceTo(oppPointWorld);

      // New rotation (angle of the line between points)
      const start = draggingGrip === 0 ? newPoint : oppPointWorld;
      const end = draggingGrip === 1 ? newPoint : oppPointWorld;
      const dir = new THREE.Vector3().subVectors(end, start).normalize();
      const finalAngle = Math.atan2(dir.x, dir.z) - Math.PI / 2;

      onUpdate({
        geometry: {
          ...element.geometry,
          position: [newPos.x, newPos.y, newPos.z],
          rotation: [0, finalAngle, 0],
          args: [newLength, height, thickness]
        }
      });
    } else if (type === 'arc') {
      const [radius, startAngle, endAngle] = args as [number, number, number];
      const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(rot);
      const inverseRotationMatrix = rotationMatrix.clone().invert();
      const localPoint = newPoint.clone().sub(pos).applyMatrix4(inverseRotationMatrix);

      const angle = Math.atan2(localPoint.z, localPoint.x);
      const dist = Math.sqrt(localPoint.x * localPoint.x + localPoint.z * localPoint.z);

      let newRadius = radius;
      let newStartAngle = startAngle;
      let newEndAngle = endAngle;

      if (draggingGrip === 0) { // Start point
        newStartAngle = angle;
      } else if (draggingGrip === 1) { // Midpoint (radius)
        newRadius = dist;
      } else if (draggingGrip === 2) { // End point
        newEndAngle = angle;
      }

      onUpdate({
        geometry: {
          ...element.geometry,
          args: [newRadius, newStartAngle, newEndAngle]
        }
      });
    }
  };

  return (
    <group>
      {/* Invisible plane for raycasting during drag */}
      <mesh
        ref={planeRef}
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, pos.y, 0]}
      >
        <planeGeometry args={[1000, 1000]} />
      </mesh>

      {/* Axis line for walls */}
      {type === 'box' && element.category === 'Walls' && grips.length === 2 && (
        <Line
          points={[grips[0], grips[1]]}
          color="#3b82f6"
          lineWidth={1}
          dashed
          dashSize={0.2}
          gapSize={0.1}
          depthTest={false}
        />
      )}

      {/* Distance & Angle Label for Walls/Lines */}
      {(draggingGrip !== null || hoveredGrip !== null) && distance !== null && midPoint !== null && (
        <Html position={midPoint} center>
          <div className="bg-zinc-900/90 backdrop-blur-sm border border-purple-500/50 rounded-lg p-3 shadow-2xl pointer-events-none select-none min-w-[140px] font-mono transform scale-75 origin-center">
            <div className="flex justify-between items-center gap-4 mb-2">
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Length</span>
              <span className="text-purple-400 text-sm font-bold">{distance.toFixed(2)}m</span>
            </div>
            <div className="flex justify-between items-center gap-4 mb-2">
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Angle</span>
              <span className="text-purple-400 text-sm font-bold">{angle?.toFixed(1)}°</span>
            </div>
            <div className="h-px bg-zinc-800 my-2" />
            <div className="text-center">
              <span className="text-zinc-600 text-[9px] uppercase tracking-tighter">Drag to modify</span>
            </div>
          </div>
        </Html>
      )}

      {/* Dimension Label for Rectangles */}
      {type === 'rectangle' && rectangleDimensions && (
        <Html position={pos} center>
          <div className="bg-zinc-900/90 backdrop-blur-sm border border-blue-500/50 rounded-lg p-3 shadow-2xl pointer-events-none select-none min-w-[140px] font-mono transform scale-75 origin-center">
            <div className="flex justify-between items-center gap-4 mb-2">
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Width</span>
              <span className="text-blue-400 text-sm font-bold">{rectangleDimensions.w.toFixed(2)}m</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Height</span>
              <span className="text-blue-400 text-sm font-bold">{rectangleDimensions.h.toFixed(2)}m</span>
            </div>
          </div>
        </Html>
      )}

      {grips.map((p, i) => (
        <mesh
          key={i}
          position={p}
          onPointerDown={(e) => handleGripPointerDown(e, i)}
          onPointerUp={handleGripPointerUp}
          onPointerMove={handleGripPointerMove}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredGrip(i);
          }}
          onPointerOut={() => setHoveredGrip(null)}
        >
          <boxGeometry args={[0.15, 0.15, 0.15]} />
          <meshBasicMaterial
            color={draggingGrip === i ? "#3b82f6" : "#ffffff"}
            depthTest={false}
            transparent
            opacity={0.8}
          />
          {/* Border for the grip */}
          <mesh>
            <boxGeometry args={[0.17, 0.17, 0.17]} />
            <meshBasicMaterial color="#000000" wireframe depthTest={false} />
          </mesh>
        </mesh>
      ))}
    </group>
  );
}
