# PuffPrice Brand Identity Package
**Date:** 2026-04-28 (night)
**Author:** Cowork (Claude), Big Boi mode authorized by Matthew
**Status:** **Locked.** Code's parallel visual upgrade session implements against this. Review/override only after seeing it on staging.

---

## Prior-art note (Phase 1 audit)

CLAUDE.md and prior session notes reference a "geometric two-tone wordmark (Concept 02)" and a "pin mark (Concept 03)" from an earlier exploration deck. **The deck is not in this repo.** Searched `docs/`, `public/`, every worktree under `.claude/`, and any file matching `*concept*`, `*wordmark*`, `*pin-mark*`, `*identity*`, `*explor*`. Nothing.

What does exist:
- `public/logo-512.png` — the current 512×512 raster mark in production. RGBA. No vector source committed.
- `public/logo.png` — 272×299 cropped header wordmark.
- `public/brand/logo.svg` — **not** the PuffPrice mark. It's a leftover "Project | Green" masthead from the multi-tenant parent. Should be deleted or namespaced; Code should be aware not to render it.
- `app/components/Logo.tsx` — renders `/logo-512.png` only.

Conclusion: **the exploration deck lives outside the agent's reach.** This package is a fresh-recommendation pass, not a re-application of Concept 02/03. If Matthew has the deck on Figma or a local drive and wants a different direction, he can override before Code ships visual.

---

## 2.1 Logo direction

**Decision: Option A — Wordmark only.**

`PuffPrice` set in **Geist Display, weight 700**, letter-spacing **−0.025em**, single line. The dollar-sign accent goes on the second `P`: the descender of the `P` in `Price` becomes a stylized `$` glyph (vertical bar through the bowl). Two-tone: `PuffPrice` set in navy, the `$` accent in primary green.

### Why A over B

A wordmark only is the right call until we have budget to commission a real symbol. Pin marks are the cliché in this category — every cannabis directory and every dispensary uses some variant of a leaf-in-a-pin or a pin-with-a-leaf. Adding one weakens the wordmark instead of supporting it. The `$`-as-`P` accent is distinctive, on-message ("Best Bud For Your Buck$"), and survives at favicon size.

If Matthew later wants a separate mark for OG cards, app icons, and merch, it should be commissioned — not improvised by Code. Until then, the wordmark scales from 16px favicon to billboard. **One mark, one job, no compromise.**

### Specs

| Property | Value |
|---|---|
| Font | Geist Display |
| Weight | 700 |
| Letter-spacing | −0.025em |
| Color (mark) | `#0F1F3D` (navy primary) |
| Color (accent `$`) | `#16A34A` (green primary) |
| Min height | 24px (header), 16px (favicon — strip wordmark, keep `$P` glyph only) |
| Max height | unbounded — vector |
| Header use | 32px height, navy on cream `#F5F4F0` |
| Footer use | 24px height, cream on navy `#0F1F3D` |
| Favicon | 32×32 — green `$` glyph alone, navy background |
| OG image | wordmark + tagline lockup, 1200×630 |

### Inverse / on-dark

When placed on navy or any color darker than gray-700:
- Wordmark color flips to `#FAFAF7` (warm white)
- Accent `$` stays `#16A34A` (it carries enough contrast on navy)

### Don't do

- No drop shadows. No bevels. No gradients on the mark.
- No "PuffPrice" in serif. The site's body is serif; the wordmark is the geometric counterweight.
- No leaf, no smoke, no flame icon attached to the wordmark. The `$` accent is the entire visual signature.

---

## 2.2 Color palette

The current site uses navy + green + cream — kept and locked to specific hexes. One warm secondary added (terracotta) to break the all-green monotony of the cannabis category. Status colors picked to read clearly against both light and dark backgrounds.

### Brand colors

