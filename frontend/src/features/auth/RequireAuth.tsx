"use client";

// RequireAuth — client-side guard for the protected surfaces. Redirects to
// /login when there is no session (mock-aware via the auth context). Renders a
// calm "checking" cue while the session hydrates so guarded content never
// flashes for signed-out visitors.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          {status === "loading" ? "Checking your session…" : "Redirecting to sign in…"}
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
