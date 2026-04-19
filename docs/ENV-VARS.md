# PuffPrice — Environment Variables Reference
Last updated: April 15, 2026

This is the single source of truth for every process.env variable used across the codebase.
Reference this when setting up any new Vercel environment or onboarding a new developer.

---

## BLOCKING BUILD ISSUE

The Production environment for puffprice.com (Vercel project: directory-network-) is
FAILING because two NEXT_PUBLIC_ Supabase variables are missing.

Fix: Vercel → directory-network- project → Settings → Environment Variables → add:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

(Use the same values already set in the directory-network project.)

---

## Variable Reference

### NEXT_PUBLIC_SUPABASE_URL
- Type: NEXT_PUBLIC_ (exposed to browser)
- Required: YES — build fails at static generation without it
- Used in: lib/supabase.ts
- What it does: Supabase project URL for the client-side Supabase SDK
- Where to get it: Supabase Dashboard → Settings → API → Project URL
- Example: https://hnbjufmtmrhexmdrfubw.supabase.co
- Status: SET in cleanlist.co env, MISSING in puffprice.com env

### NEXT_PUBLIC_SUPABASE_ANON_KEY
- Type: NEXT_PUBLIC_ (exposed to browser)
- Required: YES — build fails at static generation without it
- Used in: lib/supabase.ts
- What it does: Supabase anonymous/public key for client-side reads (respects RLS)
- Where to get it: Supabase Dashboard → Settings → API → anon public key
- Status: SET in cleanlist.co env, MISSING in puffprice.com env

### SUPABASE_URL
- Type: Server-only (no NEXT_PUBLIC_ prefix)
- Required: YES for lead submission and admin write paths
- Used in: app/api/leads/route.ts (raw REST fetch, not supabase-js)
- What it does: Supabase project URL used in server-side fetch() calls
- Note: Same value as NEXT_PUBLIC_SUPABASE_URL — identical string
- Status: Set in both Vercel environments
- **Action (alias cleanup):** Standardize on `NEXT_PUBLIC_SUPABASE_URL` project-wide. For now set both to the same value if used.

### SUPABASE_SERVICE_KEY
- Type: Server-only — NEVER add NEXT_PUBLIC_ prefix, never commit to code
- Required: YES for write operations and RLS-bypassing admin reads
- Used in: app/api/leads/route.ts, admin API endpoints
- What it does: Service role key that bypasses Row Level Security for server writes
- Where to get it: Supabase Dashboard → Settings → API → service_role key
- Status: Set in both Vercel environments
- **Action (alias cleanup):** `SUPABASE_SERVICE_KEY` is a legacy alias for `SUPABASE_SERVICE_ROLE_KEY`. Both names appear in code — standardize on `SUPABASE_SERVICE_ROLE_KEY` and remove references to `SUPABASE_SERVICE_KEY` over time. For now, set BOTH to the same value to avoid breakage.

### NEXT_PUBLIC_GA_ID
- Type: NEXT_PUBLIC_ (exposed to browser)
- Required: Optional — falls back to placeholder string "G-PLACEHOLDER"
- Used in: app/layout.tsx (Google Analytics script injection)
- What it does: Google Analytics 4 Measurement ID. Without real value, no analytics fire.
- Where to get it: Google Analytics → Admin → Data Streams → Measurement ID
- Example: G-XXXXXXXXXX
- Status: PLACEHOLDER — must be set before 4/20 launch
- Note: Variable is named NEXT_PUBLIC_GA_ID in code (not NEXT_PUBLIC_GA_MEASUREMENT_ID)

### STRIPE_SECRET_KEY
- Type: Server-only — NEVER expose to client
- Required: Optional — /api/stripe/create-checkout returns a 503 with friendly message if absent
- Used in: app/api/stripe/create-checkout/route.ts
- What it does: Authenticates Stripe API calls for creating checkout sessions
- Where to get it: Stripe Dashboard → Developers → API Keys → Secret key
- Status: NOT SET — Pro ($0.99/mo) and Featured ($49/mo) subscriptions blocked

### STRIPE_PRO_PRICE_ID
- Type: Server-only
- Required: Required when STRIPE_SECRET_KEY is set
- Used in: app/api/stripe/create-checkout/route.ts (tier: "pro_consumer")
- What it does: Stripe Price ID for the $0.99/month Pro consumer subscription
- Where to get it: Stripe Dashboard → Products → create Pro product → copy Price ID
- Example: price_1Xxxx...
- Status: NOT SET

### STRIPE_FEATURED_PRICE_ID
- Type: Server-only
- Required: Required when STRIPE_SECRET_KEY is set
- Used in: app/api/stripe/create-checkout/route.ts (tier: "featured")
- What it does: Stripe Price ID for the $49/month Featured dispensary subscription
- Where to get it: Stripe Dashboard → Products → create Featured product → copy Price ID
- Status: NOT SET

