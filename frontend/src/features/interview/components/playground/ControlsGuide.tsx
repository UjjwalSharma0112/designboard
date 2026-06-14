import React from "react";

export default function ControlsGuide() {
  return (
    <div className="absolute bottom-4 right-4 max-w-[240px] bg-surface/90 backdrop-blur border border-line rounded-card p-3 shadow-lift select-none text-[10px] font-mono text-muted z-20 flex flex-col gap-1.5 pointer-events-none sm:pointer-events-auto hover:opacity-100 transition-opacity">
      <div className="text-[9px] tracking-wider uppercase text-faint font-bold border-b border-line/40 pb-1 mb-1">
        quick controls
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-faint">Select Tool</span>
        <span className="text-fg font-semibold">[1] or [V]</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-faint">Pan Tool</span>
        <span className="text-fg font-semibold">[2] or [H]</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-faint">Edge Tool</span>
        <span className="text-fg font-semibold">[3] or [E]</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-faint">Pan Canvas</span>
        <span className="text-fg font-semibold">Space+Drag / Mid+Right Drag</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-faint">Multi-Select</span>
        <span className="text-fg font-semibold">Drag Selection Box</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-faint">Edit Node/Edge</span>
        <span className="text-fg font-semibold">Double Click</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-faint">Delete Selected</span>
        <span className="text-fg font-semibold">Del / Backspace</span>
      </div>
    </div>
  );
}
