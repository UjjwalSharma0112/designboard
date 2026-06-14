import React from "react";
import { SUGGESTIONS, EDGE_TAG_SUGGESTIONS } from "./constants";

interface EdgePopupProps {
  popupPosition: { x: number; y: number } | null;
  edgeDescriptor: string;
  setEdgeDescriptor: (val: string) => void;
  edgeTag: string;
  setEdgeTag: (val: string) => void;
  handleCancelEdge: () => void;
  handleConfirmEdge: () => void;
  edgePopupRef: React.RefObject<HTMLDivElement | null>;
}

export default function EdgePopup({
  popupPosition,
  edgeDescriptor,
  setEdgeDescriptor,
  edgeTag,
  setEdgeTag,
  handleCancelEdge,
  handleConfirmEdge,
  edgePopupRef,
}: EdgePopupProps) {
  if (!popupPosition) return null;

  return (
    <div
      ref={edgePopupRef}
      className="absolute z-30 bg-raised border border-line rounded-card p-4 shadow-lift min-w-[250px] flex flex-col gap-3.5 transition-all text-left"
      style={{
        left: `${popupPosition.x}px`,
        top: `${popupPosition.y}px`,
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-faint tracking-wider uppercase font-bold">
          1. protocol / descriptor (optional)
        </label>
        <input
          value={edgeDescriptor}
          onChange={(e) => setEdgeDescriptor(e.target.value)}
          className="w-full text-xs font-mono p-1.5 rounded-card border border-line bg-bg text-fg outline-none focus:border-accent"
          placeholder="e.g. HTTPS, gRPC... (optional)"
          autoFocus
          autoComplete="off"
        />
        <div className="flex flex-wrap gap-1 mt-1.5 max-w-[230px]">
          {SUGGESTIONS.map((s) => (
            <span
              key={s}
              onClick={() => setEdgeDescriptor(s)}
              className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-line text-muted bg-surface hover:border-accent hover:text-accent cursor-pointer transition-all"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t border-line/40 pt-2.5">
        <label className="text-[9px] text-faint tracking-wider uppercase font-bold">
          2. connection details / purpose (required)
        </label>
        <input
          value={edgeTag}
          onChange={(e) => setEdgeTag(e.target.value)}
          className="w-full text-xs font-mono p-1.5 rounded-card border border-line bg-bg text-fg outline-none focus:border-accent"
          placeholder="e.g. async replication, read requests..."
          autoComplete="off"
        />
        <div className="flex flex-wrap gap-1 mt-1.5 max-w-[230px]">
          {EDGE_TAG_SUGGESTIONS.map((s) => (
            <span
              key={s}
              onClick={() => setEdgeTag(s)}
              className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-line text-muted bg-surface hover:border-accent hover:text-accent cursor-pointer transition-all"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 justify-end mt-1 border-t border-line/40 pt-2.5">
        <button
          onClick={handleCancelEdge}
          className="text-[10px] font-mono px-2.5 py-1 rounded-card border border-line text-muted hover:text-fg transition-colors"
        >
          cancel
        </button>
        <button
          onClick={handleConfirmEdge}
          disabled={!edgeTag.trim()}
          className="text-[10px] font-mono px-2.5 py-1 rounded-card bg-accent text-accent-contrast border border-accent hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          add edge
        </button>
      </div>
    </div>
  );
}
