# Tier 1 Outreach — v2 (Data-Integrity Reshape + Central IL Filter)
**Date:** April 24, 2026 (morning)
**Supersedes framing of:** `docs/ops/tier-1-gap-fill-contact-research-20260423.md`
**Does NOT supersede data:** the v1 contact research (phones, websites, licenses, executive names) is still canonical — treat this doc as a v2 *angle* overlay on that research.

---

## What changed between v1 and v2

### v1 pitch (retired)

> "We'll send you customers. Here's a free listing. Call us back so we can confirm your phone number."

v1 was written for a traffic-driven conversation. At zero MRR, that claim is unprovable. It reads like sales spam to anyone who has spent time in the industry.

### v2 pitch (adopted today)

> "We're an Illinois cannabis deal site and we're verifying every Central IL listing this week for accuracy. Your dispensary is on the list. Can you confirm the deals we're showing are still running? If any are stale or wrong we'll pull them today."

v2 is a **data-integrity ask**, not a sales ask. It:

- Inverts the power dynamic. We aren't asking them for anything — we're offering to *remove inaccurate information* about them.
- Creates urgency without fabricating it. "Your listing goes live to consumers this week either way — want to make sure it's right?" is a legitimate operator concern.
- Has a zero-pressure out. If they ignore us, we still ship the listing; we just ship it with the data we have, flagged "unverified."
- Matches our actual posture. We *are* indexing their deals. That's the substance. Pretending we're already driving traffic they need is the fake part.

### Central IL filter

The session-locked scope (`docs/central-illinois-scope.md`) narrows public positioning to 11 Central IL cities. The v1 Tier-1 list was statewide.

**Of the 9 original Tier-1 targets, only 1 (nuEra Champaign) is in Central IL.**

The other 8 remain reachable, remain valid data-integrity opportunities, and remain in this doc for future reference. They are marked **OUT OF SCOPE** and drop to secondary priority. They are not deleted because the underlying listings on puffprice.com still exist and still deserve accurate contact data.

---

## Central IL priority list (in scope)

One target from the original 9 survives the Central IL filter. Two *additional* Central IL priorities surface from the April 24 data audit.

