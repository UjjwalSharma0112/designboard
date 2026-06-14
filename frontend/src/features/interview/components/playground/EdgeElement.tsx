import React from "react";
import type { NodeData } from "./NodeElement";

export interface EdgeData {
  from: string;
  to: string;
  descriptor: string;
  tag?: string;
}

interface EdgeElementProps {
  edge: EdgeData;
  idx: number;
  nodes: NodeData[];
  edges: EdgeData[];
  handleEdgeDoubleClick: (e: React.MouseEvent, edge: EdgeData) => void;
}

export default function EdgeElement({
  edge,
  idx,
  nodes,
  edges,
  handleEdgeDoubleClick,
}: EdgeElementProps) {
  const fromNode = nodes.find((n) => n.id === edge.from);
  const toNode = nodes.find((n) => n.id === edge.to);
  if (!fromNode || !toNode) return null;

  const x1 = fromNode.x;
  const y1 = fromNode.y;
  const x2 = toNode.x;
  const y2 = toNode.y;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  const ex2 = x2 - (dx / len) * 64;
  const ey2 = y2 - (dy / len) * 26;

  // Find all sibling edges between these two nodes (in either direction)
  const siblingEdges = edges.filter(
    (e) =>
      (e.from === edge.from && e.to === edge.to) ||
      (e.from === edge.to && e.to === edge.from)
  );

  const siblingIndex = siblingEdges.findIndex((e) => e === edge);

  // Always calculate coordinates based on sorted order so normals align
  const isReversed = edge.from > edge.to;
  const nStart = isReversed ? toNode : fromNode;
  const nEnd = isReversed ? fromNode : toNode;

  // Midpoint of the straight line
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  // Direction vector from nStart to nEnd
  const ndx = nEnd.x - nStart.x;
  const ndy = nEnd.y - nStart.y;
  const nlen = Math.sqrt(ndx * ndx + ndy * ndy) || 1;

  // Perpendicular normal vector (unit length)
  const nx = -ndy / nlen;
  const ny = ndx / nlen;

  // Determine curve distance offset
  let dist = 0;
  if (siblingEdges.length > 1) {
    const step = 40; // spacing between curves
    const totalWidth = (siblingEdges.length - 1) * step;
    dist = -totalWidth / 2 + siblingIndex * step;
  }

  // Control point for the curve
  const cx = mx + nx * dist;
  const cy = my + ny * dist;

  // Center of the curved label (peak of the curve)
  const lx = (mx + cx) / 2;
  const ly = (my + cy) / 2;

  const labelText = edge.tag
    ? `${edge.descriptor} [${edge.tag}]`
    : edge.descriptor;

  const tw = Math.max(labelText.length * 6.5 + 12, 40);

  return (
    <g
      className="edge-group cursor-pointer group"
      onDoubleClick={(e) => handleEdgeDoubleClick(e, edge)}
    >
      <path
        d={`M ${x1} ${y1} Q ${cx} ${cy} ${ex2} ${ey2}`}
        stroke="transparent"
        strokeWidth={10}
        fill="none"
      />
      <path
        className="edge-line stroke-line group-hover:stroke-accent transition-colors"
        d={`M ${x1} ${y1} Q ${cx} ${cy} ${ex2} ${ey2}`}
        stroke="var(--line)"
        strokeWidth={1.5}
        fill="none"
        markerEnd="url(#arrow)"
        style={{ stroke: "var(--line)" }}
      />
      {labelText && (
        <g className="transition-transform group-hover:scale-[1.03] origin-center">
          <rect
            x={lx - tw / 2}
            y={ly - 10}
            width={tw}
            height={17}
            fill="var(--raised)"
            stroke="var(--line)"
            className="group-hover:stroke-accent transition-colors"
            strokeWidth={0.5}
            rx={3}
          />
          <text
            x={lx}
            y={ly + 2}
            fill="var(--muted)"
            className="group-hover:fill-fg transition-colors"
            fontSize={9}
            fontFamily="monospace"
            textAnchor="middle"
          >
            {labelText}
          </text>
        </g>
      )}
    </g>
  );
}
