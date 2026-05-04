// app/components/Logo.tsx
// PuffPrice logo — pin-mark + wordmark lockup, inline SVG so the fill
// inherits from token color and the asset never requires a network round
// trip. The 2026-04-30 raster-PNG mark is retired in this rollout — the
// brand spec § 1 (locked 2026-05-04) calls for a Manrope 800 wordmark
// paired with a geometric pin-mark companion.
//
// Variants:
//   default ("sage") — sage wordmark on light surfaces (nav, content pages)
//   inverse ("cream") — cream wordmark on the deep brand surface (hero, footer)
//
// Sizes: pass `size` as desired height in px. Lockup width is derived
// from the SVG viewBox (3.5 : 1 aspect — pin + wordmark side by side).

import Link from "next/link";

type Props = {
  /** Pixel height of the logo lockup. Width derived from aspect ratio. */
  size?: number;
  /** Render in cream (for deep brand surfaces) instead of sage. */
  inverse?: boolean;
  /** Optional href — wraps in a <Link>. Defaults to null. */
  href?: string | null;
  /** Render only the pin-mark (no wordmark). Used at sub-32px contexts. */
  glyphOnly?: boolean;
  className?: string;
  ariaLabel?: string;
  priority?: boolean;
};

const VIEWBOX_W = 432;       // 64 (pin) + 16 (gap) + 352 (wordmark) = 432
const VIEWBOX_H = 72;
const PIN_VIEWBOX = 64;
const PIN_SIZE_RATIO = PIN_VIEWBOX / VIEWBOX_H;

export default function Logo({
  size = 40,
  inverse = false,
  href = null,
  glyphOnly = false,
  className,
  ariaLabel = "PuffPrice",
  priority: _priority = false,
}: Props) {
  const stroke = inverse ? "#F7F4ED" : "#7DBA47";
  const wordmarkFill = inverse ? "#F7F4ED" : "#7DBA47";
  const pinFill = inverse ? "transparent" : "#F7F4ED";

  const svg = glyphOnly ? (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={Math.round(size * (PIN_VIEWBOX / VIEWBOX_H) * (VIEWBOX_H / PIN_VIEWBOX))}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke={stroke}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path
        d="M32 6 C20 6 11 15 11 27 C11 39 32 58 32 58 C32 58 53 39 53 27 C53 15 44 6 32 6 Z"
        fill={pinFill}
        stroke={stroke}
      />
      <g transform="translate(32 25)" strokeWidth="2">
        <path d="M0 -10 L0 4" />
        <path d="M0 -3 L7 -8" />
        <path d="M0 -3 L-7 -8" />
        <path d="M0 1 L9 -1" />
        <path d="M0 1 L-9 -1" />
        <path d="M0 4 L6 5" />
        <path d="M0 4 L-6 5" />
      </g>
    </svg>
  ) : (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={Math.round((VIEWBOX_W / VIEWBOX_H) * size)}
      height={size}
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      {/* Pin-mark — 64x64 inscribed in 72-tall band, vertically centered */}
      <g transform={`translate(0 ${(VIEWBOX_H - PIN_VIEWBOX) / 2})`}
         fill="none"
         stroke={stroke}
         strokeWidth="3"
         strokeLinecap="round"
         strokeLinejoin="round">
        <path
          d="M32 6 C20 6 11 15 11 27 C11 39 32 58 32 58 C32 58 53 39 53 27 C53 15 44 6 32 6 Z"
          fill={pinFill}
          stroke={stroke}
        />
        <g transform="translate(32 25)" strokeWidth="2">
          <path d="M0 -10 L0 4" />
          <path d="M0 -3 L7 -8" />
          <path d="M0 -3 L-7 -8" />
          <path d="M0 1 L9 -1" />
          <path d="M0 1 L-9 -1" />
          <path d="M0 4 L6 5" />
          <path d="M0 4 L-6 5" />
        </g>
      </g>
      {/* Wordmark — Manrope 800, letter-spacing -0.025em (per spec § 1) */}
      <text
        x="80"
        y="50"
        fontFamily="Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
        fontWeight="800"
        fontSize="48"
        letterSpacing="-1.2"
        fill={wordmarkFill}
      >
        PuffPrice
      </text>
    </svg>
  );

  return href ? (
    <Link href={href} aria-label={ariaLabel} style={{ display: "inline-flex", alignItems: "center" }}>
      {svg}
    </Link>
  ) : (
    svg
  );
}
