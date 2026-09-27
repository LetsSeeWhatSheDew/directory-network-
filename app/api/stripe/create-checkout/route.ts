// app/api/stripe/create-checkout/route.ts
// Creates a Stripe Checkout session for PuffPrice Pro ($0.99/mo).
// The old "featured" dispensary tier was retired — dispensary listings
// are free, so nothing on the dispensary side needs a checkout session.
// Uses Stripe REST directly (no SDK dependency).

import { NextRequest, NextResponse } from "next/server";
import { rateLimited, clientKey } from "@/lib/rateLimit";
import { readJsonBody, crossSiteRequest, normalizeEmail } from "@/lib/validation";

type Tier = "pro_consumer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.puffprice.com";
const STRIPE_API = "https://api.stripe.com/v1";

function priceIdForTier(tier: Tier): string | undefined {
  if (tier === "pro_consumer") return process.env.STRIPE_PRO_PRICE_ID;
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    if (crossSiteRequest(req.headers)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Each call creates a Stripe Checkout session; cap it per client.
    if (rateLimited(`checkout:${clientKey(req.headers)}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: "Too many tries. Give it a few minutes." }, { status: 429 });
    }
    const parsed = await readJsonBody(req, 2048);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    const body = parsed.body;
    const tier = body.tier as Tier;
    const email = normalizeEmail(body.email);

    if (tier !== "pro_consumer") {
      return NextResponse.json({ error: "Invalid tier." }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
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
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[stripe/create-checkout] stripe error:", data?.error?.type, data?.error?.code);
      return NextResponse.json(
        { error: "Checkout isn't available right now. Try again in a minute." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.url, id: data.id });
  } catch (e) {
    console.error("[stripe/create-checkout] unexpected error:", e);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
