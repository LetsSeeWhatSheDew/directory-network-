// lib/weeklyDigest.ts
// Builds the weekly email digest payload — top deals across IL,
// grouped by city, ranked by savings. Used by the digest cron and
// by /api/digest/preview for live preview.

import { supabase } from "@/lib/supabase";

export type DigestDeal = {
  deal_id: string;
  deal_title: string;
  category: string;
  name: string;
  // Nullable post-`active_deals_with_listings` view fix (2026-04-20). Orphan
  // deals (listing_slug not joining to master_listings) surface as null
  // instead of the old "Illinois" sentinel. Renderers must guard on null
  // before emitting city text.
  city: string | null;
  slug: string;
  savings_amount: number;
  savings_percent: number | null;
  google_rating: number;
  plan: string;
};

export type DigestSection = {
  city: string;
  deals: DigestDeal[];
};

export type DigestPayload = {
  generatedAt: string;
  weekOf: string;
  totalDeals: number;
  topDealOverall: DigestDeal | null;
  byCity: DigestSection[];
  byCategory: { category: string; count: number; topDeal: DigestDeal }[];
};

const TOP_PER_CITY = 3;
const CITIES_TO_INCLUDE = [
  "Chicago", "Peoria", "Springfield", "Champaign", "Normal",
  "Joliet", "Naperville", "Rockford", "Schaumburg", "Aurora",
  "Danville", "Bloomington",
];

export async function buildWeeklyDigest(): Promise<DigestPayload> {
  const { data: deals, error } = await supabase
    .from("active_deals_with_listings")
    .select("deal_id, deal_title, category, name, city, slug, savings_amount, savings_percent, google_rating, plan")
    .order("savings_amount", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[weeklyDigest] query error:", error);
    return emptyPayload();
  }

  const all = (deals as DigestDeal[]) || [];
  if (all.length === 0) return emptyPayload();

  // Top deal overall — highest savings_amount
  const topDealOverall = all[0] || null;

  // Group by city, take top N per city. Skip orphan deals (city=null from
  // the view) — they don't belong on any city list and the whitelist below
  // wouldn't match them anyway.
  const cityBuckets = new Map<string, DigestDeal[]>();
  for (const d of all) {
    if (!d.city) continue;
    if (!cityBuckets.has(d.city)) cityBuckets.set(d.city, []);
    cityBuckets.get(d.city)!.push(d);
  }

  const byCity: DigestSection[] = CITIES_TO_INCLUDE
    .map((c) => ({
      city: c,
      deals: (cityBuckets.get(c) || []).slice(0, TOP_PER_CITY),
    }))
    .filter((s) => s.deals.length > 0);

  // Group by category, count + top 1
  const categoryBuckets = new Map<string, DigestDeal[]>();
  for (const d of all) {
    if (!categoryBuckets.has(d.category)) categoryBuckets.set(d.category, []);
    categoryBuckets.get(d.category)!.push(d);
  }
  const byCategory = Array.from(categoryBuckets.entries())
    .map(([category, list]) => ({
      category,
      count: list.length,
      topDeal: list[0],
    }))
    .sort((a, b) => b.count - a.count);

  return {
    generatedAt: new Date().toISOString(),
    weekOf: weekStartLabel(),
    totalDeals: all.length,
    topDealOverall,
    byCity,
    byCategory,
  };
}

function emptyPayload(): DigestPayload {
  return {
    generatedAt: new Date().toISOString(),
    weekOf: weekStartLabel(),
    totalDeals: 0,
    topDealOverall: null,
    byCity: [],
    byCategory: [],
  };
}

function weekStartLabel(): string {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

// Render the digest as plain-text + simple HTML body for email send.
export function renderDigestEmail(payload: DigestPayload): { subject: string; html: string; text: string } {
  const subject = `PuffPrice weekly: ${payload.totalDeals} active IL dispensary deals`;

  const text = [
    `PuffPrice Weekly Digest — week of ${payload.weekOf}`,
    `${payload.totalDeals} active deals across Illinois`,
    "",
    payload.topDealOverall
      ? `TOP DEAL: ${payload.topDealOverall.deal_title} at ${payload.topDealOverall.name}${payload.topDealOverall.city ? ` (${payload.topDealOverall.city})` : ""} — save $${payload.topDealOverall.savings_amount.toFixed(2)}`
      : "",
    "",
    ...payload.byCity.flatMap((s) => [
      `${s.city.toUpperCase()}`,
      ...s.deals.map((d) => `  • ${d.deal_title} — ${d.name} (save $${d.savings_amount.toFixed(2)})`),
      "",
    ]),
    `Browse all deals: https://puffprice.com/deals/all`,
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f1f3d;">
      <div style="background: #0f1f3d; color: #fff; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.4rem;">PuffPrice Weekly</h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.7); font-family: system-ui, sans-serif; font-size: .85rem;">
          ${payload.totalDeals} active deals · week of ${payload.weekOf}
        </p>
      </div>
      <div style="background: #fff; padding: 24px; border: 1px solid #e8e4da; border-top: none; border-radius: 0 0 12px 12px;">
        ${payload.topDealOverall ? `
          <div style="background: #f0fdf4; border-left: 3px solid #16a34a; padding: 14px 18px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 4px; font-size: .7rem; text-transform: uppercase; letter-spacing: .12em; color: #166534; font-family: system-ui, sans-serif; font-weight: 700;">Best deal this week</p>
            <p style="margin: 0; font-size: 1.05rem; font-weight: 700;">${escapeHtml(payload.topDealOverall.deal_title)}</p>
            <p style="margin: 4px 0 0; font-family: system-ui, sans-serif; font-size: .85rem; color: #6b7280;">
              ${escapeHtml(payload.topDealOverall.name)}${payload.topDealOverall.city ? ` · ${escapeHtml(payload.topDealOverall.city)}` : ""} · save $${payload.topDealOverall.savings_amount.toFixed(2)}
            </p>
          </div>
        ` : ""}
        ${payload.byCity.map((s) => `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: .95rem; margin: 0 0 8px; color: #0f1f3d; border-bottom: 1px solid #e8e4da; padding-bottom: 6px;">${escapeHtml(s.city)}</h2>
            ${s.deals.map((d) => `
              <p style="margin: 6px 0; font-family: system-ui, sans-serif; font-size: .88rem;">
                <strong>${escapeHtml(d.deal_title)}</strong> — ${escapeHtml(d.name)} · save $${d.savings_amount.toFixed(2)}
              </p>
            `).join("")}
          </div>
        `).join("")}
        <p style="text-align: center; margin-top: 28px;">
          <a href="https://puffprice.com/deals/all" style="background: #16a34a; color: #fff; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-family: system-ui, sans-serif; font-weight: 700;">Browse all deals</a>
        </p>
      </div>
    </div>
  `;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
