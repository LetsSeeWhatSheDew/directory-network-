// scripts/scrapers/adapters/leafly.ts
//
// Leafly dispensary "Deals" tab — HTML scrape with cheerio.
// Selectors documented from inspection in November 2026:
//   - Deal card root: a[data-testid="deal-card"], li article (deals list)
//   - Title:          [data-testid="deal-title"], h3
//   - Description:    [data-testid="deal-subtitle"], p
//
// Leafly returns an HTML page even for unauthenticated requests. If
// they switch to client-rendered shells we'll get zero deals and the
// orchestrator records status="success" with deals_added=0. That's a
// readable signal on /admin/scrapers.

import { load as cheerioLoad } from "cheerio";
import { fetchHtml } from "../http";
import { ScrapedDeal } from "../types";

export async function scrape(menuUrl: string): Promise<ScrapedDeal[]> {
  const html = await fetchHtml(menuUrl);
  const $ = cheerioLoad(html);
  const out: ScrapedDeal[] = [];
  const seen = new Set<string>();

  const cards = $(
    '[data-testid="deal-card"], a[href*="/deals/"], article[class*="Deal"]'
  );

  cards.each((_i, el) => {
    const root = $(el);
    const title = root
      .find('[data-testid="deal-title"], h3, [class*="title"]')
      .first()
      .text()
      .trim();
    if (!title || title.length < 3) return;
    if (seen.has(title)) return;
    seen.add(title);

    const description = root
      .find('[data-testid="deal-subtitle"], p, [class*="subtitle"]')
      .first()
      .text()
      .trim();

    out.push({
      title,
      description: description || undefined,
      source_url: menuUrl,
      discount_unit: "other",
    });
  });

  return out;
}
