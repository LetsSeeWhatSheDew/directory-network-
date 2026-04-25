// app/api/cron/mark-stale-deals/route.ts
// Daily Vercel Cron handler. Spec: docs/handoffs/stale-deal-job-spec-20260421.md
// Triggered by vercel.json crons entry at 04:00 UTC (23:00 CT previous day).
//
// What it does:
//   1. Flip active deals with expires_at < NOW() to inactive + status_reason='expired'
//   2. Flip active deals with no expires_at and created_at older than 30 days
//      to inactive + status_reason='stale'
//   3. Attempt to refresh deal_rankings materialized view (no-op if missing)
//   4. If combined (expired + stale) > 10, queue an email alert to Matthew
//   5. Return JSON summary
//
// Schema dependency: the `status_reason` column and 2 indexes from
// sql/migrations/2026-04-21-deal-staleness.sql MUST be applied to Supabase
// before this endpoint will do anything. If the migration is not yet live,
// the first UPDATE errors with "column status_reason does not exist" — we
// catch that, skip quietly, return {skipped: true, reason: ...}.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkCronAuth } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const STALE_ALERT_THRESHOLD = 10;
const STALE_AGE_DAYS = 30;
const ALERT_RECIPIENT =
  process.env.STALE_ALERT_RECIPIENT || "matthew@jacarandapeoria.com";

type Summary = {
  expired_count: number;
  stale_count: number;
  active_remaining: number;
  ran_at: string;
  duration_ms: number;
  rankings_refreshed: boolean;
  alert_sent: boolean;
  errors: string[];
  skipped?: boolean;
  reason?: string;
};

function makeAdminClient() {
  // Service role bypasses RLS — required for UPDATE on deals table.
  // If key missing, return null so the handler can short-circuit.
  if (!SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function countActiveDeals(client: ReturnType<typeof makeAdminClient>): Promise<number> {
  if (!client) return 0;
  const { count, error } = await client
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("project_tag", "green");
  if (error) return 0;
  return count ?? 0;
}

async function markExpired(client: NonNullable<ReturnType<typeof makeAdminClient>>): Promise<{ count: number; error: string | null }> {
  const nowIso = new Date().toISOString();
  // Fetch id list of affected rows for accurate counting (PostgREST
  // doesn't return a usable count on update without select representation).
  const { data: toExpire, error: selErr } = await client
    .from("deals")
    .select("id")
    .eq("is_active", true)
    .eq("project_tag", "green")
    .not("expires_at", "is", null)
    .lt("expires_at", nowIso);
  if (selErr) return { count: 0, error: selErr.message };
  const ids = (toExpire ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) return { count: 0, error: null };
  const { error: updErr } = await client
    .from("deals")
    .update({
      is_active: false,
      status_reason: "expired",
      verified_at: nowIso,
      updated_at: nowIso,
    })
    .in("id", ids);
  if (updErr) return { count: 0, error: updErr.message };
  return { count: ids.length, error: null };
}

async function markStale(client: NonNullable<ReturnType<typeof makeAdminClient>>): Promise<{ count: number; error: string | null }> {
  const now = new Date();
  const thresholdIso = new Date(now.getTime() - STALE_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = now.toISOString();
  const { data: toStale, error: selErr } = await client
    .from("deals")
    .select("id")
    .eq("is_active", true)
    .eq("project_tag", "green")
    .is("expires_at", null)
    .lt("created_at", thresholdIso);
  if (selErr) return { count: 0, error: selErr.message };
  const ids = (toStale ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) return { count: 0, error: null };
  const { error: updErr } = await client
    .from("deals")
    .update({
      is_active: false,
      status_reason: "stale",
      verified_at: nowIso,
      updated_at: nowIso,
    })
    .in("id", ids);
  if (updErr) return { count: 0, error: updErr.message };
  return { count: ids.length, error: null };
}

async function refreshRankings(client: NonNullable<ReturnType<typeof makeAdminClient>>): Promise<boolean> {
  // REFRESH MATERIALIZED VIEW can't run via Supabase REST directly.
  // Try calling a pg function `refresh_deal_rankings()` if Cowork has
  // shipped one; otherwise swallow the error. The view will continue
  // to serve the last snapshot until the next successful refresh.
  try {
    const { error } = await client.rpc("refresh_deal_rankings");
    return !error;
  } catch {
    return false;
  }
}

async function sendStaleAlert(summary: Summary): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "PuffPrice <hi@puffprice.com>",
      to: ALERT_RECIPIENT,
      subject: `[PuffPrice] Stale-deal job marked ${summary.expired_count + summary.stale_count} deals`,
      html: `<p>PuffPrice stale-deal job marked <strong>${summary.expired_count + summary.stale_count}</strong> deals stale or expired today.</p>
        <ul>
          <li>Expired: ${summary.expired_count}</li>
          <li>Stale: ${summary.stale_count}</li>
          <li>Active remaining: ${summary.active_remaining}</li>
        </ul>
        <p>This may indicate a scraper regression or mass expiration event. Review at /admin/deals.</p>
        <p><em>ran_at: ${summary.ran_at}</em></p>`,
    });
    return true;
  } catch (err) {
    console.warn("[mark-stale-deals] alert send failed", err);
    return false;
  }
}

async function handle(req: NextRequest): Promise<NextResponse> {
  const auth = checkCronAuth(req, "mark-stale-deals");
  if (!auth.ok) return auth.response;

  const started = Date.now();
  const ranAt = new Date().toISOString();
  const client = makeAdminClient();
  if (!client) {
    return NextResponse.json({
      skipped: true,
      reason: "SUPABASE_SERVICE_ROLE_KEY not configured",
      ran_at: ranAt,
    });
  }

  const errors: string[] = [];

  const expiredResult = await markExpired(client);
  if (expiredResult.error) {
    // Likely cause: status_reason column not yet present. Degrade.
    const msg = expiredResult.error;
    const schemaMissing = /status_reason/i.test(msg) || /column .* does not exist/i.test(msg);
    if (schemaMissing) {
      return NextResponse.json({
        skipped: true,
        reason: "schema not yet applied (status_reason column missing)",
        ran_at: ranAt,
      });
    }
    errors.push(`expired: ${msg}`);
  }

  const staleResult = await markStale(client);
  if (staleResult.error) errors.push(`stale: ${staleResult.error}`);

  const rankingsRefreshed = await refreshRankings(client);
  const activeRemaining = await countActiveDeals(client);

  const summary: Summary = {
    expired_count: expiredResult.count,
    stale_count: staleResult.count,
    active_remaining: activeRemaining,
    ran_at: ranAt,
    duration_ms: Date.now() - started,
    rankings_refreshed: rankingsRefreshed,
    alert_sent: false,
    errors,
  };

  if (expiredResult.count + staleResult.count > STALE_ALERT_THRESHOLD) {
    summary.alert_sent = await sendStaleAlert(summary);
  }

  if (activeRemaining === 0) {
    errors.push("active_remaining=0 — possible regression, investigate");
  }

  console.log("[mark-stale-deals]", JSON.stringify(summary));
  return NextResponse.json(summary);
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
