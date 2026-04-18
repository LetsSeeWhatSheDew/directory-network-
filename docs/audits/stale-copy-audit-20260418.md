# Stale Copy + Brand Audit — April 18, 2026

**Run by:** Cowork (autonomous sprint)
**Scope:** Repo-wide grep for `$49`, `$4.99`, `Featured`, `CleanList`, `cleanlist.co` across `*.tsx`, `*.ts`, `*.md`, `*.json`
**Excludes:** `node_modules/`, `.claude/worktrees/`, `.next/`, `.local.bak` files
**Purpose:** One source of truth for Code's Phase 1 cleanup pass. Each hit classified `FIX` / `KEEP-CODE` / `KEEP-DOC`.

---

## Summary counts (after excluding noise)

| Query | Total hits | FIX | KEEP-CODE | KEEP-DOC |
|---|---|---|---|---|
| `$49` | 35 | 17 | 1 | 17 |
| `$4.99` | 23 | 3 | 0 | 20 |
| `Featured` (case-ins, *.tsx/*.ts) | 90 | 34 | 43 | 13 |
| `Featured` (case-ins, *.md/*.json) | 35 | 0 | 0 | 35 |
| `CleanList` | 215 | ~190 | 2 | ~23 |
| `cleanlist.co` | 59 | 55 | 0 | 4 |
| **Total distinct files touched** | **92** | **~40 files** | **~15 files** | **~37 files** |

**FIX count is the one that matters for Code:** roughly **40 source files** need changes to land brand+pricing truth. Most are metadata-layer (canonical URLs, OG tags, siteName, sitemap). A tight global-replace approach lands most of it; the Featured-pricing copy needs individual rewrites.

---

## FIX — user-facing copy / infra that contradicts current state

> **Rule of thumb:** if a user would see it in a browser, an email, in search results, or in a share card, and it says `CleanList` / `cleanlist.co` / `$49` / `$4.99` → FIX.

### Group A — Brand + domain rename (highest volume, lowest risk)

These are mechanical renames. A global find-replace plus a single metadataBase edit would land most of them. Code can batch into one commit per directory.

| File | Line(s) | Issue | Fix |
|---|---|---|---|
| `app/layout.tsx` | 20, 36, 41, 52 | `metadataBase: new URL("https://cleanlist.co")`; OG URL + image src point to cleanlist.co | Change metadataBase to `https://www.puffprice.com`; rename OG image path if asset renamed |
| `app/robots.ts` | 12, 13 | `sitemap: "https://cleanlist.co/sitemap.xml"` + `host: "https://cleanlist.co"` | Both → `https://www.puffprice.com` (pick www or apex consistently with sitemap) |
| `app/sitemap.ts` | 79–136 | **Every** URL in the sitemap starts with `https://cleanlist.co` | Global replace → `https://www.puffprice.com` (or apex if Code chooses that). ~20 URLs in this file alone |
| `app/api/location/route.ts` | 25 | User-Agent string `"cleanlist.co/1.0"` | → `"puffprice.com/1.0"` |
| `app/api/stripe/create-checkout/route.ts` | 9 | `SITE_URL` fallback `"https://cleanlist.co"` | → `"https://www.puffprice.com"` |
| `app/cannabis/illinois/page.tsx` | 9, 13, 14, 266, 283 | canonical, og:url, siteName, body copy, footer | Replace CleanList→PuffPrice and domain |
| `app/cannabis/illinois/laws/page.tsx` | 5, 7, 11, 12, 199 | title, canonical, og:url, siteName, footer | Same |
| `app/cannabis/illinois/first-time-guide/page.tsx` | 5, 7, 11, 12, 341, 370, 377 | title, canonical, og:url, siteName, body copy ×2, footer | Same |
| `app/cannabis/illinois/open-now/page.tsx` | 9, 13 | canonical, og:url | Same |
| `app/cannabis/illinois/_helpers.ts` | 21 | `siteName: "CleanList"` | → `"PuffPrice"` |
| `app/cannabis/illinois/[slug]/page.tsx` | 61, 63, 74, 110, 115 | canonicalUrl, title, siteName, og:url, listing URL | Same |
| `app/cannabis/illinois/[slug]/deals/page.tsx` | 16, 18 | title, canonical | Same |
| `app/cannabis/illinois/[slug]/[intent]/page.tsx` | 18, 21, 46 | const url, siteName, footer copy | Same |
| `app/cannabis/illinois/[slug]/opengraph-image.tsx` | 67 | OG image text `CleanList` | Swap to `PuffPrice` (regenerate OG pngs if hard-coded) |
| `app/cannabis/illinois/chicago/**/page.tsx` (12 neighborhood pages) | 14, 15, 16, 28 | siteName + canonical URL + footer per page | Global replace across all 12 |
| `app/cannabis/missouri/page.tsx` | 13, 77, 246, 253 | siteName, header, footer, body | **Missouri pages carry CleanList branding — confirm with Matthew if Missouri stays a live section or gets retired. If retired, delete the directory entirely.** |
| `app/cannabis/missouri/_helpers.ts` | 21 | `siteName: "CleanList"` | Same question |
| `app/cannabis/missouri/[slug]/opengraph-image.tsx` | 67 | OG image text `CleanList` | Same question |
| `app/deals/[category]/page.tsx` | 304, 305, 306 | JSON-LD BreadcrumbList with cleanlist.co item URLs | Replace |
| `app/dispensaries/page.tsx` | 15, 17 | title, canonical | Replace |
| `app/early-access/page.tsx` | 15, 19 | canonical, og:url | Replace |
| `app/get-listed/page.tsx` | 6, 23 | title, visible H1 text `CleanList` | Replace |
| `app/l/[id]/page.tsx` | 215, 296, 300 | canonicalUrl, LocalBusiness schema `url`, `sameAs` | Replace |
| `app/savings/SavingsCalculator.tsx` | 30, 53, 54, 55, 105, 106 | Comment + variable names `cleanlistSaves` + visible "CleanList users" copy ×2 | Rename variable to `puffpriceSaves`; update visible copy |
| `app/savings/dashboard/page.tsx` | 50, 53, 111 | Share-button text + share URL + visible H1 "Your CleanList savings" | Replace |
| `app/savings/page.tsx` | 5, 7, 37 | title + meta description + body copy | Replace |
| `app/upgrade/layout.tsx` | 2, 4 | title + meta description (contains `CleanList` + `$49/month` + `$4.99/month`) | Replace brand and drop pricing numbers from meta; align with `/upgrade` v2 copy (Code Task 1) |
| `app/upgrade/success/page.tsx` | 9 | description `"Your CleanList subscription is active."` | Replace brand |
| `lib/weeklyDigest.ts` | 134, 166 | Weekly-digest email links point to `cleanlist.co/deals/all` | Replace — **email is production traffic, this matters** |

### Group B — Featured tier / $49 / $4.99 pricing copy (dispensary-upsell residue)

Featured tier is dead on `/upgrade` per Matthew's strategy shift. Anything implying `$49 Featured` is a FIX. The DB enum `plan === "featured"` stays (see KEEP-CODE).

| File | Line(s) | Issue | Fix |
|---|---|---|---|
| `app/upgrade/page.tsx` | 11, 142–171, 226, 230 | Featured tier card, `$49`, "Start Featured — $49/mo" CTA, FAQ entries | **Full rewrite** — see Code Task 1 (replace with single-tier Pro $0.99 page) |
| `app/upgrade/page.tsx` | 180, 210 | Pro tier shows `$4.99` + CTA "Go Pro — $4.99/mo" | Replace with `$0.99` in same rewrite |
| `app/upgrade/success/page.tsx` | 19, 44, 74, 75 | Dispensary-flow success messages: "You're featured.", "featured placement", "Featured badge" | Decide: delete dispensary branch entirely, or keep and rewrite for free Listed flow |
| `app/upgrade/layout.tsx` | 2, 4 | Title + meta desc: "Featured dispensary listings & consumer alerts" + "Featured placement from $49/month. Pro consumer alerts from $4.99/month." | Rewrite to single-tier Pro message |
| `app/about/page.tsx` | 73 | Body copy: "Dispensaries pay $49/month to ..." | Rewrite — dispensaries don't pay $49 anymore |
| `app/cannabis/illinois/chicago/near-navy-pier/page.tsx` | 27 | "Get featured near {lm.name} for $49/month." CTA | Strip the $49 upsell; replace with "Claim your listing for free →" |
| `app/cannabis/illinois/chicago/near-wrigley-field/page.tsx` | 27 | Same | Same |
| `app/cannabis/illinois/chicago/near-ohare/page.tsx` | 27 | Same | Same |
| `app/cannabis/illinois/chicago/near-magnificent-mile/page.tsx` | 27 | Same | Same |
| `app/cannabis/illinois/[slug]/[intent]/page.tsx` | 44 | "Claim free or get featured for $49/month." CTA | Strip the $49 upsell |
| `app/cannabis/illinois/[slug]/page.tsx` | 339, 340 | "Claim your free listing or get featured at the top of this page. Featured spots start at $49/mo." | Strip the $49 sentence; keep free-claim message |
| `app/components/FeaturedDispensary.tsx` | 3, 88, 106 | Comment "$49/mo to be featured", visible body copy "Featured listings get priority placement…", CTA "Get featured — $49/mo →" | Keep component (it renders when a listing already has plan=featured in DB) but strip the $49 CTA. For the empty-state "★ Featured Spot Available", change the copy to "Claim your listing (free) →" |
| `app/dispensary/submit-deal/confirmed/page.tsx` | 57, 59, 63 | Body copy: "Featured placement puts your deal at the top…", "$49/month, cancel anytime. First month free…", "See Featured pricing →" | Rewrite entire "upgrade" block — per Code Task 5, dispensary workflow is now free-only |
| `app/alerts/preferences/page.tsx` | 157 | Option label `"Instant SMS", "$4.99/mo · text alerts…"` | Change to `$0.99/mo` |
| `app/api/stripe/create-checkout/route.ts` | 7, 13, 25 | TierKey includes `"featured"`; reads `STRIPE_FEATURED_PRICE_ID` | Decide: remove the `featured` branch entirely (clean) or leave dormant (safer). If removed, also drop `STRIPE_FEATURED_PRICE_ID` from env docs |
| `config/directories/project-green.ts` | 72, 75 | Pricing config: `price: "$49/mo"`, `features: ["Featured placement", ...]` in a `Boost` tier | **Verify this config is actually consumed by the site.** If unused, delete. If used, update to new model (Listed Free + Pro $0.99) |
| `outreach/420-drafts.md` | 29, 31, 32 | Outreach email templates reference `cleanlist.co/dispensary/submit-deal`, "$49/month", "first month free" | Rewrite if sending; or move to `docs/archived/` |

### Group C — Security / config (small but important)

| File | Line(s) | Issue | Fix |
|---|---|---|---|
| `middleware.ts` | 2 | `ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "cleanlist2026"` — hard-coded fallback | **Remove the fallback entirely.** If env is unset, middleware should reject all admin traffic, not silently fall back. At minimum rotate to `puffprice2026` post-rebrand but prefer no fallback |

---

## KEEP-CODE — legitimate enum / state references

The Featured tier is gone from pricing. The DB enum `plan = 'featured' | 'boost' | 'free'` likely still exists, and deal scoring still gives featured plans weight. Leave the enum checks alone; just delete the $49 pricing copy.

| File | Line(s) | Reason |
|---|---|---|
| `app/dispensaries/page.tsx` | 141, 151, 153 | `l.plan === "featured"` styling + badge — renders whatever's in DB. DB row may still have `plan="featured"` from prior state |
| `app/cannabis/illinois/[slug]/deals/page.tsx` | 63, 132, 135, 136, 141, 149 | Query `.order("plan", ...)` + featured-first rendering. Keep |
| `app/cannabis/illinois/[slug]/[intent]/page.tsx` | 41 | `isFeat=l.plan==="boost"||l.plan==="featured"` rendering decision. Keep |
| `app/cannabis/illinois/[slug]/page.tsx` | 6, 102, 103, 271 | FeaturedDispensary component import + `plan === "featured"` filter. Keep the logic; rewrite the component's $49 copy (see FIX above) |
| `app/admin/page.tsx` | 36, 301 | `is_featured?: boolean` type + conditional badge render. Keep |
| `app/api/deals/recommend/route.ts` | 50, 64 | Ranking uses `d.plan === "featured"` for scoring + label. Keep |
| `app/directory-page.tsx` | 14, 92, 121, 122, 268, 280, 282, 377, 379, 451 | `is_featured` type + sort + filter + badge. Keep. Note: line 451 has copy "Featured placements selected for fit…" — borderline, review for rebrand framing |
| `app/l/[id]/page.tsx` | 404, 592, 593 | CSS class + badge render. Keep |
| `components/NeighborhoodPage.tsx` | 284, 318, 320, 357 | Sort comment + badge + CTA "be one of the first featured" — the CTA copy is borderline KEEP-CODE; review whether to reframe |
| `components/CityPage.tsx` | 282, 316, 318, 354 | Same as NeighborhoodPage |
| `app/components/FeaturedDispensary.tsx` | 7, 24, 29, 31, 56, 67, 120, 146 | Component structure, type, empty-state → keep structure; only copy lines 3, 88, 106 are FIX |
| `app/components/ClaimForm.tsx` | 59 | Form label "Claim this listing / Get featured" — keep "Claim this listing", drop "/ Get featured" |
| `lib/fetchCityListings.ts` | 16, 39 | `is_featured: boolean` type + `.order("is_featured.desc")` sort. Keep |
| `lib/dealScoring.ts` | 165, 209 | Comment + score weight `if (plan === "featured") s += 20;`. Keep — pure ranking signal |

---

## KEEP-DOC — historical research, strategy, session context

These files document the strategic pivot, prior pricing experiments, and research. They are reference material, not user-facing. Leave alone unless consolidating docs later.

| File | Hit count | Nature |
|---|---|---|
| `docs/pro-tier-research.md` | ~12 | Strategy research defending $0.99 and planning $4.99 Power tier later. Fully intentional historical reference |
| `docs/one-pager.md` | ~5 | Historical one-pager with legacy `$49 Featured` pricing. Rewrite if re-shared externally |
| `docs/PROJECT_STATE.md` | ~6 | Stale project snapshot listing old `Boost $49 / Featured $149` pricing. Superseded by `docs/ROADMAP.md`. Consider archiving |
| `docs/user-personas.md` | ~3 | References Featured tier in anti-persona section — intentional historical reference |
| `docs/zone4-content-briefs.md` | ~4 | Drafts containing legacy pricing — if these briefs are being published as pages, this flips to FIX |
| `docs/zone4-pages-final.md` | ~3 | Same caveat as zone4-content-briefs — if these *are* the published pages, this is FIX |
| `docs/seo-keyword-research.md` | ~5 | "featured snippet" refers to Google SERP feature, not our Featured tier. Pure KEEP |
| `docs/city-page-content-plan.md` | ~1 | "featured-snipped" = Google feature, not our tier |
| `docs/ROADMAP.md` | ~3 | Historical references |
| `docs/GPT-ASSESSMENT-APR15.md` | ~3 | Assessment snapshot — historical |
| `docs/GPT-ASSESSMENT-APR15-V2.md` | ~1 | Same |
| `docs/puffprice-promise.md` | 1 | Line 20: "Featured listings, when they exist, are labeled as paid…" — hedged intentional reference |
| `docs/competitive-teardown.md` | 1 | "$495/mo base" = Weedmaps pricing, not ours |
| `docs/top-10-illinois-cities-content-plan.md` | 1 | "Sort: featured → pro → free tier" sort order — KEEP (describes DB sort, not pricing) |
| `docs/truth-in-pricing-research.md` | 1 | Line 98: `$49.44` is a tax-math result, not a pricing reference — false positive |
| `docs/social-content-plan.md` | 1 | Line 118: `$490 million` is IL tax revenue — false positive |
| `CLAUDE.md`, `CLAUDE-CODE-QUICKSTART.md`, `DESIGN.md`, `HANDOFF.md` | ~10 | Agent context / session notes / historical handoff. Not user-facing |

---

## Recommended execution order for Code

1. **Global safety sweep first** — `cleanlist.co` → `www.puffprice.com` across all `.tsx`/`.ts` (or choose apex; align with sitemap canonical decision from Code Task 4)
2. **Brand text sweep** — `CleanList` → `PuffPrice` across all `.tsx`/`.ts`, carefully excluding any remaining legitimate enum/CSS class names (there aren't any, but grep after replace to confirm)
3. **Metadata file pass** — explicitly inspect `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `lib/weeklyDigest.ts`, `app/api/*` for any missed references
4. **Pricing copy pass** — `/upgrade` full rewrite (Task 1); then per-file fixes for the 6 neighborhood+intent CTAs, About, FeaturedDispensary empty-state, submit-deal/confirmed
5. **Security pass** — drop the `"cleanlist2026"` middleware fallback
6. **Config pass** — decide fate of `config/directories/project-green.ts` and `app/cannabis/missouri/**`
7. **Build + verify** — `npm run build` clean, then sweep the 6 clean-file txts again to confirm 0 FIX hits remain

---

## Open questions for Matthew

1. **Missouri pages** (`app/cannabis/missouri/**`) — keep and rebrand, or retire? They're four pages and two helpers currently branded CleanList.
2. **`config/directories/project-green.ts`** — the `Boost $49/mo` pricing config. Is this actively consumed by any page, or orphaned template residue?
3. **`outreach/420-drafts.md`** — if these aren't being sent, archive. If they are, they need a rewrite before the next send.
4. **Sitemap canonical decision** — www or apex? Code Task 4 asks for one; Chrome Wave 6 verifies the Vercel primary. Pick before doing the global replace.
5. **`STRIPE_FEATURED_PRICE_ID`** — remove the env var entirely or leave it in docs as a dormant Phase-2-or-later reactivation point?
6. **Admin password rotation** — rotating `cleanlist2026` to a real secret is overdue regardless of rebrand. Issue one from `openssl rand -base64 24` and drop the fallback.

---

## Artifact manifest

Raw grep output preserved at `/tmp/audit/hits-*-clean.txt` for this session. Not committed. If Code wants to re-run any of the greps for verification, the exact commands are in the sprint brief.
