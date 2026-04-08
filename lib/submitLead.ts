import { supabase } from "@/lib/supabase";

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
  const { error } = await supabase.from("directory_leads").insert({
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
