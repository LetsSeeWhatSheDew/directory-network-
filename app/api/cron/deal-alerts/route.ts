// GET /api/cron/deal-alerts — daily "Email me new deals" digest.
// Runs at 12:30 UTC (7:30 CT), after the morning scrape (vercel.json).
//
// For every confirmed, active watch (lib/dealWatch.ts) it finds deals created
// in the last 24h (deals.created_at, is_active, project_tag=green, and still
// live in active_deals_with_listings), matches them to the watch, and sends
// ONE email per subscriber. Subscribers with no matches get nothing.
//
// Idempotent per Central-Time day: before sending, every row for that email
// is claimed with a 'sent:YYYY-MM-DD' tag (conditional PATCH, so two runs
// racing can't both win). If the send fails the claim is rolled back. The
// Resend Idempotency-Key is a second guard for retries within 24h.
//
// Auth: Authorization: Bearer ${CRON_SECRET} (lib/cronAuth.ts).
// ?dry=1        plan only: no emails, no writes
// ?hours=N      look-back window (1–168, default 24)
// ?to=<email>   send one sample digest of ALL new Central IL deals to that
//               address (no claims written); for checking how it looks
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createHash } from "crypto";
import { checkCronAuth } from "@/lib/cronAuth";
import { brand } from "@/lib/brand";
import { unsubscribeUrl } from "@/lib/alertSubscribers";
import {
  listConfirmedWatches,
  claimForToday,
  restoreCategories,
  sentOn,
  ctDate,
  storeSlugOf,
  userCategories,
  watchStopUrl,
  type WatchRow,
} from "@/lib/dealWatch";
import { renderDigestEmail, alertsFrom, type DigestDeal, type DigestSection } from "@/lib/dealAlertEmail";
import { effectiveCategory } from "@/lib/inferCategory";
import { otdFor, usd } from "@/lib/otd";
import { saveLabel, cleanDealTitle } from "@/lib/exhale";
import { displayCity } from "@/lib/cityNormalize";
import { isInCentralIL } from "@/lib/visibility";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const AH = { apikey: ANON, Authorization: `Bearer ${ANON}` };
const PER_SECTION = 10;

type LiveDeal = {
  deal_id: string;
  deal_title: string | null;
  deal_description: string | null;
  category: string | null;
  discount_type: string | null;
  discount_value: number | null;
  discount_unit: string | null;
  discount_pct: number | null;
  savings_percent: number | null;
  slug: string | null;
  listing_slug: string | null;
  name: string | null;
  city: string | null;
};

async function newDeals(sinceIso: string): Promise<LiveDeal[]> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/deals?select=id&project_tag=eq.green&is_active=eq.true&created_at=gte.${encodeURIComponent(sinceIso)}&order=created_at.desc&limit=1000`,
    { headers: AH, cache: "no-store" }
  );
  if (!r.ok) throw new Error(`deals read ${r.status}`);
  const ids = ((await r.json()) as Array<{ id: string }>).map((x) => x.id);
  const out: LiveDeal[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const v = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id,deal_title,deal_description,category,discount_type,discount_value,discount_unit,discount_pct,savings_percent,slug,listing_slug,name,city&deal_id=in.(${chunk.join(",")})`,
      { headers: AH, cache: "no-store" }
    );
    if (!v.ok) throw new Error(`live deals read ${v.status}`);
    out.push(...((await v.json()) as LiveDeal[]));
  }
  // Public scope: Central Illinois only.
  return out.filter((d) => isInCentralIL(displayCity(d)));
}

const pctOf = (d: LiveDeal): number | null => {
  if (d.savings_percent != null && Number(d.savings_percent) > 0) return Number(d.savings_percent);
  if ((d.discount_unit || "").toLowerCase() === "percent" && Number(d.discount_value) > 0) return Number(d.discount_value);
  if (d.discount_pct != null && Number(d.discount_pct) > 0) return Number(d.discount_pct);
  return null;
};

function catOf(d: LiveDeal): string | null {
  const c = (effectiveCategory({ category: d.category, deal_title: d.deal_title, deal_description: d.deal_description }) || "").toLowerCase();
  if (/flower|pre-?roll/.test(c)) return "flower";
  if (/edible/.test(c)) return "edibles";
  if (/vape|cart/.test(c)) return "vapes";
  if (/concentrate|extract|dab/.test(c)) return "concentrate";
  return null;
}
// "25% off", "20% off storewide", "everything 15% off": applies to every category.
const storewide = (d: LiveDeal) => {
  const t = cleanDealTitle(d.deal_title).trim();
  return /^\s*(up to\s*)?\d{1,2}\s*%\s*off\s*\.?$/i.test(t) || /\b(store[- ]?wide|site[- ]?wide|everything|entire (store|menu)|all products|whole store)\b/i.test(t);
};

