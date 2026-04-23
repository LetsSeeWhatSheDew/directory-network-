# Content Pilot — nuEra East Peoria
**Slug:** `nuera-east-peoria`
**Pilot selection rationale:** Peoria-adjacent representative. Full contact data with logo, complete seven-day hours, and the highest active-deal count in the database at time of writing (5). Chain-owned but with a family-business corporate profile (nuEra is IL-family-owned, vertically integrated). Good template for the Peoria / Central IL corridor where PuffPrice has real local competitive relevance.
**Target word count:** 250–350
**Actual word count:** ~320

---

## Long description (drop-in for `master_listings.long_description`)

nuEra East Peoria is a recreational and medical cannabis dispensary at 504 Riverside Dr in East Peoria, directly across the Illinois River from downtown Peoria. The location is one minute off the I-74 Bob Michel Bridge and serves the Central Illinois corridor — Peoria, East Peoria, Morton, Washington, Pekin, and Creve Coeur — with drive times between 5 and 20 minutes from most of those communities. For buyers coming from Bloomington, Galesburg, or Springfield, the East Peoria exit is a natural stop on the I-74 / I-155 routing.

nuEra is IL-family-owned (Fitzsimmons family, Chicago-headquartered, vertically integrated with the Ieso cultivation acquisition in early 2024). The East Peoria location carries nuEra's house flower brand alongside a broad cross-section of Illinois-licensed brands across flower, pre-rolls, concentrates, vape carts, edibles, tinctures, topicals, and accessories. The dispensary serves both adult-use recreational customers and Illinois medical cannabis cardholders; curbside pickup is available for medical patients, and online pre-ordering is open to all customers.

Hours run 9 AM to 8 PM Monday through Wednesday, 9 AM to 9 PM Thursday and Friday, 9 AM to 9 PM Saturday, and 9 AM to 6 PM Sunday. Debit cards work via the standard Illinois cashless-ATM workaround — there's a $3.50 fee on debit transactions, and an ATM is on-site for cash buyers who'd rather skip it.

Five deals are currently active here: first-time customer 20% off, Munchie Monday 20% off edibles, Wax Wednesday 25% off concentrates, Flower Friday 15% off all flower, and a 10% veterans discount that runs every day of the week. The weekday stack is intentional — Monday's the edibles day, Wednesday's the concentrates day, Friday's flower, and if you're a veteran or a first-time customer, those discounts stack on top. Combined, the highest-value trips are first-time visits on a Wednesday (concentrate-focused) or Friday (flower-focused).

---

## FAQs (for `/l/nuera-east-peoria` detail page)

### How much is the debit card fee at nuEra East Peoria?
$3.50 per transaction, run as a cashless-ATM withdrawal. This is standard in Illinois cannabis retail — federal law blocks most card networks from settling cannabis payments, so dispensaries use the cashless-ATM workaround. Bring cash to skip the fee; there's also an on-site ATM if you arrive empty-handed.

### Do they do curbside pickup?
Yes, for Illinois medical cannabis cardholders. Recreational customers need to come in and check out at the register. Online pre-ordering is open to everyone — place your order ahead, skip the menu-browsing time, pay and pick up in-store.

### Can I stack the deals — for example, first-time 20% off plus Wax Wednesday 25% off?
Policy on deal-stacking varies by dispensary and often by promotion. Call ahead at (309) 839-1330 to confirm which combinations the store will honor on a given day — in-store staff can tell you definitively before you ring up.

### Where do people park at nuEra East Peoria?
Dedicated surface lot at 504 Riverside Dr, directly in front of the store. Easy access from I-74 (Bob Michel Bridge exit) and US-24. Parking is free and plentiful — this is suburban retail, not a downtown constraint.

### Is this a medical-only dispensary or recreational too?
Both. Adults 21+ with a valid government photo ID can buy recreational product. Illinois medical cardholders get tax advantages (the state waives certain excise taxes on medical cannabis) and have access to curbside pickup plus occasional medical-specific promotions.

---

## Pulled content (for the content-depth layer sidebar)

