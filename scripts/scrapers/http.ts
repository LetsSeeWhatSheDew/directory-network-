// scripts/scrapers/http.ts
//
// Shared HTTP helpers for adapters. Single User-Agent, single timeout,
// single rate-limit pause between calls. Keeps the per-adapter code
// focused on parsing.

const USER_AGENT = "PuffPriceBot/1.0 (+https://puffprice.com/bot)";
const TIMEOUT_MS = 30_000;
const REQUEST_GAP_MS = 2_000;

const lastFetchByHost = new Map<string, number>();

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "_unknown";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

async function rateLimit(host: string): Promise<void> {
  const last = lastFetchByHost.get(host) ?? 0;
  const since = Date.now() - last;
  if (since < REQUEST_GAP_MS) {
    await sleep(REQUEST_GAP_MS - since);
  }
  lastFetchByHost.set(host, Date.now());
}

export async function fetchHtml(url: string): Promise<string> {
  const host = hostOf(url);
  await rateLimit(host);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (res.status === 403 || res.status === 503) {
      // Cloudflare / WAF challenge surface — record explicitly so the
      // operator panel can show "blocked, needs another approach".
      throw new Error(`platform_blocked: ${res.status} ${res.statusText}`);
    }
    if (!res.ok) {
      throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
    }
    return await res.text();
  } catch (err) {
    if ((err as Error & { name?: string }).name === "AbortError") {
      throw new Error(`fetch timeout after ${TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
