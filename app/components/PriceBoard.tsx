// app/components/PriceBoard.tsx
// =============================================================================
// PriceBoard — PuffPrice's signature object (Design Direction v2).
//
// A compact, ranked "who's cheapest right now" comparison for ONE comparable
// product unit. The number is the brand; the ranking is the product. This
// component appears on the homepage (live, near top), on city pages (one per
// category), and as the core of any compare view.
//
// Anatomy (top -> bottom), per brief §4:
//   1. Canopy strip   — PuffPrice$ wordmark + CENTRAL IL · LIVE tag (flat canopy)
//   2. Unit header    — mono eyebrow stating the rung honestly + display title
//                       + mono subline of the facts held constant
//   3. Ranked rows    — cheapest first; #1 highlighted (best-tint); OTD price
//                       prominent (mono); $/unit on every row; BEST · SAVE $X
//   4. Reference line — LOCAL MEDIAN $X.XX  ·  VERIFIED h:mm AM
//   5. Kicker         — one plain-spoken brand-voice line on a faint signal strip
//
// Degradation (brief §4, never renders empty):
//   - 0 stores -> returns null (parent collapses the slot)
//   - 1 store  -> single out-the-door price card (the board's single-row sibling)
//   - 2+ stores -> full ranked board
// The comparison RUNG is always stated honestly (§5) — never a blended index.
//
// Styling lives in globals.css under the `.pb-*` namespace (one shared design
// language; the single-deal card reuses the same row styling).
// =============================================================================

import Link from "next/link";

export type PriceBoardRung = "same_sku" | "normalized" | "tier";

export interface PriceBoardStore {
  /** Stable key (slug). */
  slug?: string;
  storeName: string;
  /** Out-the-door (post-tax) price in dollars — the headline number. */
  otdPrice: number;
  /** Struck shelf (pre-discount) price, if on sale. */
  shelfPrice?: number | null;
  /** Normalized unit string shown on every row, e.g. "$14.29/g". Keeps
   *  cross-size comparison legitimate (§5). */
  perUnit?: string | null;
  /** Distance in miles from the user, if known. */
  distanceMi?: number | null;
  /** Dollars saved vs. the next-cheapest / median — shown on the #1 row. */
  saveVs?: number | null;
  /** Above-median marker (uses --pp-high, sparingly). */
  aboveMedian?: boolean;
  /** Optional deep link (dispensary page / directions). */
  href?: string;
}

export interface PriceBoardProps {
  rung: PriceBoardRung;
  /** Display-face product / comparison title, e.g. "Rythm · Blue Dream". */
  title: string;
  /** Mono subline of the facts held constant,
   *  e.g. "FLOWER · 3.5G · 24% THC · SAME JAR, 3 STORES". */
  subline?: string;
  /** Override the rung eyebrow if the caller has a better phrasing. */
  eyebrow?: string;
  stores: PriceBoardStore[];
  /** Median reference, e.g. "LOCAL MEDIAN $44.00". */
  medianLabel?: string;
  /** Verified time display, e.g. "6:11 AM". */
  verifiedAt?: string;
  /** One plain-spoken brand-voice line. */
  kicker?: string;
  /** Right-side canopy tag. Defaults to "CENTRAL IL · LIVE". */
  locationTag?: string;
}

const RUNG_EYEBROW: Record<PriceBoardRung, string> = {
  same_sku: "CHEAPEST ON THIS EXACT JAR",
  normalized: "BEST PRICE PER UNIT NEAR YOU",
  tier: "PRICE RANGE IN YOUR AREA",
};

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function CanopyStrip({ locationTag }: { locationTag: string }) {
  return (
    <div className="pb-canopy">
      <span className="pb-wordmark">
        PuffPrice<span className="pb-wordmark-dollar">$</span>
      </span>
      <span className="pb-canopy-tag">
        <span className="pp-pulse-dot" aria-hidden="true" /> {locationTag}
      </span>
    </div>
  );
}

function Row({ store, rank }: { store: PriceBoardStore; rank: number }) {
  const isBest = rank === 1;
  const RowTag: React.ElementType = store.href ? Link : "div";
  const rowProps = store.href ? { href: store.href } : {};
  return (
    <RowTag
      {...rowProps}
      className={`pb-row${isBest ? " pb-row-best" : ""}${store.href ? " pb-row-link" : ""}`}
    >
      <span className="pb-rank">{rank}</span>
      <span className="pb-row-main">
        <span className="pb-store">{store.storeName}</span>
        <span className="pb-row-sub">
          {store.distanceMi != null && (
            <span className="price">{store.distanceMi.toFixed(1)} mi</span>
          )}
          {store.distanceMi != null && store.perUnit && <span className="pb-dot">·</span>}
          {store.perUnit && <span className="price">{store.perUnit}</span>}
        </span>
      </span>
      <span className="pb-row-price">
        <span className="pb-otd price">{money(store.otdPrice)}</span>
        {store.shelfPrice != null && store.shelfPrice > store.otdPrice && (
          <span className="pb-strike price">{money(store.shelfPrice)}</span>
        )}
        {isBest && store.saveVs != null && store.saveVs > 0 && (
          <span className="pb-best-flag price">BEST · SAVE ${store.saveVs.toFixed(0)}</span>
        )}
        {store.aboveMedian && !isBest && (
          <span className="pb-above price">ABOVE MEDIAN</span>
        )}
      </span>
    </RowTag>
  );
}

