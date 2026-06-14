"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play } from "lucide-react";
import type { Difficulty } from "@/lib/types";

interface SystemDesignQuestion {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  description: string;
}

interface NodeData {
  id: string;
  type: string;
  label: string;
  tag?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface EdgeData {
  from: string;
  to: string;
  descriptor: string;
  tag?: string;
}

const COMPONENTS = [
  { type: "client", label: "Client", color: "#378ADD", text: "#E6F1FB" },
  { type: "dns", label: "DNS", color: "#888780", text: "#F1EFE8" },
  { type: "cdn", label: "CDN", color: "#639922", text: "#EAF3DE" },
  { type: "lb", label: "Load Balancer", color: "#1D9E75", text: "#E1F5EE" },
  { type: "gateway", label: "API Gateway", color: "#7F77DD", text: "#EEEDFE" },
  { type: "service", label: "Service", color: "#BA7517", text: "#FAEEDA" },
  { type: "cache", label: "Cache", color: "#D85A30", text: "#FAECE7" },
  { type: "queue", label: "Queue", color: "#D4537E", text: "#FBEAF0" },
  { type: "db", label: "Database", color: "#185FA5", text: "#E6F1FB" },
  { type: "storage", label: "Object Store", color: "#5F5E5A", text: "#F1EFE8" },
  { type: "search", label: "Search", color: "#3B6D11", text: "#EAF3DE" },
  { type: "worker", label: "Worker", color: "#993C1D", text: "#FAECE7" },
];

const SUGGESTIONS = [
  "HTTP",
  "HTTPS",
  "gRPC",
  "WebSocket",
  "TCP",
  "async",
  "sync",
  "read",
  "write",
  "read/write",
  "cache hit",
  "pub/sub",
  "stream",
  "event",
  "REST",
  "GraphQL",
  "SQL query",
  "message",
];

const EDGE_TAG_SUGGESTIONS = [
  "sync",
  "async",
  "read-only",
  "write-only",
  "cached",
  "fallback",
  "secure",
];

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
  question: SystemDesignQuestion;
  onBack: () => void;
  onSubmit: (data: { nodes: ExportedNode[]; edges: ExportedEdge[] }) => void;
}

