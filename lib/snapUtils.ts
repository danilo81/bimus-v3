import * as THREE from 'three';
import { BimElement } from '@/types/types';

export function getSnappedPoint(
  rawPoint: THREE.Vector3,
  elements: BimElement[] = [],
  snapConfig: any,
  planeY: number,
  gridSpacing: number = 1
): { point: THREE.Vector3, type: string | null } {
  if (!snapConfig?.enabled) return { point: rawPoint, type: null };

  let bestPoint = rawPoint.clone();
  let bestType: string | null = null;
  let minDistance = 0.5; // Snap threshold

  // 1. Vertices & Edge Centers
  if (snapConfig.vertices || snapConfig.edgeCenter || snapConfig.edge) {
    elements.forEach(el => {
      if (el.visibility === 'hidden') return;

      if (el.geometry.type === 'line') {
        const args = el.geometry.args as number[];
        const p1 = new THREE.Vector3(args[0], args[1], args[2]);
        const p2 = new THREE.Vector3(args[3], args[4], args[5]);

        // Apply element position
        p1.add(new THREE.Vector3(...el.geometry.position));
        p2.add(new THREE.Vector3(...el.geometry.position));

        // Project to current planeY
        p1.y = planeY;
        p2.y = planeY;

        // Check vertices
        if (snapConfig.vertices) {
          [p1, p2].forEach(p => {
            const dist = p.distanceTo(rawPoint);
            if (dist < minDistance) {
              minDistance = dist;
              bestPoint = p.clone();
              bestType = 'vertex';
            }
          });
        }

        // Check edge center
        if (snapConfig.edgeCenter) {
          const mid = p1.clone().lerp(p2, 0.5);
          const dist = mid.distanceTo(rawPoint);
          if (dist < minDistance) {
            minDistance = dist;
            bestPoint = mid.clone();
            bestType = 'edgeCenter';
          }
        }

        // Check edge
        if (snapConfig.edge && bestType !== 'vertex' && bestType !== 'edgeCenter') {
          const line = new THREE.Line3(p1, p2);
          const closest = new THREE.Vector3();
          line.closestPointToPoint(rawPoint, true, closest);
          const dist = closest.distanceTo(rawPoint);
          if (dist < minDistance) {
            minDistance = dist;
            bestPoint = closest.clone();
            bestType = 'edge';
          }
        }
      } else if (el.geometry.type === 'box' && el.category === 'Walls') {
        const [length, height, thickness] = el.geometry.args as number[];
        const pos = new THREE.Vector3(...el.geometry.position);
        const rot = new THREE.Euler(...(el.geometry.rotation || [0, 0, 0]));

        const halfL = length / 2;
        const halfT = thickness / 2;

        // 4 corners of the wall on the plane
        const corners = [
          new THREE.Vector3(-halfL, 0, -halfT),
          new THREE.Vector3(halfL, 0, -halfT),
          new THREE.Vector3(halfL, 0, halfT),
          new THREE.Vector3(-halfL, 0, halfT),
        ].map(p => {
          p.applyEuler(rot).add(pos);
          p.y = planeY;
          return p;
        });

        // Centerline endpoints
        const localP1 = new THREE.Vector3(-halfL, 0, 0).applyEuler(rot).add(pos);
        const localP2 = new THREE.Vector3(halfL, 0, 0).applyEuler(rot).add(pos);
        localP1.y = planeY;
        localP2.y = planeY;

        const allPoints = [...corners, localP1, localP2];

        if (snapConfig.vertices) {
          allPoints.forEach(p => {
            const dist = p.distanceTo(rawPoint);
            if (dist < minDistance) {
              minDistance = dist;
              bestPoint = p.clone();
              bestType = 'vertex';
            }
          });
        }

        const edges = [
          new THREE.Line3(corners[0], corners[1]),
          new THREE.Line3(corners[1], corners[2]),
          new THREE.Line3(corners[2], corners[3]),
          new THREE.Line3(corners[3], corners[0]),
          new THREE.Line3(localP1, localP2) // Centerline
        ];

        if (snapConfig.edgeCenter) {
          edges.forEach(edge => {
            const mid = edge.start.clone().lerp(edge.end, 0.5);
            const dist = mid.distanceTo(rawPoint);
            if (dist < minDistance) {
              minDistance = dist;
              bestPoint = mid.clone();
              bestType = 'edgeCenter';
            }
          });
        }

        if (snapConfig.edge && bestType !== 'vertex' && bestType !== 'edgeCenter') {
          edges.forEach(edge => {
            const closest = new THREE.Vector3();
            edge.closestPointToPoint(rawPoint, true, closest);
            const dist = closest.distanceTo(rawPoint);
            if (dist < minDistance) {
              minDistance = dist;
              bestPoint = closest.clone();
              bestType = 'edge';
            }
          });
        }
      }
    });
  }

  // 2. Grid Snap
  if (snapConfig.grid && bestType === null) {
    const gridSize = gridSpacing; // Use dynamic grid spacing
    const gridX = Math.round(rawPoint.x / gridSize) * gridSize;
    const gridZ = Math.round(rawPoint.z / gridSize) * gridSize;
    const gridPoint = new THREE.Vector3(gridX, planeY, gridZ);

    if (gridPoint.distanceTo(rawPoint) < minDistance) {
      bestPoint = gridPoint;
      bestType = 'grid';
    }
  }

  return { point: bestPoint, type: bestType };
}
