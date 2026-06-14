"use client";

// Landing — a full editorial scroll on the paper theme. Keeps the original hero,
// then earns the pitch: a real cross-questioning transcript, how it works, a
// report artifact, the three audiences, a closing call, and a footer. Sections
// reveal on scroll (calm, staggered, reduced-motion-aware via MotionConfig).
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MessageSquare,
  CornerDownRight,
  FileText,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";

const EASE = [0.22, 1, 0.36, 1] as const;

// Hero entrance (animates on load).
const rise = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: EASE },
  }),
};

// Scroll-reveal wrapper for below-the-fold content.
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

// --- content ---------------------------------------------------------------

const EXCHANGE = [
  {
    role: "interviewer",
    text: "How would you design the database layer for a URL shortener?",
    followUp: false,
  },
  {
    role: "candidate",
    text: "I would use PostgreSQL and create a table mapping short codes to long URLs.",
  },
  {
    role: "interviewer",
    text: "PostgreSQL holds up for writes, but what happens under a sudden spike of 100k writes/sec?",
    followUp: true,
  },
  { role: "candidate", text: "I would add Redis as a cache in front of it." },
  {
    role: "interviewer",
    text: "A cache is for reads. How does a cache absorb write spikes?",
    followUp: true,
  },
  { role: "candidate", text: "Ah… I suppose I would need a message queue like Kafka to buffer the writes." },
] as const;

const BEATS = [
  {
    n: "01",
    title: "Design & Ask",
    icon: MessageSquare,
    desc: "Draw your architecture on our playground canvas. The AI reviews it and opens with a tailored question.",
  },
  {
    n: "02",
    title: "Probe & Drill",
    icon: CornerDownRight,
    desc: "The interviewer drills into your connections, bottlenecks, scaling trade-offs, and failure modes.",
  },
  {
    n: "03",
    title: "Architect Report",
    icon: FileText,
    desc: "Leave with scored systems engineering competencies and an honest read on where your design cracked.",
  },
];

const COMPETENCIES = [
  { name: "System Scalability", score: 3.5 },
  { name: "Storage & Cache Selection", score: 3.0 },
  { name: "Data Flow & Protocols", score: 3.2 },
  { name: "Reliability & Replication", score: 3.4 },
  { name: "Trade-off Justification", score: 2.8 },
];

// --- page ------------------------------------------------------------------

export default function Home() {
  return (
    <>
      <SiteHeader active="/" />
      <main className="flex-1">
        <Hero />
        <Transcript />
        <HowItWorks />
        <ReportPreview />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
      <motion.p
        custom={0}
        variants={rise}
        initial="hidden"
        animate="show"
        className="font-mono text-xs uppercase tracking-[0.24em] text-accent"
      >
        The System Design Playground & Room
      </motion.p>
      <motion.h1
        custom={1}
        variants={rise}
        initial="hidden"
        animate="show"
        className="mt-5 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-fg sm:text-7xl"
      >
        Practice the hard part of System Design — defending your design.
      </motion.h1>
      <motion.p
        custom={2}
        variants={rise}
        initial="hidden"
        animate="show"
        className="mt-6 max-w-xl text-lg leading-relaxed text-muted"
      >
        Draw your architecture on our interactive canvas, then defend it against a focused AI interviewer who probes your bottlenecks, data flows, and trade-offs.
      </motion.p>
      <motion.div
        custom={3}
        variants={rise}
        initial="hidden"
        animate="show"
        className="mt-9"
      >
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 rounded-pill bg-accent px-6 py-3 font-medium text-accent-contrast transition-transform hover:-translate-y-0.5"
        >
          Design & Practice
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </motion.div>
    </section>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <Reveal>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
        <span className="kicker-dot" />
        {kicker}
      </p>
      <h2 className="mt-3 max-w-2xl font-display text-3xl font-medium leading-tight tracking-tight text-fg sm:text-4xl">
        {title}
      </h2>
    </Reveal>
  );
}

