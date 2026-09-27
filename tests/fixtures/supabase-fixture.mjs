// tests/fixtures/supabase-fixture.mjs — a tiny stand-in for Supabase's REST
// API (PostgREST), for local screenshots only. Every store and deal here is
// SAMPLE DATA with obviously fake names ("Sample …"); nothing is real and
// nothing here ships. Run the app against it with:
//
//   node tests/fixtures/supabase-fixture.mjs &            # :54321
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=fixture SUPABASE_SERVICE_ROLE_KEY=fixture \
//   RESEND_API_KEY=fixture npx next dev -p 3100
//
// Supports the PostgREST filters the app uses: eq, neq, in, gt, gte, lt, lte,
// is, not.is, ilike, cs, plus order= and limit=. Writes are accepted and dropped.
import http from "node:http";

const PORT = Number(process.env.FIXTURE_PORT || 54321);
const now = Date.now();
const ago = (h) => new Date(now - h * 3600_000).toISOString();

const STORES = [
  { slug: "sample-riverside-peoria", name: "Sample Riverside", city: "Peoria", lat: 40.7005, lng: -89.5935 },
  { slug: "sample-bluff-peoria-heights", name: "Sample Bluff", city: "Peoria Heights", lat: 40.748, lng: -89.573 },
  { slug: "sample-east-bank", name: "Sample East Bank", city: "East Peoria", lat: 40.6664, lng: -89.5652 },
  { slug: "sample-court-st-pekin", name: "Sample Court St", city: "Pekin", lat: 40.5685, lng: -89.629 },
  { slug: "sample-veterans-pkwy", name: "Sample Veterans Pkwy", city: "Bloomington", lat: 40.4842, lng: -88.9637 },
  { slug: "sample-main-st-normal", name: "Sample Main St", city: "Normal", lat: 40.5127, lng: -88.9939 },
  { slug: "sample-campustown", name: "Sample Campustown", city: "Champaign", lat: 40.1105, lng: -88.2304 },
  { slug: "sample-capitol", name: "Sample Capitol", city: "Springfield", lat: 39.7989, lng: -89.6437 },
  { slug: "sample-wabash", name: "Sample Wabash", city: "Springfield", lat: 39.7702, lng: -89.6908 },
];
const S = Object.fromEntries(STORES.map((s) => [s.slug, s]));

let n = 0;
const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
const D = (slug, title, value, unit, extra = {}) => ({
  deal_id: id(), deal_title: title, deal_description: null, category: null,
  discount_value: value, discount_unit: unit, discount_type: unit === "dollars" ? "amount" : unit === "percent" ? "percentage" : "fixed_price",
  discount_pct: unit === "percent" ? value : null, savings_percent: null,
  slug, listing_slug: slug, name: S[slug].name, city: S[slug].city, lat: S[slug].lat, lng: S[slug].lng,
  verified_at: ago(3), expires_at: null, is_recurring: false, recurring_days: null, ...extra,
});

const DEALS = [
  D("sample-riverside-peoria", "30% off all flower", 30, "percent"),
  D("sample-riverside-peoria", "20% off vape carts", 20, "percent"),
  D("sample-riverside-peoria", "First-time customers 40% off", 40, "percent"),
  D("sample-bluff-peoria-heights", "25% off edibles", 25, "percent", { verified_at: ago(30) }),
  D("sample-east-bank", "$15 off concentrates", 15, "dollars", { category: "concentrate" }),
  D("sample-east-bank", "2 for $60 eighths", null, null),
  D("sample-court-st-pekin", "20% off storewide", 20, "percent"),
  D("sample-veterans-pkwy", "35% off house flower", 35, "percent"),
  D("sample-veterans-pkwy", "Up to 50% off select vapes", 50, "percent"),
  D("sample-main-st-normal", "15% off everything", 15, "percent", { verified_at: ago(60) }),
  D("sample-main-st-normal", "25% off gummies when you buy 3", 25, "percent"),
  D("sample-campustown", "20% off pre-rolls", 20, "percent"),
  D("sample-capitol", "30% off vapes", 30, "percent", { verified_at: ago(20) }),
  D("sample-wabash", "$10 off any eighth", 10, "dollars", { category: "flower" }),
];

const LISTINGS = STORES.map((s, i) => ({
  id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, project_tag: "green", state: "IL", is_active: true, type: "dispensary",
  slug: s.slug, name: s.name, city: s.city, lat: s.lat, lng: s.lng, address1: `${100 + i} Sample Ave`, phone: null, website: null,
  short_description: null, long_description: null, logo_url: null, plan: null, updated_at: ago(24),
}));

const DEAL_TABLE = DEALS.map((d) => ({
  id: d.deal_id, listing_slug: d.listing_slug, title: d.deal_title, description: null, category: d.category, discount_value: d.discount_value,
  discount_unit: d.discount_unit, discount_type: d.discount_type, original_price: null, sale_price: null, expires_at: null, is_recurring: false,
  source_url: null, verified_at: d.verified_at, status_reason: null, is_active: true, project_tag: "green", created_at: ago(20), updated_at: ago(3),
}));

