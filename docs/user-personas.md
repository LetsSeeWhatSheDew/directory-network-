# User Personas — PuffPrice

**Date:** April 17, 2026
**Owner:** Matthew
**Purpose:** Three personas grounded in the competitive teardown and Illinois market research. These are decision tools: when Code is choosing between two features to build or two copy options, ask "which of these three users does this serve, and how much?"

> **Source basis:** Personas are synthesized from `docs/illinois-market-research.md`, `docs/competitive-teardown.md`, `docs/pro-tier-research.md`, Illinois cannabis consumer forum themes (r/ILTrees discussion patterns), and the existing PuffPrice project notes. They are not made up from thin air; each behavior claim traces back to a pattern observed in the research.

---

## Guiding principle

The one rule above all for PuffPrice, quoted from CLAUDE.md:
> "The experience must work for a real person in a parking lot."

All three personas use PuffPrice in a parking lot at least some of the time. The differentiator is **why they're in the parking lot** and **what "done" looks like** for each of them.

---

## Persona 1 — "The Regular": Marcus, 31, Chicago (South Loop)

### Snapshot
- **Age:** 31
- **Location:** South Loop, Chicago
- **Occupation:** UX designer at a mid-size agency
- **Income:** $85K/year, lives with partner, rents
- **Cannabis use:** 3-4x per week, mostly evenings and weekends. Primarily flower (eighths) and occasionally pre-rolls. Occasional vape when traveling.
- **Cannabis spend:** $150-$250/month
- **Devices:** iPhone for everything. Notion for personal notes. Uses Apple Maps over Google.
- **Existing apps:** Has Sunnyside and Verilife loyalty apps installed, uses Dutchie menus when ordering online, occasionally checks Weedmaps but "Weedmaps is mostly ads."

### Why he uses PuffPrice
Marcus knows what he likes. He has a regular rotation of 3-4 dispensaries in and near downtown that he's tried, and he's optimized his routine. He uses PuffPrice **to decide which of those 3-4 to go to tonight** based on which has the best active deal. He's not exploring; he's deciding.

He's also price-sensitive in a specific way: he's not broke, but the IL tax stack means an eighth ends up $55-60 at retail, and he'd like to keep his monthly cannabis budget under $200. Saving $10-15 per visit matters. He shops often enough that 3% off compounds.

### What he needs from PuffPrice
- **Speed.** He's on the train between Ogilvie and South Loop when he checks. He has ~90 seconds. The page needs to be loaded and useful by the time the train doors close at Grand.
- **GPS + filter persistence.** Every time he opens the app, it should remember he's in Chicago and default to the dispensaries within a 2-mile radius of his apartment.
- **Deal ranking he trusts.** He needs to believe the #1 deal is actually the best deal. If PuffPrice's ranking seems arbitrary or gamed, he'll go back to checking dispensary apps directly.
- **Clear GO HERE flow.** He's getting in his car. One tap to directions in Apple Maps, not Google Maps.
- **Price history.** When he sees "eighth for $42," he wants to know whether that's actually a good price or whether it's been $38 all month somewhere else.
- **Quiet.** He does not want SMS every time a deal goes live. He'd use the app proactively.

### What would make him pay for PRO
- **Price history charts.** He mentioned above — this is his #1 ask. He doesn't want alerts; he wants *data*.
- **A weekly Sunday email summarizing the best deals coming up this week.** Plannable, quiet, high-signal.
- **Stock check.** He hates driving to Verilife and finding out they're out of the Cresco flower he wanted. A "before you go" check would be worth $0.99.
- **Brand watchlist** at the Power tier if it ever ships. He prefers Cresco and Rhythm.

### What would lose him
- Too many push notifications → delete app within a week
- Ranking that promotes Featured listings over best actual deal → loses trust, goes back to Dutchie
- Slow initial load → doesn't make it past the first use
- Requiring an account or login to see deals → instant close, never returns

### Quote he'd give
> "I just need to know which of my three dispensaries has the best flower deal tonight. Don't make it complicated. Don't email me. Just have it ready when I tap."

### Implications for product
- **Marcus is the model user for the free tier done right.** He'll stay free forever unless we build something he can't replicate with his Dutchie-menu-checking routine.
- **Price history is his PRO gateway.** Build it to be visibly good even in the free preview.
- **The "GO HERE" flow is his daily interaction.** If that flow regresses, he leaves.

---

## Persona 2 — "The Occasional": Sarah, 27, Naperville

### Snapshot
- **Age:** 27
- **Location:** Naperville (west suburban Chicago)
- **Occupation:** Account manager, corporate
- **Income:** $68K/year, lives with two roommates
- **Cannabis use:** Friday and Saturday nights only. Edibles mostly (10mg gummies), occasional pre-roll when out with friends.
- **Cannabis spend:** $40-$70/month
- **Devices:** iPhone. Uses Google Maps. Instagram and TikTok are her default discovery tools.
- **Existing apps:** No cannabis apps. Has tried Sunnyside menu once or twice. Mostly just Googles "dispensary near me Naperville" on Friday afternoon.

