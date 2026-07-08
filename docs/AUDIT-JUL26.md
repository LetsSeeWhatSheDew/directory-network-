# AUDIT — Assessment Sprint (July 2026)

_Read-only Phase 0 audit. Written 2026-07-08 by the Code lane against branch `feat/design-direction-v2` (HEAD `39257cc`)._

## TL;DR — the sprint prompt is partly stale

The sprint brief was written against an **older state of the repo** and assumes the site "reads 2016" with Georgia serif and a Tailwind-vs-inline mess to untangle. That is no longer accurate. Between the brief being written and this session, a **Design Direction v2 effort ("warm price-truth instrument")** already landed on this branch (commits `fd91a07 → 39257cc`, June 13). It delivered most of what Phase 2a asks for:

- A single-source-of-truth token system in `app/globals.css` (three greens + warm neutrals, spacing scale, radius scale, motion tokens, reduced-motion support).
- **Shadows removed** ("de-shine") in favor of flat fills + hairline borders.
- **Self-hosted variable fonts via `next/font`** — Space Grotesk (display), Inter (body), JetBrains Mono (numerals) — replacing Georgia. No FOUT.
- A clamp-based type scale (6 steps) and a signature `PriceBoard` component.

So **Phase 2a (design-system foundation) is essentially already done and is good.** The real Phase 2 work is **migration and cleanup**, not foundation. Details below.

Two brief targets are **not achievable as written** and are flagged as scope conflicts, not failures:
1. **"Sitemap will exceed 150 URLs."** Under the April 24 hard scope-lock (12 Central IL cities, 26 active listings, 9 active deals), the sitemap generates **~69 URLs**. The 150+ figure assumed the pre-lock statewide programmatic city build (commit `02fb0bc`), which is now hidden/404 by design. See Phase 1.
2. **DESIGN.md is stale.** It still documents the *old* system (Inter-only, `#22C55E` green, 8px radius, `box-shadow: 0 1px 3px`). It does not match the shipped v2 system in `globals.css`. Recommend updating DESIGN.md to match reality (proposed in Phase 2).

---

## 1. Current state by surface

### Styling approach — the real inconsistency map
The codebase is mid-migration onto the v2 token layer. Quantified:

| Signal | Count | Meaning |
|---|---:|---|
| Inline `style={{…}}` blocks across `app/` + `components/` | **509** | Bulk of the app still styles inline |
| Files using `pp-*` utility classes | **14** | Only the de-shine-swept surfaces migrated |
| Files referencing retired **Manrope** font by name | **18** | Silent fallback to system-ui (see below) |
| Files with stale **Geist/Georgia** references (mostly comments + `var(--font-x, Georgia)` fallbacks) | **33** | Cosmetic/comment debt |
| `box-shadow` occurrences outside `globals.css` (`--shadow-*` are `none`) | **~12 files** | De-shine not finished site-wide |

**The de-shine sweep (commit `3d32866`) touched shared components + single-deal + city + homepage — but not the whole app.** `/deals/[category]`, `/about/index`, `/alerts`, `/brand`, `/claim`, `/map`, the tax calculator, and several admin/submit forms still carry inline shadows and the old visual language.