// Menu reads for the price-watch screenshots (out-the-door ≈ shelf × tax).
const menu = (slug, ref, name, brand, weight, shelf, otd, sale) => ({
  snapshot_id: `snap-${slug}`, dispensary_id: `disp-${slug}`, scraped_at: ago(4), raw_name: name, raw_brand: brand, raw_weight: weight,
  raw_price: sale ? shelf + 5 : shelf, raw_sale_price: sale ? shelf : null, is_on_sale: !!sale, price_pretax: shelf, price_out_the_door: otd,
  raw_payload: { puffprice_ref: ref, listing_slug: slug, source_url: null },
});
const MENU = [
  menu("sample-riverside-peoria", "eighth", "Sample House Blend 3.5g", "Sample Farms", "3.5g", 25, 32.4),
  menu("sample-east-bank", "eighth", "Sample Sativa 3.5g", "Sample Grow", "3.5g", 22, 28.6, true),
  menu("sample-veterans-pkwy", "eighth", "Sample Indica 3.5g", "Sample Farms", "3.5g", 30, 38.9),
  menu("sample-capitol", "eighth", "Sample Hybrid 3.5g", "Sample Grow", "3.5g", 28, 36.1),
  menu("sample-riverside-peoria", "cart_1g", "Sample Live Resin Cart 1g", "Sample Labs", "1g", 35, 49.2),
  menu("sample-veterans-pkwy", "cart_1g", "Sample Distillate Cart 1g", "Sample Labs", "1g", 30, 42.3, true),
  menu("sample-east-bank", "gummies_100mg", "Sample Fruit Chews 100mg", "Sample Kitchen", "100mg", 18, 24.1),
  menu("sample-capitol", "gummies_100mg", "Sample Sour Gummies 100mg", "Sample Kitchen", "100mg", 20, 26.9),
];

// Yes/No taps: Riverside has enough to score; East Bank doesn't yet.
const rep = (slug, dealIdx, reason, ua, h) => ({ deal_id: DEALS[dealIdx].deal_id, listing_slug: slug, reason, user_agent: ua, created_at: ago(h), project_tag: "green" });
const REPORTS = [
  ...Array.from({ length: 11 }, (_, i) => rep("sample-riverside-peoria", i % 2, "confirmed", `ua-${i}`, 24 * (i + 1))),
  rep("sample-riverside-peoria", 0, "price_changed", "ua-x", 50),
  rep("sample-east-bank", 4, "confirmed", "ua-a", 10),
  rep("sample-east-bank", 4, "confirmed", "ua-b", 30),
];

const TABLES = {
  active_deals_with_listings: DEALS,
  deals: DEAL_TABLE,
  master_listings: LISTINGS,
  latest_menu_items: MENU,
  deal_reports: REPORTS,
};

function get(row, key) {
  const m = key.match(/^([a-z_]+)->>([a-z_]+)$/);
  if (m) return row[m[1]]?.[m[2]];
  return row[key];
}
const unq = (v) => v.replace(/^"|"$/g, "");
function test(val, expr) {
  const neg = expr.startsWith("not.");
  const e = neg ? expr.slice(4) : expr;
  const dot = e.indexOf(".");
  const op = e.slice(0, dot), arg = decodeURIComponent(e.slice(dot + 1));
  let ok = true;
  const s = val == null ? null : String(val);
  switch (op) {
    case "eq": ok = s === arg; break;
    case "neq": ok = s !== arg; break;
    case "in": ok = arg.replace(/^\(|\)$/g, "").split(",").map(unq).includes(s); break;
    case "gt": ok = s != null && (isNaN(+arg) ? s > arg : +s > +arg); break;
    case "gte": ok = s != null && (isNaN(+arg) ? s >= arg : +s >= +arg); break;
    case "lt": ok = s != null && (isNaN(+arg) ? s < arg : +s < +arg); break;
    case "lte": ok = s != null && (isNaN(+arg) ? s <= arg : +s <= +arg); break;
    case "is": ok = arg === "null" ? val == null : String(val) === arg; break;
    case "ilike": ok = s != null && new RegExp(`^${arg.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`, "i").test(s); break;
    case "cs": ok = Array.isArray(val) && arg.replace(/^\{|\}$/g, "").split(",").map(unq).every((x) => val.includes(x)); break;
    default: ok = true;
  }
  return neg ? !ok : ok;
}

http
  .createServer((req, res) => {
    const u = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const m = u.pathname.match(/^\/rest\/v1\/([a-z_]+)/);
    res.setHeader("Content-Type", "application/json");
    if (!m) return res.end("[]");
    if (req.method !== "GET" && req.method !== "HEAD") {
      // Writes are dropped, but inserts echo back like `Prefer: return=representation`.
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        res.statusCode = req.method === "POST" ? 201 : 200;
        let row = {};
        try { row = JSON.parse(body || "{}"); } catch {}
        res.end(req.method === "POST" ? JSON.stringify([{ id: id(), created_at: new Date().toISOString(), ...row }]) : "[]");
      });
      return;
    }
    let rows = [...(TABLES[m[1]] || [])];
    for (const [k, v] of u.searchParams) {
      if (["select", "order", "limit", "offset", "or", "and"].includes(k)) continue;
      rows = rows.filter((r) => test(get(r, k), v));
    }
    const order = u.searchParams.get("order");
    if (order) {
      const [col, dir] = order.split(".");
      rows.sort((a, b) => {
        const x = a[col], y = b[col];
        if (x == null) return 1;
        if (y == null) return -1;
        return (x > y ? 1 : x < y ? -1 : 0) * (dir === "desc" ? -1 : 1);
      });
    }
    const limit = Number(u.searchParams.get("limit") || 0);
    if (limit) rows = rows.slice(0, limit);
    res.end(JSON.stringify(rows));
  })
  .listen(PORT, "127.0.0.1", () => console.log(`fixture supabase on :${PORT} (${DEALS.length} sample deals)`));