### 1. nuEra Champaign — in scope ✓ — highest priority
- **Slug:** `nuera-champaign`
- **Active deals on PuffPrice:** 4 (powers 36% of Central IL's active deal surface)
- **Gap:** `phone IS NULL` and `website IS NULL` in `master_listings`
- **Contact path:** Laura Jaramillo Bernal — `ljaramillo@nueracannabis.com` (also covers nuEra East Peoria). See reshaped template below.
- **Why this one above all:** corporate-parent email covers both Champaign (4 deals, contactless) AND East Peoria (5 deals, reachable). One email = 9 of 11 Central IL active deals verified.

### Added from data audit: nuEra East Peoria — in scope ✓ — priority 1b
- **Slug:** `nuera-east-peoria`
- **Active deals on PuffPrice:** 5 (largest Central IL cluster)
- **Gap:** None — phone and website are populated. Added here because Jaramillo Bernal is already the right contact for Champaign; confirming East Peoria's 5 deals in the same email makes the outreach one-and-done.
- **Store phone (for direct manager call if email doesn't land):** (309) 839-1330

### Added from data audit: Ivy Hall Peoria — in scope ✓ — priority 2
- **Slug:** `ivy-hall-dispensary`
- **Active deals on PuffPrice:** 2
- **Gap:** None — phone and website are populated.
- **Contact:** (855) 489-4255 (chain support line)
- **Why prioritize:** Ivy Hall is not in the v1 Tier-1 list because they had no contact gaps. Under the v2 data-integrity pitch, we still want to verify the two deals. 3rd highest active-deal count in Central IL.

---

## Out-of-scope (retained for reference, deprioritized)

These 8 dispensaries from v1 are **outside Central IL** under the locked scope. They remain valid outreach targets, their listings continue to serve on the site, and the contact research in v1 stays canonical. We just don't call them this week.

| # | Name | City | County / Region | v1 Deals | Status |
|---|---|---|---|---:|---|
| 2 | nuEra Aurora | Aurora | Kane / Chicago collar | 4 | OUT OF SCOPE — same corporate email will cover it anyway |
| 4 | Nature's Treatment Galesburg | Galesburg | Knox / Western IL | 3 | OUT OF SCOPE — adjacent to Central IL; candidate for first expansion |
| 1 | Altius Carol Stream | Carol Stream | DuPage / Chicago collar | 5 | OUT OF SCOPE |
| 5 | Prairie Cannabis Naperville | Naperville | DuPage | 3 | OUT OF SCOPE |
| 6 | Star Buds Westmont | Westmont | DuPage | 3 | OUT OF SCOPE |
| 7 | Hi5 Crestwood | Crestwood | Cook | 2 | OUT OF SCOPE |
| 8 | Bisa Lina Carol Stream | Carol Stream | DuPage | 1 | OUT OF SCOPE |
| 9 | Zen Leaf Aurora | Aurora | Kane | 1 | OUT OF SCOPE |

**Galesburg note:** Of the 8 out-of-scope targets, Nature's Treatment Galesburg is the closest to Central IL — Knox County is directly west of Peoria County. If the 90-day expansion plan in `central-illinois-scope.md` triggers on Quincy first, Galesburg is the logical second expansion.

---

## Reshaped email template — nuEra (Laura Jaramillo Bernal)

Use this template verbatim or near-verbatim when Matthew sends. Personalization notes in `[brackets]`.

### Subject line (A/B options)

- **A (recommended):** "PuffPrice — verifying your nuEra Champaign + East Peoria listings this week"
- **B (shorter):** "Data check — nuEra listings on PuffPrice"

### Body

```
Hi Laura,

My name is Matthew [last name]. I run PuffPrice (puffprice.com), an
independent cannabis deal index for Illinois. We're a small operation
based in Peoria — not a marketplace, not an affiliate program. We
index publicly-posted dispensary deals so consumers can compare them.

I'm writing because nuEra is currently one of the largest deal sources
on the site. Right now we show:

  - nuEra East Peoria — 5 active promotions (Flower Friday,
    Munchie Monday, Wax Wednesday, Veterans 10%, first-time 20%)
  - nuEra Champaign — 4 active promotions (Munchie Monday, Wax
    Wednesday, student 10%, first-time 20%)

Two asks, neither of them commercial:

  1. Can you confirm those eight promotions are still running
     this week? If any are stale or the percentages have shifted,
     I'll correct the listing today.

  2. For nuEra Champaign specifically, our records don't have a
     phone number or website URL attached — so when a consumer
     lands on the page, they can't click through. The public
     record I have is (217) 530-4077 and
     https://nueracannabis.com/dispensaries/il/champaign/. Are
     those the right fields to use?

Everything I'm indexing is from your published marketing — Weedmaps,
Dutchie, your own website — so there's nothing confidential. I just
want the listing to be right before traffic starts hitting it this
week.

Happy to take corrections by email or on a five-minute call. The
listing is live either way; your input just makes it more accurate.

Thanks for the read,

Matthew
matthew@jacarandapeoria.com
puffprice.com
```

### Notes on this template

- **No mention of "we'll send you customers."** The pitch is structural (indexing, accuracy) not promotional (traffic, referrals).
- **Specific deals named.** Forces the recipient into a binary response — either those promotions are live or they aren't. "Here's a free listing, call us" invites ignoring. "Here are your eight promotions by name, confirm them" invites a yes/no.
- **Covers both dispensaries in one email.** One reply fixes 9 of 11 Central IL active deals.
- **Public-record framing.** Nothing in here requires nuEra to disclose anything they haven't already published. Reduces the "why are you contacting me?" friction.
- **No scary legal language, no "sign up," no dashboard.** Just human correspondence.
- **Explicit out.** "The listing is live either way." Removes the feeling of being asked for a favor. This is a consequence of the indexing work, not a negotiation.

---

## Monday call script (if email doesn't land by Monday AM)

Call the store directly at (217) 530-4077 (Champaign) or (309) 839-1330 (East Peoria). Keep it to 60 seconds.

```
Hi — this is Matthew from PuffPrice, an Illinois cannabis deal
site. I'm not selling anything. I'm verifying your current
promotions for our listing this week. Is whoever handles your
deals / digital marketing / marketing available, or can I
leave a 30-second message?
```

If you get the marketing contact:

```
Thanks — just a data check. We show [list 2-3 specific deals].
Are those still the current promotions, or have any changed? I
can update the listing today either way.
```

**Do not ask them to sign up, claim the listing, or do anything on our site.** The manager's job is to confirm accurate data, not to evaluate a product.

---

## Why this reshape lands better

1. **It matches the actual value proposition at MRR=$0.** Our current product is accurate deal indexing. Pretending it's traffic generation is a credibility hit the moment anyone checks our traffic.
2. **It gives us something to offer that they want.** Dispensary operators care about their own listings being accurate — Yelp and Weedmaps have trained them to care. "Can you confirm?" meets them where they are.
3. **It gives us a no-cost fallback.** If 8 of 9 Central IL targets ignore us, we still ship the listings with the data we have, flagged "unverified — call to confirm." That's operationally fine and editorially honest.
4. **It's a repeat-visit framing.** Next quarter we can send the same "verifying your listings" email to the same contact. Because it's not a sales pitch, there's no one-shot pressure.
5. **It doesn't over-claim our reach.** Zero-MRR sites that claim traffic get dismissed. Zero-MRR sites that claim accuracy get humored.

---

## Success metrics for this reshape

Over the April 24–30 outreach week:

- **Minimum win:** 1 reply from Jaramillo Bernal confirming or correcting at least 4 of 9 named nuEra deals. Closes the highest-leverage Central IL data gap in one conversation.
- **Stretch win:** Jaramillo Bernal confirms all 9 AND provides the missing nuEra Champaign phone/website. Cleans up the Champaign anomaly (3 of 3 Champaign listings contactless) in one pass.
- **Operational learning:** email response rate vs. phone-call pickup rate for data-integrity asks. Informs the May outreach cycle.

---

## Filed-and-closed items

- v1 doc (`2026-04-23.md`) retained verbatim for the underlying contact research.
- Contact information for all 9 original targets remains canonical — v2 doesn't republish it, it just reframes the pitch.
- Next action: Matthew sends the Jaramillo email this week. Cowork does not touch this doc again until a reply (or silence after 5 business days) changes the status.
