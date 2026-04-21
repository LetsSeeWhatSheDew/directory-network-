# Deal submission form — UI spec (Path C)

> **For:** Code's next session.
> **Pairs with:** `sql/migrations/2026-04-21-deal-submissions.sql` (NOT YET APPLIED).
> **Lane note:** this spec is scope for Code. Cowork wrote the schema and this doc; Code owns `app/`, `components/`, `lib/`. Don't start until Matthew applies the migration.

## Goal

Ship a dispensary-facing deal submission form at `/deals/submit` that lets IL dispensary staff (owner / manager / budtender / marketing) self-report deals. The form captures enough pricing data that PPG / PP-mg / per-unit can be auto-computed at insert, solving the PuffPrice Index PPG gap for submitted deals.

This is **Path C** from the PPG coverage handoff. Expected year-1 yield: 10-20% of submitting dispensaries fill the optional price fields. Of those, 100% have a computable PPG at insert time.

## Page location

- URL: `/deals/submit`
- File: `app/deals/submit/page.tsx` (new)
- Also link from:
  - Dispensary dashboard (once dashboards exist)
  - Footer "For dispensaries" section
  - `/dispensary/[slug]` page — "submit a deal for this dispensary" CTA
  - `/alerts` page — "Own a dispensary? Submit a deal" footer note

## Form structure

### Section 1 — Who's submitting

Required fields first. Keep copy plain-spoken.

| Field | Input | Required | Maps to column | Notes |
|---|---|---|---|---|
| Your dispensary | Typeahead against `master_listings.name` with "not in list" escape | Yes | `dispensary_slug` OR `dispensary_name_freetext` + `dispensary_city_freetext` | If "not in list", show 2 extra freetext fields (name + city) |
| Your email | Email input | Yes | `submitter_email` | Basic validation. Used for moderator follow-up, not listed publicly |
| Your role | Radio: Owner / Manager / Budtender / Marketing / Other | Yes | `submitter_role` | |

### Section 2 — Deal basics

| Field | Input | Required | Maps to column | Notes |
|---|---|---|---|---|
| Deal title | Text input, 120 char limit | Yes | `deal_title` | Placeholder: "e.g. 30% off Cresco eighths — Wax Wednesday" |
| Category | Dropdown: Flower / Pre-roll / Vape / Concentrate / Edible / Topical / Accessories / All | Yes | `category` | Drives Section 3 below |
| Deal description | Textarea, 500 char limit | No | `deal_description` | Placeholder: "What's the deal? Any exclusions? Days of the week?" |

### Section 3 — Product + pricing (the PPG unlock)

**Conditional based on category choice in Section 2.** This is where the Path C value lives — the whole point is to capture enough pricing data that PPG computes at insert.

#### 3a — Flower / Pre-roll / Concentrate (show if category ∈ flower|pre-roll|concentrate)

| Field | Input | Required | Maps to column |
|---|---|---|---|
| Strain or product name | Text | Recommended | `strain_or_product` |
| Brand | Text (with autocomplete from `anchor_skus.brand` once available) | Recommended | `brand` |
| Weight | Dropdown (1g / 3.5g / 7g / 14g / 28g / custom) | **Required** | `weight_grams` |
| Regular price | Number input ($) | Recommended | `regular_price_usd` |
| Sale price | Number input ($) | **Required** | `sale_price_usd` |

Show a live "price-per-gram: $X.XX" preview as user types weight + sale price. This is the educational moment — the submitter sees why this matters.

#### 3b — Edibles / Tinctures (show if category ∈ edibles|topicals)

| Field | Input | Required | Maps to column |
|---|---|---|---|
| Product name | Text | Recommended | `strain_or_product` |
| Brand | Text | Recommended | `brand` |
| Total THC (mg) | Number input | **Required** | `mg_thc` |
| Count (pieces in pack) | Number input | No | `count` |
| Regular price | Number input ($) | Recommended | `regular_price_usd` |
| Sale price | Number input ($) | **Required** | `sale_price_usd` |

Show live "price-per-mg THC: $X.XXXX" preview.

#### 3c — Vapes (show if category = vape)

