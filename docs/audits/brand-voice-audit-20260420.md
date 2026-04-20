# Brand Voice Audit — 2026-04-20

> **Voice spec (locked):** *Best Bud For Your Buck$* / *Low Prices. High Times.* / plain-spoken, slightly cheeky, trust-first.
> Note: per session prompt, the Tribe AI brand-voice skill was not loaded last session — this audit is the manual pass against the spec, not skill-assisted.

## What's working (don't touch)

- **`app/page.jsx:921-922`** — hero h1 + subhead. `Best Bud For Your Buck$` and `Low Prices. High Times.` are the locked tagline rendered exactly. Anchor of the brand.
- **`app/about/page.tsx:71`** — `"We built the thing we wished existed."` First-person, plain, slightly tired, lets you trust the writer. Keep verbatim.
- **`app/about/page.tsx:74-81`** — paragraph that opens with `"got tired of driving to a dispensary only to find out the deal they saw on Instagram was expired"` — earned, specific, customer-shaped. Keep verbatim.
- **`app/page.jsx:984-986`** — `"You save money."` Three-word step. Plain. Trust-first. Keep.
- **`app/page.jsx:1041-1044`** — `"Never miss a deal near you / Free email alerts when a better deal drops in your city."` On-voice. Keep.
- **`app/page.jsx:1087-1089`** — `"Own an Illinois dispensary? Your listing is always free — claim it in under a minute."` Honest, direct, no-jargon. Keep.

## Drift — flagged with before/after

### 1. `app/page.jsx:1051` — homepage stats footer

**Before**
```
<strong>{dealCount}</strong> active deals · <strong>293</strong> dispensaries · <strong>162</strong> cities
```

**Drift:** Two of the three numbers are fictional (see 293-reconciliation-20260420.md). Voice is "trust-first." Hardcoded fictions on the homepage corrode every other trust claim. Fixing this also fixes the trust drift, not just the count.

**After**
```
<strong>{dealCount}</strong> active deals across Illinois · {dispensaryCount} dispensaries · adding more weekly
```
or, if dynamic counts are too much for one ship:
```
<strong>{dealCount}</strong> active Illinois deals · updated daily
```
Keep the brag tone, drop the false numbers. Plain-spoken, slightly cheeky still works ("we don't pad the count").

### 2. `app/alerts/page.tsx:73` — free-tier feature bullet

**Before**
```
"Browse all 293 Illinois dispensaries"
```

**Drift:** Same fiction. Worse here because it's a value-prop bullet — the user reads this as a promise.

**After**
```
"Browse every Illinois dispensary in our directory — every deal, no account"
```
Voice-aligned: trust-first ("every deal, no account") and slightly cheeky ("every one we've got"). Promises something we can keep.

### 3. `app/about/page.tsx:84-88` — middle paragraph claim about price-per-gram normalization

**Before**
```
PuffPrice aggregates deals from Illinois dispensaries, normalizes
pricing to price-per-gram, and shows you the best deal near you
right now.
```

**Drift:** "Normalizes pricing to price-per-gram" is **not true today** — `price_per_gram` is null on every deal in the DB (see puffprice-index-feasibility-20260420.md). When a customer reads this and then doesn't see $/g anywhere on the site, the trust claim breaks. Voice is "trust-first" — this line is a future-state promise sold as present-state.

**After (option A — promise honestly)**
```
PuffPrice pulls deals from Illinois dispensaries, ranks them by
how much you'd actually save, and tells you which one's worth the
drive right now. We're working on a price-per-gram index — coming soon.
```

**After (option B — drop the future-state line entirely)**
```
PuffPrice pulls deals from Illinois dispensaries, ranks them by
how much you'd actually save, and tells you which one's worth the
drive right now.
```

Either is on-voice. Option B is cleaner and avoids creating a clock for the Index ship date.

### 4. `app/about/page.tsx:91-93` — coverage promise

**Before**
```
We're covering Illinois dispensaries one city at a time. If
yours isn't in our directory yet, email us and we'll add
you within 48 hours.
```

**Drift:** Mostly good. "We'll add you within 48 hours" is a service-level promise that may not survive a busy week. Voice is "trust-first" — promises should clear the bar 100% of the time, not 80%.

**After**
```
We're covering Illinois dispensaries one city at a time. If
yours isn't in our directory yet, email us — we'll get you
listed fast (usually within a couple days).
```
"Fast" + soft window keeps the spirit, removes the SLA risk. Voice intact.

