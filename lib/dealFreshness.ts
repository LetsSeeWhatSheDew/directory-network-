// lib/dealFreshness.ts
// Featured-slot staleness gate.
//
// The homepage hero ("Best deal near {city} right now" / "Top Central
// Illinois deal right now") is the most prominent surface on the site.
// A stale deal there carries an amber "Last checked N days ago — may be
// outdated" warning that contradicts the trust the hero is supposed to
// build. Per Matthew's 2026-04-29 decision, deals shown in the featured
// slot must be re-verified within 7 days; otherwise we render an honest
// "no featured deal today" empty state and rely on the rest of the
// homepage (deal grid, alerts CTA) to carry the user forward.
//
// This gate is FEATURED-SLOT-ONLY. The /deals grid below the hero keeps
// using DealFreshnessBadge so older-but-still-active deals continue to
// surface with their existing badges (Verified / Last checked / amber
// stale). That preserves transparency without making any one deal own
// the trust impression on its own.

const SEVEN_DAYS_MS = 7 * 86_400_000;

export function isFreshFeatured(
  verifiedAt: string | null | undefined,
  now: number = Date.now()
): boolean {
  if (!verifiedAt) return false;
  const t = new Date(verifiedAt).getTime();
  if (!Number.isFinite(t)) return false;
  return now - t <= SEVEN_DAYS_MS;
}
