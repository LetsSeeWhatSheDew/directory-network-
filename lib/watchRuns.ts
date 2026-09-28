// lib/watchRuns.ts (server-only) — the daily send for price watches and
// sale-day watches. Called from /api/cron/deal-alerts (12:30 UTC, after the
// 6 AM Central menu read and the morning deal check), so there is still one
// cron and one set of emails, claims and unsubscribe links (lib/dealWatch.ts).
//
//   price_watch  compare each watched item's reference price with today's
//                cheapest out-the-door menu price at that store
//                (lib/menuPrices getCheapestBoard) using decidePriceDrop.
//                One email per address listing every drop; references are
//                updated only after the email goes out (or when a price
//                rises). No fresh menu price → nothing changes.
//   event_watch  on the sale day itself (lib/events.ts), one email with the
//                best live deals (city if they picked one), then the watch
//                switches off. Nothing live → no email, watch still ends.
//
// Idempotent per Central-Time day through the same 'sent:YYYY-MM-DD' claim as
// the new-deals digest. ?dry=1 plans without sending or writing.

import { Resend } from "resend";
import { createHash } from "crypto";
import { brand } from "./brand";
import { unsubscribeUrl } from "./alertSubscribers";
import {
  listConfirmedWatches,
  claimForToday,
  restoreCategories,
  deactivateWatch,
  sentOn,
  itemOf,
  refCentsOf,
  maxCentsOf,
  eventOf,
  withTag,
  watchStopUrl,
  type WatchRow,
} from "./dealWatch";
import { renderPriceDropEmail, renderDigestEmail, alertsFrom, type PriceDrop, type DigestDeal } from "./dealAlertEmail";
import { getCheapestBoard, checkedLabel, money, type CheapestItem } from "./menuPrices";
import { decidePriceDrop, isRefUnit, itemWords, toCents, fromCents } from "./priceWatch";
import { eventById, eventsOn } from "./events";
import { readLiveDeals, type LiveDeal } from "./dealOfTheDay";
import { rankStoreDeals } from "./routeDeals";
import { capPerStore } from "./storeCap";
import { otdFor, usd } from "./otd";
import { saveLabel, cleanDealTitle, storeName } from "./exhale";

export type RunStats = Record<string, number | string | boolean | null | string[]>;

const dayLabel = () =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric" }).format(new Date());
const idem = (kind: string, day: string, email: string) => `${kind}/${day}/${createHash("sha256").update(email).digest("hex").slice(0, 24)}`;
const pause = () => new Promise((res) => setTimeout(res, 550)); // Resend default: 2 req/s

function groupByEmail(rows: WatchRow[]): Map<string, WatchRow[]> {
  const m = new Map<string, WatchRow[]>();
  for (const w of rows) {
    const e = w.email.trim().toLowerCase();
    m.set(e, [...(m.get(e) || []), w]);
  }
  return m;
}

/** Claim every row for today; on any lost claim, put them all back. */
async function claimAll(rows: WatchRow[], day: string): Promise<Array<{ row: WatchRow; prev: string[] }> | null> {
  const claimed: Array<{ row: WatchRow; prev: string[] }> = [];
  for (const r of rows) {
    const prev = await claimForToday(r, day);
    if (prev == null) {
      for (const c of claimed) await restoreCategories(c.row.id, c.prev);
      return null;
    }
    claimed.push({ row: r, prev });
  }
  return claimed;
}

// ── Price watches ────────────────────────────────────────────────────────

