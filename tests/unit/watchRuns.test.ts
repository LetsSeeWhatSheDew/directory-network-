// Unit tests: the daily price-watch and sale-day sends (lib/watchRuns.ts),
// with fetch and Resend stubbed. Checks who gets emailed, what gets written
// back, and that dry runs, unconfirmed rows and missing prices do nothing.
process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
process.env.CRON_SECRET = "test-secret";

import { test } from "node:test";
import assert from "node:assert/strict";
import type { Resend } from "resend";
import { runPriceWatches, runEventWatches, saleDayPicks } from "../../lib/watchRuns";
import { confirmTag, type WatchRow } from "../../lib/dealWatch";
import type { LiveDeal } from "../../lib/dealOfTheDay";
import { stubFetch, fakeResend } from "./_stub";

const DAY = "2026-09-28";
const row = (id: string, email: string, alert_type: WatchRow["alert_type"], cats: string[], confirmed = true, city: string | null = null): WatchRow => ({
  id, email, city, state: "IL", categories: confirmed ? [...cats, confirmTag(id, email)] : cats, min_discount: null, alert_type, is_active: true, created_at: "2026-09-01T00:00:00Z",
});
const menu = (slug: string, ref: string, pretax: number, otd: number) => ({
  snapshot_id: `s-${slug}`, dispensary_id: "d", scraped_at: new Date().toISOString(), raw_name: `${ref} thing`, raw_brand: "Brand", raw_weight: null,
  raw_price: pretax, raw_sale_price: null, is_on_sale: false, price_pretax: pretax, price_out_the_door: otd,
  raw_payload: { puffprice_ref: ref, listing_slug: slug, source_url: "https://store.example/menu" },
});
const listings = [
  { slug: "store-a", name: "Store A", city: "Peoria" },
  { slug: "store-b", name: "Store B", city: "Normal" },
];

test("price drop: one email per address, reference moves to the new price, sent claim kept", async () => {
  const watches = [
    row("11111111-1111-1111-1111-111111111111", "pat@example.com", "price_watch", ["item:store-a:eighth", "ref:3200"]),
    row("22222222-2222-2222-2222-222222222222", "pat@example.com", "price_watch", ["item:store-b:cart_1g", "ref:4000"]), // rose → ref follows
    row("33333333-3333-3333-3333-333333333333", "sam@example.com", "price_watch", ["item:store-a:gummies_100mg", "ref:2500"]), // no price today
    row("44444444-4444-4444-4444-444444444444", "eve@example.com", "price_watch", ["item:store-a:eighth", "ref:9900"], false), // unconfirmed
  ];
  const s = stubFetch({
    deal_alerts: (c) => (c.method === "GET" ? watches : c.url.searchParams.get("categories") ? [{ id: "x" }] : []),
    latest_menu_items: () => [menu("store-a", "eighth", 22, 28.6), menu("store-b", "cart_1g", 32, 45.1)],
    master_listings: () => listings,
  });
  const r = fakeResend();
  try {
    const out = await runPriceWatches({ dry: false, day: DAY, resend: r.client as unknown as Resend });
    assert.equal(out.sent, 1);
    assert.equal(out.drops, 1);
    assert.equal(out.refUpdates, 1);
    assert.equal(out.noPriceToday, 1);
    assert.equal(r.sent.length, 1);
    assert.equal(r.sent[0].to, "pat@example.com");
    assert.match(r.sent[0].subject, /eighth of flower at Store A is now \$28\.60 out the door/);
    assert.match(r.sent[0].text, /was \$32\.00/);
    assert.equal(r.sent.some((m) => m.to === "eve@example.com"), false, "unconfirmed rows never get mail");
    const patches = s.calls.filter((c) => c.method === "PATCH").map((c) => ({ id: c.url.searchParams.get("id"), cats: (c.body as { categories: string[] }).categories }));
    const a = patches.filter((p) => p.id === "eq.11111111-1111-1111-1111-111111111111").pop()!;
    assert.ok(a.cats.includes("ref:2860") && a.cats.includes(`sent:${DAY}`), JSON.stringify(a.cats));
    const b = patches.find((p) => p.id === "eq.22222222-2222-2222-2222-222222222222")!;
    assert.ok(b.cats.includes("ref:4510") && !b.cats.some((c) => c.startsWith("sent:")), JSON.stringify(b.cats));
    assert.equal(patches.some((p) => p.id?.includes("3333")), false, "no price today → nothing written");
  } finally {
    s.restore();
  }
});