| Field | Input | Required | Maps to column |
|---|---|---|---|
| Product name | Text | Recommended | `strain_or_product` |
| Brand | Text | Recommended | `brand` |
| Cartridge size | Dropdown (0.5g / 1g / custom) | **Required** | `weight_grams` |
| Total THC (mg) | Number input | Optional | `mg_thc` |
| Regular price | Number input ($) | Recommended | `regular_price_usd` |
| Sale price | Number input ($) | **Required** | `sale_price_usd` |

Show live "price-per-gram: $X.XX".

#### 3d — Accessories / All (show if category ∈ accessories|all)

No pricing fields required. Just deal title / description / source URL. These submissions go to the moderation queue without PPG data.

### Section 4 — Timing

| Field | Input | Required | Maps to column |
|---|---|---|---|
| Start date | Date picker, default today | No | `start_date` |
| End date | Date picker | No | `end_date` |
| Recurring? | Checkbox | No | `is_recurring` |
| Which days? | Multi-select (Mon–Sun) — only if recurring is checked | Conditional | `recurring_days` |

### Section 5 — Source + notes

| Field | Input | Required | Maps to column |
|---|---|---|---|
| Menu URL | URL input | Recommended | `source_url` | Placeholder: "Where can we verify this deal?" |
| Anything else? | Textarea | No | `notes` |

## Validation rules

### Client-side (before submit button enables)

- All required fields non-empty.
- Email format: basic regex (`/^[^@]+@[^@]+\.[^@]+$/`).
- At least one of `weight_grams`, `mg_thc`, `count` non-null (enforced by the DB constraint but also checked client-side for friendlier errors).
- If both `regular_price_usd` and `sale_price_usd` set, `sale_price_usd <= regular_price_usd`.
- Sale price > 0.
- If end_date set, end_date > start_date.
- Recurring_days only if is_recurring true.
- Deal title ≤ 120 chars.
- Deal description ≤ 500 chars.
- Source URL if provided, must be a valid URL (starts with http/https).

### Server-side (API route that proxies to Supabase)

- Rate limit: 5 submissions per IP per hour (anti-spam).
- Spam filter: reject deal_title containing known spam tokens ("viagra", "casino", etc.).
- Honeypot field (hidden input named `website`) — if populated, drop silently.
- Capture `submitter_ip` from request header, `submitter_user_agent` from UA header.
- If submitter email doesn't match dispensary's `email` column in master_listings AND submitter_role is "owner", flag for extra moderation (soft-warn, not reject).

## Submission flow

1. User fills form, clicks Submit.
2. Client POSTs to `/api/deals/submit`.
3. API route:
   a. Validates server-side rules (rate limit, spam, honeypot).
   b. Calls Supabase INSERT with anon role (RLS policy allows anon INSERT).
   c. On success: returns `{ ok: true, id }`.
   d. On constraint failure (e.g. no denominator): returns 400 with field-specific error.
4. Client shows success state (see below).

## Success / error states

### Success state (after POST 200)

- Show green card: "Thanks — we got your deal submission."
- Body: "We'll review and publish it within 24 hours. If there's a problem with verification, we'll email you at `{submitter_email}`."
- Secondary CTA: "Submit another deal" (resets form, keeps dispensary_slug prefilled).
- Log event to Google Analytics: `deal_submission_success`.

### Error state — client validation failure

- Inline field errors (red text below the invalid field).
- Submit button disabled until all fields pass.

### Error state — server validation failure (400/422)

- Surface the server error message in a dismissible red banner at top of form.
- Preserve all filled fields.

### Error state — server error (500, network)

- Red banner: "Something went wrong — your submission didn't save. Please try again, or email matthew@jacarandapeoria.com."
- Preserve all filled fields.
- Log Sentry breadcrumb.

## Post-submission — what happens next?

Submissions go to `deal_submissions` with `approved=false, rejected_at=null`. That's the moderation queue. The moderator (Matthew, initially) reviews via:

- **Option A (MVP):** direct SQL query against `deal_submissions_pending` view in Supabase editor. Lightweight, launchable today.
- **Option B (next):** admin page at `/admin/submissions` that lists pending, lets moderator approve/reject with one click. Approve = INSERT into `deals`, link back via `promoted_deal_id`.

Approval action (either A or B):

1. INSERT row into `deals` table with fields mapped from submission.
2. UPDATE `deal_submissions` SET `approved=true, approved_at=now(), approved_by='matthew@...', promoted_deal_id={new deals.id}`.
3. Send confirmation email to submitter: "Your deal is live at puffprice.com/l/{slug}".