function Transcript() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
        <SectionHeading
          kicker="Product, in action"
          title="It doesn't take your first answer at face value."
        />
        <Reveal delay={0.05} className="mt-10 max-w-2xl">
          <ol className="space-y-7">
            {EXCHANGE.map((turn, i) =>
              turn.role === "interviewer" ? (
                <li
                  key={i}
                  className={
                    turn.followUp ? "border-l-2 border-accent pl-5" : "pl-5"
                  }
                >
                  <p
                    className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
                      turn.followUp ? "text-accent" : "text-faint"
                    }`}
                  >
                    {turn.followUp ? "Following up" : "Interviewer"}
                  </p>
                  <p className="mt-2 font-display text-xl font-medium leading-snug text-fg sm:text-2xl">
                    {turn.text}
                  </p>
                </li>
              ) : (
                <li key={i} className="pl-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                    Candidate
                  </p>
                  <p className="mt-1.5 leading-relaxed text-muted">
                    “{turn.text}”
                  </p>
                </li>
              ),
            )}
          </ol>
          <p className="mt-8 max-w-xl text-sm leading-relaxed text-faint">
            Three questions in, the architectural bottleneck is obvious. The AI
            interviewer finds the soft spots in your design that simple diagrams hide.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="bg-surface">
      <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
        <SectionHeading
          kicker="How it works"
          title="Ask. Probe. Then tell you the truth."
        />
        <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {BEATS.map((beat, i) => (
            <Reveal key={beat.n} delay={i * 0.1}>
              <div
                className={
                  i > 0 ? "sm:border-l sm:border-line sm:pl-8" : undefined
                }
              >
                <div className="flex items-center gap-3">
                  <beat.icon className="h-5 w-5 text-accent" aria-hidden />
                  <span className="font-mono text-sm text-faint">{beat.n}</span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-medium text-fg">
                  {beat.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted">{beat.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReportPreview() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
        <SectionHeading
          kicker="The report"
          title="An honest read, not a participation trophy."
        />
        <Reveal delay={0.05} className="mt-10">
          <div className="overflow-hidden rounded-card border border-line bg-surface shadow-soft">
            {/* Artifact header */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-6 py-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                System Design Report · Infrastructure Architect
              </span>
              <span className="font-mono text-3xl font-semibold leading-none text-fg">
                3.2<span className="text-lg text-faint">/5</span>
              </span>
            </div>

            <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1.1fr_1fr]">
              {/* Competency bars */}
              <ul className="space-y-3.5">
                {COMPETENCIES.map((c) => (
                  <li key={c.name} className="flex items-center gap-4">
                    <span className="w-44 shrink-0 text-sm text-muted">
                      {c.name}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-pill bg-line">
                      <span
                        className="block h-full rounded-pill bg-accent"
                        style={{ width: `${(c.score / 5) * 100}%` }}
                      />
                    </span>
                    <span className="w-8 text-right font-mono text-sm text-fg">
                      {c.score.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Held up vs cracked */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 lg:gap-4">
                <Highlight
                  tone="positive"
                  title="Held up"
                  items={[
                    "Correctly identified write bottlenecks",
                    "Well-reasoned SQL vs NoSQL choices",
                  ]}
                />
                <Highlight
                  tone="warn"
                  title="Cracked under follow-ups"
                  items={[
                    "Failed to address cache replication lag",
                    "Vague explanation of message queue offsets",
                  ]}
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Highlight({
  tone,
  title,
  items,
}: {
  tone: "positive" | "warn";
  title: string;
  items: string[];
}) {
  const color = tone === "positive" ? "var(--positive)" : "var(--warn)";
  return (
    <div>
      <h4 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
        {title}
      </h4>
      <ul className="mt-2.5 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm leading-snug text-fg">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClosingCta() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
        <Reveal className="flex flex-col items-center rounded-card border border-line bg-surface px-6 py-14 text-center sm:py-20">
          <h2 className="max-w-2xl font-display text-4xl font-medium leading-tight tracking-tight text-fg sm:text-5xl">
            Step up to the board. Let&apos;s test your architecture.
          </h2>
          <p className="mt-4 max-w-md text-muted">
            Interactive canvas playground with immediate AI feedback. Try it for free or create an account to save your diagram history.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 rounded-pill bg-accent px-6 py-3 font-medium text-accent-contrast transition-transform hover:-translate-y-0.5"
            >
              Start Drawing
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-fg">
            System Design Room
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
            Draw architectures, defend your design choices, and receive detailed AI reports.
          </p>
        </div>

        <FooterCol
          heading="Surfaces"
          links={[
            { href: "/practice", label: "Playground & Practice" },
            { href: "/history", label: "My Designs" },
          ]}
        />
        <FooterCol
          heading="Company"
          links={[
            { href: "#", label: "About" },
            { href: "#", label: "Privacy" },
            { href: "#", label: "Terms" },
          ]}
        />
      </div>
      <div className="mx-auto w-full max-w-5xl px-6 pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
          © 2026 System Design Room · A calm place to master architecture interviews
        </p>
      </div>
    </footer>
  );
}

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
        {heading}
      </p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-muted hover:text-fg">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
