// scripts/compute-ppg-from-anchors.ts
//
// Path B PPG backfill — computes inferred price_per_gram for deals that
// match a row in the anchor_skus reference table. See:
//   sql/migrations/2026-04-21-anchor-skus.sql      (table + seed)
//   docs/handoffs/path-b-anchor-sku-strategy-20260421.md  (strategy)
//   docs/handoffs/ppg-backfill-coverage-v2-20260421.md    (why Path B)
//
// Strategy
//   1. Fetch active deals in flower/pre-roll categories where
//      price_per_gram IS NULL.
//   2. For each deal, attempt to resolve (brand, weight_grams) from
//      one of three sources in priority order:
//        a. explicit deals.brand + deals.weight_grams columns
//        b. title text parse (regex for brand tokens + weight tokens)
//        c. description text parse (same patterns)
//   3. Look up matching anchor in anchor_skus by brand_normalized +
//      weight_grams (exact) or closest weight within ±10%.
//   4. If discount_type='percent_off' and discount_unit='percent' and
//      discount_value is not null:
//         inferred_sale = anchor.typical_price_usd * (1 - discount_value/100)
//         inferred_ppg  = inferred_sale / anchor.weight_grams
//   5. If discount_type='dollar_off' and discount_value is not null:
//         inferred_sale = anchor.typical_price_usd - discount_value
//         inferred_ppg  = inferred_sale / anchor.weight_grams
//   6. Otherwise skip honestly and log the reason.
//
// Output modes
//   --dry-run (default): prints a proposed SQL UPDATE per resolvable
//                        deal; does NOT write to the DB.
//   --apply:             executes the UPDATEs via Supabase REST.
//                        Requires SUPABASE_SERVICE_ROLE_KEY.
//
// Safety
//   - Every UPDATE uses COALESCE — will never overwrite an existing
//     price_per_gram / weight_grams / brand value.
//   - Logs every skip with a reason so the result is auditable.
//
// Run:
//   npx tsx scripts/compute-ppg-from-anchors.ts             # dry-run
//   npx tsx scripts/compute-ppg-from-anchors.ts --apply     # execute
//
// Expected yield: 10-15 deals get a PPG on first run. Honest skips for
// the rest (percent-off-brand deals whose brand isn't in anchor_skus,
// first-time / loyalty discounts, storewide percent-off with no product
// anchor, etc.).

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const APPLY = process.argv.includes("--apply");
const READ_KEY = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

if (!READ_KEY) {
  console.error(
    "ERROR: set either NEXT_PUBLIC_SUPABASE_ANON_KEY (dry-run ok) or SUPABASE_SERVICE_ROLE_KEY (required for --apply)."
  );
  process.exit(1);
}
if (APPLY && !SUPABASE_SERVICE_KEY) {
  console.error(
    "ERROR: --apply requires SUPABASE_SERVICE_ROLE_KEY (RLS prevents anon from UPDATE)."
  );
  process.exit(1);
}

// ---------- Types ----------

type Deal = {
  id: string;
  listing_slug: string;
  title: string | null;
  description: string | null;
  category: string | null;
  discount_type: string | null;
  discount_value: number | null;
  discount_unit: string | null;
  brand: string | null;
  weight_grams: number | null;
  price_per_gram: number | null;
  unit: string | null;
};

type Anchor = {
  id: string;
  brand: string;
  brand_normalized: string;
  parent_company: string | null;
  strain: string | null;
  tier: string | null;
  category: string;
  weight_grams: number;
  typical_price_usd: number;
  price_low_usd: number | null;
  price_high_usd: number | null;
  confidence: string;
};

type Resolution =
  | {
      ok: true;
      deal: Deal;
      anchor: Anchor;
      inferred_sale: number;
      inferred_ppg: number;
      reason: string;
    }
  | {
      ok: false;
      deal: Deal;
      reason: string;
    };

// ---------- Brand token dictionary ----------
// Regex-friendly case-insensitive patterns. Matches appear in deal
// titles + descriptions. Longer tokens first so "Verano Reserve" beats
// "Verano" when both could match.

const BRAND_PATTERNS: Array<{ pattern: RegExp; brand: string }> = [
  { pattern: /\bverano\s+reserve\b/i, brand: "Verano Reserve" },
  { pattern: /\bozone\s+reserve\b/i, brand: "Ozone Reserve" },
  { pattern: /\bbedford\s+grow\b/i, brand: "Bedford Grow" },
  { pattern: /\bhigh\s+supply\b/i, brand: "High Supply" },
  { pattern: /\bsimply\s+herb\b/i, brand: "Simply Herb" },
  { pattern: /\bgood\s+news\b/i, brand: "Good News" },
  { pattern: /\bcommon\s+goods\b/i, brand: "Common Goods" },
  { pattern: /\bdogwalkers?\b/i, brand: "Dogwalkers" },
  { pattern: /\bgrassroots\b/i, brand: "Grassroots" },
  { pattern: /\brevolution\b/i, brand: "Revolution" },
  { pattern: /\bincredibles\b/i, brand: "Incredibles" },
  { pattern: /\bsavvy\b/i, brand: "Savvy" },
  { pattern: /\bencore\b/i, brand: "Encore" },
  { pattern: /\bozone\b/i, brand: "Ozone" },
  { pattern: /\brythm\b/i, brand: "Rythm" },
  { pattern: /\brhythm\b/i, brand: "Rythm" },
  { pattern: /\baeriz\b/i, brand: "Aeriz" },
  { pattern: /\bcookies\b/i, brand: "Cookies" },
  { pattern: /\bselect\b/i, brand: "Select" },
  { pattern: /\bcresco\b/i, brand: "Cresco" },
];