Rejection action:

1. UPDATE `deal_submissions` SET `rejected_at=now(), rejected_reason='...'`.
2. Optionally email submitter with reason (or ghost them — depends on spam risk).

## Accessibility requirements

- All fields have `<label>` with `for=` matching input `id`.
- Required fields marked with `*` in label AND aria-required="true".
- Error messages tied via aria-describedby.
- Submit button has clear label (not just "Submit" — use "Submit deal for review").
- Form has a top-of-page heading that matches the browser title.
- Category dropdown is a native `<select>` (not a custom component) for mobile keyboard support.
- Works without JS: the form POSTs to the API route normally, server-side validation still runs.

## SEO / brand notes

- Page title: "Submit a dispensary deal — PuffPrice"
- Meta description: "Own an Illinois dispensary? Submit a deal to PuffPrice in under 2 minutes. Free forever, no account required."
- Voice (per `docs/audits/brand-voice-audit-20260420.md`): plain-spoken, trust-first, slightly cheeky. Hero copy candidate:

> **Got a deal? Post it.**
> Illinois buyers are searching PuffPrice right now. 2 minutes, no account, free forever.

- Do NOT use "293 dispensaries" or any unverified stat in the page copy. Use "every Illinois dispensary we track" instead.
- Trust footer: "We manually verify deals before publishing. We'll email you at {submitter_email} if we need to double-check something."

## What this DOES NOT do

- Dispensary claim flow (separate feature). The form doesn't "claim" the listing — dispensary ownership is separately managed.
- Automated menu parsing. Moderator still verifies manually (or trusts the submitter's source_url).
- Edit / delete existing submissions from the public side. Submitters can't un-submit. Moderator controls lifecycle.
- Payment. No Pro tier gating. All submissions free forever.

## Open questions (Code + Matthew to align before shipping)

1. **Dispensary identity verification.** Do we require any form of identity proof (business email domain match, phone call-back, Google Maps verification code)? For MVP I'd say no — rely on the moderation queue. Flag for Matthew.
2. **Typeahead data source.** Hitting Supabase for the dispensary-name typeahead means 3-char min, debounced. Confirm the indexable endpoint is fast enough (should be — it's a 57-row table).
3. **Mobile layout.** Form will be long — 15+ fields across 5 sections. Consider a step-wizard on mobile (4 steps) to reduce cognitive load. Recommendation: start with single-page scroll, A/B a wizard if abandonment is high.
4. **Honeypot field name.** Use `website` (standard bot trap). Hidden via CSS, not `display:none` (bots check that). Use `position:absolute; left:-10000px` or similar.
5. **Recurring-days UX.** A row of 7 day-checkboxes (Mon Tue Wed Thu Fri Sat Sun) is simplest. Avoid "every weekday" meta-buttons in v1.

## Files Code should create/modify

| File | Action |
|---|---|
| `app/deals/submit/page.tsx` | New — server component shell |
| `app/deals/submit/SubmitForm.tsx` | New — client component (form state, validation, preview) |
| `app/api/deals/submit/route.ts` | New — POST handler, server validation, Supabase INSERT |
| `lib/submissionValidation.ts` | New — shared client/server validators |
| `app/sitemap.ts` | Add `/deals/submit` to sitemap |
| `app/layout.tsx` or footer component | Add "Submit a deal" link to footer |
| `app/dispensary/[slug]/page.tsx` | Add "Submit a deal for this dispensary" CTA near top of page (prefills `dispensary_slug`) |

## Cowork next-session pickups (AFTER Code ships)

- Write admin query for `deal_submissions_pending` and a one-click SQL snippet to promote a submission to `deals`.
- Once first 10 submissions land, check computed PPG columns for accuracy against the submitter's claimed prices.
- Extend `anchor_skus` table with any new brands that appear in submissions but weren't in the initial 27-row seed.

## Timeline estimate

Code lane: ~4 hours for form + API route + basic success/error states. Another 1–2 hours for mobile polish, typeahead debounce, honeypot, and Sentry wiring. One sitting, one PR.

Ships best on a day when Matthew can monitor the moderation queue for the first few submissions and flip any false-positive spam.