| Role | Hex | Notes |
|---|---|---|
| **Navy primary** | `#0F1F3D` | Headers, body text on light bg, wordmark. Deep enough to be near-black; warmer than pure black. Already in use across `app/page.jsx`. |
| **Navy ink** | `#1E3A5F` | Secondary navy for subtle hierarchy. Already in use. |
| **Green primary** | `#16A34A` | CTAs, the `$` accent, "verified" badges, primary brand accent. Already in use. |
| **Green vibrant** | `#4ADE80` | Hover states on green CTAs, the pulse dot in the logo, micro-accents. Already in use. |
| **Green deep** | `#15803D` | Active/pressed CTA state, dark-mode CTA fill. |
| **Cream background** | `#F5F4F0` | Default light page background. Warmer than `#FFFFFF`. Reads "publication," not "form." Already in use. |
| **Pure white** | `#FFFFFF` | Card surfaces and inputs only. Cream is the page; white is the surface. |
| **Dark mode bg** | `#0A0A0B` | Reserved. Dark mode is not shipping in the visual upgrade — earmark the hex now so we don't bikeshed later. |

### Secondary accent — pick one (decision)

**Decision: Terracotta `#C8765E`.**

Why over warm-off-white: every other cannabis directory leans on green-on-white. We get more category differentiation from a warm secondary than from going more neutral. Terracotta reads "Central Illinois" — earth tones, not coastal-tech. It's also the warm complement that makes the navy feel intentional, not dusty.

Use it for:
- "Hot deal" / "Best deal in city" badges (sparingly — max one per card)
- Section accent rules (1px terracotta divider, not gray)
- Pull-quote highlights in long content (`/about/index`, content articles)

**Don't** use it for:
- Body text. Ever.
- CTAs. CTAs are green primary. Terracotta is the *attention-grabber* that points at the green CTA, not the CTA itself.
- Default badge color. Terracotta is reserved for "this one is special."

### Neutral scale (9 steps)

| Token | Hex | Use |
|---|---|---|
| `gray-50` | `#FAFAF7` | Inverse text on dark, app-icon negative space |
| `gray-100` | `#F1F0EB` | Subtle card hover bg |
| `gray-200` | `#E8E4DA` | Borders, dividers (warm tint matches cream bg) |
| `gray-300` | `#D1CFC6` | Disabled borders |
| `gray-400` | `#9CA3AF` | Placeholder text, "Built in Peoria" footnote color |
| `gray-500` | `#6B7280` | Metadata: "verified 2h ago," "0.4 mi away" |
| `gray-600` | `#4B5563` | Secondary body text |
| `gray-700` | `#374151` | Primary body text on cream bg |
| `gray-900` | `#0F1F3D` | Same as navy primary; aliased for code clarity |

The 100/200/300 steps carry a warm tint (`#E8E4DA`, `#D1CFC6`) instead of the pure cool grays Tailwind ships with. This keeps neutrals coherent with cream `#F5F4F0` and avoids the "pure-cold-Tailwind" look that signals SaaS-template default.

### Status colors

| Role | Hex | Use |
|---|---|---|
| **Verified / live** | `#16A34A` | Same as green primary. "verified 2h ago" green dot, "live" pill. |
| **Stale / pending** | `#D97706` | Amber, deeper than `#FBBF24`. "verification pending" pill at 72h+ unverified. |
| **Expired / down** | `#B91C1C` | Deeper red than `#991B1B`. "expired" badge, error toast borders. |
| **Info / future** | `#2563EB` | Blue, used sparingly. "coming soon" pills on placeholder Pro features. |

### Color usage rules — read these before shipping

- **Green primary is the only CTA color.** No blue buttons. No terracotta buttons. Green primary, on cream or white, navy text on hover. One.
- **Body text is gray-700, not navy.** Navy is for headlines and the wordmark. Pages where everything is navy read like a legal document.
- **Cream `#F5F4F0` is the default page bg.** Pure white is for cards, inputs, modals. This rule is the cheapest way to look like a publication instead of a form.
- **Terracotta is rare.** If more than one terracotta thing is on screen, you've used it wrong.
- **Status colors do not appear in non-status contexts.** No green text just because. No red borders just because. Status colors signal status.

