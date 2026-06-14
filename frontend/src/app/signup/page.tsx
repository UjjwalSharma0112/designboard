"use client";

// /signup — candidate registration.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { AuthError } from "@/features/auth/authClient";
import AuthShell from "@/features/auth/components/AuthShell";
import Field from "@/features/auth/components/Field";
import PasswordField from "@/features/auth/components/PasswordField";
import GoogleButton from "@/features/auth/components/GoogleButton";

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

interface Errors {
  fullName?: string;
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { status, user, signUp, signInWithGoogle } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace("/practice");
    }
  }, [status, user, router]);

  function validate(): Errors {
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = "Enter your full name.";
    if (!isEmail(email)) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords don't match.";
    if (!terms) next.terms = "Please accept the terms to continue.";
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await signUp({
        email,
        password,
        fullName,
        inviteCode,
      });
      // The effect above redirects to /practice on success.
    } catch (err) {
      setFormError(
        err instanceof AuthError
          ? err.message
          : "Something went wrong. Try again.",
      );
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setGoogleLoading(true);
    setFormError(null);
    try {
      await signInWithGoogle();
    } catch {
      setFormError("Could not continue with Google. Try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <AuthShell
      kicker="Create your account"
      title="Set up your interview room"
      subtitle="Tell us who you are — it tailors your space."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-accent underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Field
          id="fullName"
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={setFullName}
          error={errors.fullName}
          placeholder="Your name"
        />

        <Field
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          placeholder="you@example.com"
        />

        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          placeholder="At least 8 characters"
          showStrength
        />

        <PasswordField
          id="confirm"
          label="Confirm password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
          placeholder="Re-enter your password"
        />
        <Field
          id="invite-code"
          label="Invite Code"
          type="text"
          value={inviteCode}
          placeholder="X Y S E I"
          onChange={setInviteCode}
        />

        <div>
          <label className="flex items-start gap-2.5 text-sm text-muted">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              aria-invalid={errors.terms ? true : undefined}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
            />
            <span>
              I agree to the{" "}
              <Link
                href="#"
                className="text-accent underline-offset-4 hover:underline"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="text-accent underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && (
            <p
              id="terms-error"
              role="alert"
              className="mt-1.5 text-sm text-warn"
            >
              {errors.terms}
            </p>
          )}
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
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      {/* <Divider />
      <GoogleButton
        onClick={onGoogle}
        loading={googleLoading}
        disabled={submitting}
      /> */}
    </AuthShell>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3" aria-hidden>
      <span className="h-px flex-1 bg-line" />
      <span className="font-mono text-[11px] uppercase tracking-wider text-faint">
        or
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
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
