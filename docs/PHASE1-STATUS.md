# PuffPrice Phase 1 — Live Status Dashboard

**Last updated:** April 18, 2026 · seeded by Cowork sprint
**Living doc:** Chrome updates the `/Chrome` rows as each wave lands. Code updates the `/Code` rows as each task lands. Matthew updates the `/Matthew` rows.

> **Ground-truth note:** Cowork's sandbox blocks all egress to `puffprice.com` / `www.puffprice.com` (`HTTP/1.1 403 Forbidden · X-Proxy-Error: blocked-by-allowlist`). Every row marked "⚠️ needs verification from Chrome/Code" requires someone with browser or local-CLI access to confirm. Do not trust anything in this doc that isn't timestamped by a human or agent that could actually see the live site.

---

## Ship checklist — the 6 green signals for Phase 1 = done

When all six are ✅, Phase 1 ships. Chrome runs Wave 10 as the integration check; any red here blocks the call.

| # | Signal | Owner check | Status |
|---|---|---|---|
| 1 | `/upgrade` shows single-tier Pro at `$0.99/mo` — no Featured, no `$4.99`, no `$49` anywhere on the page | Chrome Wave 10 | ⚠️ unknown — last confirmed: "still pre-sprint version" (Matthew, Apr 18) |
| 2 | Homepage no longer displays "Updated 3 days ago" on fresh data | Chrome Wave 10 | ⚠️ unknown — last confirmed: "still says 3 days ago" (Matthew, Apr 18) |
| 3 | Site footer does not say "Featured placement from $49/month" | Chrome Wave 10 | ⚠️ unknown — last confirmed: "still says $49" (Matthew, Apr 18) |
| 4 | Stripe Payment Link flow works end-to-end: `/upgrade` CTA → `buy.stripe.com/...` → `$0.99` recurring monthly | Chrome Waves 1+10 | ⬜ not started |
| 5 | Resend domain verified (SPF + DKIM passing), test email delivered to `matthew@jacarandapeoria.com` with SPF: PASS / DKIM: PASS headers | Chrome Wave 7 | ⬜ not started |
| 6 | Sitemap submitted to GSC, returning ≥200 URLs, all URLs return 200 on spot-check | Chrome Wave 8 + Code Task 4 | ⚠️ sitemap emits `cleanlist.co` URLs — canonical misalignment must be fixed first |

---

## What's live (production snapshot)

### Pages known to exist in the codebase

Confirmed from `git ls-files app/`. **Does not confirm live status** — some routes may be gated, misconfigured, or returning 500s. Chrome Wave 10 will spot-check the starred rows.

