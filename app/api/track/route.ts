// app/api/track/route.ts — first-party event counter.
//
// Accepts {type, slug?, dealId?, city?, meta?, vid?, ref?, utm_source?,
// utm_campaign?} from lib/track.ts and writes one row to `events`
// (project_tag 'green', listing_id = store slug). Taps that carry a deal id
// also go to `deal_clicks`.
//
// Privacy: no IP address and no user-agent string is stored. The IP is only
// used as an in-memory rate-limit key on this instance and then forgotten.
// Metadata keeps: deal_id, city, ref_host (hostname only), utm_source,
// utm_campaign, device ('mobile'|'desktop') and vid (random per-browser id).
//
// Always answers 204 fast; the insert runs after the response via after().
// Never throws to the client. No service key → silent no-op.
import { NextResponse, after, type NextRequest } from "next/server";
import { TRACK_TYPES, type TrackType } from "../../../lib/track";
import { analyticsWriter } from "../../../lib/analyticsDb";
import { rateLimited, clientKey } from "../../../lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set<string>(TRACK_TYPES);
const TAP_TYPES = new Set<TrackType>(["deal_tap", "directions_tap", "call_tap", "website_tap", "order_tap"]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VID_RE = /^[a-z0-9-]{8,40}$/i;
const CITY_RE = /^[A-Za-z][A-Za-z .'-]{0,39}$/;
const TOKEN_RE = /^[A-Za-z0-9._-]{1,60}$/;
const HOST_RE = /^[a-z0-9.-]{1,120}$/;

const BOT_RE =
  /bot|crawl|spider|slurp|scrap|fetch|preview|monitor|uptime|pingdom|headless|lighthouse|pagespeed|gtmetrix|chrome-lighthouse|facebookexternalhit|embedly|quora link|whatsapp|curl|wget|python|httpx|aiohttp|axios|node-fetch|undici|go-http|java\/|okhttp|libwww|httpclient|postman|insomnia|phantom|selenium|puppeteer|playwright|vercel|datadog|newrelic|statuscake|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic|perplexity|ccbot|amazonbot|applebot|bingpreview|yandex|baidu|duckduckbot/i;

const noContent = () => new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });

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

function isLikelyBot(req: NextRequest): boolean {
  const h = req.headers;
  const ua = h.get("user-agent") || "";
  if (!ua || ua.length < 20 || BOT_RE.test(ua)) return true;
  // Real browsers send Fetch Metadata on beacons/fetches from our pages.
  const site = h.get("sec-fetch-site");
  if (!site || (site !== "same-origin" && site !== "same-site")) return true;
  const purpose = h.get("purpose") || h.get("sec-purpose") || h.get("x-purpose") || "";
  if (/prefetch|preview|prerender/i.test(purpose)) return true;
  const origin = h.get("origin");
  const host = h.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return true;
    } catch {
      return true;
    }
  }
  return false;
}

function deviceOf(req: NextRequest): "mobile" | "desktop" {
  const hint = req.headers.get("sec-ch-ua-mobile");
  if (hint === "?1") return "mobile";
  if (hint === "?0") return "desktop";
  const ua = req.headers.get("user-agent") || "";
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? "mobile" : "desktop";
}

export async function POST(req: NextRequest) {
  try {
    if (isLikelyBot(req)) return noContent();
    // In-memory only; the IP is never written anywhere.
    if (rateLimited(`track:${clientKey(req.headers)}`, 60, 60_000)) return noContent();

    const raw = await req.text();
    if (!raw || raw.length > 2048) return noContent();
    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return noContent();
      body = parsed as Record<string, unknown>;
    } catch {
      return noContent();
    }

    const type = typeof body.type === "string" && TYPES.has(body.type) ? (body.type as TrackType) : null;
    if (!type) return noContent();

    const slugRaw = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const slug = slugRaw && slugRaw.length <= 80 && SLUG_RE.test(slugRaw) ? slugRaw : null;
    if (typeof body.slug === "string" && body.slug && !slug) return noContent(); // malformed slug → drop
    const dealId = str(body.dealId, UUID_RE);
    const city = str(body.city, CITY_RE);
    const vid = str(body.vid, VID_RE);
    const utmSource = str(body.utm_source, TOKEN_RE);
    const utmCampaign = str(body.utm_campaign, TOKEN_RE);
    const refHost = cleanHost(body.ref);

    // Store/deal events are meaningless without their subject.
    if ((type === "store_view" || type === "call_tap" || type === "directions_tap") && !slug) return noContent();
    if ((type === "deal_view" || type === "deal_tap") && !dealId) return noContent();

    const metadata: Record<string, string | null> = {
      deal_id: dealId,
      city,
      ref_host: refHost,
      utm_source: utmSource,
      utm_campaign: utmCampaign,
      device: deviceOf(req),
      vid,
    };
    const meta = body.meta && typeof body.meta === "object" ? (body.meta as Record<string, unknown>) : null;
    if (meta) {
      const from = str(meta.from, TOKEN_RE);
      if (from) metadata.from = from;
      if (type === "search" && typeof meta.q === "string") {
        const q = meta.q.toLowerCase().replace(/[^a-z0-9 .'-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
        if (q) metadata.q = q;
      }
    }

    const db = analyticsWriter();
    if (!db) return noContent();

    after(async () => {
      try {
        const { error } = await db.from("events").insert({
          event_type: type,
          listing_id: slug,
          project_tag: "green",
          metadata,
        });
        if (error) console.error("[track] events insert:", error.message);
        if (dealId && TAP_TYPES.has(type)) {
          const { error: e2 } = await db.from("deal_clicks").insert({
            deal_id: dealId,
            user_agent: metadata.device, // coarse device class only, never the UA string
            referrer: refHost,
            city,
            source: metadata.from ? `${type}:${metadata.from}` : type,
          });
          if (e2) console.error("[track] deal_clicks insert:", e2.message);
        }
      } catch (err) {
        console.error("[track] insert failed:", err);
      }
    });
    return noContent();
  } catch {
    return noContent();
  }
}

export function GET() {
  return new NextResponse(null, { status: 405, headers: { allow: "POST" } });
}
