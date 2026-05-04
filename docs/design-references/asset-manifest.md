# Asset Manifest — PuffPrice Sitewide Visual System
**Date:** 2026-05-04
**Owner:** Cowork (writes the spec). Code (acquires the assets, places them in `public/`, references them in components).
**Status:** Authoritative. Anything not listed here does not ship.

---

## How to read this document

This manifest is the single source of truth for every image, SVG, icon, and logo asset the visual upgrade depends on. Code's environment can fetch URLs; this Cowork session cannot. Code is responsible for download, optimization, placement under `public/`, and credit lines. Cowork's job is to specify *what* and *why* and *where*.

If an asset isn't in this file, it doesn't exist for the visual upgrade. New asset proposals go into a follow-up manifest, not into the PR.

---

## 1. Bud photography (in scope — accents/edges only)

**Rule:** Cannabis bud photography appears at the *edges* of compositions — bleed crops on hero panels, decorative slivers on section dividers, background imagery behind text scrims. Never centered. Never the subject. The user is the subject; the bud is the texture.

**License:** Pexels — free for commercial use, no attribution required, but a credit line in the footer (`Photography via Pexels`) is the trust-first move and costs nothing.

**Treatment for every image:**
- Aspect crop: hero gets 16:9 panel, section accents get 4:5 vertical slivers.
- Color grade: 8% deep-green tint overlay (`#050f09` at `alpha 0.08`). Pulls the photograph into the brand without recoloring.
- Text overlay rule: any text on top of a bud photograph requires a `30%` darkened scrim band behind the type.
- Compression: hero ≤ 220KB, section accents ≤ 140KB. Next.js `<Image>` will serve modern formats automatically; we keep JPG masters in `public/photography/`.

### Authorized sources

| Slot | URL | Photographer | Use |
|---|---|---|---|
| `hero-bud-edge.jpg` | https://www.pexels.com/photo/close-up-of-a-cannabis-bud-6462279/ | Terrance Barksdale | Macro bud, right-edge bleed on desktop hero. Crop: take right ~30% of frame, the rest is dark-cream gradient behind the wordmark + headline. |
| `bud-isolated.jpg` | https://www.pexels.com/photo/a-bud-of-marijuana-plant-in-macro-photography-4917602/ | Tobias Leznem | Single bud, organic feel. For the "What we cover" or "How it works" section accent. 4:5 vertical sliver, left-edge. |
| `bud-clean-product.jpg` | https://www.pexels.com/photo/close-up-photo-of-cannabis-bud-7667737/ | Kindel Media | Clean isolated bud, neutral background. Reserved for category-page heroes (`/deals/flower`, `/deals/edibles` etc. when category branching ships). |
| `bud-detail-depth.jpg` | https://www.pexels.com/photo/close-up-of-hemp-drought-8246876/ | Terrance Barksdale | Detail with depth-of-field. For long-form content pages (`/about/index`, tax calculator explainer) — pull-quote backgrounds with scrim. |
| `bud-macro-blur.jpg` | https://www.pexels.com/photo/macro-photography-of-a-cannabis-bud-3047447/ | Yash Lucid | Blurred-background macro. Reserved for `/alerts` and `/upgrade` page section accents — softer, calmer than the others. |
| `bud-glass-jar.jpg` | https://www.pexels.com/photo/photo-of-cannabis-flowers-on-glass-container-7773109/ | Kindel Media | Bud in glass jar — commerce/retail context. Reserved for the "How it works" section step that explains where deals come from. |

**Six photographs, six explicit slots.** No ad-hoc placement. If a new surface needs a photograph, the answer is one of these six, cropped differently — not a new download.

### Out-of-scope photography (do not commission, do not download)

See `brand-system.md` § 8 for the complete out-of-scope list. The short version: no consumption (smoking, vaping, eating), no joints/pipes/bongs in hero or cards, no people in product frames, no dollar-sign motifs, no AI stock with hallucinated text.

---

## 2. Leaf SVG patterns (decorative)

**Rule:** Leaf SVG patterns appear *only* on dark surfaces (deep-green hero panel, navy footer band, dark-mode reservations). Opacity ceiling: `6%`. Never on light surfaces. Never as a foreground element. The leaf is the watermark, not the signature.

**File:** `public/brand/leaf-pattern.svg`
**Spec:**
- Single cannabis leaf glyph, geometric (not photorealistic, not illustrated).
- Stroke-only — no fill. Stroke width: `1.5px`.
- Stroke color: inherits from `currentColor` so the same SVG works on any dark surface.
- Tile dimensions: 96×96px source SVG, repeated as CSS background with `background-size: 96px`.
- Opacity in production: `0.06` (max). The hero uses `0.04`; the footer band uses `0.06`.

