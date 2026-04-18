# PuffPrice — One-Pager

**Date:** April 18, 2026
**Audience:** Investors, partners, journalists, advisors. Anyone who needs to understand PuffPrice in 90 seconds.

---

## What it is

PuffPrice is a free, state-specific cannabis deal tracker for Illinois — a GPS-aware map of every active dispensary deal in the state, ranked by savings, freshness, and distance from the user. No account, no ads, no paid placement in rankings.

## The problem

Illinois cannabis shoppers face the highest combined tax burden of any mature legal market (20–40%+ in Cook County), yet they can't see which dispensary has the best deal right now without juggling Weedmaps, Leafly, four chain apps, and r/ILTrees. Every existing tool either dilutes Illinois across 30 state markets, silos deals per-store, or runs on outdated coupon-aggregator UX.

## The solution

PuffPrice aggregates every active cannabis deal in Illinois onto one live map, ranks them by actual savings (not ad tier), and hands the user directly to their phone's maps app with one tap. Built for a real person in a parking lot — not a developer.

## Traction

- **56 active deals** tracked in real time
- **82 dispensaries** with active promotional offers
- **293 total listings** in the master database
- Built on **Next.js 16 + Supabase + Vercel**; launched April 17, 2026 ahead of 4/20
- **Lighthouse 96–100** on core web vitals
- User journey verified clean April 15; site is load-tested for the 4/20 surge

## Business model

- **Free tier:** browse every active deal, GPS map, GO HERE directions, no account required — free forever
- **PRO tier ($0.99/month):** SMS deal alerts, daily digest email, 30-day price history, personal savings dashboard
- **Dispensary Featured listings ($49/month):** top placement in city searches, Monday-digest priority
- **Dispensary Free listings:** every licensed IL dispensary has a free listing; they can claim and edit it anytime

Deliberately no paid ad placement in deal rankings. PuffPrice ranks on savings, not revenue share.

## Market

- **244 active adult-use dispensaries** in Illinois (IDFPR, April 2026)
- **500-license cap** — ~137 licenses still to be awarded
- **$2 billion** in total Illinois cannabis sales in 2024 ($1.72B adult-use + $285M medical)
- **$490 million** in Illinois cannabis tax revenue (2024)
- **12.6 million** Illinois residents; cannabis retail serves every major metro and a growing rural footprint
- Illinois is the **closest legal market** for much of southern Wisconsin, eastern Iowa, and northern Indiana — cross-border traffic is a meaningful tailwind

## The Zone 4 data layer play

Weedmaps and Leafly will never build an MCP server — their incentive is keeping users on their platforms. PuffPrice's incentive is being wherever the user is, including inside an AI answer. Zone 4 is a three-phase plan:

- **Phase 1 (Now):** schema markup on every deal, State of Illinois Cannabis Deals page, FAQ hub — so AI systems cite PuffPrice when users ask "where are the deals in Chicago today?"
- **Phase 2 (Month 1–2):** public JSON data feed at `data.puffprice.com/deals.json`, industry-directory citations, named-entity presence in Knowledge Graph
- **Phase 3 (Month 3–6):** public MCP server at `mcp.puffprice.com` — Claude Desktop, ChatGPT custom GPTs, and third-party cannabis apps can query our data directly

The window is genuinely open. Nobody else is building this.

## What's next

- **Week 1–2:** deal detail permalinks, GO HERE flow audit, dispensary closure flagging
- **Month 1:** ship price history (the #1 PRO conversion feature), SMS alerts, daily digest email
- **Month 2–3:** Zone 4 Phase 1 pages live and indexed, deal-type taxonomy landing pages, public data feed
- **Month 3–6:** MCP server live at mcp.puffprice.com, historical deal explorer, brand watchlist for PRO Power tier ($4.99/month)
- **Beyond:** expand to Michigan, Wisconsin, Indiana only after Illinois is saturated and cited

## Why us

PuffPrice is built in Peoria, by someone who watched the state's cannabis retail mature from the first 2020 recreational licenses through the 244-dispensary market we have today. Not a venture-backed SaaS play. Not a pivot from another industry. Independent. Illinois-focused. Pro-consumer by design.

## Contact

**Matthew Burns**
matthew@jacarandapeoria.com
hi@puffprice.com *(once DNS is live)*
Peoria, Illinois

---

## Sources

- IDFPR 2024 cannabis sales announcement ($2B / $490M tax revenue)
- IDFPR active adult-use dispensary license list (244 active)
- PuffPrice internal data (56 active deals, 82 dispensaries, 293 listings)
- Sprint 1 strategy docs in `docs/` (competitive teardown, market research, roadmap)
- Sprint 2 docs (Zone 4 pages, PRO copy, city content, social plan)
