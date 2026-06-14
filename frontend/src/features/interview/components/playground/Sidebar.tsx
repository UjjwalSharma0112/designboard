import React from "react";
import { COMPONENTS } from "./constants";

interface SidebarProps {
  handleDragStart: (e: React.DragEvent, type: string) => void;
  handleComponentClick: (type: string) => void;
}

export default function Sidebar({
  handleDragStart,
  handleComponentClick,
}: SidebarProps) {
  return (
    <div className="absolute top-20 left-4 bottom-4 w-[160px] border border-line bg-surface/95 backdrop-blur rounded-card shadow-lift flex flex-col p-2.5 gap-2 overflow-y-auto select-none z-20">
      <div className="text-[9px] tracking-widest text-faint uppercase font-bold px-1 py-0.5 text-left border-b border-line pb-1.5 mb-0.5">
        components
      </div>
      {COMPONENTS.map((c) => (
        <div
          key={c.type}
          draggable
          onDragStart={(e) => handleDragStart(e, c.type)}
          onClick={() => handleComponentClick(c.type)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-card border border-line/80 bg-surface/70 cursor-grab text-[10px] text-muted hover:border-accent hover:text-fg hover:bg-accent-soft/25 transition-all select-none text-left shrink-0"
          title="Drag to canvas or click to add"
        >
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: c.color }}
          />
          <span className="truncate">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
