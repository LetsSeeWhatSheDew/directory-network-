# Brand partnership program spec — PuffPrice (2026-04-22)

**Status:** Spec only. No build. This is the pitch foundation for the post-MRR conversation.
**Pre-condition for launch:** PuffPrice has at least one of (a) measurable monthly active users in Illinois, (b) a paid Pro subscriber base, (c) a documented attribution path. None of those exist yet.
**Audience:** Matthew, when a brand partnership conversation comes up.
**Builds on:** `docs/research/affiliate-revenue-feasibility-20260421.md` (the landscape) and `docs/research/affiliate-shortlist-20260421.md` (the 5-brand pilot list).
**Conflict-of-interest constraint:** Editorial independence (PuffPrice Index, Top 5% badge, deal ranking) MUST NOT be for sale. Brand money buys placement, not ranking. This is the line.

---

## 1. Why this exists separately from "affiliate"

The affiliate research correctly concluded: **federal cannabis law kills classic CPC/CPA affiliate economics** for THC brands in Illinois. There's no link to click that earns a commission, because dispensaries can't ship THC.

That leaves three viable revenue models with brands:

1. **Sponsored placement (flat fee)** — brand pays for owned real estate on PuffPrice
2. **Co-marketing partnerships** — brand pays for editorial content (with disclosure)
3. **Data licensing** — brand pays for aggregated demand signals from the PuffPrice deal corpus

This doc specs models 1 and 2. Model 3 is a separate spec — it requires the data warehouse work that's still on the roadmap (Zone 4).

---

## 2. Revenue model — three brand tiers

### Bronze — $500/month

**What the brand gets:**
- Polished `/brand/[slug]` page with full brand bio, IL distribution map, current deals across IL, anchor SKU pricing (see `lib/brands.ts` + `app/brand/[slug]/page.tsx`)
- One newsletter mention per month in the PuffPrice weekly digest
- Quarterly demand report: "your brand was mentioned in X deals across Y dispensaries last quarter"

**Term:** Month-to-month, 30-day notice to cancel.
**Best fit:** Mid-size IL craft brand looking for digital-presence parity with the larger MSO house brands.

### Silver — $1,000/month

Everything in Bronze, plus:
- "Featured Brand" badge on every deal card whose deal mentions the brand (visual differentiation in the feed)
- Featured spot in the homepage "Brands we cover" rotation (1 of 5 slots, rotated weekly)
- Co-marketed deal-of-the-week: brand-supplied promo gets editorial highlight in the digest IF and ONLY IF it meets the editorial standards (real discount, verifiable, available in ≥3 IL dispensaries)
- Monthly analytics: clicks on the brand page, brand-mention deal CTR, top dispensary partners

**Term:** 3-month minimum, then month-to-month.
**Best fit:** Brand actively running multi-dispensary promos and wanting the deal traffic correlation.

### Gold — $2,000/month

Everything in Silver, plus:
- Sponsored content: 1 long-form editorial post per month on `/brand/[slug]` pages or the PuffPrice blog (clearly marked "Sponsored by [Brand]" — never disguised editorial)
- Quarterly Pro-subscriber email: brand gets a cross-posted blast to opted-in Pro subscribers (max 1/quarter to prevent fatigue)
- Custom UTM tagging on outbound brand-page → dispensary-website redirects, attribution dashboard access
- White-glove pricing change notification: brand alerts PuffPrice when a price changes, PuffPrice cross-checks anchor SKU data within 24h
- Two 30-min strategy calls per quarter (Matthew or successor)

**Term:** 6-month minimum.
**Best fit:** Top-tier brand making a real bet on PuffPrice as a discovery channel.

---

## 3. Placement inventory map

What the brand actually gets in pixels:

| Placement | Bronze | Silver | Gold | Notes |
|---|---|---|---|---|
| Brand profile page (`/brand/[slug]`) | Polished | Polished + featured | Polished + featured + sponsored content | Always editorial-controlled |
| Brand badge on deal cards (visible in /deals/all and /deals/[category]) | — | ✅ | ✅ | Visual differentiation only — does NOT change ranking |
| Homepage "Brands we cover" carousel (5 rotating slots) | — | 1 slot/week | 2 slots/week | Slots filled algorithmically, not auctioned |
| Newsletter mention | 1/mo | 1/mo + co-marketed deal | 1/mo + co-marketed deal + Pro blast | Disclosure required |
| `/brand` index page priority | Alpha order | Alpha order | Pinned-to-top section above the fold | Visual differentiation |
| Custom UTM redirect tracking | — | — | ✅ | Requires `/api/redirect/[uuid]` route — Code work |