---

## 2.3 Typography

**Decision: Geist Display + Inter (validates Code's default).**

Why these two:
1. Both free, both well-supported, both available via `next/font/google` and `next/font/local` without a paid license.
2. Geist Display is geometric without being sterile. It's the right counterweight to the editorial-serif body the site already uses for paragraph text. It's also Vercel's display face, which Code is hosting on.
3. Inter at 16-18px body size with line-height 1.6 is the most-tested body-reading combo on the web. Don't reinvent it.

The site currently mixes Georgia (serif) for body and system-ui (sans) for chrome. **Override that:** keep serif body for long-form content (`/about`, `/about/index`, content articles), but use **Inter for everything else** — UI chrome, deal cards, navigation, buttons, listings. The serif stays special because it doesn't appear everywhere.

### Type scale

| Role | Font | Size | Weight | Tracking | Line-height |
|---|---|---|---|---|---|
| Hero (homepage `<h1>`) | Geist Display | 56–72px (clamp) | 700 | −0.04em | 1.05 |
| H1 (page) | Geist Display | 40–52px (clamp) | 700 | −0.035em | 1.1 |
| H2 | Geist Display | 32–40px (clamp) | 600 | −0.03em | 1.15 |
| H3 | Geist Display | 22–28px (clamp) | 600 | −0.02em | 1.2 |
| H4 / card title | Inter | 17–18px | 600 | −0.01em | 1.3 |
| Body — UI / chrome | Inter | 16px | 400 | 0 | 1.55 |
| Body — long-form | Source Serif 4 (or Georgia fallback) | 17–18px | 400 | 0 | 1.7 |
| Metadata | Inter | 13px | 500 | 0.01em | 1.4 |
| Eyebrow / kicker | Inter | 11px | 700 | 0.14em UPPERCASE | 1.4 |
| Price / discount | Geist Display | inherits parent | 700 | −0.02em tabular-nums | 1.0 |
| Code / inline mono | JetBrains Mono | 0.9em (relative) | 500 | 0 | 1.5 |

### Long-form body face

**Decision: Source Serif 4 (Google Fonts), Georgia as fallback.**

The about page uses Georgia today. Georgia is fine but it's the default-default — it reads as "we didn't pick a font." Source Serif 4 is the drop-in replacement: same warmth, better screen rendering, distinctive where it matters (publication articles, the about page, the tax calculator explainer). Falls back cleanly to Georgia if the font request hangs.

```css
font-family: "Source Serif 4", Georgia, "Times New Roman", serif;
```

### Tabular numerals — non-negotiable

Every price, discount %, distance, and timestamp uses `font-variant-numeric: tabular-nums`. Listings of "$35 / $40 / $42" without tabular-nums rag at the dollar signs and look amateur. With tabular-nums they line up. This is a one-line CSS fix that defines whether the site looks polished or sloppy.

```css
.price, .discount, .distance, .timestamp {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
```

### Don't do

- No font-stretching. No oblique fakes. If we don't have a weight, we don't use that weight.
- No Geist for body paragraph text >2 sentences. Geist is a display face. Reading 400 words of it is uncomfortable.
- No Source Serif on UI chrome. Serif on a button looks like a Wordpress theme.

---

## 2.4 Photography direction

The site is over-indexed on illustration and emoji. Photography is the easiest way to make it feel grown-up.

**Mood: warm + natural + editorial. Not clinical. Not "lifestyle agency."**

Think *The New York Times* food section, not *Cosmopolitan* lifestyle. Think the dispensary visit on a Tuesday afternoon at 4pm, not a model holding a joint at a pool party.

### Avoid (the cliché list)

- Smoke clouds against black backgrounds.
- Single cannabis leaf on a pure-white surface.
- Anyone smoking visibly. (Federally illegal, advertising-hostile, and tone-deaf for our actual user — they already know how to consume.)
- Neon-green color grading. The image should look like Tuesday afternoon, not a rave.
- People holding cash fanned out.
- Hands offering pre-rolls across a counter.
- Chicago skyline. We are *Central* Illinois — visual choices reinforce the scope lock.

### Do — image-by-image direction

**Hero (homepage above the fold):** A wide-angle shot of a Central Illinois small-city street at golden hour — Peoria's Main Street, an East Peoria storefront block, a Bloomington-Normal downtown. The dispensary sign is visible but not the focus. Warm light, no people, no cannabis visible. **The hero is a place, not a product.** This signals "we are about your neighborhood, not your strain."

Search Unsplash for: `peoria illinois street`, `midwest small city downtown`, `illinois main street golden hour`. Specific candidates to try first:
- https://unsplash.com/s/photos/peoria-illinois (any wide-angle street, golden hour)
- https://unsplash.com/s/photos/illinois-downtown
- https://unsplash.com/s/photos/midwest-storefront

**Section accent 1 — "How it works" or trust section:** Close-up of hands counting cash on a wood counter, side-on, warm tone. No cannabis in frame. The image carries the "$" signal without leaning on it. This is the only "money in frame" image and it's framed as commerce, not flex.

Search: `cash counting hands wood counter`, `wallet money counter`.

**Section accent 2 — "What we cover" / cities section:** A simple typography-on-photograph treatment — a wide rural-to-suburban Illinois landscape (cornfield-to-downtown transition, or a state highway sign) with the city names overlaid as text. This image positions us geographically without using a state outline (cliché).

Search: `illinois highway`, `central illinois landscape`, `midwest farmland horizon`.

**Section accent 3 — Pro upgrade section:** A phone in someone's hand, screen showing a generic notification (not our app — won't be lying about screenshots), in a low-light interior. Implies "alerts find you wherever you are." Calm, not urgent.

