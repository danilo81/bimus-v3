"use client"
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Camera, Building2, Plus, ChevronDown, ChevronRight, Box, Sun, Settings, Layers, Square, Cylinder, PanelLeftClose, PanelLeftOpen, Eye, EyeOff, Scan, Folder, FolderOpen, Component, GripVertical, Minus, Library, AppWindow, DoorOpen, Type, Trash2, MessageSquare } from 'lucide-react';
import { BimElement, BimClass, WallType, LineType, Level, ScaleSettings, SlabType, SavedView, IssueNote } from '@/types/types';
import { cn } from '@/lib/utils';
import { WallTypeModal } from './WallTypeModal';
import { LineTypeModal } from './LineTypeModal';
import { SlabTypeModal } from './SlabTypeModal';

interface LeftSidebarProps {
  elements: BimElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<BimElement>) => void;
  bimClasses: BimClass[];
  onAddBimClass: (newClass: BimClass) => void;
  classVisibility: Record<string, 'visible' | 'hidden' | 'xray'>;
  onUpdateClassVisibility: (bimClassId: string, visibility: 'visible' | 'hidden' | 'xray') => void;
  onReorderBimClasses: (newClasses: BimClass[]) => void;
  levelVisibility: Record<string, 'visible' | 'hidden' | 'xray'>;
  onUpdateLevelVisibility: (level: string, visibility: 'visible' | 'hidden' | 'xray') => void;
  activeLevel: string;
  onSelectLevel: (level: string) => void;
  levels: Level[];
  onOpenLevelSettings: (levelId: string) => void;
  wallTypes: WallType[];
  setWallTypes: (types: WallType[]) => void;
  slabTypes: SlabType[];
  setSlabTypes: (types: SlabType[]) => void;
  lineTypes: LineType[];
  setLineTypes: (types: LineType[]) => void;
  scaleSettings: ScaleSettings;
  savedViews: SavedView[];
  setSavedViews: (views: SavedView[]) => void;
  onSaveViewRequest?: () => void;
  onRestoreView?: (view: SavedView) => void;
  issueNotes?: IssueNote[];
  setIssueNotes?: (notes: IssueNote[]) => void;
  onCreateIssue?: (data: { elementId: string; elementName?: string; title: string; description: string }) => Promise<boolean>;
}

const VisibilityToggle = ({ visibility = 'visible', onChange }: { visibility?: 'visible' | 'hidden' | 'xray', onChange: (v: 'visible' | 'hidden' | 'xray') => void }) => {
  const cycle = () => {
    if (visibility === 'visible') onChange('hidden');
    else if (visibility === 'hidden') onChange('xray');
    else onChange('visible');
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); cycle(); }}
      className={cn(
        "p-1 hover:bg-zinc-700 rounded transition-colors",
        visibility === 'visible' ? "text-zinc-400 hover:text-zinc-200" :
          visibility === 'hidden' ? "text-red-400 hover:text-red-300" :
            "text-indigo-400 hover:text-indigo-300"
      )}
      title={`Visibility: ${visibility}`}
    >
      {visibility === 'visible' && <Eye className="w-3.5 h-3.5" />}
      {visibility === 'hidden' && <EyeOff className="w-3.5 h-3.5" />}
      {visibility === 'xray' && <Scan className="w-3.5 h-3.5" />}
    </button>
  );
};

