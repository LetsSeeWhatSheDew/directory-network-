// app/api/stripe/webhook/route.ts
// Stripe webhook handler. Verifies signature, then fans out to a small
// switch that (for now) logs most events and updates subscription
// status on pro_users. The Phase 1 goal is: endpoint exists, signature
// check works, Stripe stops retrying. Phase 2 fills in the pro_users
// upsert once the migration in sql/migrations/2026-04-18-pro-users.sql
// has been applied.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // Stripe SDK requires Node runtime

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    // 503 means Stripe will retry — safer than 200-ing into a black hole
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // TODO Phase 2: upsert into pro_users (migration:
        // sql/migrations/2026-04-18-pro-users.sql). Until that's applied,
        // we just log so the webhook ACKs successfully and Stripe stops
        // retrying.
        console.log(
          "[stripe/webhook] checkout.session.completed:",
          session.customer_email
        );
        break;
      }
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status =
          sub.status === "active"
            ? "active"
            : sub.status === "past_due"
              ? "past_due"
              : "canceled";
        const supabase = getSupabase();
        if (supabase) {
          const { error } = await supabase
            .from("pro_users")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", sub.id);
          if (error) {
            // pro_users table may not exist yet — Phase 2. Swallow so
            // Stripe sees a 200 and doesn't retry forever.
            console.warn(
              "[stripe/webhook] pro_users update skipped:",
              error.message
            );
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        console.log("[stripe/webhook] invoice.payment_failed:", event.data.object);
        break;
      }
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
