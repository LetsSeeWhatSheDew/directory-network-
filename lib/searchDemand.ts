// lib/searchDemand.ts — how often Google showed PuffPrice's city pages.
// Copied by hand from Google Search Console (property sc-domain:puffprice.com,
// Performance → Pages, web search) on 2026-11-10. Not fetched live: Search
// Console has no public key we can ship. Refresh by hand, keep the window and
// date honest, and never fill in a city that wasn't in the report.

export const SEARCH_WINDOW = { from: "Oct 12, 2026", to: "Nov 8, 2026", pulled: "Nov 10, 2026" };

/** Impressions for /city/<slug> in SEARCH_WINDOW. Missing = not in the top pages we copied. */
export const CITY_IMPRESSIONS: Record<string, number> = {
  champaign: 586,
  "east-peoria": 495,
  peoria: 453,
  springfield: 343,
  pekin: 249,
  urbana: 208,
  normal: 126,
  bloomington: 49,
};

/** Whole-site totals for the same window and the 4 weeks before it. */
export const SITE_SEARCH = {
  now: { impressions: 3370, clicks: 9, pagesShown: 69 },
  before: { from: "Sep 14, 2026", to: "Oct 11, 2026", impressions: 1480, clicks: 4, pagesShown: 25 },
};

/** Top searches PuffPrice appeared for (Aug 9 – Nov 8, 2026), with impressions. */
export const TOP_SEARCHES: Array<[string, number]> = [
  ["dispensary deals near me", 193],
  ["dispensary deals", 128],
  ["weedmaps deals near me", 118],
  ["weed deals springfield", 110],
  ["weed deals", 102],
  ["vape cart deals near me", 95],
  ["weed deals near me", 86],
  ["edibles deals near me", 81],
  ["cannabis deals near me", 81],
  ["weed deals peoria", 72],
];
