"use client"
import React, { useEffect, useRef } from 'react';


interface PaperDrawingLayerProps {
  activeTool: string | null;
  onAddElement: (type: string, data: any) => void;
}

export function PaperDrawingLayer({ activeTool, onAddElement }: PaperDrawingLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    let paperObj: any;

    const initPaper = async () => {
      const paperMod = await import('paper/dist/paper-full');
      const paper = paperMod.default;
      paperObj = paper;

      if (!canvasRef.current) return;
      paper.setup(canvasRef.current);

      const tool = new paper.Tool();
      tool.activate();

      let currentPath: any = null;
      let circleCenter: any = null;
      let currentCircle: any = null;

      tool.onMouseDown = (event: any) => {
        if (activeTool === 'line') {
          currentPath = new paper.Path();
          currentPath.strokeColor = new paper.Color('white');
          currentPath.add(event.point);
        } else if (activeTool === 'circle') {
          circleCenter = event.point;
          currentCircle = new paper.Path.Circle(circleCenter, 0);
          currentCircle.strokeColor = new paper.Color('white');
        }
      };

      tool.onMouseDrag = (event: any) => {
        if (activeTool === 'line' && currentPath) {
          currentPath.add(event.point);
        } else if (activeTool === 'circle' && circleCenter) {
          const radius = circleCenter.getDistance(event.point);
          currentCircle?.remove();
          currentCircle = new paper.Path.Circle(circleCenter, radius);
          currentCircle.strokeColor = new paper.Color('white');
        }
      };

      tool.onMouseUp = (event: any) => {
        if (activeTool === 'line' && currentPath) {
          currentPath.add(event.point);
          onAddElement('line', currentPath.exportJSON());
          currentPath = null;
        } else if (activeTool === 'circle' && currentCircle) {
          onAddElement('circle', currentCircle.exportJSON());
          currentCircle = null;
          circleCenter = null;
        }
      };
    };

    initPaper();

    return () => {
      if (paperObj && paperObj.project) {
        paperObj.project.remove();
      }
    };
  }, [activeTool, onAddElement]);

  return <canvas ref={canvasRef} className={`absolute inset-0 z-10 ${activeTool ? 'pointer-events-auto' : 'pointer-events-none'}`} />;
}
