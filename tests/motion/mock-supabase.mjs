#!/usr/bin/env node
// tests/motion/mock-supabase.mjs
// A tiny stand-in for Supabase's REST API (PostgREST), for local motion
// screenshots when the real project isn't reachable (cloud sandboxes block it).
// Serves FIXTURE rows only — sample stores and sample deals, not live prices.
//
//   node tests/motion/mock-supabase.mjs            # listens on :54321
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 npx next dev
//
// Supports the filters the public pages use: eq, neq, in, gt, gte, lt, lte,
// is.null, not.is.null, ilike, order, limit, and the single-object Accept
// header. Unknown tables return []. Writes are accepted and discarded.

import http from "node:http";

const PORT = Number(process.env.MOCK_PORT || 54321);
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();

const L = (id, slug, name, city, lat, lng, extra = {}) => ({
  id,
  slug,
  name,
  city,
  state: "IL",
  type: "dispensary",
  project_tag: "green",
  is_active: true,
  address1: "100 Sample St",
  phone: "(309) 555-0100",
  website: "https://example.com",
  lat,
  lng,
  short_description: `${name} is a licensed dispensary in ${city}.`,
  long_description: null,
  logo_url: null,
  google_rating: 4.6,
  review_count: 120,
  drive_thru: false,
  delivery: false,
  online_ordering: true,
  loyalty_program: true,
  parking: true,
  wheelchair_accessible: true,
  accepts_credit: false,
  plan: "free",
  ...extra,
});

const listings = [
  L("l1", "sample-leaf-peoria", "Sample Leaf Peoria", "Peoria", 40.6936, -89.589),
  L("l2", "sample-grove-peoria", "Sample Grove", "Peoria", 40.72, -89.61),
  L("l3", "sample-river-east-peoria", "Sample River East Peoria", "East Peoria", 40.666, -89.58),
  L("l4", "sample-heights", "Sample Heights", "Peoria Heights", 40.747, -89.573),
  L("l5", "sample-capitol-springfield", "Sample Capitol", "Springfield", 39.7817, -89.6501),
  L("l6", "sample-prairie-springfield", "Sample Prairie", "Springfield", 39.8, -89.64),
  L("l7", "sample-uptown-normal", "Sample Uptown", "Normal", 40.5142, -88.9906),
  L("l8", "sample-bloom", "Sample Bloom", "Bloomington", 40.4842, -88.9937),
  L("l9", "sample-quad-champaign", "Sample Quad", "Champaign", 40.1164, -88.2434),
  L("l10", "sample-lincoln-urbana", "Sample Lincoln", "Urbana", 40.1106, -88.2073),
  L("l11", "sample-harbor-pekin", "Sample Harbor", "Pekin", 40.5675, -89.6407),
];

const D = (id, slug, title, value, unit, extra = {}) => ({
  id,
  listing_slug: slug,
  title,
  description: "Sample deal for local screenshots. Not a live price.",
  category: extra.category || null,
  discount_type: extra.discount_type || (unit === "dollars" ? "dollar_off" : "percent_off"),
  discount_value: value,
  discount_unit: unit,
  original_price: extra.original_price ?? null,
  sale_price: extra.sale_price ?? null,
  unit: null,
  is_recurring: false,
  recurring_days: null,
  expires_at: extra.expires_at ?? null,
  source: "website",
  source_url: "https://example.com/deals",
  verified_at: iso(now - 3 * 3600e3),
  last_independent_verification: null,
  status_reason: null,
  is_active: true,
  project_tag: "green",
  updated_at: iso(now - 3 * 3600e3),
  created_at: iso(now - 26 * 3600e3),
  savings_amount: extra.savings_amount ?? null,
  savings_percent: null,
});

const deals = [
  D("11111111-0000-4000-8000-000000000001", "sample-leaf-peoria", "$40 off sample eighths", 40, "dollars", { category: "flower", original_price: 60, sale_price: 20, savings_amount: 40 }),
  D("11111111-0000-4000-8000-000000000002", "sample-grove-peoria", "30% off sample vapes", 30, "percent", { category: "vapes" }),
  D("11111111-0000-4000-8000-000000000003", "sample-river-east-peoria", "$5 off sample gummies", 5, "dollars", { category: "edibles" }),
  D("11111111-0000-4000-8000-000000000004", "sample-heights", "25% off sample pre-rolls", 25, "percent", { category: "flower" }),
  D("11111111-0000-4000-8000-000000000005", "sample-heights", "15% off sample concentrates", 15, "percent", { category: "concentrate" }),
  D("11111111-0000-4000-8000-000000000006", "sample-capitol-springfield", "$15 off sample flower", 15, "dollars", { category: "flower", original_price: 45, sale_price: 30 }),
  D("11111111-0000-4000-8000-000000000007", "sample-bloom", "20% off sample edibles", 20, "percent", { category: "edibles" }),
  D("11111111-0000-4000-8000-000000000008", "sample-bloom", "10% off sample carts", 10, "percent", { category: "vapes", expires_at: iso(now + 10 * 3600e3) }),
  D("11111111-0000-4000-8000-000000000009", "sample-uptown-normal", "35% off sample flower", 35, "percent", { category: "flower" }),
  D("11111111-0000-4000-8000-000000000011", "sample-grove-peoria", "2 for $60 sample pre-rolls", 60, "dollars", { category: "flower", discount_type: "fixed_price" }),
  D("11111111-0000-4000-8000-000000000012", "sample-leaf-peoria", "$25 sample eighths", 25, "dollars", { category: "flower", discount_type: "fixed_price" }),
  // Mirrors the live bug report: the biggest saving in Central IL is ~70 mi from Peoria Heights.
  D("11111111-0000-4000-8000-000000000013", "sample-prairie-springfield", "50% off sample flower", 50, "percent", { category: "flower" }),
  D("11111111-0000-4000-8000-000000000010", "sample-quad-champaign", "$10 off sample vapes", 10, "dollars", { category: "vapes" }),
];

