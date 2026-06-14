"use client";

// Editorial header for the light surfaces (landing + dashboards). The wordmark
// pairs the display serif with a mono tag for a considered, print-like masthead.
// Auth-aware: shows Log in / Sign up when signed out, and the user + Sign out
// when signed in.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useTheme } from "@/features/theme/ThemeProvider";

const NAV = [
  { href: "/practice", label: "Practice" },
  { href: "/history", label: "History" },
];

export default function SiteHeader({ active }: { active?: string }) {
  const { status, user, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();

  async function onSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-6">
      <Link href="/" className="group flex items-baseline gap-2">
        <span className="font-display text-xl font-semibold tracking-tight text-fg">
          Interview Room
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
          beta
        </span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        <nav aria-label="Surfaces" className="hidden sm:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => {
              const isActive = active === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-pill px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-accent-soft text-accent"
                        : "text-muted hover:text-fg"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <span className="hidden h-5 w-px bg-line sm:block" aria-hidden />

        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-fg hover:text-fg"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {status === "authenticated" && user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">
              {user.fullName}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-pill border border-line px-3 py-1.5 text-sm text-fg transition-colors hover:border-fg"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-pill px-3 py-1.5 text-sm text-muted transition-colors hover:text-fg"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-pill bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-95"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
