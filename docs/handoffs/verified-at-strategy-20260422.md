# Handoff — `verified_at` backfill strategy

**From:** Cowork
**To:** Matthew (decision) + Code (UI patch once decided)
**Date:** 2026-04-22 (authored 2026-04-21 night)
**Pairs with:**
- `sql/migrations/2026-04-22-verified-at-backfill.sql` (Option C draft — NOT YET APPLIED)
- `sql/migrations/2026-04-22-add-verified-at-to-view.sql` (makes verified_at visible to the UI)
- `app/components/DealFreshnessBadge.tsx` (where the copy lives)
- `docs/audits/deal-data-freshness-20260421.md` (the why)

## Context

After the join-integrity migration (Task 1 in this session) applies, the active
deal set will hold ~49 deals. **Every one of them has `verified_at = NULL`** —
the P0 freshness audit already captured this, and nothing has set a verification
timestamp since the April 14 import.

Code shipped `<DealFreshnessBadge />` in the Apr 21 evening push. The current
behavior when `verified_at` is null: the badge renders `"Verification pending"`
in subtle gray on every deal card, every recommend-API top pick, every category
page, every listing page — site-wide.

Tomorrow morning the `active_deals_with_listings` view fix (Task 2 in this
session) lands. At that point the badge signal is correctly wired end-to-end,
and the view will project `verified_at = NULL` to every consumer. Meaning:

**On April 22 AM, the entire site shows "Verification pending" on every deal.**

That's technically honest, but it reads as an unfinished feature. A user who
sees "Verification pending" on 49 out of 49 cards will stop reading the badge
at all. The signal dies before it can ever upgrade to a real "Verified N days
ago" state.

This doc is the decision: how do we treat the 49 unverified imports?

---

## Options

### Option A — Mass-set `verified_at = created_at`

SQL: `UPDATE deals SET verified_at = created_at WHERE verified_at IS NULL AND is_active = true;`

UI effect: every deal shows "Verified 7 days ago" (or 8, since created_at is
Apr 14 and badge reads on Apr 22).

**Pros**
- No card ever shows "Verification pending." The feature looks complete from
  day one.
- "Verified 8 days ago" is inside the 7–14 day muted-gray tier (per
  DealFreshnessBadge.tsx), so it's appropriately-cautious UX.

**Cons**
- **It's a lie.** Nobody actually verified these deals. They were scraped once
  from Leafly/Weedmaps/websites on Apr 14, dedup'd on Apr 15, and haven't been
  touched since.
- Sets a bad precedent — if we ever do a second "verified = created" mass-set,
  users won't be able to tell the difference between a real verification and
  another import pass.
- Erodes trust in the "Verified" word. If we ever ship real human/scraper
  verification, users who were conditioned on "Verified" = "we looked" won't
  realize the word's weight just changed.

### Option B — Leave `verified_at = NULL`

SQL: none — do nothing.

UI effect: every deal shows "Verification pending" until the scraper or manual
verification fills in real timestamps.

**Pros**
- Honest. No claim we didn't earn.
- The upgrade path is clean — the first deal to get a real `verified_at` will
  visibly flip from "Verification pending" to "Verified 0 days ago."

**Cons**
- Every card reads as "unfinished feature" until Path A/B/C lands at real scale.
  Based on the Apr 21 audit, that could be 2–6 weeks out.
- Users stop reading the badge. Once "pending" becomes the norm, the signal
  dies.
