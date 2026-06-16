"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play } from "lucide-react";
import Sidebar from "./playground/Sidebar";
import ModeToolbar from "./playground/ModeToolbar";
import ZoomToolbar from "./playground/ZoomToolbar";
import EdgePopup from "./playground/EdgePopup";
import ControlsGuide from "./playground/ControlsGuide";
import NodeElement, { NodeData } from "./playground/NodeElement";
import EdgeElement, { EdgeData } from "./playground/EdgeElement";

interface ExportedNode {
  id: string;
  type: string;
  label: string;
  tag?: string;
  data: { label: string; type: string; tag?: string };
}

interface ExportedEdge {
  from: string;
  to: string;
  descriptor: string;
  tag?: string;
  source: string;
  target: string;
  label: string;
}

interface SystemDesignPlaygroundProps {
  question: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
  };
  onBack: () => void;
  onSubmit: (data: { nodes: ExportedNode[]; edges: ExportedEdge[] }) => void;
}

export default function SystemDesignPlayground({
  question,
  onBack,
  onSubmit,
}: SystemDesignPlaygroundProps) {
  // SVG Canvas states
  const [nodes, setNodes] = useState<NodeData[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`playground_diagram_${question.id}`);
      if (saved) {
        try {
          const { nodes: savedNodes } = JSON.parse(saved);
          if (Array.isArray(savedNodes)) {
            return savedNodes;
          }
        } catch {
          // ignore
        }
      }
    }
    return [];
  });

  const [edges, setEdges] = useState<EdgeData[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`playground_diagram_${question.id}`);
      if (saved) {
        try {
          const { edges: savedEdges } = JSON.parse(saved);
          if (Array.isArray(savedEdges)) {
            return savedEdges;
          }
        } catch {
          // ignore
        }
      }
    }
    return [];
  });

  const [mode, setMode] = useState<"select" | "pan" | "edge">("select");
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  const [pendingEdge, setPendingEdge] = useState<{
    from: NodeData;
    to: NodeData;
  } | null>(null);

  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Interactive interaction states
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingNodesStart, setDraggingNodesStart] = useState<
    Record<string, { x: number; y: number }>
  >({});

  // Selection box state (marquee selection)
  const [selectionStart, setSelectionStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // Panning interaction states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Edge editing popup position
  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [edgeDescriptor, setEdgeDescriptor] = useState("");
  const [edgeTag, setEdgeTag] = useState("");

  // Inline node editing text state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTag, setEditTag] = useState("");

  // DOM Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const edgePopupRef = useRef<HTMLDivElement>(null);

  // Counter for unique node IDs
  const nodeCounterRef = useRef(nodes.length);

  // Refs for tracking interactive states inside mouse/keyboard listener closures
  const selectedNodeIdsRef = useRef(selectedNodeIds);
  const panStartRef = useRef(panStart);
  const dragOffsetRef = useRef(dragOffset);
  const zoomRef = useRef(zoom);
  const panOffsetRef = useRef(panOffset);
  const nodesRef = useRef(nodes);
  const selectionStartRef = useRef(selectionStart);
  const draggingNodesStartRef = useRef(draggingNodesStart);

  // Sync refs after render to avoid ESLint rule violations
  useEffect(() => {
    selectedNodeIdsRef.current = selectedNodeIds;
    panStartRef.current = panStart;
    dragOffsetRef.current = dragOffset;
    zoomRef.current = zoom;
    panOffsetRef.current = panOffset;
    nodesRef.current = nodes;
    selectionStartRef.current = selectionStart;
    draggingNodesStartRef.current = draggingNodesStart;
  });

  // Save nodes and edges to sessionStorage
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      sessionStorage.setItem(
        `playground_diagram_${question.id}`,
        JSON.stringify({ nodes, edges }),
      );
    }
  }, [nodes, edges, question.id]);

  const handleCancelEdge = useCallback(() => {
    setPendingEdge(null);
    setEdgeStartNodeId(null);
    setMode((prev) => (prev === "edge" ? "select" : prev));
    setPopupPosition(null);
  }, []);

  // Click Outside to Dismiss edge popup and reset to select mode
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        popupPosition &&
        edgePopupRef.current &&
        !edgePopupRef.current.contains(e.target as Node)
      ) {
        handleCancelEdge();
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [popupPosition, handleCancelEdge]);

  const handleComponentClick = useCallback(
    (type: string) => {
      const id = `n${++nodeCounterRef.current}`;

      // Find dynamic center of canvas wrap (visible workspace center, offsetting the left sidebar)
      const rect = svgRef.current?.getBoundingClientRect();
      const w = rect
        ? rect.width
        : typeof window !== "undefined"
          ? window.innerWidth
          : 1200;
      const h = rect
        ? rect.height
        : typeof window !== "undefined"
          ? window.innerHeight
          : 700;
      const sidebarWidth = 180;
      const cx = sidebarWidth + (w - sidebarWidth) / 2;
      const cy = h / 2;

      const rx = Math.random() * 80 - 40;
      const ry = Math.random() * 80 - 40;
      const x = (cx - panOffset.x) / zoom + rx;
      const y = (cy - panOffset.y) / zoom + ry;

      setNodes((nds) => [
        ...nds,
        {
          id,
          type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
          x,
          y,
          w: 124,
          h: 48,
        },
      ]);
    },
    [panOffset, zoom],
  );

  const handleDragStart = useCallback((e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("text/plain", type);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("text/plain");
      if (!type) return;

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;

      const id = `n${++nodeCounterRef.current}`;
      setNodes((nds) => [
        ...nds,
        {
          id,
          type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
          x,
          y,
          w: 124,
          h: 48,
        },
      ]);
    },
    [panOffset, zoom],
  );

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, node: NodeData) => {
      if (editingNodeId === node.id) return;

      e.stopPropagation();

      if (mode === "edge") {
        if (!edgeStartNodeId) {
          setEdgeStartNodeId(node.id);
        } else if (edgeStartNodeId !== node.id) {
          const fromNode = nodes.find((n) => n.id === edgeStartNodeId);
          if (fromNode) {
            setPendingEdge({ from: fromNode, to: node });

            // Calculate midpoint of nodes to center edge popup dialog
            const rect = svgRef.current?.getBoundingClientRect();
            if (rect) {
              const panX = panOffsetRef.current.x;
              const panY = panOffsetRef.current.y;
              const z = zoomRef.current;

              const midCanvasX = (fromNode.x + node.x) / 2;
              const midCanvasY = (fromNode.y + node.y) / 2;

              const clientX = midCanvasX * z + panX + rect.left;
              const clientY = midCanvasY * z + panY + rect.top;

              setPopupPosition({
                x: clientX - rect.left,
                y: clientY - rect.top,
              });
            }
            setEdgeDescriptor("");
            setEdgeTag("");
          }
        }
      } else if (mode === "select") {
        if (e.button !== 0) return; // Left click drag only

        let targets = [...selectedNodeIds];
        if (!targets.includes(node.id)) {
          if (e.shiftKey) {
            targets = [...targets, node.id];
          } else {
            targets = [node.id];
          }
          setSelectedNodeIds(targets);
        }

        setDraggingNodeId(node.id);
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          const clientX = e.clientX;
          const clientY = e.clientY;
          setDragOffset({ x: clientX, y: clientY });

          const starts: Record<string, { x: number; y: number }> = {};
          nodes.forEach((n) => {
            if (targets.includes(n.id)) {
              starts[n.id] = { x: n.x, y: n.y };
            }
          });
          setDraggingNodesStart(starts);
        }
      }
    },
    [mode, edgeStartNodeId, nodes, selectedNodeIds, editingNodeId],
  );

  const handleNodeDoubleClick = useCallback(
    (e: React.MouseEvent, node: NodeData) => {
      e.stopPropagation();
      setEditingNodeId(node.id);
      setEditName(node.label);
      setEditTag(node.tag || "");
    },
    [],
  );

  const handleEdgeDoubleClick = useCallback(
    (e: React.MouseEvent, edge: EdgeData) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) return;

      setPendingEdge({ from: fromNode, to: toNode });
      setEdgeDescriptor(edge.descriptor);
      setEdgeTag(edge.tag || "");

      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const panX = panOffset.x;
        const panY = panOffset.y;
        const z = zoom;

        const midCanvasX = (fromNode.x + toNode.x) / 2;
        const midCanvasY = (fromNode.y + toNode.y) / 2;

        const clientX = midCanvasX * z + panX + rect.left;
        const clientY = midCanvasY * z + panY + rect.top;

        setPopupPosition({
          x: clientX - rect.left,
          y: clientY - rect.top,
        });
      }
    },
    [nodes, panOffset, zoom],
  );

  const handleSaveInline = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                label: editName.trim() || n.label,
                tag: editTag.trim() || undefined,
              }
            : n,
        ),
      );
      setEditingNodeId(null);
    },
    [editName, editTag],
  );

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent, nodeId: string) => {
      if (e.key === "Enter") {
        handleSaveInline(nodeId);
      } else if (e.key === "Escape") {
        setEditingNodeId(null);
      }
    },
    [handleSaveInline],
  );

  const handleContainerBlur = useCallback(
    (e: React.FocusEvent, nodeId: string) => {
      if (e.currentTarget.contains(e.relatedTarget as Node)) {
        return;
      }
      handleSaveInline(nodeId);
    },
    [handleSaveInline],
  );

  const handleConfirmEdge = useCallback(() => {
    if (!pendingEdge) return;

    if (!edgeTag.trim()) {
      alert(
        "Please provide information about what the connection is (e.g., purpose, details).",
      );
      return;
    }

    const exists = edges.some(
      (e) => e.from === pendingEdge.from.id && e.to === pendingEdge.to.id,
    );

    if (exists) {
      setEdges((eds) =>
        eds.map((e) =>
          e.from === pendingEdge.from.id && e.to === pendingEdge.to.id
            ? {
                ...e,
                descriptor: edgeDescriptor.trim(),
                tag: edgeTag.trim() || undefined,
              }
            : e,
        ),
      );
    } else {
      setEdges((eds) => [
        ...eds,
        {
          from: pendingEdge.from.id,
          to: pendingEdge.to.id,
          descriptor: edgeDescriptor.trim(),
          tag: edgeTag.trim() || undefined,
        },
      ]);
    }

    setPopupPosition(null);
    setPendingEdge(null);
    setEdgeStartNodeId(null);
    setMode("select");
  }, [pendingEdge, edges, edgeDescriptor, edgeTag]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.target === e.currentTarget ||
        (e.target as SVGElement).id === "grid-rect"
      ) {
        setSelectedNodeIds([]);
        setEdgeStartNodeId(null);
        handleCancelEdge();

        const isPanningActive =
          mode === "pan" || isSpacePressed || e.button === 1 || e.button === 2;

        if (isPanningActive) {
          setIsPanning(true);
          setPanStart({
            x: e.clientX - panOffset.x,
            y: e.clientY - panOffset.y,
          });
        } else if (mode === "select") {
          // Start marquee selection
          const rect = svgRef.current?.getBoundingClientRect();
          if (rect) {
            const startX = (e.clientX - rect.left - panOffset.x) / zoom;
            const startY = (e.clientY - rect.top - panOffset.y) / zoom;
            setSelectionStart({ x: startX, y: startY });
            setSelectionBox({ x: startX, y: startY, w: 0, h: 0 });
          }
        }
      }
    },
    [mode, isSpacePressed, panOffset, zoom, handleCancelEdge],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const zoomIn = useCallback(() => {
    const rect = svgRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 600;
    const cy = rect ? rect.height / 2 : 350;
    setZoom((z) => {
      const nz = Math.min(z * 1.15, 2.5);
      setPanOffset((prev) => ({
        x: cx - (cx - prev.x) * (nz / z),
        y: cy - (cy - prev.y) * (nz / z),
      }));
      return nz;
    });
  }, []);

  const zoomOut = useCallback(() => {
    const rect = svgRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 600;
    const cy = rect ? rect.height / 2 : 350;
    setZoom((z) => {
      const nz = Math.max(z / 1.15, 0.4);
      setPanOffset((prev) => ({
        x: cx - (cx - prev.x) * (nz / z),
        y: cy - (cy - prev.y) * (nz / z),
      }));
      return nz;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const clearCanvas = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const handleConfirmClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeIds([]);
    setEdgeStartNodeId(null);
    setPanOffset({ x: 0, y: 0 });
    setZoom(1.0);
    sessionStorage.removeItem(`playground_diagram_${question.id}`);
    localStorage.removeItem(`playground_diagram_${question.id}`);
    setShowClearConfirm(false);
  }, [question.id]);

  // Listen for keyboard actions (Spacebar pan, Deletion, Mode shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is editing text in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // 1. Spacebar for panning
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      // 2. Deletion
      if (e.key === "Delete" || e.key === "Backspace") {
        const selected = selectedNodeIdsRef.current;
        if (selected.length > 0) {
          setNodes((nds) => nds.filter((n) => !selected.includes(n.id)));
          setEdges((eds) =>
            eds.filter(
              (ed) => !selected.includes(ed.from) && !selected.includes(ed.to),
            ),
          );
          setSelectedNodeIds([]);
        }
        return;
      }

      // 3. Mode Shortcuts
      const key = e.key.toLowerCase();
      if (key === "1" || key === "v") {
        setMode("select");
        setEdgeStartNodeId(null);
      } else if (key === "2" || key === "h") {
        setMode("pan");
        setEdgeStartNodeId(null);
      } else if (key === "3" || key === "e") {
        setMode("edge");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Drag, Pan, and Marquee Selection listeners
  useEffect(() => {
    if (!draggingNodeId && !isPanning && !selectionStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPanOffset({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
        return;
      }

      if (draggingNodeId) {
        const deltaX = e.clientX - dragOffsetRef.current.x;
        const deltaY = e.clientY - dragOffsetRef.current.y;
        const dx = deltaX / zoomRef.current;
        const dy = deltaY / zoomRef.current;

        setNodes((nds) =>
          nds.map((n) => {
            const start = draggingNodesStartRef.current[n.id];
            if (start) {
              return { ...n, x: start.x + dx, y: start.y + dy };
            }
            return n;
          }),
        );
        return;
      }

      if (selectionStartRef.current) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          const curX =
            (e.clientX - rect.left - panOffsetRef.current.x) / zoomRef.current;
          const curY =
            (e.clientY - rect.top - panOffsetRef.current.y) / zoomRef.current;

          const startX = selectionStartRef.current.x;
          const startY = selectionStartRef.current.y;

          const x = Math.min(startX, curX);
          const y = Math.min(startY, curY);
          const w = Math.abs(startX - curX);
          const h = Math.abs(startY - curY);

          setSelectionBox({ x, y, w, h });

          // Select nodes inside marquee in realtime
          const overlappingIds: string[] = [];
          nodesRef.current.forEach((node) => {
            const nodeLeft = node.x - node.w / 2;
            const nodeRight = node.x + node.w / 2;
            const nodeTop = node.y - node.h / 2;
            const nodeBottom = node.y + node.h / 2;

            if (
              nodeLeft < x + w &&
              nodeRight > x &&
              nodeTop < y + h &&
              nodeBottom > y
            ) {
              overlappingIds.push(node.id);
            }
          });
          setSelectedNodeIds(overlappingIds);
        }
      }
    };

    const handleMouseUp = () => {
      setDraggingNodeId(null);
      setIsPanning(false);
      setSelectionStart(null);
      setSelectionBox(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingNodeId, isPanning, selectionStart]);

  // Wheel zoom handler registered manually for passive controls support
  useEffect(() => {
    const canvas = canvasWrapRef.current;
    if (!canvas) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.05;
      let newZoom = zoomRef.current;

      if (e.deltaY < 0) {
        newZoom = Math.min(zoomRef.current * zoomFactor, 2.5);
      } else {
        newZoom = Math.max(zoomRef.current / zoomFactor, 0.4);
      }

      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setPanOffset((prev) => ({
          x: mouseX - (mouseX - prev.x) * (newZoom / zoomRef.current),
          y: mouseY - (mouseY - prev.y) * (newZoom / zoomRef.current),
        }));
      }

      setZoom(newZoom);
    };

    canvas.addEventListener("wheel", handleWheelEvent, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheelEvent);
    };
  }, []);

  const getJSON = useCallback(() => {
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label,
        tag: n.tag,
        data: { label: n.label, type: n.type, tag: n.tag },
      })),
      edges: edges.map((e) => ({
        from: e.from,
        to: e.to,
        descriptor: e.descriptor,
        tag: e.tag,
        source: e.from,
        target: e.to,
        label: e.descriptor,
      })),
    };
  }, [nodes, edges]);

  const handleSubmit = useCallback(() => {
    onSubmit(getJSON());
  }, [onSubmit, getJSON]);

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] min-h-[600px] w-full rounded-card border border-line bg-surface/30 backdrop-blur overflow-hidden shadow-soft select-none text-fg">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between border-b border-line px-5 py-4 shrink-0 bg-surface/50">
        <div className="flex flex-col min-w-0 pr-8 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-accent font-bold">
              Playground
            </span>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border border-line text-muted bg-surface">
              {question.difficulty}
            </span>
          </div>
          <p className="text-[10px] text-muted truncate leading-relaxed">
            {question.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-muted bg-surface/50 hover:border-fg hover:text-fg transition-all"
          >
            Back to Questions
          </button>
          <button
            type="button"
            disabled={nodes.length === 0}
            onClick={handleSubmit}
            className="flex items-center justify-center gap-1.5 rounded-full bg-accent px-5 py-2 font-medium text-accent-contrast shadow-lift font-mono uppercase text-[10px] tracking-wider font-bold transition-all hover:-translate-y-0.5 hover:opacity-95 disabled:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Begin Interview
            <Play className="h-3 w-3 fill-current" />
          </button>
        </div>
      </div>

      {/* 2. Floating Mode Toolbar */}
      <ModeToolbar
        mode={mode}
        setMode={setMode}
        setEdgeStartNodeId={setEdgeStartNodeId}
        clearCanvas={clearCanvas}
      />

      {/* 3. Floating Toolbox (Left Sidebar) */}
      <Sidebar
        handleDragStart={handleDragStart}
        handleComponentClick={handleComponentClick}
      />

      {/* 4. Canvas Container */}
      <div
        ref={canvasWrapRef}
        id="canvas-wrap"
        className="w-full h-full relative overflow-hidden bg-bg"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <svg
          ref={svgRef}
          id="canvas-svg"
          className={`w-full h-full ${
            mode === "pan" || isSpacePressed
              ? isPanning
                ? "cursor-grabbing"
                : "cursor-grab"
              : "cursor-default"
          }`}
          onMouseDown={handleCanvasMouseDown}
          onContextMenu={handleContextMenu}
        >
          <defs>
            <marker
              id="arrow"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto"
            >
              <path d="M2,2 L8,5 L2,8 L3.5,5 z" fill="var(--line)" />
            </marker>
            <marker
              id="arrow-hover"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto"
            >
              <path d="M2,2 L8,5 L2,8 L3.5,5 z" fill="var(--accent)" />
            </marker>
            <pattern
              id="canvas-grid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}
            >
              <circle cx="0.5" cy="0.5" r="0.5" fill="var(--line)" />
            </pattern>
          </defs>

          <rect
            id="grid-rect"
            width="100%"
            height="100%"
            fill="url(#canvas-grid)"
          />

          {/* Canvas group */}
          <g
            transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}
          >
            {/* Edges Layer */}
            <g id="edges-layer">
              {edges.map((edge, idx) => (
                <EdgeElement
                  key={idx}
                  edge={edge}
                  nodes={nodes}
                  edges={edges}
                  handleEdgeDoubleClick={handleEdgeDoubleClick}
                />
              ))}
            </g>

            {/* Nodes Layer */}
            <g id="nodes-layer">
              {nodes.map((node) => (
                <NodeElement
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeIds.includes(node.id)}
                  isEdgeStart={edgeStartNodeId === node.id}
                  isEditing={editingNodeId === node.id}
                  handleNodeMouseDown={handleNodeMouseDown}
                  handleNodeDoubleClick={handleNodeDoubleClick}
                  handleContainerBlur={handleContainerBlur}
                  editName={editName}
                  setEditName={setEditName}
                  editTag={editTag}
                  setEditTag={setEditTag}
                  handleEditKeyDown={handleEditKeyDown}
                />
              ))}
            </g>

            {/* Selection Marquee Box */}
            {selectionBox && (
              <rect
                x={selectionBox.x}
                y={selectionBox.y}
                width={selectionBox.w}
                height={selectionBox.h}
                fill="rgba(55, 138, 221, 0.08)"
                stroke="var(--accent)"
                strokeWidth={1 / zoom}
                strokeDasharray={`${4 / zoom} ${3 / zoom}`}
                pointerEvents="none"
              />
            )}
          </g>
        </svg>

        {/* Edge hint */}
        {mode === "edge" && (
          <div className="absolute bottom-3 left-[180px] text-[10px] text-muted font-mono bg-raised/95 border border-line px-3.5 py-1.5 rounded-full pointer-events-none shadow-lift z-20">
            {!edgeStartNodeId
              ? "click source node"
              : "click target node to connect"}
          </div>
        )}

        {/* Zoom Controls Overlay */}
        <ZoomToolbar
          zoom={zoom}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          resetZoom={resetZoom}
        />

        {/* Edge Popup */}
        {pendingEdge && popupPosition && (
          <EdgePopup
            popupPosition={popupPosition}
            edgeDescriptor={edgeDescriptor}
            setEdgeDescriptor={setEdgeDescriptor}
            edgeTag={edgeTag}
            setEdgeTag={setEdgeTag}
            handleCancelEdge={handleCancelEdge}
            handleConfirmEdge={handleConfirmEdge}
            edgePopupRef={edgePopupRef}
          />
        )}

        {/* Custom Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xs bg-raised border border-line rounded-card p-5 shadow-lift text-center animate-in zoom-in-95 duration-200">
              <span className="font-mono text-[9px] uppercase tracking-widest text-warn font-bold block mb-1">
                Warning
              </span>
              <h3 className="font-display text-md font-semibold text-fg">
                Clear Playground?
              </h3>
              <p className="mt-2 text-[10px] text-muted leading-relaxed">
                This will permanently delete all components and connection lines on the canvas.
              </p>
              <div className="mt-5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 rounded-full border border-line py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold text-muted bg-surface/30 hover:border-fg hover:text-fg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="flex-1 rounded-full bg-warn py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold text-accent-contrast shadow-soft hover:opacity-90 transition-all cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Minimal Controls Guide (Bottom Right) */}
        <ControlsGuide />
      </div>
    </div>
  );
}