| Route | Known state | Notes |
|---|---|---|
| `/` (homepage) | ★ likely stale | Matthew reports "Updated 3 days ago" indicator; freshness bug confirmed. Code Task 3 fixes |
| `/start` | ⚠️ unknown status | Code's last-sprint work per Matthew: "Code is building /start as a page with 5 sections." Cowork wrote the copy (`docs/start-page-content.md`), Code integrates |
| `/upgrade` | ★ stale (FIX queued) | Still the pre-sprint version with Featured $49 + Pro $4.99. Code Task 1 fixes |
| `/upgrade/success` | dispensary-branch text stale | References "You're featured." and "Featured badge". Code Task 5 revises |
| `/alerts` | likely live | Consumer signup page |
| `/alerts/preferences` | text stale | Options label shows `$4.99/mo`. Code Task 2 fixes (hit from audit) |
| `/about` | text stale | Line 73: "Dispensaries pay $49/month to..." Code Task 2 fixes |
| `/savings` | live, brand stale | Still refers to "CleanList users" throughout. Code Task 2 fixes |
| `/savings/dashboard` | live, brand stale | Share text references `cleanlist.co`. Code Task 2 fixes |
| `/deal/[id]` | live | ISR-cached |
| `/deals/[category]` | live | Flower / Edibles / Vapes / All; has `cleanlist.co` in JSON-LD breadcrumb (Code Task 2) |
| `/cannabis/illinois` | live | Landing for IL directory, `CleanList` branded in title/OG/footer (Code Task 2) |
| `/cannabis/illinois/open-now` | live | Same branding issue |
| `/cannabis/illinois/laws` | live | Same; title says "2025" — refresh year as part of the pass |
| `/cannabis/illinois/first-time-guide` | live | Same |
| `/cannabis/illinois/[city]` | live ×35+ | Per-city pages — Chicago, Peoria, Naperville, etc. All branded CleanList |
| `/cannabis/illinois/[city]/[intent]` | live | `best` / `open-now` / `recreational` / `deals` per city |
| `/cannabis/illinois/chicago/<neighborhood>` | live ×12 | 12 neighborhood pages — all branded CleanList, all have `$49` CTA |
| `/cannabis/missouri/*` | **status unclear** | 4 MO-branded pages exist but may be retired. Matthew to confirm (open question #1 in audit) |
| `/city/[city]` | live | Consumer-facing city page |
| `/dispensaries` | live | All-IL dispensaries index |
| `/dispensary/submit-deal` | live but broken UX | Code Task 5: strip upsell language, reduce to free-submission workflow |
| `/dispensary/submit-deal/confirmed` | live, text stale | Mentions `$49/month`, "See Featured pricing →" — Code Task 5 revises |
| `/early-access` | live | Brand-stale |
| `/get-listed` | live | Brand-stale |
| `/l/[slug]` | live | Listing pages with LocalBusiness schema |
| `/admin` | gated by `ADMIN_PASSWORD` | Fallback password in code is literal string `cleanlist2026` — security FIX in audit |
| `/terms` | **does not exist** | Cowork Task 5 created `app/terms/page.tsx` this sprint (uncommitted, for Code to ship) |
| `/privacy` | **does not exist** | Same — `app/privacy/page.tsx` created this sprint |
| `/api/stripe/create-checkout` | live, will 503 without `STRIPE_SECRET_KEY` | Graceful failure mode confirmed in code |
| `/api/stripe/webhook` | **does not exist** | Code Task 6 creates the skeleton handler; Chrome Wave 3 creates the endpoint on Stripe side |
| `/api/location` | live | IP-based location fallback |
| `/api/leads` | live | Resend email fire-and-forget |

---

## What's deployed but gated

Infrastructure that's been set up on one side but isn't end-to-end functional yet.

| Asset | Deployed on | Gated on | Unblocks when |
|---|---|---|---|
| **Stripe Pro product + Payment Link ($0.99/mo)** | Chrome Wave 1 creates | Not yet created | Chrome Wave 1 lands → `PAYMENT_LINK_URL` captured |
| **Stripe Customer Portal config** | Chrome Wave 2 creates | Needs `/terms` and `/privacy` URLs to resolve (not 404) | Code ships this sprint's legal pages. Cowork wrote them; Code stages + builds + pushes |
| **Stripe Webhook endpoint** (`/api/stripe/webhook`) | Chrome Wave 3 creates | Endpoint returns 404 until Code Task 6 ships | Code Task 6 lands; webhook starts receiving events with signing secret |
| **Resend domain (`puffprice.com`)** | Chrome Wave 4 adds | DNS records need to be added at Namecheap | Chrome Wave 5 completes DNS; Wave 7 verifies |
| **Resend API key (`puffprice-production`)** | Chrome Wave 4 creates | Needs to be pasted into Vercel env | Chrome Wave 6 lands 6 env vars |
| **Vercel env vars (6 new)** | Chrome Wave 6 sets | Needs all 6 keys from prior waves | Chrome Wave 6 completes + triggers redeploy |
| **Stripe webhook handler logic** | Skeleton in Code Task 6 | `pro_users` table (Phase 2 migration) required for `checkout.session.completed` branch | Phase 2 — after migration from `sql/migrations/2026-04-18-pro-users.sql` is applied |
| **`pro_users` + `pro_alerts_sent` tables** | Migration written by Cowork this sprint (`sql/migrations/2026-04-18-pro-users.sql`) | Needs Matthew to run against Supabase | Phase 2 cutover; Code applies via `mcp__supabase__apply_migration` |
| **GSC sitemap submission** | Chrome Wave 8 submits | Current sitemap emits `cleanlist.co` URLs | Code Task 4 aligns sitemap to `www.puffprice.com` first |
| **GSC indexing requests** | Chrome Wave 8 submits | 13 URL inspections queued | After Code's push lands and Vercel deploys Ready |
| **Google Business Profile** | Chrome Wave 9 creates | Matthew postcard verification if offered | Days-timeline; not phase-1-blocking |
| **Sitemap domain alignment** | Code Task 4 | Vercel canonical decision (www vs apex) | Chrome Wave 6 reports which is primary |

---

## Blocked on — per agent

### Chrome (Claude in Chrome)

**No blockers for Waves 1–9.** Can start immediately with Stripe → Resend → Namecheap → Vercel → GSC in the documented order.

Wave 10 (incognito final verification) is blocked on:
- Chrome Wave 6 complete (Vercel redeploy shows Ready)
- **AND** Code Task 7 lands (the main push with /upgrade rewrite + copy cleanup + freshness fix + sitemap canonical + webhook handler + legal pages)

### Code (Claude Code)

**Blocked on two inputs:**
1. **Clean working tree.** Pre-sprint `git pull origin main` must be clean. If unstaged changes persist, stop and report.
2. **Cowork audit landed.** `docs/audits/stale-copy-audit-20260418.md` exists in the tree (✅ Cowork wrote it this sprint). Code reads this for the FIX list.

**Not blocked on Chrome.** Can start all 7 tasks in parallel with Chrome Waves 1–9.

### Matthew

- **Canonical-domain decision** — www vs apex. Blocks Code Task 4 (sitemap rewrite). Cowork audit recommendation: `www.puffprice.com` (matches `/upgrade` canonical). Chrome Wave 6 verifies which is Vercel-primary; Matthew ties-breaks if they disagree.
- **Admin password rotation** — pick a new `ADMIN_PASSWORD` (≥24 chars), set in Vercel, then Code removes the `"cleanlist2026"` fallback from `middleware.ts`.
- **Missouri-pages decision** — 4 MO-branded pages at `app/cannabis/missouri/*`. Keep and rebrand, or retire. Blocks nothing critical; cleanup-only.
- **`outreach/420-drafts.md` decision** — archive, rewrite, or ignore. Not phase-1-blocking.
- **Supabase migration run** — Code can stage the migration via `sql/migrations/2026-04-18-pro-users.sql`, but applying it against production Supabase requires Matthew or Code with service-role. Phase 2 cutover.
- **`config/directories/project-green.ts` fate** — legacy pricing config ($49 Boost tier). Confirm whether consumed by any page; if orphaned, delete.

---

## Phase 1 sprint artifact inventory (as of this doc)

### Committed on `main` ahead of `origin/main` (not yet pushed)

- `d0427d5` — docs: truth-in-pricing research, beginner content, PuffPrice Promise, data sourcing, IL tax guide

### Written this Cowork sprint (uncommitted, staged for Code to ship)

| Path | Purpose |
|---|---|
| `docs/audits/stale-copy-audit-20260418.md` | Stale copy audit — 40 files flagged FIX |
| `docs/audits/bak-reconciliation.md` | Four `.bak` files reconciled — all MERGE-NEEDED |
| `docs/PHASE1-STATUS.md` | This doc |
| `sql/migrations/2026-04-18-pro-users.sql` | Phase-2 `pro_users` + `pro_alerts_sent` tables |
| `app/terms/page.tsx` | Terms of Service — Stripe-portal required page |
| `app/privacy/page.tsx` | Privacy Policy — Stripe-portal required page |

### Still sitting in tree from prior sessions (untouched by Cowork)

- `CLAUDE.md` (modified)
- `app/cannabis/illinois/[slug]/deals/page.tsx` (modified)
- `next.config.ts` (modified)
- `tsconfig.json` (modified)
- Several deleted files not yet committed (see `git status` — none are in Cowork's scope)
- Four `.local.bak` files (reconciled in `docs/audits/bak-reconciliation.md`; delete after merge)

---

## How to update this doc

Each agent updates their own rows. When a row changes, update the status emoji AND the sentence that follows. Example:

> | 1 | `/upgrade` shows single-tier Pro at `$0.99/mo`... | Chrome Wave 10 | ✅ verified Apr 18 15:20 UTC — incognito shows $0.99, no Featured, no $4.99 |

Don't delete rows. If something rolls back or a blocker reappears, update the status and append a note so history is preserved.

When the six ship-checklist signals are all ✅, this doc's header gets updated to `**Phase 1: GREEN**` and we pivot to Phase 2 planning (webhook implementation, Twilio SMS, deal ingestion cron, billing portal link).
