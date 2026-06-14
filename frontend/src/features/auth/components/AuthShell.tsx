import Link from "next/link";

// AuthShell — the editorial frame shared by /login and /signup. An asymmetric
// two-column spread on the paper theme: a quiet brand panel on the left, the
// form on the right. Collapses to a single comfortable column on mobile. Not a
// centered card on gray.
interface AuthShellProps {
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function AuthShell({
  kicker,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="grain relative grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between border-r border-line px-10 py-10 lg:flex xl:px-16">
        <Link
          href="/"
          className="flex items-baseline gap-2 font-display text-xl font-semibold tracking-tight text-fg"
        >
          designboard
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
            beta
          </span>
        </Link>

        <blockquote className="max-w-md">
          <p className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-fg xl:text-5xl">
            The room where the
            <br />
            follow-ups decide it.
          </p>
          <footer className="mt-5 max-w-sm text-muted">
            Practice the hard part of the interview — the cross-questioning — and
            walk out with an honest read.
          </footer>
        </blockquote>

        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
          <span className="kicker-dot" />
          Candidate · Institution · Recruiter
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-10 inline-flex items-baseline gap-2 font-display text-lg font-semibold tracking-tight text-fg lg:hidden"
          >
            designboard
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              beta
            </span>
          </Link>

          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            {kicker}
          </p>
          <h1 className="mt-3 font-display text-3xl font-medium leading-tight tracking-tight text-fg sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-muted">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-8 text-sm text-muted">{footer}</div>
        </div>
      </main>
    </div>
  );
}
