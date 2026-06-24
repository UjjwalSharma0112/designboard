"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Volume2,
  VolumeX,
  ArrowRight,
  Zap,
  X,
  LogIn,
  UserPlus,
  Play,
} from "lucide-react";
import type { SessionConfig, Difficulty } from "@/lib/types";
import SystemDesignPlayground from "./SystemDesignPlayground";
import { useAuth } from "@/features/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { PRESET_DIAGRAMS } from "./playground/presets";

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
    description:
      "Design a system that generates a short, unique alias for a long URL and redirects users to the original URL when accessed.",
  },
  {
    id: "notification-service",
    title: "Design a Notification System",
    difficulty: "easy",
    tags: ["Message Queue", "Pub/Sub", "Third-party APIs", "Retry Logic"],
    description:
      "Design a scalable service to send real-time alerts, emails, push notifications, and SMS messages to users.",
  },
  {
    id: "rate-limiter",
    title: "Design an API Rate Limiter",
    difficulty: "medium",
    tags: ["Redis", "Middleware", "Token Bucket", "Scalability"],
    description:
      "Design a highly available and distributed rate limiting system to protect downstream services from excessive traffic.",
  },
  {
    id: "whatsapp",
    title: "Design WhatsApp / Chat System",
    difficulty: "medium",
    tags: ["WebSockets", "Pub/Sub", "Message Queue", "Presence Service"],
    description:
      "Design a real-time instant messaging service supporting one-on-one and group messaging, file transfer, and active/idle presence status.",
  },
  {
    id: "web-crawler",
    title: "Design a Web Crawler",
    difficulty: "medium",
    tags: [
      "Distributed Queue",
      "DNS Resolver",
      "Duplicate Elimination",
      "Storage",
    ],
    description:
      "Design a distributed system that crawls the web, parses HTML pages, and stores extracted content for a search engine index.",
  },
  {
    id: "netflix",
    title: "Design Netflix (Video Streaming)",
    difficulty: "hard",
    tags: ["CDN", "Video Transcoding", "Object Storage", "High Availability"],
    description:
      "Design a video streaming platform that supports low-latency, adaptive video playback for millions of concurrent users.",
  },
  {
    id: "uber",
    title: "Design Uber (Ride-Sharing)",
    difficulty: "hard",
    tags: ["Geospatial Indexing", "WebSockets", "Matching Service", "Kafka"],
    description:
      "Design a system to track real-time driver locations, match riders with nearby drivers, and compute dynamic route ETAs.",
  },
  {
    id: "distributed-cache",
    title: "Design a Distributed Cache",
    difficulty: "hard",
    tags: ["LRU", "Consistent Hashing", "Replication", "In-Memory"],
    description:
      "Design a high-performance, distributed key-value storage system like Redis or Memcached with replication and partition tolerance.",
  },
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
  const { status } = useAuth();
  const router = useRouter();
  const [selectedQuestion, setSelectedQuestion] =
    useState<SystemDesignQuestion | null>(null);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
  const [showQuickStartPopup, setShowQuickStartPopup] = useState(false);
  const [pendingQuickStartQuestion, setPendingQuickStartQuestion] =
    useState<SystemDesignQuestion | null>(null);

  const quickStartQuestions = [
    SYSTEM_DESIGN_QUESTIONS.find((q) => q.id === "url-shortener")!,
    SYSTEM_DESIGN_QUESTIONS.find((q) => q.id === "whatsapp")!,
    SYSTEM_DESIGN_QUESTIONS.find((q) => q.id === "netflix")!,
  ].filter(Boolean);

  const handleSelectQuickStart = (q: SystemDesignQuestion) => {
    setShowQuickStartPopup(false);
    const preset = PRESET_DIAGRAMS[q.id];
    if (!preset) return;

    const isCustomPositioned = q.id === "url-shortener" || q.id === "whatsapp" || q.id === "netflix";
    const uniqueNodeIds = new Set<string>();
    const transformedNodes = (preset.nodes || [])
      .map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label,
        x: isCustomPositioned ? n.x : n.x * 1.35,
        y: isCustomPositioned ? n.y : n.y * 1.25,
        w: n.w,
        h: n.h,
        tag: n.tag,
        data: { label: n.label, type: n.type, tag: n.tag },
      }))
      .filter((n) => {
        if (uniqueNodeIds.has(n.id)) return false;
        uniqueNodeIds.add(n.id);
        return true;
      });
    const transformedEdges = (preset.edges || []).map((e) => ({
      from: e.from,
      to: e.to,
      descriptor: e.descriptor,
      tag: e.tag,
      source: e.from,
      target: e.to,
      label: e.descriptor,
    }));

    if (typeof window !== "undefined") {
      sessionStorage.setItem("practice.is_quick_start", "true");
      sessionStorage.setItem(
        `playground_diagram_${q.id}`,
        JSON.stringify({ nodes: transformedNodes, edges: transformedEdges }),
      );
      localStorage.setItem(
        `playground_diagram_${q.id}`,
        JSON.stringify({ nodes: transformedNodes, edges: transformedEdges }),
      );
    }

    handleSelectQuestion(q);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(
      "system_design_playground.selected_question",
    );
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
        sessionStorage.setItem(
          "system_design_playground.selected_question",
          JSON.stringify(q),
        );
      } else {
        sessionStorage.removeItem("system_design_playground.selected_question");
      }
    }
  };

  const handleSubmitPlayground = (diagramData: {
    nodes: ExportedNode[];
    edges: ExportedEdge[];
  }) => {
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
    const isQuickStart =
      typeof window !== "undefined" &&
      sessionStorage.getItem("practice.is_quick_start") === "true";
    return (
      <div className="w-full flex flex-col gap-6">
        <SystemDesignPlayground
          question={selectedQuestion}
          isQuickStart={false}
          onBack={() => {
            if (selectedQuestion) {
              sessionStorage.removeItem(
                `playground_diagram_${selectedQuestion.id}`,
              );
              localStorage.removeItem(
                `playground_diagram_${selectedQuestion.id}`,
              );
              sessionStorage.removeItem("practice.is_quick_start");
            }
            handleSelectQuestion(null);
          }}
          onSubmit={handleSubmitPlayground}
        />
        {isQuickStart && (
          <div className="w-full bg-accent-soft border border-accent/20 rounded-card p-4 text-xs text-accent font-medium flex items-start gap-2.5 shadow-soft animate-in fade-in slide-in-from-top-2 duration-300">
            <Zap className="h-4.5 w-4.5 shrink-0 animate-pulse fill-current text-accent mt-0.5" />
            <div className="space-y-1 text-left select-text">
              <p className="leading-relaxed text-accent/90">
                Look at this preloaded system architecture carefully before
                beginning the interview. Understanding this topology will help
                you answer the questions better!
              </p>
            </div>
          </div>
        )}
      </div>
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
            Select a system design question, model your architecture in the
            playground, and let the AI interview you.
          </p>
        </div>

        {/* Voice Setting and Quick Start in Header */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowQuickStartPopup(true)}
            className="flex items-center gap-1.5 rounded-pill border border-accent/30 bg-accent-soft hover:bg-accent hover:text-accent-contrast px-4 py-2 text-xs font-mono uppercase tracking-wider text-accent font-bold transition-all cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            Quick Start
          </button>

          <div className="flex gap-2 border border-line bg-surface/30 p-1.5 rounded-pill">
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
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("practice.is_quick_start");
              }
              handleSelectQuestion(q);
            }}
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

            <div className="mt-5 flex items-center justify-between border-t border-line/40 pt-4 gap-2">
              <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-accent opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                <span>Select & Design</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custom Auth Required Modal */}
      {showAuthRequiredModal && (
        <div className="fixed inset-0 bg-bg/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-raised border border-line rounded-card p-6 shadow-lift text-center animate-in zoom-in-95 duration-200 relative">
            <button
              type="button"
              onClick={() => setShowAuthRequiredModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-fg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft border border-accent/20 text-accent mb-4">
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </div>

            <h3 className="font-display text-lg font-semibold text-fg">
              Sign in to Start Interview
            </h3>
            <p className="mt-2.5 text-xs text-muted leading-relaxed">
              To start your AI-powered system design interview immediately with
              a preloaded template, please log in or create an account first.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem(
                      "practice.auto_start_interview",
                      "true",
                    );
                  }
                  router.push("/login");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-xs font-mono uppercase tracking-wider font-bold text-accent-contrast shadow-soft hover:opacity-95 transition-all cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem(
                      "practice.auto_start_interview",
                      "true",
                    );
                  }
                  router.push("/signup");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-line py-2.5 text-xs font-mono uppercase tracking-wider font-bold text-fg bg-surface/50 hover:border-fg transition-all cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setShowAuthRequiredModal(false)}
                className="mt-1.5 text-[11px] font-mono uppercase tracking-wider text-muted hover:text-fg transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Quick Start Selector Modal */}
      {showQuickStartPopup && (
        <div className="fixed inset-0 bg-bg/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-raised border border-line rounded-card p-6 shadow-lift animate-in zoom-in-95 duration-200 relative">
            <button
              type="button"
              onClick={() => setShowQuickStartPopup(false)}
              className="absolute top-4 right-4 text-muted hover:text-fg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft border border-accent/20 text-accent mb-3">
                <Zap className="h-5 w-5 fill-current animate-pulse" />
              </div>
              <h3 className="font-display text-xl font-semibold text-fg">
                Quick Start Challenge
              </h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Choose a difficulty level to preload a production-ready system
                design template directly into your playground.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {quickStartQuestions.map((q) => {
                const diffColor = difficultyColors[q.difficulty];
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleSelectQuickStart(q)}
                    className="flex flex-col md:flex-row md:items-center justify-between text-left p-4 rounded-card border border-line bg-surface/50 hover:bg-surface hover:border-accent transition-all cursor-pointer group"
                  >
                    <div className="space-y-1.5 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-pill border px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider ${diffColor}`}
                        >
                          {q.difficulty}
                        </span>
                        <span className="text-xs font-semibold text-fg group-hover:text-accent transition-colors">
                          {q.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted line-clamp-1 leading-normal">
                        {q.description}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0 font-mono text-[9px] uppercase tracking-wider text-accent opacity-85 group-hover:opacity-100 flex items-center gap-1 shrink-0">
                      Load & Edit <ArrowRight className="h-3 w-3" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowQuickStartPopup(false)}
                className="text-[11px] font-mono uppercase tracking-wider text-muted hover:text-fg transition-all cursor-pointer"
              >
                Back to all challenges
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