function matches(w: WatchRow, d: LiveDeal): boolean {
  const slug = d.slug || d.listing_slug || "";
  if (w.alert_type === "store_watch") return !!slug && storeSlugOf(w) === slug;
  if (displayCity(d).toLowerCase() !== (w.city || "").toLowerCase()) return false;
  const cats = userCategories(w).filter((c) => c !== "all");
  if (cats.length) {
    const c = catOf(d);
    if (!(c && cats.includes(c)) && !storewide(d)) return false;
  }
  if (w.min_discount != null && Number(w.min_discount) > 0) {
    const p = pctOf(d);
    if (p == null || p < Number(w.min_discount)) return false;
  }
  return true;
}

function toDigest(d: LiveDeal): DigestDeal {
  const title = cleanDealTitle(d.deal_title) || "New deal";
  const city = displayCity(d);
  const o = otdFor({ deal_title: title, category: d.category, city, discount_unit: d.discount_unit, discount_type: d.discount_type });
  return {
    id: d.deal_id,
    title,
    store: String(d.name || d.slug || d.listing_slug || "Dispensary").replace(/^nuera\b/i, "nuEra"),
    city,
    save: saveLabel({ deal_title: title, discount_value: d.discount_value, discount_unit: d.discount_unit, discount_type: d.discount_type }),
    otd: o ? `About ${usd(o.total)} out the door${o.each ? ` · ${usd(o.each)} each` : ""}` : null,
    href: `${brand.url}/deal/${d.deal_id}?utm_source=alert&utm_medium=email&utm_campaign=deal-watch`,
  };
}

const byBest = (a: LiveDeal, b: LiveDeal) => (pctOf(b) || 0) - (pctOf(a) || 0);
const titleCity = (c: string | null) => String(c || "").replace(/\b\w/g, (x) => x.toUpperCase());

function sectionsFor(watches: WatchRow[], deals: LiveDeal[]): DigestSection[] {
  const seen = new Set<string>();
  const ordered = [...watches].sort((a, b) => (a.alert_type === b.alert_type ? 0 : a.alert_type === "store_watch" ? -1 : 1));
  const out: DigestSection[] = [];
  for (const w of ordered) {
    const hit = deals.filter((d) => !seen.has(d.deal_id) && matches(w, d)).sort(byBest).slice(0, PER_SECTION);
    if (!hit.length) continue;
    hit.forEach((d) => seen.add(d.deal_id));
    const storeName = String(hit[0].name || storeSlugOf(w) || "this store").replace(/^nuera\b/i, "nuEra");
    const heading = w.alert_type === "store_watch" ? `New at ${storeName}` : `New in ${titleCity(w.city)}`;
    out.push({
      heading,
      deals: hit.map(toDigest),
      stopUrl: watchStopUrl(brand.url, w.id),
      stopLabel: w.alert_type === "store_watch" ? `Stop emails for ${storeName}` : `Stop emails for ${titleCity(w.city)}`,
    });
  }
  return out;
}

const dayLabel = () =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric" }).format(new Date());
const idemKey = (day: string, email: string) => `deal-alerts/${day}/${createHash("sha256").update(email).digest("hex").slice(0, 24)}`;

