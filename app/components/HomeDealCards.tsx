"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { estimateSavings, formatSavingsDollars } from "../../lib/dealScoring";
import { displayCity } from "../../lib/cityNormalize";
import { listingHref } from "../../lib/links";
import TrackedLink from "./TrackedLink";
import ShareDealButton from "./ShareDealButton";
import DealBadge from "./DealBadge";
import DealFreshnessBadge, { isFreshnessHidden, isFreshnessStale } from "./DealFreshnessBadge";

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
//   < 24h  → "Updated today"
//   < 72h  → "Updated Xh ago"
//   ≥ 72h  → null (hide the line entirely — stale indicators hurt trust
//             on a price-comparison product more than missing ones)
function freshnessLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const ageHours = (Date.now() - t) / 3_600_000;
  if (ageHours < 0) return "Updated today";
  if (ageHours < 24) return "Updated today";
  if (ageHours < 72) return `Updated ${Math.round(ageHours)}h ago`;
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
  const initialDeduped = dedupeDeals(initial || []).slice(0, 3);
  const [dealsNear, setDealsNear] = useState<Deal[] | null>(null);
  const [dealsAll, setDealsAll] = useState<Deal[]>(initialDeduped);
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let c: string | null = null;
    try {
      c = sessionStorage.getItem("cl_city");
    } catch {}
    if (!c) return;
    setCity(c);
    setLoading(true);
    fetch(
      `/api/deals/recommend?category=all&limit=6&city=${encodeURIComponent(c)}`,
      { cache: "no-store" }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const raw: Deal[] = Array.isArray(data?.deals) ? data.deals : [];
        const arr = dedupeDeals(raw).slice(0, 3);
        if (arr.length > 0) setDealsNear(arr);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
              <div style={{ height: 42, width: "100%", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }} />
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
        <div style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: "#0f1f3d", marginBottom: 6 }}>
          No active deals right now
        </div>
        <p style={{ fontSize: ".9rem", color: "#6b7280", margin: "0 auto 14px", maxWidth: 420, lineHeight: 1.5 }}>
          Check back tomorrow — Illinois dispensaries post fresh deals overnight.
          Or get an alert the moment a deal drops near you.
        </p>
        <Link
          href="/alerts"
          style={{
            display: "inline-block",
            background: "#16a34a",
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

  const headline =
    mode === "all"
      ? "Top deals in Illinois today"
      : city
      ? `Best deals near ${city} today`
      : "Top deals in Illinois today";

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
                  background: mode === "near" ? "#16a34a" : "transparent",
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
                  background: mode === "all" ? "#16a34a" : "transparent",
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
                All Illinois
              </button>
            </div>
          )}
        </div>
        {city && (
          <Link
            href="/deals/all"
            style={{
              fontSize: ".85rem",
              color: "#16a34a",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            See all Illinois deals →
          </Link>
        )}
      </div>

      <div className="deal-cards">
        {deals.filter((d) => !isFreshnessHidden(d.verified_at)).map((d, i) => {
          const slug = d.slug || d.listing_slug || "";
          const href = listingHref(slug, city);
          if (!href) return null;
          const name = displayName(d);
          const urgency = getExpiryUrgency(d.expires_at);
          const stale = isFreshnessStale(d.verified_at);
          return (
            <TrackedLink
              key={d.deal_id || d.id || i}
              href={href}
              className={`deal-card${i === 0 ? " top-pick" : ""}`}
              style={{ textDecoration: "none", color: "inherit", ...(stale ? { opacity: 0.75, filter: "grayscale(25%)" } : {}) }}
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
                  <span className={`open-badge ${likelyOpen ? "open" : "closed"}`}>
                    {likelyOpen ? "Open today" : "Check hours"}
                  </span>
                  {(d.id || d.deal_id) && (
                    <ShareDealButton
                      dealId={(d.id || d.deal_id) as string}
                      dispensaryName={name}
                      dealTitle={d.deal_title || "Deal"}
                      savings={estimateSavings(d) ?? null}
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
              {(() => {
                const dollars = estimateSavings(d);
                const formatted = formatSavingsDollars(d);
                if (formatted === "Deal active") return null;
                if (dollars != null) {
                  return (
                    <div className="deal-savings">
                      <div className="savings-copy">
                        <span className="savings-label">You save</span>
                        </div>
                      <span className="savings-num">${dollars}</span>
                    </div>
                  );
                }
                return (
                  <div className="deal-savings">
                    <span className="savings-num" style={{ fontSize: "1.5rem" }}>
                      {formatted}
                    </span>
                  </div>
                );
              })()}
              <div style={{ marginTop: 6 }}>
                <DealFreshnessBadge verifiedAt={d.verified_at} />
              </div>
            </TrackedLink>
          );
        })}
      </div>
    </>
  );
}
