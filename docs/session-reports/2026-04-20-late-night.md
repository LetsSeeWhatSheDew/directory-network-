# 2026-04-20 late-night — CODE track session report

Autonomous Code session, ran in worktree `crazy-moore-56ac6e`. Commits
delivered to `origin/main` via `git push origin HEAD:main` after
rebase onto latest main.

## Commit shipped

| SHA | Summary |
|-----|---------|
| `0ead055` | apr20 late: Ivy-Hall "Illinois, IL" fix + Index + content depth + factual stats |

Starting state: `ed0b897` · Ending state: `0ead055` (1 commit).

## Tasks

### Shipped
- **Task 0 — Sync.** HEAD was already at `ed0b897`, past `3a07841`. Clean.
- **Task 1 — `<details>` "See details" affordance.** Already in place from
  the evening sprint (`app/deals/[category]/page.tsx:682` reads
  `Show more ▾`). No change needed.
- **Task 2 — Kill residual area-average patterns.** Renamed
  `.save-vs` CSS class (legacy naming that referred to "area average")
  to `.save-context` in
  [`app/deals/[category]/page.tsx`](app/deals/[category]/page.tsx).
  User-facing text ("on this deal") unchanged. Grep for the old
  pattern set now returns zero matches.
- **Task 3 — Orphan bullet cleanup.** Audited the four `●`/`•` hits
  (`weeklyDigest.ts`, open-now badge, today-marker in dispensary
  hours, `● Open` status pill). All have adjacent text and are
  intentional. Nothing to remove.
- **Task 4 — "Illinois, IL" hero card fix.** In
  [`app/deal/[id]/page.tsx`](app/deal/[id]/page.tsx), introduced
  `rawCity` that is `null` when the listing's city is missing or
  literally `"Illinois"`. Render `"{rawCity}, IL"` only when we have a
  real city; otherwise render a single `Illinois` link. Also updated
  the SpecialAnnouncement schema `address` and the metadata
  description to use the same guard. Fixes Ivy Hall Peoria-style
  "Illinois, IL" duplication noted in feedback.
- **Task 6 — PuffPrice Index scaffolding.** New
  [`lib/puffpriceIndex.ts`](lib/puffpriceIndex.ts) with
  `computeWeeklyIndex()` that averages `price_per_gram` across active
  flower deals and returns `null` below a 10-sample threshold. New
  cached route [`app/api/index/weekly/route.ts`](app/api/index/weekly/route.ts)
  returns `{ puffprice_index_per_gram, sample_size, week_of }` or a
  404 when data is too thin. No UI yet by design.
- **Task 7 — Dispensary page content layer.**
  [`app/l/[id]/page.tsx`](app/l/[id]/page.tsx) now includes:
  - 30-day deal history card (count + average dollar savings,
    guarded on `recentStats.count > 0`).
  - Structured About block — uses `long_description` with
    `whiteSpace: pre-line` typography when present, otherwise falls
    back to `short_description` + "More details coming soon" footer.
  - Report-outdated-info `mailto:` card at the end of the main column.
- **Task 8 — Social proof counter (factual).** Per PATCH C, no
  fabricated "buyers saved $X" multiplier.
  [`lib/stats.ts`](lib/stats.ts) exposes `getLiveDealsValueThisMonth()`
  (SUM of estimated savings across active Illinois deals) and
  `getDealsRunThisMonth()` (count of deals created month-to-date).
  Wired into [`app/page.jsx`](app/page.jsx) as a single strip above
  the footer. Guards to zero when data is empty.
- **Task 9 — Medical tax filter.** Per PATCH B, scaffolding only. New
  [`sql/migrations/add-is-medical-friendly.sql`](sql/migrations/add-is-medical-friendly.sql)
  with `-- NOT YET APPLIED` banner and applied-by instructions. New
  [`app/components/MedicalFriendlyToggle.tsx`](app/components/MedicalFriendlyToggle.tsx)
  renders a disabled checkbox with "(coming soon)" label. Not wired
  into any page — available for the filter bar once the column exists
  and is backfilled.
- **Task 10 — Build, commit, rebase, push.** `npm run build` exits 0
  ("Compiled successfully in 3.3s"). The `Dynamic server usage`
  warnings on `/cannabis/illinois/*` pages are pre-existing (from
  `revalidate: 0` in city listing fetch), not introduced by tonight's
  changes. Rebased onto `origin/main`, pushed via
  `git push origin HEAD:main`.

### Skipped / deferred
- **Task 5 — Google Places backfill.** Skipped per PATCH A's fallback:
  `vercel` CLI is not installed in this environment
  (`which vercel` → "vercel not found"), so `vercel env pull` is not
  possible. Running the script against an empty env would have been a
  no-op that burns rate budget. Script is untouched and ready. To
  unblock: install Vercel CLI (`npm i -g vercel`), authenticate, then
  `vercel env pull .env.local` and run
  `scripts/backfill-logos-google-places.ts`.

## Blockers for next session

1. **Google Places backfill still pending.** Needs either the Vercel
   CLI installed + authed locally, or the key exported into a local
   `.env.local` another way, or the script run from an environment
   where Vercel envs already pull.
2. **Medical-friendly column not applied.** The `add-is-medical-friendly.sql`
   migration is a plan, not a change. Matthew decides the data source
   (IDFPR scrape vs owner self-report via claim flow) before applying.
3. **PuffPrice Index surface.** Data layer works; needs a public
   embed (mcp.puffprice.com Phase 3) or a homepage callout once the
   sample grows past the 10-deal threshold.
4. **Homepage stats strip sanity-check.** Live numbers depend on
   `estimateSavings()` across the entire active-deal set. Worth
   eyeballing at `puffprice.com` after deploy to confirm the total
   feels honest (spot-check against the ~56 active deals in the DB).

## Env vars still needing setup

Tracked in CLAUDE.md as of 2026-04-15:

- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_PRO_PRICE_ID`
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` (still shows `G-PLACEHOLDER`)
- [ ] `RESEND_API_KEY`
- [ ] **New:** `GOOGLE_PLACES_API_KEY` — Chrome Wave 2 task. When it
  lands in Vercel, trigger the Places backfill in a future session.

Nothing in tonight's diff depends on any of the above — everything
either uses the Supabase public fallback or degrades gracefully to
`null`.
