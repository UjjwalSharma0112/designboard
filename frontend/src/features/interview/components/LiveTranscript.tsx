"use client";

// LiveTranscript — a collapsible record of the exchanges so far. Stays out of
// the way during the live question (the hero), but is one tap to review.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Turn } from "@/lib/types";

interface LiveTranscriptProps {
  // Past, answered turns (the current/unanswered turn is excluded).
  turns: Turn[];
}

export default function LiveTranscript({ turns }: LiveTranscriptProps) {
  const [open, setOpen] = useState(false);
  if (turns.length === 0) return null;

  return (
    <section className="rounded-card border border-line bg-surface/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Transcript · {turns.length} {turns.length === 1 ? "exchange" : "exchanges"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ol className="space-y-4 border-t border-line px-4 py-4">
          {turns.map((turn, i) => (
            <li key={i} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                  {turn.type === "follow_up" ? "Follow-up" : `Q${String(turn.questionNumber).padStart(2, "0")}`}
                </span>
              </div>
              <p className="font-display text-sm leading-snug text-fg">
                {turn.question}
              </p>
              <p className="text-sm leading-relaxed text-muted">
                {turn.answer || <span className="italic text-faint">No answer</span>}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
