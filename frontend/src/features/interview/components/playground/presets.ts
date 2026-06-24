import { NodeData } from "./NodeElement";
import { EdgeData } from "./EdgeElement";

export interface PresetDiagram {
  nodes: NodeData[];
  edges: EdgeData[];
}

export const PRESET_DIAGRAMS: Record<string, PresetDiagram> = {
  "url-shortener": {
    nodes: [
      { id: "n1", type: "client", label: "User Client", x: 332, y: 286, w: 130, h: 48, tag: "Web/Mobile" },
      { id: "n2", type: "dns", label: "DNS Server", x: 586, y: 110, w: 130, h: 48 },
      { id: "n3", type: "lb", label: "Load Balancer", x: 568, y: 470, w: 130, h: 48, tag: "NGINX" },
      { id: "n4", type: "gateway", label: "API Gateway", x: 734, y: 271, w: 130, h: 48 },
      { id: "n5", type: "service", label: "Shortening Service", x: 910, y: 96, w: 130, h: 48, tag: "App Servers" },
      { id: "n6", type: "service", label: "Redirection Service", x: 993, y: 496, w: 130, h: 48, tag: "App Servers" },
      { id: "n7", type: "cache", label: "Cache", x: 1298, y: 110, w: 130, h: 48, tag: "Redis" },
      { id: "n8", type: "db", label: "Metadata DB", x: 1367, y: 339, w: 130, h: 48, tag: "MongoDB/MySQL" },
    ],
    edges: [
      { from: "n1", to: "n2", descriptor: "1. Lookup API Address", tag: "sync" },
      { from: "n1", to: "n3", descriptor: "2. Send Request", tag: "sync" },
      { from: "n3", to: "n4", descriptor: "3. Route Request", tag: "sync" },
      { from: "n4", to: "n5", descriptor: "Shorten Request", tag: "sync" },
      { from: "n4", to: "n6", descriptor: "Redirect Request", tag: "sync" },
      { from: "n6", to: "n7", descriptor: "Check Cache First", tag: "sync" },
      { from: "n6", to: "n8", descriptor: "Query on Cache Miss", tag: "sync" },
      { from: "n5", to: "n8", descriptor: "Save Mapping", tag: "sync" },
      { from: "n5", to: "n7", descriptor: "Write to Cache", tag: "sync" },
    ],
  },
  "notification-service": {
    nodes: [
      { id: "n1", type: "client", label: "Backend Services", x: 80, y: 200, w: 130, h: 48, tag: "Trigger APIs" },
      { id: "n2", type: "service", label: "Notification Service", x: 260, y: 200, w: 130, h: 48, tag: "Validation & Auth" },
      { id: "n3", type: "db", label: "User Settings DB", x: 260, y: 80, w: 130, h: 48, tag: "PostgreSQL" },
      { id: "n4", type: "queue", label: "Message Queue", x: 440, y: 200, w: 130, h: 48, tag: "Kafka" },
      { id: "n5", type: "worker", label: "Notification Workers", x: 620, y: 200, w: 130, h: 48, tag: "Consumer" },
      { id: "n6", type: "custom", label: "Third Party Providers", x: 800, y: 200, w: 130, h: 48, tag: "APNs / Twilio" },
      { id: "n7", type: "db", label: "Notification Log Store", x: 620, y: 320, w: 130, h: 48, tag: "Cassandra" },
    ],
    edges: [
      { from: "n1", to: "n2", descriptor: "Send Notification Request", tag: "sync" },
      { from: "n2", to: "n3", descriptor: "Fetch User Preferences", tag: "sync" },
      { from: "n2", to: "n4", descriptor: "Publish Message", tag: "async" },
      { from: "n4", to: "n5", descriptor: "Consume Task", tag: "async" },
      { from: "n5", to: "n6", descriptor: "Deliver Push/SMS", tag: "sync" },
      { from: "n5", to: "n7", descriptor: "Update Delivery Status", tag: "async" },
    ],
  },
  "rate-limiter": {
    nodes: [
      { id: "n1", type: "client", label: "User Client", x: 80, y: 200, w: 130, h: 48 },
      { id: "n2", type: "lb", label: "Load Balancer", x: 260, y: 200, w: 130, h: 48 },
      { id: "n3", type: "gateway", label: "API Gateway + Rate Limiter Middleware", x: 440, y: 200, w: 130, h: 48 },
      { id: "n4", type: "cache", label: "Rate Limiter Cache", x: 440, y: 80, w: 130, h: 48, tag: "Redis Cluster" },
      { id: "n5", type: "service", label: "Backend Services", x: 620, y: 200, w: 130, h: 48 },
    ],
    edges: [
      { from: "n1", to: "n2", descriptor: "API Request", tag: "sync" },
      { from: "n2", to: "n3", descriptor: "Forward Request", tag: "sync" },
      { from: "n3", to: "n4", descriptor: "Retrieve/Increment Token Count", tag: "sync" },
      { from: "n3", to: "n5", descriptor: "Forward If Under Limit", tag: "sync" },
    ],
  },
  "whatsapp": {
    nodes: [
      { id: "n1", type: "client", label: "Sender Client", x: 273.65, y: 170.45, w: 130, h: 48 },
      { id: "n2", type: "client", label: "Receiver Client", x: 283.25, y: 455.05, w: 130, h: 48 },
      { id: "n3", type: "gateway", label: "Chat WebSocket Gateway", x: 701.425, y: 272, w: 130, h: 48, tag: "WS Connections" },
      { id: "n4", type: "service", label: "Chat Service", x: 941.25, y: 518.95, w: 130, h: 48 },
      { id: "n5", type: "service", label: "Presence Service", x: 877.65, y: 112.15, w: 130, h: 48 },
      { id: "n6", type: "db", label: "Message DB", x: 1375.7, y: 276.3, w: 130, h: 48, tag: "Cassandra" },
      { id: "n7", type: "cache", label: "Status Cache", x: 1354.2, y: 120.1, w: 130, h: 48, tag: "Redis" },
    ],
    edges: [
      { from: "n1", to: "n3", descriptor: "Send Message Via WS", tag: "sync" },
      { from: "n3", to: "n2", descriptor: "Deliver Message Via WS", tag: "async" },
      { from: "n3", to: "n4", descriptor: "Process Message", tag: "sync" },
      { from: "n3", to: "n5", descriptor: "Heartbeat / Presence", tag: "async" },
      { from: "n4", to: "n6", descriptor: "Persist Message History", tag: "async" },
      { from: "n5", to: "n7", descriptor: "Update User Online Status", tag: "sync" },
    ],
  },
  "web-crawler": {
    nodes: [
      { id: "n1", type: "service", label: "URL Frontier", x: 80, y: 200, w: 130, h: 48, tag: "FIFO / Priority Queue" },
      { id: "n2", type: "worker", label: "HTML Downloader", x: 260, y: 200, w: 130, h: 48, tag: "Crawl Workers" },
      { id: "n3", type: "dns", label: "DNS Resolver", x: 260, y: 80, w: 130, h: 48 },
      { id: "n4", type: "service", label: "HTML Parser", x: 440, y: 200, w: 130, h: 48 },
      { id: "n5", type: "service", label: "Content Duplicate Detector", x: 620, y: 200, w: 130, h: 48 },
      { id: "n6", type: "db", label: "Document / Content DB", x: 620, y: 320, w: 130, h: 48, tag: "HDFS / S3" },
      { id: "n7", type: "service", label: "Link Extractor & Filter", x: 800, y: 200, w: 130, h: 48 },
      { id: "n8", type: "db", label: "Crawl History / URL Filter", x: 800, y: 80, w: 130, h: 48, tag: "HBase" },
    ],
    edges: [
      { from: "n1", to: "n2", descriptor: "Fetch Next URL", tag: "sync" },
      { from: "n2", to: "n3", descriptor: "Resolve Hostname", tag: "sync" },
      { from: "n2", to: "n4", descriptor: "Parse Page Content", tag: "sync" },
      { from: "n4", to: "n5", descriptor: "Check Similarity", tag: "sync" },
      { from: "n5", to: "n6", descriptor: "Store New Page", tag: "sync" },
      { from: "n5", to: "n7", descriptor: "Extract Links", tag: "sync" },
      { from: "n7", to: "n8", descriptor: "Filter Duplicates", tag: "sync" },
      { from: "n7", to: "n1", descriptor: "Enqueue New Unique URLs", tag: "async" },
    ],
  },
  "netflix": {
    nodes: [
      { id: "n1", type: "client", label: "Smart TV / Phone App", x: 374, y: 260, w: 130, h: 48 },
      { id: "n2", type: "cdn", label: "Netflix Open Connect CDN", x: 663, y: 113, w: 130, h: 48 },
      { id: "n3", type: "gateway", label: "Zuul API Gateway", x: 675, y: 440, w: 130, h: 48 },
      { id: "n4", type: "service", label: "Playback Service", x: 1087, y: 293, w: 130, h: 48 },
      { id: "n5", type: "service", label: "Video Transcoding Service", x: 993, y: 500, w: 130, h: 48 },
      { id: "n6", type: "storage", label: "Asset Storage", x: 1367, y: 280, w: 130, h: 48, tag: "Amazon S3" },
      { id: "n7", type: "db", label: "User Profile & History DB", x: 1358, y: 71, w: 130, h: 48, tag: "Cassandra" },
    ],
    edges: [
      { from: "n1", to: "n2", descriptor: "Stream Video Chunks", tag: "sync" },
      { from: "n1", to: "n3", descriptor: "Fetch Video Metadata", tag: "sync" },
      { from: "n3", to: "n4", descriptor: "Route Request", tag: "sync" },
      { from: "n4", to: "n7", descriptor: "Fetch Viewing Progress", tag: "sync" },
      { from: "n4", to: "n2", descriptor: "Direct Client to Closest CDN", tag: "sync" },
      { from: "n5", to: "n6", descriptor: "Read Raw / Write Chunks", tag: "sync" },
    ],
  },
  "uber": {
    nodes: [
      { id: "n1", type: "client", label: "Rider App", x: 80, y: 100, w: 130, h: 48 },
      { id: "n2", type: "client", label: "Driver App", x: 80, y: 260, w: 130, h: 48 },
      { id: "n3", type: "gateway", label: "API Gateway", x: 260, y: 180, w: 130, h: 48 },
      { id: "n4", type: "service", label: "Location Service", x: 440, y: 260, w: 130, h: 48, tag: "WebSockets" },
      { id: "n5", type: "cache", label: "Geospatial Cache", x: 620, y: 260, w: 130, h: 48, tag: "Redis (Geo)" },
      { id: "n6", type: "service", label: "Matcher Service", x: 440, y: 100, w: 130, h: 48, tag: "Route Matching" },
      { id: "n7", type: "db", label: "Trip & Transaction DB", x: 620, y: 100, w: 130, h: 48, tag: "PostgreSQL" },
    ],
    edges: [
      { from: "n1", to: "n3", descriptor: "Request Ride", tag: "sync" },
      { from: "n2", to: "n3", descriptor: "Send Location Update", tag: "sync" },
      { from: "n3", to: "n4", descriptor: "Forward Driver Telemetry", tag: "sync" },
      { from: "n4", to: "n5", descriptor: "Index Location", tag: "sync" },
      { from: "n3", to: "n6", descriptor: "Find Driver", tag: "sync" },
      { from: "n6", to: "n5", descriptor: "Query Nearby Drivers", tag: "sync" },
      { from: "n6", to: "n7", descriptor: "Record Trip Info", tag: "sync" },
    ],
  },
  "distributed-cache": {
    nodes: [
      { id: "n1", type: "client", label: "App Servers", x: 80, y: 200, w: 130, h: 48 },
      { id: "n2", type: "service", label: "Client Library (Hashing Router)", x: 260, y: 200, w: 130, h: 48, tag: "Consistent Hashing" },
      { id: "n3", type: "worker", label: "Cache Node A (Primary)", x: 480, y: 80, w: 130, h: 48 },
      { id: "n4", type: "worker", label: "Cache Node B (Primary)", x: 480, y: 200, w: 130, h: 48 },
      { id: "n5", type: "worker", label: "Cache Node C (Primary)", x: 480, y: 320, w: 130, h: 48 },
      { id: "n6", type: "worker", label: "Cache Node A (Replica)", x: 680, y: 80, w: 130, h: 48 },
    ],
    edges: [
      { from: "n1", to: "n2", descriptor: "Get(key) / Put(key)", tag: "sync" },
      { from: "n2", to: "n3", descriptor: "Route Key Range A", tag: "sync" },
      { from: "n2", to: "n4", descriptor: "Route Key Range B", tag: "sync" },
      { from: "n2", to: "n5", descriptor: "Route Key Range C", tag: "sync" },
      { from: "n3", to: "n6", descriptor: "Replicate Data", tag: "async" },
    ],
  },
};
