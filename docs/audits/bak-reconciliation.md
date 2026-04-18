# `.local.bak` File Reconciliation — April 18, 2026

**Run by:** Cowork (autonomous sprint)
**Context:** During the April 17 rebase, four local docs were backed up as `*.md.local.bak` when origin/main arrived with its own version of the same filenames. All four origin siblings are now the tracked/canonical version on main. This doc decides what to do with each `.bak`.

**Source pairs:**
| Canonical (on main) | Local backup | Lines (canon / bak) |
|---|---|---|
| `HANDOFF-UPDATE.md` | `HANDOFF-UPDATE.md.local.bak` | 198 / 115 |
| `docs/ENV-VARS.md` | `docs/ENV-VARS.md.local.bak` | 149 / 140 |
| `docs/LAUNCH-CHECKLIST.md` | `docs/LAUNCH-CHECKLIST.md.local.bak` | 129 / 93 |
| `docs/ZONE4-strategy.md` | `docs/ZONE4-strategy.md.local.bak` | 139 / 41 |

Raw unified diffs preserved at `/tmp/audit/baks-diff.txt` in this session.

---

## Summary

| File | Verdict | Action for Code |
|---|---|---|
| `HANDOFF-UPDATE.md` | **MERGE-NEEDED** | Splice 3 sections from `.bak` into canonical |
| `docs/ENV-VARS.md` | **MERGE-NEEDED** | Splice 4 sections + sanity-check script block from `.bak` |
| `docs/LAUNCH-CHECKLIST.md` | **MERGE-NEEDED** | Splice verification scripts + performance baseline from `.bak` |
| `docs/ZONE4-strategy.md` | **MERGE-NEEDED** | Splice MCP-layer Phase 3 spec + strategic framing from `.bak` |

**Zero OBSOLETE. Zero DUPLICATE.** Each backup contains content the canonical version is missing. The `.bak`s were good drafts, not redundant copies. After Code completes the merges below, delete the four `.bak` files.

---

## HANDOFF-UPDATE.md — MERGE-NEEDED

### Unique to `.bak` — preserve

1. **"Stack" section** (lines 222–230 of .bak) — Next.js 16, React 19, TypeScript 5, Tailwind v4 (PostCSS plugin) plus inline styles note, Supabase with RLS specifics, "Vercel (production = main branch, previews per PR)", repo URL. **The stack-version specifics are only in the `.bak`.**

2. **"Recent commit context (last 10)" code block** (lines 285–298 of .bak) — snapshot of commits `8005886 → 84b6383` with messages. Historical signal for future agents reading this doc later to understand the April 15 code state.

3. **"Sprint deltas (this Cowork run)" section** (lines 302–317 of .bak) — enumerates the specific file-level fixes that sprint produced: duplicate `background` property on `app/cannabis/illinois/[slug]/deals/page.tsx:140`, removed `eslint` block from `next.config.ts`, file moves (`top-10-illinois-cities-content-plan.md` → `docs/`, `PROJECT_STATE.md` → `docs/`, `column-audit.txt` → `docs/audits/`), deleted stub `correct`. **This provenance information is not in the canonical version.**

### Unique to canonical — keep

- Two-Vercel-projects table (directory-network vs directory-network-)
- Numbered, priority-ranked "Current Blockers" list (`[BLOCKING]`, `[HIGH]`, `[MEDIUM]` tags)
- "What Is Working (Verified Against Live Site)" checklist
- "Workflow Rules (for next Code session)" section

### Merge recommendation

Open canonical `HANDOFF-UPDATE.md` and splice:
- The **Stack** section in after "Project Identity" (around origin line 33).
- The **Recent commit context** block in after "File Structure Changes" (around origin line 130), relabeled "Commit context as of April 15" to signal staleness.
- The **Sprint deltas** section in as a new subsection under "File Structure Changes" — it's more specific than the current "New files created" list.

Then delete `HANDOFF-UPDATE.md.local.bak`.

---

## docs/ENV-VARS.md — MERGE-NEEDED

### Unique to `.bak` — preserve

1. **`STRIPE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` section** (.bak lines 405–407) — flags the variable as declared in `.env.example` but not yet referenced in code; directs to set on Vercel preemptively. **Highly relevant for Phase 2.**

2. **`STRIPE_WEBHOOK_SECRET` section** (.bak lines 409–411) — planning note for the webhook signing secret, including "get from Stripe → Developers → Webhooks → your endpoint → Signing secret." **Directly needed by Code Task 6 (webhook skeleton).**