**Code's job:** generate the SVG (or accept one from a follow-up if Matthew commissions it later). For this PR, a clean inline SVG of the standard 7-leaflet cannabis silhouette is acceptable. No flourishes, no smoke, no extra glyphs.

**Where it appears:**
| Surface | Opacity | Tile size |
|---|---|---|
| Homepage hero panel (deep-green band) | 0.04 | 96px |
| Footer band (deep-green) | 0.06 | 96px |
| `/about` page header band | 0.05 | 96px |
| Empty-state card backgrounds (where the card surface is dark) | 0.05 | 64px |

**Where it does NOT appear:**
- Cream page backgrounds.
- White card surfaces.
- Anywhere on listing detail pages above the fold.
- Inside the wordmark or near the wordmark.
- Email templates (Resend stays mono-color).

---

## 3. Dispensary logos (in cards)

**Rule:** Dispensary cards on listing index, city pages, and deal cards display the dispensary's own logo, not a generic icon. If we don't have the logo, the card falls back to a monogram (first letter of dispensary name, set in Manrope 800, on a brand-accent green tile).

**Source:** Each dispensary's own website / Google Business Profile. Licensed for use in directory context (we link to and credit the dispensary). Stored at `public/dispensary-logos/{slug}.png` or `.svg`.

**Acquisition order (Code):**
1. Dispensary's own website assets (preferred — vector if available).
2. Google Business Profile logo (raster, 256×256+).
3. Monogram fallback (component-rendered — no asset needed).

**Spec for stored logos:**
- Square crop, 256×256 minimum.
- Transparent background where possible (PNG-32 or SVG).
- Filename matches `master_listings.slug` exactly: `nuera-pekin.png`, `ascend-springfield.png`, etc.

**Card render rules:**
- Logo size in card: 48×48 (mobile), 56×56 (desktop).
- Logo size in detail-page header: 96×96.
- Background tile behind logo: cream `#F5F4F0` with 1px border `#E8E4DA`. Never the deep-green brand surface — kills logo legibility.

**Monogram fallback spec:**
- Tile: brand-accent green `#50c878`, no border.
- Letter: Manrope 800, white, single character (first letter of `display_name` after stripping `The`/`A`/`An`).
- Same dimensions as the logo it replaces.

---

## 4. Icon system (Lucide React)

**Library:** `lucide-react`. MIT, ~1,400 icons, tree-shakable, geometric.

**Spec:**
| Property | Value |
|---|---|
| Default size | 16×16 inline metadata, 20×20 amenity rows, 24×24 section icons |
| Default color | `gray-700` (`#374151` or token equivalent — see `brand-system.md` §2) |
| Hover/interactive | `brand-primary-deep` |
| Stroke width | `1.75` (Lucide default is 2; 1.75 reads slightly more refined) |
| In-button | inherits button text color |
| In status pill | inherits pill status color |

**Mapping (literal — Code copy-pastes this into amenity components):**

| Concept | Today (in code) | Switch to (Lucide) |
|---|---|---|
| Online ordering | 📱 / "Order online" | `ShoppingBag` |
| ATM on-site | 💵 | `Banknote` |
| Wheelchair accessible | ♿ | `Accessibility` |
| Parking | 🅿 | `Car` |
| Loyalty program | ⭐ | `Award` |
| Verified deal | ✅ | `CheckCircle2` |
| Stale / pending | ⏳ | `Clock` |
| Expired | ❌ | `XCircle` |
| Phone | 📞 | `Phone` |
| Map / location | 📍 | `MapPin` |
| Open now | 🕐 | `Clock3` |
| Hours | — | `CalendarDays` |
| Email contact | 📧 | `Mail` |
| Category — flower | 🌿 | `Leaf` (sparingly — category icon only) |
| Category — vape | — | `Cigarette` |
| Category — edibles | — | `Cookie` |
| Category — concentrates | — | `Droplet` |
| Category — pre-rolls | — | `Joint` *(verify exists in Lucide; fallback `Cigarette`)* |

**Custom icons:** none in this PR. Custom icon commissioning is post-PMF (see `brand-system.md` decision log).

**Emoji exception:** the footer line "Built in Peoria, Illinois 🌿" keeps its leaf emoji. One emoji, one place, on purpose.

---

## 5. Wordmark + logo files