export function LeftSidebar({ elements, selectedId, onSelect, onUpdateElement, bimClasses, onAddBimClass, classVisibility, onUpdateClassVisibility, onReorderBimClasses, levelVisibility, onUpdateLevelVisibility, activeLevel, onSelectLevel, levels, onOpenLevelSettings, wallTypes, setWallTypes, slabTypes, setSlabTypes, lineTypes, setLineTypes, scaleSettings, savedViews, setSavedViews, onSaveViewRequest, onRestoreView, issueNotes = [], setIssueNotes, onCreateIssue }: LeftSidebarProps) {
  const [expandedClasses, setExpandedClasses] = useState<string[]>(['00', '1 PROYECCIONES', '2 ARQUITECTURA', '3 ESTRUCTURAS']);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [creatingChildFor, setCreatingChildFor] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [mainView, setMainView] = useState<'project' | 'classes' | 'library' | 'views' | 'issues'>('project');
  const [draggedClass, setDraggedClass] = useState<string | null>(null);
  const [dragOverClass, setDragOverClass] = useState<string | null>(null);

  // Issues states
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueDescription, setNewIssueDescription] = useState('');

  // Library states
  const [activeLibraryCategory, setActiveLibraryCategory] = useState<string | null>(null);
  const [isWallTypeModalOpen, setIsWallTypeModalOpen] = useState(false);
  const [editingWallType, setEditingWallType] = useState<WallType | undefined>(undefined);
  const [isLineTypeModalOpen, setIsLineTypeModalOpen] = useState(false);
  const [editingLineType, setEditingLineType] = useState<LineType | undefined>(undefined);
  const [isSlabTypeModalOpen, setIsSlabTypeModalOpen] = useState(false);
  const [editingSlabType, setEditingSlabType] = useState<SlabType | undefined>(undefined);

  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleClass = (bimClass: string) => {
    setExpandedClasses(prev =>
      prev.includes(bimClass) ? prev.filter(c => c !== bimClass) : [...prev, bimClass]
    );
  };

  const handleCreateClass = (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (newClassName.trim() && !bimClasses.find(c => c.name === newClassName.trim())) {
      const newClass: BimClass = {
        id: `class-${Date.now()}`,
        name: newClassName.trim(),
        parentId
      };
      onAddBimClass(newClass);
      setExpandedClasses(prev => [...prev, newClass.id]);
      setNewClassName('');
      setIsCreatingClass(false);
      setCreatingChildFor(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, bimClass: string) => {
    e.dataTransfer.setData('text/plain', bimClass);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedClass(bimClass);
  };

  const handleDragOver = (e: React.DragEvent, targetClass: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedClass && draggedClass !== targetClass) {
      setDragOverClass(targetClass);
    }
  };

  const handleDragLeave = () => {
    setDragOverClass(null);
  };

  const handleDrop = (e: React.DragEvent, targetClassId: string) => {
    e.preventDefault();
    setDragOverClass(null);
    const sourceClassId = e.dataTransfer.getData('text/plain');
    if (sourceClassId && sourceClassId !== targetClassId) {
      const newClasses = [...bimClasses];
      const sourceIndex = newClasses.findIndex(c => c.id === sourceClassId);
      const targetIndex = newClasses.findIndex(c => c.id === targetClassId);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        const targetItem = newClasses[targetIndex];
        const [sourceClass] = newClasses.splice(sourceIndex, 1);

        // Recalculate target index after splice
        const newTargetIndex = newClasses.findIndex(c => c.id === targetClassId);

        // If holding shift, make it a child, otherwise just reorder and adopt parent
        if (e.shiftKey) {
          sourceClass.parentId = targetClassId;
          newClasses.splice(newTargetIndex + 1, 0, sourceClass);
          setExpandedClasses(prev => prev.includes(targetClassId) ? prev : [...prev, targetClassId]);
        } else {
          sourceClass.parentId = targetItem.parentId;
          newClasses.splice(newTargetIndex, 0, sourceClass);
        }

        onReorderBimClasses(newClasses);
      }
    }
    setDraggedClass(null);
  };

  const handleDragEnd = () => {
    setDraggedClass(null);
    setDragOverClass(null);
  };

  const getIconForCategory = (category: string) => {
    if (category === 'Walls') return <Box className="w-4 h-4" />;
    if (category === 'Floors') return <Square className="w-4 h-4" />;
    if (category === 'Structural Columns') return <Cylinder className="w-4 h-4" />;
    if (category === 'Lines') return <Minus className="w-4 h-4" />;
    return <Box className="w-4 h-4" />;
  };

  const renderClassTree = (parentId: string | null, level: number = 0) => {
    const children = bimClasses.filter(c => c.parentId === parentId);
    return children.map(bimClass => {
      const classElements = elements.filter(e => (e.bimClass || '00') === bimClass.id);
      const isExpanded = expandedClasses.includes(bimClass.id);
      const isDragging = draggedClass === bimClass.id;
      const isDragOver = dragOverClass === bimClass.id;

      return (
        <div
          key={bimClass.id}
          className={cn(
            "space-y-0.5 transition-all",
            isDragging ? "opacity-50" : "opacity-100",
            isDragOver ? "border-t-2 border-indigo-500" : "border-t-2 border-transparent"
          )}
          style={{ marginLeft: level > 0 ? '12px' : '0' }}
          draggable
          onDragStart={(e) => handleDragStart(e, bimClass.id)}
          onDragOver={(e) => handleDragOver(e, bimClass.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, bimClass.id)}
          onDragEnd={handleDragEnd}
        >
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors group",
              isExpanded ? "bg-zinc-800/50" : "hover:bg-zinc-800/30"
            )}
            onClick={() => toggleClass(bimClass.id)}
          >
            <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <GripVertical className="w-4 h-4" />
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span className={cn(
              "font-medium flex-1 truncate",
              isExpanded ? "text-white" : "text-zinc-300"
            )}>{bimClass.name}</span>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); setCreatingChildFor(bimClass.id); setIsCreatingClass(true); setExpandedClasses(prev => prev.includes(bimClass.id) ? prev : [...prev, bimClass.id]); }}
                className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                title="Add subclass"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <VisibilityToggle
              visibility={classVisibility[bimClass.id] || 'visible'}
              onChange={(v) => onUpdateClassVisibility(bimClass.id, v)}
            />
            <span className="text-xs text-zinc-500 font-mono bg-zinc-800/80 px-1.5 py-0.5 rounded">{classElements.length}</span>
          </div>

          {isExpanded && (
            <div className="ml-6 border-l border-zinc-800/50 pl-2 py-1 space-y-1">
              {creatingChildFor === bimClass.id && (
                <form onSubmit={(e) => handleCreateClass(e, bimClass.id)} className="flex items-center gap-2 px-2 py-1">
                  <Folder className="w-4 h-4 text-indigo-400/50" />
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Subclass name..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                    autoFocus
                    onBlur={() => {
                      if (!newClassName.trim()) {
                        setIsCreatingClass(false);
                        setCreatingChildFor(null);
                      }
                    }}
                  />
                </form>
              )}
              {renderClassTree(bimClass.id, level + 1)}
              {classElements.map(element => (
                <div
                  key={element.id}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded transition-colors group relative",
                    selectedId === element.id
                      ? "bg-indigo-500/10 text-indigo-300"
                      : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <div
                    className="flex items-center gap-2 flex-1 cursor-pointer truncate"
                    onClick={() => onSelect(element.id)}
                  >
                    <div className="text-zinc-500 shrink-0">
                      {getIconForCategory(element.category)}
                    </div>
                    <span className="truncate text-xs">{element.name}</span>
                  </div>

                  <div className={cn("flex items-center gap-1 transition-opacity", element.visibility && element.visibility !== 'visible' ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                    <VisibilityToggle
                      visibility={element.visibility || 'visible'}
                      onChange={(v) => onUpdateElement(element.id, { visibility: v })}
                    />
                    {/* Move to class dropdown */}
                    <select
                      className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-20 cursor-pointer"
                      value={element.bimClass || '00'}
                      onChange={(e) => onUpdateElement(element.id, { bimClass: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      title="Move to class"
                    >
                      {bimClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "absolute top-4 left-4 bottom-4 flex z-20 pointer-events-auto shadow-2xl transition-all duration-300 rounded-xl overflow-hidden border border-zinc-800",
        isCollapsed ? "w-12" : "w-[336px]"
      )}>
      {/* Thin Rail */}
      <div className="w-12 bg-[#141414] border-r border-zinc-800 flex flex-col items-center py-4 justify-between shrink-0">
        <div className="space-y-4 flex flex-col items-center w-full">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors mb-2"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
          <div className="w-8 h-px bg-zinc-800"></div>
          <button
            onClick={() => { setMainView('project'); setIsCollapsed(false); }}
            className={cn("p-2 rounded-lg transition-colors", mainView === 'project' ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-500 hover:text-zinc-300")}
            title="Project"
          >
            <Layers className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setMainView('classes'); setIsCollapsed(false); }}
            className={cn("p-2 rounded-lg transition-colors", mainView === 'classes' ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-500 hover:text-zinc-300")}
            title="Group Classes"
          >
            <Component className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setMainView('library'); setIsCollapsed(false); }}
            className={cn("p-2 rounded-lg transition-colors", mainView === 'library' ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-500 hover:text-zinc-300")}
            title="Library"
          >
            <Library className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setMainView('views'); setIsCollapsed(false); }}
            className={cn("p-2 rounded-lg transition-colors", mainView === 'views' ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-500 hover:text-zinc-300")}
            title="Saved Views"
          >
            <Camera className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setMainView('issues'); setIsCollapsed(false); }}
            className={cn("p-2 rounded-lg transition-colors", mainView === 'issues' ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-500 hover:text-zinc-300")}
            title="Issues Notes"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
        <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors" title="Settings">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Panel */}
      <div className={cn(
        "w-72 bg-[#1e1e1e]/95 backdrop-blur-md flex flex-col text-sm text-zinc-300 shrink-0 transition-opacity duration-300",
        isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
        {mainView === 'project' ? (
          <>
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-zinc-800/50">
              <div className="flex items-center gap-2 text-zinc-400 font-medium">
                <MapPin className="w-4 h-4" />
                <span>Site</span>
              </div>
              <Camera className="w-4 h-4 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" />
            </div>

            <div className="p-4 pb-2 flex items-center gap-2 text-white font-semibold text-base">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Building</span>
            </div>

            {/* Levels */}
            <div className="px-2 space-y-0.5 border-b border-zinc-800/50 pb-4">
              <div className="flex items-center gap-2 px-2 py-1.5 text-zinc-400 hover:bg-zinc-800/50 rounded cursor-pointer transition-colors ml-4">
                <Plus className="w-4 h-4" />
                <span>Add level</span>
              </div>

              {levels.map(level => (
                <div key={level.id}>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors group",
                      activeLevel === level.id
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
                    )}
                    onClick={() => onSelectLevel(level.id)}
                  >
                    <Layers className={cn("w-4 h-4", activeLevel === level.id ? "text-indigo-400" : "text-zinc-500")} />
                    <span className="font-medium flex-1">{level.name}</span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenLevelSettings(level.id); }}
                        className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                        title="Level Settings"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <VisibilityToggle
                        visibility={levelVisibility[level.id] || 'visible'}
                        onChange={(v) => onUpdateLevelVisibility(level.id, v)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : mainView === 'classes' ? (
          <>
            {/* Classes View */}
            <div className="p-4 border-b border-zinc-800/50 flex items-center gap-2 text-white font-semibold text-base">
              <Component className="w-5 h-5 text-indigo-400" />
              <span>Group Classes</span>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4 mt-2 space-y-1">
              <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <span>All Classes</span>
                <button
                  onClick={() => setIsCreatingClass(true)}
                  className="hover:text-zinc-300 p-1 rounded hover:bg-zinc-800"
                  title="New Class"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {isCreatingClass && creatingChildFor === null && (
                <form onSubmit={(e) => handleCreateClass(e, null)} className="px-3 py-2 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Class name..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                    autoFocus
                    onBlur={() => {
                      if (!newClassName.trim()) setIsCreatingClass(false);
                    }}
                  />
                </form>
              )}

              {renderClassTree(null)}
            </div>
          </>
        ) : mainView === 'library' ? (
          <>
            {/* Library View */}
            <div className="p-4 border-b border-zinc-800/50 flex items-center gap-2 text-white font-semibold text-base">
              <Library className="w-5 h-5 text-indigo-400" />
              <span>Librería</span>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4 mt-2 space-y-1">
              {!activeLibraryCategory ? (
                [
                  { id: 'line-type', name: 'Tipo de línea', icon: Minus },
                  { id: 'texture', name: 'Textura', icon: Box },
                  { id: 'furniture', name: 'Muebles', icon: Box },
                  { id: 'plumbing', name: 'Cañería', icon: Cylinder },
                  { id: 'electrical', name: 'Eléctrico', icon: Sun },
                  { id: 'table', name: 'Tabla', icon: Square },
                  { id: 'wall-type', name: 'Tipo de muro', icon: Box },
                  { id: 'window', name: 'Ventana', icon: AppWindow },
                  { id: 'door', name: 'Puerta', icon: DoorOpen },
                  { id: 'font', name: 'Tipo de letra', icon: Type },
                  { id: 'material', name: 'Material', icon: Layers },
                  { id: 'floor', name: 'Piso', icon: Square }
                ].map(category => (
                  <div
                    key={category.id}
                    onClick={() => setActiveLibraryCategory(category.id)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors group"
                  >
                    <category.icon className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 px-2 py-2 mb-2 text-zinc-400 hover:text-white cursor-pointer" onClick={() => setActiveLibraryCategory(null)}>
                    <ChevronDown className="w-4 h-4 rotate-90" />
                    <span className="text-sm font-medium">Back to Library</span>
                  </div>

                  {activeLibraryCategory === 'wall-type' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Wall Types</span>
                        <button
                          onClick={() => { setEditingWallType(undefined); setIsWallTypeModalOpen(true); }}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        {wallTypes.length === 0 ? (
                          <div className="text-xs text-zinc-600 px-2 py-4 text-center">No wall types defined.</div>
                        ) : (
                          wallTypes.map(wt => (
                            <div
                              key={wt.id}
                              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-800/50 text-zinc-300 group cursor-pointer"
                              onClick={() => { setEditingWallType(wt); setIsWallTypeModalOpen(true); }}
                            >
                              <div className="flex items-center gap-2">
                                <Box className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm">{wt.name}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWallTypes(wallTypes.filter(w => w.id !== wt.id));
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeLibraryCategory === 'line-type' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Line Types</span>
                        <button
                          onClick={() => { setEditingLineType(undefined); setIsLineTypeModalOpen(true); }}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-1">
                        {lineTypes.length === 0 ? (
                          <div className="text-xs text-zinc-600 px-2 py-4 text-center">
                            No line types defined.
                          </div>
                        ) : (
                          lineTypes.map(lt => (
                            <div
                              key={lt.id}
                              className="flex items-center justify-between p-2 rounded hover:bg-zinc-800/50 group cursor-pointer"
                              onClick={() => { setEditingLineType(lt); setIsLineTypeModalOpen(true); }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: lt.color }} />
                                <span className="text-sm text-zinc-300">{lt.name}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLineTypes(lineTypes.filter(t => t.id !== lt.id));
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeLibraryCategory === 'floor' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Slab Types</span>
                        <button
                          onClick={() => { setEditingSlabType(undefined); setIsSlabTypeModalOpen(true); }}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        {slabTypes.length === 0 ? (
                          <div className="text-xs text-zinc-600 px-2 py-4 text-center">No slab types defined.</div>
                        ) : (
                          slabTypes.map(st => (
                            <div
                              key={st.id}
                              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-800/50 text-zinc-300 group cursor-pointer"
                              onClick={() => { setEditingSlabType(st); setIsSlabTypeModalOpen(true); }}
                            >
                              <div className="flex items-center gap-2">
                                <Square className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm">{st.name}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSlabTypes(slabTypes.filter(s => s.id !== st.id));
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeLibraryCategory !== 'wall-type' && activeLibraryCategory !== 'line-type' && activeLibraryCategory !== 'floor' && (
                    <div className="text-xs text-zinc-600 px-2 py-4 text-center">
                      Category content not implemented yet.
                    </div>
                  )}
                </div>
              )}
            </div>

            {isWallTypeModalOpen && (
              <WallTypeModal
                isOpen={isWallTypeModalOpen}
                onClose={() => setIsWallTypeModalOpen(false)}
                wallType={editingWallType}
                onSave={(newWallType) => {
                  if (editingWallType) {
                    setWallTypes(wallTypes.map(wt => wt.id === newWallType.id ? newWallType : wt));

                    // Update all elements that use this wall type
                    const newTotalThickness = newWallType.layers.reduce((sum: any, l: { thickness: any; }) => sum + l.thickness, 0);
                    elements.forEach(el => {
                      if (el.category === 'Walls' && el.wallTypeId === newWallType.id && el.geometry.type === 'box') {
                        const args = [...el.geometry.args] as [number, number, number];
                        args[2] = newTotalThickness;
                        args[1] = newWallType.height;
                        onUpdateElement(el.id, {
                          geometry: {
                            ...el.geometry,
                            args
                          }
                        });
                      }
                    });
                  } else {
                    setWallTypes([...wallTypes, newWallType]);
                  }
                }}
                scaleSettings={scaleSettings}
              />
            )}

            {isLineTypeModalOpen && (
              <LineTypeModal
                isOpen={isLineTypeModalOpen}
                onClose={() => setIsLineTypeModalOpen(false)}
                lineType={editingLineType}
                onSave={(newLineType) => {
                  if (editingLineType) {
                    setLineTypes(lineTypes.map(lt => lt.id === newLineType.id ? newLineType : lt));
                  } else {
                    setLineTypes([...lineTypes, newLineType]);
                  }
                }}
                scaleSettings={scaleSettings}
              />
            )}

            {isSlabTypeModalOpen && (
              <SlabTypeModal
                isOpen={isSlabTypeModalOpen}
                onClose={() => setIsSlabTypeModalOpen(false)}
                slabType={editingSlabType}
                onSave={(newSlabType) => {
                  if (editingSlabType) {
                    setSlabTypes(slabTypes.map(st => st.id === newSlabType.id ? newSlabType : st));
                  } else {
                    setSlabTypes([...slabTypes, newSlabType]);
                  }
                }}
                scaleSettings={scaleSettings}
              />
            )}
          </>
        ) : mainView === 'views' ? (
          <>
            <div className="p-4 flex items-center justify-between border-b border-zinc-800/50">
              <div className="flex items-center gap-2 text-zinc-400 font-medium">
                <Camera className="w-4 h-4" />
                <span>Saved Views</span>
              </div>
              <button
                onClick={onSaveViewRequest}
                className="p-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-md transition-colors"
                title="Save current view"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {savedViews.length === 0 ? (
                <div className="text-center text-zinc-500 text-sm mt-8">
                  No saved views yet.
                </div>
              ) : (
                <div className="space-y-1">
                  {savedViews.map(view => (
                    <div
                      key={view.id}
                      className="flex items-center justify-between p-2 hover:bg-zinc-800/50 rounded-lg group cursor-pointer"
                      onClick={() => onRestoreView && onRestoreView(view)}
                    >
                      <span className="text-sm text-zinc-300 truncate">{view.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSavedViews(savedViews.filter(v => v.id !== view.id));
                        }}
                        className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete view"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : mainView === 'issues' ? (
          <>
            <div className="p-4 flex items-center justify-between border-b border-zinc-800/50">
              <div className="flex items-center gap-2 text-zinc-400 font-medium">
                <MessageSquare className="w-4 h-4" />
                <span>Issues Notes</span>
              </div>
              <button
                onClick={() => {
                  if (!selectedId) {
                    alert("Please select an element first to add a note.");
                    return;
                  }
                  setIsCreatingIssue(true);
                }}
                className="p-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-md transition-colors"
                title="Add Issue to Selected Element"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {isCreatingIssue && (
                <div className="bg-zinc-800/50 p-3 rounded-lg border border-indigo-500/30 mb-3 space-y-2">
                  <div className="text-xs text-indigo-400 font-medium mb-1">New Note for Selected Element</div>
                  <input
                    type="text"
                    value={newIssueTitle}
                    onChange={(e) => setNewIssueTitle(e.target.value)}
                    placeholder="Issue title..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <textarea
                    value={newIssueDescription}
                    onChange={(e) => setNewIssueDescription(e.target.value)}
                    placeholder="Description..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none h-16"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setIsCreatingIssue(false);
                        setNewIssueTitle('');
                        setNewIssueDescription('');
                      }}
                      className="px-2 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (newIssueTitle.trim() && selectedId) {
                          const el = elements.find(e => e.id === selectedId);
                          if (onCreateIssue) {
                            const success = await onCreateIssue({
                              elementId: selectedId,
                              elementName: el?.name || 'Unknown Element',
                              title: newIssueTitle.trim(),
                              description: newIssueDescription.trim()
                            });
                            if (success && setIssueNotes) {
                              const newNote: IssueNote = {
                                id: `issue-${Date.now()}`,
                                elementId: selectedId,
                                elementName: el?.name || 'Unknown Element',
                                title: newIssueTitle.trim(),
                                description: newIssueDescription.trim(),
                                createdAt: Date.now(),
                                status: 'open'
                              };
                              setIssueNotes([...issueNotes, newNote]);
                            }
                          } else if (setIssueNotes) {
                            const newNote: IssueNote = {
                              id: `issue-${Date.now()}`,
                              elementId: selectedId,
                              elementName: el?.name || 'Unknown Element',
                              title: newIssueTitle.trim(),
                              description: newIssueDescription.trim(),
                              createdAt: Date.now(),
                              status: 'open'
                            };
                            setIssueNotes([...issueNotes, newNote]);
                          }
                          setIsCreatingIssue(false);
                          setNewIssueTitle('');
                          setNewIssueDescription('');
                        }
                      }}
                      disabled={!newIssueTitle.trim()}
                      className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              )}

              {issueNotes.length === 0 && !isCreatingIssue ? (
                <div className="text-center text-zinc-500 text-sm mt-8">
                  No issues notes yet. Select an element and click + to add one.
                </div>
              ) : (
                <div className="space-y-2">
                  {issueNotes.map(note => (
                    <div
                      key={note.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all cursor-pointer group",
                        selectedId === note.elementId
                          ? "bg-indigo-500/10 border-indigo-500/30"
                          : "bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600"
                      )}
                      onClick={() => onSelect(note.elementId)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-medium text-zinc-200">{note.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold",
                            note.status === 'open' ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                          )}>
                            {note.status}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (setIssueNotes) {
                                setIssueNotes(issueNotes.filter(n => n.id !== note.id));
                              }
                            }}
                            className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {note.description && (
                        <p className="text-xs text-zinc-400 mb-2 line-clamp-2">{note.description}</p>
                      )}
                      <div className="flex justify-between items-center text-[10px] text-zinc-500">
                        <span className="truncate max-w-[150px]" title={note.elementName}>
                          Ref: {note.elementName}
                        </span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