### STRIPE_PUBLISHABLE_KEY / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- Type: `NEXT_PUBLIC_` variant is client-side, non-prefixed is server-only
- Declared in `.env.example`, **not yet referenced in code**
- What it does: Publishable Stripe key for client-side Stripe.js when we move to embedded checkout
- Action: Set on Vercel preemptively — costs nothing and unblocks the moment we wire client-side Stripe. Use `pk_live_` in production.
- Status: NOT SET — preemptive Phase 2 slot

### STRIPE_WEBHOOK_SECRET
- Type: Server-only
- Declared in `.env.example`, **not yet referenced in code**
- What it does: Webhook signing secret used to verify incoming Stripe events
- Action: Required as soon as the webhook handler (Code Task 6) goes live. Get from Stripe → Developers → Webhooks → your endpoint → Signing secret.
- Status: NOT SET — needed for Code Task 6 activation

### NEXT_PUBLIC_SITE_URL
- Type: NEXT_PUBLIC_ (exposed to browser)
- Required: Optional — defaults to "https://puffprice.com" hardcoded in route
- Used in: app/api/stripe/create-checkout/route.ts (success_url and cancel_url)
- What it does: Base URL injected into Stripe's post-checkout redirect URLs
- Status: Not set (default is fine once puffprice.com is live)

### RESEND_API_KEY
- Type: Server-only
- Required: Optional — email notifications are silently skipped if absent
- Used in: app/api/leads/route.ts (fire-and-forget notification on new lead)
- What it does: Sends email to matthew@jacarandapeoria.com when any lead form submits
- Where to get it: resend.com → API Keys
- Status: NOT SET

### ADMIN_PASSWORD
- Type: Server-only
- Required: Optional — falls back to hardcoded default "cleanlist2026"
- Used in: middleware.ts (protects the /admin route)
- What it does: Password cookie value checked before allowing /admin access
- WARNING: The default "cleanlist2026" is visible in source code — change this before launch
- Status: Using hardcoded default

---

## Summary Table

| Variable | Visibility | Required | Status |
|---|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | public | YES | MISSING in puffprice env — BUILD BLOCKER |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | public | YES | MISSING in puffprice env — BUILD BLOCKER |
| SUPABASE_URL | server | YES | Set in both envs |
| SUPABASE_SERVICE_KEY | server | YES | Set in both envs |
| NEXT_PUBLIC_GA_ID | public | optional | Placeholder — fix before 4/20 |
| STRIPE_SECRET_KEY | server | optional | Not set |
| STRIPE_PRO_PRICE_ID | server | optional | Not set |
| STRIPE_FEATURED_PRICE_ID | server | optional | Not set |
| NEXT_PUBLIC_SITE_URL | public | optional | Uses default |
| RESEND_API_KEY | server | optional | Not set |
| ADMIN_PASSWORD | server | optional | Hardcoded default — change before launch |

---

## Setup Checklist (new environment)

Minimum viable (needed to build and run):
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_KEY

Pre-launch (needed for full functionality):
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_PRO_PRICE_ID
- [ ] STRIPE_FEATURED_PRICE_ID
- [ ] NEXT_PUBLIC_GA_ID (real value, not G-PLACEHOLDER)
- [ ] RESEND_API_KEY
- [ ] ADMIN_PASSWORD (changed from default)

---

## Planned but not yet wired

These names appear in launch/strategy docs but the code does not reference them yet. Set them on Vercel ahead of the corresponding feature build; they are not currently load-bearing.

- `RESEND_API_KEY` — required when transactional email (deal alerts, claim confirmations, weekly digest) lands. Get from [resend.com/api-keys](https://resend.com/api-keys).
- `STRIPE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — set ahead of any client-side Stripe move.
- `STRIPE_WEBHOOK_SECRET` — set ahead of the webhook skeleton going live.

---

## Sanity check before deploys

```bash
# Local dev — confirm all required vars are loaded
node -e "['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','NEXT_PUBLIC_SITE_URL','STRIPE_SECRET_KEY','STRIPE_PRO_PRICE_ID','STRIPE_FEATURED_PRICE_ID','ADMIN_PASSWORD'].forEach(k => console.log(k.padEnd(38), process.env[k] ? 'OK' : 'MISSING'))"
```

Run before any production deploy:

```bash
vercel env ls production
```

Look for `MISSING` rows or any value that is still the `.env.example` placeholder.

---

## Naming standards going forward

- **`NEXT_PUBLIC_*`** — only when the value MUST be available in the browser. Anything secret never gets this prefix.
- **No alias creep.** If you rename a variable, do a project-wide replace in the same commit. The `SUPABASE_SERVICE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` split that this audit found is the cautionary tale.
- **`.env.example`** — keep it in sync with this doc. If a new var lands in code, add a placeholder line to `.env.example` in the same PR.
