# CleanList Design System
> Drop this in project root. AI coding agents read it automatically.

## Identity
Product: PuffPrice — Illinois cannabis deal intelligence
Positioning: Fastest way for a real person to find a deal on weed, right now, near them
Voice: Direct. Useful. Zero fluff. Built for a parking lot, not a pitch deck.

## Color Palette
--color-primary: #22C55E (CTA buttons, GO HERE, savings badges)
--color-primary-dark: #16A34A (hover states)
--color-primary-light: #DCFCE7 (background tints)
--color-surface: #FFFFFF (page + card backgrounds)
--color-border: #E5E7EB
--color-text-primary: #111827
--color-text-secondary: #6B7280
--color-savings: #22C55E (savings amount)
--color-error: #EF4444
--color-warning: #F97316

## Typography
Font: Inter, -apple-system, sans-serif
Hero/Price: 2rem, 700 weight
H1: 1.5rem, 700
H2: 1.25rem, 600
Body: 1rem, 400
Label: 0.875rem, 500
Caption: 0.75rem, 400

## Spacing
Scale: 4/8/12/16/20/24/32/48/64px
Card padding: 16px | Section gap: 24px
Mobile horizontal padding: 16px
Max content width: 640px (mobile-first — this lives on phones)

## Deal Card
White bg, 1px --color-border border, 8px radius
Shadow: 0 1px 3px rgba(0,0,0,0.08)
Layout: dispensary name → deal title → savings badge → GO HERE button
GO HERE: full-width, --color-primary, 12px radius, 16px vertical padding

## Layout Rules
1. Mobile-first always — designed for 390px viewport
2. One action above the fold — GO HERE visible without scrolling
3. No modals — push/pop navigation only
4. GPS fires on load automatically
5. Skeleton cards immediate — no spinners longer than 1s
6. Tap targets minimum 44px height

## Icons (lucide-react, stroke 1.5px)
MapPin: location | Navigation: GO HERE | Tag: deals
DollarSign: savings | Clock: hours | Phone: phone

## Brand Config
lib/brand.ts — one string change renames entire site. Never hardcode brand strings.
