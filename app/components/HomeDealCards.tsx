"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { estimateSavings, formatSavingsDollars } from "../../lib/dealScoring";
import { displayCity } from "../../lib/cityNormalize";
import { listingHref } from "../../lib/links";
import TrackedLink from "./TrackedLink";
import ShareDealButton from "./ShareDealButton";
import DealBadge from "./DealBadge";
import { isFreshnessHidden, isFreshnessStale } from "./DealFreshnessBadge";
import VerifiedRow from "./VerifiedRow";

type Deal = {
  deal_id?: string;
  id?: string;
  listing_slug?: string;
  slug?: string;
  name?: string;
  city?: string;
  category?: string | null;
  deal_title?: string;
  deal_description?: string | null;
  discount_value?: number;
  discount_unit?: string;
  accepts_credit?: boolean | null;
  drive_thru?: boolean | null;
  delivery?: boolean | null;
  google_rating?: number | null;
  is_recurring?: boolean | null;
  expires_at?: string | null;
  verified_at?: string | null;
  status_reason?: string | null;
  scope?: "local" | "statewide";
};

function slugToName(s: string) {
  return s.split("-").filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function dealKey(d: Deal): string {
  if (d.deal_id) return `id:${d.deal_id}`;
  if (d.id) return `id:${d.id}`;
  return `st:${d.listing_slug || d.slug || "?"}|${d.deal_title || ""}`;
}

function dedupeDeals(list: Deal[]): Deal[] {
  const seen = new Set<string>();
  const out: Deal[] = [];
  for (const d of list) {
    const k = dealKey(d);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(d);
  }
  return out;
}

/**
 * Per-dispensary diversity pass. Cleanup-PR rule: when the top-deals row
 * shows 3 cards, never repeat the same dispensary unless we'd otherwise
 * be forced to render fewer than 3 cards. Caller can specify maxRepeat
 * (default 1) to relax the rule for cases where there are genuinely
 * fewer dispensaries than slots.
 *
 * Pass 1: take the highest-ranked deal from each unique dispensary.
 * Pass 2: if that doesn't fill the slot count, fall back to the original
 *         order (preserving discount sort) so the row stays full.
 */
function diversifyByDispensary(list: Deal[], slots: number): Deal[] {
  const bySlug = new Map<string, Deal>();
  for (const d of list) {
    const slug = (d.listing_slug || d.slug || "").toLowerCase();
    if (!slug) continue;
    if (!bySlug.has(slug)) bySlug.set(slug, d);
  }
  const unique = Array.from(bySlug.values());
  if (unique.length >= slots) return unique.slice(0, slots);
  // Backfill with repeats from the original list so the row stays full.
  const out = [...unique];
  for (const d of list) {
    if (out.length >= slots) break;
    if (!out.includes(d)) out.push(d);
  }
  return out.slice(0, slots);
}

function displayName(d: Deal) {
  const name = d.name;
  const slug = d.slug || d.listing_slug || "";
  if (!name || name === slug || /^[a-z0-9-]+$/.test(name)) {
    return slugToName(slug || name || "Illinois dispensary");
  }
  return name;
}

function isLikelyOpen() {
  const utcHour = new Date().getUTCHours();
  const ctHour = (utcHour + 24 - 5) % 24;
  return ctHour >= 9 && ctHour < 21;
}

function getExpiryUrgency(expiresAt?: string | null) {
  if (!expiresAt) return null;
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiry) || expiry < now) return null;
  const hoursLeft = (expiry - now) / (1000 * 60 * 60);
  if (hoursLeft < 24) return { key: "today", text: "⚡ Expires today", bg: "#fee2e2", fg: "#991b1b" };
  if (hoursLeft < 48) return { key: "soon", text: "⏱ Expires soon", bg: "#fef3c7", fg: "#92400e" };
  if (hoursLeft < 168) {
    const weekday = new Date(expiresAt).toLocaleDateString("en-US", { weekday: "short" });
    return { key: "week", text: `Expires ${weekday}`, bg: "#f1f5f9", fg: "#475569" };
  }
  return null;
}