export default function SystemDesignPlayground({
  question,
  onBack,
  onSubmit,
}: SystemDesignPlaygroundProps) {
  const [nodes, setNodes] = useState<NodeData[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`playground_diagram_${question.id}`);
      if (saved) {
        try {
          const { nodes: savedNodes } = JSON.parse(saved);
          if (Array.isArray(savedNodes) && savedNodes.length > 0) {
            return savedNodes;
          }
        } catch (e) {
          console.error("Error loading saved layout:", e);
        }
      }
    }

    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const h = typeof window !== "undefined" ? window.innerHeight : 700;
    const sidebarWidth = 180;
    const cx = sidebarWidth + (w - sidebarWidth) / 2;
    const cy = h / 2;

    return [
      {
        id: "n1",
        type: "client",
        label: "Mobile/Web",
        tag: "React Client",
        x: cx - 230,
        y: cy,
        w: 124,
        h: 48,
      },
      {
        id: "n2",
        type: "gateway",
        label: "API Gateway",
        tag: "Kong",
        x: cx,
        y: cy,
        w: 124,
        h: 48,
      },
      {
        id: "n3",
        type: "db",
        label: "User database",
        tag: "PostgreSQL",
        x: cx + 230,
        y: cy,
        w: 124,
        h: 48,
      },
    ];
  });

  const [edges, setEdges] = useState<EdgeData[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`playground_diagram_${question.id}`);
      if (saved) {
        try {
          const { edges: savedEdges } = JSON.parse(saved);
          if (Array.isArray(savedEdges)) {
            return savedEdges;
          }
        } catch (e) {
          console.error("Error loading saved layout:", e);
        }
      }
    }

    return [
      {
        from: "n1",
        to: "n2",
        descriptor: "HTTPS",
        tag: "sync",
      },
      {
        from: "n2",
        to: "n3",
        descriptor: "SQL query",
        tag: "read/write",
      },
    ];
  });

  const [mode, setMode] = useState<"select" | "pan" | "edge">("select");
  
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  const [pendingEdge, setPendingEdge] = useState<{ from: NodeData; to: NodeData } | null>(null);
  
  // Drag state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingNodesStart, setDraggingNodesStart] = useState<{ [id: string]: { x: number; y: number } }>({});

  // Selection box state for marquee selection
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Spacebar state
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Zoom state
  const [zoom, setZoom] = useState(1.0);

  // Inline editor state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTag, setEditTag] = useState("");

  // Popup state
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [edgeDescriptor, setEdgeDescriptor] = useState("");
  const [edgeTag, setEdgeTag] = useState("");

  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const edgePopupRef = useRef<HTMLDivElement>(null);
  const nodeCounterRef = useRef(3);

  const nodesRef = useRef(nodes);
  const selectedNodeIdsRef = useRef(selectedNodeIds);
  const dragOffsetRef = useRef(dragOffset);
  const draggingNodesStartRef = useRef(draggingNodesStart);
  const panStartRef = useRef(panStart);
  const zoomRef = useRef(zoom);
  const selectionStartRef = useRef(selectionStart);
  const panOffsetRef = useRef(panOffset);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { selectedNodeIdsRef.current = selectedNodeIds; }, [selectedNodeIds]);
  useEffect(() => { dragOffsetRef.current = dragOffset; }, [dragOffset]);
  useEffect(() => { draggingNodesStartRef.current = draggingNodesStart; }, [draggingNodesStart]);
  useEffect(() => { panStartRef.current = panStart; }, [panStart]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { selectionStartRef.current = selectionStart; }, [selectionStart]);
  useEffect(() => { panOffsetRef.current = panOffset; }, [panOffset]);

  // Update node counter ref
  useEffect(() => {
    let maxId = 3;
    nodes.forEach((n: NodeData) => {
      const idNum = parseInt(n.id.replace("n", ""), 10);
      if (!isNaN(idNum) && idNum > maxId) {
        maxId = idNum;
      }
    });
    nodeCounterRef.current = maxId;
  }, [nodes]);

  // Save nodes and edges to localStorage
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      localStorage.setItem(`playground_diagram_${question.id}`, JSON.stringify({ nodes, edges }));
    }
  }, [nodes, edges, question.id]);

  const handleCancelEdge = useCallback(() => {
    setPopupPosition(null);
    setPendingEdge(null);
    setEdgeStartNodeId(null);
    setMode((prev) => (prev === "edge" ? "select" : prev));
  }, []);

  // Click Outside to Dismiss edge popup and reset to select mode
  useEffect(() => {
    if (!popupPosition) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        edgePopupRef.current &&
        !edgePopupRef.current.contains(e.target as Node)
      ) {
        handleCancelEdge();
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popupPosition, handleCancelEdge]);

  const handleComponentClick = useCallback((type: string) => {
    const comp = COMPONENTS.find((c) => c.type === type);
    if (!comp) return;

    const id = `n${++nodeCounterRef.current}`;
    
    // Find dynamic center of canvas wrap (visible workspace center, offsetting the left sidebar)
    const rect = svgRef.current?.getBoundingClientRect();
    const w = rect ? rect.width : (typeof window !== "undefined" ? window.innerWidth : 1200);
    const h = rect ? rect.height : (typeof window !== "undefined" ? window.innerHeight : 700);
    const sidebarWidth = 180;
    const cx = sidebarWidth + (w - sidebarWidth) / 2;
    const cy = h / 2;

    const rx = Math.random() * 80 - 40;
    const ry = Math.random() * 80 - 40;
    const x = (cx - panOffset.x) / zoom + rx;
    const y = (cy - panOffset.y) / zoom + ry;

    setNodes((nds) => [...nds, { id, type, label: comp.label, x, y, w: 124, h: 48 }]);
  }, [panOffset, zoom]);

  const handleDragStart = useCallback((e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("text/plain", type);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("text/plain");
    if (!type) return;

    const comp = COMPONENTS.find((c) => c.type === type);
    if (!comp) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    const id = `n${++nodeCounterRef.current}`;
    setNodes((nds) => [...nds, { id, type, label: comp.label, x, y, w: 124, h: 48 }]);
  }, [panOffset, zoom]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, node: NodeData) => {
    if (editingNodeId === node.id) return;
    
    e.stopPropagation();

    if (mode === "edge") {
      if (!edgeStartNodeId) {
        setEdgeStartNodeId(node.id);
      } else if (edgeStartNodeId !== node.id) {
        const fromNode = nodes.find((n) => n.id === edgeStartNodeId);
        if (fromNode) {
          setPendingEdge({ from: fromNode, to: node });
          const rect = svgRef.current?.getBoundingClientRect();
          if (rect) {
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            const wrapRect = canvasWrapRef.current?.getBoundingClientRect();
            if (wrapRect) {
              let left = clickX + 10;
              let top = clickY + 10;
              if (left + 260 > wrapRect.width) left = clickX - 260;
              if (top + 260 > wrapRect.height) top = clickY - 260;
              setPopupPosition({ x: left, y: top });
            }
            setEdgeDescriptor("");
            setEdgeTag("");
          }
        }
      }
      return;
    }

    // Determine target selection based on shift key
    let newSelected: string[];
    if (e.shiftKey) {
      if (selectedNodeIds.includes(node.id)) {
        newSelected = selectedNodeIds.filter((id) => id !== node.id);
      } else {
        newSelected = [...selectedNodeIds, node.id];
      }
    } else {
      if (selectedNodeIds.includes(node.id)) {
        newSelected = selectedNodeIds;
      } else {
        newSelected = [node.id];
      }
    }
    setSelectedNodeIds(newSelected);

    // Store drag starting positions for all selected nodes
    const startPositions: { [id: string]: { x: number; y: number } } = {};
    newSelected.forEach((id) => {
      const n = nodes.find((x) => x.id === id);
      if (n) {
        startPositions[id] = { x: n.x, y: n.y };
      }
    });
    // Ensure the clicked node is in startPositions
    if (!startPositions[node.id]) {
      startPositions[node.id] = { x: node.x, y: node.y };
    }

    setDraggingNodesStart(startPositions);
    setDraggingNodeId(node.id);
    
    setDragOffset({
      x: e.clientX,
      y: e.clientY,
    });
  }, [editingNodeId, mode, edgeStartNodeId, nodes, selectedNodeIds]);

  const handleNodeDoubleClick = useCallback((e: React.MouseEvent, node: NodeData) => {
    if (mode !== "select") return;
    e.stopPropagation();
    setSelectedNodeIds([node.id]);
    setEditingNodeId(node.id);
    setEditName(node.label);
    setEditTag(node.tag || "");
  }, [mode]);

  const handleEdgeDoubleClick = useCallback((e: React.MouseEvent, edge: EdgeData) => {
    e.stopPropagation();
    const fromNode = nodes.find((n) => n.id === edge.from);
    const toNode = nodes.find((n) => n.id === edge.to);
    if (!fromNode || !toNode) return;

    setPendingEdge({ from: fromNode, to: toNode });
    setEdgeDescriptor(edge.descriptor);
    setEdgeTag(edge.tag || "");

    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const wrapRect = canvasWrapRef.current?.getBoundingClientRect();
      if (wrapRect) {
        let left = clickX + 10;
        let top = clickY + 10;
        if (left + 260 > wrapRect.width) left = clickX - 260;
        if (top + 260 > wrapRect.height) top = clickY - 260;
        setPopupPosition({ x: left, y: top });
      }
    }
  }, [nodes]);

  const handleSaveInline = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              label: editName.trim() || n.label,
              tag: editTag.trim() ? editTag.trim() : undefined,
            }
          : n
      )
    );
    setEditingNodeId(null);
  }, [editName, editTag]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent, nodeId: string) => {
    if (e.key === "Enter") {
      handleSaveInline(nodeId);
    } else if (e.key === "Escape") {
      setEditingNodeId(null);
    }
  }, [handleSaveInline]);

  const handleContainerBlur = useCallback((e: React.FocusEvent, nodeId: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    handleSaveInline(nodeId);
  }, [handleSaveInline]);

  const handleConfirmEdge = useCallback(() => {
    if (!pendingEdge) return;
    
    const exists = edges.some(
      (e) => e.from === pendingEdge.from.id && e.to === pendingEdge.to.id
    );

    if (exists) {
      setEdges((eds) =>
        eds.map((e) =>
          e.from === pendingEdge.from.id && e.to === pendingEdge.to.id
            ? { ...e, descriptor: edgeDescriptor.trim(), tag: edgeTag.trim() || undefined }
            : e
        )
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

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as SVGElement).id === "grid-rect") {
      setSelectedNodeIds([]);
      setEdgeStartNodeId(null);
      handleCancelEdge();
      
      const isPanningActive = mode === "pan" || isSpacePressed || e.button === 1 || e.button === 2;

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
  }, [mode, isSpacePressed, panOffset, zoom, handleCancelEdge]);

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
    if (confirm("Clear all nodes and connections?")) {
      setNodes([]);
      setEdges([]);
      setSelectedNodeIds([]);
      setEdgeStartNodeId(null);
      setPanOffset({ x: 0, y: 0 });
      setZoom(1.0);
      localStorage.removeItem(`playground_diagram_${question.id}`);
    }
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
          setEdges((eds) => eds.filter((ed) => !selected.includes(ed.from) && !selected.includes(ed.to)));
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
          })
        );
        return;
      }

      if (selectionStartRef.current) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          const curX = (e.clientX - rect.left - panOffsetRef.current.x) / zoomRef.current;
          const curY = (e.clientY - rect.top - panOffsetRef.current.y) / zoomRef.current;
          
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

  const difficultyColors = {
    easy: "border-accent/30 bg-accent-soft text-accent",
    medium: "border-orange-500/20 bg-orange-500/10 text-orange-400",
    hard: "border-warn/20 bg-warn/10 text-warn",
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-40 bg-bg overflow-hidden flex select-none">
      
      {/* 1. Floating Header Card */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between bg-surface/95 backdrop-blur border border-line rounded-card px-4 py-3 shadow-lift z-20 select-none text-left">
        <div className="flex flex-col gap-0.5 max-w-[50%] md:max-w-[65%]">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-base sm:text-lg font-semibold leading-tight text-fg truncate">
              {question.title}
            </h1>
            <span
              className={`rounded-pill border px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider ${
                difficultyColors[question.difficulty]
              }`}
            >
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
      <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-surface/95 backdrop-blur border border-line rounded-full px-2.5 py-1.5 shadow-lift z-20 select-none">
        <button
          onClick={() => { setMode("select"); setEdgeStartNodeId(null); }}
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
          onClick={() => { setMode("pan"); setEdgeStartNodeId(null); }}
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

      {/* 3. Floating Toolbox (Left Sidebar) */}
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
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#888" />
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
          <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
            {/* Edges Layer */}
            <g id="edges-layer">
              {edges.map((edge, idx) => {
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
                    key={idx}
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
              })}
            </g>

            {/* Nodes Layer */}
            <g id="nodes-layer">
              {nodes.map((node) => {
                const comp = COMPONENTS.find((c) => c.type === node.type) || COMPONENTS[0];
                const isSelected = selectedNodeIds.includes(node.id);
                const isEdgeStart = edgeStartNodeId === node.id;
                const isEditing = editingNodeId === node.id;

                const nodeHeader = "[" + node.type + "]" + (node.tag ? ` · ${node.tag}` : "");

                return (
                  <g
                    key={node.id}
                    className="node-group cursor-move"
                    transform={`translate(${node.x - node.w / 2}, ${node.y - node.h / 2})`}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                    onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
                  >
                    <rect
                      className={`node-rect transition-all ${
                        isSelected ? "selected stroke-2" : "stroke-1"
                      }`}
                      width={node.w}
                      height={node.h}
                      rx={6}
                      fill={comp.color}
                      stroke={isSelected || isEdgeStart ? "#ffffff" : comp.color}
                      strokeWidth={isSelected || isEdgeStart ? 2 : 1}
                    />
                    
                    {isEditing ? (
                      <foreignObject
                        x={3}
                        y={3}
                        width={node.w - 6}
                        height={node.h - 6}
                      >
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
              })}
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

        {/* Edge Popup */}
        {popupPosition && (
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
                1. protocol / descriptor
              </label>
              <input
                value={edgeDescriptor}
                onChange={(e) => setEdgeDescriptor(e.target.value)}
                className="w-full text-xs font-mono p-1.5 rounded-card border border-line bg-bg text-fg outline-none focus:border-accent"
                placeholder="e.g. HTTPS, gRPC..."
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
                2. custom tag / detail (optional)
              </label>
              <input
                value={edgeTag}
                onChange={(e) => setEdgeTag(e.target.value)}
                className="w-full text-xs font-mono p-1.5 rounded-card border border-line bg-bg text-fg outline-none focus:border-accent"
                placeholder="e.g. async, fallback..."
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
                className="text-[10px] font-mono px-2.5 py-1 rounded-card bg-accent text-accent-contrast border border-accent hover:opacity-90 transition-opacity"
              >
                add edge
              </button>
            </div>
          </div>
        )}

        {/* Minimal Controls Guide (Bottom Right) */}
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
      </div>
    </div>
  );
}
