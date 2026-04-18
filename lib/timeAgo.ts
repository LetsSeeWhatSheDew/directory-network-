// lib/timeAgo.ts
// Short freshness timestamps for deal cards ("3h ago"). Companion to the
// verbose relativeTime() already inline in HomeDealCards — this one is
// deliberately compact because it renders as a subtle secondary line.

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "";
  const t = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  if (!Number.isFinite(t)) return "";
  const seconds = Math.floor((Date.now() - t) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatVerified(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