Search: `phone notification dim light`, `phone in pocket reading`.

### Treatment

Every photograph gets:
1. **A 5–8% navy-tinted overlay.** Pulls the image into the brand without recoloring it.
2. **Aspect ratio 16:9 for hero, 4:3 for section accents.** Consistent ratios reduce visual fragmentation.
3. **No text-on-image without a 30%+ darkened scrim** behind the text band. Accessibility floor.

### Code's job (specifically)

Pull the four images. Drop them in `public/photography/` as JPGs (not WebP — Next.js will serve modern formats automatically; we keep JPG masters for portability). Reference via `<Image>` with `priority` on the hero and `loading="lazy"` everywhere else. Compress to ≤200KB hero, ≤120KB section accents.

Photo credit is required by Unsplash license — bake it into a subtle footer credit line, e.g., "Photography via Unsplash." Pre-emptive on the legal floor.

---

## 2.5 Icon system

Replace every emoji on amenity rows, status pills, and feature lists with `lucide-react` SVG icons.

**Library: `lucide-react`.** Free, MIT, ~1,400 icons, on-brand geometric, tree-shakable.

### Mapping (literal, copy-paste this into Code)

| Concept | Today | Switch to |
|---|---|---|
| Online ordering | 📱 / "Order online" | `ShoppingBag` |
| ATM on-site | 💵 | `Banknote` |
| Wheelchair accessible | ♿ | `Accessibility` |
| Parking | 🅿 | `Car` (cleaner than `ParkingSquare`) |
| Loyalty program | ⭐ | `Award` |
| Verified deal | ✅ | `CheckCircle2` |
| Stale / pending | ⏳ | `Clock` |
| Expired | ❌ | `XCircle` |
| Phone | 📞 | `Phone` |
| Map / location | 📍 | `MapPin` |
| Open now | 🕐 | `Clock3` |
| Hours / closed | — | `CalendarDays` |
| Email contact | 📧 | `Mail` |
| Cannabis category — flower | 🌿 | `Leaf` (used sparingly — only as category icon, never as decoration) |
| Cannabis category — vape | — | `Cigarette` (the one place where this icon makes literal sense) |
| Cannabis category — edibles | — | `Cookie` |
| Cannabis category — concentrates | — | `Droplet` |