test("price drop: dry run sends and writes nothing; a failed send rolls the claim back", async () => {
  const w = row("11111111-1111-1111-1111-111111111111", "pat@example.com", "price_watch", ["item:store-a:eighth", "ref:3200"]);
  const handlers = {
    deal_alerts: (c: { method: string; url: URL }) => (c.method === "GET" ? [w] : c.url.searchParams.get("categories") ? [{ id: "x" }] : []),
    latest_menu_items: () => [menu("store-a", "eighth", 22, 28.6)],
    master_listings: () => listings,
  };
  let s = stubFetch(handlers);
  try {
    const dry = await runPriceWatches({ dry: true, day: DAY, resend: null });
    assert.equal(dry.drops, 1);
    assert.equal(s.calls.filter((c) => c.method !== "GET").length, 0);
  } finally {
    s.restore();
  }
  s = stubFetch(handlers);
  const r = fakeResend(true);
  try {
    const out = await runPriceWatches({ dry: false, day: DAY, resend: r.client as unknown as Resend });
    assert.equal(out.failed, 1);
    const last = s.calls.filter((c) => c.method === "PATCH").pop()!;
    assert.deepEqual((last.body as { categories: string[] }).categories, w.categories, "categories restored after a failed send");
  } finally {
    s.restore();
  }
});

test("sale day: sends on the day with city deals, switches the watch off; past watches end quietly", async () => {
  const deal = (id: string, city: string, v: number, t: string): LiveDeal => ({ deal_id: id, deal_title: t, city, slug: `s-${id}`, name: `Shop ${id}`, discount_value: v, discount_unit: "percent", verified_at: new Date().toISOString() });
  const watches = [
    row("55555555-5555-5555-5555-555555555555", "ann@example.com", "event_watch", ["event:green-wednesday-2026"], true, "normal"),
    row("66666666-6666-6666-6666-666666666666", "old@example.com", "event_watch", ["event:not-a-real-event"]),
  ];
  const s = stubFetch({
    deal_alerts: (c) => (c.method === "GET" ? watches : c.url.searchParams.get("categories") ? [{ id: "x" }] : []),
    active_deals_with_listings: () => [deal("1", "Peoria", 40, "40% off flower"), deal("2", "Normal", 20, "20% off vapes")],
  });
  const r = fakeResend();
  try {
    const out = await runEventWatches({ dry: false, day: "2026-11-25", resend: r.client as unknown as Resend });
    assert.equal(out.sent, 1);
    assert.equal(out.endedPast, 1);
    assert.equal(r.sent[0].to, "ann@example.com");
    assert.match(r.sent[0].subject, /Green Wednesday: the best deals in Normal/);
    assert.match(r.sent[0].text, /20% off vapes/);
    assert.doesNotMatch(r.sent[0].text, /40% off flower/, "city watch only lists that city when it has deals");
    const offs = s.calls.filter((c) => c.method === "PATCH" && (c.body as { is_active?: boolean }).is_active === false).map((c) => c.url.searchParams.get("id"));
    assert.ok(offs.includes("eq.55555555-5555-5555-5555-555555555555") && offs.includes("eq.66666666-6666-6666-6666-666666666666"));
  } finally {
    s.restore();
  }
});

test("sale day: nothing happens on other days", async () => {
  const s = stubFetch({ deal_alerts: () => [row("55555555-5555-5555-5555-555555555555", "ann@example.com", "event_watch", ["event:green-wednesday-2026"])] });
  const r = fakeResend();
  try {
    const out = await runEventWatches({ dry: false, day: "2026-10-01", resend: r.client as unknown as Resend });
    assert.equal(out.event, null);
    assert.equal(r.sent.length, 0);
    assert.equal(s.calls.filter((c) => c.method === "PATCH").length, 0);
  } finally {
    s.restore();
  }
});

test("saleDayPicks: city first, falls back to everywhere, two per store", () => {
  const d = (id: string, slug: string, city: string, v: number): LiveDeal => ({ deal_id: id, deal_title: `${v}% off`, slug, city, discount_value: v, discount_unit: "percent" });
  const all = [d("1", "a", "Peoria", 30), d("2", "a", "Peoria", 25), d("3", "a", "Peoria", 20), d("4", "b", "Pekin", 50)];
  assert.deepEqual(saleDayPicks(all, "Peoria").map((x) => x.deal_id), ["1", "2"]);
  assert.deepEqual(saleDayPicks(all, "Morton").map((x) => x.deal_id), ["4", "1", "2"]);
  assert.deepEqual(saleDayPicks(all, null).map((x) => x.deal_id), ["4", "1", "2"]);
});
