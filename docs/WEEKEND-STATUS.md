# PuffPrice — Weekend Status

**For:** Matthew · **Written:** Sunday April 19, 2026 (evening) · **Read before Monday pickup**

---

## What's launching tonight

Code pushes one commit that makes the site ship-ready except for Stripe:

- **Brand rename complete.** 40 files updated — every visible `CleanList` → `PuffPrice`, every `cleanlist.co` → `www.puffprice.com`, every stale `$4.99` and `$49` pulled out of consumer and dispensary pages. Commits split for review: brand rename (A), pricing fixes (B), remaining UX tasks (C).
- **`/upgrade` is single-tier Pro at $0.99/mo** with a `mailto:` CTA as the interim action. The page looks final; it just doesn't charge money yet. Swap in the Stripe Payment Link URL Monday.
- **Homepage freshness bug gone** — no more "Updated 3 days ago" on live data.
- **`middleware.ts` is env-only** — the hardcoded `"cleanlist2026"` admin fallback is deleted. You already added `ADMIN_PASSWORD` to Vercel Production earlier today, so this lands clean.
- **Sitemap canonicalized** to `www.puffprice.com` — no more `cleanlist.co` URLs leaking to Google.
- **Terms of Service + Privacy Policy pages ship** — both routes now resolve so Stripe's Customer Portal config doesn't 404 Monday.
- **Stripe webhook skeleton in place** at `/api/stripe/webhook` — idle tonight, ready to activate the moment you paste `STRIPE_WEBHOOK_SECRET` tomorrow.
- **`.bak` files merged into canonical docs** — `HANDOFF-UPDATE.md`, `docs/ENV-VARS.md`, `docs/LAUNCH-CHECKLIST.md`, `docs/ZONE4-strategy.md` now carry the stack detail, sanity-check scripts, performance baseline, and Phase 5 MCP Server section that were sitting in the `.local.bak` snapshots.

Chrome is running Waves 4–9 in parallel: Resend DNS at Namecheap, Resend domain verify + test email, GSC sitemap submission + indexing requests on 12 URLs, and Google Business Profile kickoff (postcard verification). Transactional email should be live by tonight.

---

## What waits for you Monday

**Stripe — the one real blocker.** None of it started this weekend because the account doesn't exist yet. Monday morning, in order:

1. Create the Stripe account.
2. Create the Pro product at `$0.99/mo` recurring. Copy the Price ID → `STRIPE_PRO_PRICE_ID`.
3. Create a Payment Link on that price. Copy URL → `PAYMENT_LINK_URL` (swap into `/upgrade` CTA, replacing the mailto).
4. Configure Customer Portal — point at `www.puffprice.com/terms` and `www.puffprice.com/privacy` (both live as of tonight's push).
5. Create the webhook endpoint pointing at `https://www.puffprice.com/api/stripe/webhook`. Copy signing secret → `STRIPE_WEBHOOK_SECRET`.
6. Paste `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `PAYMENT_LINK_URL` into Vercel Production. Redeploy.

Chrome can then run Wave 10 (incognito end-to-end: click `/upgrade` → pay $0.99 → land on `/upgrade/success` with webhook firing). That closes Phase 1.

**Side items Monday:** run `sql/migrations/2026-04-18-pro-users.sql` against Supabase (service role, RLS blocks anon). Send Wave 2 outreach drafts. Confirm canonical-domain decision if Chrome Wave 6 surfaced a www-vs-apex conflict.

---

## Ship-checklist signal (as of 9pm Sunday)

Four of six signals moving to ✅ overnight on Code's push + Chrome's waves. Two signals (Stripe Payment Link, Wave 10 full flow) gated on Monday's Stripe work. Everything else is in the green.

See `docs/PHASE1-STATUS.md` for the row-by-row.