export async function runPriceWatches(opts: { dry: boolean; day: string; resend: Resend | null }): Promise<RunStats> {
  const watches = await listConfirmedWatches(["price_watch"]);
  if (!watches) return { ok: false, reason: "could not read deal_alerts (service key missing?)" };
  if (!watches.length) return { ok: true, watches: 0 };
  const board = await getCheapestBoard();
  const current = new Map<string, CheapestItem>();
  for (const list of Object.values(board.byRef)) for (const it of list) current.set(`${it.listingSlug}|${it.ref}`, it);

  const stats = { ok: true, watches: watches.length, menuStores: board.stores, drops: 0, sent: 0, refUpdates: 0, noPriceToday: 0, skippedAlreadySent: 0, failed: 0 };
  const errors: string[] = [];
  const plan: string[] = [];

  for (const [email, rows] of groupByEmail(watches)) {
    const hits: Array<{ row: WatchRow; item: CheapestItem; was: number; now: number }> = [];
    for (const row of rows) {
      const it = itemOf(row);
      const ref = refCentsOf(row);
      if (!it || !isRefUnit(it.ref) || ref == null) continue;
      const today = current.get(`${it.slug}|${it.ref}`);
      if (!today) { stats.noPriceToday++; continue; }
      const now = toCents(today.otd);
      const d = decidePriceDrop(ref, now, maxCentsOf(row));
      if (d.notify) hits.push({ row, item: today, was: ref, now });
      else if (d.nextRef !== ref) {
        stats.refUpdates++;
        if (!opts.dry) await restoreCategories(row.id, withTag(row.categories, "ref:", String(d.nextRef)));
      }
    }
    if (!hits.length) continue;
    stats.drops += hits.length;
    if (hits.some((h) => sentOn(h.row) === opts.day)) { stats.skippedAlreadySent++; continue; }
    if (opts.dry) {
      plan.push(`${email.replace(/^(.{2}).*(@.*)$/, "$1…$2")}: ${hits.map((h) => `${h.item.listingSlug}/${h.item.ref} ${fromCents(h.was)}→${fromCents(h.now)}`).join(", ")}`);
      continue;
    }
    if (!opts.resend) { stats.failed++; errors.push("RESEND_API_KEY not set"); continue; }
    const claimed = await claimAll(hits.map((h) => h.row), opts.day);
    if (!claimed) { stats.skippedAlreadySent++; continue; }

    const unsubAll = unsubscribeUrl(brand.url, email);
    const drops: PriceDrop[] = hits.map((h) => ({
      item: itemWords(h.item.ref),
      store: h.item.storeName,
      city: h.item.city,
      product: [h.item.brand && !h.item.product.toLowerCase().startsWith(h.item.brand.toLowerCase()) ? h.item.brand : null, h.item.product].filter(Boolean).join(" "),
      was: fromCents(h.was),
      now: fromCents(h.now),
      shelf: money(h.item.pretax),
      checked: checkedLabel(h.item.checkedAt),
      menuUrl: h.item.sourceUrl,
      pageUrl: `${brand.url}/price-watch?store=${h.item.listingSlug}&item=${h.item.ref}&utm_source=alert&utm_medium=email&utm_campaign=price-watch#${h.item.ref}-${h.item.listingSlug}`,
      stopUrl: watchStopUrl(brand.url, h.row.id),
    }));
    const m = renderPriceDropEmail({ drops, unsubscribeAllUrl: unsubAll, dayLabel: dayLabel() });
    try {
      const r = await opts.resend.emails.send(
        {
          from: alertsFrom(), to: email, replyTo: brand.supportEmail, subject: m.subject, html: m.html, text: m.text,
          headers: { "List-Unsubscribe": `<${unsubAll}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        },
        { idempotencyKey: idem("price-watch", opts.day, email) }
      );
      const err = (r as { error?: unknown }).error;
      if (err) throw new Error(JSON.stringify(err).slice(0, 200));
      stats.sent++;
      // The price we just told them about is the new reference (keep the sent claim).
      for (const c of claimed) {
        const h = hits.find((x) => x.row.id === c.row.id)!;
        await restoreCategories(c.row.id, withTag(withTag(c.prev, "sent:", opts.day), "ref:", String(h.now)));
      }
    } catch (e) {
      stats.failed++;
      errors.push(String(e).slice(0, 200));
      for (const c of claimed) await restoreCategories(c.row.id, c.prev);
    }
    await pause();
  }
  return { ...stats, ...(opts.dry ? { plan } : {}), errors: errors.slice(0, 5) };
}

// ── Sale-day watches ─────────────────────────────────────────────────────

function toDigest(d: LiveDeal, campaign: string): DigestDeal {
  const title = cleanDealTitle(d.deal_title) || "Deal";
  const o = otdFor({ ...d, deal_title: title });
  return {
    id: d.deal_id,
    title,
    store: storeName(d),
    city: String(d.city || ""),
    save: saveLabel({ ...d, deal_title: title }),
    otd: o ? `About ${usd(o.total)} out the door${o.each ? ` · ${usd(o.each)} each` : ""}` : null,
    href: `${brand.url}/deal/${d.deal_id}?utm_source=alert&utm_medium=email&utm_campaign=${campaign}`,
  };
}

/** The best live deals for a sale-day email: rank like /route, 2 per store. */
export function saleDayPicks(deals: LiveDeal[], city: string | null, n = 10): LiveDeal[] {
  const inCity = city ? deals.filter((d) => String(d.city || "").toLowerCase() === city.toLowerCase()) : [];
  const pool = inCity.length ? inCity : deals;
  return capPerStore(rankStoreDeals(pool), 2).kept.slice(0, n);
}

export async function runEventWatches(opts: { dry: boolean; day: string; resend: Resend | null }): Promise<RunStats> {
  const today = eventsOn(opts.day);
  const watches = await listConfirmedWatches(["event_watch"]);
  if (!watches) return { ok: false, reason: "could not read deal_alerts (service key missing?)" };
  // Watches for days already gone (the send found nothing, or ran late) end quietly.
  let ended = 0;
  for (const w of watches) {
    const ev = eventById(eventOf(w));
    if (!ev || ev.date < opts.day) {
      ended++;
      if (!opts.dry) await deactivateWatch(w.id);
    }
  }
  if (!today.length) return { ok: true, watches: watches.length, event: null, endedPast: ended };

  const due = watches.filter((w) => today.some((e) => e.id === eventOf(w)) && sentOn(w) !== opts.day);
  const stats = { ok: true, watches: watches.length, event: today.map((e) => e.name).join(", "), due: due.length, sent: 0, noDeals: 0, failed: 0, endedPast: ended };
  if (!due.length) return stats;
  const deals = await readLiveDeals(0);
  if (!deals) return { ...stats, ok: false, reason: "could not read live deals" };
  const errors: string[] = [];

  for (const [email, rows] of groupByEmail(due)) {
    const row = rows[0];
    const ev = eventById(eventOf(row))!;
    const city = row.city ? row.city.replace(/\b\w/g, (x) => x.toUpperCase()) : null;
    const picks = saleDayPicks(deals, city);
    if (opts.dry) continue;
    if (!picks.length) {
      stats.noDeals++;
      for (const r of rows) await deactivateWatch(r.id);
      continue;
    }
    if (!opts.resend) { stats.failed++; errors.push("RESEND_API_KEY not set"); continue; }
    const claimed = await claimAll(rows, opts.day);
    if (!claimed) continue;
    const unsubAll = unsubscribeUrl(brand.url, email);
    const where = city && picks.some((d) => String(d.city || "").toLowerCase() === city.toLowerCase()) ? city : "Central Illinois";
    const m = renderDigestEmail({
      sections: [{ heading: `${ev.name} in ${where}`, deals: picks.map((d) => toDigest(d, ev.id)), stopUrl: watchStopUrl(brand.url, row.id), stopLabel: `Stop ${ev.name} emails` }],
      unsubscribeAllUrl: unsubAll,
      dayLabel: dayLabel(),
      subject: `${ev.name}: the best deals in ${where} this morning`,
      title: `It's ${ev.name}.`,
      lede: `The biggest everyday savings we found on the stores' own sites this morning. The full list, updated through the day: ${brand.url}${ev.path}`,
      why: `You asked us to email you the morning of ${ev.name}. This is the only one.`,
    });
    try {
      const r = await opts.resend.emails.send(
        {
          from: alertsFrom(), to: email, replyTo: brand.supportEmail, subject: m.subject, html: m.html, text: m.text,
          headers: { "List-Unsubscribe": `<${unsubAll}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        },
        { idempotencyKey: idem(`event-${ev.id}`, opts.day, email) }
      );
      const err = (r as { error?: unknown }).error;
      if (err) throw new Error(JSON.stringify(err).slice(0, 200));
      stats.sent++;
      for (const r2 of rows) await deactivateWatch(r2.id);
    } catch (e) {
      stats.failed++;
      errors.push(String(e).slice(0, 200));
      for (const c of claimed) await restoreCategories(c.row.id, c.prev);
    }
    await pause();
  }
  return { ...stats, errors: errors.slice(0, 5) };
}

/** Both runs, never throwing: a failure here must not stop the deal digest. */
export async function runExtraWatches(opts: { dry: boolean; day: string }): Promise<{ price: RunStats; events: RunStats }> {
  const resend = !opts.dry && process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const safe = async (f: () => Promise<RunStats>): Promise<RunStats> => {
    try {
      return await f();
    } catch (e) {
      return { ok: false, reason: String(e).slice(0, 200) };
    }
  };
  const price = await safe(() => runPriceWatches({ ...opts, resend }));
  const events = await safe(() => runEventWatches({ ...opts, resend }));
  return { price, events };
}
