# Stripe onboarding completion checklist (2026-04-22)

**Audience:** Matthew, finishing Stripe onboarding so PuffPrice Pro ($0.99/mo) can take live payments.
**Time estimate:** 25-40 minutes (realistic, not aspirational — Stripe onboarding has flaky moments).
**Pre-condition:** Matthew is mid-onboarding in the Stripe dashboard. Bank account verification step in progress.

---

## What the codebase already supports

Audited `app/api/stripe/`, `app/upgrade/page.tsx`, and `docs/ENV-VARS.md`. Two payment paths are wired in:

### Path A — Stripe Payment Link (simpler, recommended for launch)

* `/upgrade` page renders a green "Go Pro — $0.99/mo" button
* `href` is read from `process.env.NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL`
* Falls back to `mailto:matthew@jacarandapeoria.com` if env var missing — never appears broken
* No webhook required for Path A — Matthew sees subscriptions in Stripe dashboard manually
* No `pro_users` DB table required for Path A — feature gating happens off Stripe's customer portal

### Path B — Embedded Checkout Session + Webhook (more complete, can ship later)

* `app/api/stripe/create-checkout/route.ts` — POSTs to `/v1/checkout/sessions` REST API, returns `{ url }`
* `app/api/stripe/webhook/route.ts` — verifies signature, handles `checkout.session.completed` + `customer.subscription.*` + `invoice.payment_failed`
* `pro_users` table — referenced in webhook handler. Migration file exists at `sql/migrations/2026-04-18-pro-users.sql` but **NOT YET APPLIED** (verified: `to_regclass('public.pro_users')` is null)
* Webhook gracefully no-ops if `pro_users` doesn't exist (won't break Stripe retries) — but no user actually gets gated to Pro features until the table lands

**Recommendation: ship Path A this week, ship Path B in a follow-up.** Path A unblocks revenue. Path B unblocks SMS alert delivery to Pro subscribers, which is the actual product value — but that depends on Twilio/Resend wiring that doesn't exist yet either.

---

## The 25-minute Path A checklist

### Step 1 — Finish Stripe onboarding (5-10 min)

| Sub-step | What to do | Verify before moving on |
|---|---|---|
| 1a | Stripe dashboard → Settings → Account → Business details. Confirm tax ID + business address are saved | Green checkmark on Account dashboard |
| 1b | Settings → Account → Bank accounts → finish micro-deposit verification (or instant via Plaid). | Bank account shows "Verified" not "Pending" |
| 1c | Settings → Public details → set business name to "PuffPrice" + statement descriptor (≤22 chars, alphanumeric + spaces. Use `PUFFPRICE` or `PUFFPRICE PRO`). | Statement descriptor saved without warning |

**Common pitfall — cannabis-adjacent flag:** Stripe may flag PuffPrice for manual review during onboarding because of cannabis terminology. PuffPrice is NOT itself cannabis sales — it's a deal directory. If a Stripe representative asks, the answer is: "PuffPrice is a consumer information service. We do not sell, transact, or fulfill cannabis. We index publicly-listed promotions from licensed Illinois dispensaries." This is true and Stripe-policy-compliant.

If they still reject: Stripe's "high-risk" flag is rare for editorial sites but possible. Fallback options: Square (similar policy), Paddle (handles MoR for SaaS), Lemon Squeezy. Don't pivot until Stripe has explicitly said no — most cases clear in 24-48 hours.

### Step 2 — Create the Pro product (3 min)

| Sub-step | What to do | Verify |
|---|---|---|
| 2a | Stripe dashboard → Products → Add product. Name: `PuffPrice Pro`. Description: `Instant SMS deal alerts for Illinois cannabis. Cancel anytime.` | Product appears in product list |
| 2b | In the product, add a price: `$0.99 USD`, `Recurring`, billing period `Monthly`. Currency USD. | Price ID generated (starts `price_...`) |
| 2c | Copy the Price ID. Save somewhere — you'll paste it in step 5 if you go to Path B. Also note it on the product details for reference. | Price ID copied |

### Step 3 — Create the Payment Link (3 min)

| Sub-step | What to do | Verify |
|---|---|---|
| 3a | Stripe dashboard → Payment links → New. Select the Pro product/price from step 2. | Preview shows $0.99/month with "Subscribe" button |
| 3b | Customize: success URL → `https://www.puffprice.com/upgrade/success`. Cancel URL → `https://www.puffprice.com/upgrade`. Allow promotion codes: ON. | Settings saved |
| 3c | Customer collection: collect email (required). Phone optional (will be required for SMS alerts in Phase 2 — collect now if Stripe lets you). | Form preview includes email field |
| 3d | Save. Copy the resulting URL — looks like `https://buy.stripe.com/xxxxxxxxxxxxxxxxxx` | URL copied |

### Step 4 — Add the env var to Vercel (2 min)

| Sub-step | What to do | Verify |
|---|---|---|
| 4a | Vercel dashboard → directory-network- project → Settings → Environment Variables → Add | "Add" form open |
| 4b | Name: `NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL`. Value: paste the URL from step 3d. Environment: **Production + Preview + Development** (all three). | Variable visible in list |
| 4c | (Recommended also) Add `NEXT_PUBLIC_SITE_URL` = `https://www.puffprice.com` if it isn't already set. Same three environments. | Variable visible |

### Step 5 — Redeploy (3 min)

| Sub-step | What to do | Verify |
|---|---|---|
| 5a | Vercel → directory-network- project → Deployments → most recent → menu → Redeploy. Or: push any commit to main. | Build kicks off |
| 5b | Wait for build to flip Ready. **Do not test before this.** | Status: Ready |

