// scripts/ingest-scraped-deals.ts
// =============================================================================
// Scrape → deal_submissions ingest pipeline.
//
// Reads a JSON array of scraped deals (Chrome's parallel scrape output) and
// stages each row into `deal_submissions`. Existing Apr 14 `deals` rows that
// collide with a scrape are UPDATEd-in-place (verified + refreshed pricing)
// rather than re-inserted. Fresh deals land in submissions awaiting human
// review, or — with --auto-approve — get promoted to `deals` immediately.
//
// Implements the rules in docs/ops/scrape-dedup-strategy-20260422.md:
//   - Pre-flight shape check (required fields + soft warnings) — NEW 2026-04-23
//   - Dispensary slug must exist in master_listings — NEW 2026-04-23 (reject, no auto-create)
//   - Strict dedup vs deal_submissions (7-day window) → skip
//   - Cross-table collision vs deals.is_active → UPDATE-in-place
//   - Sanity guards reject + audit in-place
//   - Brand normalization against anchor_skus.brand_normalized
//   - Trust hierarchy: scraper@puffprice.com is machine-verified
//
// Modes
//   --dry-run          (default) print proposed INSERTs + UPDATE candidates
//   --apply            execute submissions INSERT + Apr-14-collision UPDATEs
//   --auto-approve     (only with --apply) after INSERT, promote scraper
//                      submissions to `deals`. DEFAULT OFF.
//   --input=<path>     override the default JSON path
//
// Safety
//   - Service-role key required for --apply. Dry-run works without it.
//   - Never overwrites existing non-null fields on UPDATEs (COALESCE).
//   - Never auto-approves submissions flagged fuzzy/price_conflict.
//   - Batch INSERT 20 at a time with exponential backoff on 429.
//   - Sanity-rejected rows still land in submissions (auditable) with
//     rejected_at set — they're never silently dropped.
//
// Run
//   npx tsx scripts/ingest-scraped-deals.ts                  # dry-run
//   npx tsx scripts/ingest-scraped-deals.ts --apply          # insert + UPDATE
//   npx tsx scripts/ingest-scraped-deals.ts --apply --auto-approve
// =============================================================================

import { argv, exit, env } from "node:process";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// ----------------------------- env + flags -----------------------------------

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const APPLY = argv.includes("--apply");
const AUTO_APPROVE = argv.includes("--auto-approve");
const INPUT_FLAG = argv.find((a) => a.startsWith("--input="))?.split("=")[1];

const DEFAULT_INPUT = join(
  homedir(),
  "Desktop",
  "DN-Research",
  "2026-04-22-scrape",
  "ALL-DEALS-2026-04-22.json"
);
const INPUT_PATH = INPUT_FLAG || DEFAULT_INPUT;

const READ_KEY = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
if (!READ_KEY) {
  console.error(
    "ERROR: set either NEXT_PUBLIC_SUPABASE_ANON_KEY (dry-run ok) or SUPABASE_SERVICE_ROLE_KEY (required for --apply)."
  );
  exit(1);
}
if (APPLY && !SUPABASE_SERVICE_KEY) {
  console.error(
    "ERROR: --apply requires SUPABASE_SERVICE_ROLE_KEY (RLS prevents anon from INSERT-via-server / UPDATE)."
  );
  exit(1);
}
if (AUTO_APPROVE && !APPLY) {
  console.error("ERROR: --auto-approve requires --apply.");
  exit(1);
}

const MODE = APPLY
  ? AUTO_APPROVE
    ? "APPLY + AUTO-APPROVE"
    : "APPLY"
  : "DRY-RUN";
console.log(`mode=${MODE} input=${INPUT_PATH}`);

// ----------------------------- types -----------------------------------------

