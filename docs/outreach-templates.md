# Dispensary Outreach Email Templates

**Date:** April 18, 2026
**Owner:** Matthew
**Purpose:** Three email templates for reaching Illinois dispensaries. Drafts only — nothing sends until Matthew approves.

> **Voice notes for all three:** Matthew is a real person in Peoria, not a corporate spam funnel. Templates should sound like a human wrote them, reference that the dispensary is **already** on PuffPrice (we have their data), name one specific thing rather than three generic things, and have exactly one clear ask. No emojis, no ALL CAPS, no "exclusive opportunity," no "I hope this email finds you well."

> **Sender setup:** emails go from a real named inbox (`matthew@jacarandapeoria.com` or `hi@puffprice.com`). Plain-text feel with one optional inline link at the CTA. No images. No footer disclaimers beyond unsubscribe if legally required.

---

## Template 1 — Cold Outreach (Unclaimed Listing)

**Who it's for:** Dispensary whose listing is already in PuffPrice's database (we have their name, address, hours, maybe a photo) but no one has claimed it yet.
**When to send:** Anytime, but Tuesday–Thursday morning performs best for small-business email.
**Goal:** Get them to claim the listing and consider submitting a deal.

### Subject line (pick one — A/B test)
- A: `[Dispensary Name] is on PuffPrice — want to claim it?`
- B: `Your dispensary is on PuffPrice. Here's how to claim it.`
- C: `Quick note from Peoria — PuffPrice listing for [Dispensary Name]`

### Body (under 150 words)

> Hi [Manager name or "team"],
>
> I'm Matthew, running PuffPrice out of Peoria — it's a free Illinois cannabis deal tracker aimed at shoppers who want to see every active deal across the state in one place, ranked by savings.
>
> [Dispensary name] is already in our directory — we pulled your listing from public sources when we built the site. I'd rather you own it directly. Claiming takes about two minutes and lets you edit your hours, add photos, post deals, and update inventory as things change.
>
> There's no cost. We track deals whether you participate or not, but your offers rank better and show up with accurate info when you claim the listing yourself.
>
> Claim here: [one link — e.g. `puffprice.com/claim/[dispensary-slug]`]
>
> Happy to answer any questions — just reply.
>
> Matthew
> matthew@jacarandapeoria.com
> Peoria, IL

### Call to action
- One link. Takes them directly to the prefilled claim flow for their specific dispensary.
- No secondary CTAs. No "or reply with questions" AND a link — pick one primary path.

### Notes
- Personalization tokens: `[Manager name]` if we have it, otherwise `team`. `[Dispensary name]` exact as they're listed. `[dispensary-slug]` — the URL slug we already use in our DB.
- Keep the Peoria line in — it's a real differentiator from out-of-state spam.
- If the dispensary has a specific product they're known for, consider adding one line: "I noticed you carry a lot of Cresco — we rank Cresco deals well." Only if it's true.

---

## Template 2 — Deal Submission Invite (Already-Claimed Listing)

**Who it's for:** Dispensary that has claimed their listing but hasn't submitted a deal yet, OR a new dispensary Matthew has met at an event.
**When to send:** Ideally Sunday night / Monday AM — aligns with when dispensaries plan the week's promotions.
**Goal:** Submit a deal.

### Subject line (pick one)
- A: `Add a deal to PuffPrice this week?`
- B: `Quick way to put [Dispensary Name]'s weekly special in front of more shoppers`
- C: `One minute to post a PuffPrice deal`

### Body (under 100 words)

> Hi [Manager name],
>
> Matthew from PuffPrice. Your dispensary listing is live, and we're pulling solid traffic into the Illinois deal pages this week.
>
> If you've got a promotion running — BOGO, percent off, happy hour, anything — you can post it directly via your dashboard and it'll rank in our live deal feed within a few minutes. What helps: a short title, the discount, and the product or brand it applies to. Expiration date if there is one.
>
> Submit here: [direct link — `puffprice.com/dispensary/submit-deal`]
>
> Thanks,
> Matthew
> Peoria, IL

### What info to include (for the dispensary's reference — can go in the submission form itself or in a follow-up line)
- Deal title (e.g. "25% off all Cresco flower — Monday only")
- Discount type: % off / $ off / BOGO / happy hour
- Product or brand eligibility
- Start + end date, or recurring schedule
- Any fine print (loyalty requirement, minimum purchase, vet/medical-only)

