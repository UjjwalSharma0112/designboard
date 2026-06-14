"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { Report } from "../types";

const stagger = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function ReportView({
  report,
  onRestart,
}: {
  report: Report;
  onRestart?: () => void;
}) {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);

  const numQuestions = report.perQuestion.length;
  const points = report.perQuestion.map((q, idx) => {
    const x = numQuestions > 1 
      ? 40 + idx * (440 / (numQuestions - 1)) 
      : 250;
    const y = 170 - (q.score / 10) * 150;
    return { x, y, score: q.score, index: idx, question: q.question };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const fillPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z`
    : "";

  const totalStrengths = report.perQuestion.reduce((sum, q) => sum + q.strengths.length, 0) + report.strengths.length;
  const totalGaps = report.perQuestion.reduce((sum, q) => sum + q.gaps.length, 0) + report.improvements.length;

  const handlePointClick = (index: number) => {
    setActiveQuestionIndex(index);
    const el = document.getElementById(`q-card-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const scoreRingRadius = 40;
  const scoreRingCircumference = 2 * Math.PI * scoreRingRadius;
  const scoreRingOffset = scoreRingCircumference - (report.overallScore / 10) * scoreRingCircumference;

  const colWidth = numQuestions > 1 ? 440 / (numQuestions - 1) : 440;

  return (
    <article className="mx-auto w-full max-w-3xl space-y-12 py-8">
      {/* Header */}
      <motion.header custom={0} variants={stagger} initial="hidden" animate="show" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[11px] uppercase tracking-widest text-accent">Interview report</span>
          {onRestart && (
            <button onClick={onRestart} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-mono text-[11px] text-muted transition-colors hover:bg-surface/50 cursor-pointer">
              <RotateCcw className="h-3.5 w-3.5" /> New interview
            </button>
          )}
        </div>
        <p className="max-w-2xl text-2xl font-medium leading-[1.3] text-fg">{report.summary}</p>
      </motion.header>

      {/* Interactive Stats Dashboard */}
      <motion.section 
        custom={1} 
        variants={stagger} 
        initial="hidden" 
        animate="show" 
        className="grid gap-6 md:grid-cols-3"
      >
        {/* Radial Gauge Card */}
        <div className="rounded-card border border-line bg-surface/30 backdrop-blur p-6 flex flex-col items-center justify-center relative min-h-[200px] shadow-soft">
          <div className="relative h-28 w-28">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <circle
                cx="50"
                cy="50"
                r={scoreRingRadius}
                className="stroke-line fill-none"
                strokeWidth="6"
              />
              <motion.circle
                cx="50"
                cy="50"
                r={scoreRingRadius}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={scoreRingCircumference}
                initial={{ strokeDashoffset: scoreRingCircumference }}
                animate={{ strokeDashoffset: scoreRingOffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ transform: "rotate(-90deg)", transformOrigin: "50px 50px" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-3xl font-bold tracking-tighter text-fg">{report.overallScore.toFixed(1)}</span>
              <span className="text-[10px] font-mono text-faint uppercase text-muted">/ 10</span>
            </div>
          </div>
          <span className="mt-4 font-mono text-[11px] uppercase tracking-widest text-muted">Overall Rating</span>
          <div className="mt-2 flex gap-3 text-[10px] font-mono text-faint">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {totalStrengths} Strengths
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-warn" />
              {totalGaps} Gaps
            </span>
          </div>
        </div>

        {/* Performance Line Graph Card */}
        <div className="col-span-1 md:col-span-2 rounded-card border border-line bg-surface/30 backdrop-blur p-6 flex flex-col justify-between min-h-[200px] shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted">Performance Trend</span>
              <span className="text-[10px] text-faint">Hover to inspect, click to jump to feedback</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-muted">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full border border-accent" />
                Rating (1-10)
              </span>
            </div>
          </div>

          <div className="relative flex-1">
            <svg viewBox="0 0 500 200" width="100%" height="100%" className="overflow-visible">
              {/* Y Grid Lines */}
              {[0, 2, 4, 6, 8, 10].map((s) => {
                const y = 170 - (s / 10) * 150;
                return (
                  <g key={s}>
                    <line x1="40" y1={y} x2="480" y2={y} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" opacity={0.4} />
                    <text x="25" y={y + 3} textAnchor="end" className="text-[9px] font-mono fill-muted">{s}</text>
                  </g>
                );
              })}

              {/* X-axis Line */}
              <line x1="40" y1="170" x2="480" y2="170" stroke="var(--line)" strokeWidth="1" />

              {/* Line and Area elements */}
              {points.length > 0 && (
                <>
                  {/* Fill Area Gradient */}
                  <defs>
                    <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <motion.path
                    d={fillPath}
                    fill="url(#chartAreaGrad)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  />

                  {/* Connecting Line */}
                  <motion.path
                    d={linePath}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
                  />
                </>
              )}

              {/* Guide Column Line on hover */}
              {activeHoverIndex !== null && (
                <line
                  x1={points[activeHoverIndex].x}
                  y1="20"
                  x2={points[activeHoverIndex].x}
                  y2="170"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  opacity="0.7"
                />
              )}

              {/* Data points */}
              {points.map((p) => {
                const isHovered = activeHoverIndex === p.index;
                const isActive = activeQuestionIndex === p.index;
                return (
                  <g key={p.index}>
                    {/* Hoverable hit box */}
                    <rect
                      x={p.x - colWidth / 2}
                      y="20"
                      width={colWidth}
                      height="150"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveHoverIndex(p.index)}
                      onMouseLeave={() => setActiveHoverIndex(null)}
                      onClick={() => handlePointClick(p.index)}
                    />
                    
                    {/* Circle Indicator */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered || isActive ? 6 : 4}
                      fill={isHovered || isActive ? "var(--accent)" : "var(--bg)"}
                      stroke="var(--accent)"
                      strokeWidth={2}
                      className="transition-all duration-200 pointer-events-none"
                    />

                    {/* X-axis Label */}
                    <text x={p.x} y="188" textAnchor="middle" className="text-[10px] font-mono fill-muted pointer-events-none">
                      Q{p.index + 1}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Custom Tooltip */}
            {activeHoverIndex !== null && (
              <div 
                className="absolute pointer-events-none rounded-card border border-line bg-raised/95 text-fg px-3 py-2 text-xs shadow-lift font-mono transition-all duration-150"
                style={{
                  left: `${(points[activeHoverIndex].x / 500) * 100}%`,
                  top: `${(points[activeHoverIndex].y / 200) * 100}%`,
                  transform: 'translate(-50%, -125%)',
                  whiteSpace: 'nowrap',
                  zIndex: 20
                }}
              >
                <div className="font-semibold text-accent mb-0.5">Q{activeHoverIndex + 1}: Score {points[activeHoverIndex].score}/10</div>
                <div className="text-[10px] opacity-80 max-w-[180px] truncate text-muted">{points[activeHoverIndex].question}</div>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Summary Bullet Lists */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-card border border-line bg-surface/30 p-5 shadow-soft">
          <h3 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-muted">Strengths</h3>
          <ul className="space-y-3">
            {report.strengths.map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-2.5 text-fg">
                <span className="text-accent select-none mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-card border border-line bg-surface/30 p-5 shadow-soft">
          <h3 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-muted">Improvements</h3>
          <ul className="space-y-3">
            {report.improvements.map((im, i) => (
              <li key={i} className="text-sm flex items-start gap-2.5 text-fg">
                <span className="text-warn select-none mt-0.5">•</span>
                <span>{im}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Detailed Feedback Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h3 className="text-xl font-medium">Detailed Feedback</h3>
          <span className="font-mono text-xs text-muted">{numQuestions} Questions evaluated</span>
        </div>
        <div className="space-y-6">
          {report.perQuestion.map((q) => (
            <div 
              key={q.questionIndex} 
              id={`q-card-${q.questionIndex}`} 
              className={`rounded-card border p-6 transition-all duration-500 relative ${
                activeQuestionIndex === q.questionIndex
                  ? "border-accent ring-2 ring-accent/15 bg-accent-soft/5 scale-[1.01] shadow-lift"
                  : "border-line bg-surface/10 hover:bg-surface/20"
              }`}
            >
              {activeQuestionIndex === q.questionIndex && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute left-0 top-4 bottom-4 w-1 rounded-r bg-accent"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <p className="mb-4 font-medium text-lg leading-snug">Q{q.questionIndex + 1}: {q.question}</p>
              
              {/* Custom Rating Bar */}
              <div className="flex flex-col gap-2 my-4 max-w-md">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-muted">Rating & Follow-ups</span>
                  <span className="font-semibold text-fg">
                    Score: {q.score}/10 — {q.followUpCount} Follow-up{q.followUpCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="h-2 w-full rounded-pill bg-line/30 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${q.score * 10}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`h-full rounded-pill ${
                      q.score >= 8
                        ? "bg-accent"
                        : q.score >= 6
                        ? "bg-accent/80"
                        : "bg-warn"
                    }`}
                  />
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="mt-5 grid gap-5 sm:grid-cols-2 pt-4 border-t border-line/20">
                <div>
                  <p className="text-xs font-mono uppercase text-accent mb-2 tracking-widest font-semibold">Strengths</p>
                  <ul className="space-y-2 text-sm text-fg">
                    {q.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-accent mt-0.5 select-none">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase text-warn mb-2 tracking-widest font-semibold">Gaps</p>
                  <ul className="space-y-2 text-sm text-fg">
                    {q.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-warn mt-0.5 select-none">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