type ScrapedDeal = {
  dispensary_slug?: string | null;
  dispensary_name_freetext?: string | null;
  dispensary_city_freetext?: string | null;
  deal_title?: string | null;
  deal_description?: string | null;
  category?: string | null;
  strain_or_product?: string | null;
  brand?: string | null;
  weight_grams?: number | null;
  mg_thc?: number | null;
  count?: number | null;
  regular_price_usd?: number | null;
  sale_price_usd?: number | null;
  discount_percent?: number | null;
  discount_dollar?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_recurring?: boolean;
  recurring_days?: string[] | null;
  source_url?: string | null;
  scraped_at?: string | null;
  notes?: string | null;
  raw_text?: string | null;
};

type PreflightIssue = {
  severity: "error" | "warning";
  field: string;
  message: string;
};

type Anchor = {
  brand: string;
  brand_normalized: string;
};

type Deal = {
  id: string;
  listing_slug: string;
  title: string | null;
  sale_price: number | null;
  is_active: boolean;
  status_reason: string | null;
};

type Submission = {
  id: string;
  dispensary_slug: string | null;
  deal_title: string;
  sale_price_usd: number | null;
  submitted_at: string;
};

type RejectReason =
  | "sanity_price_too_low"
  | "sanity_price_too_high"
  | "sanity_ppg_too_low"
  | "sanity_ppg_too_high"
  | "no_dispensary"
  | "no_title"
  | "no_denominator"
  | "no_price_signal";

type Plan =
  | { kind: "skip_dedup_strict"; input: ScrapedDeal; matched: Submission }
  | { kind: "update_in_place"; input: ScrapedDeal; existing: Deal }
  | {
      kind: "insert_submission";
      input: ScrapedDeal;
      normalizedBrand: string | null;
      dedupStatus: "first_of_kind" | "fuzzy_match" | "price_conflict";
      rejectedAs?: RejectReason;
    };

// ----------------------------- Supabase REST helpers -------------------------

const headers = (key: string) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

