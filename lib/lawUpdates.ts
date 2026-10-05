// lib/lawUpdates.ts — pure helpers for "email me when the law changes".
// One source of truth: LAW_FACTS (lib/social/laws.ts). A fact has up to two
// moments worth an email:
//   - the day PuffPrice published it (`published`, else `checked`)
//   - the day it takes effect (`date`), when that's later than publishing
//     (e.g. the Nov 12 hemp cap: posted in September, effective in November)
// A law watch keeps a cursor ('law:YYYY-MM-DD' in its categories): the last
// Central-Time day it was emailed through. Due = any moment in (cursor, today].
import type { LawFact } from "./social/types";

export const LAW_CURSOR = "law:";

export const publishedOf = (f: LawFact) => f.published || f.checked;

export type LawMoment = { fact: LawFact; day: string; kind: "new" | "effective" };

export function momentsOf(f: LawFact): LawMoment[] {
  const pub = publishedOf(f);
  const out: LawMoment[] = [{ fact: f, day: pub, kind: "new" }];
  if (f.date > pub) out.push({ fact: f, day: f.date, kind: "effective" });
  return out;
}

/** Moments in (cursor, today], oldest first, one per fact (the latest moment wins). */
export function dueLawMoments(facts: LawFact[], cursor: string, today: string): LawMoment[] {
  const byFact = new Map<string, LawMoment>();
  for (const f of facts)
    for (const m of momentsOf(f))
      if (m.day > cursor && m.day <= today) {
        const cur = byFact.get(f.id);
        if (!cur || m.day > cur.day) byFact.set(f.id, m);
      }
  return [...byFact.values()].sort((a, b) => a.day.localeCompare(b.day) || a.fact.id.localeCompare(b.fact.id));
}

/** The watch's cursor, else the day it was created (so new sign-ups never get the back catalogue). */
export function lawCursorOf(categories: string[] | null, createdAt: string): string {
  const tag = (categories || []).find((c) => c.startsWith(LAW_CURSOR));
  if (tag && /^\d{4}-\d{2}-\d{2}$/.test(tag.slice(LAW_CURSOR.length))) return tag.slice(LAW_CURSOR.length);
  return createdAt.slice(0, 10);
}

/** Every fact as a timeline, newest moment first (the /law-updates page and its feed). */
export function lawTimeline(facts: LawFact[], today: string): LawMoment[] {
  const all = facts.flatMap(momentsOf).filter((m) => m.kind === "new" || m.day <= today);
  // An effective-day entry only shows once that day has come; upcoming ones read from the "new" entry.
  return all.sort((a, b) => b.day.localeCompare(a.day) || a.fact.id.localeCompare(b.fact.id));
}

export const momentLine = (m: LawMoment) => (m.kind === "effective" ? `Takes effect today: ${m.fact.headline}` : m.fact.headline);
