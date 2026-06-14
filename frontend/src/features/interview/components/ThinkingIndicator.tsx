"use client";

// ThinkingIndicator — the EVALUATING cue. A calm, breathing trio of dots (not a
// spinner) that makes the wait feel like the interviewer is actually weighing
// the answer. Falls back to a static cue under reduced-motion.
import { motion, useReducedMotion } from "framer-motion";

export default function ThinkingIndicator() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3 px-1 text-muted"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-end gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-accent"
            animate={reduce ? undefined : { opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
            transition={
              reduce
                ? undefined
                : {
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.18,
                  }
            }
          />
        ))}
      </span>
      <span className="font-mono text-xs uppercase tracking-[0.18em]">
        The interviewer is considering your answer
      </span>
    </motion.div>
  );
}
