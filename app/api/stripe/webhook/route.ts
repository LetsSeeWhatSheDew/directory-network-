// app/api/stripe/webhook/route.ts
// Stripe webhook handler. Verifies signature, skips events we've already
// processed, and keeps `pro_users` in sync with subscription lifecycle.
//
// Order of operations:
//   1. Verify stripe-signature header (reject unverified webhooks → 400)
//   2. Idempotency check against stripe_events_processed (skip duplicates)
//   3. Dispatch by event type:
//        customer.subscription.created  → upsert pro_users
//        customer.subscription.updated  → upsert pro_users (status may flip)
//        customer.subscription.deleted  → mark pro_users.status = canceled
//        checkout.session.completed     → log only (upsert happens on
//                                          subscription.created)
//        invoice.payment_failed         → log only
//   4. Record the event.id in stripe_events_processed so retries are no-ops
//
// Degradation:
//   - If STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY is unset → 503 (Stripe
//     retries until we're configured)
//   - If Supabase tables don't exist yet → warn + 200 (Stripe stops
//     retrying; Matthew applies migrations then replays events)
//
// Depends on tables from these migrations (both NOT YET APPLIED as of
// 2026-04-23 — see docs/ops/stripe-webhook-status-20260423.md):
//   - sql/migrations/2026-04-18-pro-users.sql
//   - sql/migrations/2026-04-23-stripe-events-processed.sql

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // Stripe SDK requires Node runtime

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Let SDK default apiVersion apply. Pinning here couples us to the
  // SDK upgrade cadence without benefit for a single-product account.
  return new Stripe(key);
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// pro_users.status is CHECK-constrained to these three values.
function mapSubscriptionStatus(
  s: Stripe.Subscription.Status
): "active" | "past_due" | "canceled" {
  if (s === "active" || s === "trialing") return "active";
  if (s === "past_due" || s === "unpaid") return "past_due";
  return "canceled";
}

async function fetchCustomerEmail(
  stripe: Stripe,
  customerId: string
): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer.email ?? null;
  } catch (err) {
    console.warn("[stripe/webhook] customer retrieve failed:", err);
    return null;
  }
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
    // 503 so Stripe retries once we're configured
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

  const supabase = getSupabase();

  // Idempotency: if we've already processed this event.id, return 200 and
  // skip the handler. Stripe may retry if our prior response was slow or
  // timed out; we must be safe to re-receive any event.
  if (supabase) {
    const { data: existing, error } = await supabase
      .from("stripe_events_processed")
      .select("id")
      .eq("id", event.id)
      .maybeSingle();
    if (error) {
      // Table doesn't exist yet (pre-migration). Log and continue — not
      // ideal, but the webhook stays functional so Stripe stops retrying.
      console.warn(
        "[stripe/webhook] idempotency lookup skipped:",
        error.message
      );
    } else if (existing) {
      console.log(
        `[stripe/webhook] event ${event.id} already processed, skipping`
      );
      return NextResponse.json({ received: true, idempotent_skip: true });
    }
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = mapSubscriptionStatus(sub.status);
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const email = await fetchCustomerEmail(stripe, customerId);

        if (supabase && email) {
          const { error } = await supabase
            .from("pro_users")
            .upsert(
              {
                stripe_customer_id: customerId,
                stripe_subscription_id: sub.id,
                email,
                status,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "stripe_subscription_id" }
            );
          if (error) {
            // Table may not exist yet — Phase 2 migration pending.
            console.warn(
              "[stripe/webhook] pro_users upsert skipped:",
              error.message
            );
          }
        } else {
          console.log(
            `[stripe/webhook] ${event.type} sub=${sub.id} status=${status} email=${email ?? "(none)"}`
          );
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        if (supabase) {
          const { error } = await supabase
            .from("pro_users")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", sub.id);
          if (error) {
            console.warn(
              "[stripe/webhook] pro_users cancel skipped:",
              error.message
            );
          }
        }
        break;
      }
      case "checkout.session.completed": {
        // customer.subscription.created drives the upsert. Log only so we
        // have a paper trail of which checkout session produced which sub.
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          "[stripe/webhook] checkout.session.completed:",
          session.customer_email
        );
        break;
      }
      case "invoice.payment_failed": {
        console.log(
          "[stripe/webhook] invoice.payment_failed:",
          event.data.object
        );
        break;
      }
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error:", err);
    // Return 500 so Stripe retries. We deliberately have NOT recorded the
    // event in stripe_events_processed yet — retry will re-dispatch.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  // Mark event processed AFTER successful dispatch. Failure here is not
  // fatal — worst case Stripe redelivers and we re-dispatch (all our
  // handlers are upsert/idempotent by design).
  if (supabase) {
    const { error } = await supabase
      .from("stripe_events_processed")
      .insert({ id: event.id, event_type: event.type });
    if (error) {
      console.warn(
        "[stripe/webhook] idempotency record skipped:",
        error.message
      );
    }
  }

  return NextResponse.json({ received: true });
}