### Font regression (shippable bug)
`Nav.tsx`, `Footer.tsx`, `MobileNavMenu.tsx`, `HomeDealCards.tsx`, and others hardcode `font-family: Manrope, system-ui, …`. **Manrope is not loaded** — `layout.tsx` loads Space Grotesk / Inter / JetBrains Mono only. So nav links, footer headings/links/tagline, and other text **silently render in system-ui instead of Inter.** This is the exact failure class the project already hit once (see the `39257cc` "fonts were silently falling back" fix and the team's memory note). Fix: replace `Manrope` with `var(--font-body)`.

### Homepage (`app/page.jsx`)
- Content hierarchy is correct and matches the brief: one dominant PriceBoard above the fold, "Best Bud For Your Buck$" headline retained, category grid, deals, tax callout, city grid, trust, FAQ.
- **But** the ~660-line inline `<style>` block **hardcodes hex values** (`#2E7D32`, `#1C3A22`, `#F4F5EF`, `#DCDED2` …) that duplicate the v2 tokens, and sets `font-family: system-ui` on nav/stats/deal-card/footer text. Stale comments still reference "Georgia serif," "navy," and "Geist Display."
- FAQ section uses inline `style={{}}` with `system-ui`.

### Nav / Footer
Structurally well-migrated (scoped `<style>`, `pp-*` classes, CSS vars with hex fallbacks). Only defect is the Manrope font reference above.

### Fonts / layout
`layout.tsx` is correct and modern: `next/font` variables on `<html>`, GA4 (`G-TML9Y6VMC2`) via `next/script afterInteractive`, full OG/Twitter/verification metadata, favicons. **GA4 confirmed present** (Phase 1 item 5 satisfied at the layout level).

---

## 2. SEO / discovery state (Phase 1 pre-check)

**Sitemap (`app/sitemap.ts`)** — already DB-driven (read-only PostgREST, `project_tag=green` scoped, Central IL filtered) and comprehensive in *shape*: base pages + 5 deal categories + 3 static guides + dispensary profiles + 9 city landings + brand pages (0 until table lands) + per-deal pages.

**Real URL count ≈ 69**, computed from live DB (2026-07-08):
`17 base + 5 categories + 3 guides + 26 dispensary profiles + 9 cities + 0 brands + 9 deals = 69`.
→ **The 150+ target is a scope conflict, not a bug.** Documented for the report.

**robots.ts** — exists, absolute sitemap URL, disallows only `/admin` + `/api/`. Good.

**Metadata / JSON-LD** — high-value dynamic routes are already excellent:

| Route | Metadata | Canonical | JSON-LD |
|---|---|---|---|
| `/dispensary/[slug]` | `generateMetadata` | ✓ | **LocalBusiness** |
| `/deal/[id]` | `generateMetadata` | ✓ (→ dispensary) | **Offer** + SpecialAnnouncement |
| `/deals/[category]` | `generateMetadata` | inline (not `alternates`) | **ItemList + BreadcrumbList** |
| `/city/[city]` | `generateMetadata` | ✓ | none |
| `/` homepage | static `metadata` | ✓ | **FAQPage only** |

Gaps worth closing in Phase 1 (honest, low-risk):
- **Homepage has no Organization schema** (only FAQPage). Add Organization for entity recognition / Zone 4 AI-citation goal.
- **Static routes lack page-level metadata** and inherit the generic root title: `/start`, `/terms`, `/privacy`, `/map`, `/upgrade`, `/savings`, `/grow`, `/get-listed`, `/early-access`, `/illinois-cannabis-tax`, `/cannabis`, plus `/cannabis/illinois/first-time-guide` and `/open-now`. Give each a unique title + description + canonical.
- `/about`, `/alerts`, `/deals/[category]` set canonical via a hardcoded URL string rather than the `alternates: { canonical }` pattern — harmonize.

---

## 3. Trust architecture state (Phase 3 pre-check)

| Signal | `/deal/[id]` | `/dispensary/[slug]` | Homepage cards | `/deals/[category]` |
|---|---|---|---|---|
| Freshness ("Verified …") | ✓ DealFreshnessBadge | **✗ missing on deal cards** | ✓ VerifiedRow | ✓ DealFreshnessBadge |
| Sourcing line (menu link) | ✗ (`source_url` fetched, never rendered) | ✗ (`source_url` fetched, never rendered) | ✗ | ✗ |
| Report an issue | ✗ | **✗ (stranded)** | ✗ | ✗ |

- **Freshness (3.1):** ~80% done. `DealFreshnessBadge` implements honest tiered states (Verified / Last checked / Verification pending / ⚠ outdated / hidden >30d) off real `verified_at`. Only gap: `/dispensary/[slug]` deal cards render no freshness.
- **Sourcing (3.2):** `source_url` exists in the schema and is fetched on both detail pages but **never displayed** anywhere. Real work.
- **Report an issue (3.3):** only a `mailto:` on `/l/[id]:1044`. Since `/l/:slug` **308-redirects to `/dispensary/:slug`**, that feature is **stranded on a dead route**. No `deal_report` table exists. Real work — needs the migration + UI on canonical pages.

---

## 4. Build / infra baseline (Phase 4 pre-check)

- `npm run build` → **exit 0** (clean). Route table renders all expected routes.
- **`next.config.ts` sets `typescript.ignoreBuildErrors: true`** — the production build does **not** fail on type errors. Phase 4's `tsc --noEmit` gate must be run separately; a green build does not prove type-safety.
- Middleware ("Proxy") active — enforces the Central IL scope + legacy-tree gating.

---

## 5. Reconciled plan for Phases 1–5

| Phase | Brief assumption | Reality | Adjusted work |
|---|---|---|---|
| 1 SEO | Build sitemap/metadata/JSON-LD from scratch | Mostly done | Add Organization schema; metadata on ~13 static routes; report **real ~69 URL count** + scope-conflict note |
| 2 Visual | "Reads 2016," build foundation, resolve TW-vs-inline | Foundation done | **Migrate**: fix Manrope→`var(--font-body)`; homepage hexes→tokens; finish de-shine on remaining pages; update stale DESIGN.md; mobile 390px pass |
| 3 Trust | Build from scratch | Freshness ~80% done | Add freshness to dispensary cards; render sourcing line; add report-an-issue to canonical pages + `sql/deal-reports.sql` |
| 4 Perf | Lighthouse + fixes | Build clean | Run `tsc --noEmit`; Lighthouse; image/font/CLS fixes |
| 5 Ship | Rebase, push, report | — | Rebase onto `origin/main`, push, report |

**Guardrails honored:** no fake data (freshness/sourcing use real columns only; UI hides when data absent), no Stripe changes, no email sending, mobile-first. Scope-lock (`project_tag='green'`, Central IL) respected in every new query.
