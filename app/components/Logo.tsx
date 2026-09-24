// app/components/Logo.tsx
// PuffPrice logo — Breathe final (2026-09-23), mark C: the P with a breath
// dot in its bowl. In the wordmark the mark stands in for the "P", followed
// by "uffPrice". Colors come from --pp-mark / --pp-mark-dot so day/night
// switch with the rest of the site. Inline SVG, no network round trip.
//
//   size      — lockup height in px (the wordmark's cap/x band scales from it)
//   inverse   — light colors for a dark surface (footer band)
//   glyphOnly — the mark by itself (icons, small contexts)

import { useId } from "react";

type Props = {
  size?: number;
  inverse?: boolean;
  href?: string | null;
  glyphOnly?: boolean;
  /** Heavier small drawing for ≤40px glyphs. */
  small?: boolean;
  className?: string;
  ariaLabel?: string;
  priority?: boolean;
};

export function MarkC({
  size = 48,
  small = false,
  crop = false,
  inverse = false,
  label,
}: {
  size?: number;
  small?: boolean;
  crop?: boolean;
  inverse?: boolean;
  label?: string;
}) {
  const id = useId().replace(/[:]/g, "");
  const stroke = inverse ? "#F6F1E8" : "var(--pp-mark, #1F4D33)";
  const dot = inverse ? "#F3C3A0" : "var(--pp-mark-dot, #D4845A)";
  const path = small ? "M11 43 V5 H24 A13 13 0 0 1 24 31 H11" : "M14 42 V8 H24 A10 10 0 0 1 24 28 H14";
  const sw = small ? 5.5 : 5;
  const r = small ? 5.4 : 4.6;
  const halo = small ? 7.6 : 8.2;
  const vb = crop ? (small ? "8 2 32 44" : "11 5 26 40") : "0 0 48 48";
  const [, , vw, vh] = vb.split(" ").map(Number);
  return (
    <svg
      viewBox={vb}
      height={size}
      width={Math.round((size * vw) / vh * 10) / 10}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ overflow: "visible", display: "inline-block", flex: "0 0 auto" }}
    >
      <defs>
        <radialGradient id={`pb${id}`}>
          <stop offset="0" style={{ stopColor: dot }} stopOpacity=".6" />
          <stop offset=".55" style={{ stopColor: dot }} stopOpacity=".28" />
          <stop offset="1" style={{ stopColor: dot }} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="18" r={halo} fill={`url(#pb${id})`} />
      <path d={path} fill="none" style={{ stroke }} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="18" r={r} style={{ fill: dot }} />
      <circle cx="24" cy="18" r={halo} fill={`url(#pb${id})`} opacity=".5" />
    </svg>
  );
}

export default function Logo({
  size = 36,
  inverse = false,
  glyphOnly = false,
  small = false,
  className,
  ariaLabel = "PuffPrice",
}: Props) {
  if (glyphOnly) {
    return (
      <span className={className} style={{ display: "inline-flex" }}>
        <MarkC size={size} small={small || size <= 40} inverse={inverse} label={ariaLabel} />
      </span>
    );
  }
  // Header spec: 22px wordmark with an 18.5px-tall mark. Scale from `size`.
  const fontSize = Math.round(size * 0.61 * 10) / 10;
  const markH = Math.round(fontSize * 0.84 * 10) / 10;
  return (
    <span
      className={className}
      role="img"
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: Math.max(1, Math.round(fontSize * 0.04)),
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        color: inverse ? "#F6F1E8" : "var(--pp-mark, #1F4D33)",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true" style={{ display: "inline-flex", alignSelf: "baseline", transform: `translateY(${Math.round(fontSize * 0.02)}px)` }}>
        <MarkC size={markH} crop inverse={inverse} />
      </span>
      <span aria-hidden="true">uffPrice</span>
    </span>
  );
}
