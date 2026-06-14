"use client";

// PasswordField — labelled password input with a show/hide toggle and an
// optional live strength meter. Same accessible error wiring as Field.
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: "new-password" | "current-password";
  placeholder?: string;
  showStrength?: boolean;
}

// 0..4 — length plus character-class variety.
export function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(4, score);
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete = "new-password",
  placeholder,
  showStrength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const strengthId = `${id}-strength`;
  const score = passwordStrength(value);
  // Color the meter with the calm semantic tokens (no neon).
  const meterColor =
    score <= 1 ? "var(--warn)" : score === 2 ? "var(--faint)" : "var(--positive)";

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block font-mono text-[11px] uppercase tracking-[0.16em] text-muted"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [error ? errorId : null, showStrength ? strengthId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className={`w-full rounded-card border bg-raised px-3.5 py-2.5 pr-11 text-fg placeholder:text-faint focus:border-accent focus:outline-none ${
            error ? "border-warn" : "border-line"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-fg"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div id={strengthId} className="flex items-center gap-2 pt-0.5">
          <span className="flex flex-1 gap-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-1 flex-1 rounded-pill"
                style={{
                  background: i < score ? meterColor : "var(--line)",
                }}
              />
            ))}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {LABELS[score]}
          </span>
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-sm text-warn">
          {error}
        </p>
      )}
    </div>
  );
}
