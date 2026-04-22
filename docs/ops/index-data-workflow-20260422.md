# PuffPrice Index — data capture workflow

**Author:** Cowork
**Date:** 2026-04-22 (authored 2026-04-21 night)
**Pairs with:**
- `sql/migrations/2026-04-21-deal-submissions.sql` (the table + trigger, NOT YET APPLIED)
- `sql/queries/submission-moderation.sql` (reference queries — created with this doc)
- `sql/queries/puffprice-index-weekly.sql` (the Index computation)
- `docs/handoffs/deal-submission-ui-spec-20260421.md` (the form spec)
- `docs/handoffs/ppg-backfill-coverage-v2-20260421.md` (why Path C matters)

## Scope

This is the operational workflow for Path C — dispensary-submitted deals via
`/deals/submit`. Path A (full scraper) is deferred; Path B (anchor SKU PPG
inference) is a write-side computation, not a submission pipeline.

Ships as documentation so the moment the first real submission hits
`deal_submissions`, there's a published procedure to approve, reject, or
escalate it. Without this doc, first-submission triage gets made up under
pressure and the precedents get wrong.

---

## Life of a submission

```
    Dispensary form at /deals/submit
              │
              ▼
    INSERT INTO deal_submissions
    (anon-role RLS allows INSERT only)
              │
              ▼
    Trigger: auto-compute PPG / PPmg / per-unit
              │
              ▼
    Row lands in deal_submissions_pending view
    (approved=false, rejected_at=null)
              │
              │  Daily moderator pass (Matthew today, admin role later)
              ▼
        Review decision
          ┌────┴────┐
          │         │
       APPROVE    REJECT
          │         │
          ▼         ▼
    INSERT INTO   UPDATE deal_submissions
    deals table   SET rejected_at, rejected_reason
    (copies        (optional: notify submitter)
     fields)
          │
          ▼
    UPDATE deal_submissions
    SET approved=true, approved_at, promoted_deal_id=<new deal id>
          │
          ▼
    Deal is live on the public site
    (surfaces in active_deals_with_listings view)
```

---

## Daily moderator pass

**Owner:** Matthew until v1, then whoever takes the admin role.
**Cadence:** Daily at ~9:00 CT. One sweep per day is enough through ~50
submissions/day; anything more triggers the volume review below.
**Target SLA:** Approve or reject within **24 hours** of submission. A
dispensary that submits a deal and waits 72 hours for nothing to happen won't
submit again.

### What to check on every row

