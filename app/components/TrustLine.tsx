// app/components/TrustLine.tsx
// One honest line that answers "why should I trust this list?" — the three
// things Weedmaps/Leafly users complain about (stale stock, pay-to-rank,
// wrong info) answered up front. Links to /how-we-rank for the details.

import Link from "next/link";

export default function TrustLine({
  updatedLabel,
  tone = "light",
}: {
  /** e.g. "Updated 4:24 AM" — omit when unknown rather than guessing. */
  updatedLabel?: string | null;
  tone?: "light" | "dark";
}) {
  const color = tone === "dark" ? "var(--pp-canopy-eyebrow)" : "var(--pp-muted)";
  const link = tone === "dark" ? "var(--pp-canopy-text)" : "var(--pp-signal-ink)";
  return (
    <p
      style={{
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: ".7rem",
        letterSpacing: ".02em",
        color,
        margin: "6px 0 0",
        lineHeight: 1.6,
      }}
    >
      Checked on each store&apos;s own site · No store pays to rank
      {updatedLabel ? ` · ${updatedLabel}` : ""} ·{" "}
      <Link href="/how-we-rank" style={{ color: link, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>
        How we rank
      </Link>
    </p>
  );
}
