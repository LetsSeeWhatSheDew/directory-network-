// lib/adminAuth.ts — the one admin check for /admin pages (middleware) and
// /api/admin/* routes (each route must call isAdmin; middleware doesn't
// cover API routes).
//
// The cookie holds a SHA-256 token derived from ADMIN_PASSWORD, not the
// password itself, so a leaked cookie (logs, a shared HAR file) doesn't leak
// the password. Changing ADMIN_PASSWORD signs every admin out.
//
// Uses Web Crypto only, so it runs in middleware (edge) and in Node routes.
export const ADMIN_COOKIE = "dn_admin_auth";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Constant-time string compare (no early exit on the first difference). */
export function safeEqual(a: string, b: string): boolean {
  let mismatch = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return mismatch === 0 && a.length > 0;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Cookie value for a signed-in admin, or null when ADMIN_PASSWORD is unset. */
export async function adminSessionToken(): Promise<string | null> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return sha256Hex(`puffprice-admin-session:v1:${pw}`);
}

/** Does `password` match ADMIN_PASSWORD? Constant-time; false when unset. */
export function passwordMatches(password: unknown): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  return !!pw && typeof password === "string" && safeEqual(password, pw);
}

function readCookie(cookieHeader: string, name: string): string | null {
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

/** True when the request carries a valid admin session cookie. */
export async function isAdmin(req: Request): Promise<boolean> {
  const expected = await adminSessionToken();
  if (!expected) return false;
  const got = readCookie(req.headers.get("cookie") || "", ADMIN_COOKIE);
  return !!got && safeEqual(got, expected);
}
