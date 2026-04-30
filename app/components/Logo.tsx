// app/components/Logo.tsx
// PuffPrice logo — the canonical mark per Matthew's 2026-04-30 directive.
//
// Renders public/logo-puffprice-mark.png — the woman exhaling smoke that
// forms a green dollar sign with the "PuffPrice" wordmark below. This
// replaces the prior text-only $P wordmark (commit 04d5a01) which read
// as just two words separated by a green divider and didn't carry the
// brand at the favicon or share-image level.
//
// Sizes (per Phase 2 spec in the demo-ready prompt):
//   header desktop: 40–48 px tall
//   header mobile:  32–40 px tall
//   footer:         32 px tall
//   favicon:        32×32 (separate file in /public)
//
// The PNG includes the wordmark beneath the mark, so we don't render
// any additional text. Width is intrinsic to the file (272×299), so we
// pass `height` and let `width="auto"` derive — keeping aspect ratio
// stable across every render context.
//
// Backwards compat: every existing call site that wraps <Logo /> in its
// own <Link> still works — the new component's `href` defaults to null
// (no auto-Link). Older props (`glyphOnly`, `inverse`, `priority`,
// `ariaLabel`) are still accepted for API stability with the prior
// implementation.

import Image from "next/image";
import Link from "next/link";

type Props = {
  /** Pixel height of the logo image. Width is derived from aspect ratio. */
  size?: number;
  /** Kept for API compat — the PNG already conveys the brand at every
   *  size, so the prior glyph-only fallback is no longer required. */
  glyphOnly?: boolean;
  /** Kept for API compat — the PNG ships with the wordmark on a
   *  transparent background, so it sits cleanly on light or dark. */
  inverse?: boolean;
  /** Optional href — wraps in a <Link> when provided. Defaults to null
   *  so call sites that wrap <Logo /> in their own <Link> don't end up
   *  with nested anchors. */
  href?: string | null;
  className?: string;
  ariaLabel?: string;
  /** Whether to mark the image as priority (used for the LCP element). */
  priority?: boolean;
};

const LOGO_SRC = "/logo-puffprice-mark.png";
const LOGO_INTRINSIC_WIDTH = 272;
const LOGO_INTRINSIC_HEIGHT = 299;

export default function Logo({
  size = 40,
  glyphOnly: _glyphOnly = false,
  inverse: _inverse = false,
  href = null,
  className,
  ariaLabel = "PuffPrice",
  priority = false,
}: Props) {
  const renderedWidth = Math.round(
    (LOGO_INTRINSIC_WIDTH / LOGO_INTRINSIC_HEIGHT) * size
  );

  const img = (
    <Image
      src={LOGO_SRC}
      alt={ariaLabel}
      width={renderedWidth}
      height={size}
      priority={priority}
      className={className}
      style={{
        height: `${size}px`,
        width: "auto",
        display: "inline-block",
        verticalAlign: "middle",
      }}
    />
  );

  return href ? (
    <Link href={href} aria-label={ariaLabel} style={{ display: "inline-flex", alignItems: "center" }}>
      {img}
    </Link>
  ) : (
    img
  );
}