export async function GET(req: NextRequest) {
  const auth = checkCronAuth(req, "deal-alerts");
  if (!auth.ok) return auth.response;

  const q = req.nextUrl.searchParams;
  const dry = q.get("dry") === "1";
  const testTo = (q.get("to") || "").trim().toLowerCase();
  const hours = Math.min(168, Math.max(1, Number(q.get("hours")) || 24));
  const since = new Date(Date.now() - hours * 3600000).toISOString();
  const day = ctDate();

  let deals: LiveDeal[];
  try {
    deals = await newDeals(since);
  } catch (e) {
    return NextResponse.json({ ok: false, reason: String(e).slice(0, 200) }, { status: 502 });
  }

  // Sample send: everything new, one section per city, to one address.
  if (testTo) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo)) return NextResponse.json({ ok: false, reason: "bad ?to" }, { status: 400 });
    const cities = [...new Set(deals.map((d) => displayCity(d)))];
    const sections: DigestSection[] = cities.map((c) => ({
      heading: `New in ${c}`,
      deals: deals.filter((d) => displayCity(d) === c).sort(byBest).slice(0, PER_SECTION).map(toDigest),
      stopUrl: `${brand.url}/alerts`,
      stopLabel: `Stop emails for ${c} (sample link)`,
    }));
    if (!sections.length) return NextResponse.json({ ok: true, sent: 0, reason: `no new deals in the last ${hours}h`, newDeals: 0 });
    const m = renderDigestEmail({ sections, unsubscribeAllUrl: unsubscribeUrl(brand.url, testTo), dayLabel: dayLabel() });
    if (dry) return NextResponse.json({ ok: true, dry: true, subject: m.subject, newDeals: deals.length, html: m.html });
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: false, reason: "RESEND_API_KEY not set" }, { status: 500 });
    const r = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: alertsFrom(), to: testTo, replyTo: brand.supportEmail, subject: `[Sample] ${m.subject}`, html: m.html, text: m.text,
    });
    const err = (r as { error?: unknown }).error;
    return NextResponse.json({ ok: !err, sent: err ? 0 : 1, newDeals: deals.length, error: err ? JSON.stringify(err).slice(0, 200) : undefined });
  }

  const watches = await listConfirmedWatches();
  if (!watches) return NextResponse.json({ ok: false, reason: "could not read deal_alerts (service key missing?)" }, { status: 500 });

  const byEmail = new Map<string, WatchRow[]>();
  for (const w of watches) {
    const e = w.email.trim().toLowerCase();
    byEmail.set(e, [...(byEmail.get(e) || []), w]);
  }

  const stats = { day, since, newDeals: deals.length, watches: watches.length, subscribers: byEmail.size, matched: 0, sent: 0, skippedNoMatch: 0, skippedAlreadySent: 0, failed: 0 };
  const errors: string[] = [];
  const plan: Array<{ email: string; deals: number; sections: string[] }> = [];
  const resend = !dry && process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  if (!dry && !resend && deals.length) return NextResponse.json({ ok: false, reason: "RESEND_API_KEY not set", ...stats }, { status: 500 });

  for (const [email, rows] of byEmail) {
    if (rows.some((r) => sentOn(r) === day)) {
      stats.skippedAlreadySent++;
      continue;
    }
    const sections = sectionsFor(rows, deals);
    if (!sections.length) {
      stats.skippedNoMatch++;
      continue;
    }
    stats.matched++;
    const nDeals = sections.reduce((n, s) => n + s.deals.length, 0);
    if (dry) {
      plan.push({ email: email.replace(/^(.{2}).*(@.*)$/, "$1…$2"), deals: nDeals, sections: sections.map((s) => s.heading) });
      continue;
    }

    // Claim every row for today; if any row was already claimed, back out.
    const claimed: Array<{ id: string; prev: string[] }> = [];
    let lost = false;
    for (const r of rows) {
      const prev = await claimForToday(r, day);
      if (prev == null) { lost = true; break; }
      claimed.push({ id: r.id, prev });
    }
    if (lost) {
      for (const c of claimed) await restoreCategories(c.id, c.prev);
      stats.skippedAlreadySent++;
      continue;
    }

    const unsubAll = unsubscribeUrl(brand.url, email);
    const m = renderDigestEmail({ sections, unsubscribeAllUrl: unsubAll, dayLabel: dayLabel() });
    try {
      const r = await resend!.emails.send(
        {
          from: alertsFrom(),
          to: email,
          replyTo: brand.supportEmail,
          subject: m.subject,
          html: m.html,
          text: m.text,
          headers: { "List-Unsubscribe": `<${unsubAll}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        },
        { idempotencyKey: idemKey(day, email) }
      );
      const err = (r as { error?: unknown }).error;
      if (err) throw new Error(JSON.stringify(err).slice(0, 200));
      stats.sent++;
    } catch (e) {
      stats.failed++;
      errors.push(String(e).slice(0, 200));
      for (const c of claimed) await restoreCategories(c.id, c.prev);
    }
    await new Promise((res) => setTimeout(res, 550)); // Resend default rate limit: 2 req/s
  }

  return NextResponse.json({ ok: errors.length === 0, dry, ...stats, plan: dry ? plan : undefined, errors: errors.slice(0, 5) });
}
