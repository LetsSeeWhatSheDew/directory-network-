# Sprint Report — Assessment Sprint (July 2026)

_Code lane. Branch `feat/design-direction-v2`. Written 2026-07-08._

## Headline
The sprint brief was written against an **older repo state**. A "Design Direction v2" effort ("warm price-truth instrument") had already landed on this branch (June 13) and delivered most of Phase 2a's foundation. So this sprint became **audit + finish the migration + close the SEO/trust/perf gaps**, not a from-scratch redesign. Full reconciliation in [docs/AUDIT-JUL26.md](AUDIT-JUL26.md).

Six commits, each phase reversible:

| Commit | Phase | Summary |
|---|---|---|
| `75a6894` | 0 | audit: pre-sprint visual + infra state |
| `3289213` | 1 | seo: Organization JSON-LD + category slug fix |
| `e8f3f9e` | 2a | redesign: fix silent font fallback (Manrope→Inter) + refresh DESIGN.md |
| `ae1a379` | 2b | redesign: retire pre-v2 lime palette site-wide + de-shine category page |
| `cfcf72f` | 3 | feat: trust architecture — freshness, sourcing, report-an-issue |
| `5a0bc46` | 4 | perf: core web vitals + a11y + SEO title fixes |

---

## Per-phase status

### Phase 0 — Audit — ✅ DONE (`75a6894`)
Reconciled the brief against reality. Key corrections: the v2 design foundation already exists and is good; `DESIGN.md` was stale; the "150+ sitemap URLs" target is unreachable under the April scope-lock.