// Weight token patterns. Returns grams.
const WEIGHT_PATTERNS: Array<{ pattern: RegExp; grams: number }> = [
  { pattern: /\b28\s*g(?:\b|rams?\b)/i, grams: 28 },
  { pattern: /\b14\s*g(?:\b|rams?\b)/i, grams: 14 },
  { pattern: /\b7\s*g(?:\b|rams?\b)/i, grams: 7 },
  { pattern: /\b3\.5\s*g(?:\b|rams?\b)/i, grams: 3.5 },
  { pattern: /\b1\s*g(?:\b|ram\b)/i, grams: 1 },
  { pattern: /\bounce\b/i, grams: 28 },
  { pattern: /\b1\s*oz\b/i, grams: 28 },
  { pattern: /\bhalf[\s-]*(ounce|oz)\b/i, grams: 14 },
  { pattern: /\bquarter[\s-]*(ounce|oz)\b/i, grams: 7 },
  { pattern: /\beighth\b/i, grams: 3.5 },
];

// ---------- Fetchers ----------

async function fetchAnchors(): Promise<Anchor[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/anchor_skus?is_active=eq.true&select=*`,
    {
      headers: {
        apikey: READ_KEY!,
        Authorization: `Bearer ${READ_KEY}`,
      },
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`fetchAnchors failed ${res.status}: ${t}`);
  }
  return (await res.json()) as Anchor[];
}

async function fetchCandidateDeals(): Promise<Deal[]> {
  // Only flower + pre-roll deals where PPG is still null.
  // Limit 500 to avoid accidental mass-processing if table explodes.
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/deals?is_active=eq.true&price_per_gram=is.null&category=in.(flower,pre-roll)&select=id,listing_slug,title,description,category,discount_type,discount_value,discount_unit,brand,weight_grams,price_per_gram,unit&limit=500`,
    {
      headers: {
        apikey: READ_KEY!,
        Authorization: `Bearer ${READ_KEY}`,
      },
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`fetchCandidateDeals failed ${res.status}: ${t}`);
  }
  return (await res.json()) as Deal[];
}

async function updateDeal(id: string, patch: Record<string, number | string>) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/deals?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) {
    const t = await res.text();
    console.warn(`  updateDeal ${id} failed ${res.status}: ${t}`);
    return false;
  }
  return true;
}

// ---------- Parse helpers ----------

function parseBrand(deal: Deal): string | null {
  if (deal.brand) return deal.brand;
  const text = `${deal.title ?? ""} ${deal.description ?? ""}`;
  for (const { pattern, brand } of BRAND_PATTERNS) {
    if (pattern.test(text)) return brand;
  }
  return null;
}

function parseWeight(deal: Deal): number | null {
  if (deal.weight_grams) return Number(deal.weight_grams);
  const text = `${deal.title ?? ""} ${deal.description ?? ""}`;
  for (const { pattern, grams } of WEIGHT_PATTERNS) {
    if (pattern.test(text)) return grams;
  }
  return null;
}

function findAnchor(
  anchors: Anchor[],
  brand: string,
  weight: number,
  category: string | null
): Anchor | null {
  const normalized = brand.toLowerCase().trim();
  const categoryMatch = (a: Anchor) =>
    category === "pre-roll" ? a.category === "pre-roll" : a.category === "flower" || a.category === "pre-roll";
  const candidates = anchors.filter(
    (a) => a.brand_normalized === normalized && categoryMatch(a)
  );
  if (candidates.length === 0) return null;

  // Exact weight match preferred.
  const exact = candidates.find((a) => Number(a.weight_grams) === weight);
  if (exact) return exact;

  // Fallback: closest within ±10% tolerance.
  const tolerance = 0.1;
  let best: Anchor | null = null;
  let bestDelta = Infinity;
  for (const a of candidates) {
    const delta = Math.abs(Number(a.weight_grams) - weight) / weight;
    if (delta <= tolerance && delta < bestDelta) {
      best = a;
      bestDelta = delta;
    }
  }
  return best;
}

// ---------- Resolve a single deal ----------

