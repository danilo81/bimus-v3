import { BimElement } from '@/types/types';

export const sampleBimModel: BimElement[] = [
  // Foundation
  {
    id: 'FND-001',
    category: 'Foundation',
    name: 'Main Slab',
    level: 'L00',
    material: 'Reinforced Concrete',
    volume: 150.0,
    area: 300.0,
    color: '#808080',
    geometry: {
      type: 'box',
      args: [20, 0.5, 15],
      position: [0, -0.25, 0],
    },
  },
  // Columns Level 1
  ...Array.from({ length: 4 }).flatMap((_, i) =>
    Array.from({ length: 3 }).map((_, j) => ({
      id: `COL-L01-${i}-${j}`,
      category: 'Structural Columns',
      name: 'Rectangular Column 400x400',
      level: 'L01',
      material: 'Concrete C30/37',
      volume: 0.64,
      area: 1.6,
      color: '#A9A9A9',
      geometry: {
        type: 'box' as const,
        args: [0.4, 4, 0.4] as [number, number, number],
        position: [-8 + i * 5.33, 2, -6 + j * 6] as [number, number, number],
      },
    }))
  ),
  // Floor L01
  {
    id: 'FLR-001',
    category: 'Floors',
    name: 'Slab 200mm',
    level: 'L01',
    material: 'Concrete C25/30',
    volume: 60.0,
    area: 300.0,
    color: '#909090',
    geometry: {
      type: 'box',
      args: [20, 0.2, 15],
      position: [0, 4.1, 0],
    },
  },
  // Columns Level 2
  ...Array.from({ length: 4 }).flatMap((_, i) =>
    Array.from({ length: 3 }).map((_, j) => ({
      id: `COL-L02-${i}-${j}`,
      category: 'Structural Columns',
      name: 'Rectangular Column 400x400',
      level: 'L02',
      material: 'Concrete C30/37',
      volume: 0.64,
      area: 1.6,
      color: '#A9A9A9',
      geometry: {
        type: 'box' as const,
        args: [0.4, 4, 0.4] as [number, number, number],
        position: [-8 + i * 5.33, 6.2, -6 + j * 6] as [number, number, number],
      },
    }))
  ),
  // Roof
  {
    id: 'ROF-001',
    category: 'Roofs',
    name: 'Flat Roof Slab 200mm',
    level: 'Roof',
    material: 'Concrete C25/30',
    volume: 60.0,
    area: 300.0,
    color: '#909090',
    geometry: {
      type: 'box',
      args: [20, 0.2, 15],
      position: [0, 8.3, 0],
    },
  },
  // Walls (Exterior)
  {
    id: 'WAL-001',
    category: 'Walls',
    name: 'Exterior Wall 200mm',
    level: 'L01',
    material: 'Brickwork',
    volume: 12.0,
    area: 60.0,
    color: '#B22222',
    geometry: {
      type: 'box',
      args: [20, 4, 0.2],
      position: [0, 2, -7.4],
    },
  },
  {
    id: 'WAL-002',
    category: 'Walls',
    name: 'Exterior Wall 200mm',
    level: 'L01',
    material: 'Brickwork',
    volume: 12.0,
    area: 60.0,
    color: '#B22222',
    geometry: {
      type: 'box',
      args: [20, 4, 0.2],
      position: [0, 2, 7.4],
    },
  },
  {
    id: 'WAL-003',
    category: 'Walls',
    name: 'Exterior Wall 200mm',
    level: 'L01',
    material: 'Brickwork',
    volume: 9.0,
    area: 45.0,
    color: '#B22222',
    geometry: {
      type: 'box',
      args: [0.2, 4, 14.6],
      position: [-9.9, 2, 0],
    },
  },
  // Glass Curtain Wall
  {
    id: 'CW-001',
    category: 'Curtain Wall',
    name: 'Glass Facade',
    level: 'L02',
    material: 'Glass',
    volume: 1.5,
    area: 60.0,
    color: '#87CEFA',
    geometry: {
      type: 'box',
      args: [20, 4, 0.05],
      position: [0, 6.2, 7.475],
    },
  },
];
