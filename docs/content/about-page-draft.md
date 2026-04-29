# About page — draft copy
**Date:** 2026-04-28 (night)
**Author:** Cowork (Claude), in Matthew's voice
**Status:** Ready for Code to wire into `app/about/page.tsx`. Replaces current body copy. Voice and tone reviewed against `docs/audits/brand-voice-audit-20260420.md`.
**Word count:** 312 (target: 200–400).

---

## Page metadata

```ts
title:       "About PuffPrice — Built in Peoria, Illinois"
description: "Cannabis deal finder for Central Illinois. Built by one person in Peoria because the existing tools cost too much and lie about coverage."
```

---

## Body copy (drop-in for the `<main>` of `app/about/page.tsx`)

> **Eyebrow:** ABOUT
> **H1:** We built the thing we wished existed.

PuffPrice tells you where to find the best cannabis deal near you in Central Illinois. That's the whole job.

It exists because every existing tool fails the same way. Weedmaps and Leafly have national coverage but the deals are stale, the prices are unverified, and half the listings are paid placement dressed up as ranking. The free tools work fine until you ask them what's actually 20% off in Peoria today, at which point they go quiet.

So I built a smaller thing that does one thing better. Direct from the dispensary's own website. Verified daily. Honest about what we know and what we don't. No paid placement, no menu reselling, no national-aggregator inventory passed off as real coverage.

We start in Central Illinois — twelve cities across the Peoria, Bloomington-Normal, Champaign-Urbana, Springfield, and the small-city belt between them. Real coverage in twelve cities beats fake coverage in a hundred. When we have a city locked, we'll add the next one. Not before.

The model is plain. Listings are free for dispensaries — forever. The plan is to fund PuffPrice through Pro subscriptions ($0.99 a month, when we ship them) for SMS alerts and a daily digest. No ads. No sponsored placements. No selling your data. If the model breaks, we'll tell you and figure something else out.

I'm Matthew. I live in Peoria. I built this on weekends because I got tired of driving across town for a deal that turned out to be expired or first-time-customer-only. If you've got a tip, a deal we missed, or a dispensary that should be listed, email me.

> **Contact line:** Tips, fixes, or a deal we missed? **[hi@puffprice.com](mailto:hi@puffprice.com)**
> **Footer line:** Built in Peoria, Illinois 🌿

---

## Voice notes for Code (so this doesn't get rewritten softer)

- Keep the line **"Real coverage in twelve cities beats fake coverage in a hundred."** It's the entire scope-lock argument in one sentence and it lands.
- Keep **"The plan is to fund..."** — this is honest about pre-revenue state. Don't change to "PuffPrice is funded by..." (that was the April 20 audit's flagged drift).
- Keep first-person `I` in the closing paragraph. Matthew is one person. The site doesn't pretend to be a team. That trust signal is worth more than any "we" plural would be.
- The contact email here is **`hi@puffprice.com`** to match `lib/brand.ts` (`supportEmail`). The current `app/about/page.tsx` uses `hello@puffprice.com` — that's the drift; align everything to `hi@puffprice.com` when this lands.
- Keep the leaf emoji on the footer line. One emoji, one place, on purpose (per identity package §2.6).

## Decisions baked into this draft

- **No Pro feature pitch in the about page.** The about page sells trust, not the upsell. The `/upgrade` page handles the pitch. About-page copy mentioning the price ($0.99) is fine because it's an honest disclosure of the funding model, not a CTA.
- **No "we" when there is no we.** The draft uses first-person where Matthew is talking and second-person where he's talking to the reader. The only "we" is when speaking as the site/product to the reader, which is acceptable institutional voice.
- **Specific numbers (twelve cities) instead of vague ones (several / many).** Per identity package §2.6 voice spec.
- **No "AI-powered," no "premium," no "curated."** The banned phrasebook is in §2.6.

## What the page does *not* say (and shouldn't)

- No "founded in [year]" line. We're not LinkedIn. The leaf in the footer says "this is finished, not corporate."
- No team page link. There is no team.
- No press / media kit. Not yet.
- No "as featured in" logos. Not yet, and not until earned.
- No "join the community" or "join our Discord." We are not a community product.

## Code tasks when this lands

1. Replace the body of `app/about/page.tsx` with the prose above.
2. Confirm the contact email reads `hi@puffprice.com` (match `brand.supportEmail` from `lib/brand.ts`).
3. Drop the "48-hour SLA" line from the existing about page. The brand-voice audit already flagged it as drift; this draft removes the line entirely.
4. Apply identity-package typography: H1 in Geist Display, body in Source Serif 4 (Georgia fallback), contact and footer in Inter.
5. Keep the eyebrow ("ABOUT") and the existing nav and back link as-is.
