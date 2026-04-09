"use client"
import React, { useState } from 'react';
import { MousePointer2, Move, RotateCw, Maximize, Box, Cylinder, Square, Trash2, Settings, DoorOpen, AppWindow, Minus, Circle, Magnet, AlignLeft, AlignCenter, AlignRight, Group, Ungroup, Edit, Eye, EyeOff, LogOut, LassoSelect, BoxSelect, Wand2, Ruler, Type, Tag, Spline, CircleDashed, ArrowLeftRight, Upload, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

import { BimClass, WallType, LineType, BimElement, ScaleSettings, ArcConfig, SlabType } from '@/types/types';

interface ToolbarProps {
  transformMode: 'translate' | 'rotate' | 'scale' | null;
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale' | null) => void;
  activeTool: string | null;
  setActiveTool: (tool: string | null) => void;
  onAddElement: (type: 'wall' | 'slab' | 'column') => void;
  onDeleteSelected: () => void;
  onOpenSettings: () => void;
  onOpenScaleSettings: () => void;
  hasSelection: boolean;
  selectedElementIds?: string[];
  elements?: BimElement[];
  onGroup?: () => void;
  onUngroup?: () => void;
  editingGroupId?: string | null;
  onEnterGroupEdit?: (groupId: string) => void;
  onExitGroupEdit?: () => void;
  showOutsideGroup?: boolean;
  setShowOutsideGroup?: (show: boolean) => void;
  lineConfig?: {
    color: string;
    opacity: number;
    type: string;
    bimClass: string;
  };
  setLineConfig?: (config: any) => void;
  rectangleConfig?: {
    fillColor: string;
    lineColor: string;
    opacity: number;
    lineType: string;
    creationMode: 'corner' | 'center' | 'edgeCenter' | 'threePoints';
    bimClass: string;
  };
  setRectangleConfig?: (config: any) => void;
  arcConfig?: ArcConfig;
  setArcConfig?: (config: ArcConfig) => void;
  wallConfig?: {
    thickness: number;
    height: number;
    alignment: string;
    bimClass: string;
    wallTypeId?: string;
  };
  setWallConfig?: (config: any) => void;
  bimClasses?: BimClass[];
  wallTypes?: WallType[];
  slabTypes?: SlabType[];
  lineTypes?: LineType[];
  snapConfig?: any;
  setSnapConfig?: (config: any) => void;
  viewMode: '2D' | '3D';
  setViewMode: (mode: '2D' | '3D') => void;
  selectionMode: 'single' | 'rectangle' | 'lasso' | 'similar' | 'visibility';
  setSelectionMode: (mode: 'single' | 'rectangle' | 'lasso' | 'similar' | 'visibility') => void;
  scaleSettings: ScaleSettings;
  onImportIFC?: () => void;
  activeSlabTypeId?: string | null;
  setActiveSlabTypeId?: (id: string | null) => void;
  clippingPlaneActive?: boolean;
  setClippingPlaneActive?: (active: boolean) => void;
  clippingPlaneHeight?: number;
  setClippingPlaneHeight?: (height: number) => void;
}

export function Toolbar({
  transformMode,
  setTransformMode,
  activeTool,
  setActiveTool,
  onAddElement,
  onDeleteSelected,
  onOpenSettings,
  onOpenScaleSettings,
  hasSelection,
  selectedElementIds = [],
  elements = [],
  onGroup,
  onUngroup,
  editingGroupId,
  onEnterGroupEdit,
  onExitGroupEdit,
  showOutsideGroup,
  setShowOutsideGroup,
  lineConfig,
  setLineConfig,
  rectangleConfig,
  setRectangleConfig,
  arcConfig,
  setArcConfig,
  wallConfig,
  setWallConfig,
  bimClasses,
  wallTypes,
  slabTypes,
  lineTypes,
  snapConfig,
  setSnapConfig,
  viewMode,
  setViewMode,
  selectionMode,
  setSelectionMode,
  scaleSettings,
  onImportIFC,
  activeSlabTypeId,
  setActiveSlabTypeId,
  clippingPlaneActive,
  setClippingPlaneActive,
  clippingPlaneHeight,
  setClippingPlaneHeight
}: ToolbarProps) {
  const [toolGroup, setToolGroup] = useState<'bim' | 'cad'>('bim');
  const [showSelectionModes, setShowSelectionModes] = useState(false);

  const precision = scaleSettings.precision;
  const step = Math.pow(10, -precision);

  const handleToolClick = (tool: string) => {
    setActiveTool(activeTool === tool ? null : tool);
    setTransformMode(null); // Reset transform mode when selecting a drawing tool
    setShowSelectionModes(false);
  };

  const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
  const canGroup = selectedElementIds.length >= 2;
  const canUngroup = selectedElements.some(el => !!el.groupId);
  const selectedGroupId = selectedElements.length === 1 ? selectedElements[0].groupId : null;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
      {/* Top Center: Tool Group Selector */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-1 shadow-lg flex">
          <button
            onClick={() => { setToolGroup('bim'); setActiveTool(null); setShowSelectionModes(false); }}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
              toolGroup === 'bim' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            BIM Tools
          </button>
          <button
            onClick={() => { setToolGroup('cad'); setActiveTool(null); setShowSelectionModes(false); }}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
              toolGroup === 'cad' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            CAD Tools
          </button>
        </div>

        {/* Main Toolbar */}
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl p-1.5 shadow-2xl flex items-center gap-1">
          {editingGroupId && (
            <div className="flex items-center gap-1 border-r border-zinc-700 pr-2 mr-1">
              <div className="px-3 py-1.5 bg-indigo-500/10 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Editing Group</span>
              </div>
              <ToolButton
                icon={showOutsideGroup ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                label={showOutsideGroup ? "Hide Outside" : "Show Outside"}
                onClick={() => setShowOutsideGroup?.(!showOutsideGroup)}
              />
              <ToolButton
                icon={<LogOut className="w-4 h-4 text-orange-400" />}
                label="Exit Group Edit"
                onClick={onExitGroupEdit}
              />
            </div>
          )}

          <div className="flex items-center gap-1 border-r border-zinc-700 pr-2 mr-1">
            <ToolButton
              icon={<MousePointer2 className="w-4 h-4" />}
              label="Selection Tools"
              active={showSelectionModes || (transformMode === null && activeTool === null)}
              onClick={() => {
                setTransformMode(null);
                setActiveTool(null);
                setShowSelectionModes(!showSelectionModes);
              }}
            />
            <div className="w-px h-6 bg-zinc-700 mx-1"></div>
            <ToolButton
              icon={<Move className="w-4 h-4" />}
              label="Translate"
              active={transformMode === 'translate'}
              onClick={() => { setTransformMode('translate'); setActiveTool(null); setShowSelectionModes(false); }}
              disabled={!hasSelection}
            />
            <ToolButton
              icon={<RotateCw className="w-4 h-4" />}
              label="Rotate"
              active={transformMode === 'rotate'}
              onClick={() => { setTransformMode('rotate'); setActiveTool(null); setShowSelectionModes(false); }}
              disabled={!hasSelection}
            />
            <ToolButton
              icon={<Maximize className="w-4 h-4" />}
              label="Scale"
              active={transformMode === 'scale'}
              onClick={() => { setTransformMode('scale'); setActiveTool(null); setShowSelectionModes(false); }}
              disabled={!hasSelection}
            />
            <div className="w-px h-6 bg-zinc-700 mx-1"></div>
            <ToolButton
              icon={<Group className="w-4 h-4" />}
              label="Group"
              onClick={onGroup}
              disabled={!canGroup}
            />
            <ToolButton
              icon={<Ungroup className="w-4 h-4" />}
              label="Ungroup"
              onClick={onUngroup}
              disabled={!canUngroup}
            />
            {selectedGroupId && !editingGroupId && (
              <ToolButton
                icon={<Edit className="w-4 h-4" />}
                label="Edit Group"
                onClick={() => onEnterGroupEdit?.(selectedGroupId)}
              />
            )}
          </div>

          {/* Dynamic Tools */}
          {toolGroup === 'bim' && (
            <div className="flex items-center gap-1 border-r border-zinc-700 pr-2 mr-1">
              <ToolButton
                icon={<Box className="w-4 h-4" />}
                label="Draw Wall"
                active={activeTool === 'wall'}
                onClick={() => handleToolClick('wall')}
              />
              <ToolButton
                icon={<Square className="w-4 h-4" />}
                label="Draw Slab"
                active={activeTool === 'slab'}
                onClick={() => handleToolClick('slab')}
              />
              <ToolButton
                icon={<Cylinder className="w-4 h-4" />}
                label="Add Column"
                onClick={() => { onAddElement('column'); setActiveTool(null); setShowSelectionModes(false); }}
              />
              <ToolButton
                icon={<DoorOpen className="w-4 h-4" />}
                label="Add Door"
                onClick={() => { }}
              />
              <ToolButton
                icon={<AppWindow className="w-4 h-4" />}
                label="Add Window"
                onClick={() => { }}
              />
              <div className="w-px h-6 bg-zinc-700 mx-1"></div>
              <ToolButton
                icon={<Scissors className="w-4 h-4" />}
                label="Clipping Plane"
                active={clippingPlaneActive}
                onClick={() => setClippingPlaneActive?.(!clippingPlaneActive)}
              />
            </div>
          )}

          {toolGroup === 'cad' && (
            <div className="flex items-center gap-1 border-r border-zinc-700 pr-2 mr-1">
              <ToolButton
                icon={<Minus className="w-4 h-4" />}
                label="Draw Line"
                active={activeTool === 'line'}
                onClick={() => handleToolClick('line')}
              />
              <ToolButton
                icon={<Spline className="w-4 h-4" />}
                label="Draw Polyline"
                active={activeTool === 'polyline'}
                onClick={() => handleToolClick('polyline')}
              />
              <ToolButton
                icon={<CircleDashed className="w-4 h-4" />}
                label="Draw Arc"
                active={activeTool === 'arc'}
                onClick={() => handleToolClick('arc')}
              />
              <ToolButton
                icon={<Square className="w-4 h-4" />}
                label="Draw Rectangle"
                active={activeTool === 'rectangle'}
                onClick={() => handleToolClick('rectangle')}
              />
              <ToolButton
                icon={<Circle className="w-4 h-4" />}
                label="Draw Circle"
                active={activeTool === 'circle'}
                onClick={() => handleToolClick('circle')}
              />
              <ToolButton
                icon={<Ruler className="w-4 h-4" />}
                label="Measure"
                active={activeTool === 'measure'}
                onClick={() => handleToolClick('measure')}
              />
              <ToolButton
                icon={<Type className="w-4 h-4" />}
                label="Text"
                active={activeTool === 'text'}
                onClick={() => handleToolClick('text')}
              />
              <ToolButton
                icon={<Tag className="w-4 h-4" />}
                label="Tag"
                active={activeTool === 'tag'}
                onClick={() => handleToolClick('tag')}
              />
              <ToolButton
                icon={<ArrowLeftRight className="w-4 h-4" />}
                label="Offset"
                active={activeTool === 'offset'}
                onClick={() => handleToolClick('offset')}
              />
              <ToolButton
                icon={<AlignLeft className="w-4 h-4" />}
                label="Align"
                active={activeTool === 'align'}
                onClick={() => handleToolClick('align')}
              />
            </div>
          )}

          <div className="flex items-center gap-1">
            <ToolButton
              icon={<Trash2 className="w-4 h-4 text-red-400" />}
              label="Delete"
              onClick={onDeleteSelected}
              disabled={!hasSelection}
              danger
            />
            <div className="w-px h-6 bg-zinc-700 mx-1"></div>
            <ToolButton
              icon={<Upload className="w-4 h-4" />}
              label="Import IFC"
              onClick={onImportIFC}
            />
            <ToolButton
              icon={<Settings className="w-4 h-4" />}
              label="Model Configuration"
              onClick={onOpenSettings}
            />
            <ToolButton
              icon={<Ruler className="w-4 h-4" />}
              label="Working Scale"
              onClick={onOpenScaleSettings}
            />
            {snapConfig && setSnapConfig && (
              <>
                <div className="w-px h-6 bg-zinc-700 mx-1"></div>
                <ToolButton
                  icon={<Magnet className="w-4 h-4" />}
                  label="Toggle Snaps"
                  active={snapConfig.enabled}
                  onClick={() => setSnapConfig({ ...snapConfig, enabled: !snapConfig.enabled })}
                />
              </>
            )}
          </div>
        </div>

        {/* Secondary Toolbar (Tool Options) */}
        <div className="flex flex-col gap-2 w-full items-center">
          {showSelectionModes && (
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-1.5 shadow-2xl flex items-center gap-1 animate-in fade-in slide-in-from-top-2">
              <ToolButton
                icon={<MousePointer2 className="w-4 h-4" />}
                label="Single Selection"
                active={selectionMode === 'single'}
                onClick={() => setSelectionMode('single')}
              />
              <ToolButton
                icon={<div className="relative"><MousePointer2 className="w-4 h-4" /><Eye className="w-2 h-2 absolute -bottom-0.5 -right-0.5" /></div>}
                label="Visibility Selection"
                active={selectionMode === 'visibility'}
                onClick={() => setSelectionMode('visibility')}
              />
              <ToolButton
                icon={<BoxSelect className="w-4 h-4" />}
                label="Rectangle Selection"
                active={selectionMode === 'rectangle'}
                onClick={() => setSelectionMode('rectangle')}
              />
              <ToolButton
                icon={<LassoSelect className="w-4 h-4" />}
                label="Lasso Selection"
                active={selectionMode === 'lasso'}
                onClick={() => setSelectionMode('lasso')}
              />
              <ToolButton
                icon={<Wand2 className="w-4 h-4" />}
                label="Select Similar"
                active={selectionMode === 'similar'}
                onClick={() => setSelectionMode('similar')}
              />
            </div>
          )}

          {activeTool === 'rectangle' && rectangleConfig && setRectangleConfig && (
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-2 shadow-2xl flex items-center gap-4 text-sm text-zinc-300 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 border-r border-zinc-700 pr-3">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mr-1">Mode</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setRectangleConfig({ ...rectangleConfig, creationMode: 'corner' })}
                    className={cn("p-1.5 rounded transition-colors", rectangleConfig.creationMode === 'corner' ? "bg-indigo-600 text-white" : "hover:bg-zinc-800 text-zinc-400")}
                    title="Corner to Corner"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="3" cy="3" r="1.5" fill="currentColor" />
                      <circle cx="21" cy="21" r="1.5" fill="currentColor" />
                      <line x1="3" y1="3" x2="21" y2="21" strokeDasharray="2 2" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setRectangleConfig({ ...rectangleConfig, creationMode: 'center' })}
                    className={cn("p-1.5 rounded transition-colors", rectangleConfig.creationMode === 'center' ? "bg-indigo-600 text-white" : "hover:bg-zinc-800 text-zinc-400")}
                    title="Center to Corner"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="21" cy="21" r="1.5" fill="currentColor" />
                      <line x1="12" y1="12" x2="21" y2="21" strokeDasharray="2 2" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setRectangleConfig({ ...rectangleConfig, creationMode: 'edgeCenter' })}
                    className={cn("p-1.5 rounded transition-colors", rectangleConfig.creationMode === 'edgeCenter' ? "bg-indigo-600 text-white" : "hover:bg-zinc-800 text-zinc-400")}
                    title="Edge Center to Corner"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="12" cy="21" r="1.5" fill="currentColor" />
                      <circle cx="21" cy="3" r="1.5" fill="currentColor" />
                      <line x1="12" y1="21" x2="21" y2="3" strokeDasharray="2 2" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setRectangleConfig({ ...rectangleConfig, creationMode: 'threePoints' })}
                    className={cn("p-1.5 rounded transition-colors", rectangleConfig.creationMode === 'threePoints' ? "bg-indigo-600 text-white" : "hover:bg-zinc-800 text-zinc-400")}
                    title="3 Points"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="2 2" />
                      <circle cx="3" cy="21" r="1.5" fill="currentColor" />
                      <circle cx="21" cy="21" r="1.5" fill="currentColor" />
                      <circle cx="21" cy="3" r="1.5" fill="currentColor" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Fill</span>
                <input
                  type="color"
                  value={rectangleConfig.fillColor}
                  onChange={(e) => setRectangleConfig({ ...rectangleConfig, fillColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                />
              </div>

              <div className="w-px h-4 bg-zinc-700"></div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Opacity</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rectangleConfig.opacity}
                  onChange={(e) => setRectangleConfig({ ...rectangleConfig, opacity: parseInt(e.target.value) })}
                  className="w-20 accent-indigo-500"
                />
                <span className="text-xs w-8">{rectangleConfig.opacity}%</span>
              </div>

              <div className="w-px h-4 bg-zinc-700"></div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Line Color</span>
                <input
                  type="color"
                  value={rectangleConfig.lineColor}
                  onChange={(e) => setRectangleConfig({ ...rectangleConfig, lineColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                />
              </div>

              <div className="w-px h-4 bg-zinc-700"></div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Line Type</span>
                <select
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={rectangleConfig.lineType}
                  onChange={(e) => setRectangleConfig({ ...rectangleConfig, lineType: e.target.value })}
                >
                  <option value="Solid">Solid</option>
                  <option value="Dashed">Dashed</option>
                  <option value="Dotted">Dotted</option>
                  {lineTypes && lineTypes.length > 0 && (
                    <optgroup label="Custom Types">
                      {lineTypes.map(lt => (
                        <option key={lt.id} value={lt.id}>{lt.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="w-px h-4 bg-zinc-700"></div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Group</span>
                <select
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={rectangleConfig.bimClass}
                  onChange={(e) => setRectangleConfig({ ...rectangleConfig, bimClass: e.target.value })}
                >
                  <option value="00">None</option>
                  {bimClasses?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTool === 'arc' && arcConfig && setArcConfig && (
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-2 shadow-2xl flex items-center gap-4 text-sm text-zinc-300 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 border-r border-zinc-700 pr-3">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mr-1">Mode</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setArcConfig({ ...arcConfig, creationMode: 'centerRadiusPoints' })} className={cn("p-1.5 rounded transition-colors", arcConfig.creationMode === 'centerRadiusPoints' ? "bg-indigo-600 text-white" : "hover:bg-zinc-800 text-zinc-400")} title="Center-Radius-Points"><CircleDashed className="w-4 h-4" /></button>
                  <button onClick={() => setArcConfig({ ...arcConfig, creationMode: 'startChordEnd' })} className={cn("p-1.5 rounded transition-colors", arcConfig.creationMode === 'startChordEnd' ? "bg-indigo-600 text-white" : "hover:bg-zinc-800 text-zinc-400")} title="Start-Chord-End"><CircleDashed className="w-4 h-4" /></button>
                  <button onClick={() => setArcConfig({ ...arcConfig, creationMode: 'startTangentEnd' })} className={cn("p-1.5 rounded transition-colors", arcConfig.creationMode === 'startTangentEnd' ? "bg-indigo-600 text-white" : "hover:bg-zinc-800 text-zinc-400")} title="Start-Tangent-End"><CircleDashed className="w-4 h-4" /></button>
                  <button onClick={() => setArcConfig({ ...arcConfig, creationMode: 'centerStartEnd' })} className={cn("p-1.5 rounded transition-colors", arcConfig.creationMode === 'centerStartEnd' ? "bg-indigo-600 text-white" : "hover:bg-zinc-800 text-zinc-400")} title="Center-Start-End"><CircleDashed className="w-4 h-4" /></button>
                </div>
              </div>
              {/* Add other arc configuration options here (color, opacity, etc.) */}
            </div>
          )}

          {activeTool === 'line' && lineConfig && setLineConfig && (
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-2 shadow-2xl flex items-center gap-4 text-sm text-zinc-300 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Color</span>
                <input
                  type="color"
                  value={lineConfig.color}
                  onChange={(e) => setLineConfig({ ...lineConfig, color: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                />
              </div>

              <div className="w-px h-4 bg-zinc-700"></div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Opacity</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lineConfig.opacity}
                  onChange={(e) => setLineConfig({ ...lineConfig, opacity: parseInt(e.target.value) })}
                  className="w-20 accent-indigo-500"
                />
                <span className="text-xs w-8">{lineConfig.opacity}%</span>
              </div>

              <div className="w-px h-4 bg-zinc-700"></div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Type</span>
                <select
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={lineConfig.type}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLineConfig({ ...lineConfig, type: val });

                    // If a custom line type is selected, update color to match
                    if (val !== 'Solid' && val !== 'Dashed' && val !== 'Dotted') {
                      const lt = lineTypes?.find(t => t.id === val);
                      if (lt) {
                        setLineConfig((prev: any) => ({ ...prev, type: val, color: lt.color }));
                      }
                    }
                  }}
                >
                  <option value="Solid">Solid</option>
                  <option value="Dashed">Dashed</option>
                  <option value="Dotted">Dotted</option>
                  {lineTypes && lineTypes.length > 0 && (
                    <optgroup label="Custom Types">
                      {lineTypes.map(lt => (
                        <option key={lt.id} value={lt.id}>{lt.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="w-px h-4 bg-zinc-700"></div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Group/Class</span>
                <select
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={lineConfig.bimClass}
                  onChange={(e) => setLineConfig({ ...lineConfig, bimClass: e.target.value })}
                >
                  <option value="00">None</option>
                  {bimClasses?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTool === 'wall' && wallConfig && setWallConfig && (
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-2 shadow-2xl flex items-center gap-4 text-sm text-zinc-300 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Type</span>
                <select
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-32"
                  value={wallConfig.wallTypeId || ''}
                  onChange={(e) => {
                    const typeId = e.target.value;
                    const selectedType = wallTypes?.find(wt => wt.id === typeId);
                    setWallConfig({
                      ...wallConfig,
                      wallTypeId: typeId || undefined,
                      thickness: selectedType ? selectedType.layers.reduce((sum, l) => sum + l.thickness, 0) : wallConfig.thickness,
                      height: selectedType ? selectedType.height : wallConfig.height
                    });
                  }}
                >
                  <option value="">Custom</option>
                  {wallTypes?.map(wt => (
                    <option key={wt.id} value={wt.id}>{wt.name}</option>
                  ))}
                </select>
              </div>

              <div className="w-px h-4 bg-zinc-700"></div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Thickness (m)</span>
                <input
                  type="number"
                  step={step}
                  min="0.01"
                  value={wallConfig.thickness.toFixed(precision)}
                  disabled={!!wallConfig.wallTypeId}
                  onChange={(e) => setWallConfig({ ...wallConfig, thickness: parseFloat(e.target.value) || 0.15 })}
                  className="w-16 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="w-px h-4 bg-zinc-700"></div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Height (m)</span>
                <input
                  type="number"
                  step={step}
                  min="0.1"
                  value={wallConfig.height.toFixed(precision)}
                  disabled={!!wallConfig.wallTypeId}
                  onChange={(e) => setWallConfig({ ...wallConfig, height: parseFloat(e.target.value) || 3.0 })}
                  className="w-16 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="w-px h-4 bg-zinc-700"></div>

              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-zinc-500 mr-1">Alignment</span>
                <button
                  onClick={() => setWallConfig({ ...wallConfig, alignment: 'left' })}
                  className={cn("p-1 rounded", wallConfig.alignment === 'left' ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200")}
                  title="Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setWallConfig({ ...wallConfig, alignment: 'center' })}
                  className={cn("p-1 rounded", wallConfig.alignment === 'center' ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200")}
                  title="Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setWallConfig({ ...wallConfig, alignment: 'right' })}
                  className={cn("p-1 rounded", wallConfig.alignment === 'right' ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200")}
                  title="Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-4 bg-zinc-700"></div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Group/Class</span>
                <select
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={wallConfig.bimClass}
                  onChange={(e) => setWallConfig({ ...wallConfig, bimClass: e.target.value })}
                >
                  <option value="00">None</option>
                  {bimClasses?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTool === 'slab' && setActiveSlabTypeId && (
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-2 shadow-2xl flex items-center gap-4 text-sm text-zinc-300 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Slab Type</span>
                <select
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
                  value={activeSlabTypeId || ''}
                  onChange={(e) => setActiveSlabTypeId(e.target.value || null)}
                >
                  <option value="" disabled>Select Slab Type...</option>
                  {slabTypes?.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-zinc-500 italic">
                Click points to draw polygon. Press Enter or click first point to finish.
              </div>
            </div>
          )}

          {snapConfig?.enabled && setSnapConfig && (
            <div className="bg-zinc-900/90 backdrop-blur-md border border-indigo-500/30 rounded-lg p-1.5 shadow-2xl flex items-center gap-1 text-sm text-zinc-300 animate-in fade-in slide-in-from-top-2 flex-wrap justify-center max-w-3xl">
              <span className="text-xs font-semibold text-indigo-400 px-2 uppercase tracking-wider">Snaps</span>
              <div className="w-px h-4 bg-zinc-700 mx-1"></div>
              <SnapToggle label="Grid" active={snapConfig.grid} onClick={() => setSnapConfig({ ...snapConfig, grid: !snapConfig.grid })} />
              <SnapToggle label="Vertices" active={snapConfig.vertices} onClick={() => setSnapConfig({ ...snapConfig, vertices: !snapConfig.vertices })} />
              <SnapToggle label="Edge" active={snapConfig.edge} onClick={() => setSnapConfig({ ...snapConfig, edge: !snapConfig.edge })} />
              <SnapToggle label="Edge Center" active={snapConfig.edgeCenter} onClick={() => setSnapConfig({ ...snapConfig, edgeCenter: !snapConfig.edgeCenter })} />
              <SnapToggle label="Face" active={snapConfig.face} onClick={() => setSnapConfig({ ...snapConfig, face: !snapConfig.face })} />
              <SnapToggle label="Volume" active={snapConfig.volume} onClick={() => setSnapConfig({ ...snapConfig, volume: !snapConfig.volume })} />
              <SnapToggle label="Point" active={snapConfig.point} onClick={() => setSnapConfig({ ...snapConfig, point: !snapConfig.point })} />
              <SnapToggle label="Distance" active={snapConfig.distance} onClick={() => setSnapConfig({ ...snapConfig, distance: !snapConfig.distance })} />
              <SnapToggle label="Angle" active={snapConfig.angle} onClick={() => setSnapConfig({ ...snapConfig, angle: !snapConfig.angle })} />
            </div>
          )}

          {clippingPlaneActive && setClippingPlaneHeight && (
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-3 shadow-2xl flex items-center gap-4 text-sm text-zinc-300 animate-in fade-in slide-in-from-top-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Scissors className="w-4 h-4" /> Clipping Plane Height
              </span>
              <input
                type="range"
                min="-10"
                max="50"
                step="0.1"
                value={clippingPlaneHeight || 0}
                onChange={(e) => setClippingPlaneHeight(parseFloat(e.target.value))}
                className="w-48 accent-indigo-500"
              />
              <span className="w-12 text-right font-mono text-xs bg-zinc-800 px-2 py-1 rounded">{clippingPlaneHeight?.toFixed(1)}m</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Right: View Mode Toggle */}
      <div className={cn(
        "absolute top-4 z-10 pointer-events-auto transition-all duration-300",
        (selectedElementIds?.length ?? 0) > 0 ? "right-[350px]" : "right-4"
      )}>
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-1 shadow-lg flex">
          <button
            onClick={() => setViewMode('2D')}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
              viewMode === '2D' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            2D
          </button>
          <button
            onClick={() => setViewMode('3D')}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
              viewMode === '3D' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            3D
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ icon, label, active, onClick, disabled, danger }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "p-2 rounded-md transition-all duration-200 flex items-center justify-center",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-800 cursor-pointer",
        active ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-400",
        !disabled && !active && !danger && "hover:text-zinc-100",
        danger && !disabled && "hover:bg-red-500/20 hover:text-red-300"
      )}
    >
      {icon}
    </button>
  );
}

function SnapToggle({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-1 text-xs rounded transition-colors border",
        active
          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
          : "bg-transparent text-zinc-400 border-transparent hover:bg-zinc-800 hover:text-zinc-200"
      )}
    >
      {label}
    </button>
  );
}
