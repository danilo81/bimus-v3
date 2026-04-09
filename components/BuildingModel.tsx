"use client"
import React, { useState, useMemo } from 'react';
import { useCursor, Line } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { BimElement, WallType, LineType } from '@/types/types';
import { getSnappedPoint } from '@/lib/snapUtils';

interface BuildingModelProps {
  elements: BimElement[];
  selectedIds: string[];
  onSelect: (element: BimElement | null, multi?: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<BimElement>) => void;
  wireframe: boolean;
  wallTypes?: WallType[];
  lineTypes?: LineType[];
  editingGroupId?: string | null;
  showOutsideGroup?: boolean;
}

function BimMesh({
  element,
  isSelected,
  onClick,
  onUpdateElement,
  wireframe,
  wallTypes,
  lineTypes
}: {
  element: BimElement;
  isSelected: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  onUpdateElement: (id: string, updates: Partial<BimElement>) => void;
  wireframe: boolean;
  wallTypes?: WallType[];
  lineTypes?: LineType[];
}) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const fillTexture = useMemo(() => {
    if (element.fillType === 'gradient') {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, element.color);
        gradient.addColorStop(1, element.fillColor2 || '#ffffff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
      }
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    }
    if (element.fillType === 'texture' && element.textureUrl) {
      try {
        return new THREE.TextureLoader().load(element.textureUrl);
      } catch (e) {
        console.error("Failed to load texture", e);
        return null;
      }
    }
    if (element.fillType === 'hatch') {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = element.color;
        ctx.lineWidth = 4;
        if (element.hatchType === 'diagonal') {
          ctx.beginPath();
          ctx.moveTo(0, 64);
          ctx.lineTo(64, 0);
          ctx.stroke();
        } else if (element.hatchType === 'cross') {
          ctx.beginPath();
          ctx.moveTo(0, 64);
          ctx.lineTo(64, 0);
          ctx.moveTo(0, 0);
          ctx.lineTo(64, 64);
          ctx.stroke();
        } else if (element.hatchType === 'dots') {
          ctx.fillStyle = element.color;
          ctx.beginPath();
          ctx.arc(32, 32, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (element.hatchType === 'horizontal') {
          ctx.beginPath();
          ctx.moveTo(0, 32);
          ctx.lineTo(64, 32);
          ctx.stroke();
        } else if (element.hatchType === 'vertical') {
          ctx.beginPath();
          ctx.moveTo(32, 0);
          ctx.lineTo(32, 64);
          ctx.stroke();
        }
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
      return texture;
    }
    return null;
  }, [element.color, element.fillColor2, element.fillType, element.textureUrl, element.hatchType]);

  if (element.visibility === 'hidden') return null;

  const isXray = element.visibility === 'xray';
  const isGlass = element.material.toLowerCase().includes('glass');
  const baseOpacity = element.opacity !== undefined ? element.opacity : 1;
  const opacity = isXray ? 0.2 : (isGlass ? 0.4 : baseOpacity);
  const transparent = isXray || isGlass || opacity < 1;

  // Highlight color when selected or hovered
  const baseColor = new THREE.Color(element.color);
  const highlightColor = baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.3);
  const color = isSelected ? '#3b82f6' : (hovered ? highlightColor : element.color);

  const getLineProps = () => {
    let isDashed = false;
    let dashSize = 0.5;
    let gapSize = 0.2;
    let lineWidth = isSelected ? 3 : (element.lineWidth || 2);
    let lineColor = element.lineColor || "#000000";

    const lineType = element.lineType || element.material;

    if (lineType === 'Dashed') {
      isDashed = true;
    } else if (lineType === 'Dotted') {
      isDashed = true;
      dashSize = 0.1;
    } else if (lineType !== 'Solid') {
      const customType = lineTypes?.find(t => t.id === lineType);
      if (customType) {
        lineWidth = isSelected ? customType.thickness + 1 : (element.lineWidth || customType.thickness);
        lineColor = element.lineColor || customType.color;
        if (customType.segmentation && customType.segmentation.length > 0) {
          isDashed = true;
          dashSize = customType.segmentation[0] || 0.5;
          gapSize = customType.segmentation.length > 1 ? customType.segmentation[1] : dashSize;
        }
      }
    }

    return { isDashed, dashSize, gapSize, lineWidth, lineColor };
  };

  if (element.geometry.type === 'line') {
    const args = element.geometry.args as number[];
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < args.length; i += 3) {
      points.push(new THREE.Vector3(args[i], args[i + 1], args[i + 2]));
    }

    const { isDashed, dashSize, gapSize, lineWidth, lineColor } = getLineProps();

    return (
      <group
        name={element.id}
        position={element.geometry.position}
        rotation={element.geometry.rotation || [0, 0, 0]}
        scale={element.geometry.scale || [1, 1, 1]}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <Line
          points={points}
          color={isSelected ? '#3b82f6' : (hovered ? highlightColor : lineColor)}
          lineWidth={lineWidth}
          transparent={transparent}
          opacity={opacity}
          dashed={isDashed}
          dashSize={dashSize}
          gapSize={gapSize}
        />
      </group>
    );
  }

  if (element.geometry.type === 'arc') {
    const [radius, startAngle, endAngle] = element.geometry.args as [number, number, number];
    const { isDashed, dashSize, gapSize, lineWidth, lineColor } = getLineProps();

    // Create arc points
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / segments);
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }

    return (
      <group
        name={element.id}
        position={element.geometry.position}
        rotation={element.geometry.rotation || [0, 0, 0]}
        scale={element.geometry.scale || [1, 1, 1]}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <Line
          points={points}
          color={isSelected ? '#3b82f6' : (hovered ? highlightColor : lineColor)}
          lineWidth={lineWidth}
          transparent={transparent}
          opacity={opacity}
          dashed={isDashed}
          dashSize={dashSize}
          gapSize={gapSize}
        />
      </group>
    );
  }

  if (element.geometry.type === 'polygon') {
    const args = element.geometry.args as number[];
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < args.length; i += 3) {
      points.push(new THREE.Vector3(args[i], args[i + 1], args[i + 2]));
    }

    const shape = new THREE.Shape();
    if (points.length > 0) {
      shape.moveTo(points[0].x, points[0].z);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].z);
      }
      shape.lineTo(points[0].x, points[0].z);
    }

    const { isDashed, dashSize, gapSize, lineWidth, lineColor } = getLineProps();

    return (
      <group
        name={element.id}
        position={element.geometry.position}
        rotation={element.geometry.rotation || [0, 0, 0]}
        scale={element.geometry.scale || [1, 1, 1]}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <mesh castShadow={!isXray} receiveShadow={!isXray} rotation={[-Math.PI / 2, 0, 0]}>
          <extrudeGeometry args={[shape, { depth: 0.01, bevelEnabled: false }]} />
          <meshStandardMaterial
            color={color}
            transparent={transparent}
            opacity={opacity}
            wireframe={wireframe || isXray}
            depthWrite={!isXray}
            side={THREE.DoubleSide}
          />
        </mesh>
        <Line
          points={[...points.map(p => [p.x, p.y, p.z] as [number, number, number]), [points[0].x, points[0].y, points[0].z]]}
          color={isSelected ? '#3b82f6' : (hovered ? highlightColor : lineColor)}
          lineWidth={lineWidth}
          transparent={transparent}
          opacity={opacity}
          dashed={isDashed}
          dashSize={dashSize}
          gapSize={gapSize}
        />
        {isSelected && points.map((p, i) => (
          <mesh
            key={i}
            position={[p.x, p.y + 0.05, p.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onPointerMove={(e) => {
              if (e.buttons === 1) {
                e.stopPropagation();
                // Use snapping logic for smoother movement
                const { point } = getSnappedPoint(e.point.clone(), [], {}, p.y, 0.1);

                const localPoint = point.sub(new THREE.Vector3(...element.geometry.position));
                localPoint.y = p.y; // Keep same Y (local Y)

                const newPoints = [...points];
                newPoints[i] = localPoint;

                const newArgs = newPoints.flatMap(p => [p.x, p.y, p.z]);
                onUpdateElement(element.id, {
                  geometry: {
                    ...element.geometry,
                    args: newArgs
                  }
                });
              }
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
            }}
          >
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color="#3b82f6" />
          </mesh>
        ))}
      </group>
    );
  }

  if (element.geometry.type === 'rectangle') {
    const args = element.geometry.args as unknown as [number, number]; // width, height
    const width = args[0] || 0.01;
    const height = args[1] || 0.01;

    if (isNaN(width) || isNaN(height)) return null;

    const { isDashed, dashSize, gapSize, lineWidth, lineColor } = getLineProps();

    return (
      <group
        name={element.id}
        position={element.geometry.position}
        rotation={element.geometry.rotation || [0, 0, 0]}
        scale={element.geometry.scale || [1, 1, 1]}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {/* Fill */}
        <mesh castShadow={!isXray} receiveShadow={!isXray}>
          <boxGeometry args={[width, 0.01, height]} />
          <meshStandardMaterial
            color={fillTexture ? '#ffffff' : color}
            map={fillTexture}
            transparent={transparent}
            opacity={opacity}
            wireframe={wireframe || isXray}
            depthWrite={!isXray}
          />
        </mesh>
        {/* Border */}
        <Line
          points={[
            new THREE.Vector3(-width / 2, 0.01, -height / 2),
            new THREE.Vector3(width / 2, 0.01, -height / 2),
            new THREE.Vector3(width / 2, 0.01, height / 2),
            new THREE.Vector3(-width / 2, 0.01, height / 2),
            new THREE.Vector3(-width / 2, 0.01, -height / 2),
          ]}
          color={isSelected ? '#3b82f6' : (hovered ? highlightColor : lineColor)}
          lineWidth={lineWidth}
          dashed={isDashed}
          dashSize={dashSize}
          gapSize={gapSize}
        />
      </group>
    );
  }

  const wallType = element.category === 'Walls' && element.wallTypeId
    ? wallTypes?.find(wt => wt.id === element.wallTypeId)
    : null;

  if (wallType && element.geometry.type === 'box') {
    const [length, height, totalThickness] = element.geometry.args as [number, number, number];
    let currentZ = -totalThickness / 2;

    return (
      <group
        name={element.id}
        position={element.geometry.position}
        rotation={element.geometry.rotation || [0, 0, 0]}
        scale={element.geometry.scale || [1, 1, 1]}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {wallType.layers.map((layer, index) => {
          const layerZ = currentZ + layer.thickness / 2;
          currentZ += layer.thickness;

          // Generate a color based on material or function for visual distinction
          // In a real app, this would come from the material definition
          const layerColor = new THREE.Color().setHSL((index * 137.5) % 360 / 360, 0.5, 0.5);
          const finalColor = isSelected ? '#3b82f6' : (hovered ? highlightColor : layerColor);

          return (
            <mesh key={layer.id} position={[0, 0, layerZ]} castShadow={!isXray} receiveShadow={!isXray}>
              <boxGeometry args={[length, height, layer.thickness]} />
              <meshStandardMaterial
                color={finalColor}
                transparent={transparent}
                opacity={opacity}
                wireframe={wireframe || isXray}
                depthWrite={!isXray}
              />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (element.geometry.type === 'ifc') {
    return null; // The IFC model is rendered as a whole in BimViewer
  }

  if (element.geometry.type === 'slab') {
    const { points, thickness, elevation } = element.geometry.args;

    const shape = useMemo(() => {
      const s = new THREE.Shape();
      if (points && points.length > 0) {
        points.forEach((p: number[], i: number) => {
          if (i === 0) s.moveTo(p[0], p[2]);
          else s.lineTo(p[0], p[2]);
        });
        s.lineTo(points[0][0], points[0][2]); // Close shape
      }
      return s;
    }, [points]);

    return (
      <mesh
        name={element.id}
        position={[0, elevation, 0]}
        rotation={[-Math.PI / 2, 0, 0]} // Rotate to lie flat on XZ plane
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        castShadow={!isXray}
        receiveShadow={!isXray}
      >
        <extrudeGeometry args={[shape, { depth: thickness, bevelEnabled: false }]} />
        <meshStandardMaterial
          color={isSelected ? '#3b82f6' : (hovered ? highlightColor : color)}
          transparent={transparent}
          opacity={opacity}
          wireframe={wireframe || isXray}
          depthWrite={!isXray}
        />
      </mesh>
    );
  }

  return (
    <mesh
      name={element.id}
      position={element.geometry.position}
      rotation={element.geometry.rotation || [0, 0, 0]}
      scale={element.geometry.scale || [1, 1, 1]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      castShadow={!isXray}
      receiveShadow={!isXray}
    >
      {element.geometry.type === 'box' ? (
        <boxGeometry args={element.geometry.args as [number, number, number]} />
      ) : (
        <cylinderGeometry args={element.geometry.args as [number, number, number, number]} />
      )}
      <meshStandardMaterial
        color={color}
        transparent={transparent}
        opacity={opacity}
        wireframe={wireframe || isXray}
        depthWrite={!isXray}
        roughness={isGlass ? 0.1 : 0.8}
        metalness={isGlass ? 0.9 : 0.1}
      />
    </mesh>
  );
}

export function BuildingModel({
  elements,
  selectedIds,
  onSelect,
  onUpdateElement,
  wireframe,
  wallTypes,
  lineTypes,
  editingGroupId,
  showOutsideGroup = true
}: BuildingModelProps) {
  return (
    <group>
      {elements.map((element) => {
        const isInGroup = editingGroupId ? element.groupId === editingGroupId : true;
        const isOutside = !!(editingGroupId && !isInGroup);

        if (isOutside && !showOutsideGroup) return null;

        return (
          <BimMesh
            key={element.id}
            element={element}
            isSelected={selectedIds.includes(element.id)}
            onUpdateElement={onUpdateElement}
            wireframe={wireframe || isOutside}
            wallTypes={wallTypes}
            lineTypes={lineTypes}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(element, e.shiftKey);
            }}
          />
        );
      })}
    </group>
  );
}