// Freshness label from a MAX(updated_at) timestamp.
//   < 24h  → "Last verified today"
//   < 72h  → "Last verified {Mon Day}" — absolute date is clearer to
//            a user than relative hours, and matches the per-deal
//            DealFreshnessBadge wording.
//   ≥ 72h  → null (hide the line entirely — stale indicators hurt trust
//             on a price-comparison product more than missing ones)
function freshnessLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso);
  const ms = t.getTime();
  if (!Number.isFinite(ms)) return null;
  const ageHours = (Date.now() - ms) / 3_600_000;
  if (ageHours < 0) return "Last verified today";
  if (ageHours < 24) return "Last verified today";
  if (ageHours < 72) {
    const dateLabel = t.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `Last verified ${dateLabel}`;
  }
  return null;
}

type Mode = "near" | "all";

export default function HomeDealCards({
  initial,
  dealCount,
  mostRecent,
}: {
  initial: Deal[];
  dealCount?: number | null;
  mostRecent?: string | null;
}) {
  // "near" (GPS city) vs "all" (statewide best savings). The default
  // mirrors the prior behavior: use GPS if available, else statewide.
  const [mode, setMode] = useState<Mode>("near");
  // Diversity guard: take the top deal per unique dispensary so the row
  // doesn't render three Cookies-Peoria-Heights cards when one
  // dispensary has multiple recurring deals stacked at the top of the
  // discount-sorted feed.
  const initialDeduped = diversifyByDispensary(dedupeDeals(initial || []), 3);
  const [dealsNear, setDealsNear] = useState<Deal[] | null>(null);
  const [dealsAll, setDealsAll] = useState<Deal[]>(initialDeduped);
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Hot-swap rule (cleanup PR, 2026-05-04): when the user picks a new
  // city via the picker modal or the LocationAware editor, the
  // `cl:location-resolved` event fires. Re-fetch from /api/deals/recommend
  // so the row updates without a full reload — the test case in the spec
  // is "switch from Peoria to Bloomington and confirm results update."
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const refetchFor = (nextCity: string | null) => {
      if (!nextCity) return;
      if (cancelled) return;
      setCity(nextCity);
      setLoading(true);
      fetch(
        `/api/deals/recommend?category=all&limit=6&city=${encodeURIComponent(nextCity)}`,
        { cache: "no-store", signal: controller.signal }
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled) return;
          const raw: Deal[] = Array.isArray(data?.deals) ? data.deals : [];
          const arr = diversifyByDispensary(dedupeDeals(raw), 3);
          // Even when the new city has no matches, set an empty array so
          // the headline / location strip update immediately. The mode
          // toggle still lets the user fall back to "All Central IL".
          setDealsNear(arr.length > 0 ? arr : []);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    let c: string | null = null;
    try {
      c = sessionStorage.getItem("cl_city");
    } catch {}
    if (c) refetchFor(c);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { city?: string } | null;
      if (!detail?.city) return;
      // Skip if the resolved city is the same as the current state
      // (silent IP-or-cookie reconciliation runs on mount).
      if (detail.city.toLowerCase() === (c || "").toLowerCase()) return;
      c = detail.city;
      refetchFor(detail.city);
    };
    window.addEventListener("cl:location-resolved", handler);
    return () => {
      cancelled = true;
      controller.abort();
      window.removeEventListener("cl:location-resolved", handler);
    };
  }, []);

  const deals =
    mode === "near" && dealsNear && dealsNear.length > 0 ? dealsNear : dealsAll;
  const updated = freshnessLabel(mostRecent);

  const likelyOpen = isLikelyOpen();

  if (!deals || deals.length === 0) {
    // Real empty state, not skeletons. Skeletons imply loading; by the
    // time this runs we've already resolved an empty initial set, and the
    // client-side "near me" fetch has either failed or returned nothing.
    // Tell the truth and hand the user something to do.
    if (loading) {
      return (
        <div className="deal-cards">
          {[0, 1, 2].map((i) => (
            <div key={`skel-${i}`} className="deal-card" style={{ padding: 18, minHeight: 220 }} aria-hidden="true">
              <div style={{ height: 14, width: "55%", borderRadius: 6, background: "#e8e4da", marginBottom: 8 }} />
              <div style={{ height: 10, width: "35%", borderRadius: 5, background: "#f0ece3", marginBottom: 18 }} />
              <div style={{ height: 16, width: "75%", borderRadius: 6, background: "#e8e4da", marginBottom: 10 }} />
              <div style={{ height: 10, width: "92%", borderRadius: 5, background: "#f0ece3", marginBottom: 6 }} />
              <div style={{ height: 10, width: "68%", borderRadius: 5, background: "#f0ece3", marginBottom: 18 }} />
              <div style={{ height: 42, width: "100%", borderRadius: 10, background: "#F2F8E9", border: "1px solid #C7E5A8" }} />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8e4da",
          borderRadius: 14,
          padding: "28px 24px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: "#1F3D2B", marginBottom: 6 }}>
          We're refreshing Central IL deals — check back soon.
        </div>
        <p style={{ fontSize: ".9rem", color: "#6b7280", margin: "0 auto 14px", maxWidth: 420, lineHeight: 1.5 }}>
          Or get an alert the moment a new deal drops near you.
        </p>
        <Link
          href="/alerts"
          style={{
            display: "inline-block",
            background: "#7DBA47",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: ".88rem",
            textDecoration: "none",
          }}
        >
          Get free alerts →
        </Link>
      </div>
    );
  }

  // Honest headline rule (cleanup PR, 2026-05-04): if every visible deal
  // belongs to one dispensary, name it explicitly rather than implying a
  // selection across the metro that doesn't exist.
  const visibleSlugs = new Set(
    deals.map((d) => (d.listing_slug || d.slug || "").toLowerCase()).filter(Boolean)
  );
  const onlyOneDispensary = visibleSlugs.size === 1 && deals.length > 0;
  const onlyDispensaryName = onlyOneDispensary ? displayName(deals[0]) : null;
  const headline = onlyDispensaryName
    ? `Top deals at ${onlyDispensaryName} today`
    : mode === "all"
    ? "Top deals in Central Illinois today"
    : city
    ? `Best deals near ${city} today`
    : "Top deals in Central Illinois today";

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <p className="section-eyebrow">Live deals</p>
          <h2 className="section-title">{headline}</h2>
          <p className="section-sub">
            {updated || (typeof dealCount === "number" && dealCount > 0 ? `${dealCount} active deals` : "Live deal feed")}
            {updated && typeof dealCount === "number" && dealCount > 0 && ` · ${dealCount} active deals`}
            {loading && " · Refreshing…"}
          </p>
          {city && (
            <div
              role="tablist"
              aria-label="Filter deals"
              style={{
                display: "inline-flex",
                gap: 6,
                padding: 4,
                background: "#f0ece3",
                borderRadius: 100,
                marginTop: 12,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "near"}
                onClick={() => setMode("near")}
                style={{
                  background: mode === "near" ? "#7DBA47" : "transparent",
                  color: mode === "near" ? "#fff" : "#6b7280",
                  border: "none",
                  borderRadius: 100,
                  padding: "6px 14px",
                  fontSize: ".82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: 32,
                }}
              >
                Near me
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "all"}
                onClick={() => setMode("all")}
                style={{
                  background: mode === "all" ? "#7DBA47" : "transparent",
                  color: mode === "all" ? "#fff" : "#6b7280",
                  border: "none",
                  borderRadius: 100,
                  padding: "6px 14px",
                  fontSize: ".82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: 32,
                }}
              >
                All Central IL
              </button>
            </div>
          )}
        </div>
        {city && (
          <Link
            href="/deals/all"
            style={{
              fontSize: ".85rem",
              color: "#7DBA47",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            See all Central IL deals →
          </Link>
        )}
      </div>

      <div className="deal-cards pp-deal-grid-equal">
        {deals.filter((d) => !isFreshnessHidden(d.verified_at)).map((d, i) => {
          const slug = d.slug || d.listing_slug || "";
          const href = listingHref(slug, city);
          if (!href) return null;
          const name = displayName(d);
          const urgency = getExpiryUrgency(d.expires_at);
          const stale = isFreshnessStale(d.verified_at);
          const dollars = estimateSavings(d);
          const formatted = formatSavingsDollars(d);
          // Discount % for the Verified row. Prefer explicit percent units;
          // fall back to discount_value when unit is "percent" or missing.
          const unit = (d.discount_unit || "").toLowerCase();
          const dv = Number(d.discount_value);
          const discountPct =
            Number.isFinite(dv) && dv > 0 && (unit === "percent" || (!unit && dv <= 100))
              ? Math.round(dv)
              : null;
          return (
            <TrackedLink
              key={d.deal_id || d.id || i}
              href={href}
              className={`deal-card pp-deal-card${i === 0 ? " top-pick" : ""}`}
              style={{ textDecoration: "none", color: "inherit", ...(stale ? { opacity: 0.78, filter: "grayscale(20%)" } : {}) }}
              event="deal_click"
              params={{ dispensary: name, category: d.category || "all", position: i + 1 }}
            >
              <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>
                <DealBadge dealId={d.deal_id || d.id} />
              </div>
              <div className="deal-card-header">
                <div>
                  <div className="deal-name">{name}</div>
                  <div className="deal-city">
                    {displayCity(d)}
                    {d.scope === "statewide" && city ? " · nearby" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className={`pp-open-pill ${likelyOpen ? "is-open" : "is-closed"}`}>
                    {likelyOpen ? "Open today" : "Check hours"}
                  </span>
                  {(d.id || d.deal_id) && (
                    <ShareDealButton
                      dealId={(d.id || d.deal_id) as string}
                      dispensaryName={name}
                      dealTitle={d.deal_title || "Deal"}
                      savings={dollars ?? null}
                      variant="icon"
                    />
                  )}
                </div>
              </div>
              <div className="deal-highlight">{d.deal_title || "Active deal"}</div>
              {urgency && (
                <div style={{ display: "inline-block", marginTop: 4, marginBottom: 6, fontSize: ".7rem", fontFamily: "system-ui,sans-serif", fontWeight: 700, color: urgency.fg, background: urgency.bg, padding: "2px 9px", borderRadius: 100 }}>
                  {urgency.text}
                </div>
              )}
              {d.deal_description && (
                <div className="deal-reason">{d.deal_description}</div>
              )}
              <div className="deal-attrs">
                {d.accepts_credit && <span className="deal-attr">Cards OK</span>}
                {d.drive_thru && <span className="deal-attr">Drive-thru</span>}
                {d.delivery && <span className="deal-attr">Delivery</span>}
                {d.google_rating && d.google_rating > 0 && <span className="deal-attr">{d.google_rating} ★</span>}
                {d.is_recurring && <span className="deal-attr">Recurring</span>}
              </div>
              <div className="pp-deal-card-foot">
                {formatted !== "Deal active" && (
                  dollars != null && dollars > 0 ? (
                    <div className="deal-savings">
                      <div className="savings-copy">
                        <span className="savings-label">You save</span>
                      </div>
                      <span className="savings-num">${dollars}</span>
                    </div>
                  ) : (
                    <div className="deal-savings">
                      <span className="savings-num" style={{ fontSize: "1.5rem" }}>
                        {formatted}
                      </span>
                    </div>
                  )
                )}
                <div style={{ marginTop: 8 }}>
                  <VerifiedRow verifiedAt={d.verified_at} discountPct={discountPct} />
                </div>
                <div className="pp-deal-card-cta-row">
                  <span className="pp-deal-card-cta">View deal &rarr;</span>
                </div>
              </div>
            </TrackedLink>
          );
        })}
      </div>
      <style>{`
        /* Equal-height card grid — every card in the row stretches to
           match the tallest sibling. Inner content can vary; the shell
           stays consistent so the row never reads as "this card is the
           winner because it's bigger." */
        .pp-deal-grid-equal { align-items: stretch; }
        .pp-deal-grid-equal > * { display: flex; flex-direction: column; height: 100%; }
        .pp-deal-card { display: flex; flex-direction: column; height: 100%; }
        .pp-deal-card-foot { margin-top: auto; display: flex; flex-direction: column; gap: 10px; }
        .pp-deal-card-cta-row { display: flex; justify-content: flex-end; padding-top: 4px; }
        .pp-deal-card-cta {
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 700;
          font-size: 0.82rem;
          color: var(--color-sage-deep, #6BA63B);
          letter-spacing: -0.005em;
        }
        .pp-deal-card:hover .pp-deal-card-cta { color: var(--color-deep, #1F3D2B); }

        /* "Open today" pill — primary trust signal on every card. Solid
           sage, white text, padded for confidence. Replaces the older
           pale-tint pill that disappeared into the cream surface. */
        .pp-open-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 600;
          font-size: 0.72rem;
          letter-spacing: 0.01em;
          padding: 5px 10px;
          border-radius: 100px;
          white-space: nowrap;
          line-height: 1.2;
          box-shadow: 0 1px 2px rgba(31, 61, 43, 0.10);
        }
        .pp-open-pill.is-open {
          background: var(--color-sage, #7DBA47);
          color: #fff;
        }
        .pp-open-pill.is-open::before {
          content: "";
          width: 6px; height: 6px; border-radius: 50%;
          background: #fff;
          display: inline-block;
        }
        .pp-open-pill.is-closed {
          background: var(--color-gray-100, #F1EEE7);
          color: var(--color-gray-600, #4B5563);
          box-shadow: none;
        }
      `}</style>
    </>
  );
}