### Step 6 — Incognito test the live flow (3-5 min)

| Sub-step | What to do | Verify |
|---|---|---|
| 6a | Open incognito window. Visit `https://www.puffprice.com/upgrade`. | Page loads with green "Go Pro — $0.99/mo" CTA |
| 6b | Click the CTA. Browser should navigate to `https://buy.stripe.com/...` (NOT a mailto). | URL bar shows Stripe domain |
| 6c | Stripe checkout: enter a test card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP. Use a real email you own. | Checkout completes |
| 6d | Verify redirect to `/upgrade/success`. | Success page renders |
| 6e | In Stripe dashboard → Customers, confirm the test customer + subscription appears. | Customer + active sub visible |
| 6f | In Stripe dashboard, immediately cancel the test subscription so you don't get charged $0.99 next month. | Subscription "canceled" |

---

## Common pitfalls

### Payment Link vs. Checkout Session — pick one and stop

The codebase has BOTH wired. `/upgrade` page uses Payment Link (Path A). `/api/stripe/create-checkout` uses Checkout Session (Path B). They don't conflict because no current UI calls Path B's endpoint. Don't worry about it — Path A is what's user-facing.

### Webhook signing secret rotation

Path A doesn't need a webhook. If you decide to add Path B later, the webhook signing secret rotates whenever you delete + recreate the endpoint in Stripe. Keep one webhook endpoint long-lived; rotating it requires a Vercel env update.

### Stripe test mode vs. live mode

Stripe has two completely separate datasets — "test mode" (toggled in dashboard) and "live mode". Keys, products, payment links all duplicate. Make sure you create the Pro product + Payment Link in **live mode** when ready to take real money. The Payment Link URL pattern is identical so it's easy to mix up. Verify in dashboard top bar.

### `NEXT_PUBLIC_` prefix

`NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL` MUST have the `NEXT_PUBLIC_` prefix because the URL is read in client-rendered JSX in `app/upgrade/page.tsx`. Without the prefix, the value is `undefined` at build time and the page falls back to mailto.

### Vercel env scope

Setting the env var only on "Production" means previews still mailto. Set on all three environments unless you have a reason not to.

### Statement descriptor

If you put "PUFFPRICE" but Stripe shortens it to "PUFF" on some banks, customers may dispute the charge thinking it's unrelated. Use a longer, unmistakable descriptor like `PUFFPRICE PRO`. Bank statement displays max 22 characters.

---

## Path B (full subscription tracking) — when you're ready

Once Path A is live and you've taken your first 10-50 subscribers, Path B unlocks:
- Programmatic Pro feature gating in the app (e.g., showing the savings dashboard to subscribers only)
- Automated Pro user de-provisioning when subscriptions cancel
- Webhook-driven SMS alert provisioning

### Path B additional steps

1. **Apply the pro_users migration:** `sql/migrations/2026-04-18-pro-users.sql` (NOT YET APPLIED — verified via Supabase MCP). Read first, apply via SQL editor.
2. **Create webhook endpoint in Stripe:** Developers → Webhooks → Add endpoint. URL: `https://www.puffprice.com/api/stripe/webhook`. Events to send: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
3. **Copy the webhook signing secret** (starts `whsec_...`).
4. **Add to Vercel env (server-only — NO `NEXT_PUBLIC_` prefix):**
   - `STRIPE_SECRET_KEY` = `sk_live_...` (Stripe → Developers → API keys → Live secret key)
   - `STRIPE_PRO_PRICE_ID` = the price_... from Path A step 2c
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` from step 3
5. **Redeploy.**
6. **Trigger webhook test:** Stripe dashboard → Webhooks → your endpoint → "Send test webhook" → checkout.session.completed. Confirm 200 response.
7. **Optional: switch `/upgrade` page from Payment Link to Checkout Session.** This is a code change (use `fetch('/api/stripe/create-checkout', ...)` instead of plain `<a href>`). Defer to Code.

### Path B time estimate

20-30 min on a clean run. 60+ min if the pro_users migration has issues or webhook signature verification fails first try.

---

## Summary — the 5 env vars

For complete reference. Path A only needs the first row.

| Env var | Path | Visibility | Where to get it | Status today |
|---|---|---|---|---|
| `NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL` | A | client | Stripe → Payment Links | Not set |
| `STRIPE_SECRET_KEY` | B | server | Stripe → Developers → API keys | Not set |
| `STRIPE_PRO_PRICE_ID` | B | server | Stripe → Products → your price | Not set |
| `STRIPE_WEBHOOK_SECRET` | B | server | Stripe → Webhooks → your endpoint | Not set |
| `NEXT_PUBLIC_SITE_URL` | both | client | Hardcoded — `https://www.puffprice.com` | Not set (uses default) |

---

## What success looks like

* Visit `puffprice.com/upgrade` in incognito → green Go Pro button → Stripe Checkout → test card → success page renders → Stripe dashboard shows customer + subscription
* Real subscriber #1 within 7 days of launch (Matthew tells one IL friend who's an active cannabis consumer to try it for the SMS alerts)
* No payment failures in the first week (cancel test subs immediately to avoid noise)

---

## If something goes wrong

* `/upgrade` button is mailto instead of Stripe URL → env var not set OR not redeployed → re-check step 4
* Stripe says "Test card declined in live mode" → you tried a 4242 card in live mode, use a real card
* Stripe Checkout looks unbranded → set business name + logo in Stripe Settings → Branding
* Customer email field doesn't pre-fill → that's fine, Payment Link collects it on the Stripe page

If anything is fundamentally broken, the fallback is still mailto — `/upgrade` page degrades cleanly. PuffPrice's free experience is unaffected by Stripe outages.
