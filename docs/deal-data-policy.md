# PuffPrice Deal Data Policy

**Effective:** April 26, 2026
**Owner:** Matthew (policy) + Cowork/Code (implementation)
**Status:** Active. Supersedes the implicit "whatever the scraper brings back" behavior in place through April 25.

---

## TL;DR

Every deal PuffPrice publishes is pulled directly from the dispensary — their own website, their own social accounts, or a direct conversation with staff. Aggregators are off-limits. Every card shows when it was last verified. If a deal goes stale, it disappears within one scrape cycle. When no deals are live for a city, we say so — we don't pad the feed.

This is how we earn the right to be the source of truth for Central Illinois instead of a middleman repeating what the aggregators already say.

---

## 1. Sources

PuffPrice pulls deal data from these sources only:

1. **Direct dispensary websites.** The licensed dispensary's own domain. Any `/deals`, `/specials`, or `/menu` surface hosted under a dispensary-owned URL. Where a dispensary embeds a menu iframe from a POS partner (Dutchie, Jane, etc.) on their own site, that counts as direct — we are reading the dispensary's own page, not a third-party marketplace.
2. **Official dispensary social media.** Facebook and Instagram posts from a verified, dispensary-owned account. Deal claims here must be recent (posted within the current scrape window) and must identify the dispensary clearly enough to attribute without guessing.
3. **Direct contact.** Phone, email, in-person, or confirmed SMS from an identifiable dispensary staff member. Used when the dispensary advertises a promotion offline or in a channel the scraper cannot read.

That's the list. Nothing else enters the deal set.

### What we never use

- Leafly
- Weedmaps
- iHeartJane consumer marketplace
- Dutchie marketplace (distinct from a dispensary-owned Dutchie-embedded menu)
- Any other consumer-facing cannabis aggregator or directory
- Scraped copies of the above (cached, mirrored, API-proxied, or otherwise)

This is a hard line, not a preference. See section 4 for the full rationale.

### Legacy deals

All deals on PuffPrice prior to April 26, 2026 were pulled from Leafly and Weedmaps. They are being deactivated in a single cutover on April 26 and replaced by direct-source deals as the new scraper catches up. The cutover may temporarily reduce the public deal count to single digits. That is expected and acceptable — a smaller accurate set beats a larger set we cannot stand behind.

---

## 2. Freshness guarantee

**Scrape cadence:** every 6 hours. Four runs per day, per listing that has a scrapable surface.

**What every deal card shows:** the timestamp of the most recent successful verification — the run where the scraper saw the deal still live on its source.

**Freshness bands:**

- **Fresh** — verified within the last 24 hours. Card renders normally.
- **Recent** — verified 24 to 72 hours ago. Card renders normally with a "verified N days ago" note.
- **Verification pending** — verified more than 72 hours ago and still present in our DB as active. Card renders with a muted state and a "verification pending" badge. After 7 days without a successful re-verification, the deal is automatically deactivated and removed from the public feed.

72 hours is the hard edge between "we can still stand behind this" and "we have to warn the user." If the scraper is broken, every card tips into "verification pending" before we quietly disappear deals — the user sees the staleness, we don't pretend.

---

## 3. What happens when a deal expires or disappears from its source

A deal is considered **gone** when the scraper runs and the deal is no longer present on the source surface (page 404, promo removed from list, social post deleted or aged out).

When a deal is gone:

1. **Deactivated within one scrape cycle** (within 6 hours of the first failed verification).
2. **Not displayed to users.** Deactivated deals do not appear in feeds, search results, category pages, listing detail pages, or the sitemap.
3. **Archived in the DB with a reason code.** The row is not deleted. We keep `is_active=false`, a `deactivation_reason` (`source_removed`, `source_unreachable`, `aggregator_cutover`, `manual_override`, etc.), and the last-seen timestamp. This lets us reconstruct deal history for the savings-tracking and index features, and lets us re-activate cleanly if the deal reappears.

Deals that flip to inactive then active again do not count as two separate promotions — they share an identifier.

---

## 4. Why no Leafly, Weedmaps, iHeartJane, or Dutchie marketplace

Three reasons, in descending order of immediate importance for a solo-founder business.

**Terms of service.** Every major cannabis aggregator prohibits scraping in their ToS. A single cease-and-desist would be a legal exposure this business cannot absorb right now — there is no retained counsel, no scraping-friendly jurisdiction play, and no commercial contract that would survive a scraping claim. Avoiding aggregators avoids the exposure.

**Positioning.** PuffPrice's value is being the source of truth for Central Illinois cannabis deals — not a middleman summarizing someone else's aggregation. Scraping Leafly to show what's already on Leafly produces a worse Leafly, not a better deal site. The direct-source policy is what lets us claim "this came from the dispensary" with a straight face.

