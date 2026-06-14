// Field — an accessible labelled text input with inline error wiring.
// The label is tied to the input, errors set aria-invalid + aria-describedby,
// and the error text gets role="alert" so it's announced.
interface FieldProps {
  id: string;
  label: string;
  type?: "text" | "email";
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  inputMode?: "text" | "email";
}

export default function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  required,
  inputMode,
}: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block font-mono text-[11px] uppercase tracking-[0.16em] text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-card border bg-raised px-3.5 py-2.5 text-fg placeholder:text-faint focus:border-accent focus:outline-none ${
          error ? "border-warn" : "border-line"
        }`}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-warn">
          {error}
        </p>
      )}
    </div>
  );
}
