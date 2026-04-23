# Stripe webhook status — 2026-04-23

**Audience:** Matthew, before Path B (Embedded Checkout + Webhook) cutover.
**Scope:** current state of `app/api/stripe/webhook/route.ts` after this commit.
**Companion doc:** `docs/ops/stripe-onboarding-completion-checklist-20260422.md` (path recommendation).

---

## What's done (in this commit)

| # | Requirement | Done | Notes |
|---|---|---|---|
| 1 | `customer.subscription.created` → upsert `pro_users` | ✅ | Looks up customer email via `stripe.customers.retrieve(customer_id)` before upsert |
| 2 | `customer.subscription.updated` → status flip | ✅ | Same handler as created (upsert with `onConflict: stripe_subscription_id`) — any status change propagates |
| 3 | `customer.subscription.deleted` → downgrade | ✅ | `status = 'canceled'` update keyed on `stripe_subscription_id` |
| 4 | Status mapping: active / past_due / canceled | ✅ | `trialing` → `active`; `unpaid` → `past_due`; anything else → `canceled`. Matches the CHECK constraint in `sql/migrations/2026-04-18-pro-users.sql` |
| 5 | Idempotency: same event twice → log + skip | ✅ | `stripe_events_processed` table checked before dispatch; event.id inserted after successful handler run |
| 6 | Verify `stripe-signature` header | ✅ | `stripe.webhooks.constructEvent(body, sig, secret)` — no change from prior revision |
| 7 | Customer email captured | ✅ | `customer.subscription.*` events don't carry email; handler calls `stripe.customers.retrieve` |
| 8 | Returns 200 even when Supabase tables missing | ✅ | Swallows `postgrest` errors so Stripe stops retrying while we apply migrations |

---

## Pending (Matthew owns)

### Migrations (not yet applied)

| Migration | What it creates | Why needed |
|---|---|---|
| `sql/migrations/2026-04-18-pro-users.sql` | `pro_users`, `pro_alerts_sent` | Target table for subscription upserts |
| `sql/migrations/2026-04-23-stripe-events-processed.sql` | `stripe_events_processed` | Idempotency ledger; **NEW in this commit** |

Apply both via Supabase SQL Editor or `mcp__supabase__apply_migration`. Order doesn't matter — neither references the other.

### Stripe dashboard setup

1. Finish onboarding → enable live mode
2. Create the `$0.99/mo` recurring Payment Link (Path A)
3. Register webhook endpoint:
   - URL: `https://www.puffprice.com/api/stripe/webhook`
   - Events to forward:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `checkout.session.completed`
     - `invoice.payment_failed`
4. Copy the webhook signing secret → add to Vercel as `STRIPE_WEBHOOK_SECRET` (Production + Preview)

### Env vars expected in Vercel (from `CLAUDE.md`)

- `STRIPE_SECRET_KEY` — already documented, likely set
- `STRIPE_WEBHOOK_SECRET` — **NEW requirement for webhook verification**
- `STRIPE_PRO_PRICE_ID` — already documented
- `NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL` — Path A's button target, already documented

---

## What is NOT needed

### No `pro_users` column additions

The task allowed for a new migration at `sql/migrations/2026-04-23-pro-users-stripe-columns.sql` IF the existing `pro_users` migration was missing required columns. It isn't:

| Column the webhook writes | In 2026-04-18-pro-users.sql? |
|---|---|
| `stripe_customer_id` | ✅ (UNIQUE NOT NULL) |
| `stripe_subscription_id` | ✅ (UNIQUE NOT NULL) |
| `email` | ✅ (NOT NULL) |
| `status` | ✅ (CHECK: active / past_due / canceled) |
| `updated_at` | ✅ |

No new migration file for pro_users columns. If Matthew later wants to capture `phone`, `zip`, `categories` from the Stripe session metadata, that'd be a separate follow-up.

---

## Webhook behavior before migrations apply

Useful for Matthew's mental model when doing the cutover:

| Scenario | Response | Log output |
|---|---|---|
| No `STRIPE_WEBHOOK_SECRET` set | 503 | Nothing — Stripe retries until env var lands |
| Bad signature | 400 | `signature verification failed` |
| Valid signature, Supabase tables missing | 200 | `pro_users upsert skipped: <postgrest error>` — Stripe stops retrying |
| Valid signature, tables present, new event | 200 | Normal path; row written, event logged to ledger |
| Valid signature, tables present, duplicate event | 200 (with `idempotent_skip: true`) | `event evt_... already processed, skipping` |
| Handler throws mid-dispatch | 500 | `handler error: ...` — Stripe retries (event not yet recorded) |

The graceful-degradation-on-missing-tables behavior is deliberate: it means Matthew can register the webhook BEFORE applying migrations, Stripe will stop retrying, and the first real subscription event will log a helpful warning telling Matthew exactly which table is missing.

---

## One gotcha for Matthew

`customer.subscription.created` doesn't include the customer's email in its payload — only the customer ID. The webhook now does a second Stripe API call (`stripe.customers.retrieve(customer_id)`) to get the email. This adds ~100-200ms latency per subscription event, which is fine for our volume (<100 subs/mo initially) but worth knowing if we ever hit rate-limit edge cases.

Alternative path: use `checkout.session.completed` events instead — those carry `customer_email` directly. But that fires BEFORE the subscription object is fully created, so we'd need to keep a two-step flow. Not worth the complexity at current volume.