| File | Path | Spec |
|---|---|---|
| Wordmark — primary | `public/brand/wordmark-sage.svg` | "PuffPrice" set in Manrope 800, sage-green fill, letter-spacing −0.025em, single line. Inline SVG so it inherits color when needed. |
| Wordmark — inverse | `public/brand/wordmark-cream.svg` | Same wordmark, cream fill `#F0EDE8` for use on deep-green hero/footer surfaces. |
| Pin mark companion | `public/brand/pin-mark.svg` | Simple geometric map-pin silhouette with embedded leaf glyph. Sage-green stroke, no fill. Used only where wordmark won't fit (favicon variants beyond 16px, app icon, OG card corner stamp). |
| Favicon | `public/favicon.ico` + `public/favicon-32.png` + `public/apple-touch-icon.png` | Pin mark only — wordmark doesn't survive sub-32px. |
| OG image | `public/brand/og-default.png` | 1200×630. Wordmark + tagline (`Best Bud For Your Buck$ — Low Prices. High Times.`) on a deep-green surface with leaf-pattern watermark at 6% opacity. |

**Why pin mark and wordmark:** the prior April 28 identity package argued against a pin mark. This pass overrides that decision because the sitewide rollout introduces surfaces (favicons, OG cards, app icons, future merch) where the wordmark doesn't survive. The pin mark companion is *good-enough-to-ship through Phase 1* — definitive brand work is deferred post-PMF. See `brand-system.md` decision log.

---

## 6. Page-by-page asset assignments

| Page / surface | Photography | Leaf pattern | Icons | Wordmark variant |
|---|---|---|---|---|
| Homepage hero | `hero-bud-edge.jpg` (right 30% bleed) | 0.04 opacity on deep-green panel | n/a | Cream wordmark |
| Homepage "How it works" | `bud-glass-jar.jpg` (4:5 left sliver) | none | `Award`, `MapPin`, `CheckCircle2` | n/a |
| Homepage "What we cover" | `bud-isolated.jpg` (4:5 left sliver) | 0.05 if dark band | `MapPin` for each city | n/a |
| `/city/[city]` | none above the fold | 0.05 in city header band | amenity row icons | Sage wordmark in nav |
| `/dispensary/[slug]` (= `/l/[id]`) | none — logo is the visual | none | full amenity row | Sage wordmark in nav |
| `/deals/[category]` | category-specific bud (TBD when categories ship) | none | category icon in header | Sage wordmark in nav |
| `/about` | `bud-detail-depth.jpg` for pull-quote bg | 0.05 in header band | minimal | Sage wordmark in nav |
| `/about/index` | none — data is the story | none | inline metadata icons | Sage wordmark in nav |
| `/alerts` | `bud-macro-blur.jpg` (subtle accent) | none | `Mail`, `Phone` | Sage wordmark in nav |
| `/upgrade` | `bud-macro-blur.jpg` (subtle accent) | none | feature-row icons | Sage wordmark in nav |
| `/admin/*` | none ever | none | full Lucide set as needed | Sage wordmark in nav (stripped) |
| Footer (sitewide) | none | 0.06 on deep-green band | `MapPin` for "Built in Peoria" | Cream wordmark |
| OG card (default) | none | 0.06 on deep-green | n/a | Cream wordmark |
| Email templates | none | none | none | Mono wordmark text only |

---

## 7. Acquisition checklist (Code)

When Code's session starts:

1. Download the six Pexels images at full resolution. Re-export as JPG, target compression noted in §1. Place in `public/photography/`.
2. Generate or accept a leaf-pattern SVG per §2 spec. Place at `public/brand/leaf-pattern.svg`.
3. For each Central IL dispensary in `master_listings` (project_tag='green', is_active=true), attempt logo acquisition per §3 order. Record outcome in `docs/handoffs/2026-05-XX-logo-acquisition.md`.
4. Generate the wordmark SVGs (sage + cream) per `brand-system.md` §1 and §3.
5. Generate the pin-mark SVG per §5.
6. Generate favicon set + Apple touch icon from pin mark.
7. Generate default OG image per §5 spec.
8. Add `lucide-react` to `package.json` if not already present. Replace emoji per §4 mapping.
9. Add a `Photography via Pexels` credit line in the footer.

Cowork doesn't acquire any of these assets. Cowork wrote the spec. Code executes.

---

## 8. Note on the four design comp reference images

Matthew's prompt for this session referenced four design comp JPGs (`01-desktop-hero-reference.jpg`, `02-deal-card-reference.jpg`, `03-mobile-reference.jpg`, `04-do-not-replicate.jpg`) that were intended to ride alongside this manifest. **They were not attached to the prompt.** The Pexels URLs above were provided as a substitute brief, and the rest of the visual direction is encoded in `brand-system.md`.

If Matthew surfaces those four comps in a follow-up, they override anything in this manifest that conflicts with them — except for the `04-do-not-replicate.jpg` reference, which by name is anti-spec and stays anti-spec. See `README.md` in this folder for the do-not-replicate note.
