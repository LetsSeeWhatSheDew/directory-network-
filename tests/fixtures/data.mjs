// tests/fixtures/data.mjs
// =============================================================================
// Fixture rows for the mock Supabase (tests/fixtures/mock-supabase.mjs).
//
// Real Central Illinois listing slugs so dynamic routes are exercised with
// the same URLs production serves — but every price, deal, hour and feature
// below is MADE UP for tests. Nothing here is a claim about a real store.
//
// Timestamps are built relative to `now` on every request, so "fresh within
// 36 hours" and "verified today" logic behaves the same whenever tests run.
//
// Rows tagged OTHER-TENANT belong to other master_listings projects
// (project_tag != 'green'). The smoke suite fails if that marker ever shows
// up on a page — a regression guard for docs/architecture/db-scope-discipline.md.
// =============================================================================

const H = 3600_000;

const STORES = [
  // slug, name, city, lat, lng, close (weekday), opts
  ["nuera-east-peoria", "nuEra East Peoria", "East Peoria", 40.6663, -89.5801, "21:00:00"],
  ["noxx-east-peoria", "NOXX East Peoria", "East Peoria", 40.6701, -89.5732, "23:00:00"],
  ["cloud-9-east-peoria", "Cloud 9 East Peoria", "East Peoria", 40.6612, -89.5559, "20:00:00"],
  ["beyond-hello-peoria", "Beyond / Hello Peoria", "Peoria", 40.7488, -89.6042, "22:00:00"],
  ["star-remedies-peoria-il", "Star Remedies Peoria", "Peoria", 40.7201, -89.6113, "21:00:00"],
  ["trinity-on-university", "Trinity on University", "Peoria", 40.7372, -89.6159, "22:00:00"],
  ["cookies-peoria-heights", "Cookies Peoria Heights", "Peoria Heights", 40.7478, -89.5731, "22:00:00"],
  ["nuera-pekin", "nuEra Pekin", "Pekin", 40.5723, -89.6278, "21:00:00"],
  ["cookies-bloomington", "Cookies Bloomington", "Bloomington", 40.4768, -88.9561, "21:00:00"],
  ["beyond-hello-bloomington", "Beyond / Hello Bloomington", "Bloomington", 40.4574, -88.9529, "22:00:00"],
  ["high-haven-normal", "High Haven Normal", "Normal", 40.5093, -88.9848, "21:00:00"],
  ["revolution-dispensary-normal", "Revolution Normal", "Normal", 40.5302, -88.9677, "20:00:00"],
  ["nuera-champaign", "nuEra Champaign", "Champaign", 40.1159, -88.2434, "21:00:00"],
  ["sunnyside-champaign", "Sunnyside Champaign", "Champaign", 40.1417, -88.2446, "22:00:00"],
  ["nuera-urbana", "nuEra Urbana", "Urbana", 40.1109, -88.2073, "21:00:00"],
  ["ascend-cannabis-downtown-springfield", "Ascend Springfield Downtown", "Springfield", 39.8012, -89.6437, "22:00:00"],
  ["maribis-springfield", "Maribis Springfield", "Springfield", 39.7648, -89.6802, "21:00:00"],
];

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const iso = (t) => new Date(t).toISOString();
const dayIso = (t) => new Date(t).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

