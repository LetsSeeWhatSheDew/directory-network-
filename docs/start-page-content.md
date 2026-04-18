# /start — Beginner Page Content

**Date:** April 18, 2026
**Owner:** Matthew
**Purpose:** Drop-in copy for the five sections of `/start`. Code is building the page structure; this file is the finished prose. Written for the Sarah persona (27, Naperville, occasional user, Friday-afternoon search) — calm, adult, specific, no bro energy. Review before Code ships.

> **Source basis:** `docs/user-personas.md` (Sarah — Occasional), `docs/truth-in-pricing-research.md`, `docs/illinois-market-research.md`. Tax numbers used in Section 3 trace to the truth-in-pricing research file.

---

## Page H1 and opening line

> **# New to Illinois dispensaries? Start here.**
>
> A calm, accurate primer for adults who want to understand how this works before they walk in. No jargon, no pressure, no sign-ups.

---

## Section 1 — "What to expect at your first Illinois dispensary"

**H2:** What to expect at your first Illinois dispensary

Buying cannabis at a licensed dispensary in Illinois is legal and normal for adults 21 and over. You'll bring a valid government-issued photo ID — a driver's license, state ID, or passport — and you'll show it at the door and again at the counter. That's the entire gate.

Inside, the store feels closer to a well-staffed pharmacy than anything you've seen on a screen. The products are behind glass or on a tablet menu. A budtender will ask what you're looking for, and "I'm not sure yet" is a completely normal answer. They're trained to help you narrow it down by how you want to feel, how long you want it to last, and how comfortable you are starting. You will not be judged for being new.

One thing worth knowing before you go: **Illinois dispensaries show pre-tax prices on the menu.** Cannabis taxes here are high — roughly 25% in most of the state and over 26% in Chicago. A $35 item on the shelf is about $44 at the register. Bring a little more than the sticker says, and you'll be fine.

---

## Section 2 — "Flower, edibles, vapes — what actually is the difference?"

**H2:** Flower, edibles, vapes — what actually is the difference?

**Flower** is the dried cannabis plant, sold in pre-weighed amounts (a gram, an "eighth" which is 3.5 grams, a quarter, and so on). You'd smoke it or use a dry-herb vaporizer. It takes effect within a few minutes and the feeling usually lasts one to three hours. "Onset" just means how long it takes to kick in.

**Edibles** are foods or drinks with cannabis in them — gummies, chocolate, mints, seltzers. The most important thing to know: **edibles take 45 to 90 minutes to kick in.** That delay is why people accidentally overdo it. They don't feel anything after 30 minutes, take another piece, and then feel both pieces an hour later. The Illinois rule most budtenders repeat is "start low, go slow." A single 10mg piece is a reasonable first dose for most adults. Wait two hours before deciding whether to take more.

**Vapes** are cartridges or disposable pens. Convenient, discreet, and fast-acting like flower. Potency varies widely; cheaper hardware can be inconsistent. Ask the budtender what they'd recommend for someone starting.

**Concentrates** — wax, shatter, live rosin, dabs — are very high potency and meant for experienced users. Skip these for now. They'll still be there later.

---

## Section 3 — "How to read a cannabis deal (without getting fooled)"

**H2:** How to read a cannabis deal (without getting fooled)

Most dispensary deals are real. A few are marketing theater. Here's how to tell.

**"30% off" is off the shelf price, before tax.** So a $50 item at 30% off is $35 on the shelf, which lands around $44 at the register in Chicago or $43.75 in Peoria. The percentage is real; the final price is higher than the sign suggests.

**BOGO ("buy one, get one") isn't always 50% off.** If you pick two matched items, yes — you're getting 25% off the pair. If you pick a premium item and a cheap one, the store usually applies the "free" discount to the cheaper one, so your effective discount drops to around 17–34%. Match your items to match the advertised value.

**"Free pre-roll with $50 purchase" is only a deal if you wanted $50 of stuff.** If you walked in for $35 and added $15 to qualify for a $5 pre-roll, you spent $10 to get a freebie. That's not savings.

**The honest rule:** if you weren't going to buy it anyway, a deal on it isn't savings — it's spending.

PuffPrice shows you the deals. We do our best to be accurate, but always verify at the register before you commit.

---

## Section 4 — "Comparing dispensaries in Illinois — what matters"

**H2:** Comparing dispensaries in Illinois — what matters

The same exact product often costs different amounts at different dispensaries, sometimes by a lot. Four things explain most of the gap:

**Wholesale cost and house brands.** Big chains that grow their own cannabis price their house brands below the independents. It's the same reason Costco's Kirkland products are cheaper than the national brand on the next shelf.

**Distance vs. savings.** A $12 savings is worth a 10-minute drive. A $12 savings probably isn't worth 40 minutes round-trip when you factor in gas and your own time. Our rule of thumb: if driving costs you more than the deal saves, it isn't a deal.

**Hours and ordering options.** Dispensary hours vary by city ordinance and by chain. Most close earlier than restaurants. Many Illinois dispensaries offer express pickup or online ordering through Dutchie or Jane — it's worth using, especially on a Friday or during 4/20 week.

**Medical vs. recreational.** Some dispensaries serve both; some are recreational-only. If you have an Illinois medical cannabis card, you pay about 2% total tax instead of 25-plus-percent. That's a bigger difference than any sale.

**The one honest tip:** check PuffPrice before you go, not after.

---

## Section 5 — "How PuffPrice works (and what it doesn't do)"

**H2:** How PuffPrice works (and what it doesn't do)

PuffPrice tracks active deals at licensed Illinois dispensaries and updates daily. We don't sell products. We don't work for any dispensary. We don't take affiliate commissions that would bias which deals we show you.

Tap **GO HERE** on any deal to get directions and the full details — hours, address, the deal specifics, and a reminder of what to show at the counter. If a deal has expired or changed since we last updated, tell us: **hi@puffprice.com**. We take corrections seriously and we timestamp when the deal was last confirmed so you can see how fresh the data is.

PuffPrice is free, no account needed. If you want SMS alerts when a deal matches what you want, PRO is $0.99 a month — but you do not need PRO to use the site. Ever.

---

## Footer line (optional, if Code wants it on the `/start` page)

> Illinois cannabis is legal for adults 21+. Products are tested, labeled, and sold under state regulation. Consume responsibly — don't drive, don't share with minors, and keep everything in the original packaging until you're home.

---

## Implementation notes for Code

- Every H2 is a natural anchor; consider `id="what-to-expect"`, `id="product-types"`, `id="how-to-read-deals"`, `id="comparing-dispensaries"`, `id="how-puffprice-works"` so the in-page nav can jump.
- Word counts (roughly, excluding H1 and H2): Section 1 — 210; Section 2 — 245; Section 3 — 215; Section 4 — 240; Section 5 — 135. Section 2 and 4 run slightly long because the content is legitimately denser. Trim only if layout demands.
- Tax numbers in Section 1 and Section 3 are round-ups from `docs/truth-in-pricing-research.md`. If IDOR publishes a rate change mid-2026, update Section 1 (the "roughly 25% … over 26% in Chicago" sentence) and Section 3 (the two register-price examples).
- Section 5 is the trust section. If Matthew revises the PuffPrice Promise (see `docs/puffprice-promise.md`), reconcile the language here with that file so the voice matches.
- Do not add emojis, exclamation points, or "🔥 hot deals!" energy. Sarah will bounce.
