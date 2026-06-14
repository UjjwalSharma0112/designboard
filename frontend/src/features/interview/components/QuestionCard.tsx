"use client";

// QuestionCard — the hero of the runner. Each new question animates in with a
// deliberate fade + rise, as if the interviewer just asked it. Keyed by turnId
// so every question replays the reveal.
import { motion } from "framer-motion";

interface QuestionCardProps {
  turnId: string;
  question: string;
  index: number;
  isFollowUp: boolean;
  isSpeaking?: boolean;
}

export default function QuestionCard({
  turnId,
  question,
  index,
  isFollowUp,
  isSpeaking = false,
}: QuestionCardProps) {
  return (
    <motion.div
      key={turnId}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
      className={`relative rounded-card border p-6 sm:p-8 bg-surface/40 backdrop-blur transition-all duration-300 ${
        isSpeaking ? "ai-speaking-card ring-2 ring-accent/5" : "border-line shadow-soft"
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <span className="flex items-end gap-0.5 h-3.5 w-4 pb-0.5" aria-hidden>
              {[0.1, 0.35, 0.2].map((delay, i) => (
                <motion.span
                  key={i}
                  className="w-0.5 rounded-full bg-accent"
                  animate={{ height: ["20%", "100%", "20%"] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay,
                  }}
                />
              ))}
            </span>
          )}
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            {isFollowUp ? "Follow-up" : `Question ${String(index).padStart(2, "0")}`}
          </span>
        </div>
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>

      <h2 className="font-display text-[1.7rem] font-medium leading-[1.22] tracking-tight text-fg sm:text-4xl sm:leading-[1.18]">
        {question}
      </h2>
    </motion.div>
  );
}