### Notes
- Under 100 words as spec'd. Don't pad.
- Reference "this week" to create timeliness without being pushy.
- If Matthew knows the dispensary personally, replace first line with something specific ("Saw you had that Green Wednesday plan lined up — want to post it?").

---

## Template 3 — 7-Day Follow-Up (No Response)

**Who it's for:** Anyone who got Template 1 or Template 2 and didn't respond after 7 days.
**When to send:** Exactly 7 days after the first email, at the same time of day.
**Goal:** Remind without pestering. Assume they're busy, not uninterested.

### Subject line (one option, reply-thread to original email — keeps same subject, prepends "Re:" naturally)
- Use `Re: [original subject]` — keep it in the same thread.

### Body (under 75 words)

> Hey [Manager name] — just bumping this in case it got buried. Short version: your dispensary is on PuffPrice, you can claim the listing or post a deal in a couple minutes, and it's free.
>
> Link: [same link as original]
>
> If PuffPrice isn't useful to you, totally fine — just reply "not interested" and I'll take you off the list.
>
> Matthew
> Peoria, IL

### Notes
- Under 75 words. Keep it tight.
- The "reply not interested" line gives them an easy graceful exit AND saves Matthew from having to track who opted out.
- Do NOT send a third follow-up. If they don't respond after two, move on. Cold outreach with a 5%+ reply rate is a win; chasing below that erodes brand.
- If they reply "not interested," suppress future outreach in whatever tool Matthew uses — add a suppression list.

---

## Compliance Notes

### CAN-SPAM / TCPA basics
- Every outbound email (including Templates 1-3) must include a physical mailing address in the footer if it's a commercial message. A PO Box in Peoria is fine.
- Unsubscribe link or reply-opt-out required. "Reply not interested" in Template 3 satisfies the functional requirement, but for scale (more than ~50 at a time), wire up a proper unsubscribe link with Resend or similar.
- No false or misleading subject lines. All three above are accurate.

### Do NOT:
- Use fake personalization tokens that didn't merge (e.g. sending "[Manager name]" literally).
- Send from a noreply@ or generic address — always from Matthew (or a named team member).
- Use attachment files. Links only.
- BCC large lists. Send individual emails, even if tedious — Resend/Postmark/Mailchimp handle per-recipient sends cleanly.
- Claim "thousands of shoppers already saving!" unless the numbers actually support it.

### Tracking (optional but recommended)
- Use a simple UTM on the CTA link: `?utm_source=outreach&utm_medium=email&utm_campaign=claim-v1`
- Track open rate, click rate, claim/submission conversion rate per template
- Kill or rewrite any template with <20% open rate or <2% click rate after 50 sends

---

## What Matthew Needs to Do Before Sending

1. **Confirm the sending address.** `matthew@jacarandapeoria.com` is fine for small batches (<50/week). For scale, set up `hi@puffprice.com` with proper DKIM/SPF/DMARC records.
2. **Decide on A/B split or single subject line per template.** If sending fewer than 30 emails, pick one subject. 30+, split 50/50 between two options.
3. **Build the suppression list.** Anyone who replies "not interested" or bounces hard goes on this list permanently. Store in a Google Sheet or similar — don't lose it in an inbox thread.
4. **Claim flow must work.** Before Template 1 goes out, walk through the claim process yourself as a dispensary. Fix anything that breaks.
5. **Deal submission flow must work.** Same — submit a test deal as a dispensary, make sure it renders correctly on the site.
6. **Reply-handling plan.** Who responds when a dispensary writes back? If it's only Matthew, cap outreach volume so replies don't pile up.

---

## First-Wave Outreach Plan (Recommended)

**Round 1 (first 20 dispensaries):** Pure cold Template 1. Send Tuesday 9:30 AM CT. Manual, personalized — Matthew reads each dispensary's listing in our DB before sending so he can add a one-line personal touch if warranted.
**Round 2 (next 30):** Template 1 again, straight template, small variations.
**Round 3:** Use learnings from rounds 1-2 to refine subject lines. Scale up.
**Followups:** Template 3 on day 7 to all non-responders from rounds 1-2.

Target per week for the first month: 30-50 outreach emails. Quality beats volume here.

---

## Sources / Reference Docs

- Sprint 1: `docs/competitive-teardown.md` — competitive framing
- Sprint 1: `docs/user-personas.md` — user motivations (dispensary managers are secondary persona here — value accurate data, hate busy work)
- `HANDOFF-UPDATE.md` — sending address and infrastructure notes