**Data quality.** Aggregator deal data is already abstracted one layer from the dispensary. By the time a promo lands on Leafly and we pull it, it has gone through Leafly's ingest rules, Leafly's deduping, and Leafly's display logic. Going direct gives us cleaner, more attributable data and lets the freshness guarantee in section 2 actually mean something.

A dispensary-owned Dutchie-embedded menu on the dispensary's own domain is not an aggregator — we are reading the page the dispensary controls, even if the menu widget is operated by Dutchie. Same for Jane and other POS partners that dispensaries embed on their own sites. The line is "marketplace product that competes with PuffPrice" vs. "POS embed inside a dispensary's own page."

---

## 5. What users see when no deals are live

When a surface has zero deals to show, PuffPrice renders an honest empty state. We do not pad the feed. We do not show stale "deals" with old dates. We do not synthesize generic "save more, shop more" promotions.

See `docs/empty-state-copy-20260426.md` for the exact copy for each scenario. In summary:

- **Homepage, zero deals live across all of Central IL:** "We're refreshing Central IL deals — check back in a few hours." Still invites users to browse dispensary listings and set up alerts.
- **City page with 0 dispensaries:** names the nearest CIL city with listings and links to it.
- **City page with dispensaries but 0 active deals:** shows the dispensary list without fake deal data, invites dispensary owners to submit deals directly.
- **Listing page with no active deals:** renders no deal card at all. A quiet absence, not an empty box.
- **Category page with 0 matches:** explicit "no [category] deals right now," suggests an adjacent category.

The design principle: a user in a parking lot should never walk into a dispensary expecting a deal that isn't there.

---

## 6. Verification levels

Every deal carries one of three verification levels, stored on the row and surfaced in card microcopy when relevant.

1. **`scraped_direct_source`** — pulled automatically from a dispensary-owned website, dispensary-owned social account, or a dispensary-embedded POS menu. Re-verified on the 6-hour scrape cycle. This is the default and target state for every deal.
2. **`verified_direct_contact`** — confirmed by Matthew or a PuffPrice team member via phone, email, in-person visit, or direct SMS with identifiable dispensary staff. Manual verification timestamp stored. Re-verification is manual on a cadence the team sets (default: weekly for this tier).
3. **`imported_not_verified`** — legacy rows imported from aggregator sources before April 26, 2026. This tier is being phased out. As of the April 26 cutover, all `imported_not_verified` deals are being deactivated in a single batch and will not return unless the same deal is rediscovered through a direct source.

A deal's verification level can only move "up" (toward more direct verification), not down. A `scraped_direct_source` deal that Matthew also confirms by phone becomes `verified_direct_contact`; it does not revert.

---

## 7. Why this matters to the user

Every deal on PuffPrice falls into one of two categories:

1. **Live right now** — re-verified within the last 72 hours at a direct source.
2. **Clearly marked** — "verification pending" or "last checked [date]," so the user knows the staleness before they drive anywhere.

There is no third category. No inherited aggregator rumor. No "we saw this three weeks ago." No deals scraped off a site that isn't the dispensary's own.

That is the floor the business commits to. It is the only claim PuffPrice can make about deal quality that the business can actually defend — against an operator who calls asking "why are you listing a promo I ended last month," against a user in a parking lot who drove somewhere expecting a deal, and against a future scale-up conversation where we have to explain how the data works.

---

## 8. Operational consequences

- **Deal count will be smaller for a while.** Initial post-cutover count is 2-5 deals in Central Illinois. This grows as the direct-source scraper matures and as direct-contact verification catches up with the priority list in `docs/scrape-coverage-20260426.md`.
- **Some dispensaries won't surface automatically.** If a dispensary has no website, an anti-scrape wall, or only posts deals to Instagram Reels, the scraper cannot reach them. Those dispensaries move into the direct-contact verification queue and are not visible in deal feeds until someone confirms manually.
- **Empty states are permanent infrastructure.** The homepage, city pages, and category pages are all built to render cleanly with zero deals. We will never revert to padding or fake-looking synthetic deals to avoid emptiness.
- **Outreach is framed around this policy.** When Matthew resumes dispensary outreach, the pitch is "we publish direct from you, we don't scrape Leafly, we verify every 6 hours." This policy is the outreach script.

---

## 9. Review cadence

- Deal data policy: reviewed monthly alongside the scope review (first review May 26, 2026).
- Freshness band thresholds (24h / 72h / 7d): reviewed after the first full month of direct-source scraping, once there's data on how fast deals actually change at Central IL dispensaries.
- Source allowlist: any change requires Matthew approval and a doc update here. This is not a thing that drifts through a commit.
