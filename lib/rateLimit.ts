// lib/rateLimit.ts
// Tiny per-instance, in-memory rate limiter + "seen recently" dedupe for the
// public write endpoints. Serverless instances don't share memory, so this is
// a speed bump against a script hammering one instance — not a guarantee.
// Pair it with a honeypot field and server-side caps.
//
// Privacy: nothing here keeps an IP address or an email. Every key is run
// through SHA-256 with a random salt that exists only in this instance's
// memory (never logged, never stored), so the maps hold opaque hashes that
// can't be reversed or joined with anything else, and they vanish when the
// instance does.
import { createHash, randomBytes } from "crypto";

const SALT = randomBytes(16).toString("hex");
const MAX_KEYS = 5000;

const hits = new Map<string, number[]>();
const seen = new Map<string, number>(); // key -> expiry (ms)

/** Salted one-way hash. Use for anything that might be personal (IP, email). */
export function hashKey(raw: string): string {
  return createHash("sha256").update(SALT).update("\0").update(raw).digest("base64url").slice(0, 24);
}

/** Opaque per-client key for rate limiting. Never the raw IP. */
export function clientKey(headers: Headers): string {
  // On Vercel both headers carry the real client IP (the platform overwrites
  // any client-supplied value). Elsewhere, fall back to a shared bucket.
  const real = (headers.get("x-real-ip") || "").trim();
  const fwd = (headers.get("x-forwarded-for") || "").split(",")[0].trim();
  return hashKey(`ip:${real || fwd || "unknown"}`);
}

function prune(now: number): void {
  if (hits.size > MAX_KEYS) {
    for (const [k, ts] of hits) if (!ts.length || now - ts[ts.length - 1] > 3_600_000) hits.delete(k);
    // Still too big (a flood of distinct keys): drop the oldest half rather
    // than clearing everything, so a flood can't reset every limit at once.
    if (hits.size > MAX_KEYS) {
      let drop = Math.floor(hits.size / 2);
      for (const k of hits.keys()) {
        if (drop-- <= 0) break;
        hits.delete(k);
      }
    }
  }
  if (seen.size > MAX_KEYS) {
    for (const [k, exp] of seen) if (exp <= now) seen.delete(k);
    if (seen.size > MAX_KEYS) {
      let drop = Math.floor(seen.size / 2);
      for (const k of seen.keys()) {
        if (drop-- <= 0) break;
        seen.delete(k);
      }
    }
  }
}

/** Sliding window: true once `key` has made more than `max` calls in `windowMs`. */
export function rateLimited(key: string, max = 8, windowMs = 60_000, now = Date.now()): boolean {
  const k = hashKey(`rl:${key}`);
  const list = (hits.get(k) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.delete(k); // re-insert so Map order tracks recency for prune()
  hits.set(k, list);
  prune(now);
  return list.length > max;
}

/**
 * Idempotency guard: returns true the first time `key` is seen within
 * `ttlMs` and false for repeats inside that window (a double-tap, a retried
 * request, a bot replaying the same body). The key is hashed before storage.
 */
export function firstTimeWithin(key: string, ttlMs: number, now = Date.now()): boolean {
  const k = hashKey(`seen:${key}`);
  const exp = seen.get(k);
  if (exp && exp > now) return false;
  seen.set(k, now + ttlMs);
  prune(now);
  return true;
}

/** Undo firstTimeWithin() when the write it guarded failed, so a retry goes through. */
export function forgetSeen(key: string): void {
  seen.delete(hashKey(`seen:${key}`));
}

/** Tests only: the raw keys held in memory (to prove no IP/email is kept). */
export function _debugKeys(): string[] {
  return [...hits.keys(), ...seen.keys()];
}

/** Tests only. */
export function _resetRateLimits(): void {
  hits.clear();
  seen.clear();
}
