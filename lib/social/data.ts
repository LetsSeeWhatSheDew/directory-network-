// lib/social/data.ts — reads live data for the social templates (server only).
// Same sources as the public pages: the deals view the home page reads,
// lib/dealIndex (/deal-index), lib/menuPrices (/cheapest) and lib/waysToBuy
// (/drive-thru). With SOCIAL_FIXTURES=1 (local renders and tests only; ignored
// on a production deploy) it returns the made-up fixtures, and every image is
// stamped "Sample data". It changes the data only, never who can see /social.

import { getDealIndex } from "../dealIndex";
import { getCheapestBoard } from "../menuPrices";
import { getRegionStores, getFeatureRows } from "../waysToBuy";
import { buildCheapest, buildCity, buildDriveThru, buildIndex, buildSaving, cityBySlug, type SocialDeal } from "./build";
import { lawFactFor } from "./laws";
import { dayAsOfLabel } from "./time";
import { FIXTURE_BOARD, FIXTURE_DEALS, FIXTURE_FEATURES, FIXTURE_INDEX, FIXTURE_NOW, FIXTURE_STORES } from "./fixtures";
import type { CheapestData, CityData, DriveThruData, IndexData, LawData, SavingData, SocialData, SocialTemplate } from "./types";

/** Fixture data swap for local renders and tests. Never on a production
 *  deploy, and it never touches access to /social (lib/social/access.ts). */
export const fixturesOn = () => process.env.SOCIAL_FIXTURES === "1" && process.env.VERCEL_ENV !== "production";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
// Public anon key (the same fallback app/og/shared.tsx and lib/menuPrices use).
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

/** Live deal rows, or null when the data can't be read (never a fake zero). */
async function readDeals(): Promise<SocialDeal[] | null> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id,deal_title,category,city,name,slug,listing_slug,discount_value,discount_unit,discount_type,verified_at,expires_at&order=discount_value.desc.nullslast&limit=1000`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, next: { revalidate: 900, tags: ["deals"] } }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

const mark = <T extends object>(x: T): T => (fixturesOn() ? { ...x, sample: true } : x);

export async function getSaving(): Promise<SavingData> {
  if (fixturesOn()) return mark(buildSaving(FIXTURE_DEALS, FIXTURE_NOW));
  return buildSaving(await readDeals());
}

export async function getCity(slug?: string | null): Promise<CityData> {
  const city = cityBySlug(slug);
  if (fixturesOn()) return mark(buildCity(FIXTURE_DEALS, city, FIXTURE_NOW));
  return buildCity(await readDeals(), city);
}

export async function getIndex(): Promise<IndexData> {
  if (fixturesOn()) return mark(buildIndex(FIXTURE_INDEX));
  return buildIndex(await getDealIndex());
}

export async function getCheapest(): Promise<CheapestData> {
  if (fixturesOn()) return mark(buildCheapest(FIXTURE_BOARD));
  return buildCheapest(await getCheapestBoard());
}

export async function getLaw(id?: string | null): Promise<LawData> {
  const fact = lawFactFor(id, fixturesOn() ? new Date(FIXTURE_NOW) : new Date());
  return mark({ status: "ok" as const, postable: true, asOf: dayAsOfLabel(fact.checked), fact });
}

export async function getDriveThru(): Promise<DriveThruData> {
  if (fixturesOn()) return mark(buildDriveThru(FIXTURE_STORES, FIXTURE_FEATURES));
  const [stores, rows] = await Promise.all([getRegionStores(), getFeatureRows()]);
  return buildDriveThru(stores, rows);
}

export type SocialOpts = { city?: string | null; fact?: string | null };

export async function getTemplateData<T extends SocialTemplate>(t: T, o: SocialOpts = {}): Promise<SocialData[T]> {
  const get: { [K in SocialTemplate]: () => Promise<SocialData[K]> } = {
    saving: getSaving,
    city: () => getCity(o.city),
    index: getIndex,
    cheapest: getCheapest,
    law: () => getLaw(o.fact),
    "drive-thru": getDriveThru,
  };
  return get[t]();
}

export async function getAllSocialData(o: SocialOpts = {}): Promise<SocialData> {
  const [saving, city, index, cheapest, law, driveThru] = await Promise.all([
    getSaving(), getCity(o.city), getIndex(), getCheapest(), getLaw(o.fact), getDriveThru(),
  ]);
  return { saving, city, index, cheapest, law, "drive-thru": driveThru };
}
