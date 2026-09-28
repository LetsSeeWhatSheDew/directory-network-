// lib/trackEvent.ts (server-only) — turns one POST /api/track beacon into the
// rows we store. Pure functions, so the privacy promise is unit-tested
// (tests/unit/privacy.test.ts):
//
//   * No IP address, user-agent string, cookie, email or account id is ever
//     part of a stored row. The only per-browser value is `vid`, a random id
//     the browser generates and keeps in localStorage.
//   * A request carrying Do Not Track (DNT: 1) or Global Privacy Control
//     (Sec-GPC: 1) is not counted at all — the browser helper (lib/track.ts)
//     already skips sending, and the server refuses too, so a stale or
//     third-party client can't bypass the choice.
//
// If you add a field here, it must be something the privacy policy
// (/privacy, "Cookies and analytics") already lists.
import { TRACK_TYPES, type TrackType } from "./track";

const TYPES = new Set<string>(TRACK_TYPES);
export const TAP_TYPES = new Set<TrackType>(["deal_tap", "directions_tap", "call_tap", "website_tap", "order_tap"]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VID_RE = /^[a-z0-9-]{8,40}$/i;
const CITY_RE = /^[A-Za-z][A-Za-z .'-]{0,39}$/;
const TOKEN_RE = /^[A-Za-z0-9._-]{1,60}$/;
const HOST_RE = /^[a-z0-9.-]{1,120}$/;

export const MAX_TRACK_BYTES = 2048;

/** Every key a stored `events.metadata` object may have. Nothing else. */
export const EVENT_METADATA_KEYS = ["deal_id", "city", "ref_host", "utm_source", "utm_campaign", "device", "vid", "from", "q"] as const;
/** Every column we write to `events` / `deal_clicks`. */
export const EVENT_COLUMNS = ["event_type", "listing_id", "project_tag", "metadata"] as const;
export const CLICK_COLUMNS = ["deal_id", "user_agent", "referrer", "city", "source"] as const;

const BOT_RE =
  /bot|crawl|spider|slurp|scrap|fetch|preview|monitor|uptime|pingdom|headless|lighthouse|pagespeed|gtmetrix|chrome-lighthouse|facebookexternalhit|embedly|quora link|whatsapp|curl|wget|python|httpx|aiohttp|axios|node-fetch|undici|go-http|java\/|okhttp|libwww|httpclient|postman|insomnia|phantom|selenium|puppeteer|playwright|vercel|datadog|newrelic|statuscake|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic|perplexity|ccbot|amazonbot|applebot|bingpreview|yandex|baidu|duckduckbot/i;

/** DNT: 1 or Sec-GPC: 1 → this visitor asked not to be counted. */
export function requestOptsOut(headers: Headers): boolean {
  const dnt = (headers.get("dnt") || "").trim();
  const gpc = (headers.get("sec-gpc") || "").trim();
  return dnt === "1" || gpc === "1";
}

export function isLikelyBot(headers: Headers): boolean {
  const ua = headers.get("user-agent") || "";
  if (!ua || ua.length < 20 || BOT_RE.test(ua)) return true;
  // Real browsers send Fetch Metadata on beacons/fetches from our pages.
  const site = headers.get("sec-fetch-site");
  if (!site || (site !== "same-origin" && site !== "same-site")) return true;
  const purpose = headers.get("purpose") || headers.get("sec-purpose") || headers.get("x-purpose") || "";
  if (/prefetch|preview|prerender/i.test(purpose)) return true;
  const origin = headers.get("origin");
  const host = headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return true;
    } catch {
      return true;
    }
  }
  return false;
}

function str(v: unknown, re: RegExp): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && re.test(t) ? t : null;
}

function cleanHost(v: unknown): string | null {
  if (typeof v !== "string" || !v) return null;
  let h = v.trim().toLowerCase();
  try {
    if (h.includes("/")) h = new URL(h.includes("://") ? h : `https://${h}`).hostname;
  } catch {
    return null;
  }
  h = h.replace(/^www\./, "");
  if (!HOST_RE.test(h)) return null;
  if (h === "puffprice.com" || h.endsWith(".puffprice.com") || h.endsWith(".vercel.app") || h === "localhost") return null;
  return h;
}

/** Coarse device class from client hints / UA. Only the class is kept. */
export function deviceOf(headers: Headers): "mobile" | "desktop" {
  const hint = headers.get("sec-ch-ua-mobile");
  if (hint === "?1") return "mobile";
  if (hint === "?0") return "desktop";
  const ua = headers.get("user-agent") || "";
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? "mobile" : "desktop";
}

export type EventRow = {
  event_type: TrackType;
  listing_id: string | null;
  project_tag: "green";
  metadata: Record<string, string | null>;
};
export type ClickRow = {
  deal_id: string;
  user_agent: "mobile" | "desktop"; // coarse device class only, never the UA string
  referrer: string | null;
  city: string | null;
  source: string;
};

/**
 * Validate a raw beacon body. Returns the rows to insert, or null when the
 * event should be dropped (opted out, malformed, oversized, subject missing).
 * Bot filtering and rate limiting happen in the route, before this.
 */
export function buildTrackRows(raw: string, headers: Headers): { event: EventRow; click: ClickRow | null } | null {
  if (requestOptsOut(headers)) return null;
  if (!raw || raw.length > MAX_TRACK_BYTES) return null;
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    body = parsed as Record<string, unknown>;
  } catch {
    return null;
  }

  const type = typeof body.type === "string" && TYPES.has(body.type) ? (body.type as TrackType) : null;
  if (!type) return null;

  const slugRaw = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const slug = slugRaw && slugRaw.length <= 80 && SLUG_RE.test(slugRaw) ? slugRaw : null;
  if (typeof body.slug === "string" && body.slug && !slug) return null; // malformed slug → drop
  const dealId = str(body.dealId, UUID_RE);
  const city = str(body.city, CITY_RE);
  const vid = str(body.vid, VID_RE);
  const utmSource = str(body.utm_source, TOKEN_RE);
  const utmCampaign = str(body.utm_campaign, TOKEN_RE);
  const refHost = cleanHost(body.ref);

  // Store/deal events are meaningless without their subject.
  if ((type === "store_view" || type === "call_tap" || type === "directions_tap") && !slug) return null;
  if ((type === "deal_view" || type === "deal_tap") && !dealId) return null;

  const metadata: Record<string, string | null> = {
    deal_id: dealId,
    city,
    ref_host: refHost,
    utm_source: utmSource,
    utm_campaign: utmCampaign,
    device: deviceOf(headers),
    vid,
  };
  const meta = body.meta && typeof body.meta === "object" && !Array.isArray(body.meta) ? (body.meta as Record<string, unknown>) : null;
  if (meta) {
    const from = str(meta.from, TOKEN_RE);
    if (from) metadata.from = from;
    if (type === "search" && typeof meta.q === "string") {
      const q = meta.q.toLowerCase().replace(/[^a-z0-9 .'-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
      if (q) metadata.q = q;
    }
  }

  const event: EventRow = { event_type: type, listing_id: slug, project_tag: "green", metadata };
  const click: ClickRow | null =
    dealId && TAP_TYPES.has(type)
      ? {
          deal_id: dealId,
          user_agent: metadata.device as "mobile" | "desktop",
          referrer: refHost,
          city,
          source: metadata.from ? `${type}:${metadata.from}` : type,
        }
      : null;
  return { event, click };
}
