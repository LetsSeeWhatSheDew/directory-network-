# PuffPrice — Environment Variables Reference
Last updated: September 28, 2026 (rewritten from the code plus the Vercel project's env-var list, names only)

This is the single source of truth for every `process.env` variable the site reads. Where it disagrees with older docs (`HANDOFF*.md`, `PHASE1-STATUS.md`, `LAUNCH-CHECKLIST.md`), this file wins.

`tests/unit/envNames.test.ts` fails if the code starts reading a name Vercel doesn't have (for example, a service-key read without the `SUPABASE_SERVICE_KEY` fallback, or `NEXT_PUBLIC_GA_ID`).

---

## What's set in Vercel today (Production, 2026-09-28)

| Set | Not set |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `CRON_SECRET`, `RESEND_API_KEY`, `GOOGLE_PLACES_API_KEY`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `SUPABASE_SERVICE_ROLE_KEY`, `UNSUBSCRIBE_SECRET`, all `STRIPE_*`, `NEXT_PUBLIC_GA_ID` (unused), Sentry DSNs, Twilio |

Nothing that's missing breaks the site: every "not set" variable is optional, has a fallback, or belongs to a feature that isn't live yet (Stripe, Sentry, SMS).

---

## Supabase

### NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — public, required — **set**
- The project URL and the anon ("public") key. Both are safe in the browser: the anon key can only do what row-level security allows.
- Used everywhere the site reads public data. The code falls back to the project's own URL/anon key if these are missing, so builds don't crash.

### SUPABASE_URL — server, required by a few routes — **set**
- Same value as `NEXT_PUBLIC_SUPABASE_URL`. Read by `/api/leads`, `/api/admin/update-lead-status` and `/admin/leads`.

### SUPABASE_SERVICE_KEY — server-only secret, required — **set**
### SUPABASE_SERVICE_ROLE_KEY — alternate name for the same key — **not set in Vercel**
- The service-role key. It bypasses row-level security, so it must never get a `NEXT_PUBLIC_` prefix and must never be imported into a client component (`tests/unit/clientSecrets.test.ts` guards this).
- **Vercel has it under `SUPABASE_SERVICE_KEY`.** The code accepts either name, trying `SUPABASE_SERVICE_ROLE_KEY` first and then `SUPABASE_SERVICE_KEY`. Before 2026-09-28, ten places read only `SUPABASE_SERVICE_ROLE_KEY`; they were fixed in the security PR:
  - the admin pages (dashboard, submissions, reviews, scrapers)
  - the admin approve/reject/review/manual-deal APIs
  - the `mark-stale-deals` cron, which had been skipping every night with "not configured"
- Needed for: subscriber sign-ups and unsubscribes, deal watches, the waitlist, leads, analytics writes, confirmation counts, `/admin`, and all crons.
- **GitHub Actions is separate:** `.github/workflows/daily-scrape.yml` reads the GitHub repository secret `SUPABASE_SERVICE_ROLE_KEY`, not Vercel's variable. Set it there under that name.

---

## Auth and secrets

### ADMIN_PASSWORD — server-only secret, required for /admin — **set**
- Gate for `/admin` pages (middleware plus `app/admin/layout.tsx`) and every `/api/admin/*` route (`lib/adminAuth.ts`).
- **There is no default.** The old `cleanlist2026` fallback is gone. If the variable is missing, `/admin` fails closed: nobody can sign in, and the login page says the variable is missing.
- The session cookie holds a SHA-256 token derived from the password, not the password itself. Changing the password signs everyone out.

### CRON_SECRET — server-only secret, required for crons — **set**
- Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. All five `/api/cron/*` routes return 401 without it (`lib/cronAuth.ts`, constant-time, trims a pasted trailing newline).

### UNSUBSCRIBE_SECRET — server-only secret, optional — **not set (falls back to CRON_SECRET)**
- HMAC key for one-tap unsubscribe links, deal-watch stop links, and confirm links (`lib/alertSubscribers.ts`, `lib/dealWatch.ts`).
- Fallback order: `UNSUBSCRIBE_SECRET` → `CRON_SECRET` → service key. With today's settings the links are signed with `CRON_SECRET`, and everything works.
- **Recommended:** set `UNSUBSCRIBE_SECRET` to the **same value as the current `CRON_SECRET`**. Links already in people's inboxes keep working, and `CRON_SECRET` can later be rotated without breaking them. Setting it to a *new* value would invalidate every unsubscribe link already sent.

---

## Email

### RESEND_API_KEY — server-only secret — **set**
- Sends the Monday report, deal-watch digests, **double opt-in confirm emails** (the Monday report sign-up now requires one; without this key, sign-ups return 503), lead notifications to the owner, and the stale-deal alert.

### ALERTS_FROM — optional — not set (default `PuffPrice <alerts@puffprice.com>`)
### STALE_ALERT_RECIPIENT — optional — not set (default: the owner's address)

---

## Google

### NEXT_PUBLIC_GA_MEASUREMENT_ID — public — **set**
- Google Analytics 4 id, read in `app/layout.tsx`. If it's missing, the code falls back to the live id `G-TML9Y6VMC2`, so analytics fire either way.
- `NEXT_PUBLIC_GA_ID` (the name in older docs) is **not read anywhere**; don't set it.

### GOOGLE_PLACES_API_KEY — server-only secret — **set**
- Used only by `/api/store-photo/[slug]` (and the local backfill scripts). It stays on the server, and the browser only ever gets Google's key-free photo URL.

### NEXT_PUBLIC_PLACES_PHOTOS — public flag, optional — not set
- Set it to `1` to show Google Places store photos. Off by default because Places photo billing is off; the UI shows monograms instead.

---

## Payments (Pro, not live yet) — none set

| Variable | Visibility | What happens without it |
|---|---|---|
| `STRIPE_SECRET_KEY` | server secret | `/api/stripe/create-checkout` returns 503, and the Pro button falls back to a waitlist sign-up (double opt-in). |
| `STRIPE_PRO_PRICE_ID` | server | Same. |
| `STRIPE_WEBHOOK_SECRET` | server secret | `/api/stripe/webhook` returns 503, so Stripe retries until it's configured. |
| `NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL` | public | `/upgrade` shows a mailto link instead of a Stripe Payment Link. |
| `NEXT_PUBLIC_SITE_URL` | public | Checkout redirect base; defaults to `https://www.puffprice.com`. |

---

## Monitoring and SMS (scaffolded, not live) — none set
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`: Sentry stays off until these are set.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`: the SMS scaffold in `lib/sms.ts` stays off. Alerts go by email only; carriers block cannabis texts.

## Platform and local-only (never set by hand in Vercel)
- `NODE_ENV`, `VERCEL_ENV`, `NEXT_PUBLIC_VERCEL_ENV`, `NEXT_RUNTIME`: set by Next/Vercel.
- `PW_PROXY`, `PW_EXECUTABLE_PATH`: the local Playwright scraper on the Mac (`scripts/scrape-rendered-deals.ts`).

---

## Rules
- **`NEXT_PUBLIC_*` only when the browser must have the value.** Anything secret never gets the prefix; `tests/unit/clientSecrets.test.ts` fails if a secret-looking name does.
- **No hardcoded secrets or passwords in code.** Public values (the anon key, the GA id, the IndexNow key) are fine.
- **Rename in one commit.** If a variable is renamed, update the code, this file and Vercel together. The `SUPABASE_SERVICE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` split is the cautionary tale: ten places silently read a name that wasn't set.

## Sanity check before deploys
```bash
node -e "['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_URL','SUPABASE_SERVICE_KEY','CRON_SECRET','RESEND_API_KEY','ADMIN_PASSWORD','GOOGLE_PLACES_API_KEY','NEXT_PUBLIC_GA_MEASUREMENT_ID','UNSUBSCRIBE_SECRET'].forEach(k => console.log(k.padEnd(34), process.env[k] ? 'OK' : 'MISSING'))"
```
Then `vercel env ls production` and compare against the "What's set" table above.