export function buildTables(nowMs = Date.now()) {
  const ago = (h) => iso(nowMs - h * H);
  const ahead = (h) => iso(nowMs + h * H);

  const listings = STORES.map(([slug, name, city, lat, lng], i) => ({
    id: id(i + 1),
    slug,
    name,
    city,
    state: "IL",
    zip: "61600",
    project_tag: "green",
    is_active: true,
    type: "dispensary",
    address1: `${100 + i} Fixture St`,
    phone: "(309) 555-01" + String(i).padStart(2, "0"),
    website: `https://example.com/${slug}`,
    menu_url: `https://example.com/${slug}/menu`,
    lat,
    lng,
    logo_url: null,
    short_description: `${name} is a licensed adult-use dispensary in ${city}, Illinois.`,
    long_description: `${name} sells flower, vapes, edibles and concentrates. Fixture text for tests.`,
    online_ordering: i % 2 === 0,
    loyalty_program: i % 3 === 0,
    parking: true,
    drive_thru: false,
    delivery: false,
    wheelchair_accessible: true,
    accepts_credit: false,
    cash_only: false,
    atm_onsite: i % 2 === 1,
    plan: null,
    google_rating: 4.5,
    review_count: 120 + i,
    updated_at: ago(30),
    created_at: ago(24 * 200),
  }));

  // Real rows are often incomplete: one store with no phone, website,
  // address or hours, so pages have to cope with nulls.
  const sparse = listings.find((l) => l.slug === "nuera-urbana");
  Object.assign(sparse, { phone: null, website: null, menu_url: null, address1: null, short_description: null, long_description: null, google_rating: null, review_count: null });

  // Out-of-scope and other-tenant rows: must never render on a Central IL page.
  listings.push(
    { ...listings[0], id: id(900), slug: "cookies-chicago", name: "Cookies Chicago", city: "Chicago", lat: 41.88, lng: -87.63 },
    { ...listings[3], id: id(901), slug: "ivy-hall-apartments", name: "OTHER-TENANT Ivy Hall Apartments", project_tag: "rent", type: "apartment" },
    { ...listings[3], id: id(902), slug: "peoria-road-resurfacing-bid", name: "OTHER-TENANT Road Resurfacing Bid", project_tag: "bid", type: "bid" }
  );

  const bySlug = new Map(listings.map((l) => [l.slug, l]));

  const hours = [];
  STORES.forEach(([slug, , , , , close], i) => {
    if (slug === "nuera-urbana") return; // no hours on file
    for (let weekday = 0; weekday < 7; weekday++) {
      const closedSunday = i === 11 && weekday === 6;
      hours.push({
        listing_id: id(i + 1),
        project_tag: "green",
        weekday,
        opens_at: closedSunday ? null : weekday === 6 ? "10:00:00" : "09:00:00",
        closes_at: closedSunday ? null : close,
        is_closed: closedSunday,
      });
    }
  });

  // deals: [listing_slug, title, category, type, value, unit, extra]
  const DEALS = [
    ["noxx-east-peoria", "25% off all flower", "flower", "percent", 25, "percent"],
    ["noxx-east-peoria", "First-time customers 30% off", "all", "percent", 30, "percent"],
    ["nuera-east-peoria", "20% off vapes", "vapes", "percent", 20, "percent"],
    ["beyond-hello-peoria", "$10 off any purchase over $75", "all", "dollars", 10, "dollars"],
    ["beyond-hello-peoria", "Buy 2 get 1 half off edibles", "edibles", "bundle", null, null],
    ["cookies-peoria-heights", "15% off concentrates", "concentrate", "percent", 15, "percent"],
    ["cookies-peoria-heights", "2 for $60 eighths", "flower", "fixed_price", 60, "dollars"],
    ["cookies-bloomington", "20% off house flower", "flower", "percent", 20, "percent"],
    ["beyond-hello-bloomington", "Veterans 15% off every day", "all", "percent", 15, "percent"],
    ["high-haven-normal", "Wax Wednesday 20% off concentrates", "concentrate", "percent", 20, "percent", { is_recurring: true, recurring_days: ["wednesday"] }],
    ["ascend-cannabis-downtown-springfield", "10% off pre-rolls", "preroll", "percent", 10, "percent"],
    ["sunnyside-champaign", "Up to 40% off select vapes", "vapes", "percent", 40, "percent"],
    ["trinity-on-university", "Buy any two Rythm premium flower eighths and get the third one for a penny, mix and match across every strain on the menu while supplies last", "flower", "bundle", null, null],
    ["star-remedies-peoria-il", "Daily special", null, null, null, null],
  ];
  const deals = DEALS.map(([slug, title, category, type, value, unit, extra], i) => ({
    id: id(5000 + i),
    listing_slug: slug,
    title,
    description: `${title}. See store for details.`,
    category,
    discount_type: type,
    discount_value: value,
    discount_unit: unit,
    original_price: null,
    sale_price: null,
    unit: null,
    price_per_gram: null,
    expires_at: i % 4 === 0 ? ahead(30) : null,
    is_recurring: false,
    recurring_days: null,
    source: "website",
    source_url: `https://example.com/${slug}/deals`,
    verified_at: ago(5 + i),
    last_independent_verification: ago(5 + i),
    status_reason: null,
    is_active: true,
    project_tag: "green",
    created_at: ago(24 * (i + 1)),
    updated_at: ago(5 + i),
    ...(extra || {}),
  }));

  const active_deals_with_listings = deals.map((d) => {
    const l = bySlug.get(d.listing_slug);
    return {
      deal_id: d.id,
      deal_title: d.title,
      deal_description: d.description,
      category: d.category,
      discount_type: d.discount_type,
      discount_value: d.discount_value,
      discount_unit: d.discount_unit,
      discount_pct: d.discount_unit === "percent" ? d.discount_value : null,
      savings_percent: d.discount_unit === "percent" ? d.discount_value : null,
      savings_amount: null,
      original_price: d.original_price,
      sale_price: d.sale_price,
      unit: d.unit,
      price_per_gram: d.price_per_gram,
      is_recurring: d.is_recurring,
      recurring_days: d.recurring_days,
      expires_at: d.expires_at,
      source: d.source,
      source_url: d.source_url,
      verified_at: d.verified_at,
      last_independent_verification: d.last_independent_verification,
      status_reason: d.status_reason,
      listing_slug: d.listing_slug,
      slug: l.slug,
      name: l.name,
      city: l.city,
      state: l.state,
      lat: l.lat,
      lng: l.lng,
      logo_url: l.logo_url,
      google_rating: l.google_rating,
      review_count: l.review_count,
      accepts_credit: l.accepts_credit,
      drive_thru: l.drive_thru,
      delivery: l.delivery,
      plan: l.plan,
      project_tag: "green",
    };
  });

  // Menu reads (lib/menuPrices): Peoria area and Bloomington-Normal have
  // several stores; Springfield has one (thin → noindex); Champaign-Urbana
  // none (nearest-city fallback).
  const MENU = [
    ["noxx-east-peoria", "eighth", "Revolution", "Revolution Banana OG 3.5g", 30, 24, 29.38],
    ["noxx-east-peoria", "cart_1g", "Select", "Select Elite Cart 1g", 45, 45, 61.13],
    ["nuera-east-peoria", "eighth", "nuEra", "nuEra Gelato 3.5g", 35, 35, 42.86],
    ["nuera-east-peoria", "gummies_100mg", "Wana", "Wana Sour Gummies 100mg", 20, 20, 26.1],
    ["beyond-hello-peoria", "eighth", "Aeriz", "Aeriz Hazelnut Cream 3.5g", 40, 40, 49.66],
    ["beyond-hello-peoria", "cart_1g", "Cresco", "Cresco Liquid Live Resin 1g", 50, 42, 57.06],
    ["cookies-peoria-heights", "gummies_100mg", "Incredibles", "Incredibles Mango Gummies 100mg", 18, 18, 23.49],
    ["cookies-peoria-heights", "cart_1g", "Cookies", "Cookies Cereal Milk Cart 1g", 55, 55, 74.72],
    ["cookies-bloomington", "eighth", "Cookies", "Cookies Gary Payton 3.5g", 45, 45, 55.8],
    ["high-haven-normal", "eighth", "Bedford Grow", "Bedford Grow Cake Crasher 3.5g", 38, 38, 47.12],
    ["high-haven-normal", "gummies_100mg", "Camino", "Camino Wild Berry Gummies 100mg", 22, 22, 28.49],
    ["ascend-cannabis-downtown-springfield", "eighth", "Ozone", "Ozone Tangie 3.5g", 32, 32, 39.68],
  ];
  const latest_menu_items = MENU.map(([slug, ref, brand, name, raw, pretax, otd], i) => ({
    snapshot_id: `snap-${slug}`,
    dispensary_id: id(7000 + STORES.findIndex((s) => s[0] === slug)),
    canonical_product_id: null,
    canonical_category: null,
    canonical_unit: null,
    scraped_at: ago(3 + (i % 3)),
    raw_name: name,
    raw_brand: brand,
    raw_weight: ref === "eighth" ? "3.5g" : ref === "cart_1g" ? "1g" : "100mg",
    raw_price: raw,
    raw_sale_price: pretax < raw ? pretax : null,
    is_on_sale: pretax < raw,
    price_pretax: pretax,
    price_out_the_door: otd,
    raw_payload: { puffprice_ref: ref, listing_slug: slug, source_url: `https://example.com/${slug}/menu` },
  }));

  const F = (slug, feature, status, evidence) => ({
    listing_slug: slug,
    feature,
    status,
    evidence,
    source_url: `https://example.com/${slug}`,
    verified_at: ago(48),
    project_tag: "green",
  });
  const listing_features = [
    F("cookies-peoria-heights", "medical", "yes", "\"Medical patients welcome\" (fixture)"),
    F("ascend-cannabis-downtown-springfield", "medical", "yes", "\"Now serving medical patients\" (fixture)"),
    F("sunnyside-champaign", "medical", "yes", "\"Medical and adult use\" (fixture)"),
    F("noxx-east-peoria", "medical", "no", "\"Adult use only\" (fixture)"),
    F("nuera-pekin", "drive_thru", "announced", "\"Drive-thru coming soon\" (fixture)"),
    F("nuera-east-peoria", "order_ahead", "yes", "\"Order online for pickup\" (fixture)"),
    F("beyond-hello-peoria", "order_ahead", "yes", "\"Order ahead\" (fixture)"),
    F("beyond-hello-peoria", "curbside", "yes", "\"Curbside pickup\" (fixture)"),
    F("cookies-bloomington", "order_ahead", "yes", "\"Order ahead\" (fixture)"),
    F("nuera-champaign", "order_ahead", "yes", "\"Order online\" (fixture)"),
  ];

  const deal_observations = [];
  deals.forEach((d, i) => {
    for (let k = 0; k < 6; k++) {
      deal_observations.push({
        deal_id: d.id,
        listing_slug: d.listing_slug,
        event: k === 0 ? "created" : "seen",
        observed_day: dayIso(nowMs - (k + (i % 3)) * 24 * H),
        observed_at: ago((k + (i % 3)) * 24),
        title: d.title,
        category: d.category,
        discount_pct: d.discount_unit === "percent" ? d.discount_value : null,
        source_url: d.source_url,
        project_tag: "green",
      });
    }
  });

  const daily_market_stats = [];
  for (const city of ["Peoria", "East Peoria", "Peoria Heights", "Bloomington", "Normal", "Springfield", "Champaign"]) {
    for (let k = 0; k < 10; k++) {
      daily_market_stats.push({
        observed_day: dayIso(nowMs - k * 24 * H),
        city,
        deals_live: 2 + (k % 3),
        stores_with_deals: 1 + (k % 2),
        avg_discount_pct: 15 + (k % 4) * 2,
      });
    }
  }

  const listing_reviews = [
    { id: id(8000), listing_slug: "noxx-east-peoria", rating: 5, body: "Quick line and the staff knew the menu. (fixture)", display_name: "Sam", visit_month: "2026-09", created_at: ago(72), status: "approved", project_tag: "green" },
  ];
  const listing_review_stats = [{ listing_slug: "noxx-east-peoria", review_count: 1, avg_rating: 5 }];

  const scraper_runs = [
    { id: id(9000), started_at: ago(10), finished_at: ago(9.8), status: "success", trigger: "cron", deals_found: 12, deals_inserted: 1, deals_updated: 11, errors: 0, notes: null },
  ];

  const deal_price_history = deals
    .filter((d) => d.discount_value != null)
    .flatMap((d) => [0, 2, 4].map((k) => ({ listing_slug: d.listing_slug, discount_value: d.discount_value, recorded_at: ago(24 * k + 1), project_tag: "green" })));

  // Shopper reports on deals (PR #8's accuracy score reads these).
  const deal_reports = deals.slice(0, 6).flatMap((d, i) => [
    { id: id(9500 + i * 2), deal_id: d.id, listing_slug: d.listing_slug, reason: "confirmed", created_at: ago(20 + i), project_tag: "green" },
    ...(i === 2 ? [{ id: id(9501 + i * 2), deal_id: d.id, listing_slug: d.listing_slug, reason: "expired", created_at: ago(30), project_tag: "green" }] : []),
  ]);

  return {
    deal_reports,
    master_listings: listings,
    listing_hours: hours,
    deals,
    active_deals_with_listings,
    latest_menu_items,
    listing_features,
    deal_observations,
    daily_market_stats,
    listing_reviews,
    listing_review_stats,
    scraper_runs,
    deal_price_history,
  };
}

/** Slugs the smoke suite uses for dynamic routes. */
export const FIXTURE = {
  listingSlug: "noxx-east-peoria",
  dealId: id(5000),
};
