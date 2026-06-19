import React from "react";
import { COMPONENTS } from "./constants";

export interface NodeData {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tag?: string;
}

interface NodeElementProps {
  node: NodeData;
  isSelected: boolean;
  isEdgeStart: boolean;
  isEditing: boolean;
  handleNodeMouseDown: (e: React.MouseEvent, node: NodeData) => void;
  handleNodeDoubleClick: (e: React.MouseEvent, node: NodeData) => void;
  handleContainerBlur: (e: React.FocusEvent, nodeId: string) => void;
  editName: string;
  setEditName: (val: string) => void;
  editTag: string;
  setEditTag: (val: string) => void;
  handleEditKeyDown: (e: React.KeyboardEvent, nodeId: string) => void;
  handleResizeMouseDown: (e: React.MouseEvent, node: NodeData) => void;
}

export function wrapText(text: string, maxCharsPerLine: number): string[] {
  if (!text) return [];
  const explicitLines = text.split(/\r?\n/);
  const lines: string[] = [];

  explicitLines.forEach((explicitLine) => {
    const words = explicitLine.split(/[ \t]+/);
    let currentLine = "";

    words.forEach((word) => {
      if (!word) return;
      if (currentLine.length === 0) {
        currentLine = word;
      } else if (currentLine.length + 1 + word.length <= maxCharsPerLine) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) {
      lines.push(currentLine);
    } else {
      // Preserve blank lines
      lines.push("");
    }
  });

  return lines;
}

export default function NodeElement({
  node,
  isSelected,
  isEdgeStart,
  isEditing,
  handleNodeMouseDown,
  handleNodeDoubleClick,
  handleContainerBlur,
  editName,
  setEditName,
  editTag,
  setEditTag,
  handleEditKeyDown,
  handleResizeMouseDown,
}: NodeElementProps) {
  const comp = COMPONENTS.find((c) => c.type === node.type) || COMPONENTS[0];
  const isNote = node.type === "note";
  const nodeHeader = isNote ? "" : "[" + node.type + "]" + (node.tag ? ` · ${node.tag}` : "");

  // Calculate wrapped lines for the label based on current node width
  const maxChars = Math.max(10, Math.floor((node.w - 16) / 6.5));
  const labelLines = wrapText(node.label, maxChars);

  return (
    <g
      className="node-group cursor-move"
      transform={`translate(${node.x - node.w / 2}, ${node.y - node.h / 2})`}
      onMouseDown={(e) => handleNodeMouseDown(e, node)}
      onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
    >
      <rect
        className={`node-rect transition-[stroke,stroke-width,fill] duration-200 ${
          isSelected ? "selected stroke-2" : "stroke-1"
        } ${isEdgeStart ? "edge-start-node" : ""}`}
        width={node.w}
        height={node.h}
        rx={6}
        fill={comp.color}
        stroke={isSelected ? "#ffffff" : isEdgeStart ? "var(--accent)" : comp.color}
        strokeWidth={isSelected ? 2 : isEdgeStart ? 2.5 : 1}
      />

      {isEditing ? (
        <foreignObject x={0} y={0} width={node.w} height={node.h} style={{ overflow: "hidden" }}>
          <div
            className="w-full h-full flex flex-col justify-center items-center px-3.5 py-2 bg-raised rounded-[6px] border border-accent text-center overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            onBlur={(e) => handleContainerBlur(e, node.id)}
          >
            {!isNote && (
              <input
                type="text"
                value={editTag}
                onChange={(e) => setEditTag(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown(e, node.id)}
                className="w-full text-[9px] font-mono font-bold text-fg bg-transparent outline-none border-b border-line/40 py-0.5 px-0 text-center"
                placeholder="Tag"
              />
            )}
            <textarea
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => handleEditKeyDown(e, node.id)}
              className="w-full text-[11px] font-normal text-fg/80 bg-transparent outline-none py-0.5 px-0 text-center mt-1 resize-none h-full flex items-center justify-center overflow-hidden"
              placeholder={isNote ? "Type your note..." : "Name"}
              autoFocus
              rows={isNote ? 3 : 2}
            />
          </div>
        </foreignObject>
      ) : (
        <>
          {/* Tag/Type header at the top */}
          {!isNote && (
            <text
              x={node.w / 2}
              y={15}
              fill={comp.text}
              opacity={0.85}
              fontSize={10}
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
              className="select-none pointer-events-none"
            >
              {nodeHeader}
            </text>
          )}
          
          {/* Label lines centered vertically in the remaining space */}
          {labelLines.map((line, idx) => (
            <text
              key={idx}
              x={node.w / 2}
              y={isNote ? (node.h / 2 + 3.5 + (idx - (labelLines.length - 1) / 2) * 12) : (node.h / 2 + 5 + (idx - (labelLines.length - 1) / 2) * 12)}
              fill={comp.text}
              fontSize={10}
              fontFamily="monospace"
              textAnchor="middle"
              className="select-none pointer-events-none"
            >
              {line}
            </text>
          ))}
        </>
      )}

      {/* Resize Handle (visible when selected) */}
      {isSelected && (
        <g
          transform={`translate(${node.w - 12}, ${node.h - 12})`}
          className="cursor-se-resize select-none"
          onMouseDown={(e) => handleResizeMouseDown(e, node)}
        >
          {/* Hit target */}
          <rect width={14} height={14} fill="transparent" x={-2} y={-2} />
          {/* Dynamic diagonal drag indicator lines */}
          <path
            d="M 6 12 L 12 6 M 9 12 L 12 9"
            stroke={comp.text}
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={0.6}
          />
        </g>
      )}
    </g>
  );
}
