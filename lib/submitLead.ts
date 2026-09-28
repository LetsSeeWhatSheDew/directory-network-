// Called from a client component (components/DirectoryLandingPage.tsx), so
// it uses its own anon-key client instead of lib/supabase (server-only,
// which prefers the service-role key). directory_leads allows anon INSERT.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _anon: SupabaseClient | null = null;
function anonClient(): SupabaseClient {
  if (!_anon) {
    _anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return _anon;
}

export interface LeadPayload {
  business_name: string;
  email: string;
  phone?: string;
  tier_interest: string;
  niche: string;
  region: string;
  source: string;
}

export async function submitLead(payload: LeadPayload): Promise<void> {
  const { error } = await anonClient().from("directory_leads").insert({
    business_name: payload.business_name,
    email: payload.email,
    phone: payload.phone ?? null,
    tier_interest: payload.tier_interest,
    niche: payload.niche,
    region: payload.region,
    source: payload.source,
    status: "new",
  });

  if (error) throw new Error(error.message);
}
