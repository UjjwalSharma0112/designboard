// GoogleButton — "Continue with Google". Calls the mock OAuth round-trip. Uses
// a neutral monogram (no fetched brand asset) and a calm loading state.
interface GoogleButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function GoogleButton({
  onClick,
  loading,
  disabled,
}: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-card border border-line bg-raised px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:border-fg disabled:opacity-50"
    >
      <span
        aria-hidden
        className="grid h-5 w-5 place-items-center rounded-full border border-line font-mono text-[11px] font-semibold text-muted"
      >
        G
      </span>
      {loading ? "Connecting…" : "Continue with Google"}
    </button>
  );
}