- Marginal hit to brand — the homepage hero card and the entire /deals/* feed
  has a gray "Verification pending" pill on every card, on every visit, for
  weeks.

### Option C — Set `verified_at = created_at - 7 days` + status_reason marker  ⭐ RECOMMENDED

SQL:
```sql
UPDATE deals
SET verified_at = created_at - INTERVAL '7 days',
    status_reason = 'imported_not_verified'
WHERE verified_at IS NULL
  AND is_active = true
  AND created_at::date = '2026-04-14';
```

UI effect (with the copy patch below): every deal shows `"Imported Apr 14"` in
the same visual slot the badge currently occupies. No "Verification pending"
anywhere. No false "Verified N days ago" claim.

**Pros**
- Honest — the badge says exactly what happened.
- Avoids "Verification pending" on every card (the Option B failure).
- Avoids pretending we verified (the Option A failure).
- Clean upgrade path: the first deal to get a real `verified_at` (not NULL and
  not matching the synthetic `created_at - 7 days` value, i.e., the
  `status_reason = 'imported_not_verified'` marker removed) flips to "Verified
  N days ago."
- The `status_reason = 'imported_not_verified'` tag is the signal the UI reads
  to pick between "Imported Apr 14" vs. "Verified N days ago" copy.
- The 14-day-ago computed age naturally slides past the 7-day "fresh" window
  and into the "8–14d muted" tier, which is accurate: this data IS older.

**Cons**
- Requires a copy patch in Code's `<DealFreshnessBadge />`. Estimated 10 lines
  of TSX, no architectural change.
- Writes a marker value into `status_reason` that isn't in the canonical
  enum (`expired | stale | dispensary_closed | manual | duplicate`). Expanding
  the enum to include `imported_not_verified` is a comment-only change in the
  staleness migration docs, not a schema change (status_reason is free-form
  text, not a CHECK-constrained enum).
- Not every deal in the table was imported on Apr 14 (though as of today, all
  49 post-fix-migration active deals ARE), so the copy "Imported Apr 14"
  could mislead if future imports happen before the scraper verifies them.
  Mitigate: the computed string uses `created_at` from the row, not a literal
  Apr 14 — so the date label stays accurate if future import batches arrive.

---

## Recommendation

**Option C.**

Rationale:
- Option A's lie is a trust-erosion risk worse than the short-term UX cost.
- Option B's "Verification pending on every card" kills the badge signal
  before it can ever earn its keep.
- Option C is the only one that tells the truth AND gives the UI a real
  rendering target. The small copy patch Code needs to land in
  `DealFreshnessBadge.tsx` is the price of admission.

**Ship order:**
1. Matthew: pick A/B/C tomorrow morning (this doc is the decision prompt).
2. Apply `sql/migrations/2026-04-22-fix-deal-listing-joins.sql` first (Task 1
   in this session) — gets the active set down to ~49 deals.
3. Apply `sql/migrations/2026-04-22-add-verified-at-to-view.sql` next (Task 2) —
   makes the column visible to the UI.
4. Apply `sql/migrations/2026-04-22-verified-at-backfill.sql` (this Task) last —
   fills in the values the badge now reads.
5. Code applies the copy patch in `DealFreshnessBadge.tsx` (spec below) — the
   badge starts rendering "Imported Apr 14" for the imported-not-verified set
   and "Verified N days ago" for everything that gets real verification later.

If Matthew picks Option A: use the same SQL file but replace the body with the
A-variant already drafted in a comment inside that migration. Skip the UI patch.

If Matthew picks Option B: do nothing. Skip the migration. Skip the UI patch.
Live with "Verification pending" on every card.

---

## UI patch spec for Code (Option C only)

File: `app/components/DealFreshnessBadge.tsx`

Current props (inferred from the evening session report):
```ts
type Props = {
  verifiedAt: string | null;      // ISO timestamp
  variant?: "compact" | "detail"; // rendering variant
  statusReason?: string | null;   // NEW — pass-through from the view
};
```

Current render flow:
1. If `verifiedAt` is null → "Verification pending".
2. Compute days-since-verify; bucket into fresh/muted/amber/hidden.

Patched render flow:
1. If `statusReason === "imported_not_verified"` → render `"Imported {mon day}"`
   where mon/day is computed from `verifiedAt + 7 days` (the original
   created_at). Styling: same muted-gray as the 8–14d tier.
2. Else if `verifiedAt` is null → "Verification pending" (unchanged).
3. Else compute days-since-verify and bucket as today (unchanged).

Minimal diff (approximate):
```tsx
// Near top of component, after prop destructure:
const importedLabel = React.useMemo(() => {
  if (statusReason !== "imported_not_verified") return null;
  if (!verifiedAt) return null;
  const ts = new Date(verifiedAt);
  // verified_at = created_at - 7d in Option C; undo the offset to label the import date.
  const importDate = new Date(ts.getTime() + 7 * 24 * 60 * 60 * 1000);
  return importDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}, [statusReason, verifiedAt]);

// In the render block, before the existing "Verification pending" branch:
if (importedLabel) {
  return (
    <span className="freshness-badge muted">
      Imported {importedLabel}
    </span>
  );
}
```

Acceptance:
- Load `/` and visually confirm the homepage hero card shows `"Imported Apr 14"`
  instead of `"Verified 7 days ago"` or `"Verification pending"`.
- Load `/deals/flower` — every card shows `"Imported Apr 14"`.
- Load `/l/nuera-east-peoria` — the embedded deal cards show the same.
- Grep `"Verification pending"` across the app for any remaining render sites
  that don't pass `statusReason` through — the view projection adds the field,
  but TypeScript interfaces in app/ may need to add the field to deal types.
