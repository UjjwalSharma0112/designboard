import React from "react";

interface ModeToolbarProps {
  mode: "select" | "pan" | "edge";
  setMode: (mode: "select" | "pan" | "edge") => void;
  setEdgeStartNodeId: (id: string | null) => void;
  clearCanvas: () => void;
}

export default function ModeToolbar({
  mode,
  setMode,
  setEdgeStartNodeId,
  clearCanvas,
}: ModeToolbarProps) {
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-surface/95 backdrop-blur border border-line rounded-full px-2.5 py-1.5 shadow-lift z-20 select-none">
      <button
        onClick={() => {
          setMode("select");
          setEdgeStartNodeId(null);
        }}
        className={`px-3.5 py-1 rounded-full text-[10px] font-mono cursor-pointer transition-all ${
          mode === "select"
            ? "bg-accent text-accent-contrast shadow-soft"
            : "text-muted hover:text-fg"
        }`}
        title="Select Mode (Press 1 or V)"
      >
        select [V]
      </button>
      <button
        onClick={() => {
          setMode("pan");
          setEdgeStartNodeId(null);
        }}
        className={`px-3.5 py-1 rounded-full text-[10px] font-mono cursor-pointer transition-all ${
          mode === "pan"
            ? "bg-accent text-accent-contrast shadow-soft"
            : "text-muted hover:text-fg"
        }`}
        title="Pan Mode (Press 2 or H)"
      >
        pan [H]
      </button>
      <button
        onClick={() => setMode("edge")}
        className={`px-3.5 py-1 rounded-full text-[10px] font-mono cursor-pointer transition-all ${
          mode === "edge"
            ? "bg-accent text-accent-contrast shadow-soft"
            : "border-line text-muted hover:text-fg"
        }`}
        title="Edge Mode (Press 3 or E)"
      >
        + edge [E]
      </button>
      <div className="w-[1px] h-4 bg-line mx-0.5" />
      <button
        onClick={clearCanvas}
        className="px-3 py-1 rounded-full text-[10px] text-muted cursor-pointer font-mono hover:text-warn transition-all"
      >
        clear
      </button>
    </div>
  );
}
