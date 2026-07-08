# PuffPrice Design System
> Drop this in project root. AI coding agents read it automatically.
> **Design Direction v2 — "warm price-truth instrument" (2026-06-13).**
> Source of truth is `app/globals.css` (`:root` tokens + `@theme inline` bridge).
> This file must track globals.css — if they disagree, globals.css wins.

## Identity
Product: PuffPrice — Central Illinois cannabis deal intelligence
Positioning: Fastest way for a real person to find a deal on weed, right now, near them
Voice: Direct. Useful. Zero fluff. Built for a parking lot, not a pitch deck.
Look: A warm, flat, financial-instrument feel. Three greens on warm neutrals,
mono numerals, hairline rules instead of shadows. No gradients, no glow, no
soft shadows — anywhere.

## Color Palette (v2 — the `--pp-*` tokens)
--pp-ink: #15231A        — primary text (near-black green)
--pp-body: #2C382F       — body text on paper
--pp-paper: #F4F5EF      — page background (warm neutral)
--pp-surface: #FCFCFA    — card / board surfaces
--pp-canopy: #1C3A22     — deep brand green: header strips, footer, dark sections (FLAT)
--pp-canopy-text: #F4F1E8, --pp-canopy-eyebrow: #9DBE7E
--pp-signal: #2E7D32     — THE one earned accent: best price, verified, savings, primary CTA
--pp-signal-ink: #2E5320 — text on signal tint
--pp-best-tint: #E8F0DF / --pp-best-border: #CBE0B4 — the #1 / best-price row
--pp-high: #C24A1E       — above-median / pricier marker (used sparingly)
--pp-muted: #6B7268 · --pp-strike: #9A9A8E · --pp-border: #DCDED2 (hairlines)

**Legacy `--color-*` names are remapped onto these** in globals.css so
unmigrated components inherit the v2 look. Do not add new `--color-*` uses;
reference `--pp-*` (or the Tailwind `pp-*` utilities) directly.

## Typography (self-hosted via next/font in app/layout.tsx)
- Display — **Space Grotesk** (`var(--font-display)`): headlines, store names, section titles
- Body — **Inter** (`var(--font-body)`): paragraphs, nav, buttons, labels
- Numerals — **JetBrains Mono** (`var(--font-mono)`): ALL prices, %, counts, timestamps, eyebrows
- **Never hardcode a family name** (`Manrope`, `Georgia`, `Geist`, bare `system-ui`).
  Those fonts are NOT loaded and silently fall back to system-ui. Use the `var(--font-*)` tokens.
- Type scale is clamp-based in globals.css: `.pp-hero`, `h1/.pp-h1` … `h4`, `.pp-eyebrow`,
  `.pp-meta`, `.pp-longform`, and the `.price`/`.tabular` mono-numeral utility.

## Spacing / Radius / Elevation
- Spacing tokens `--space-1…32` (4px base). Container helpers: `.pp-container`, `-narrow`, `-reading`, `-detail`.
- Radii `--radius-sm 4 / md 8 / lg 12 / xl 14 / pill`. Cards use `lg`/`xl`, buttons `md`, chips `pill`.
- **Elevation is removed.** `--shadow-sm/md/lg` are all `none`. Structure comes from flat
  fills + 1px hairline borders (`--pp-border`), never box-shadow.

## Components (globals.css)
- `.pp-card` / `.pp-card-elevated` — flat surface, hairline border, border-color hover only.
- `.pp-surface-deep` — canopy band (header/footer). Pair with `.pp-leaf` watermark (≤6% opacity).
- `.pp-btn` + `-primary` (signal) / `-sand` (canopy) / `-outline` / `-outline-cream` / `-ghost`; sizes `-sm/-lg/-xl`. Min 44px tap target.
- `.pp-pill`, `.pp-eyebrow` (mono, uppercase, tracked), `.pb-*` (PriceBoard — the signature object).
- Motion: `.pp-fade-up[-delay-n]`, `.pp-fade-in`, `.pp-pulse-dot` — all reduced-motion-aware. No glow pulses.

## Layout Rules
1. **Mobile-first, designed at 390px.** Thumb-reachable CTA, legible savings number in sunlight (AA contrast), no horizontal scroll, tap targets ≥44px.
2. One dominant recommendation above the fold (homepage = the PriceBoard).
3. Savings number is the biggest visual element on every deal card.
4. Clean financial-tool credibility, not stoner-site clichés.
5. Headline "Best Bud For Your Buck$" stays.
6. GPS fires on load; skeletons over spinners.

## Icons
lucide-react, stroke 1.5–2.25px. Category icons via `<CategoryIcon slug="…" />` (lib/categoryIcons.tsx).

## Brand Config
lib/brand.ts — one string change renames the entire site. Never hardcode brand strings.

## Known follow-ups (see docs/AUDIT-JUL26.md)
- Homepage `<style>` block still hardcodes hex values that duplicate `--pp-*`; some dead pre-component CSS remains.
- De-shine not finished on every page (a few inline `box-shadow`s linger outside globals.css).
- Logo wordmark is spec-locked to "Manrope 800" but Manrope isn't loaded — needs a brand decision (load Manrope vs. adopt Space Grotesk).