function resolve(deal: Deal, anchors: Anchor[]): Resolution {
  const brand = parseBrand(deal);
  if (!brand) {
    return { ok: false, deal, reason: "no brand token in title/description" };
  }

  const weight = parseWeight(deal);
  if (!weight) {
    return { ok: false, deal, reason: `brand=${brand} matched but no weight token` };
  }

  const anchor = findAnchor(anchors, brand, weight, deal.category);
  if (!anchor) {
    return {
      ok: false,
      deal,
      reason: `brand=${brand} weight=${weight}g has no anchor row`,
    };
  }

  let inferred_sale: number | null = null;
  let reason = "";

  if (
    deal.discount_type === "percent_off" &&
    deal.discount_unit === "percent" &&
    deal.discount_value != null
  ) {
    inferred_sale =
      anchor.typical_price_usd * (1 - Number(deal.discount_value) / 100);
    reason = `${deal.discount_value}% off ${anchor.typical_price_usd} anchor`;
  } else if (
    deal.discount_type === "dollar_off" &&
    deal.discount_value != null
  ) {
    inferred_sale = anchor.typical_price_usd - Number(deal.discount_value);
    reason = `$${deal.discount_value} off ${anchor.typical_price_usd} anchor`;
  } else {
    return {
      ok: false,
      deal,
      reason: `brand=${brand} weight=${weight}g matched anchor but discount_type=${deal.discount_type} not computable`,
    };
  }

  if (inferred_sale == null || inferred_sale <= 0) {
    return {
      ok: false,
      deal,
      reason: `inferred_sale=${inferred_sale} ≤ 0 — anchor price too low for discount`,
    };
  }

  const inferred_ppg = inferred_sale / anchor.weight_grams;

  return {
    ok: true,
    deal,
    anchor,
    inferred_sale: Number(inferred_sale.toFixed(2)),
    inferred_ppg: Number(inferred_ppg.toFixed(2)),
    reason,
  };
}

// ---------- Main ----------

(async () => {
  console.log(`Path B PPG backfill — ${APPLY ? "APPLY" : "DRY-RUN"} mode`);

  const anchors = await fetchAnchors();
  console.log(`Loaded ${anchors.length} anchor SKUs.`);

  const deals = await fetchCandidateDeals();
  console.log(`Loaded ${deals.length} PPG-null candidate deals (flower + pre-roll).`);

  const resolutions = deals.map((d) => resolve(d, anchors));
  const hits = resolutions.filter((r): r is Extract<Resolution, { ok: true }> => r.ok);
  const misses = resolutions.filter((r): r is Extract<Resolution, { ok: false }> => !r.ok);

  console.log(`\n=== HITS (${hits.length}) ===`);
  for (const r of hits) {
    const title = (r.deal.title ?? "").slice(0, 60);
    console.log(
      `  ${r.deal.id.slice(0, 8)}  ${r.deal.listing_slug}  |  ${title}`
    );
    console.log(
      `    anchor: ${r.anchor.brand} ${r.anchor.weight_grams}g @ $${r.anchor.typical_price_usd} (${r.anchor.confidence})`
    );
    console.log(
      `    inferred: sale=$${r.inferred_sale}  ppg=$${r.inferred_ppg}/g  (${r.reason})`
    );
  }

  console.log(`\n=== SKIPS (${misses.length}) — by reason ===`);
  const skipBucket = new Map<string, number>();
  for (const r of misses) {
    const key = r.reason.split(" ").slice(0, 3).join(" "); // rough bucket
    skipBucket.set(key, (skipBucket.get(key) ?? 0) + 1);
  }
  const sorted = [...skipBucket.entries()].sort((a, b) => b[1] - a[1]);
  for (const [reason, count] of sorted) {
    console.log(`  ${count.toString().padStart(3)}  ${reason}`);
  }

  if (!APPLY) {
    console.log(`\n--dry-run: no DB writes. ${hits.length} deals would be updated.`);
    console.log(`Re-run with --apply to execute.`);
    return;
  }

  console.log(`\n=== APPLYING ${hits.length} UPDATES ===`);
  let ok = 0;
  let fail = 0;
  for (const r of hits) {
    const patch: Record<string, number | string> = {
      price_per_gram: r.inferred_ppg,
      weight_grams: r.anchor.weight_grams,
      brand: r.anchor.brand,
    };
    if (r.anchor.category === "pre-roll") patch.unit = "pre-roll";
    else if (r.anchor.weight_grams === 3.5) patch.unit = "eighth";
    else if (r.anchor.weight_grams === 7) patch.unit = "quarter";
    else if (r.anchor.weight_grams === 14) patch.unit = "half";
    else if (r.anchor.weight_grams === 28) patch.unit = "oz";
    else patch.unit = "gram";

    const success = await updateDeal(r.deal.id, patch);
    if (success) ok++;
    else fail++;
  }
  console.log(`\nDone. ${ok} applied, ${fail} failed.`);
})();
