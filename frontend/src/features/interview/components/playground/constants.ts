export interface ComponentPreset {
  type: string;
  label: string;
  color: string;
  text: string;
}

export const COMPONENTS: ComponentPreset[] = [
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
  { type: "custom", label: "Custom", color: "#475569", text: "#f8fafc" },
  { type: "note", label: "Note / Text", color: "#FEF08A", text: "#713F12" },
];

export const SUGGESTIONS = [
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
];

export const EDGE_TAG_SUGGESTIONS = [
  "sync",
  "async",
  "polling",
  "fallback",
  "primary",
  "replica",
  "read-only",
  "write-only",
];