### Why she uses PuffPrice
Sarah is the "I feel like having some gummies this weekend" user. Her session looks like: Friday 5:00 PM, she's leaving work, she types "best cannabis deals naperville" into Google, she clicks the first answer-shaped result.

She doesn't care about strain names. She cares about: (1) is it close enough that I can stop on the way home, (2) is there a deal so I don't feel like I'm overpaying, (3) does it look legit / not-shady.

### What she needs from PuffPrice
- **To show up in Google.** Sarah will never download the app. She's a search-to-site user. She needs our `/deals/naperville` page to rank for her query and answer her question in the first screen.
- **Answer-format opening line.** "12 dispensaries in Naperville have 8 active deals right now." One sentence, she's oriented.
- **A ranked list of the top 3 nearest deals.** She doesn't want to see 50 deals. She wants to see the 3 best ones close to her and make a decision.
- **Visual trust signals.** Real dispensary photos, professional design, no shady color palette. If it looks like Cannasaver circa 2012, she bounces.
- **Clear prices.** Not "% off." "$18 for a 10-pack of Wana gummies" — a price she can decide on.
- **Reassurance about first-time customer stuff.** Is there a first-time discount? What do I bring? Do I need an ID? She's never been to a dispensary before (or it's been a while).
- **No account required.** She will not sign up for anything on a Friday afternoon to save $5.

### What would make her pay for PRO
Honestly? Nothing, at first. She's not a regular buyer and $0.99/month for deal alerts is a hard sell to someone who buys once every 2-3 weekends.

**The path to conversion:** after she's been to PuffPrice 5-10 times over 6 months, she's seen us save her $20-30 and she's more inclined to throw us a dollar. PRO for Sarah is a **gratitude subscription**, not a utility one. Frame it that way at the upsell moment: "You've saved $42 with PuffPrice this year. Keep us running for $0.99/month."

### What would lose her
- A page that doesn't answer her question in the first 3 seconds
- Modal pop-ups or age gates asking for details she won't give
- Requiring an account before she can see deals
- Treating her like a daily user (push notification guilt)

### Quote she'd give
> "I just want to grab some gummies on the way home. Can you help me do that without me having to become a weed person about it?"

### Implications for product
- **Sarah is the SEO user.** The city pages, the `/deals/[city]` architecture, and the answer-format openings are specifically for her.
- **She's the convert-to-advocate.** If she has a good experience and her friends ask "where did you get that," she'll say PuffPrice. She is the organic growth engine.
- **Accessibility matters.** She's not a cannabis expert. Plain language, no strain jargon, no "decarboxylation 101."

---

## Persona 3 — "The Enthusiast": Dan, 44, Bloomington-Normal

### Snapshot
- **Age:** 44
- **Location:** Bloomington-Normal (I-55/I-74 corridor)
- **Occupation:** Self-employed contractor, flexible schedule
- **Income:** $120K/year, homeowner, married with kids
- **Cannabis use:** Daily. Prefers craft flower (brand snob), specific live rosin vapes, dabs on weekends. Uses for chronic back pain and sleep; has a medical card, occasionally shops rec when out-of-state friends visit.
- **Cannabis spend:** $400-$600/month
- **Devices:** iPhone, also uses a MacBook. Power user. Checks Reddit (r/ILTrees), reads MJBizDaily.
- **Existing apps:** Everything — Weedmaps, Leafly, iHeartJane, Dutchie menus for 8+ dispensaries, loyalty apps for every chain. Jumps between them to assemble a picture.

### Why he uses PuffPrice
Dan is the user who **would build PuffPrice himself if it didn't exist.** He hates the status quo. Right now, his shopping routine is:
1. Check r/ILTrees for what's good this week
2. Check Leafly for store menus
3. Check Weedmaps for deals (skeptically)
4. Check 3 loyalty apps for his points balance
5. Sometimes drive 30-45 minutes to a specific dispensary because they have a specific strain

He spends meaningful time on this. If PuffPrice can collapse steps 2, 3, and part of 4 into one good page, he'll switch immediately — AND he'll evangelize to his Reddit and Telegram friends.

Dan is also willing to drive: he'll go from Bloomington to Peoria for a $20 savings on an ounce. He's the user for whom "best deal within 90 minutes" is a real query, not just "best deal within 5 miles."

