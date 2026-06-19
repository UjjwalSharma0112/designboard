"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, ArrowRight } from "lucide-react";
import type { SessionConfig, Difficulty } from "@/lib/types";
import SystemDesignPlayground from "./SystemDesignPlayground";

export interface SystemDesignQuestion {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  description: string;
}

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

export const SYSTEM_DESIGN_QUESTIONS: SystemDesignQuestion[] = [
  {
    id: "url-shortener",
    title: "Design a URL Shortener (TinyURL)",
    difficulty: "easy",
    tags: ["Hashing", "NoSQL", "Redirection", "Caching"],
    description: "Design a system that generates a short, unique alias for a long URL and redirects users to the original URL when accessed."
  },
  {
    id: "notification-service",
    title: "Design a Notification System",
    difficulty: "easy",
    tags: ["Message Queue", "Pub/Sub", "Third-party APIs", "Retry Logic"],
    description: "Design a scalable service to send real-time alerts, emails, push notifications, and SMS messages to users."
  },
  {
    id: "rate-limiter",
    title: "Design an API Rate Limiter",
    difficulty: "medium",
    tags: ["Redis", "Middleware", "Token Bucket", "Scalability"],
    description: "Design a highly available and distributed rate limiting system to protect downstream services from excessive traffic."
  },
  {
    id: "whatsapp",
    title: "Design WhatsApp / Chat System",
    difficulty: "medium",
    tags: ["WebSockets", "Pub/Sub", "Message Queue", "Presence Service"],
    description: "Design a real-time instant messaging service supporting one-on-one and group messaging, file transfer, and active/idle presence status."
  },
  {
    id: "web-crawler",
    title: "Design a Web Crawler",
    difficulty: "medium",
    tags: ["Distributed Queue", "DNS Resolver", "Duplicate Elimination", "Storage"],
    description: "Design a distributed system that crawls the web, parses HTML pages, and stores extracted content for a search engine index."
  },
  {
    id: "netflix",
    title: "Design Netflix (Video Streaming)",
    difficulty: "hard",
    tags: ["CDN", "Video Transcoding", "Object Storage", "High Availability"],
    description: "Design a video streaming platform that supports low-latency, adaptive video playback for millions of concurrent users."
  },
  {
    id: "uber",
    title: "Design Uber (Ride-Sharing)",
    difficulty: "hard",
    tags: ["Geospatial Indexing", "WebSockets", "Matching Service", "Kafka"],
    description: "Design a system to track real-time driver locations, match riders with nearby drivers, and compute dynamic route ETAs."
  },
  {
    id: "distributed-cache",
    title: "Design a Distributed Cache",
    difficulty: "hard",
    tags: ["LRU", "Consistent Hashing", "Replication", "In-Memory"],
    description: "Design a high-performance, distributed key-value storage system like Redis or Memcached with replication and partition tolerance."
  }
];

interface SetupPanelProps {
  onStart: (config: SessionConfig) => void;
  isTtsEnabled: boolean;
  onToggleTts: (enabled: boolean) => void;
}

export default function SetupPanel({
  onStart,
  isTtsEnabled,
  onToggleTts,
}: SetupPanelProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<SystemDesignQuestion | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("system_design_playground.selected_question");
    if (saved) {
      try {
        setSelectedQuestion(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const handleSelectQuestion = (q: SystemDesignQuestion | null) => {
    setSelectedQuestion(q);
    if (typeof window !== "undefined") {
      if (q) {
        sessionStorage.setItem("system_design_playground.selected_question", JSON.stringify(q));
      } else {
        sessionStorage.removeItem("system_design_playground.selected_question");
      }
    }
  };

  const handleSubmitPlayground = (diagramData: { nodes: ExportedNode[]; edges: ExportedEdge[] }) => {
    if (!selectedQuestion) return;

    // Clean session and local storage draft state upon starting the interview
    sessionStorage.removeItem("system_design_playground.selected_question");
    sessionStorage.removeItem(`playground_diagram_${selectedQuestion.id}`);
    localStorage.removeItem("system_design_playground.selected_question");
    localStorage.removeItem(`playground_diagram_${selectedQuestion.id}`);

    // Serialize react-flow data
    const serialized = JSON.stringify(diagramData);

    onStart({
      topic: selectedQuestion.title,
      difficulty: selectedQuestion.difficulty,
      interviewContext: serialized,
    });
  };

  const difficultyColors = {
    easy: "border-accent/30 bg-accent-soft text-accent",
    medium: "border-orange-500/20 bg-orange-500/10 text-orange-400",
    hard: "border-warn/20 bg-warn/10 text-warn",
  };

  if (selectedQuestion) {
    return (
      <SystemDesignPlayground
        question={selectedQuestion}
        onBack={() => {
          if (selectedQuestion) {
            sessionStorage.removeItem(`playground_diagram_${selectedQuestion.id}`);
            localStorage.removeItem(`playground_diagram_${selectedQuestion.id}`);
          }
          handleSelectQuestion(null);
        }}
        onSubmit={handleSubmitPlayground}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl self-center my-auto"
    >
      <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            Practice Arena
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-fg">
            Choose a System Design Challenge
          </h1>
          <p className="mt-3 text-sm text-muted">
            Select a system design question, model your architecture in the playground, and let the AI interview you.
          </p>
        </div>

        {/* Voice Setting in Header */}
        <div className="flex gap-2 shrink-0 border border-line bg-surface/30 p-1.5 rounded-pill">
          <button
            type="button"
            onClick={() => onToggleTts(true)}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-mono transition-all ${
              isTtsEnabled
                ? "bg-accent text-accent-contrast shadow-soft"
                : "text-muted hover:text-fg"
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
            Voice On
          </button>
          <button
            type="button"
            onClick={() => onToggleTts(false)}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-mono transition-all ${
              !isTtsEnabled
                ? "bg-accent text-accent-contrast shadow-soft"
                : "text-muted hover:text-fg"
            }`}
          >
            <VolumeX className="h-3.5 w-3.5" />
            Voice Off
          </button>
        </div>
      </header>

      {/* Grid of System Design Questions */}
      <div className="grid gap-4 sm:grid-cols-2">
        {SYSTEM_DESIGN_QUESTIONS.map((q, idx) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => handleSelectQuestion(q)}
            className="group relative flex flex-col justify-between rounded-card border border-line bg-surface/35 p-5 shadow-soft hover:border-accent hover:bg-surface/65 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-pill border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                    difficultyColors[q.difficulty]
                  }`}
                >
                  {q.difficulty}
                </span>
                
                <div className="flex gap-1.5">
                  {q.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-raised/80 border border-line/50 px-1.5 py-0.5 text-[10px] text-faint font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                  {q.tags.length > 2 && (
                    <span className="rounded bg-raised/80 border border-line/50 px-1 py-0.5 text-[10px] text-faint font-mono">
                      +{q.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-display text-lg font-semibold leading-snug text-fg group-hover:text-accent transition-colors">
                {q.title}
              </h3>
              
              <p className="text-xs text-muted leading-relaxed line-clamp-3">
                {q.description}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-accent opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              <span>Select & Design</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