async function restGet<T>(path: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: headers(READ_KEY!),
  });
  if (!res.ok) {
    throw new Error(`GET ${path} → ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T[];
}

async function restPostBatch<T>(
  path: string,
  rows: Record<string, unknown>[]
): Promise<T[]> {
  let attempt = 0;
  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method: "POST",
      headers: headers(SUPABASE_SERVICE_KEY!),
      body: JSON.stringify(rows),
    });
    if (res.ok) return (await res.json()) as T[];
    if (res.status === 429 && attempt < 5) {
      const backoff = 2 ** attempt * 500;
      console.warn(`  429 on POST; backoff ${backoff}ms (attempt ${attempt + 1})`);
      await new Promise((r) => setTimeout(r, backoff));
      attempt += 1;
      continue;
    }
    throw new Error(`POST ${path} → ${res.status} ${await res.text()}`);
  }
}

async function restPatch(
  path: string,
  body: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: headers(SUPABASE_SERVICE_KEY!),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`PATCH ${path} → ${res.status} ${await res.text()}`);
  }
}

// ----------------------------- validation + normalization --------------------

function normalizeTitle(t: string): string {
  return t.trim().toLowerCase().replace(/\s+/g, " ");
}

function hasPriceSignal(d: ScrapedDeal): boolean {
  return (
    d.sale_price_usd != null ||
    d.discount_percent != null ||
    d.discount_dollar != null
  );
}

function hasDenominator(d: ScrapedDeal): boolean {
  return d.weight_grams != null || d.mg_thc != null || d.count != null;
}

type ValidateResult = { ok: true; reason?: undefined } | { ok: false; reason: string };

function validate(d: ScrapedDeal): ValidateResult {
  if (!d.deal_title || d.deal_title.trim().length < 3) {
    return { ok: false, reason: "missing title (<3 chars)" };
  }
  if (!hasPriceSignal(d)) {
    return { ok: false, reason: "no price signal" };
  }
  if (!hasDenominator(d)) {
    return { ok: false, reason: "no denominator (weight_grams/mg_thc/count)" };
  }
  if (!d.dispensary_slug && !d.dispensary_name_freetext) {
    return { ok: false, reason: "no dispensary" };
  }
  return { ok: true };
}

// Stricter pre-flight shape check that runs BEFORE the semantic validator.
// Required fields reflect the scraper contract: every deal must carry a known
// dispensary_slug, a human-readable title/description, both price points, the
// source URL it was pulled from, and the scraped_at timestamp.
// Errors reject; warnings flow through to the report but do NOT block ingest.
function preflightShape(d: ScrapedDeal): PreflightIssue[] {
  const issues: PreflightIssue[] = [];

  if (!d.dispensary_slug || d.dispensary_slug.trim() === "") {
    issues.push({ severity: "error", field: "dispensary_slug", message: "missing" });
  }
  if (!d.deal_title || d.deal_title.trim().length < 3) {
    issues.push({ severity: "error", field: "deal_title", message: "missing or <3 chars" });
  }
  if (!d.deal_description || d.deal_description.trim() === "") {
    issues.push({ severity: "error", field: "deal_description", message: "missing" });
  }
  if (d.regular_price_usd == null) {
    issues.push({ severity: "error", field: "regular_price_usd", message: "missing" });
  }
  if (d.sale_price_usd == null) {
    issues.push({ severity: "error", field: "sale_price_usd", message: "missing" });
  }
  if (!d.source_url || d.source_url.trim() === "") {
    issues.push({ severity: "error", field: "source_url", message: "missing" });
  }
  if (!d.scraped_at || d.scraped_at.trim() === "") {
    issues.push({ severity: "error", field: "scraped_at", message: "missing" });
  }

  // Warnings — flagged in the report, do NOT block the deal
  if (d.sale_price_usd != null && d.sale_price_usd > 500) {
    issues.push({
      severity: "warning",
      field: "sale_price_usd",
      message: `price $${d.sale_price_usd} > $500 — likely scrape error on a multi-pack`,
    });
  }
  if (
    d.sale_price_usd != null &&
    d.regular_price_usd != null &&
    d.sale_price_usd >= d.regular_price_usd
  ) {
    issues.push({
      severity: "warning",
      field: "sale_price_usd",
      message: `sale_price ($${d.sale_price_usd}) >= original_price ($${d.regular_price_usd}) — not actually a deal`,
    });
  }
  if (d.deal_description && d.deal_description.length > 500) {
    issues.push({
      severity: "warning",
      field: "deal_description",
      message: `description length ${d.deal_description.length} > 500 chars — scrape probably captured wrong DOM element`,
    });
  }

  return issues;
}

function computePpg(d: ScrapedDeal): number | null {
  if (
    d.weight_grams != null &&
    d.weight_grams > 0 &&
    d.sale_price_usd != null &&
    d.sale_price_usd > 0
  ) {
    return Math.round((d.sale_price_usd / d.weight_grams) * 100) / 100;
  }
  return null;
}

function sanityReject(d: ScrapedDeal): RejectReason | null {
  if (!d.deal_title || d.deal_title.trim().length < 3) return "no_title";
  if (!d.dispensary_slug && !d.dispensary_name_freetext) return "no_dispensary";
  if (!hasPriceSignal(d)) return "no_price_signal";
  if (!hasDenominator(d)) return "no_denominator";
  if (d.sale_price_usd != null) {
    if (d.sale_price_usd < 2) return "sanity_price_too_low";
    if (d.sale_price_usd > 500) return "sanity_price_too_high";
  }
  if (d.weight_grams != null && d.weight_grams > 0) {
    const ppg = computePpg(d);
    if (ppg != null) {
      if (ppg < 2) return "sanity_ppg_too_low";
      if (ppg > 50) return "sanity_ppg_too_high";
    }
  }
  return null;
}

// ----------------------------- load input ------------------------------------

function loadInput(): ScrapedDeal[] {
  if (!existsSync(INPUT_PATH)) {
    console.error(
      `ERROR: input file not found: ${INPUT_PATH}\n` +
        `Pass --input=<path> to override, or wait for Chrome's scrape to finish.`
    );
    exit(1);
  }
  const raw = readFileSync(INPUT_PATH, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error(`ERROR: input file is not valid JSON: ${(e as Error).message}`);
    exit(1);
  }
  if (!Array.isArray(parsed)) {
    console.error("ERROR: input must be a JSON array.");
    exit(1);
  }
  if (parsed.length === 0) {
    console.error("ERROR: input array is empty.");
    exit(1);
  }
  return parsed as ScrapedDeal[];
}

