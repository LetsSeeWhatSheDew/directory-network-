// scripts/scrapers/adapters/iheartjane.ts
//
// iHeartJane is heavily client-rendered: most store-deal data ships
// only as a React-bootstrap blob. We try to parse `window.__INITIAL_STATE__`
// from the page HTML; if that's missing, we throw "platform_unsupported"
// so the orchestrator records status="failed" with a clear message.
//
// TODO: explore Jane's `/api/v1/dispensaries/<id>/specials` once it
// becomes accessible without a session token. For now, JSON-blob parse
// with explicit failure if absent.

import { fetchHtml } from "../http";
import { ScrapedDeal } from "../types";

type JaneSpecial = {
  id?: string | number;
  title?: string;
  name?: string;
  description?: string;
  discount_type?: string;
  percent_discount?: number;
  dollar_discount?: number;
};

function findArrayInJson(node: unknown, key: string): unknown[] | null {
  const stack: unknown[] = [node];
  const seen = new WeakSet<object>();
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (seen.has(cur as object)) continue;
    seen.add(cur as object);
    if (Array.isArray(cur)) {
      for (const e of cur) stack.push(e);
      continue;
    }
    const obj = cur as Record<string, unknown>;
    if (key in obj && Array.isArray(obj[key])) {
      return obj[key] as unknown[];
    }
    for (const v of Object.values(obj)) stack.push(v);
  }
  return null;
}

export async function scrape(menuUrl: string): Promise<ScrapedDeal[]> {
  const html = await fetchHtml(menuUrl);
  const m = html.match(
    /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});\s*<\/script>/
  );
  if (!m) {
    throw new Error("platform_unsupported: iheartjane __INITIAL_STATE__ not found");
  }
  let blob: unknown;
  try {
    blob = JSON.parse(m[1]);
  } catch (e) {
    throw new Error(`platform_unsupported: iheartjane parse failed: ${(e as Error).message}`);
  }
  const specials =
    findArrayInJson(blob, "specials") ??
    findArrayInJson(blob, "deals") ??
    [];
  const out: ScrapedDeal[] = [];
  for (const raw of specials) {
    const s = raw as JaneSpecial;
    const title = (s.title ?? s.name ?? "").trim();
    if (!title) continue;
    let discount_value: number | undefined;
    let discount_unit: ScrapedDeal["discount_unit"] = "other";
    if (typeof s.percent_discount === "number" && s.percent_discount > 0) {
      discount_value = s.percent_discount;
      discount_unit = "percent";
    } else if (typeof s.dollar_discount === "number" && s.dollar_discount > 0) {
      discount_value = s.dollar_discount;
      discount_unit = "dollar";
    } else if (s.discount_type && /bogo/i.test(s.discount_type)) {
      discount_unit = "bogo";
    }
    out.push({
      title,
      description: s.description?.trim() || undefined,
      source_url: menuUrl,
      discount_value,
      discount_unit,
    });
  }
  return out;
}