/** Single-store fallback (brief §4): a lone out-the-door price card, same
 *  visual language as a board row. */
function SingleStoreCard({
  store,
  title,
  subline,
  verifiedAt,
  locationTag,
  kicker,
}: {
  store: PriceBoardStore;
  title: string;
  subline?: string;
  verifiedAt?: string;
  locationTag: string;
  kicker?: string;
}) {
  return (
    <div className="pb">
      <CanopyStrip locationTag={locationTag} />
      <div className="pb-head">
        <p className="pp-eyebrow pp-eyebrow-signal">ONLY PRICE WE HAVE RIGHT NOW</p>
        <h3 className="pb-title">{title}</h3>
        {subline && <p className="pb-subline price">{subline}</p>}
      </div>
      <div className="pb-rows">
        <Row store={store} rank={1} />
      </div>
      <div className="pb-ref">
        <span className="pb-ref-median price">
          {store.perUnit ? store.perUnit : "SINGLE STORE"}
        </span>
        {verifiedAt && (
          <span className="pb-ref-verified price">
            <span className="pp-pulse-dot" aria-hidden="true" /> VERIFIED {verifiedAt}
          </span>
        )}
      </div>
      {kicker && <p className="pb-kicker">{kicker}</p>}
    </div>
  );
}

export default function PriceBoard({
  rung,
  title,
  subline,
  eyebrow,
  stores,
  medianLabel,
  verifiedAt,
  kicker,
  locationTag = "CENTRAL IL · LIVE",
}: PriceBoardProps) {
  // Collapse-when-empty (§4).
  if (!stores || stores.length === 0) return null;

  // Single-store fallback (§4) — degrade to a lone OTD card, not a broken board.
  if (stores.length === 1) {
    return (
      <SingleStoreCard
        store={stores[0]}
        title={title}
        subline={subline}
        verifiedAt={verifiedAt}
        locationTag={locationTag}
        kicker={kicker}
      />
    );
  }

  const ranked = [...stores].sort((a, b) => a.otdPrice - b.otdPrice);

  return (
    <div className="pb">
      <CanopyStrip locationTag={locationTag} />

      <div className="pb-head">
        <p className="pp-eyebrow pp-eyebrow-signal">{eyebrow || RUNG_EYEBROW[rung]}</p>
        <h3 className="pb-title">{title}</h3>
        {subline && <p className="pb-subline price">{subline}</p>}
      </div>

      <div className="pb-rows">
        {ranked.map((s, i) => (
          <Row key={s.slug || `${s.storeName}-${i}`} store={s} rank={i + 1} />
        ))}
      </div>

      {(medianLabel || verifiedAt) && (
        <div className="pb-ref">
          <span className="pb-ref-median price">{medianLabel || ""}</span>
          {verifiedAt && (
            <span className="pb-ref-verified price">
              <span className="pp-pulse-dot" aria-hidden="true" /> VERIFIED {verifiedAt}
            </span>
          )}
        </div>
      )}

      {kicker && <p className="pb-kicker">{kicker}</p>}
    </div>
  );
}

/** Seed/placeholder board so the design ships now and goes live once the
 *  menu-baseline pipeline populates canonical_products + price bands
 *  (brief §10 data dependency). */
export const SAMPLE_BOARD: PriceBoardProps = {
  rung: "same_sku",
  title: "Rythm · Blue Dream",
  subline: "FLOWER · 3.5G · 24% THC · SAME JAR, 3 STORES",
  verifiedAt: "6:11 AM",
  medianLabel: "LOCAL MEDIAN $44.00",
  kicker: "Same flower. $9 difference. That's gas money. ⛽",
  stores: [
    { slug: "nuera-east-peoria", storeName: "nuEra · East Peoria", otdPrice: 38.0, shelfPrice: 45.0, perUnit: "$10.86/g", distanceMi: 2.1, saveVs: 9 },
    { slug: "beyond-hello-peoria", storeName: "Beyond Hello · Peoria", otdPrice: 44.0, perUnit: "$12.57/g", distanceMi: 4.8 },
    { slug: "ivy-hall-peoria-heights", storeName: "Ivy Hall · Peoria Heights", otdPrice: 47.0, perUnit: "$13.43/g", distanceMi: 6.0, aboveMedian: true },
  ],
};
