# Cannabis Direct Competitor Audit
**PuffPrice Competitive Audit — Phase 1**
Audited: 2026-04-28 | Auditor: Claude (Sonnet 4.6)

---

## 1.1 Leafly (leafly.com)

**URL audited:** https://www.leafly.com/
**Listing page:** https://www.leafly.com/dispensaries

### Hero Section
The Leafly homepage hero is **entirely occupied by paid banner ads** (carousel format, ~850px tall). On audit visit, ads from Zig-Zag and Batch CBD dominated the first viewport. No organic hero — the actual Leafly brand proposition does not appear above the fold. This is a significant UX regression from a trust standpoint.

### Color Palette
- Primary green: `#034638` (dark forest green, logo + nav accent)
- Secondary green: `#017c6b` (interactive elements, hover states)
- Background: `#FFFFFF` / near-white
- Body text: `#333333`
- CTA buttons: `#017c6b` (rounded pill, ~24px border-radius)
- Deal badge accent: `#FF1493` (hot pink — used on "Deals" label pill)

### Typography
- **Display + body:** Public Sans at weight 800 for all headings (28px h1, 20px h2), same font for body at normal weight
- Single-font system — no display/body split. Feels utilitarian, not premium.
- Letter-spacing: default (no negative tracking). Headings lack tightness.

### Photography Style
Carousel ad photography is brand-driven (Zig-Zag retro styling, product-on-surface). Below-fold organic content is purely icon-based category grid (line-art leaf icons on rounded-square cards, pale sage background). No editorial or lifestyle photography in the Leafly-owned sections.

### Mobile/Desktop Feel
Desktop-first with responsive scaling. Navigation is a dense horizontal tab bar (Shop / Delivery / Dispensaries / Deals / Strains / Brands / Products / Leafly Picks / CBD). Information architecture reflects a company that has accumulated features over time — navigation entropy.

### Primary CTA
"Find dispensaries" — location-based discovery. Secondary: email signup for deals.

### Trust Signals
- "Authentic reviews" language in dispensary search
- Star ratings visible on dispensary cards (5-star with review count)
- "Leafly List winner" filter badge
- "Pickup in under 30 mins" operational badge on listings
- "1 deal" badge on dispensary cards

### Visual Register Assessment
Leafly reads as **"established cannabis media company that has added e-commerce."** The green is tasteful. The ads are not. The font system (Public Sans only) is functional but generic. The category icon grid (sage tiles with line-art icons) is their clearest moment of visual coherence — it's clean, consistent, and readable. The rest of the page feels assembled rather than designed.

**Signal vs PuffPrice:** Leafly is trying to be a media+commerce hybrid. PuffPrice should aim for cleaner deal-first utility. Leafly's deal card on the homepage — photo + discount % + "shop now" CTA — is well-structured and worth studying.

---

## 1.2 Weedmaps (weedmaps.com)

**URL audited:** https://weedmaps.com/