### 5. `app/about/page.tsx:94-96` — funding claim

**Before**
```
Every listing is free for dispensaries, forever. PuffPrice is funded
by Pro subscribers ($0.99/month) who want instant SMS when prices drop.
That's the whole model.
```

**Drift:** **MRR is currently $0** (per Code Task 8 patch context). The line "PuffPrice is funded by Pro subscribers" is technically false today — there are no Pro subscribers. Trust-first voice fails when a foundational claim about the business model is fabricated.

**After**
```
Every listing is free for dispensaries, forever. The plan: keep PuffPrice
funded by Pro subscribers ($0.99/month) who want instant SMS when prices
drop near them. No ads, no sponsored placements, no selling your data.
That's the whole model.
```
"The plan" is honest about pre-revenue stage. "No ads / no sponsored / no data sale" reinforces trust-first while doing real work.

### 6. `app/about/page.tsx:103` — closing tagline

**Before**
```
Built in Peoria, Illinois. 🌿
```

**Verdict:** Mostly fine. The leaf emoji is consistent with the visual identity. Keep, but consider removing the period before the emoji — `Built in Peoria, Illinois 🌿` reads slightly more cheeky-casual.

### 7. `app/page.jsx:954` — second-section H2

**Before**
```
Browse by what you want
```

**Drift:** Plain, but a bit corporate-CTA. Voice is plain-spoken AND slightly cheeky — this is plain without the cheek.

**After (option A — small voice push)**
```
Pick your poison
```
or
```
What are we shopping for?
```

Both are slightly cheeky in cannabis-specific ways. Option B is friendlier. Option A risks DEA-jargon eyebrow but matches voice spec strictly.

### 8. `app/page.jsx:981` — how-it-works step 2

**Before**
```
We find the best deal right now
```

**Verdict:** On voice. Keep.

### 9. Hero meta description (`app/about/page.tsx:3`)

**Before**
```
"We built the thing we wished existed. PuffPrice finds the best cannabis deals near you in Illinois."
```

**Verdict:** Strong. Keep.

### 10. `app/page.jsx:1093` — secondary biz CTA

**Before**
```
"Submit a deal"
```

**Drift:** Generic SaaS button copy. Voice would say "Drop a deal" or "Got a deal? Tell us." Pick your spot — small surface, optional.

**After (light)**
```
"Got a deal? Send it →"
```

## Drift summary

| Surface | Drift type | Severity |
|---|---|---|
| Homepage stats footer | Trust-first violated by false numbers | **HIGH** (load-bearing for credibility) |
| `/alerts` features bullet "293" | Trust-first violated by false promise | **HIGH** (above-fold marketing copy) |
| `/about` price-per-gram claim | Trust-first violated by future-state-as-present | **MEDIUM** (harder to spot but corrodes when noticed) |
| `/about` 48-hour SLA | Trust-first risk | LOW-MEDIUM |
| `/about` Pro-subscriber funding | Trust-first violated (pre-revenue framed as funded) | **MEDIUM-HIGH** (founder authenticity) |
| H2 "Browse by what you want" | Voice flat, missing cheek | LOW (style polish) |
| "Submit a deal" button | Voice flat | LOW |
| `🌿` punctuation around emoji | Style polish | LOW |

## Net

The voice spec is **applied correctly in the headline and the about-page intro**. The voice **breaks where the page makes quantitative or business-state claims** — homepage stats, alerts feature bullet, about-page funding/normalize-PPG lines. Those are the places where "trust-first" is the load-bearing word and the copy is currently sub-honest.

Three high-impact fixes ship the voice cleanup in one PR:

1. Replace `293`/`162` numbers on homepage + `/alerts` with dynamic-or-honest framing (Code Task 8 scaffolding has the SUM/COUNT helpers; wire them up).
2. Edit `/about` price-per-gram line to "coming soon" or remove.
3. Edit `/about` "is funded by" line to "the plan: funded by" until first $.

Everything else is style polish and can wait.

## What I did NOT touch

- The 4/20 banner copy (`FourTwentyBanner` component) — not in the read-only audit scope.
- `/upgrade` pricing page copy — not enumerated in the spec for this audit.
- Footer (`app/page.jsx:1098-1107`) — links only, no body copy.
- `LocationAware` line in hero — dynamic component not visible from static read.

If brand voice gets a second pass next session, those are the next surfaces to audit.
