// lib/scraper/dailyVerification.ts
// Post-scrape sweep — bumps verified_at on active deals not touched by
// today's scraper run, and deactivates ones that have gone 7+ days
// without an independent verification.
//
// Why this exists
// ---------------
// The Hobby-plan cron only fires once per day. The scraper visits every
// reachable Central IL dispensary, but some are HARD-coverage (no public
// deals page, custom POS embed we can't parse, hostile-to-bots blocking,
// etc.). Those listings' deals stay active with stale verified_at and
// quickly fall out of the homepage's freshness window — the user sees
// "No featured deal today" or amber stale warnings on every card.
//
// Tiered trust policy (per Matthew's 2026-04-30 directive):
//   - last_independent_verification within 48h:   bump verified_at = NOW()
//   - last_independent_verification within 7 d:   leave verified_at alone
//   - last_independent_verification > 7 d:        deactivate
//
// The 48h tier is the "we just saw this yesterday — confidence is high"
// window. We bump verified_at so the display stays "verified today"
// without lying about audit trail (the audit trail lives in
// last_independent_verification, which we don't bump).
//
// The 7d ceiling is the safety net. Anything we haven't independently
// confirmed in a week is a liability — better to deactivate than to
// keep showing a possibly-discontinued deal.
//
// Backwards compat
// ----------------
// If sql/migrations/2026-04-30-deal-independent-verification.sql hasn't
// been applied yet, the `last_independent_verification` column won't
// exist. We detect that and short-circuit with a structured skip — no
// crashes, no false bumps, no false deactivations. The scraper's primary
// flow continues to work exactly as before.

const HOURS_48_MS = 48 * 60 * 60 * 1000;
const DAYS_7_MS = 7 * 24 * 60 * 60 * 1000;

export type DailyVerificationSummary = {
  ran_at: string;
  bumped: number;        // verified_at moved forward to NOW (within-48h tier)
  held: number;          // left alone (48h-7d tier)
  deactivated: number;   // is_active = false (>7d tier)
  scanned: number;
  errors: string[];
  skipped?: boolean;
  reason?: string;
};

type ActiveDealRow = {
  id: string;
  listing_slug: string;
  verified_at: string | null;
  last_independent_verification: string | null;
  status_reason: string | null;
};

async function supaSelect(
  supabaseUrl: string,
  serviceKey: string,
  path: string
): Promise<unknown> {
  const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`select_${res.status}: ${await res.text().catch(() => "")}`);
  }
  return res.json();
}

async function supaPatch(
  supabaseUrl: string,
  serviceKey: string,
  path: string,
  body: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`patch_${res.status}: ${await res.text().catch(() => "")}`);
  }
}

export async function runDailyVerificationSweep({
  supabaseUrl,
  serviceKey,
  now = Date.now(),
}: {
  supabaseUrl: string;
  serviceKey: string;
  now?: number;
}): Promise<DailyVerificationSummary> {
  const ranAt = new Date(now).toISOString();
  const summary: DailyVerificationSummary = {
    ran_at: ranAt,
    bumped: 0,
    held: 0,
    deactivated: 0,
    scanned: 0,
    errors: [],
  };

  // Step 1: pull active green deals with the columns we need.
  let rows: ActiveDealRow[];
  try {
    const data = (await supaSelect(
      supabaseUrl,
      serviceKey,
      "/deals?select=id,listing_slug,verified_at,last_independent_verification,status_reason&is_active=eq.true&project_tag=eq.green&limit=500"
    )) as ActiveDealRow[];
    rows = Array.isArray(data) ? data : [];
  } catch (err) {
    const msg = String((err as Error).message);
    // PostgREST returns 400 + "column ... does not exist" when the column
    // hasn't been added yet (migration not applied). Degrade gracefully.
    if (/last_independent_verification/i.test(msg) && /(does not exist|undefined column|400|42703)/i.test(msg)) {
      summary.skipped = true;
      summary.reason = "last_independent_verification column not present (migration pending)";
      return summary;
    }
    summary.errors.push(`select: ${msg}`);
    return summary;
  }

  summary.scanned = rows.length;

  // Step 2: classify each row and apply the appropriate update.
  for (const r of rows) {
    // The scraper just ran and stamped verified_at on every deal it saw.
    // If verified_at is within the last 6 hours, the scraper touched this
    // deal in the current run — leave it alone, the sweep is for ones it
    // didn't touch.
    const verifiedTs = r.verified_at ? new Date(r.verified_at).getTime() : 0;
    const recentlyScraped = Number.isFinite(verifiedTs) && now - verifiedTs <= 6 * 60 * 60 * 1000;
    if (recentlyScraped) continue;

    // Anchor for trust tier is last_independent_verification — the moment
    // the scraper last actually confirmed the deal at the dispensary's
    // direct source. NULL means it's never been independently verified
    // (legacy import); treat that the same as "very old".
    const indepTs = r.last_independent_verification
      ? new Date(r.last_independent_verification).getTime()
      : 0;
    const indepAge = Number.isFinite(indepTs) && indepTs > 0 ? now - indepTs : Number.POSITIVE_INFINITY;

    if (indepAge <= HOURS_48_MS) {
      // Within 48h tier — bump verified_at, keep audit trail in
      // last_independent_verification (don't touch).
      try {
        await supaPatch(supabaseUrl, serviceKey, `/deals?id=eq.${r.id}`, {
          verified_at: ranAt,
          updated_at: ranAt,
          status_reason: "holding_pattern_within_48h",
        });
        summary.bumped += 1;
      } catch (err) {
        summary.errors.push(`bump:${r.id}: ${(err as Error).message}`);
      }
    } else if (indepAge <= DAYS_7_MS) {
      // 48h–7d tier — hold the line, age honestly.
      summary.held += 1;
    } else {
      // > 7d — can't independently confirm, deactivate.
      try {
        await supaPatch(supabaseUrl, serviceKey, `/deals?id=eq.${r.id}`, {
          is_active: false,
          status_reason: "aged_out_no_independent_verification",
          updated_at: ranAt,
        });
        summary.deactivated += 1;
      } catch (err) {
        summary.errors.push(`deactivate:${r.id}: ${(err as Error).message}`);
      }
    }
  }

  return summary;
}
