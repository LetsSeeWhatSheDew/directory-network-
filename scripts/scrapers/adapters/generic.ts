// scripts/scrapers/adapters/generic.ts
//
// Last-resort adapter for dispensary sites that don't run on a known POS.
// Reads the per-dispensary CSS selector pack from dispensaries.json:
//
//   {
//     "platform": "generic",
//     "deals_url": "https://example.com/deals",
//     "selectors": {
//       "deal_card": ".deal-item",
//       "title": ".deal-title",
//       "description": ".deal-desc",
//       "original_price": ".price-original",
//       "sale_price": ".price-sale"
//     }
//   }
//
// If selectors is null the orchestrator skips the dispensary with
// status="skipped" — that's the documented "ship empty, fill in later"
// path so a generic site that hasn't had its selectors written yet
// doesn't fail the whole run.

import { load as cheerioLoad } from "cheerio";
import { fetchHtml } from "../http";
import { GenericSelectors, ScrapedDeal } from "../types";

function parsePrice(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const m = s.match(/(\d+(?:\.\d{1,2})?)/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

export async function scrape(
  menuUrl: string,
  selectors: GenericSelectors
): Promise<ScrapedDeal[]> {
  const html = await fetchHtml(menuUrl);
  const $ = cheerioLoad(html);
  const out: ScrapedDeal[] = [];
  $(selectors.deal_card).each((_i, el) => {
    const root = $(el);
    const title = root.find(selectors.title).first().text().trim();
    if (!title || title.length < 2) return;
    const description = selectors.description
      ? root.find(selectors.description).first().text().trim() || undefined
      : undefined;
    const original_price = selectors.original_price
      ? parsePrice(root.find(selectors.original_price).first().text())
      : undefined;
    const sale_price = selectors.sale_price
      ? parsePrice(root.find(selectors.sale_price).first().text())
      : undefined;
    out.push({
      title,
      description,
      original_price,
      sale_price,
      source_url: menuUrl,
      discount_unit: "other",
    });
  });
  return out;
}