### Hero Section
"Skip the line, order online / Pick up your favorites nearby" — two-line headline on a split layout: text left, product photography right (joints in a tin, well-lit, editorial). The hero background is a light mint/teal (#B8E8E0 approximately). Clean and clear value proposition. This is Weedmaps' best design moment.

### Color Palette
- Brand teal: `#38C9B0` (logo accent)
- Near-black: `#252935`
- Off-white background: `#F5F5F5`
- Text: `rgb(0,0,0)` / `rgb(74,74,74)`
- CTA "Order now": near-black pill button on teal hero

### Typography
- **System font:** `circular, system-ui, sans-serif` — Circular is the Spotify/Airbnb-era rounded geometric. Weight 700 for headings, 500 for section labels.
- H1: 32px, weight 700. H2: 20px, weight 500. Simple, no tracking.
- Feels 2019-era — Circular was everywhere 5-7 years ago. Not a differentiator anymore.

### Photography Style
**The deal cards are a disaster.** Weedmaps' "Deals nearby" section shows user-submitted deal flyers — these are literally gas-station-style promotional graphics: "SPRING CLEANING SALE 🌿 $99 BUNDLES ARE BACK" in Comic Sans-adjacent typography on dark backgrounds with emoji. "BEST PRICES IN THE STATE, WE PRICE MATCH" in all-caps on a sunset photo. This is the cannabis-directory equivalent of Craigslist, and it dominates the deals experience.

### Mobile/Desktop Feel
The homepage hero reads as mobile-first. The dispensary horizontal scroll carousel (name, type, rating, distance) is clean and functional. But deal cards blow the experience.

### Primary CTA
"Order now" — ecommerce-first orientation.

### Trust Signals
- Star ratings with review counts on dispensary tiles
- "Recreational / Medical" type badges
- Distance indicators ("1 mi", "2 mi")

### Visual Register Assessment
Weedmaps has **one good design moment** (the hero split layout) and then falls apart immediately below the fold. The deal-card problem is existential: user-generated promotional graphics that look like early-2000s classified ads. This is the single most important anti-pattern PuffPrice should avoid.

**Direct PuffPrice opportunity:** PuffPrice's clean deal card presentation (text-only, deal %, dispensary name) is already architecturally superior to Weedmaps' chaos. The visual upgrade needs to match the architecture quality.

---

## 1.3 iHeartJane (iheartjane.com)

**URL audited:** https://www.iheartjane.com/

### Hero Section
Age gate required. Behind it: deep purple-to-magenta gradient background (#4B2EBE to #8B1FA8 approximately), centered "Jane" wordmark (large, white, lowercase serif), and hero text "Shop and discover cannabis." Two CTAs: "Enter Your Location" (ghost pill) and search bar.

### Color Palette
- Hero purple: ~`#4B2EBE` to `#8B1FA8` gradient
- Gold/amber: `#F5A623` (heart logo accent, used sparingly)
- White: text on hero
- Body: white background post-hero
- CTAs: deep purple `#5B2DDB` pill buttons with full radius

### Typography
- **Display:** Euclid Circular B at 28px for hero headline, weight 400 (not bold — considered choice)
- **Body/UI:** "Jane Default" (Source Sans Pro fallback), system sans
- The Euclid Circular B choice is premium. It's the font used by Uber and others — geometric, humanist, readable.

### Photography Style
No photography visible on homepage (post age-gate). Pure color + typography play.

### Mobile/Desktop Feel
Mobile-first feel. Large touch targets. The sticky bottom nav on mobile shows: hamburger / heart / location / search / bag.

### Primary CTA
"Enter Your Location" — location-first, then discovery.

### Trust Signals
None visible on homepage — brand-trust only, no reviews/badges at this stage.

### Visual Register Assessment
iHeartJane is **the most visually ambitious cannabis consumer site.** The gradient hero is genuinely striking. The font system is considered. The gold heart creates emotional warmth. It reads closer to a consumer lifestyle app than a cannabis directory.

**PuffPrice takeaway:** The color strategy (one bold accent color, kept restrained) and the font weight choice (display at regular weight, not heavy) are worth studying. The purple/gold combination is distinctive but may be too "nightlife" for PuffPrice's utility positioning.

---

## 1.4 Dutchie (dutchie.com)

**URL audited:** https://dutchie.com/

### Hero Section
**The strongest hero of any cannabis site audited.** Dark navy background (~`#06162A`), full-viewport lifestyle photography of a person relaxing on a couch (desaturated, moody), headline "Order cannabis online from the best dispensaries near you." at ~70px in Matter font, white. Below: single input field "Enter your address or city to get started..." with a coral/tomato-red "Start shopping" CTA button.

This is the Dutchie consumer homepage (not the B2B POS page). It achieves what no other cannabis site does: it looks like it could be Airbnb or DoorDash. The lifestyle photography is non-cliché — no leaves, no product.

### Color Palette
- Background: `#06162A` (deep navy)
- Text: `#FFFFFF`
- CTA accent: coral/tomato red (`#E8443A` approximately)
- Illustration accent (below fold): navy blue line-art on white
- Body text: `rgb(72, 80, 85)` (slate)

### Typography
- **Full system:** Matter font — a modern geometric sans with humanist touches. Used at 700 for h1 (~70px), standard weight for body.
- Body: Matter, -apple-system fallback stack
- Letter-spacing: default. The size and weight of the headline carries without needing tight tracking.

### Photography Style
Single hero lifestyle photo (person + couch — low-saturation, warm). Below fold: flat illustration icons (couch with smoke, delivery car) in a 2-column feature grid. This is the right ratio: one hero lifestyle shot, then clear information architecture.

### Mobile/Desktop Feel
Desktop-first layout but clean. The search field + CTA pattern is Dutchie's core mobile interaction.

### Primary CTA
"Start shopping" — commerce-first.

### Trust Signals
- Below fold: "The best products. The leading cannabis brands. Order now for pickup or delivery." — direct claims, no badges.
- App store ratings mentioned in scrolled content.

### Visual Register Assessment
**Dutchie is the benchmark for cannabis commerce visual quality.** It's the only cannabis site that reads like a tech company at the design layer. The navy/coral/white palette is confident and unconventional for the category. The Matter font is industry-appropriate without being cannabis-coded. The lifestyle hero image is human without being clinical.

**PuffPrice gap:** Dutchie is primarily an ordering platform; PuffPrice is a deals aggregator. But the visual register — restrained palette, strong typography, lifestyle imagery that doesn't look high — is exactly the target.

---

## 1.5 Eaze (eaze.com)

**URL audited:** https://www.eaze.com/

### Hero Section
"Highly calculated cannabis delivery" — pastel gradient background (powder blue left to pale pink right), massive display headline at ~52px in Neue Plak Extended Bold (a condensed display typeface), hand-drawn oval pink scribble decoration around "cannabis delivery". Below: monospace search field "Enter your delivery address" in Suisse Intl Mono, then a flat yellow "SHOP NOW" rectangle button with a thick dropped-shadow (2D brutal style).

This is the most visually distinctive hero in the cannabis space. Very editorial — reads more like a zine or CPG brand than a directory.

### Color Palette
- Background: pastel blue-to-pink gradient (`#B8D4F0` to `#F0D4D4` approximately)
- Headline: `#1A1A1A` (near-black)
- Accent: yellow `#FFEF00` (CTA button)
- Decoration: pink hand-drawn lines (~`#E87CA0`)
- Body/UI elements: light gray cards on cream

### Typography
- **Display headline:** Neue Plak Extended Bold at ~52px — ultra-extended, high impact. Rare in cannabis.
- **Body/UI:** Suisse Intl Mono Regular — full monospace body text. This is the most unusual choice of any site audited. It reads as tech-editorial, like reading a developer's blog.
- Logo: custom rounded "eaze" wordmark, playful

### Photography Style
No product photography on homepage. Pure illustration/graphic design approach. The hand-drawn pink oval around text is the primary decorative element. Cards below fold show brand partnership imagery.

### Mobile/Desktop Feel
Desktop-first. The brutalist/editorial aesthetic may not translate as well to mobile.

### Primary CTA
"SHOP NOW" (all-caps on yellow button) — delivery-first.

### Trust Signals
Minimal on homepage. Brand partnerships implied through cards below fold.

### Visual Register Assessment
Eaze is **the most experimental cannabis brand visually.** The monospace body font + extended display headline + pastel gradient + yellow brutalist CTA is a coherent, distinctive system. It reads as design-literate and intentional. It's not "safe cannabis green" — it's closer to a streetwear brand or an independent magazine.

**PuffPrice consideration:** The editorial confidence is admirable. The monospace body is probably too unusual for a utility-first tool. But the approach of *not* using any cannabis-coded colors or imagery is directly applicable.

---

## 1.6 Illinois Competitor Search Results (google.com search: "Illinois cannabis deals dispensary near me")

**Search conducted:** 2026-04-28

### Top 3 Organic Results

**Result 1: Weedmaps** (weedmaps.com/deals/peoria-il)
Already audited above. Dominates IL-local cannabis deal searches.

**Result 2: Cannasaver by Cannapages** (deals.cannapages.com/weed-deals/illinois)

Visual assessment: **This is the clearest anti-pattern in the cannabis deal space.** Green cannabis leaf header with tiled leaf-pattern background (literally a full-bleed leaf wallpaper). Banner ads above the fold: "RABBIT HOLE 🌈 600MG Δ9 THC GUMMIES only $40 CLICK NOW" with rainbow-colored product photo. Coupon cards show product photography but with low-quality rendering. Typography is generic system sans. The header uses a book/coupon hybrid logo in white on green that reads as discount retail.

This is what PuffPrice is leaving behind. Cannasaver is the aesthetic floor — everything below this register signals "untrusted bargain bin."

**Result 3: RISE Dispensaries** (risecannabis.com/dispensaries/illinois/deals)
A single-brand dispensary chain's own deals page. Clean-ish branded experience (RISE uses a corporate blue). Not a meaningful competitor to PuffPrice's aggregator model.

---

## Screenshots Reference

| Site | Screenshot ID | Date |
|------|--------------|------|
| Leafly homepage | ss_375348b1y, ss_8692b6gbj, ss_3617li2e8 | 2026-04-28 |
| Leafly dispensaries | ss_1728rpx4f | 2026-04-28 |
| Weedmaps homepage | ss_96745pgmb, ss_1248liuzl | 2026-04-28 |
| iHeartJane | ss_7682iqxz7, ss_9603l5yvl | 2026-04-28 |
| Dutchie | ss_7726kknvo, ss_9672oktdj, ss_0594d8z3k | 2026-04-28 |
| Eaze | ss_77302gmti, ss_9712ytt60 | 2026-04-28 |
| Cannasaver IL | ss_9668t4zwl, ss_66466z1cd | 2026-04-28 |
