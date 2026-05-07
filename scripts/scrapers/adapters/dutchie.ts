// scripts/scrapers/adapters/dutchie.ts
//
// Dutchie strategy:
//   1. Fetch the embedded-menu page HTML.
//   2. Parse the __NEXT_DATA__ blob for a `specials` array (every Dutchie
//      embed surfaces specials there server-side).
//   3. Fall back to a cheerio HTML scrape against well-known selectors.
//
// Documented selectors come from inspecting the Cookies Peoria Heights
// embedded menu (https://dutchie.com/embedded-menu/cookies-peoria-heights/specials)
// in November 2026. If Dutchie redesigns, the selector pass will silently
// return zero deals; the orchestrator records that as status="success"
// with deals_added=0, which still surfaces on /admin/scrapers.

import { load as cheerioLoad } from "cheerio";
import { fetchHtml } from "../http";
import { ScrapedDeal } from "../types";

type NextSpecial = {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  shortDescription?: string;
  discountType?: string;
  percentDiscount?: number;
  dollarDiscount?: number;
  // Other shapes are ignored.
};

function nodeIsString(v: unknown): v is string {
  return typeof v === "string";
}

function findSpecialsInJson(node: unknown): NextSpecial[] {
  // Walk the __NEXT_DATA__ tree. Dutchie's payload mounts specials under
  // pageProps in different shapes depending on dispensary; rather than
  // hard-code paths we recursively look for arrays whose elements have
  // a `discountType` or `percentDiscount` field.
  const out: NextSpecial[] = [];
  const stack: unknown[] = [node];
  const seen = new WeakSet<object>();
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (seen.has(cur as object)) continue;
    seen.add(cur as object);
    if (Array.isArray(cur)) {
      const looksLikeSpecials =
        cur.length > 0 &&
        cur.every(
          (e) =>
            e &&
            typeof e === "object" &&
            ("discountType" in e ||
              "percentDiscount" in e ||
              "dollarDiscount" in e)
        );
      if (looksLikeSpecials) {
        out.push(...(cur as NextSpecial[]));
      }
      for (const e of cur) stack.push(e);
    } else {
      for (const v of Object.values(cur as Record<string, unknown>)) {
        stack.push(v);
      }
    }
  }
  return out;
}

function specialToDeal(
  s: NextSpecial,
  sourceUrl: string
): ScrapedDeal | null {
  const title = (s.name ?? s.title ?? "").trim();
  if (!title) return null;
  const description = (s.shortDescription ?? s.description ?? "").trim() || undefined;

  let discount_value: number | undefined;
  let discount_unit: ScrapedDeal["discount_unit"] = "other";

  if (typeof s.percentDiscount === "number" && s.percentDiscount > 0) {
    discount_value = s.percentDiscount;
    discount_unit = "percent";
  } else if (typeof s.dollarDiscount === "number" && s.dollarDiscount > 0) {
    discount_value = s.dollarDiscount;
    discount_unit = "dollar";
  } else if (s.discountType && /bogo/i.test(s.discountType)) {
    discount_unit = "bogo";
  }

  return {
    title,
    description,
    source_url: sourceUrl,
    discount_value,
    discount_unit,
  };
}

function parseNextDataDeals(html: string, sourceUrl: string): ScrapedDeal[] {
  const m = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!m) return [];
  let blob: unknown;
  try {
    blob = JSON.parse(m[1]);
  } catch {
    return [];
  }
  const specials = findSpecialsInJson(blob);
  const out: ScrapedDeal[] = [];
  for (const s of specials) {
    const deal = specialToDeal(s, sourceUrl);
    if (deal) out.push(deal);
  }
  return out;
}

function parseHtmlDeals(html: string, sourceUrl: string): ScrapedDeal[] {
  const $ = cheerioLoad(html);
  const out: ScrapedDeal[] = [];
  // Documented Dutchie embedded-menu specials selectors.
  const cards = $('[data-testid="special-card"], [class*="SpecialCard"]');
  cards.each((_i, el) => {
    const root = $(el);
    const title = root
      .find('[data-testid="special-name"], [class*="title"], h2, h3')
      .first()
      .text()
      .trim();
    if (!title) return;
    const description = root
      .find('[data-testid="special-description"], [class*="description"], p')
      .first()
      .text()
      .trim();
    if (!nodeIsString(title) || title.length < 2) return;
    out.push({
      title,
      description: description || undefined,
      source_url: sourceUrl,
      discount_unit: "other",
    });
  });
  return out;
}

export async function scrape(menuUrl: string): Promise<ScrapedDeal[]> {
  const html = await fetchHtml(menuUrl);
  const fromJson = parseNextDataDeals(html, menuUrl);
  if (fromJson.length > 0) return fromJson;
  return parseHtmlDeals(html, menuUrl);
}