1. **Legitimate dispensary.** The `dispensary_slug` joins to `master_listings`
   (the form should enforce this for the dropdown path; the freetext-name path
   is the escape hatch for a dispensary that hasn't onboarded yet). If freetext
   only: Google "{dispensary_name_freetext} {dispensary_city_freetext} Illinois
   cannabis" — does the business exist? Does it hold an IL license? If yes,
   hold the submission and create the master_listings row first.
2. **Price sanity.** `sale_price_usd` and (if present) `regular_price_usd`
   should pass the smell test:
   - Flower: `price_per_gram_computed` between $3 and $50. Outside that range
     (below $3: almost certainly bogus; above $50: extreme luxury SKU or
     miskeyed mg_thc in the weight_grams field) → flag for human review.
   - Edibles: `price_per_mg_computed` between $0.05 and $1. Outside → review.
   - Pre-roll multipacks (count-based): `price_per_unit_computed` between $4
     and $25. Outside → review.
3. **URL resolves.** Open `source_url` in a browser (or curl -I). 200 response
   and the URL actually references the dispensary + deal in question. 404 or
   unrelated page → reject with reason "source_url dead."
4. **Not a duplicate.** `SELECT id FROM deals WHERE listing_slug = $slug AND
   title ILIKE $title AND is_active = true` — if a match exists, this is
   probably a re-submission by the dispensary or a racing submission from two
   people at the same shop. Reject with reason "duplicate of <deal_id>."
5. **Expiration coherence.** `end_date` in the past = reject. `end_date` within
   24h of moderation = approve but flag for the next cron run (it'll auto-expire
   on schedule). `end_date` null AND `is_recurring = false` AND deal text
   implies an event ("4/20", "Green Wednesday", "Black Friday") = ask in the
   rejection reason for an end_date before resubmitting.

### Approve action

Two writes, ideally in a transaction:

```sql
BEGIN;

-- 1. Copy the submission into the public deals table.
INSERT INTO public.deals (
  listing_slug, title, description, category,
  discount_type, discount_value, discount_unit,
  original_price, sale_price, price_per_gram, unit,
  is_recurring, recurring_days, expires_at, source, source_url,
  is_active, verified_at, project_tag, created_at
)
SELECT
  dispensary_slug,
  deal_title,
  deal_description,
  category,
  CASE
    WHEN regular_price_usd IS NOT NULL AND sale_price_usd IS NOT NULL THEN 'price_off'
    ELSE 'percent_off'
  END,
  NULL,                             -- moderator sets discount_value only for explicit % off deals
  NULL,
  regular_price_usd,
  sale_price_usd,
  price_per_gram_computed,
  CASE
    WHEN weight_grams IS NOT NULL THEN 'gram'
    WHEN mg_thc IS NOT NULL THEN 'mg'
    WHEN count IS NOT NULL THEN 'each'
  END,
  is_recurring,
  recurring_days,
  end_date::timestamptz,
  'submission',
  source_url,
  true,
  NOW(),                            -- verified_at = approval moment (this is real verification)
  'green',
  NOW()
FROM public.deal_submissions
WHERE id = $submission_id
RETURNING id;   -- capture this for step 2

-- 2. Mark the submission approved, linking back to the new deal.
UPDATE public.deal_submissions
SET approved = true,
    approved_at = NOW(),
    approved_by = 'matthew@jacarandapeoria.com',
    promoted_deal_id = $new_deal_id,
    verified = true,
    verified_method = 'manual-menu'  -- or 'manual-call' / 'auto-source-match' per what the moderator did
WHERE id = $submission_id;

COMMIT;
```

Reference query set: `sql/queries/submission-moderation.sql`.

### Reject action

Single write:

```sql
UPDATE public.deal_submissions
SET rejected_at = NOW(),
    rejected_reason = $reason,  -- short human-readable string, chosen from the enum below
    approved = false,
    approved_at = NULL,
    approved_by = 'matthew@jacarandapeoria.com'  -- track who rejected
WHERE id = $submission_id;
```

Rejection reason taxonomy (pick one — these are the only permitted values
until the queue shows us we need more):

| Reason code | Human message |
|---|---|
| `duplicate` | "We already have this deal on file." |
| `source_url_dead` | "The source URL returned 404 or didn't reference this deal." |
| `price_implausible` | "Price-per-gram (or equivalent) is outside plausible IL dispensary range — resubmit with corrected fields." |
| `unknown_dispensary` | "We couldn't verify this dispensary is a licensed IL operator. Please include a license number in notes or contact us directly." |
| `already_expired` | "The end_date you listed is already in the past." |
| `spam` | "Submission appears to be spam." |
| `other` | Free-text in `rejected_reason` — use sparingly. |

### Notify submitter (optional, default off until we have an email template)

Future enhancement: on rejection, send a Resend email to `submitter_email`
explaining the reason and inviting resubmission. Not wired today — the copy
needs to read like a human, not a bot, and that's a drafting pass Cowork
should do before enabling. Flag in Matthew's "week 2" list.

---

## Edge cases

### Duplicate submissions from the same dispensary in <24h
Common failure mode: two people at the same shop each submit the same deal
because neither knew the other was going to. Triage rule: approve the earliest
submission; reject the later one with `duplicate`. Promote the earliest.

If the fields differ slightly (one has a better source_url or price detail),
reject the earlier one AND the later one, then hand-INSERT a merged row into
`deals` with a pointer to both submission IDs in the deal's `description`
field (e.g., "Combined from submissions a1b2, c3d4 on 2026-04-25"). Rare.

### Price anomaly — deal > $50/gram flower
The submission trigger computes PPG at insert but doesn't block. These should
flow into the moderation queue and the moderator hand-checks. Most end up
being miskeyed (e.g., submitter entered `weight_grams = 1` for a 3.5g eighth
priced $30, computing $30/g — should have been 3.5g). Reject with
`price_implausible`; invite resubmission.

If the high PPG IS real (premium solventless, connoisseur tier, etc.),
approve it but add a note in the deal's `description`: "Top-shelf tier —
priced above category average." This prevents the Index compute from pulling
the row into a statewide median without flagging.

### Expired deals in the submission queue
These are either: (a) submitted days ago and the moderator missed the SLA —
the cron will eventually auto-expire them even after approval; (b) a
dispensary re-submitting a recurring deal with yesterday's `end_date` still
filled in. For (b), reject with `already_expired` and ask for a current
`end_date` OR `is_recurring = true`.

### Dispensary not in `master_listings` yet
Freetext name + city path. Two options:
1. **Inline**: Moderator INSERTs a `master_listings` row during the approval
   transaction. Requires license number + lat/lng research — adds 10-15 min
   to the moderation per such row. Worth it when the dispensary is a real
   player (e.g., Curaleaf Morris, Nature's Treatment Milan — per the
   Apr 21 join-integrity audit).
2. **Hold**: Set a marker in `submitter_email`'s thread ("holding for master
   listing creation"), batch-process these in a weekly `master_listings`
   research pass. Slower but lower variance.

Recommend Option 2 until volume justifies Option 1 (target: 5+ freetext-
submissions/week before going inline).

### Submission references a dispensary flagged `status = 'orphaned'`
The deal→listing join audit surfaced 6 orphan slugs that were deactivated.
If a submission comes in against one of those slugs, the path is the same
as "dispensary not in master_listings yet" — hold until master row is
created, then approve.

### Dispensary submits a "1000% off" or other nonsense discount_value
The form should validate `0 < discount_value ≤ 100` for percent_off deals —
confirm with Code before the form ships.

---

## SLA targets

| Metric | Target | Breach action |
|---|---|---|
| Approve-or-reject latency | p50 ≤ 8h, p95 ≤ 24h | >24h = dispensary won't resubmit. Escalate to a second daily sweep. |
| Queue depth | <10 pending at any time | 10+ pending = either spam or success. Either way, daylight the dashboard for Matthew. |
| Approved-to-live latency | <5 min after approval | Approval SQL runs both INSERTs in one transaction. If it takes more, something's wrong. |
| Rejection rate | <25% (steady state) | >25% rejection = either form UX is failing dispensaries or we have a spam wave. Triage by looking at rejected_reason breakdown. |

---

## Admin UI spec (for Code, future sprint)

Not today, but spec-it-now so Code doesn't have to reverse-engineer the queue
logic when this lands.

**Route:** `/admin/submissions`
**Auth:** Supabase service role; gate behind existing `admin-auth` flow.
**Default view:** Pending queue, sorted oldest-first (SLA-ordered).

Columns:
- Submitted at (relative time, e.g., "3h ago")
- Dispensary (joined name + city, fallback to freetext with a `NEW` badge)
- Deal title
- Category + computed PPG / PPmg / per-unit
- Source URL (link icon, opens in new tab)
- Submitter email + role
- **Actions** column with three buttons:
  1. `Approve` → runs the 2-statement transaction; prompts for
     `verified_method` (dropdown: auto-source-match, manual-call, manual-menu,
     unverified). On success, row drops from queue; toast says
     "Approved — live now. [View deal](/deal/$new_id)".
  2. `Reject` → modal with dropdown of rejection reasons and optional
     free-text. On confirm, row drops from queue.
  3. `Hold` → adds a "held" tag without approving; row drops from pending
     queue but stays visible in a "held" filter. Used for "waiting on
     master_listings row creation."

**Filters:** dispensary, category, has-PPG, rejected, approved (audit history).

**Keyboard shortcuts:** `a` approve, `r` reject, `h` hold, `j`/`k` next/prev
row, `?` help. Makes batch moderation fast.

**Secondary view:** `/admin/submissions/metrics` — weekly SLA metrics,
approval/rejection breakdown, SLA breach list.

---

## Effect on PuffPrice Index (the goal)

The Index (`sql/queries/puffprice-index-weekly.sql`) computes a weighted
statewide price-per-gram across brand × category. Today it sits at
`sample_size ≥ 10` threshold per cell, and most cells fall short because PPG
is null on 56/56 of the imported deals.

Every Path C submission with `weight_grams + sale_price_usd` populated becomes
a PPG row at trigger time. After the promote-to-deals step, it's a deal row
with non-null `price_per_gram`, which then feeds the Index compute directly.

**Target:** 50 submissions with usable PPG fields over the next 8 weeks. That
clears most flower + edible cells for the Index to flip live. If submissions
plateau below 30, Matthew's weekly re-import pass ([docs/audits/deal-data-
freshness-20260421.md](../audits/deal-data-freshness-20260421.md) recommendation)
is the backstop.
