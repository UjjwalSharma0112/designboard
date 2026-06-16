import React, { useState } from "react";
import type { NodeData } from "./NodeElement";

export interface EdgeData {
  from: string;
  to: string;
  descriptor: string;
  tag?: string;
}

interface EdgeElementProps {
  edge: EdgeData;
  nodes: NodeData[];
  edges: EdgeData[];
  handleEdgeDoubleClick: (e: React.MouseEvent, edge: EdgeData) => void;
}

export default function EdgeElement({
  edge,
  nodes,
  edges,
  handleEdgeDoubleClick,
}: EdgeElementProps) {
  const [isHovered, setIsHovered] = useState(false);
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

  // Calculate port offset to separate start (source) and end (sink) connection points on node borders
  let portOffset = 0;
  if (siblingEdges.length > 1) {
    const portStep = 10; // spacing between ports
    const totalPortWidth = (siblingEdges.length - 1) * portStep;
    portOffset = -totalPortWidth / 2 + siblingIndex * portStep;
  }

  // Calculate start (sx1, sy1) and end (ex2, ey2) points offset 8px outside node borders with port offset
  const sx1 = x1 + (dx / len) * (fromNode.w / 2 + 8) + nx * portOffset;
  const sy1 = y1 + (dy / len) * (fromNode.h / 2 + 8) + ny * portOffset;
  const ex2 = x2 - (dx / len) * (toNode.w / 2 + 8) + nx * portOffset;
  const ey2 = y2 - (dy / len) * (toNode.h / 2 + 8) + ny * portOffset;

  // Determine curve distance offset
  let dist = 0;
  if (siblingEdges.length > 1) {
    const step = 60; // spacing between curves (increased from 40)
    const totalWidth = (siblingEdges.length - 1) * step;
    dist = -totalWidth / 2 + siblingIndex * step;
  }

  // Control point for the curve, incorporating portOffset to maintain parallel curves
  const cx = mx + nx * (dist + portOffset);
  const cy = my + ny * (dist + portOffset);

  // Determine parameter t along the curve to stagger labels (defaulting closer to the source node)
  let t = 0.25;
  if (siblingEdges.length > 1) {
    const n = siblingEdges.length;
    t = 0.2 + (siblingIndex / (n - 1)) * 0.2;
  }

  // Exact coordinates on the quadratic Bezier curve at parameter t
  const mt = 1 - t;
  const lx = mt * mt * sx1 + 2 * mt * t * cx + t * t * ex2;
  const ly = mt * mt * sy1 + 2 * mt * t * cy + t * t * ey2;

  const labelText = edge.tag
    ? `${edge.descriptor} [${edge.tag}]`
    : edge.descriptor;

  const tw = Math.max(labelText.length * 6.5 + 12, 40);

  return (
    <g
      className="edge-group cursor-pointer group"
      onDoubleClick={(e) => handleEdgeDoubleClick(e, edge)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hit Target Path (wide invisible stroke for easier interaction) */}
      <path
        d={`M ${sx1} ${sy1} Q ${cx} ${cy} ${ex2} ${ey2}`}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
      />
      {/* Main Connection Line */}
      <path
        className="edge-line stroke-line transition-[stroke,stroke-width] duration-200"
        d={`M ${sx1} ${sy1} Q ${cx} ${cy} ${ex2} ${ey2}`}
        stroke={isHovered ? "var(--accent)" : "var(--line)"}
        strokeWidth={isHovered ? 2 : 1.5}
        fill="none"
        markerEnd={isHovered ? "url(#arrow-hover)" : "url(#arrow)"}
      />
      {labelText && (
        <g
          className="transition-transform origin-center"
          style={{
            transform: isHovered ? "scale(1.03)" : "scale(1)",
            transition: "transform 0.2s ease",
          }}
        >
          <rect
            x={lx - tw / 2}
            y={ly - 10}
            width={tw}
            height={17}
            fill="var(--raised)"
            stroke={isHovered ? "var(--accent)" : "var(--line)"}
            className="transition-colors duration-200"
            strokeWidth={0.5}
            rx={3}
          />
          <text
            x={lx}
            y={ly + 2}
            fill={isHovered ? "var(--fg)" : "var(--muted)"}
            className="transition-colors duration-200"
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
