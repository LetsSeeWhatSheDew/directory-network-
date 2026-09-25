// lib/analyticsDb.ts — server-only Supabase client for first-party
// analytics (the `events` and `deal_clicks` tables). Uses the service-role
// key, which bypasses RLS. Returns null when the key isn't configured so
// every caller can no-op instead of throwing (local builds, previews).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL_ =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";

function serviceKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || null;
}

let _writer: SupabaseClient | null = null;

/** Uncached client for inserts and live admin reads. */
export function analyticsWriter(): SupabaseClient | null {
  const key = serviceKey();
  if (!key) return null;
  if (!_writer) {
    _writer = createClient(URL_, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    });
  }
  return _writer;
}

/** Read client whose requests go through Next's data cache for `seconds`. */
export function analyticsReader(seconds: number): SupabaseClient | null {
  const key = serviceKey();
  if (!key) return null;
  return createClient(URL_, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate: seconds } } as RequestInit),
    },
  });
}

/** First day the site recorded first-party events. */
export const COUNTING_SINCE = "2026-09-25";
export const COUNTING_SINCE_LABEL = "Sep 25, 2026";
