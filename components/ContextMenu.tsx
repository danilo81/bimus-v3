"use client"
import React, { useEffect, useRef } from 'react';
import { Copy, Scissors, Clipboard, Group, Ungroup, Lock, Unlock, EyeOff, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onLock: (lock: boolean) => void;
  onIsolate: () => void;
  onShowAll: () => void;
  hasSelection: boolean;
  canPaste: boolean;
  isLocked: boolean;
}

export function ContextMenu({
  x,
  y,
  onClose,
  onCopy,
  onCut,
  onPaste,
  onGroup,
  onUngroup,
  onLock,
  onIsolate,
  onShowAll,
  hasSelection,
  canPaste,
  isLocked
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    disabled = false,
    danger = false
  }: {
    icon: any,
    label: string,
    onClick: () => void,
    disabled?: boolean,
    danger?: boolean
  }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors",
        disabled
          ? "text-zinc-600 cursor-not-allowed"
          : danger
            ? "text-red-400 hover:bg-red-400/10"
            : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
      )}
      disabled={disabled}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div
      ref={menuRef}
      className="fixed z-100 min-w-[180px] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl py-1 overflow-hidden"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <MenuItem icon={Copy} label="Copy" onClick={onCopy} disabled={!hasSelection} />
      <MenuItem icon={Scissors} label="Cut" onClick={onCut} disabled={!hasSelection} />
      <MenuItem icon={Clipboard} label="Paste" onClick={onPaste} disabled={!canPaste} />

      <div className="h-px bg-zinc-800 my-1" />

      <MenuItem icon={Group} label="Group" onClick={onGroup} disabled={!hasSelection} />
      <MenuItem icon={Ungroup} label="Ungroup" onClick={onUngroup} disabled={!hasSelection} />

      <div className="h-px bg-zinc-800 my-1" />

      {isLocked ? (
        <MenuItem icon={Unlock} label="Unlock" onClick={() => onLock(false)} disabled={!hasSelection} />
      ) : (
        <MenuItem icon={Lock} label="Lock" onClick={() => onLock(true)} disabled={!hasSelection} />
      )}

      <div className="h-px bg-zinc-800 my-1" />

      <MenuItem icon={EyeOff} label="Isolate" onClick={onIsolate} disabled={!hasSelection} />
      <MenuItem icon={Eye} label="Show All" onClick={onShowAll} />
    </div>
  );
}
