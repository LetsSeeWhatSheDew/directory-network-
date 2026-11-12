// Gold Leaf art: the signature leaf (from the Nov 10 flyers Matthew approved)
// and hand-drawn category pictures. Everything is SVG drawn in code: no stock
// art, no AI images. Colors come from CSS variables so one palette rules all.

import { leafPaths } from "../../../lib/leaf";

const LEAF = leafPaths();

/** The signature leaf. `tone` picks the treatment. */
export function Leaf({
  tone = "gold",
  className,
  title,
}: {
  tone?: "gold" | "line" | "cream" | "ghost";
  className?: string;
  title?: string;
}) {
  const id = `lf-${tone}`;
  const fill =
    tone === "gold" ? `url(#${id})` : tone === "cream" ? "var(--g-cream)" : tone === "ghost" ? "currentColor" : "none";
  const stroke = tone === "line" ? "var(--g-gold)" : "none";
  return (
    <svg
      viewBox="40 60 920 900"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {tone === "gold" && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f8e3a1" />
            <stop offset=".42" stopColor="#d9ac4f" />
            <stop offset=".7" stopColor="#b3812c" />
            <stop offset="1" stopColor="#7d5a1d" />
          </linearGradient>
        </defs>
      )}
      <g fill={fill} stroke={stroke} strokeWidth={tone === "line" ? 5 : 0} strokeLinejoin="round">
        {LEAF.leaflets.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <path
        d={LEAF.stem}
        fill="none"
        stroke={tone === "line" ? "var(--g-gold)" : fill}
        strokeWidth={tone === "line" ? 7 : 11}
        strokeLinecap="round"
      />
      {tone !== "line" && (
        <g stroke={tone === "gold" ? "rgba(60,40,10,.38)" : "rgba(0,0,0,.18)"} strokeWidth={3.2} strokeLinecap="round" fill="none">
          {LEAF.veins.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      )}
    </svg>
  );
}

/** Small leaf mark for the wordmark. */
export function LeafMark({ className }: { className?: string }) {
  return <Leaf tone="gold" className={className} />;
}

type ArtProps = { className?: string };
const S = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** A cured bud: stacked calyxes, sugar leaves, a few pistils. */
export function BudArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M32 7c7 6 13 13 13 25 0 13-6 22-13 25-7-3-13-12-13-25C19 20 25 13 32 7Z" fill="var(--g-art-fill)" {...S} />
      <path d="M24 22c3 2 5 2 8 0 3 2 5 2 8 0M22 31c3 3 6 3 10 0 4 3 7 3 10 0M22 40c3 3 6 3 10 0 4 3 7 3 10 0M25 49c2 2 5 2 7 0 2 2 5 2 7 0" {...S} strokeWidth={1.8} />
      <path d="M19 45c-6 1-10-2-12-6 5-1 9 0 12 3M45 45c6 1 10-2 12-6-5-1-9 0-12 3" fill="var(--g-art-leaf)" {...S} />
      <path d="M30 15c-2-4-1-7 1-9M35 26c3-2 6-2 8 0M27 35c-3-1-5 0-6 2M37 44c3 0 5 1 6 3" stroke="var(--g-art-hair)" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <path d="M32 57v4" {...S} />
    </svg>
  );
}

/** A cart on a slim battery, oil level showing. */
export function VapeArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M28 5h8l1 6H27l1-6Z" fill="var(--g-art-leaf)" {...S} />
      <rect x="25" y="11" width="14" height="20" rx="3" {...S} />
      <path d="M26.5 20h11v8.5a1.5 1.5 0 0 1-1.5 1.5h-8a1.5 1.5 0 0 1-1.5-1.5V20Z" fill="var(--g-art-fill)" stroke="none" />
      <path d="M32 13v16" {...S} strokeWidth={1.6} />
      <rect x="24" y="31" width="16" height="4" rx="1" {...S} />
      <rect x="25" y="35" width="14" height="24" rx="4" fill="var(--g-art-body)" {...S} />
      <circle cx="32" cy="42" r="1.8" fill="var(--g-art-hair)" stroke="none" />
      <path d="M44 14c3 2 3 6 0 8M47 11c5 4 5 11 0 15" {...S} strokeWidth={1.8} opacity=".7" />
    </svg>
  );
}

/** Two sugared gummies, one tipped over. Squares, not cartoon animals. */
export function GummyArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="9" y="26" width="24" height="24" rx="7" transform="rotate(-12 21 38)" fill="var(--g-art-leaf)" {...S} />
      <rect x="29" y="18" width="26" height="26" rx="8" transform="rotate(10 42 31)" fill="var(--g-art-fill)" {...S} />
      <g fill="currentColor" stroke="none">
        <circle cx="36" cy="25" r="1.3" />
        <circle cx="45" cy="27" r="1.3" />
        <circle cx="40" cy="34" r="1.3" />
        <circle cx="49" cy="37" r="1.3" />
        <circle cx="16" cy="36" r="1.2" />
        <circle cx="23" cy="42" r="1.2" />
        <circle cx="14" cy="45" r="1.2" />
      </g>
      <path d="M8 56h48" {...S} strokeWidth={1.8} opacity=".5" />
    </svg>
  );
}

/** A small jar with a glossy dab and its tool. */
export function DabArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M22 26c2-8 8-13 12-12 5 1 7 7 4 12" fill="var(--g-art-fill)" {...S} />
      <path d="M28 20c1-2 3-3 5-3" stroke="#fff6d6" strokeWidth={2} fill="none" strokeLinecap="round" opacity=".85" />
      <rect x="15" y="26" width="34" height="8" rx="3" fill="var(--g-art-leaf)" {...S} />
      <path d="M17 34h30v16a7 7 0 0 1-7 7H24a7 7 0 0 1-7-7V34Z" fill="var(--g-art-body)" {...S} />
      <path d="M22 42h20" {...S} strokeWidth={1.6} opacity=".6" />
      <path d="M44 8 55 20" {...S} />
      <path d="M53.5 18.5 57 22" stroke="var(--g-art-hair)" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

/** Everything: a bundle of the three. */
export function AllArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="24" fill="var(--g-art-body)" {...S} />
      <path d="M32 14c4 4 7 8 7 15 0 8-3 13-7 15-4-2-7-7-7-15 0-7 3-11 7-15Z" fill="var(--g-art-fill)" {...S} />
      <path d="M25 37c-4 1-7-1-8-4 3-1 6 0 8 2M39 37c4 1 7-1 8-4-3-1-6 0-8 2" fill="var(--g-art-leaf)" {...S} />
      <path d="M32 44v6" {...S} />
    </svg>
  );
}

export function CategoryArt({ category, className }: { category: string | null | undefined; className?: string }) {
  switch ((category || "").toLowerCase()) {
    case "flower":
    case "pre-rolls":
    case "prerolls":
      return <BudArt className={className} />;
    case "vapes":
    case "vape":
      return <VapeArt className={className} />;
    case "edibles":
    case "edible":
      return <GummyArt className={className} />;
    case "concentrate":
    case "concentrates":
      return <DabArt className={className} />;
    default:
      return <AllArt className={className} />;
  }
}

/** Film-grain overlay so flat color reads like ink on paper. */
export function Grain() {
  return <span className="g-grain" aria-hidden="true" />;
}
