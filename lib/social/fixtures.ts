// lib/social/fixtures.ts — made-up inputs for rendering the templates in
// tests and for the committed screenshots (docs/screenshots/social/).
// Store names are fictional on purpose so a sample image can never be
// mistaken for a real store's real deal. Fixture renders carry a
// "Sample data" stamp and are only served when SOCIAL_FIXTURES=1.

import type { CheapestBoard, CheapestItem } from "../menuPrices";
import type { RegionStore, FeatureRow } from "../waysToBuy";
import type { DayCity, IndexDay } from "../dealIndex";
import type { SocialDeal } from "./build";

export const FIXTURE_NOW = Date.parse("2026-09-27T14:05:00Z"); // Sun Sep 27, 9:05 AM CT

const hoursAgo = (h: number) => new Date(FIXTURE_NOW - h * 3600_000).toISOString();

const deal = (id: string, name: string, city: string, title: string, value: number, unit: "percent" | "dollars", h = 3, extra: Partial<SocialDeal> = {}): SocialDeal => ({
  deal_id: id,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  listing_slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  city,
  deal_title: title,
  discount_value: value,
  discount_unit: unit,
  discount_type: unit === "percent" ? "percent" : "amount",
  category: "flower",
  verified_at: hoursAgo(h),
  expires_at: null,
  ...extra,
});

export const FIXTURE_DEALS: SocialDeal[] = [
  deal("f1", "Riverfront Dispensary", "Peoria", "35% off all house flower", 35, "percent", 2),
  deal("f2", "Knoxville Ave Cannabis", "Peoria", "25% off vape cartridges", 25, "percent", 4),
  deal("f3", "Heights Corner Cannabis", "Peoria Heights", "20% off edibles", 20, "percent", 5),
  deal("f4", "Prospect Road Dispensary", "Peoria", "$10 off any concentrate", 10, "dollars", 6),
  deal("f5", "Riverfront Dispensary", "Peoria", "15% off pre-rolls", 15, "percent", 2),
  deal("f6", "Veterans Drive Cannabis", "Pekin", "30% off for first-time customers", 30, "percent", 3),
  deal("f7", "Main & Market Dispensary", "Bloomington", "40% off when you buy 3 or more", 40, "percent", 3),
  deal("f8", "College Ave Cannabis", "Normal", "20% off vapes", 20, "percent", 7),
  deal("f9", "Green Street Dispensary", "Champaign", "15% off all edibles", 15, "percent", 8),
  deal("f10", "Capitol Cannabis", "Springfield", "10% off everything", 10, "percent", 30),
  deal("f11", "Old deal Dispensary", "Peoria", "50% off flower", 50, "percent", 24 * 9), // stale: never headlines
];

const day = (d: string, deals: number, stores: number, avgPct: number | null): IndexDay => ({ day: d, deals, stores, avgPct });
export const FIXTURE_INDEX: { days: IndexDay[]; latest: DayCity[]; latestDay: string } = {
  days: [
    day("2026-09-20", 24, 11, 21),
    day("2026-09-21", 26, 12, 22),
    day("2026-09-22", 25, 12, 21),
    day("2026-09-23", 27, 13, 22),
    day("2026-09-24", 28, 13, 23),
    day("2026-09-25", 39, 18, 22),
    day("2026-09-26", 41, 19, 23),
  ],
  latestDay: "2026-09-26",
  latest: [
    { observed_day: "2026-09-26", city: "Peoria", deals_live: 12, stores_with_deals: 5, avg_discount_pct: 24 },
    { observed_day: "2026-09-26", city: "East Peoria", deals_live: 8, stores_with_deals: 3, avg_discount_pct: 21 },
    { observed_day: "2026-09-26", city: "Bloomington", deals_live: 6, stores_with_deals: 2, avg_discount_pct: 25 },
    { observed_day: "2026-09-26", city: "Springfield", deals_live: 5, stores_with_deals: 4, avg_discount_pct: 18 },
    { observed_day: "2026-09-26", city: "Normal", deals_live: 4, stores_with_deals: 2, avg_discount_pct: 20 },
    { observed_day: "2026-09-26", city: "Champaign", deals_live: 3, stores_with_deals: 1, avg_discount_pct: null },
    { observed_day: "2026-09-26", city: "Peoria Heights", deals_live: 3, stores_with_deals: 2, avg_discount_pct: 22 },
  ],
};

const eighth = (slug: string, store: string, city: string, pretax: number, otd: number, h: number, onSale = false): CheapestItem => ({
  ref: "eighth",
  listingSlug: slug,
  storeName: store,
  city,
  citySlug: city.toLowerCase().replace(/\s+/g, "-"),
  brand: "House",
  product: "House Flower 3.5g",
  weight: "3.5g",
  regular: onSale ? pretax + 5 : pretax,
  pretax,
  otd,
  onSale,
  checkedAt: hoursAgo(h),
  sourceUrl: "https://example.com/menu",
});

export const FIXTURE_BOARD: CheapestBoard = {
  byRef: {
    eighth: [
      eighth("riverfront", "Riverfront Dispensary", "Peoria", 25, 33.88, 3, true),
      eighth("knoxville", "Knoxville Ave Cannabis", "Peoria", 30, 40.65, 3),
      eighth("heights", "Heights Corner Cannabis", "Peoria Heights", 28, 37.66, 4),
      eighth("main-market", "Main & Market Dispensary", "Bloomington", 32, 43.07, 5),
      eighth("green-street", "Green Street Dispensary", "Champaign", 35, 47.43, 6),
      eighth("capitol", "Capitol Cannabis", "Springfield", 27, 36.34, 9),
    ],
    cart_1g: [],
    gummies_100mg: [],
  },
  stores: 6,
  newest: hoursAgo(3),
  oldest: hoursAgo(9),
};

const store = (slug: string, name: string, city: string): RegionStore => ({ id: slug, slug, name, city, address1: null, phone: null, website: null, logo_url: null });
export const FIXTURE_STORES: RegionStore[] = [
  "Peoria", "Peoria", "Peoria", "Peoria", "Peoria", "East Peoria", "East Peoria", "East Peoria", "Peoria Heights", "Pekin",
  "Bloomington", "Bloomington", "Normal", "Normal", "Normal", "Normal", "Champaign", "Champaign", "Champaign", "Urbana",
  "Springfield", "Springfield", "Springfield", "Springfield", "Springfield", "Springfield",
].map((c, i) => store(`store-${i + 1}`, `Sample Store ${i + 1}`, c));

export const FIXTURE_FEATURES: FeatureRow[] = [
  { listing_slug: "store-10", feature: "drive_thru", status: "announced", evidence: "Sample", source_url: "https://example.com", verified_at: hoursAgo(48) },
];