**What is NEVER for sale:**
- Position in deal feed ranking (`scoreDeal()` in `app/api/deals/recommend/route.ts`)
- Position in PuffPrice Index calculation or display
- Top-rated dispensary badge logic
- "Best deal" labeling on individual deals
- Editorial language in deal copy

This list is the firewall. If a brand asks for any of the above, the answer is no — and they get told why up front.

---

## 4. Attribution model — proving ROI

The biggest objection from a brand will be: "How do I know any of this drove sales?" Three layers of evidence to offer:

### Layer 1 — placement metrics (no infrastructure required)

- Brand page views (Google Analytics, already wired)
- Outbound clicks to brand's own website from `/brand/[slug]` (track via `<a>` event)
- Deal cards displayed featuring the brand (DB query, already possible)

This is shipping today via GA + Supabase. Bronze tier reports use these.

### Layer 2 — UTM-tagged outbound clicks (Code work needed, ~1 week)

When a Silver or Gold brand has a "visit our menu at [dispensary]" link on `/brand/[slug]`, route it through `puffprice.com/r/{uuid}` which (a) records the click in `deal_clicks`, (b) appends `?utm_source=puffprice&utm_medium=brand-page&utm_campaign={brand}` to the destination URL, (c) 302 redirects.

Brand sees the resulting traffic in their Google Analytics, Shopify, etc. PuffPrice sees the click count. Both sides have matching attribution.

### Layer 3 — survey-based proxy (manual, low-effort)

When a Pro subscriber upgrades, a 1-question survey: "How did you hear about PuffPrice?" with brand options as multi-select choices. Aggregated quarterly into the Gold-tier brand report.

This doesn't prove the brand drove the upgrade, but it's a directional signal and brands appreciate it.

### Layer 4 — sales lift via dispensary co-mention (Phase 2)

When a brand-mentioned deal is clicked, follow up 7 days later asking: "Did you visit [dispensary]? Did you buy [brand]?" via Pro-subscriber email. Highly opt-in. Low response rate but the responses are gold.

Don't promise this in year 1.

---

## 5. Conflict-of-interest policy (the firewall)

To maintain editorial trust, PuffPrice publicly commits:

1. **Deal ranking is algorithmic and disclosed.** The ranking algorithm in `app/api/deals/recommend/route.ts` is public on GitHub. Any change is logged. No brand input can adjust score weights.

2. **Brand badges are visual, not algorithmic.** A "Featured Brand" badge appears on a deal card in the same position regardless of ranking. The deal can't move up the feed because the brand pays.

3. **PuffPrice Index excludes paid placements.** The price-per-gram benchmark uses anchor SKU data from documented public dispensary listings only. No brand-supplied pricing.

4. **Sponsored content is labeled.** The word "Sponsored" appears at the top and bottom of any post a brand has paid for, in the same font and weight as "Editorial".

5. **Negative coverage is preserved.** If a brand recalls a product or has a quality issue, PuffPrice will report it. The brand partnership doesn't gag editorial. (Cancel-anytime contracts make this defensible — a brand can't sue for breach of "agreement to not say bad things" because no such clause exists.)

6. **Top-rated dispensary badge is independent.** The badge logic uses Google rating + deal density + freshness. Brand money does not influence which dispensaries earn it.

7. **Disclosure surface:** these commitments live publicly at `puffprice.com/why-puffprice` (page already scaffolded but not populated). Add a "Brand partnerships and editorial independence" section.

This firewall is the biggest pitch advantage PuffPrice has against legacy directories that sold their ranking. Make it a feature.

---

## 6. Launch readiness — what needs to exist before the first pitch

Before Matthew picks up the phone for a Bronze pitch:

- [x] `/brand/[slug]` page scaffolded — exists as `app/brand/[slug]/page.tsx`
- [ ] `lib/brands.ts` populated with 5 real brands (currently a stub per `CLAUDE.md`)
- [ ] One published `/brand/[slug]` for each of the 5 pilot brands (Cresco, GTI, PAX, Kiva, Wyld already drafted in `docs/drafts/brand-outreach-20260421/`)
- [ ] Newsletter platform live (Resend wiring per `docs/ENV-VARS.md` — not set)
- [ ] Brand page analytics dashboard (read-only Supabase query; Code can ship in 2-4 hours)
- [ ] `/why-puffprice` page populated with the editorial-independence commitments above

Before Matthew pitches Silver:

- All Bronze items above
- [ ] Brand badge component shipped on deal cards
- [ ] Homepage "Brands we cover" carousel built (Code: ~1 day)
- [ ] Co-marketed deal-of-the-week selection process documented (Cowork: ~2 hours)

Before Matthew pitches Gold:

- All Silver items above
- [ ] UTM redirect tracking infrastructure (`/r/[uuid]` route)
- [ ] Pro subscriber email blast capability (depends on Stripe Path B + Resend)
- [ ] Quarterly analytics export template (Cowork: ~3 hours)

**Realistic timeline:** Bronze-ready in 2-3 weeks if Code prioritizes the brand-page analytics dashboard + newsletter wiring. Silver-ready 4-6 weeks. Gold-ready 8-12 weeks.

---

## 7. First-conversation pricing handling

The first 3 brand conversations will set anchoring for everything that follows. Recommended approach:

* **Lead with Bronze.** $500/mo is small enough to be a no-brainer for a brand running >$50k/mo of IL marketing. They'll either say yes (great — first revenue) or counter with "what does it actually do for me" (great — it surfaces the value conversation).
* **Don't quote Gold first.** Anchoring at $2,000/mo when the brand has never heard of PuffPrice triggers a "we'll think about it" graveyard.
* **Have a "$0 trial" option:** Brand gets Bronze placement for 60 days free, in exchange for a quarterly written testimonial PuffPrice can use in future pitches. This converts "want to think about it" into "let's just try it" — which becomes Bronze tier renewals at month 3.
* **No discount for annual commit at this stage.** Cash flow predictability is fine but PuffPrice doesn't have the operational maturity to honor a 12-month commit if priorities shift.

---

## 8. The first 5 pitch targets

From the existing affiliate shortlist (`docs/drafts/brand-outreach-20260421/`), with this program in mind:

| Brand | Why first | Recommended tier | Notes |
|---|---|---|---|
| **Cresco Labs** | Largest IL deal mention volume; multiple house brands (High Supply, Mindy's, Good News) — multi-tier potential | Silver | Pitch the "rolled-up brand visibility" angle in the Cresco draft |
| **GTI** | Comparable scale to Cresco; Dogwalkers + Rythm + Incredibles | Silver | Same multi-brand pitch |
| **Aeriz** | Premium independent IL craft flower; would benefit MOST from differentiated brand badge | Bronze → Silver | Best fit for "brand-of-the-month" co-marketing |
| **Kiva Confections** | Out-of-state edibles brand making IL push; clear cross-state brand-equity play | Bronze | Test the OOS-brand fit |
| **PAX Labs** | Hardware brand, federally legal, has actual affiliate program — easiest "yes" | Bronze | Bridges affiliate program (existing) with brand-page program (new) |

---

## 9. What NOT to build

These will sound like good ideas in a pitch meeting. Decline them gracefully:

- **Pay-per-click on deal cards.** Breaks the editorial integrity firewall.
- **"Sponsored" deals that look like editorial deals.** Same reason.
- **Exclusive category sponsorship.** "Cresco owns the Flower category" creates anti-competitive vibes and pisses off competing brands.
- **Brand-controlled deal copy.** PuffPrice writes deal cards in PuffPrice voice. Brands can supply raw promo data; PuffPrice publishes it in PuffPrice tone.
- **Removing competitor mentions.** Never agree to suppress a competitor's deals on a sponsored brand's behalf.

---

## 10. Open questions / decisions for Matthew

1. **Pricing — $500/$1,000/$2,000 or different anchors?** The numbers above are research-backed for content sites of comparable size. Cannabis marketing budgets are larger than typical SaaS partnerships, so could go higher (Bronze $750, Silver $1,500, Gold $3,000). But anchoring lower until first deal closes builds momentum.
2. **Tier names — Bronze/Silver/Gold or PuffPrice-native (e.g., Sprout / Bloom / Harvest)?** Branded tier names test better in cannabis but require more explanation. Suggest using metallic for v1, switch to branded if it feels generic.
3. **Editorial review of sponsored content — who writes, who edits, who approves?** Recommend: brand drafts, PuffPrice rewrites in voice, brand approves final. Locks 24-48 hour publication windows.
4. **Refund policy on partial-month cancellations?** Recommend: pro-rate Bronze (smaller commitment), no refund on Silver/Gold (longer commit).
5. **Cancellation timing — same-day or end-of-billing-cycle?** Recommend: end-of-billing-cycle to preserve cash flow predictability.

---

## 11. Companion files

- `docs/research/affiliate-revenue-feasibility-20260421.md` — the landscape research
- `docs/research/affiliate-shortlist-20260421.md` — the 5 pilot brand list
- `docs/drafts/brand-outreach-20260421/` — the cold outreach drafts
- `lib/brands.ts` — brand data layer (stub; populate before pitch)
- `app/brand/[slug]/page.tsx` — brand profile page (scaffolded)
- `app/why-puffprice/` — editorial independence commitments page (TODO)