3. **"Planned but not yet wired (flagged)" section** (.bak lines 579–585) — an explicit placeholder for `RESEND_API_KEY` and future env vars that should be documented ahead of their feature build.

4. **"Sanity check before deploys" section** (.bak lines 586–601) — bash block with a `node -e` loop that iterates through required env names and prints OK / MISSING, plus a `vercel env ls production` reminder. **Highly operational — use this verbatim.**

5. **"Naming standards going forward" section** (.bak lines 604–609) — explicit rule: `NEXT_PUBLIC_*` only when the browser needs it; no alias creep; `.env.example` sync rule. **Useful guardrail for future sprints.**

6. The aliasing detail on `SUPABASE_SERVICE_KEY` vs `SUPABASE_SERVICE_ROLE_KEY` (.bak lines 361–363 and 365–367) — the canonical version has both variables listed separately without calling out that they're aliases or that code references drift between them. **Merge the `.bak`'s alias-cleanup guidance.**

### Unique to canonical — keep

- **"BLOCKING BUILD ISSUE" opening block** — the 2-minute-fix narrative framing at the top. This is the post-rebase operational priority that the `.bak` doesn't surface.
- **Status column on summary table** — "SET in cleanlist.co env, MISSING in puffprice.com env" is rebase-era ground truth.
- **"Setup Checklist (new environment)" section** — the minimum-viable vs pre-launch bullet split. Keep; it's a handy new-env onboarding path.

### Merge recommendation

- Splice `.bak`'s `STRIPE_PUBLISHABLE_KEY` and `STRIPE_WEBHOOK_SECRET` sections into the existing Stripe block (around origin line 98).
- Splice `.bak`'s **alias-cleanup callouts** (for `SUPABASE_SERVICE_KEY` and `SUPABASE_URL`) as "Action" bullet points under the existing Supabase entries.
- Append `.bak`'s **Sanity check before deploys** and **Naming standards going forward** as new sections at the end, above the current final line.
- Consider adding `.bak`'s **"Planned but not yet wired"** section as a stub — it invites discipline about documenting env vars ahead of code.

Then delete `docs/ENV-VARS.md.local.bak`.

---

## docs/LAUNCH-CHECKLIST.md — MERGE-NEEDED

### Unique to `.bak` — preserve

1. **"Verification scripts (run before banner deploy)" bash block** (.bak lines 789–811) — a ready-to-copy-paste pre-deploy sanity loop:
   - `npm run build`
   - `npx tsc --noEmit`
   - `vercel env ls production | grep -E "(SUPABASE|STRIPE|GA_ID|SITE_URL|ADMIN_PASSWORD)"`
   - TTFB curl loop, sitemap count, Stripe price resolver
   **This is genuinely valuable — keep it in the canonical file.**

2. **"Performance baseline captured this sprint" table** (.bak lines 813–821) — documented warm-TTFB numbers for `/`, `/cannabis/illinois/peoria`, `/deals/all`, and the 10.8s cold-start mitigation note. Historical measurement worth retaining as a before/after point.

3. **"Anything in this list that requires Matthew specifically" section** (.bak lines 825–831) — explicit list of items only Matthew can do (domain registration, DNS, Vercel env entry, Supabase service-role SQL, Wave 2 outreach). **Role-clarity is valuable for multi-agent work.**

### Unique to canonical — keep

- **CRITICAL: Fix Before Anything Else** section — the post-rebase priority framing.
- **Current Deployment Status** table with two Vercel projects.
- **Key Files for Launch** list.
- More detailed "SEO & Schema" and "Zone 4 Strategy" sub-checklists.
- Status-key legend (`[x]` / `[ ]` / `[~]`).

### Merge recommendation

- Append **Verification scripts** as a new section after "Post-Launch Week of April 21+".
- Append **Performance baseline** as a new subsection under Verification scripts.
- Append **"Anything in this list that requires Matthew specifically"** as the final section before Key Files.

Then delete `docs/LAUNCH-CHECKLIST.md.local.bak`.

---

## docs/ZONE4-strategy.md — MERGE-NEEDED (highest priority merge of the four)

This is the most important reconciliation in this audit. The canonical version has more tactical detail, but the `.bak` captures the **strategic vision** — and that vision is explicitly called out in `CLAUDE.md` as the Zone 4 endgame ("Phase 3 target: public MCP server at mcp.puffprice.com"). Losing the MCP-layer content would be a real loss.

### Unique to `.bak` — preserve (all of this is strategically important)

