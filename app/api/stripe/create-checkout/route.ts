// app/api/stripe/create-checkout/route.ts
// Creates a Stripe Checkout session for PuffPrice Pro ($0.99/mo).
// The old "featured" dispensary tier was retired — dispensary listings
// are free, so nothing on the dispensary side needs a checkout session.
// Uses Stripe REST directly (no SDK dependency).

import { NextRequest, NextResponse } from "next/server";

type Tier = "pro_consumer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.puffprice.com";
const STRIPE_API = "https://api.stripe.com/v1";

function priceIdForTier(tier: Tier): string | undefined {
  if (tier === "pro_consumer") return process.env.STRIPE_PRO_PRICE_ID;
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tier = body.tier as Tier;
    const email = (body.email as string | undefined)?.trim();

    if (tier !== "pro_consumer") {
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

    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("success_url", `${SITE_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${SITE_URL}/upgrade`);
    params.set("customer_email", email);
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
    params.set("allow_promotion_codes", "true");
    params.set("billing_address_collection", "auto");
    params.set("metadata[tier]", tier);
    params.set("subscription_data[metadata][tier]", tier);

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