const bySlug = Object.fromEntries(listings.map((l) => [l.slug, l]));
const view = deals.map((d) => {
  const l = bySlug[d.listing_slug] || {};
  return {
    ...l,
    ...d,
    deal_id: d.id,
    deal_title: d.title,
    deal_description: d.description,
    slug: d.listing_slug,
    discount_pct: d.discount_unit === "percent" ? d.discount_value : null,
    price_per_gram: null,
  };
});

const hours = listings.flatMap((l) =>
  [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ listing_id: l.id, weekday, opens_at: "09:00", closes_at: "21:00", is_closed: false, project_tag: "green" }))
);

const TABLES = { master_listings: listings, deals, active_deals_with_listings: view, listing_hours: hours };

function parseList(v) {
  return v.replace(/^\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, "").trim());
}

function test(row, col, expr) {
  const val = row[col];
  const neg = expr.startsWith("not.");
  const e = neg ? expr.slice(4) : expr;
  const dot = e.indexOf(".");
  const op = e.slice(0, dot);
  const arg = e.slice(dot + 1);
  let ok = true;
  const cmp = (a, b) => (typeof a === "number" ? a - Number(b) : String(a).localeCompare(String(b)));
  switch (op) {
    case "eq": ok = String(val) === arg; break;
    case "neq": ok = String(val) !== arg; break;
    case "in": ok = parseList(arg).includes(String(val)); break;
    case "gt": ok = val != null && cmp(val, arg) > 0; break;
    case "gte": ok = val != null && cmp(val, arg) >= 0; break;
    case "lt": ok = val != null && cmp(val, arg) < 0; break;
    case "lte": ok = val != null && cmp(val, arg) <= 0; break;
    case "is": ok = arg === "null" ? val == null : String(val) === arg; break;
    case "ilike": {
      const re = new RegExp("^" + arg.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/%/g, ".*") + "$", "i");
      ok = re.test(String(val ?? ""));
      break;
    }
    default: ok = true;
  }
  return neg ? !ok : ok;
}

const RESERVED = new Set(["select", "order", "limit", "offset", "or", "and", "on_conflict", "columns"]);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const m = url.pathname.match(/^\/rest\/v1\/([a-z_]+)/);
  res.setHeader("Content-Type", "application/json");
  if (!m) {
    res.end("[]");
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    req.resume();
    res.statusCode = 201;
    res.end("[]");
    return;
  }
  let rows = (TABLES[m[1]] || []).slice();
  for (const [k, v] of url.searchParams) {
    if (RESERVED.has(k)) continue;
    rows = rows.filter((r) => test(r, k, v));
  }
  const order = url.searchParams.get("order");
  if (order) {
    const keys = order.split(",").map((s) => s.split("."));
    rows.sort((a, b) => {
      for (const [col, dir = "asc"] of keys) {
        const av = a[col], bv = b[col];
        if (av == bv) continue;
        if (av == null) return 1;
        if (bv == null) return -1;
        const c = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
        return dir === "desc" ? -c : c;
      }
      return 0;
    });
  }
  const total = rows.length;
  const limit = Number(url.searchParams.get("limit") || 0);
  if (limit) rows = rows.slice(0, limit);
  res.setHeader("Content-Range", `0-${Math.max(0, rows.length - 1)}/${total}`);
  if ((req.headers.accept || "").includes("vnd.pgrst.object")) {
    if (!rows.length) {
      res.statusCode = 406;
      res.end(JSON.stringify({ code: "PGRST116", message: "no rows" }));
      return;
    }
    res.end(JSON.stringify(rows[0]));
    return;
  }
  res.end(req.method === "HEAD" ? "" : JSON.stringify(rows));
});

server.listen(PORT, "127.0.0.1", () => console.log(`mock supabase on http://127.0.0.1:${PORT} (fixture data)`));