1. **"The Observation" opening** (.bak lines 982–985) — the core thesis:
   > "There is zero purpose-built tooling for cannabis/dispensary directories in the AI/MCP ecosystem. No MCP server for Illinois dispensary deals. No structured deal feed for AI systems to query. Weedmaps and Leafly have domain authority. They are not thinking about AI citation. We can own this."

2. **"The Goal" single-sentence framing** (.bak lines 987–988):
   > "When someone asks Claude, ChatGPT, or Perplexity 'where are dispensary deals in Chicago today?' — PuffPrice is the cited source."

3. **Phase 3 — API / MCP Layer spec** (.bak lines 1001–1010) — actual tool signatures for a public MCP server:
   ```
   get_deals_by_city(city, state) → Deal[]
   get_deals_by_zip(zip) → Deal[]
   get_dispensary(slug) → Dispensary + CurrentDeals
   ```
   Plus the consequence framing: "Claude Desktop users query our data natively. Developers building cannabis apps point to us instead of scraping Weedmaps. We become infrastructure, not just a site."

4. **"The Window" closing argument** (.bak lines 1013–1016):
   > "Weedmaps will never build an MCP server. Their incentive is keeping users on their platform. Ours is being wherever the user is — including inside an AI answer. This window is open now. It closes when someone else does it."

5. **Phase 2 — `data.puffprice.com/deals.json` machine-readable feed idea** (.bak line 998) — staircase between the schema/citation layer (Phase 1) and the MCP server (Phase 3).

### Unique to canonical — keep

- **Phase 1 completion status** with concrete deliverables (LocalBusiness, Product, SpecialAnnouncement, ItemList, BreadcrumbList all shipped Apr 15).
- **Phase 2 NAP citations + backlink strategy** — Leafly, Weedmaps, Yelp, BBB, Reddit r/ILTrees sidebar, local PJStar/CIProud outreach.
- **Phase 3 City Landing Page structure** — H1 format, answer-paragraph pattern, FAQ section.
- **Phase 4 E-E-A-T authority signals** — About page, methodology page, press mentions, UTM tracking.
- **Current Status table**, **Key Metrics to Track**, **Resources** section.

### Merge recommendation

The cleanest merge is to restructure the canonical into a **Vision → Phases** layout rather than a pure phase list:

1. **Top:** Add "The Observation" and "The Goal" from `.bak` as the new opening before "What Is Zone 4?". This gives the doc a strategic frame that's currently missing.
2. **Phase 3:** Rename to "Phase 3: Content Expansion + Machine-Readable Layer". Fold in `.bak`'s `data.puffprice.com/deals.json` idea as a new bullet. Keep all the canonical content on city pages and categories.
3. **Add Phase 5: MCP Server (Month 3–6):** Create a new phase after Phase 4 using `.bak`'s Phase 3 content — the three tool signatures, the "we become infrastructure" framing, and "The Window" closing argument. This aligns the doc with the CLAUDE.md claim of a public MCP server at `mcp.puffprice.com`.
4. **Current Status table:** Add a row for Phase 5 (MCP Server) marked "NOT STARTED — Month 3–6 target."
5. **Update Key Metrics to Track:** Add rows for `data.puffprice.com` query count (Phase 2) and MCP tool invocations (Phase 5).

Then delete `docs/ZONE4-strategy.md.local.bak`.

---

## Execution notes for Code

- All four merges are **additive** — the `.bak` content is being folded into the canonical, not replacing it. No canonical content is being removed.
- After merging, delete the four `.bak` files. They're currently untracked; `rm` from shell and done.
- Commit the four merged docs in a single commit with message: `docs: reconcile post-rebase .bak files into canonical versions (ENV-VARS, LAUNCH-CHECKLIST, HANDOFF-UPDATE, ZONE4-strategy)`.

## Open questions for Matthew

1. **ZONE4-strategy.md** — the MCP Layer phase is strategic and visionary. Do you want it in a single doc with the rest of Zone 4, or split into `docs/zone4-mcp-layer.md` as a standalone brief so it can be shared externally (with investors, partners, developers) without the in-the-weeds Phase 1/2/3 tactics?
2. **Performance baseline table in LAUNCH-CHECKLIST** — the 10.8s cold-start TTFB is now ~10 days old. Do we want Code to re-measure and replace, or keep the April 15 baseline as a point-in-time reference with a "measured Apr 15" timestamp?
3. **"Recent commit context" block in HANDOFF-UPDATE.md** — same question. Freeze as historical point-in-time, or refresh to current HEAD~10?
