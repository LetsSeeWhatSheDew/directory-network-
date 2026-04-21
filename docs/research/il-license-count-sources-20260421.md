# Illinois Dispensary License Count — Source Research (2026-04-21)

> **Purpose:** Unblock the "293 dispensaries" reconciliation documented in `docs/audits/293-reconciliation-20260420.md`. PuffPrice's legacy homepage and alerts-page copy cites 293 — that number is not traceable to a current IDFPR source. This doc finds the real current count and primary + backup source URLs for ongoing automated checking.
>
> **Pairs with:** `docs/audits/293-reconciliation-20260420.md` (the original gap doc), `docs/audits/brand-voice-audit-20260420.md` (trust-first fix for the fiction).

## TL;DR

**Best current estimate: ~244 operational adult-use dispensaries in Illinois as of early 2026.** This reconciles against the state's 500-license cap (137 remaining) and the FY2025 IDFPR report (93 operational licenses issued in FY2025, biggest year ever, + ~120 conditional licenses still working toward operational).

PuffPrice currently shows "293" on homepage and alerts page. **The real number is 244** — the 293 figure appears to be a legacy inflation, possibly from counting medical dispensaries separately, or from a stale snapshot that included conditional licenses as operational.

## Primary source (for automated periodic refresh)

**Source:** IDFPR Active Adult Use Dispensing Organization Licenses PDF
**URL:** https://idfprapps.illinois.gov/LicenseLookup/AdultUseDispensaries.pdf
**Refresh cadence:** Updated ~weekly by IDFPR when new licenses go operational.
**Parse:** Each row in the PDF is one licensed location. Count rows.
**Egress status (2026-04-21):** Blocked from Cowork sandbox. Chrome / Matthew's browser can access.

This is the canonical source. Every other source below is downstream of this PDF.

## Secondary sources (for cross-verification)

### 1. Cannabis Regulation Oversight Office (cannabis.illinois.gov)
- **URL:** https://cannabis.illinois.gov
- **Why:** State's consolidated cannabis portal. Sales figures, reports, licensing updates. Links to IDFPR data.
- **What to look for:** Monthly / quarterly sales reports cite active dispensary counts. FY2025 Annual Cannabis Report dated September 30, 2025 is the most recent comprehensive doc.
- **Annual report direct link:** https://cannabis.illinois.gov/content/dam/soi/en/web/cannabis/documents/media/reports-and-public-presentations/Compiled-Cannabis-Annual-Report-2025.pdf
- **Egress status (2026-04-21):** Blocked from Cowork sandbox.

### 2. IDFPR press releases
- **URL pattern:** https://idfpr.illinois.gov/news/2026/...
- **Recent:** "Adult Use Cannabis Sales Figures Released for January-February 2026" (Jan-Feb 2026 sales: $215M total, $173M in-state, $41M out-of-state).
- **Direct link:** https://idfpr.illinois.gov/news/2026/adult-use-cannabis-sales-figures-released-jan-feb-2026.html
- **Why:** Monthly sales press releases usually cite the count of reporting dispensaries.
- **Egress status:** Blocked from Cowork sandbox.

### 3. Industry publications
- **Illinois News Joint:** https://illinoisnewsjoint.com/ — covers IL dispensary count updates, 420 deals, openings.
- **Marijuana Business Daily:** https://mjbizdaily.com/ — national industry tracker, cites IL counts quarterly.
- **Cannabis Business Times:** https://www.cannabisbusinesstimes.com/ — quarterly market snapshots.
- **The Cole Memo:** https://thecolememo.com/ — covered the FY2025 IDFPR Annual Cannabis Report.
- **Why:** These secondary sources are easier to cite and often summarize the PDF count with a timestamp.

### 4. Third-party aggregators that mirror IDFPR
- **GrowerIQ:** https://groweriq.com/illinois-cannabis-license-complete-guide/ — cited "244 active adult-use dispensaries" in April 2026 search result.
- **Cannabis Industry Lawyer:** https://www.cannabisindustrylawyer.com/illinois-cannabis-license-2026-guide/ — cited same 244 figure + 137 remaining of 500 cap.
- **Mood Shine:** https://www.moodshine.com/ — covered FY2025 IDFPR Annual Cannabis Report + 2026 updates.
- **cann.dev:** https://www.cann.dev/illinois-cannabis-retail-april-2026/ — monthly IL retail market updates.

## What the 293 number probably was

Three leading hypotheses:

1. **Legacy seed-data inflation.** An early scrape or import may have counted medical + adult-use dispensaries as separate units, or counted the same chain dispensary twice (once as "Rise Naperville" and once as "RISE Naperville"). Dedupe work over the past two sessions (round-1 + round-2 migrations) shrank PuffPrice's own count from 61 to 57; the same dedupe pattern may explain 293 vs. ~244.
2. **Conditional-license inclusion.** ~120 conditional licensees are "working toward operational" status. If a stale scrape pulled from the conditional + operational lists, that's ~244 + 120 = 364, which could round down to "almost 300" in marketing copy.
3. **Medical-dispensary inclusion.** Pre-SB 4015 (which deems all medical dispensing orgs holding Early Approval Adult Use licenses to be adult-use, effective July 1, 2026), there's still a separate medical dispensary count. Counting both could have inflated to ~300.

**Per the 2026-04-20 brand voice audit:** whatever the 293 figure's provenance, it needs to come off the homepage. The brand voice is "trust-first." A fiction number corrodes every other claim.

## Recommended homepage fix