**Address:** 504 Riverside Dr, East Peoria, IL 61611
**Phone:** (309) 839-1330
**Website:** https://nueracannabis.com/dispensaries/il/east-peoria/
**Hours (from `listing_hours`):**
- Mon–Wed: 9:00 AM – 8:00 PM
- Thu–Fri: 9:00 AM – 9:00 PM
- Sat: 9:00 AM – 9:00 PM
- Sun: 9:00 AM – 6:00 PM

**Active deals (5):**
- First-time customer — 20% off (all categories)
- Munchie Monday — 20% off edibles (Mondays only)
- Wax Wednesday — 25% off concentrates (Wednesdays only)
- Flower Friday — 15% off all flower (Fridays only)
- Veterans discount — 10% off every day (with valid veteran ID)

**Neighborhood context:**
Directly across the Illinois River from downtown Peoria via the I-74 Bob Michel Bridge. Walking distance to the East Peoria riverfront and five minutes from Festival Park. Nearest competing IL-licensed dispensaries: NOXX East Peoria (300 S Main St, also in East Peoria — ~1 mile away), Ivy Hall Dispensary (W War Memorial Dr, Peoria proper — ~10 minutes), Trinity on Glen (W Glen Ave, Peoria — ~12 minutes), Trinity on University (N University St, Peoria — ~15 minutes), Beyond Hello Peoria (~20 minutes), and Bloom Wellness Quincy locations (~90 minutes southwest).

**Chain context:** nuEra operates 5+ Illinois dispensaries (Aurora, Champaign, East Peoria, Urbana, and others). The family-owned-and-operated positioning is a real differentiator in a state where most multi-location operators are MSOs (Cresco, Green Thumb, Verano).

**Tax profile:** Tazewell County — noticeably friendlier than Cook County / Chicago on effective cannabis tax rate. Part of why Central Illinois buyers make the trip to East Peoria rather than driving north into the higher-tax Chicago metro.

---

## Author notes (not for publishing)

- The existing long_description in the database (136 words, just below the 150-word floor) is already reasonably good — this pilot's version is an expansion that (a) clears the floor, (b) adds navigation/parking specifics, (c) adds the weekday-deal stacking logic as a user-utility narrative, and (d) names specific competing dispensaries for internal-link opportunities.
- The weekday deal rhythm (Munchie Monday / Wax Wednesday / Flower Friday) is a real, repeatable piece of content — this pattern is used by many IL dispensaries, and if the scraped deals feed confirms it holds elsewhere, we could templatize "weekly deal cycle at your local dispensary" as a reusable content block.
- "Ieso acquisition" is a real 2024 event but is the kind of detail that can be trimmed if the copy feels too business-profile-y for a consumer-facing page. Leaving it in the draft so Matthew can strike it if so.
- Deal-stacking question is intentionally hedged — we don't have canonical data on which IL dispensaries stack what promotions, and guessing wrong on a specific policy creates a customer complaint surface. Always prefer "call to confirm" over a made-up rule.
- Did not quote prices. Same rationale as the other two pilots.

---

## Cross-pilot observations (across all 3 drafts)

Writing these three together surfaced a few pattern-level things worth noting for the bulk-generation phase:

1. **The county-tax framing is genuinely useful to a price-sensitive buyer** and should probably be a field in the content template. Cook + Chicago (highest), DuPage/Kane/Will (middle), Central IL counties (lowest). This directly supports PuffPrice's entire "deal finder" positioning.

2. **The parking / transit / neighborhood section is where content actually earns its keep for the parking-lot user.** Generic dispensary marketing doesn't cover "is there free parking" or "is the nearest Metra platform walkable" — that's exactly what a real buyer wants to know.

3. **FAQs that cross-sell to our own data ("is it medical-only?") are free** — a "this store accepts medical cards" answer implicitly surfaces our `is_medical_friendly` flag. If bulk-generation sticks to the 5-FAQ template, we should reserve one slot for a "what does this store do differently" question and let that be the variable one.

4. **Deal counts and deal rhythm are the most evergreen content pieces** — specific prices go stale, but "this store runs a weekday-themed promo cycle" is a factual structural fact that holds across many IL dispensaries.

5. **"Factual, not promotional" is harder to hold than expected.** The draft versions I started with all drifted toward dispensary-marketing voice. The finished versions read noticeably flatter. That flatness is the brand differentiator — it's *why* a PuffPrice page would earn a citation where the dispensary's own page wouldn't — but it needs to be held consciously.