// ----------------------------- main ------------------------------------------

async function main() {
  const scraped = loadInput();
  console.log(`Loaded ${scraped.length} scraped deals from ${INPUT_PATH}`);

  // -------- Reference data pulls --------

  const anchors = await restGet<Anchor>(
    "anchor_skus?select=brand,brand_normalized"
  );
  const brandMap = new Map<string, string>();
  for (const a of anchors) {
    if (a.brand_normalized) brandMap.set(a.brand_normalized.toLowerCase(), a.brand);
  }
  console.log(`Loaded ${anchors.length} anchor_skus brands for normalization`);

  // master_listings slug sanity set — deals with unknown slugs are REJECTED
  // (the orphan-research path is a human-in-the-loop workflow, not auto-create).
  const listings = await restGet<{ slug: string }>("master_listings?select=slug");
  const validSlugs = new Set(listings.map((l) => l.slug));
  console.log(`Loaded ${validSlugs.size} master_listings slugs for sanity check`);

  // Pull every recent submission + every active deal once. Keeps per-row
  // dedup as a Map lookup instead of a round-trip per deal.
  const sevenDaysAgoIso = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const recentSubs = await restGet<Submission>(
    `deal_submissions?select=id,dispensary_slug,deal_title,sale_price_usd,submitted_at&submitted_at=gte.${sevenDaysAgoIso}`
  );
  console.log(`Loaded ${recentSubs.length} submissions from last 7 days`);

  const activeDeals = await restGet<Deal>(
    "deals?select=id,listing_slug,title,sale_price,is_active,status_reason&is_active=eq.true"
  );
  console.log(`Loaded ${activeDeals.length} active deals for collision check`);

  // Build dedup indexes
  const subKey = (slug: string | null, title: string, price: number | null) =>
    `${slug ?? ""}|${normalizeTitle(title)}|${price ?? ""}`;
  const subIndex = new Map<string, Submission>();
  for (const s of recentSubs) {
    if (!s.deal_title) continue;
    subIndex.set(
      subKey(s.dispensary_slug, s.deal_title, s.sale_price_usd),
      s
    );
  }

  const dealIndex = new Map<string, Deal>();
  for (const d of activeDeals) {
    if (!d.title) continue;
    // Key on slug + normalized title only — sale_price can diverge and
    // still be the same deal (the collision IS the point).
    dealIndex.set(`${d.listing_slug}|${normalizeTitle(d.title)}`, d);
  }

  // -------- Plan each input row --------

  const plans: Plan[] = [];
  const invalidShape: { d: ScrapedDeal; issues: PreflightIssue[] }[] = [];
  const invalidSlug: { d: ScrapedDeal; reason: string }[] = [];
  const warnings: { d: ScrapedDeal; issues: PreflightIssue[] }[] = [];
  const invalid: { d: ScrapedDeal; reason: string }[] = [];

  for (const d of scraped) {
    // 0) Pre-flight shape check (required fields + soft warnings).
    //    Hard errors reject the deal outright; warnings flow through.
    const issues = preflightShape(d);
    const errors = issues.filter((i) => i.severity === "error");
    const warns = issues.filter((i) => i.severity === "warning");
    if (errors.length > 0) {
      invalidShape.push({ d, issues: errors });
      continue;
    }
    if (warns.length > 0) {
      warnings.push({ d, issues: warns });
    }

    // 0b) Dispensary slug must exist in master_listings. Reject otherwise
    //     — do NOT auto-create listings. Orphan research is human-in-the-loop.
    if (d.dispensary_slug && !validSlugs.has(d.dispensary_slug)) {
      invalidSlug.push({
        d,
        reason: `dispensary_slug "${d.dispensary_slug}" not in master_listings`,
      });
      continue;
    }

    const v = validate(d);
    if (!v.ok) {
      invalid.push({ d, reason: v.reason });
      continue;
    }

    const title = d.deal_title!;
    const price = d.sale_price_usd ?? null;

    // 1) Strict submission dedup (7-day window)
    const existingSub = subIndex.get(
      subKey(d.dispensary_slug ?? null, title, price)
    );
    if (existingSub) {
      plans.push({ kind: "skip_dedup_strict", input: d, matched: existingSub });
      continue;
    }

    // 2) Cross-table collision with active deals
    const collisionKey = d.dispensary_slug
      ? `${d.dispensary_slug}|${normalizeTitle(title)}`
      : null;
    const existingDeal = collisionKey ? dealIndex.get(collisionKey) : undefined;
    if (existingDeal) {
      plans.push({ kind: "update_in_place", input: d, existing: existingDeal });
      continue;
    }

    // 3) Fresh submission — check sanity + normalize brand
    const rejected = sanityReject(d);
    const normalizedBrand = d.brand
      ? brandMap.get(d.brand.trim().toLowerCase()) ?? d.brand.trim()
      : null;

    plans.push({
      kind: "insert_submission",
      input: d,
      normalizedBrand,
      dedupStatus: "first_of_kind",
      rejectedAs: rejected ?? undefined,
    });
  }

  // -------- Report --------

  const collisionCount = plans.filter((p) => p.kind === "update_in_place").length;
  const dedupSkipCount = plans.filter((p) => p.kind === "skip_dedup_strict").length;
  const insertCount = plans.filter(
    (p) => p.kind === "insert_submission" && !p.rejectedAs
  ).length;
  const sanityRejectCount = plans.filter(
    (p) => p.kind === "insert_submission" && !!p.rejectedAs
  ).length;
  const validCount = collisionCount + insertCount;

  const byDisp = new Map<string, number>();
  const byBrand = new Map<string, number>();
  const byCategory = new Map<string, number>();
  for (const p of plans) {
    if (p.kind === "insert_submission" || p.kind === "update_in_place") {
      const slug = p.input.dispensary_slug ?? "(freetext)";
      byDisp.set(slug, (byDisp.get(slug) ?? 0) + 1);
      const brand =
        p.kind === "insert_submission"
          ? p.normalizedBrand ?? "(no brand)"
          : p.input.brand ?? "(no brand)";
      byBrand.set(brand, (byBrand.get(brand) ?? 0) + 1);
      const cat = p.input.category ?? "(no category)";
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
    }
  }

  const rejectReasons = new Map<string, number>();
  for (const p of plans) {
    if (p.kind === "insert_submission" && p.rejectedAs) {
      rejectReasons.set(
        p.rejectedAs,
        (rejectReasons.get(p.rejectedAs) ?? 0) + 1
      );
    }
  }

  console.log("\n=== INGEST PRE-FLIGHT REPORT ===");
  console.log(`Input: ${INPUT_PATH}`);
  console.log(`Total deals in scrape: ${scraped.length}`);
  console.log(`Valid deals: ${validCount} (will be ingested)`);

  console.log(`\nInvalid deals (bad slug): ${invalidSlug.length}`);
  for (const row of invalidSlug) {
    console.log(
      `  - ${row.reason} | title="${row.d.deal_title ?? "(none)"}" | source=${row.d.source_url ?? "(none)"}`
    );
  }

  console.log(`\nInvalid deals (shape errors): ${invalidShape.length}`);
  for (const row of invalidShape) {
    const fields = row.issues
      .map((i) => `${i.field}(${i.message})`)
      .join(", ");
    console.log(
      `  - slug=${row.d.dispensary_slug ?? "(none)"} title="${row.d.deal_title ?? "(none)"}" → ${fields}`
    );
  }

  console.log(`\nInvalid deals (semantic): ${invalid.length}`);
  for (const row of invalid) {
    console.log(
      `  - slug=${row.d.dispensary_slug ?? "(none)"} title="${row.d.deal_title ?? "(none)"}" → ${row.reason}`
    );
  }

  const totalWarningIssues = warnings.reduce((n, r) => n + r.issues.length, 0);
  console.log(`\nValidation warnings: ${totalWarningIssues}`);
  for (const row of warnings) {
    for (const w of row.issues) {
      console.log(
        `  - slug=${row.d.dispensary_slug ?? "(none)"} title="${row.d.deal_title ?? "(none)"}" → ${w.field}: ${w.message}`
      );
    }
  }

  console.log(
    `\nDuplicate detection: ${collisionCount} collisions with active deals (UPDATE-in-place)`
  );
  console.log(
    `  ${dedupSkipCount} strict-dedup skips against last-7-days submissions`
  );

  console.log(`\nEstimated Supabase inserts: ${insertCount} fresh submissions`);
  if (sanityRejectCount > 0) {
    console.log(
      `  (+ ${sanityRejectCount} sanity-rejected rows audited into submissions)`
    );
    for (const [k, v] of rejectReasons) console.log(`    - ${k}: ${v}`);
  }
  console.log(
    `Estimated Supabase updates (Apr-14 records): ${collisionCount}`
  );

  console.log("\nBy dispensary:");
  for (const [k, v] of [...byDisp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${k}: ${v}`);
  }
  console.log("\nBy brand (top 20):");
  for (const [k, v] of [...byBrand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${k}: ${v}`);
  }
  console.log("\nBy category:");
  for (const [k, v] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  // Hard-stop in --apply if any shape errors or bad slugs appeared. Matthew
  // has asked for human review before writing junk to Supabase.
  if (APPLY && (invalidShape.length > 0 || invalidSlug.length > 0)) {
    console.error(
      `\nERROR: ${invalidShape.length} shape errors + ${invalidSlug.length} bad slugs. ` +
        `Fix the scrape or remove those rows before re-running --apply.`
    );
    exit(1);
  }

  if (!APPLY) {
    console.log("\n[DRY-RUN] no writes performed. Re-run with --apply to execute.");
    return;
  }

  // -------- APPLY: UPDATE collisions + INSERT submissions --------

  let updated = 0;
  for (const p of plans) {
    if (p.kind !== "update_in_place") continue;
    const d = p.input;
    const existing = p.existing;
    const body: Record<string, unknown> = {
      status_reason: null,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    // COALESCE semantics: only set fields when scraper actually has them.
    if (d.sale_price_usd != null) body.sale_price = d.sale_price_usd;
    if (d.regular_price_usd != null) body.original_price = d.regular_price_usd;
    if (d.source_url) body.source_url = d.source_url;
    if (d.end_date) body.expires_at = d.end_date;
    if (d.deal_description) body.description = d.deal_description;

    // Scraped-says-expired path: flip to inactive instead of refreshing.
    if (d.end_date) {
      const ends = new Date(d.end_date);
      if (!isNaN(ends.getTime()) && ends.getTime() < Date.now()) {
        await restPatch(`deals?id=eq.${existing.id}`, {
          is_active: false,
          status_reason: "expired",
          updated_at: new Date().toISOString(),
        });
        updated += 1;
        continue;
      }
    }

    await restPatch(`deals?id=eq.${existing.id}`, body);
    updated += 1;
  }

  const inserts: Record<string, unknown>[] = [];
  for (const p of plans) {
    if (p.kind !== "insert_submission") continue;
    const d = p.input;
    const row: Record<string, unknown> = {
      dispensary_slug: d.dispensary_slug ?? null,
      dispensary_name_freetext: d.dispensary_name_freetext ?? null,
      dispensary_city_freetext: d.dispensary_city_freetext ?? null,
      submitter_email: "scraper@puffprice.com",
      submitter_role: "auto",
      deal_title: d.deal_title,
      deal_description: d.deal_description ?? null,
      category: d.category ?? null,
      strain_or_product: d.strain_or_product ?? null,
      brand: p.normalizedBrand,
      weight_grams: d.weight_grams ?? null,
      mg_thc: d.mg_thc ?? null,
      count: d.count ?? null,
      regular_price_usd: d.regular_price_usd ?? null,
      sale_price_usd: d.sale_price_usd ?? null,
      start_date: d.start_date ?? null,
      end_date: d.end_date ?? null,
      is_recurring: d.is_recurring ?? false,
      recurring_days: d.recurring_days ?? null,
      source_url: d.source_url ?? null,
      notes: d.notes ?? "Auto-ingested from Chrome scrape batch 2026-04-22",
      verified: true,
      verified_method: "auto-scraper-2026-04-22",
    };
    if (p.rejectedAs) {
      row.approved = false;
      row.rejected_at = new Date().toISOString();
      row.rejected_reason = p.rejectedAs;
    }
    inserts.push(row);
  }

  const BATCH = 20;
  const inserted: { id: string; rejected_at: string | null }[] = [];
  for (let i = 0; i < inserts.length; i += BATCH) {
    const chunk = inserts.slice(i, i + BATCH);
    const res = await restPostBatch<{ id: string; rejected_at: string | null }>(
      "deal_submissions",
      chunk
    );
    inserted.push(...res);
    console.log(
      `  inserted submissions ${i + 1}..${i + chunk.length} of ${inserts.length}`
    );
  }

  let promoted = 0;
  if (AUTO_APPROVE) {
    const promotable = inserted.filter((r) => !r.rejected_at);
    console.log(
      `\nAuto-approve: promoting ${promotable.length} scraper submissions to deals`
    );
    for (const row of promotable) {
      // Read back the full submission, then INSERT into deals, then UPDATE
      // the submission. Two round-trips per row — fine at scraper volumes.
      const full = await restGet<Record<string, unknown>>(
        `deal_submissions?select=*&id=eq.${row.id}`
      );
      if (full.length === 0) continue;
      const s = full[0] as Record<string, unknown>;
      const dealBody = {
        listing_slug: s.dispensary_slug,
        title: s.deal_title,
        description: s.deal_description,
        category: s.category,
        brand: s.brand,
        weight_grams: s.weight_grams,
        mg_thc: s.mg_thc,
        count: s.count,
        original_price: s.regular_price_usd,
        sale_price: s.sale_price_usd,
        price_per_gram: s.price_per_gram_computed,
        expires_at: s.end_date,
        source: "scraper",
        source_url: s.source_url,
        is_active: true,
        verified_at: new Date().toISOString(),
        status_reason: null,
        project_tag: "green",
      };
      const dealRes = await restPostBatch<{ id: string }>("deals", [dealBody]);
      const newDealId = dealRes[0]?.id;
      if (newDealId) {
        await restPatch(`deal_submissions?id=eq.${row.id}`, {
          approved: true,
          approved_at: new Date().toISOString(),
          approved_by: "auto-scraper-2026-04-22",
          promoted_deal_id: newDealId,
        });
        promoted += 1;
      }
    }
  }

  console.log("\n=== APPLY RESULT ===");
  console.log(`Submissions created: ${inserted.length}`);
  console.log(`Apr-14 UPDATE-in-place: ${updated}`);
  console.log(`Deals promoted (auto-approve): ${promoted}`);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  exit(1);
});