Current (per `app/page.jsx:1051` per brand-voice audit):

```
{dealCount} active deals · 293 dispensaries · 162 cities
```

Proposed (reconciled to the research):

```
{dealCount} active Illinois deals · tracking {trackedCount} dispensaries · adding more weekly
```

Where `{trackedCount}` is the live count from the `master_listings` query (currently 57 post-dedupe). Do NOT hardcode 244 as our "total opportunity" — users reading 244 and seeing only 57 on the site would correctly conclude we're at 23% coverage.

Optionally, on a stats or about page where long-form narrative is ok:

```
Illinois has ~244 operational adult-use dispensaries (IDFPR, early 2026). PuffPrice tracks {trackedCount} of them today — the ones running the most consumer-visible deals — and we're adding more every week.
```

This frames coverage honestly (~23%) while positioning the growth angle.

## Market context (for copy pipeline, if needed)

- **Total license cap:** 500 adult-use dispensary licenses.
- **Currently operational:** ~244 (49% of cap).
- **Conditional / in-progress:** ~120 (24% of cap).
- **Remaining to award:** 137 (27% of cap).
- **FY2025 sales:** $1.5 billion statewide (down 12% from $1.7B in FY2024, per Cann.dev April 2026 market update).
- **Jan-Feb 2026 sales:** $215M total, with $42M (19%) from out-of-state residents — Metrc started tracking residency mid-December 2025.
- **SB 4015 (effective July 1, 2026):** merges medical + adult-use dispensary license paths.

## What Cowork can do today

Since Cowork sandbox egress blocks every IDFPR / cannabis.illinois.gov URL, I can't pull the PDF myself to verify. But:

1. **Matthew or Chrome can fetch** https://idfprapps.illinois.gov/LicenseLookup/AdultUseDispensaries.pdf in a real browser. Count the rows. That's the authoritative number for any given week.
2. **Code lane** could scaffold a scheduled job to fetch the PDF on Vercel cron (Vercel egress isn't the same as the sandbox), count rows, and write to a `state_stats` table — surfaces a freshness timestamp.
3. **Cowork next session** will author the migration + Code handoff for that stats table once Matthew confirms the approach.

## Automated check recommendation (for Code's backlog)

```typescript
// scripts/refresh-il-dispensary-count.ts (future)
// Runs on Vercel cron weekly.
// 1. Fetches https://idfprapps.illinois.gov/LicenseLookup/AdultUseDispensaries.pdf
// 2. Counts rows in the PDF (use pdf-parse or similar)
// 3. Writes { source: 'IDFPR', count: N, fetched_at: now() } to state_stats table
// 4. Site reads state_stats for the "tracking X of ~Y" copy on about page
```

Deferred — not in today's scope.

## Confidence assessment

- **~244 figure:** Medium-high. Cited in 2 independent 2026 search result summaries (GrowerIQ + cannabisindustrylawyer.com). Consistent with the 500-cap / 137-remaining / 120-conditional math from the FY2025 IDFPR Annual Cannabis Report.
- **293 = legacy fiction:** High. No current source cites 293. The brand voice audit already flagged it as not traceable.
- **Recommended homepage fix:** Trust-first, matches voice spec, doesn't require external dependency to ship.

## Final answer to the unblock question

**Primary source URL (for automated checking):** https://idfprapps.illinois.gov/LicenseLookup/AdultUseDispensaries.pdf

**Best current estimate (as of early April 2026):** **244 operational adult-use dispensaries in Illinois.** Source: IDFPR active license list as summarized by GrowerIQ and Cannabis Industry Lawyer in 2026 search results; reconciled against the 500-license cap and FY2025 IDFPR Annual Cannabis Report.

**Homepage copy recommendation:** Drop the hardcoded 293. Use "tracking {trackedCount} dispensaries · adding more weekly" where `{trackedCount}` is live from the DB. If a total-opportunity number is needed elsewhere (about page narrative), "~244" is the number to use, with the IDFPR URL cited.

## Sources

- [IDFPR Active Adult Use Dispensing Organization Licenses (PDF)](https://idfprapps.illinois.gov/LicenseLookup/AdultUseDispensaries.pdf)
- [Cannabis Regulation Oversight Office](https://cannabis.illinois.gov)
- [IDFPR Jan-Feb 2026 Sales Figures](https://idfpr.illinois.gov/news/2026/adult-use-cannabis-sales-figures-released-jan-feb-2026.html)
- [IDFPR FY2025 Annual Cannabis Report](https://cannabis.illinois.gov/content/dam/soi/en/web/cannabis/documents/media/reports-and-public-presentations/Compiled-Cannabis-Annual-Report-2025.pdf)
- [GrowerIQ Illinois License Guide 2026](https://groweriq.com/illinois-cannabis-license-complete-guide/)
- [Cannabis Industry Lawyer IL Guide 2026](https://www.cannabisindustrylawyer.com/illinois-cannabis-license-2026-guide/)
- [Mood Shine: IDFPR Annual Cannabis Report 2025 Summary](https://www.moodshine.com/idfpr-annual-cannabis-report-2025-what-matters-for-2026-in-illinois/)
- [Cann.dev Illinois Retail April 2026](https://www.cann.dev/illinois-cannabis-retail-april-2026/)
- [Illinois News Joint 2026 Sales Release](https://illinoisnewsjoint.com/illinois-releases-first-two-months-cannabis-sales-for-2026/)
- [IDFPR Conditional Licenses List (PDF)](https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/forms/auc/Conditional%20Licenses%20List.pdf)
