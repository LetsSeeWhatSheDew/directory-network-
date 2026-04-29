// app/components/Logo.tsx
// Wordmark per docs/brand/2026-04-28-identity-package.md spec 2.1.
//
// Geist Display 700, navy primary on light surfaces. The dollar-sign
// accent goes on the second `P` in `Price`: a green vertical bar runs
// through the bowl of the P so the glyph reads as both a P and a $.
// At small sizes (favicon / tight headers) the wordmark drops to a
// single $-glyphed P only — see `glyphOnly` prop.
//
// Spec 2.1 calls out that the integrated $-as-P glyph is the strong
// direction *if it executes well* — and gives Code permission to fall
// back to a clean Geist 700 wordmark if the integrated glyph doesn't
// land at small sizes. Implementation: the dollar bar is a thin
// vertical rule positioned over the second P, scaled to the typography
// rather than baked into a custom SVG path. That keeps the wordmark
// vector-pure and lets it inherit the font's hinting at every size.
//
// Three render modes:
//   default        — full "PuffPrice" wordmark with $ accent
//   glyphOnly      — the lone $-P glyph (favicon, very tight headers)
//   inverse        — wordmark on dark surfaces (footer): cream + green

import Link from "next/link";

type Props = {
  /** Pixel height of the wordmark (visual height of the cap line). */
  size?: number;
  /** Render only the $-glyph P (favicon / 16-24px header). */
  glyphOnly?: boolean;
  /** Inverse mode for dark surfaces (footer, navy backgrounds). */
  inverse?: boolean;
  /** Optional href — wraps in a <Link> when provided. Default null
   *  so existing call sites that wrap <Logo /> in their own <Link>
   *  don't end up with nested anchors. */
  href?: string | null;
  className?: string;
  ariaLabel?: string;
  /** Accepted for backwards compatibility with the old next/image
   *  Logo. The wordmark is text — there's nothing to "prioritize". */
  priority?: boolean;
};

const COLOR_NAVY = "#0F1F3D";
const COLOR_GREEN = "#16A34A";
const COLOR_INVERSE = "#FAFAF7";

/**
 * Inline single-glyph version: the second P with a green dollar bar.
 * Used by `glyphOnly` AND embedded by the full wordmark to render the
 * accent. Keeping this in one place means the bar never drifts between
 * the two render modes.
 */
function PWithDollarBar({
  height,
  inverse = false,
}: {
  height: number;
  inverse?: boolean;
}) {
  const barColor = COLOR_GREEN;
  const letterColor = inverse ? COLOR_INVERSE : COLOR_NAVY;
  const fontSize = `${height}px`;

  return (
    <span
      aria-hidden="true"
      style={{
        position: "relative",
        display: "inline-block",
        lineHeight: 1,
        fontFamily: "var(--font-display, var(--font-geist-sans))",
        fontWeight: 700,
        fontSize,
        letterSpacing: "-0.025em",
        color: letterColor,
      }}
    >
      P
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          // The dollar bar sits centered on the bowl of the P — roughly
          // 36% in from the left edge of the glyph, which matches the
          // visual midpoint of Geist Display's P bowl. Tuned by eye.
          left: "36%",
          top: "-8%",
          width: `${Math.max(2, Math.round(height * 0.06))}px`,
          height: "116%",
          background: barColor,
          borderRadius: "1px",
          // Slight x-offset so the bar threads through the bowl rather
          // than floating in front of the stem.
          transform: "translateX(-50%)",
        }}
      />
    </span>
  );
}

export default function Logo({
  size = 28,
  glyphOnly = false,
  inverse = false,
  href = null,
  className,
  ariaLabel = "PuffPrice",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  priority,
}: Props) {
  // Glyph-only — used by favicon stand-ins and tight header contexts.
  // Returns just the single $-P glyph at the requested size.
  if (glyphOnly) {
    const wrap = (
      <span
        className={className}
        aria-label={ariaLabel}
        style={{
          display: "inline-flex",
          alignItems: "center",
          lineHeight: 1,
        }}
      >
        <PWithDollarBar height={size} inverse={inverse} />
      </span>
    );
    return href ? <Link href={href} aria-label={ariaLabel}>{wrap}</Link> : wrap;
  }

  // Full wordmark. We split "Puff" + the literal "P" + "rice" so the
  // second P can carry the dollar bar. The glyph component above renders
  // exactly one P with one bar — composed back into the wordmark here.
  const letterColor = inverse ? COLOR_INVERSE : COLOR_NAVY;
  const wordmark = (
    <span
      aria-label={ariaLabel}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        lineHeight: 1,
        fontFamily: "var(--font-display, var(--font-geist-sans))",
        fontWeight: 700,
        fontSize: `${size}px`,
        letterSpacing: "-0.025em",
        color: letterColor,
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true">Puff</span>
      <PWithDollarBar height={size} inverse={inverse} />
      <span aria-hidden="true">rice</span>
    </span>
  );

  return href ? <Link href={href} aria-label={ariaLabel}>{wordmark}</Link> : wordmark;
}
