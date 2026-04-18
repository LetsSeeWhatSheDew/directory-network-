import { scoreDeal } from "../../lib/dealScore";

type Variant = "compact" | "full";

export default function DealValueBadge({
  deal,
  variant = "compact",
}: {
  deal: Record<string, any>;
  variant?: Variant;
}) {
  const s = scoreDeal(deal);

  if (variant === "full") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "system-ui, sans-serif",
          fontSize: ".82rem",
          fontWeight: 700,
          color: s.color,
        }}
        title={s.reason}
      >
        <span aria-hidden="true" style={{ fontSize: ".7rem" }}>●</span>
        <span>
          {s.label} — <span style={{ fontWeight: 500, color: "var(--color-text-secondary, #6b7280)" }}>{s.reason}</span>
        </span>
      </div>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "system-ui, sans-serif",
        fontSize: ".68rem",
        fontWeight: 700,
        color: s.color,
        letterSpacing: ".02em",
      }}
      title={s.reason}
      aria-label={`${s.label}: ${s.reason}`}
    >
      <span aria-hidden="true" style={{ fontSize: ".6rem" }}>●</span>
      {s.label}
    </span>
  );
}
