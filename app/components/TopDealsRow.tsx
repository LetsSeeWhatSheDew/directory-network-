// Compact "Top deals in Illinois right now" social-proof row.
// Honest label — no click data yet, so we order by highest computed
// savings and label this as "top deals", not "most popular". Rendered
// server-side from already-fetched top deals to avoid extra DB hits.

import Link from "next/link";
import { estimateSavings } from "../../lib/dealScoring";

type Deal = {
  id?: string;
  deal_id?: string;
  slug?: string;
  listing_slug?: string;
  name?: string;
  city?: string;
  deal_title?: string;
  title?: string;
  category?: string | null;
  discount_value?: number | null;
  discount_unit?: string | null;
  discount_type?: string | null;
  original_price?: number | null;
  sale_price?: number | null;
};

function slugToName(s: string) {
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function dispName(d: Deal): string {
  const name = d.name;
  const slug = d.slug || d.listing_slug || "";
  if (!name || name === slug || /^[a-z0-9-]+$/.test(name)) {
    return slugToName(slug || "Illinois dispensary");
  }
  return name;
}

export default function TopDealsRow({
  deals,
  userCity,
}: {
  deals: Deal[];
  userCity?: string | null;
}) {
  // Parent pre-filters `deals` to user-city when possible (app/page.jsx
  // preferLocalDeals) so this component only ranks by savings within the
  // already-localized set. If the parent could not localize, `deals` is
  // statewide — we fall through to that honestly and adjust the heading.
  const ranked = deals
    .map((d) => ({ d, savings: estimateSavings(d) }))
    .filter((x): x is { d: Deal; savings: number } => typeof x.savings === "number" && x.savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 3);

  if (ranked.length === 0) return null;

  const allInUserCity =
    !!userCity &&
    ranked.every(
      (x) =>
        typeof x.d.city === "string" &&
        x.d.city.toLowerCase() === userCity.toLowerCase()
    );
  const heading =
    allInUserCity && userCity
      ? `Top deals in ${userCity} right now`
      : "Top deals in Illinois right now";

  return (
    <section
      aria-label={allInUserCity && userCity ? `Top deals in ${userCity}` : "Top deals in Illinois"}
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "8px 28px 36px",
      }}
    >
      <div
        style={{
          fontSize: ".7rem",
          fontWeight: 700,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "#16a34a",
          fontFamily: "system-ui, sans-serif",
          marginBottom: 10,
        }}
      >
        {heading}
      </div>
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {ranked.map(({ d, savings }) => {
          const slug = d.slug || d.listing_slug || "";
          const id = d.id || d.deal_id;
          // Guard against null/undefined slug producing /l/undefined 404s.
          const href = id ? `/deal/${id}` : slug ? `/l/${slug}` : null;
          if (!href) return null;
          return (
            <Link
              key={id || slug}
              href={href}
              style={{
                background: "#fff",
                border: "1px solid #e8e4da",
                borderLeft: "4px solid #16a34a",
                borderRadius: 12,
                padding: "14px 16px",
                textDecoration: "none",
                color: "#0f1f3d",
                fontFamily: "system-ui, sans-serif",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                transition: "border-color .15s",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: ".92rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {dispName(d)}
                </div>
                <div
                  style={{
                    fontSize: ".78rem",
                    color: "#6b7280",
                    marginTop: 2,
                    lineHeight: 1.4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {d.deal_title || d.title || "Active deal"}
                </div>
                {d.city && (
                  <div style={{ fontSize: ".7rem", color: "#9ca3af", marginTop: 3 }}>
                    {d.city}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: ".58rem",
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    color: "#6b7280",
                    fontWeight: 700,
                  }}
                >
                  You save
                </div>
                <div
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 700,
                    color: "#16a34a",
                    letterSpacing: "-.03em",
                    fontFamily: "Georgia, serif",
                    lineHeight: 1,
                  }}
                >
                  ${savings}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
