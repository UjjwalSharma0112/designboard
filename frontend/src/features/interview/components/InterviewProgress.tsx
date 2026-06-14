"use client";

// InterviewProgress — a quiet header for the runner: which exchange we're on and
// a slim progress bar toward the planned length. Informative, never nagging.
import { motion } from "framer-motion";

interface InterviewProgressProps {
  current: number; // 1-based index of the current question
  planned: number; // approximate planned number of questions
  onEnd: () => void;
}

export default function InterviewProgress({
  current,
  planned,
  onEnd,
}: InterviewProgressProps) {
  const ratio = Math.max(0, Math.min(1, current / planned));

  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {String(current).padStart(2, "0")}
        <span className="text-faint"> / {String(planned).padStart(2, "0")}</span>
      </span>
      <div
        className="h-1 flex-1 overflow-hidden rounded-pill bg-line"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={planned}
        aria-label="Interview progress"
      >
        <motion.div
          className="h-full rounded-pill bg-accent"
          initial={false}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>



      <button
        type="button"
        onClick={onEnd}
        className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint underline-offset-4 hover:text-fg hover:underline"
      >
        Leave room
      </button>
    </div>
  );
}
