"use client";

// /login — email + password (with show/hide), a stub
// "forgot password" link, inline credential errors, and a link to /signup.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { AuthError } from "@/features/auth/authClient";
import AuthShell from "@/features/auth/components/AuthShell";
import Field from "@/features/auth/components/Field";
import PasswordField from "@/features/auth/components/PasswordField";

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginPage() {
  const router = useRouter();
  const { status, user, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (or just became signed in) → go to the right surface.
  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace("/practice");
    }
  }, [status, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: typeof fieldErrors = {};
    if (!isEmail(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await signIn(email, password);
      // The effect above performs the redirect on success.
    } catch (err) {
      setFormError(
        err instanceof AuthError
          ? err.message
          : "Something went wrong. Try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      kicker="Welcome back"
      title="Sign in to your room"
      subtitle="Pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link
            href="/signup"
            className="text-accent underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
          placeholder="you@example.com"
        />

        <div className="space-y-1.5">
          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            error={fieldErrors.password}
            placeholder="Your password"
          />
          <div className="flex justify-end">
            <Link
              href="#"
              className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-fg"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-card border border-warn/40 px-3.5 py-2.5 text-sm text-warn"
          >
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-card bg-accent px-5 py-2.5 font-medium text-accent-contrast transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {submitting && <Spinner />}
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