### Specs

| Property | Value |
|---|---|
| Default size | 16×16 (inline metadata), 20×20 (amenity rows), 24×24 (section icons) |
| Default color | `#374151` (gray-700) |
| Hover / interactive color | `#0F1F3D` (navy) |
| Stroke width | 1.75 (lucide default is 2; 1.75 reads slightly more refined and matches the wordmark's geometric weight) |
| In-button | inherits button text color |
| Status pills | inherits status color (green `#16A34A`, amber `#D97706`, red `#B91C1C`) |

### One emoji exception

The "Built in Peoria, Illinois 🌿" footer line keeps its leaf emoji. It's a *signature*, not an icon — same way print ads end with a designer's monogram. One emoji, one place, on purpose.

---

## 2.6 Voice + copy guidelines

The voice is **already the strongest part of the brand.** The April 20 brand-voice audit (`docs/audits/brand-voice-audit-20260420.md`) catalogues what's working and what drifts. This section codifies it so Code, Chrome, and any future agent or human writes from the same reference.

### Brand line (locked)

> **Best Bud For Your Buck$**

That's the line. Punchy, clever, doesn't take itself too seriously, signals price-first without being cheap. It pairs with `Low Prices. High Times.` as a subhead pun. Both are the locked tagline rendered exactly in `app/page.jsx`. **Don't rewrite either of them.**

### Voice traits, in order of importance

1. **Trust-first.** Every quantitative claim is verifiable. If you can't back it, don't ship it. The April 20 audit caught us claiming "293 dispensaries" when we had 26 in scope. That class of error is a brand killer in this category.
2. **Builder-to-builder.** The reader is a working adult who already knows what they're shopping for. Don't explain weed. Don't apologize for it. Don't lecture about consumption.
3. **Plain-spoken.** Average sentence length is short. Long ones earn it.
4. **Slightly cheeky.** A good site title pun, a footer leaf emoji, a "Got a deal? Tell us →" — yes. A meme, a 🔥 emoji, a "fire deals 💯" — no. Cheekiness is a seasoning, not a sauce.
5. **Specific over abstract.** "$35 eighth at NuEra Pekin, today" beats "great deals on premium flower." Always.

### Banned phrasebook

These are directory clichés. They are the reason the user trusts the existing tools less than they trust word-of-mouth. We don't use them.

| Banned | Why | Use instead |
|---|---|---|
| Premium | Means nothing in cannabis. | the brand name, or specific quality marker |
| Curated | Marketing tic. We aggregate; we don't curate. | "ranked by" / "we found" |
| Discover | "Discover the perfect deal..." — no. | "find," "see," or just the verb the user is doing |
| Find your perfect ... | Boilerplate SaaS. | "best deal near you right now" |
| Best-in-class | Hollow superlative. | a specific number or comparison |
| Game-changing | Always a lie. | what changed, specifically |
| Empowering | We sell pricing data. | what the user gets, specifically |
| Streamline | Inhuman verb. | "save time," "skip the [thing]" |
| Robust / scalable / cutting-edge | Engineer-marketing words. | the actual feature |

### Lean-into phrasebook

These map to voice traits. Use freely.

- "Real deals. Right now. Near you." (current tagline — uses three short sentences as one rhythm)
- "We built the thing we wished existed." (the about-page anchor — keeps working)
- "Updated daily." / "Verified [N] hours ago." (trust-first via timestamp)
- "Free for dispensaries, forever." (trust-first via constraint)
- "Drop a deal." / "Tell us." / "Got one we missed?" (builder-to-builder CTA)
- "The plan is..." (honest about pre-revenue or pre-feature state)
- "Built in Peoria." (geographic anchoring; keeps the scope honest)

### Numbers and claims

- **Counts get rounded down, never up.** "26 dispensaries" if we have 26. Never "30+." If we round, we round to a number we beat — "20+" if we have 26 — never to a number we approach.
- **Date-stamp anything that drifts.** Tax rates, deal counts, dispensary counts. "26 active listings (April 28, 2026)" is fine. Just "26 listings" alone reads as eternal truth.
- **Hedge cleanly when hedging.** "Usually within a couple days" beats "within 48 hours." "The plan is..." beats "We will..." until shipped.
- **No vanity metrics on the surface.** No "X happy customers." No "Y cities served" if Y is generous. The audit caught both of these last week.

### Voice in small surfaces

| Surface | Tone |
|---|---|
| Page titles | Direct. "Cannabis deals in Peoria, Illinois" not "Discover the best..." |
| Meta descriptions | One sentence, plain. Mentions the city or dispensary by name. |
| Buttons | Verb + object, ≤3 words. "See deal," "Get alerts," "Drop a tip." Not "Click here." |
| Empty states | Honest about the nothing. "No deals in Bartonville yet — nearest licensed dispensary is in Peoria, 8 miles." |
| Errors | Apologize once, in one sentence. Tell the user what to do next. |
| Confirmations | "Got it. We'll text you when [X]." |
| Footer | Honest, dry. "Built in Peoria, Illinois 🌿" |

### Failure mode — what bad PuffPrice voice sounds like

```
Discover premium cannabis deals tailored to your unique preferences,
delivered with our cutting-edge AI-powered recommendation engine.
```

Every problem in the brand is in that sentence. If anything Code or anyone else writes drifts toward that voice, kill it.

### The five-word check

Before any new copy ships, ask: *would Matthew say this out loud to his neighbor?* If no, rewrite. If you can't tell, ask in five words: "is this a real sentence?" That's the voice.

---

## What Code implements (the punch list)

In priority order — Code's visual upgrade session can pick up any subset, but tackling top-down maximizes brand cohesion per commit.

1. **Wordmark refresh** — replace `<Image src="/logo-512.png" />` with an inline SVG wordmark per spec 2.1. Keeps the same component API.
2. **Color tokens** — add the palette in 2.2 to `tailwind.config.js` (or `app/globals.css` as CSS custom properties). Replace ad-hoc hex literals across `app/page.jsx`, `app/about/page.tsx`, and the deal-card component with token references.
3. **Type scale** — wire Geist Display + Inter + Source Serif 4 via `next/font/google`. Apply the type scale in `app/globals.css`.
4. **Tabular-nums** — global rule on `.price`, `.discount`, `.distance`, `.timestamp` classes.
5. **Lucide icon swap** — replace amenity-row emoji with the icons in 2.5.
6. **Photography** — pull four Unsplash images into `public/photography/` and apply the 5–8% navy overlay treatment.
7. **Voice cleanup** — apply the surface-by-surface rewrites flagged in `docs/audits/brand-voice-audit-20260420.md` if they're not already shipped.

Items 1–4 are the visual signature. 5–7 are the polish that makes 1–4 land.

---

## What's *not* in scope of this spec

- Dark mode. Earmarked (`#0A0A0B`); not shipping in the visual upgrade.
- An app icon beyond favicon. Reserved for a real design pass when we have a budget.
- A motion / animation system. The pulse-dot in the existing logo is fine. Anything more is later.
- Email-template visual identity. Resend templates use a stripped, mono-color version of the wordmark; full theming later.
- A pin mark or icon mark separate from the wordmark. Decision recorded in 2.1: not until commissioned.

---

## One uncertainty I want flagged

**The wordmark's `$`-as-`P` accent (2.1).** It's a strong direction *if it executes well*. If the bowl of the `P` doesn't land cleanly as a `$` glyph at small sizes, the wordmark loses signal and we're shipping a regular sans-serif logotype. Code's first attempt should produce the wordmark at three sizes (16px, 32px, 96px) and screenshot — if any size reads as just "PuffPrice" with a weird `P`, fall back to a clean Geist 700 wordmark with green accent on the `$` of the headline tagline instead. Make the call on the Code side; Cowork's preference is to try the integrated `$P` and only retreat if it doesn't carry.
