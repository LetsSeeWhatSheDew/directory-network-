---
name: "puffprice-design"
description: "Use for any PuffPrice design, copy, page, component, flyer, social post or share image so it matches the Gold Leaf look (forest, cream, gold, the drawn leaf, the cream coupon, Fraunces + Instrument Sans, 'Best Bud For Your Buck$' voice)."
---

# PuffPrice design system: Gold Leaf (since 2026-11-11)

Gold Leaf replaced Breathe on Nov 11, 2026. It was taken from the three Nov 10 flyers Matthew approved and uses (Gold Leaf, Big Leaf, Leaf Code). Breathe (haze, orb, day/night, exhale motion, Plex Mono) is retired: don't use it, don't bring it back.

Source of truth:
- In code: `app/components/gold/gold.css` (the `--g-*` tokens), the shared kit `app/components/gold/Kit.tsx`, the category pictures `app/components/gold/Art.tsx`, and the leaf `lib/leaf.ts` / `public/gold-leaf.svg`. The old `--pp-*` tokens at the end of `app/globals.css` are remapped to this palette.
- The artifact: https://claude.ai/artifact/C2wPEV9q47JsdxUhWpe7uy (updated Nov 11).
If they disagree, the live code wins and the artifact gets fixed.

Matthew rejected Breathe, Best Bud, Scout, Vault, Gallery and Instrument as cheap or generic. The brief: "not generic, not cookie-cutter, not AI-looking, not a data dump; visual for a stoned audience but not overwhelming." Extend Gold Leaf; don't start another reskin unless he asks.

## Rules that come first
1. One hero per screen: the saving, in gold or forest, never both.
2. Visual, not busy: one picture per card, at most four cards in a row.
3. Cream text on forest, forest text on cream. Nothing grey on green.
4. Numbers never animate. The leaf may sway; nothing else moves. Reduced motion = still page.
5. No photos, no product shots, no consumption, no AI images passed off as real places.
6. Footer: "Independent. Nobody pays us to rank. 21+."
7. Every count a person sees comes from the deduped deals and matches what's listed.

## Colors (one theme, no day/night)
- forest #10291c · forest-2 #173a28 · forest-3 #1f4a33 · night #0b120e
- cream #f4ead5 · cream-2 #eadcbd · paper #f7f0e1
- ink #10201a · ink-2 #3c4a40
- gold #d9ac4f · gold-hi #f6dc8f · gold-lo #9c6f22 · gold-ink #7a5214 (gold for text on cream, 5.3:1)
- open-now green #7fd99a
- hairlines: rgba(244,234,213,.16) on forest; rgba(16,32,26,.14) on cream
- gold gradient: linear-gradient(135deg, #f8e3a1 0%, #d9ac4f 45%, #a8762a 100%), for the money only
- Buttons: filled forest with cream text.

## Type
- Display: Fraunces, the self-hosted soft-display cut (12 KB; `font-variation-settings: "SOFT" 100`). Headlines, the wordmark, big numbers.
- Everything else: Instrument Sans. No monospace anywhere.
- No all-caps product names in running text: menu names show in normal case.

## Shape
Cards radius 22px, tiles 18px, pills full round. Gutter clamp(16px, 4.5vw, 32px), max width 1120px.

## Signature pieces (use the kit, don't redraw)
- **The leaf** (`lib/leaf.ts`): the brand mark and the one graphic flourish.
- **The coupon** (`HeroTicket`): the best everyday deal near you, on cream, notched and perforated, with a big number, the category picture and one "Take me there →" button. Under it: "Seen on {store}'s own site today at 6:15 AM. Nobody pays to rank." It prefers a store that's open now; when the nearby pick is closed it says so ("Closed · Opens tomorrow at 8:00 AM").
- **Band**: every page opens on a forest band with the page's one headline.
- **MiniTicket, DealLine, SavePill, StoreDeals, StoreCard, Faq**: lists, grouped by store, with "+N more" folding open.
- **Category pictures** (`Art.tsx`): flower, vapes, edibles, "Dabs & wax", pre-rolls and others, hand-drawn in code. One per card.

## Voice
Warm, plain and a little wry, for someone standing in a parking lot. "Best Bud For Your Buck$" is the line. Short sentences, no pot puns beyond that line, no urgency or countdowns, no claims we can't back:
- Free alerts are a Monday email. Pro is an email as soon as a check finds a deal. No SMS, push or "early access" until they exist.
- Deals come from each store's own site or official social, checked every morning; 72 hours without a check shows "verification pending", 7 days switches it off.
- "Nobody pays to rank." Stores can buy a market report; nobody can buy a spot.

## Social and print
The flyers set the look: forest field, one big gold leaf, cream type, a QR code with its own `utm_campaign`. No product photos, no consumption.
