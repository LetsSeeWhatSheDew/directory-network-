# PuffPrice PRO — Drop-In Copy

**Date:** April 18, 2026
**Owner:** Matthew
**Purpose:** Ready-to-use copy for the `/alerts` and `/waitlist` pages. Drop into the codebase with minimal editing.

> **Tone:** Sharp, specific, pro-consumer. No marketing adjectives ("amazing," "ultimate," "revolutionary"). The price does the work; the features do the work; don't puff them up.
> **Grounding:** Per `docs/pro-tier-research.md` Sprint 1, **Price History** is the #1 conversion feature. Lead with it on the /alerts page whenever possible.

---

## Hero Section

### Hero headline
**Save real money on weed in Illinois.**

### Alternate hero headline options (test against each other)
- "Every Illinois cannabis deal, delivered."
- "Never overpay at an Illinois dispensary again."
- "Stop missing the good deals."

### Subheadline
**PuffPrice PRO sends you deal alerts, price history, and a daily digest — so you buy when it's actually cheap, not when you happen to remember.**

### Alternate subheadline
"For $0.99 a month, we'll tell you when your favorite dispensary drops prices, which day has the best deals, and how much you're saving over time."

### Price line
**$0.99 per month.**
**Cancel anytime.**

### Price justification line (pick one — the first is strongest)
- "Less than a pack of rolling papers."
- "One skipped ATM fee pays for a year."
- "If PuffPrice saves you $5 once, it's already paid for five months."
- "Cheapest eighth in Illinois is still over $25. We cost less than that — for a year."

---

## Feature Descriptions (6 features, in recommended display order)

### 1. Price History — *the strongest feature, always lead with this*

**Headline:** See what it usually costs — before you buy.

**Description:**
We track price on every deal, every dispensary, every day. Tap any product to see a 30-day price history chart — so you know whether "$42 for an eighth" is actually a deal or just regular pricing in a fresh wrapper.

### 2. SMS Deal Alerts

**Headline:** Know the moment a deal goes live.

**Description:**
Pick your city, your discount threshold, and your favorite brands. When a matching deal posts — Cresco 25% off, any eighth under $40, a BOGO on your go-to vape — you get a text with a link straight to the deal page. One tap and you're getting directions.

### 3. Daily Digest

**Headline:** The best deals, delivered with your coffee.

**Description:**
Every morning at 7:30, we send a short email with the top five deals in your city — ranked by savings and distance. No scrolling, no app-opening. If none of them are worth it, you'll know in ten seconds.

### 4. Beat My Last Price

**Headline:** Only get alerted when it's actually cheaper.

**Description:**
Tell us what you paid last time for your usual product — an eighth, a vape, a 10-pack of gummies — and we'll only alert you when the same product drops below that price somewhere. No noise, no "new deal!" for the same price you already paid.

### 5. Flash Sale Early Access

**Headline:** See dispensary-submitted deals 30 minutes before free users.

**Description:**
When a dispensary posts a limited-inventory deal — end-of-day clearance, hour-long happy hour, 4/20-window drop — PRO members see it first. Enough lead time to decide, grab your keys, and get there before it's gone.

### 6. Monthly Savings Report

**Headline:** See how much you actually saved.

**Description:**
First of every month, we email you a one-page report: how many deals you clicked, estimated total savings, the best deal you got. If PuffPrice stopped earning its keep, you'll know.

---

## Additional copy blocks

### FAQ / objection-handling on the /alerts page

**"Is this actually worth $0.99?"**
If PuffPrice saves you five dollars in a single visit, you've earned back five months. Most PRO members save that on their first deal.

**"Will I get spammed with SMS?"**
No. You set the rules — city, discount threshold, max alerts per day, quiet hours. Default is three alerts per day, opt-in only. Easy to pause or cancel.

**"Why not just use Weedmaps / Leafly for free?"**
They don't do Illinois-specific price history, they don't send deal alerts, and their rankings are driven by ad tier. PuffPrice is built for Illinois and ranks by savings.

**"Can I cancel?"**
Yes — anytime, one click. No phone call, no retention screens, no guilt.

### Signup CTA (button copy)

Primary button: **Start PRO — $0.99/month**
Fallback / less committal: **Try PRO free for 7 days**  *(if we add a trial period)*

### Post-signup confirmation copy

**Title:** You're in.
**Body:** Your first deal alert will arrive within the next 24 hours. Set your alert rules any time at [link]. Thanks for paying us a dollar — it keeps PuffPrice independent.

---

## Waitlist-specific copy (for `/waitlist` page)

*(Use if PRO isn't fully live yet and Matthew is collecting emails pre-launch.)*

### Waitlist headline
**Get early access to PuffPrice PRO.**

### Waitlist subheadline
**We're opening PRO to a small group first — deal alerts, price history, daily digest, all for $0.99/month. Enter your email and we'll let you know when your spot opens.**

### Waitlist email field placeholder
`your@email.com`

### Waitlist submit button
**Get on the list**

### Post-waitlist confirmation
**You're on the list.** We'll email you when a PRO spot opens for you — probably within the next week or two.

---

## Copy do's and don'ts

### Do:
- Use specific numbers: "30-day chart," "7:30 AM," "5 deals," "$0.99."
- Frame savings in dollars, not percents, wherever possible — research shows IL shoppers respond to dollar framing because of the tax burden.
- Keep sentences short. If a PRO feature description runs over 40 words, trim it.
- Use "you" and "your" — direct second person.

### Don't:
- Say "revolutionary," "game-changing," "ultimate," "best-in-class," "seamless," "powered by AI." Any of these instantly cheapens the product.
- Over-promise. We do what we do — don't claim we "crush" Weedmaps or "guarantee" savings.
- Use emojis. This is a cannabis product in a regulated state; keep the tone grown-up.
- Front-load the SMS Alerts feature. Price History converts better per persona research.

---

## Integration notes for Code

- All copy above is the final English. Code can paste directly.
- For live data (e.g., "we track 56 active deals"), swap placeholders at render time.
- A/B test the hero headline after launch. Three variants provided.
- Monitor SMS delivery rate, open rate on digest, click-through on flash-sale early-access alerts. If any feature has <10% engagement, rewrite its copy.

---

## Sources

- Sprint 1: `docs/pro-tier-research.md` — pricing and feature decisions
- Sprint 1: `docs/user-personas.md` — language preferences of Marcus / Sarah / Dan
- Sprint 1: `docs/competitive-teardown.md` — what we do that competitors don't (the differentiation that justifies the ask)
