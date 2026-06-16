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
}: NodeElementProps) {
  const comp = COMPONENTS.find((c) => c.type === node.type) || COMPONENTS[0];
  const nodeHeader = "[" + node.type + "]" + (node.tag ? ` · ${node.tag}` : "");

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
        <foreignObject x={3} y={3} width={node.w - 6} height={node.h - 6}>
          <div
            className="w-full h-full flex flex-col justify-center items-center px-2 py-0.5 bg-raised rounded border border-accent text-center"
            onMouseDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            onBlur={(e) => handleContainerBlur(e, node.id)}
          >
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => handleEditKeyDown(e, node.id)}
              className="w-full text-xs font-semibold text-fg bg-transparent outline-none border-b border-line/40 py-0.5 px-0 text-center"
              placeholder="Name"
              autoFocus
            />
            <input
              type="text"
              value={editTag}
              onChange={(e) => setEditTag(e.target.value)}
              onKeyDown={(e) => handleEditKeyDown(e, node.id)}
              className="w-full text-[8px] font-mono text-muted bg-transparent outline-none py-0.5 px-0 text-center"
              placeholder="Tag"
            />
          </div>
        </foreignObject>
      ) : (
        <>
          <text
            x={node.w / 2}
            y={17}
            fill={comp.text}
            opacity={0.7}
            fontSize={8}
            fontFamily="monospace"
            textAnchor="middle"
          >
            {nodeHeader.length > 22 ? nodeHeader.slice(0, 20) + "..." : nodeHeader}
          </text>
          <text
            x={node.w / 2}
            y={34}
            fill={comp.text}
            fontSize={11}
            fontFamily="monospace"
            fontWeight="semibold"
            textAnchor="middle"
          >
            {node.label.length > 18 ? node.label.slice(0, 16) + "..." : node.label}
          </text>
        </>
      )}
    </g>
  );
}
