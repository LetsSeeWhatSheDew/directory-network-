// scripts/scrapers/ingest.ts
//
// Normalize a batch of ScrapedDeal[] for one dispensary, upsert to the
// `deals` table, and soft-deactivate stale rows. Soft-delete only fires
// when the scrape itself succeeded — a scrape that errors out leaves
// existing rows alone.
//
// Upsert key: (listing_slug, source_url). One source URL = one deal.

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  IngestResult,
  Platform,
  ScrapedDeal,
} from "./types";
import { inferDiscountPct, inferRecurringDays } from "./regex";

const FULL_TO_ABBR: Record<string, string> = {
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
  saturday: "sat",
  sunday: "sun",
};

function abbreviateDays(days: string[] | null): string[] | null {
  if (!days || days.length === 0) return null;
  const out: string[] = [];
  for (const d of days) {
    const abbr = FULL_TO_ABBR[d.toLowerCase()];
    if (abbr && !out.includes(abbr)) out.push(abbr);
  }
  return out.length === 0 ? null : out;
}

function normalizeTitle(t: string): string {
  return (t ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

export type DealRowToWrite = {
  listing_slug: string;
  project_tag: "green";
  title: string;
  description: string | null;
  source: string;
  source_url: string;
  is_active: true;
  verified_at: string;
  last_independent_verification: string;
  status_reason: string;
  discount_value: number | null;
  discount_unit: "percent" | "dollars" | null;
  original_price: number | null;
  sale_price: number | null;
  recurring_days: string[] | null;
  active_days: string[] | null;
  category: string | null;
};

export function buildDealRow(args: {
  slug: string;
  platform: Platform;
  scraped: ScrapedDeal;
  now: Date;
}): DealRowToWrite {
  const { slug, platform, scraped, now } = args;

  const title = normalizeTitle(scraped.title);
  const description = scraped.description
    ? normalizeTitle(scraped.description).slice(0, 500)
    : null;

  const recurringDays = inferRecurringDays(title, description ?? undefined);
  const inferredPct = inferDiscountPct(title);

  // Prefer explicit scraped values, fall back to title regex for
  // discount_value when the scraper didn't populate one.
  let discountValue: number | null =
    scraped.discount_value ?? null;
  let discountUnit: "percent" | "dollars" | null = null;
  if (scraped.discount_unit === "percent") discountUnit = "percent";
  else if (scraped.discount_unit === "dollar") discountUnit = "dollars";

  if (discountValue == null && inferredPct != null) {
    discountValue = inferredPct;
    discountUnit = "percent";
  }

  const isoNow = now.toISOString();

  return {
    listing_slug: slug,
    project_tag: "green",
    title,
    description,
    source: `scraper:${platform}`,
    source_url: scraped.source_url,
    is_active: true,
    verified_at: isoNow,
    last_independent_verification: isoNow,
    status_reason: "scraped_direct_source",
    discount_value: discountValue,
    discount_unit: discountUnit,
    original_price: scraped.original_price ?? null,
    sale_price: scraped.sale_price ?? null,
    recurring_days: recurringDays,
    active_days: abbreviateDays(recurringDays),
    category: scraped.category ?? null,
  };
}

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "ingest: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function ingestDeals(
  slug: string,
  platform: Platform,
  scraped: ScrapedDeal[],
  runStartedAt: Date,
  opts: { dryRun?: boolean; client?: SupabaseClient } = {}
): Promise<IngestResult> {
  const result: IngestResult = { added: 0, updated: 0, deactivated: 0 };
  if (opts.dryRun) {
    // Dry-run still produces a counts shape so callers can log it.
    result.added = scraped.length;
    return result;
  }

  const client = opts.client ?? getClient();
  const now = new Date();

  // Pull existing scraper-sourced active deals for this dispensary so we
  // can decide insert-vs-update by source_url and figure out which rows
  // to deactivate at the end.
  const { data: existingRows, error: fetchErr } = await client
    .from("deals")
    .select("id, source_url, is_active, source")
    .eq("listing_slug", slug)
    .eq("project_tag", "green")
    .like("source", "scraper:%")
    .eq("is_active", true);

  if (fetchErr) {
    throw new Error(`ingest: fetch existing failed: ${fetchErr.message}`);
  }

  const existingBySourceUrl = new Map<string, string>();
  for (const row of existingRows ?? []) {
    if (row.source_url) existingBySourceUrl.set(row.source_url, row.id);
  }

  const seenSourceUrls = new Set<string>();

  for (const s of scraped) {
    const row = buildDealRow({ slug, platform, scraped: s, now });
    if (seenSourceUrls.has(row.source_url)) continue;
    seenSourceUrls.add(row.source_url);

    const existingId = existingBySourceUrl.get(row.source_url);
    if (existingId) {
      const { error: updErr } = await client
        .from("deals")
        .update({
          title: row.title,
          description: row.description,
          discount_value: row.discount_value,
          discount_unit: row.discount_unit,
          original_price: row.original_price,
          sale_price: row.sale_price,
          recurring_days: row.recurring_days,
          active_days: row.active_days,
          category: row.category,
          source: row.source,
          status_reason: row.status_reason,
          verified_at: row.verified_at,
          last_independent_verification: row.last_independent_verification,
          is_active: true,
          updated_at: row.verified_at,
        })
        .eq("id", existingId);
      if (updErr) {
        throw new Error(`ingest: update ${existingId} failed: ${updErr.message}`);
      }
      result.updated += 1;
    } else {
      const { error: insErr } = await client.from("deals").insert(row);
      if (insErr) {
        throw new Error(`ingest: insert failed: ${insErr.message}`);
      }
      result.added += 1;
    }
  }

  // Soft-delete: any active scraper:* row for this slug whose
  // verified_at is older than this run's start_time was not refreshed
  // and is now considered stale.
  const { data: deactivated, error: deactErr } = await client
    .from("deals")
    .update({
      is_active: false,
      status_reason: "not_seen_last_scrape",
      updated_at: now.toISOString(),
    })
    .eq("listing_slug", slug)
    .eq("project_tag", "green")
    .like("source", "scraper:%")
    .eq("is_active", true)
    .lt("verified_at", runStartedAt.toISOString())
    .select("id");

  if (deactErr) {
    throw new Error(`ingest: deactivate failed: ${deactErr.message}`);
  }
  result.deactivated = (deactivated ?? []).length;

  return result;
}
