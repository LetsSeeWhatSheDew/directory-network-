// Recently-viewed dispensaries, persisted in localStorage only — no backend.
// The homepage reads this and renders a "Recently visited" row; /l/[slug]
// writes an entry on view.

export type RecentItem = {
  slug: string;
  name: string;
  city: string;
  ts: number;
};

const KEY = "pp_recently_viewed";
const MAX = 5;

export function addRecentlyViewed(slug: string, name: string, city: string) {
  if (typeof window === "undefined") return;
  if (!slug) return;
  try {
    const existing = getRecentlyViewed();
    const next: RecentItem[] = [
      { slug, name: name || slug, city: city || "", ts: Date.now() },
      ...existing.filter((i) => i.slug !== slug),
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable (private mode, quota) — silently skip */
  }
}

export function getRecentlyViewed(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i): i is RecentItem =>
          !!i && typeof i.slug === "string" && typeof i.ts === "number"
      )
      .slice(0, MAX);
  } catch {
    return [];
  }
}
