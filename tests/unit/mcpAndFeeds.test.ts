// Unit tests: new MCP tools (deal_of_the_day, deals_on_route), the accuracy
// read path, the /on-the-way redirect map and deal-of-the-day copy. Fetch is
// stubbed; no network.
process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";

import { test } from "node:test";
import assert from "node:assert/strict";
import { callTool, ToolInputError, TOOL_NAMES } from "../../lib/mcp/tools";
import { getReportTallies } from "../../lib/dealAccuracy";
import { onTheWayTarget, routeCity } from "../../lib/routeDeals";
import { dotdCopy, checkedLabel, type LiveDeal } from "../../lib/dealOfTheDay";
import { stubFetch } from "./_stub";

const fresh = new Date(Date.now() - 3600_000).toISOString();
const ep = routeCity("east-peoria")!;
const no = routeCity("normal")!;
const DEALS: LiveDeal[] = [
  { deal_id: "d1", deal_title: "30% off all flower", city: "East Peoria", slug: "ep", name: "EP Shop", discount_value: 30, discount_unit: "percent", verified_at: fresh, lat: ep.lat, lng: ep.lng },
  { deal_id: "d2", deal_title: "20% off vapes", city: "Normal", slug: "nm", name: "Normal Shop", discount_value: 20, discount_unit: "percent", verified_at: fresh, lat: no.lat, lng: no.lng },
  { deal_id: "d3", deal_title: "40% off for veterans", city: "Normal", slug: "nm", name: "Normal Shop", discount_value: 40, discount_unit: "percent", verified_at: fresh, lat: no.lat, lng: no.lng },
];

test("MCP lists the new tools", () => {
  assert.ok(TOOL_NAMES.includes("deal_of_the_day"));
  assert.ok(TOOL_NAMES.includes("deals_on_route"));
});

test("MCP deal_of_the_day returns the pick and cites its source", async () => {
  const s = stubFetch({ active_deals_with_listings: () => DEALS });
  try {
    const r = (await callTool("deal_of_the_day", {})) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    assert.equal(r.deal.saving, "30% off");
    assert.equal(r.deal.store, "EP Shop");
    assert.equal(r.deal.deal_url, "https://www.puffprice.com/deal/d1");
    assert.equal(r.source_url, "https://www.puffprice.com/deal-of-the-day");
    assert.equal(r.as_of, fresh);
    assert.deepEqual(r.runners_up.map((x: { store: string }) => x.store), ["Normal Shop"]);
    await assert.rejects(callTool("deal_of_the_day", { city: "Peoria" }), ToolInputError);
  } finally {
    s.restore();
  }
});

test("MCP deals_on_route: ordered stops, city names normalized, bad input rejected", async () => {
  const s = stubFetch({ active_deals_with_listings: () => DEALS });
  try {
    const r = (await callTool("deals_on_route", { from: "Peoria, IL", to: "bloomington" })) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    assert.equal(r.from, "Peoria");
    assert.equal(r.to, "Bloomington");
    assert.deepEqual(r.stops.map((x: { store: string }) => x.store), ["EP Shop", "Normal Shop"]);
    assert.deepEqual(r.stops[1].deals.map((d: { title: string }) => d.title), ["20% off vapes", "40% off for veterans"], "everyday deals before conditional ones");
    assert.equal(r.source_url, "https://www.puffprice.com/route/peoria-to-bloomington");
    await assert.rejects(callTool("deals_on_route", { from: "Chicago", to: "Peoria" }), ToolInputError);
    await assert.rejects(callTool("deals_on_route", { from: "Peoria", to: "peoria" }), ToolInputError);
    await assert.rejects(callTool("deals_on_route", { from: "Peoria" }), ToolInputError);
  } finally {
    s.restore();
  }
});

test("MCP deals_on_route says so when data can't be read", async () => {
  const s = stubFetch({ active_deals_with_listings: () => new Response("nope", { status: 500 }) });
  try {
    await assert.rejects(callTool("deals_on_route", { from: "Peoria", to: "Pekin" }), /temporarily unavailable/);
  } finally {
    s.restore();
  }
});

test("accuracy read: maps deal ids to stores, ignores other reasons, null without the service key", async () => {
  const s = stubFetch({
    deal_reports: () => [
      { deal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", listing_slug: null, reason: "confirmed", user_agent: "u1", created_at: fresh },
      { deal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", listing_slug: null, reason: "expired", user_agent: "u2", created_at: fresh },
      { deal_id: null, listing_slug: "store-b", reason: "confirmed", user_agent: "u3", created_at: fresh },
    ],
    deals: (c) => {
      assert.match(c.url.searchParams.get("id") || "", /aaaaaaaa/);
      return [{ id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", listing_slug: "store-a" }];
    },
  });
  try {
    const t = await getReportTallies();
    assert.deepEqual(t?.get("store-a"), { yes: 1, no: 1 });
    assert.deepEqual(t?.get("store-b"), { yes: 1, no: 0 });
    const reportsCall = s.calls.find((c) => c.table === "deal_reports")!;
    assert.equal(reportsCall.url.searchParams.get("project_tag"), "eq.green");
  } finally {
    s.restore();
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    assert.equal(await getReportTallies(), null);
  } finally {
    process.env.SUPABASE_SERVICE_ROLE_KEY = key;
  }
});

test("old /on-the-way links land on the matching /route page", () => {
  assert.equal(onTheWayTarget("peoria", "bloomington-normal"), "/route/peoria-to-bloomington");
  assert.equal(onTheWayTarget("champaign-urbana", "springfield"), "/route/champaign-to-springfield");
  assert.equal(onTheWayTarget("pekin", "pekin"), "/route");
  assert.equal(onTheWayTarget(undefined, undefined), "/route");
  assert.equal(onTheWayTarget("chicago", "peoria"), "/route");
});

test("deal-of-the-day copy: saving, product, store with city; no estimate for percent deals", () => {
  const c = dotdCopy({ deal_id: "x", deal_title: "30% off all flower Shop Now ⭢", city: "Pekin", slug: "shop", name: "Shop", discount_value: 30, discount_unit: "percent" });
  assert.equal(c.saving, "30% off");
  assert.equal(c.product, "All flower");
  assert.equal(c.store, "Shop, Pekin");
  assert.equal(c.title, "30% off all flower");
  assert.equal(c.otdEstimate, null);
  assert.equal(checkedLabel(null), null);
  assert.equal(checkedLabel("not a date"), null);
  assert.equal(checkedLabel("2026-09-27T12:05:00Z"), "Sun, Sep 27, 7:05 AM");
});
