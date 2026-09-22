import { Metadata } from "next";
import Link from "next/link";
import ReviewQueue, { type PendingReview } from "./ReviewQueue";

export const metadata: Metadata = { title: "Admin · Reviews", robots: "noindex, nofollow" };
export const dynamic = "force-dynamic";

async function fetchPending(): Promise<{ rows: PendingReview[]; ready: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { rows: [], ready: false };
  try {
    const res = await fetch(
      `${url}/rest/v1/listing_reviews?select=id,listing_slug,rating,body,display_name,created_at&project_tag=eq.green&status=eq.pending&order=created_at.asc&limit=200`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }
    );
    if (!res.ok) return { rows: [], ready: false };
    const data = await res.json();
    return { rows: Array.isArray(data) ? data : [], ready: true };
  } catch {
    return { rows: [], ready: false };
  }
}

export default async function AdminReviewsPage() {
  const { rows, ready } = await fetchPending();
  return (
    <main className="pp-container-detail" style={{ padding: "32px 16px" }}>
      <Link href="/admin" style={{ fontSize: ".85rem" }}>← Admin</Link>
      <h1 style={{ margin: "12px 0 4px" }}>Reviews waiting for approval</h1>
      <p style={{ color: "var(--pp-muted)", marginBottom: 20 }}>
        Approve real experiences. Reject spam, staff reviews, promo codes, or anything abusive. Don&apos;t edit text.
      </p>
      {ready ? (
        <ReviewQueue initial={rows} />
      ) : (
        <p>The reviews table isn&apos;t set up yet — run <code>sql/migrations/2026-09-22-listing-reviews.sql</code> in Supabase.</p>
      )}
    </main>
  );
}
