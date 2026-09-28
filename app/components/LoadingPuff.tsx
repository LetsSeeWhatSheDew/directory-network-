// LoadingPuff — the loading state: one soft puff, 96px, rises and fades,
// then rests ~2s before the next (5.6s loop at pace 1; .pp-lp in globals.css).
// Replaces spinners. Still under reduce-motion. Server-safe (no hooks).

export default function LoadingPuff({ label = "Loading", className = "" }: { label?: string; className?: string }) {
  return (
    <span className={`pp-lp-wrap ${className}`} role="status">
      <span className="pp-lp" aria-hidden="true" />
      <span className="pp-lp-label">{label}</span>
    </span>
  );
}