### What he needs from PuffPrice
- **Power-user filters.** Strain type, brand, THC range, product format, price threshold, dispensary chain. He wants the faceted filter of Amazon, not the two-button filter of Weedmaps.
- **Wider radius search.** Default 50-mile radius, not 5. Let him scan across Central IL.
- **Specific product tracking.** "Alert me when Cresco Mandarin Cookies live resin drops below $55 anywhere within 90 minutes of Bloomington." That's a very specific query. If we can answer it, he's a subscriber for life.
- **Data, not marketing.** He can smell BS copy from a mile away. Plain numbers, sources, frequency. "Updated 23 minutes ago" is trustworthy; "Hot deals!" is not.
- **Deal history / trends.** "Has this brand ever been this cheap?" "Is this price better than last month?" — the sort of question a power user asks.
- **API / data access (eventually).** He's the kind of user who, if we had a public data feed, would build his own dashboard in Google Sheets or Home Assistant. **He's our first MCP-layer user.** Zone 4 is literally built for him.

### What would make him pay for PRO
- Instant yes. $0.99 is a joke price to him. He'd pay $9.99/mo for the right feature set.
- His willing-to-pay features: brand watchlist, stock alerts, multi-city alerts, historical deal explorer, API/data access.
- **Annual up front:** he's the user who picks "$9.99/year" without hesitation. Build it as soon as possible.

### What would lose him
- Inaccurate data. If he drives to a dispensary based on our info and the deal doesn't exist, he never comes back.
- Feature parity with Weedmaps only. He already has Weedmaps. We need to be **better** at data or we're irrelevant to him.
- Ignoring medical patients. He has an IL medical card and is annoyed that rec-focused sites bury medical pricing. Medical vs. rec distinction needs to be first-class.

### Quote he'd give
> "I'm already juggling four apps to do what your one page should do. If you get the data right and show me deals I actually care about, I'll pay you and I'll tell everyone I know."

### Implications for product
- **Dan is the Zone 4 customer.** The MCP server, the data.puffprice.com feed, the structured API — these are built for him and for the developers who are like him.
- **Power-user features pay off in word of mouth.** Dan is a small % of users but he owns the Reddit conversation. Make him happy and acquisition cost for everyone else drops.
- **Data quality is non-negotiable.** For Sarah, a wrong deal is annoying. For Dan, it's disqualifying.

---

## Persona Coverage Matrix

| Feature / decision | Marcus (Regular) | Sarah (Occasional) | Dan (Enthusiast) |
|---|---|---|---|
| **Core loop: browse deals for tonight** | Heavy | Light | Heavy |
| **City page SEO** | Low | **Critical** | Low |
| **GPS map w/ 5mi radius** | **Critical** | Medium | Low |
| **50+mi radius search** | Low | Low | **Critical** |
| **GO HERE / directions** | **Critical** | **Critical** | Medium |
| **Answer-format page opening** | Medium | **Critical** | Medium |
| **Power filters (brand/strain/THC)** | Medium | Low | **Critical** |
| **Price history charts** | **Critical (PRO gateway)** | Low | **Critical** |
| **SMS alerts** | Low (annoying) | Low | Medium |
| **Daily digest email** | Medium | Low | Medium |
| **Stock check / back-in-stock** | Medium | Low | **Critical** |
| **Medical vs rec clarity** | Low | Medium | **Critical** |
| **No-account browsing** | **Critical** | **Critical** | **Critical** |
| **Fast initial load** | **Critical** | **Critical** | Medium |
| **Trust signals / pro look** | Medium | **Critical** | Medium |
| **Savings dashboard** | Medium | **Critical (conversion path)** | Low |
| **Brand watchlist** | Medium | Low | **Critical (Power PRO)** |
| **API / data feed** | No | No | **Critical (Zone 4)** |
| **Willing to pay PRO** | Eventually ($0.99) | Eventually ($0.99 as thanks) | Immediately ($4.99+) |

---

## Anti-persona: who PuffPrice is NOT for

This is worth writing down so Code doesn't get pulled into features for people who aren't the target audience.

1. **"First-time curious" tourists who aren't cannabis users at all.** Let Leafly educate them. PuffPrice assumes you've been to a dispensary.
2. **"Brand marketer from a dispensary chain" looking to list deals.** Featured tier exists for them at $49/mo. The consumer product is not for them.
3. **"Minor / under 21" exploring out of curiosity.** Age gate; not our audience.
4. **"Illicit market shopper."** PuffPrice is a regulated-dispensary tool. We don't help with street buys, caregiver grows, or out-of-state shipping.

---

## How to use these personas in product decisions

When the team disagrees on a feature, ask these three questions in order:

1. **Does it make Marcus's tonight shopping trip faster or sharper?**
2. **Does it make Sarah's Friday-afternoon Google search land on a page that answers her question in 3 seconds?**
3. **Does it give Dan a piece of data he can't assemble anywhere else?**

If the answer to all three is "no," it's probably not worth building yet.

If it improves only one persona significantly **and** doesn't hurt the others, it's a fine bet — but prioritize work that improves two or three at once. The city page architecture, for example, serves Sarah (SEO entry) AND Marcus (regular daily check) AND Dan (broad market view). That's why it's core.
