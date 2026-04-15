// app/api/stripe/create-checkout/route.ts
// Creates a Stripe Checkout session and returns the URL for redirect.
// Uses Stripe REST directly (no SDK dependency) so nothing new to install.

import { NextRequest, NextResponse } from "next/server";

type Tier = "featured" | "pro_consumer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://puffprice.com";
const STRIPE_API = "https://api.stripe.com/v1";

function priceIdForTier(tier: Tier): string | undefined {
  if (tier === "featured") return process.env.STRIPE_FEATURED_PRICE_ID;
  if (tier === "pro_consumer") return process.env.STRIPE_PRO_PRICE_ID;
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tier = body.tier as Tier;
    const email = (body.email as string | undefined)?.trim();
    const slug = (body.slug as string | undefined)?.trim();

    if (!tier || !["featured", "pro_consumer"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier." }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email required." }, { status: 400 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        { error: "Stripe is not configured yet. Contact us at matthew@jacarandapeoria.com." },
        { status: 503 }
      );
    }

    const priceId = priceIdForTier(tier);
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price for ${tier} is not configured.` },
        { status: 503 }
      );
    }

    // Build the form-encoded body Stripe expects
    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("success_url", `${SITE_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`);
    params.set("cancel_url", `${SITE_URL}/upgrade`);
    params.set("customer_email", email);
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
    params.set("allow_promotion_codes", "true");
    params.set("billing_address_collection", "auto");
    // Metadata so the webhook (when we add it) knows what to provision
    params.set("metadata[tier]", tier);
    if (slug) params.set("metadata[listing_slug]", slug);
    params.set("subscription_data[metadata][tier]", tier);
    if (slug) params.set("subscription_data[metadata][listing_slug]", slug);

    const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[stripe/create-checkout] stripe error:", data);
      return NextResponse.json(
        { error: data?.error?.message || "Stripe checkout failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.url, id: data.id });
  } catch (e) {
    console.error("[stripe/create-checkout] unexpected error:", e);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
