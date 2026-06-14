import React from "react";

interface ZoomToolbarProps {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export default function ZoomToolbar({
  zoom,
  zoomIn,
  zoomOut,
  resetZoom,
}: ZoomToolbarProps) {
  return (
    <div className="absolute bottom-4 left-[180px] flex items-center gap-1.5 bg-surface/95 backdrop-blur border border-line rounded-card p-1 shadow-lift select-none text-[11px] font-mono text-muted z-20">
      <button
        type="button"
        onClick={zoomOut}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface hover:text-fg font-bold"
        title="Zoom Out"
      >
        -
      </button>
      <span className="px-1 text-center min-w-[36px]">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        onClick={zoomIn}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface hover:text-fg font-bold"
        title="Zoom In"
      >
        +
      </button>
      <div className="w-[1px] h-4 bg-line mx-0.5" />
      <button
        type="button"
        onClick={resetZoom}
        className="px-2 h-7 flex items-center justify-center rounded hover:bg-surface hover:text-fg"
        title="Reset view"
      >
        reset
      </button>
    </div>
  );
}
