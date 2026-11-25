# 2026-11-25 · Code · Search Console fixes (Windsor.ai)

Search Console is now readable from Claude sessions through the Windsor.ai
connector (`searchconsole`, property `sc-domain:puffprice.com`).

## What Search Console says (Oct 29 – Nov 25, 2026, 28 days)

- About 19 clicks in 28 days. Google shows the site; people don't click,
  because nearly everything ranks on page 2 (position 10–30).
- Most impressions: the credit-card guide (592 impr, pos 10.7, 3 clicks), city pages
  (Champaign 396, East Peoria 385, Peoria 361, Springfield 234, Pekin 234,
  Urbana 214; all around position 15, 0–1 clicks each), out-of-state guide (209,
  pos 15.9), /green-wednesday (191, 4 clicks).
- Top searches are deal searches: "dispensary deals near me" (76 impr,
  pos 15.9), "edibles deals near me", "dispensary deals", "weed deals",
  "vape cart deals near me", "green wednesday 2026" (pos 6.7).
- Duplicates: `/deals/all?city=Peoria`, `/deals/flower?city=Peoria` and
  similar were indexed as their own pages under the same title as
  `/city/peoria`.

## Changed

1. `app/deals/[category]/page.tsx`: the canonical never includes `?city=`.
   `/deals/all?city=<public city>` → `/city/<slug>`. Any other combination →
   `/deals/<category>`. A visitor's location cookie no longer changes the
   canonical. A single category with a city gets its own title
   ("Peoria Flower Deals Today").
2. `app/guides/GuideParts.tsx`: every guide (all 8 use `RelatedGuides`) now
   links to all nine city pages ("Today's deals by town"). Before, none did.
3. `app/green-wednesday/page.tsx`: the same nine town links.

Verified: typecheck, 194/194 unit tests (3 skipped), lint ratchet, and a
fixtures build. Served locally: canonicals and titles correct for
`/deals/all?city=Peoria`, `/deals/flower?city=Peoria`, `/deals/flower` and
`/deals/all?city=Chicago`. The guide and /green-wednesday pages each show
9 `/city/` links. No sideways scrolling at 390 px.

## Next

- Re-pull Search Console about 2 weeks after this ships: are city pages
  moving from position 15 toward page 1? Is `?city=` dropping out?
- City pages need more links from outside the site (the Reddit post and
  the Green Wednesday pitch drafts in docs/strategy). Titles already lead with a real deal.
