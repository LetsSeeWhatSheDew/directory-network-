// lib/track.ts — first-party, privacy-respecting event counting.
//
// Client helper: track(type, { slug, dealId, city, meta }) sends one small
// beacon to POST /api/track. Nothing here identifies a person:
//   - `vid` is a random id kept in this browser's localStorage so we can
//     count unique visitors. It is not tied to any account, email or IP.
//   - Referrer is reduced to its hostname before it leaves the browser.
//   - Do Not Track / Global Privacy Control → nothing is sent.
// Every call is wrapped so tracking can never break a page.
//
// The type list is also imported by the server route, so keep this module
// free of top-level browser access.

export const TRACK_TYPES = [
  "store_view",
  "deal_view",
  "directions_tap",
  "call_tap",
  "website_tap",
  "order_tap",
  "deal_tap",
  "qr_scan",
  "share_tap",
  "search",
] as const;

export type TrackType = (typeof TRACK_TYPES)[number];

export type TrackOpts = {
  slug?: string | null;
  dealId?: string | null;
  city?: string | null;
  meta?: Record<string, string | number | boolean | null | undefined>;
};

const VID_KEY = "pp_vid";
const ENDPOINT = "/api/track";

let _vid: string | null = null;
const _recent = new Map<string, number>();

function optedOut(): boolean {
  try {
    const n = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
    const w = window as Window & { doNotTrack?: string };
    if (n.globalPrivacyControl === true) return true;
    if (n.doNotTrack === "1" || n.doNotTrack === "yes" || w.doNotTrack === "1" || n.msDoNotTrack === "1") return true;
  } catch {}
  return false;
}

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getVid(): string | null {
  if (_vid) return _vid;
  try {
    const existing = localStorage.getItem(VID_KEY);
    if (existing && /^[a-z0-9-]{8,40}$/i.test(existing)) {
      _vid = existing;
      return _vid;
    }
    const fresh = randomId();
    localStorage.setItem(VID_KEY, fresh);
    _vid = fresh;
    return _vid;
  } catch {
    // Storage blocked (private mode etc.) — keep an in-memory id for this
    // page session so repeat events on one page still dedupe.
    _vid = _vid || randomId();
    return _vid;
  }
}

function referrerHost(): string | null {
  try {
    if (!document.referrer) return null;
    const h = new URL(document.referrer).hostname.toLowerCase();
    if (!h || h === location.hostname.toLowerCase()) return null;
    return h;
  } catch {
    return null;
  }
}

function utm(key: "utm_source" | "utm_campaign"): string | null {
  try {
    const v = new URL(location.href).searchParams.get(key);
    if (v) return v;
  } catch {}
  try {
    return sessionStorage.getItem(`cl_${key}`);
  } catch {
    return null;
  }
}

export function track(type: TrackType, opts: TrackOpts = {}): void {
  if (typeof window === "undefined") return;
  try {
    if (optedOut()) return;

    // Drop exact repeats within 2s (double effects, double taps).
    const key = `${type}|${opts.slug || ""}|${opts.dealId || ""}`;
    const now = Date.now();
    const last = _recent.get(key);
    if (last && now - last < 2000) return;
    _recent.set(key, now);
    if (_recent.size > 200) _recent.clear();

    const body = JSON.stringify({
      type,
      slug: opts.slug || undefined,
      dealId: opts.dealId || undefined,
      city: opts.city || undefined,
      meta: opts.meta || undefined,
      vid: getVid(),
      ref: referrerHost(),
      utm_source: utm("utm_source"),
      utm_campaign: utm("utm_campaign"),
    });

    // text/plain keeps sendBeacon a "simple" request in every browser.
    const nav = navigator as Navigator;
    if (typeof nav.sendBeacon === "function") {
      try {
        if (nav.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain;charset=UTF-8" }))) return;
      } catch {}
    }
    fetch(ENDPOINT, {
      method: "POST",
      body,
      keepalive: true,
      credentials: "omit",
      headers: { "content-type": "text/plain;charset=UTF-8" },
    }).catch(() => {});
  } catch {}
}
