// lib/rateLimit.ts
// Tiny per-instance, in-memory rate limiter for public write endpoints
// (feedback, reviews). Serverless instances don't share memory, so this is
// a speed bump against a script hammering one instance — not a guarantee.
// Pair it with a honeypot field and server-side caps.

const buckets = new Map<string, number[]>();

export function rateLimited(key: string, max = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear();
  return hits.length > max;
}

export function clientKey(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
}
