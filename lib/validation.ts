// lib/validation.ts
// Small, dependency-free input checks shared by the public write endpoints
// (feedback, reviews, signups, waitlist, leads, claims, deal submissions).
// Every helper is pure so it can be unit-tested without a server.

/** Body-size ceiling for the public JSON forms. Real submissions are < 4 KB. */
export const MAX_FORM_BYTES = 16 * 1024;

export type JsonBodyResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; status: 400 | 413 | 415; error: string };

/**
 * Read a JSON object body with a hard size cap. Rejects before parsing when
 * Content-Length is over the cap, and again after reading (the header can
 * lie or be missing). Arrays, primitives and malformed JSON are refused.
 */
export async function readJsonBody(req: Request, maxBytes = MAX_FORM_BYTES): Promise<JsonBodyResult> {
  const declared = Number(req.headers.get("content-length") || 0);
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, status: 413, error: "That's too much text." };
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return { ok: false, status: 400, error: "Couldn't read that." };
  }
  if (new TextEncoder().encode(raw).length > maxBytes) return { ok: false, status: 413, error: "That's too much text." };
  return parseJsonObject(raw);
}

export function parseJsonObject(raw: string): JsonBodyResult {
  if (!raw) return { ok: false, status: 400, error: "Empty request." };
  try {
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== "object" || Array.isArray(v)) return { ok: false, status: 400, error: "Expected a JSON object." };
    return { ok: true, body: v as Record<string, unknown> };
  } catch {
    return { ok: false, status: 400, error: "Malformed JSON." };
  }
}

// Control characters except tab/newline/carriage return, plus the Unicode
// bidi overrides that can make text render differently from how it reads.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g;

/** Trimmed string with control characters removed, capped at `max` chars; null when empty or not a string. */
export function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(CONTROL, "").trim().slice(0, max).trim();
  return t || null;
}

/** Single-line variant: also collapses newlines and runs of whitespace. */
export function cleanLine(v: unknown, max: number): string | null {
  const t = cleanText(typeof v === "string" ? v.replace(/\s+/g, " ") : v, max);
  return t;
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

/** Lower-cased, trimmed email, or null if it doesn't look like one. */
export function normalizeEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const e = v.trim().toLowerCase();
  if (e.length < 6 || e.length > 254) return null;
  return EMAIL_RE.test(e) ? e : null;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSlug(v: unknown, max = 120): v is string {
  return typeof v === "string" && v.length >= 1 && v.length <= max && SLUG_RE.test(v);
}

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** Honeypot: real people never see or fill these fields. */
export function honeypotTripped(body: Record<string, unknown>, field = "website"): boolean {
  const v = body[field];
  return typeof v === "string" ? v.trim() !== "" : v != null && v !== false && v !== "";
}

/** True when free text carries a link — spam's favourite payload. */
export function hasLink(v: string | null | undefined): boolean {
  if (!v) return false;
  return /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|ru|cn|xyz|top|info|biz|io|co)\b\/)/i.test(v);
}

/**
 * Cross-site form guard for browser-only endpoints. Browsers send
 * Sec-Fetch-Site and/or Origin on POSTs; a page on another site posting into
 * our forms is refused. Requests with neither header (older browsers, curl)
 * pass: this is CSRF hygiene, not bot defence.
 */
export function crossSiteRequest(headers: Headers): boolean {
  const site = headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "same-site" && site !== "none") return true;
  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") || headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return true;
    } catch {
      return true;
    }
  }
  return false;
}

/** Finite number within [min, max], or null. Accepts numeric strings. */
export function boundedNumber(v: unknown, min: number, max: number): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.trim()) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/** YYYY-MM-DD (optionally with a time) that parses to a real date, within ±5 years. */
export function isoDateOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!/^\d{4}-\d{2}-\d{2}([T ][0-9:.+\-Z]{0,20})?$/.test(s)) return null;
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return null;
  const fiveYears = 5 * 365 * 86400_000;
  return Math.abs(t - Date.now()) <= fiveYears ? s : null;
}

export function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
