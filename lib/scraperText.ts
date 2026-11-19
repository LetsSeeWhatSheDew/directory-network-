// lib/scraperText.ts: pure helpers for the check log (no network, no keys),
// split out of lib/scraperRuns.ts (server-only) so they can be unit tested.
import type { ScraperRun, StoreResult } from "./scraperRuns";

/** Map raw scraper error text to a plain public phrase. Never returns the raw text. */
export function publicPhrase(raw: string | null | undefined): string {
  const t = String(raw || "").toLowerCase();
  if (!t) return "couldn't read the menu";
  if (/timed? ?out|timeout|etimedout|deadline|took too long/.test(t)) return "timed out";
  if (/cloudflare|captcha|challenge|forbidden|\b403\b|\b429\b|blocked|bot|access denied|perimeterx|akamai|incapsula/.test(t))
    return "blocked by the store's security check";
  if (/age ?gate|verify your age|21\+/.test(t)) return "stuck at the age check";
  if (/abandon|never finished|killed|crash/.test(t)) return "check stopped before finishing";
  if (/enotfound|econnrefused|econnreset|dns|net::|fetch failed|socket|\b5\d\d\b|\b404\b|not found|navigation|ssl|certificate|unreachable/.test(t))
    return "site didn't load";
  if (/parse|selector|no deals|empty|menu/.test(t)) return "couldn't read the menu";
  return "couldn't read the menu";
}

const OK_STORE = new Set(["success", "ok", "no_deals", "unchanged"]);
export function storeOk(r: StoreResult): boolean {
  return OK_STORE.has(String(r.status || "").toLowerCase()) && !r.error_message;
}

/**
 * Why a store shows no deals today, in shopper words, from the newest check
 * that reached it (any checker). A store with no entry: no check in the log reached it.
 * "Read fine, nothing posted" is a real answer: the store's own site had no
 * store-wide deal when we looked.
 */
export function noDealsReasonBySlug(runs: ScraperRun[]): Map<string, { reason: string; at: string }> {
  const newest = new Map<string, { r: StoreResult; at: string }>();
  for (const run of runs) {
    if (run.status === "running") continue;
    const at = run.finished_at || run.started_at;
    for (const r of run.dispensary_results || []) {
      if (!r?.slug) continue;
      const cur = newest.get(r.slug);
      // A clean read beats a failed one from the other checker in the same
      // window: if either checker could read the site, the site isn't blocked.
      const better = !cur || +new Date(at) > +new Date(cur.at) + 12 * 3600_000 || (storeOk(r) && !storeOk(cur.r) && +new Date(at) > +new Date(cur.at) - 12 * 3600_000);
      if (better) newest.set(r.slug, { r, at });
    }
  }
  const out = new Map<string, { reason: string; at: string }>();
  for (const [slug, { r, at }] of newest) {
    out.set(slug, { reason: storeOk(r) ? "read fine, nothing posted" : publicPhrase(r.error_message || r.status), at });
  }
  return out;
}
