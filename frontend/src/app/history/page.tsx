"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronRight, ArrowLeft } from "lucide-react";
import { interviewClient } from "@/features/interview/interviewClient";
import type { InterviewHistoryItem } from "@/lib/types";
import ReportView from "@/features/report/components/ReportView";
import RequireAuth from "@/features/auth/RequireAuth";
import SiteHeader from "@/components/SiteHeader";

export default function HistoryPage() {
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  const [selected, setSelected] = useState<InterviewHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interviewClient.getHistory()
      .then(setHistory)
      .finally(() => setLoading(false));
  }, []);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-bg">
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-6 py-12">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setSelected(null)}
                  className="mb-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted hover:text-fg transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to history
                </button>
                <ReportView report={selected} />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <header>
                  <h1 className="font-display text-4xl font-medium">System Design History</h1>
                  <p className="mt-2 text-muted">Review your past architectural evaluations and system design growth.</p>
                </header>

                {loading ? (
                  <div className="flex h-64 items-center justify-center text-faint">
                    <span className="animate-pulse">Loading history...</span>
                  </div>
                ) : history.length === 0 ? (
                  <div className="rounded-card border border-dashed border-line p-12 text-center">
                    <p className="text-muted">No system designs recorded yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {history.map((item) => (
                      <button
                        key={item.sessionId}
                        onClick={() => setSelected(item)}
                        className="group flex items-center justify-between rounded-card border border-line bg-surface/40 p-5 text-left transition-all hover:border-accent hover:bg-surface"
                      >
                        <div className="space-y-1">
                          <h3 className="font-medium text-fg group-hover:text-accent transition-colors">
                            {item.topic}
                          </h3>
                          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-faint">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                            <span>{item.difficulty}</span>
                            <span>{item.totalQuestions} Questions</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="font-mono text-2xl font-semibold text-fg">
                              {item.overallScore.toFixed(1)}
                            </span>
                            <span className="font-mono text-xs text-faint">/10</span>
                          </div>
                          <ChevronRight className="h-5 w-5 text-faint group-hover:text-accent transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </RequireAuth>
  );
}
