import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy getter so env-less builds don't crash at module-evaluation time.
// Falls back to the project's public URL/anon key when neither pair of
// env names is set, matching the rest of the codebase's defaults.
let _client: SupabaseClient | null = null;

function resolveCreds(): { url: string; key: string } {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    "https://hnbjufmtmrhexmdrfubw.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";
  return { url, key };
}

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const { url, key } = resolveCreds();
    _client = createClient(url, key);
  }
  return _client;
}

// Backwards-compatible export — the proxy defers client creation until
// the first property access, so importing `supabase` no longer triggers
// createClient() at module-evaluation time.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? (value as Function).bind(client) : value;
  },
});