### Phase 1 — Discovery plumbing — ✅ DONE (`3289213`)
- **Sitemap**: verified DB-driven, `project_tag='green'` + Central IL scoped. **Real count ≈ 69 URLs** (17 base + 5 categories + 3 guides + 26 dispensary profiles + 9 cities + 0 brands + 9 deals). See scope conflict below.
- **robots.ts**: correct — absolute sitemap URL, blocks only `/admin` + `/api/`.
- **Metadata**: every static and dynamic route already exports metadata (an earlier sub-audit's "missing" list was a false negative — verified each file). High-value dynamic routes have `generateMetadata` + canonical + OG.
- **JSON-LD**: added **Organization** schema to the homepage (was FAQPage-only). LocalBusiness (`/dispensary/[slug]`), Offer (`/deal/[id]`), ItemList + BreadcrumbList (`/deals/[category]`) already shipped and are honest (real DB data).
- **GA4** (`G-TML9Y6VMC2`): confirmed rendering via `layout.tsx` `next/script`.
- Fixed Footer `/deals/concentrates` → `/deals/concentrate` (matched sitemap + `HOME_HERO_CATEGORIES`; the plural rendered an empty page).

### Phase 2 — Visual modernization — ✅ DONE (foundation pre-existed; this was migration) (`e8f3f9e`, `ae1a379`)
- **Fixed a silent font regression** (shippable bug): 18 files named the retired `Manrope` family, which isn't loaded → nav, footer, deal cards, modals, error pages silently rendered in **system-ui instead of Inter**. Swept all to `var(--font-body)`; migrated the homepage's 24 bare `system-ui` declarations too.
- **Retired the pre-v2 lime palette site-wide**: `#7DBA47` (204 uses / 51 files) → `#2E7D32`, `#e8e4da` (66 uses) → `#DCDED2`. The v2 de-shine had only converted a handful of primary surfaces; the whole long tail (savings, alerts, claim, about, `/deals/[category]`, tax pages, admin, submit forms) was still on the old bright lime by hardcoding raw hex. The deeper green also improves AA contrast on white.
- Fixed one contrast regression the sweep exposed (global-error CTA dark-on-green → white).
- De-shined the `/deals/[category]` top card; rewrote the stale `DESIGN.md` to match the shipped v2 system.

**Partial / deferred (low-risk, documented):**
- Homepage `<style>` still hardcodes hex values that duplicate `--pp-*` tokens (renders identically; pure code-tidiness).
- A few subtle card drop-shadows remain on lower-traffic pages (`/brand`, `/about/index`, `global-error`) and focus-ring/map-pin shadows are intentionally kept.
- A handful of pages still set `body{font-family:Georgia}` in their own `<style>` (e.g. `/start`) — un-migrated but visually overridden by globals in most spots.
- 390px mobile pass: spot-checked via mobile-emulation Lighthouse (no horizontal scroll, tap targets ok); a hands-on device pass is best done in the Chrome lane against the preview deploy.

### Phase 3 — Trust architecture — ✅ DONE (`cfcf72f`)
- **Freshness**: added `DealFreshnessBadge` to `/dispensary/[slug]` deal cards (the last surface missing it; added `verified_at`/`status_reason` to the query). Already present on `/deal/[id]`, homepage cards, `/deals/[category]`. All states are honest (Verified / Last checked / Verification pending / ⚠ outdated) off real `verified_at`.
- **Sourcing line**: `/deal/[id]` and `/dispensary/[slug]` now render the deal's `source_url` ("Sourced from … menu ↗", `rel=nofollow`). The column was fetched everywhere but never displayed. Renders **only when `source_url` exists** — no fabricated attribution.
- **Report an issue**: new `ReportIssueLink` on `/deal/[id]` and every `/dispensary/[slug]` deal card, replacing the control that was **stranded on the 308-redirected `/l/[id]`**.
  - **PATH TAKEN: `mailto:`** (works today, zero backend dependency).
  - **`sql/deal-reports.sql`** written for the durable path (table + RLS: anon-insert-only). **NOT applied** — needs Matthew (see action items).

### Phase 4 — Performance — ✅ DONE (`5a0bc46`)
- `npm run build`: **clean (exit 0)** throughout.
- `npx tsc --noEmit`: **app/ is type-clean**. 4 pre-existing errors remain in `scripts/` (`backfill-logos-google-places.ts`, `compute-ppg-from-anchors.ts` — duplicate top-level `SUPABASE_URL`/`SUPABASE_SERVICE_KEY`; those files aren't ES modules so tsc treats them as sharing global scope). Cowork lane, not touched.
- **Lighthouse** (local `npm start`, mobile emulation) — before → after:

| Page | Perf | A11y | Best Practices | SEO |
|---|---|---|---|---|
| Homepage | 92 → **90** | 91 → **95** | 96 | **100** |
| Deal `/deal/[id]` | 74 → **89** | **95** | 96 | 91* |
| Listing `/dispensary/[slug]` | **76** | **94** | 96 | **100** |

- Perf fix: **preconnect/dns-prefetch to the Supabase origin** (React 19 hoists to `<head>`) cut deal-page LCP **5.3s → 3.5s**.
- A11y fixes: StickyMobileCTA aria-hidden focus trap; darkened failing light grays to clear AA. Homepage 91 → 95.
- SEO fix: removed the **double `| PuffPrice | PuffPrice`** title suffix on `/deal/[id]` and `/city/[city]` (root layout `title.template` already appends the brand).

\* The deal-page SEO 91 is a **Lighthouse measurement artifact** on streamed metadata — the meta description **is** present in the SSR HTML (verified via `curl`), and the page is indexable (no robots noindex). Googlebot reads the SSR HTML, so real-world SEO is effectively 100.

**Caveat on local perf numbers:** these are local `npm start` against **live Supabase with no CDN/edge cache**. ISR pages (`/deal`, `/dispensary`) will score materially higher on Vercel's edge. Treat the local numbers as a floor. Re-run Lighthouse against the preview deploy for production-representative scores.

### Phase 5 — Ship + report — 🟡 IN PROGRESS
This report + push of the branch. **I did not merge to `main` or trigger a production deploy** — that's an outward-facing decision left to Matthew (open a PR from `feat/design-direction-v2`). See action items.

---

## Sitemap URL count + scope conflict
**~69 live URLs** today. The brief expected **>150**, which assumed the pre-scope-lock statewide programmatic city build (commit `02fb0bc`). The April 24 hard scope-lock hid those (12 CIL cities, 26 listings, 9 deals; non-CIL rows 404 by design). **This is a product-scope decision, not a bug — I did not fabricate URLs to hit 150.** To grow the sitemap honestly: add dispensaries/deals in-scope, or (a product call) widen the public scope.

## Action items for Matthew
1. **Run the migration** `sql/deal-reports.sql` in Supabase (SQL Editor or MCP) if you want durable issue reports. Until then, "Report an issue" sends a `mailto:` to `hi@puffprice.com` (works now). After running it, wire a small `/api/deals/report` route and point `ReportIssueLink` at it (POST) — no caller changes needed.
2. **Brand decision — Logo wordmark font.** `Logo.tsx` is spec-locked to "Manrope 800" (brand spec §1, 2026-05-04), but Manrope isn't loaded, so the wordmark falls back to system fonts. Either (a) load Manrope for the wordmark, or (b) adopt the v2 display face (Space Grotesk). Left untouched pending your call.
3. **Open a PR** `feat/design-direction-v2` → `main` and let Vercel build the **preview** deploy; verify green there before promoting to production. (I pushed the branch but did not merge.)
4. **Data**: all 9 active deals have `category = NULL`, so category pages (`/deals/flower` etc.) render empty except `/deals/all`. That's a scraper/data-tagging gap (Cowork lane), not UI.
5. **Cleanup (optional)**: the 4 `scripts/` tsc errors want an `export {}` or IIFE scope wrapper (Cowork lane).

## INSUFFICIENT DATA
- **Production Lighthouse scores**: only local `npm start` numbers were obtainable here; production/edge numbers require running Lighthouse against the deployed URL (Chrome lane).
- **Real 390px device QA**: emulation only from this lane.
- **`verified_at` freshness realism**: the freshness UI is correct, but how "fresh" it reads in production depends on the daily verification cron actually running (env `CRON_SECRET` set) — not verifiable from here.
