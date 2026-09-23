// app/deals/submit/page.tsx
// Dispensary-facing deal submission form. Public, no account required.
// Spec: docs/handoffs/deal-submission-ui-spec-20260421.md
// Writes: app/api/deals/submit/route.ts → deal_submissions table.
//
// The underlying table (sql/migrations/2026-04-21-deal-submissions.sql)
// is NOT YET APPLIED — until Matthew runs the migration, the API route
// returns 503 and the form surfaces a friendly "coming soon" notice.

import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import SubmitForm from "./SubmitForm";
import { brand } from "../../../lib/brand";

export const metadata: Metadata = {
  title: "Submit a dispensary deal — PuffPrice",
  description:
    "Own an Illinois dispensary? Submit a deal to PuffPrice in under 2 minutes. Free forever, no account required.",
  alternates: { canonical: `${brand.url}/deals/submit` },
  openGraph: {
    title: "Submit a dispensary deal — PuffPrice",
    description:
      "Own an Illinois dispensary? Submit a deal to PuffPrice in under 2 minutes. Free forever, no account required.",
    url: `${brand.url}/deals/submit`,
    siteName: brand.name,
    type: "website",
    images: [{ url: `${brand.url}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit a dispensary deal — PuffPrice",
    description:
      "Own an Illinois dispensary? Submit a deal to PuffPrice in under 2 minutes. Free forever, no account required.",
    images: [`${brand.url}/og-image.png`],
  },
};

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

export const revalidate = 3600;

type ListingOpt = { slug: string; name: string; city: string };

async function getListingOptions(): Promise<ListingOpt[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?select=slug,name,city&state=eq.IL&project_tag=eq.green&is_active=eq.true&order=name.asc&limit=300`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    return Array.isArray(rows)
      ? rows
          .filter((r: ListingOpt) => r?.slug && r?.name)
          .map((r: ListingOpt) => ({
            slug: r.slug,
            name: r.name,
            city: r.city || "",
          }))
      : [];
  } catch {
    return [];
  }
}

export default async function SubmitDealPage() {
  const listings = await getListingOptions();

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:var(--font-body),system-ui,sans-serif;background:var(--pp-paper);color:var(--pp-body);min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:var(--pp-surface);border-bottom:1px solid var(--pp-border)}
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-text{font-size:1.1rem;font-weight:700;color:var(--pp-ink)}
        .logo-text span{color:var(--pp-signal)}
        .back{font-size:.82rem;color:var(--pp-muted);text-decoration:none;font-family:system-ui,sans-serif}
        .wrap{max-width:680px;margin:0 auto;padding:44px 24px 72px}
        .eyebrow{font-family:system-ui,sans-serif;font-size:.72rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--pp-signal);margin-bottom:12px}
        h1{font-size:clamp(1.9rem,5vw,2.6rem);font-weight:700;letter-spacing:-.04em;line-height:1.08;margin-bottom:10px}
        .lede{font-family:system-ui,sans-serif;font-size:1.02rem;color:var(--pp-body);line-height:1.55;max-width:56ch;margin-bottom:8px}
        .trust{font-family:system-ui,sans-serif;font-size:.85rem;color:var(--pp-muted);max-width:56ch;margin-bottom:28px;line-height:1.5}
        .trust strong{color:var(--pp-ink)}
      `}</style>

      <Nav variant="light" />

      <main className="wrap">
        <div className="eyebrow">For dispensaries</div>
        <h1>Got a deal? Post it.</h1>
        <p className="lede">
          Illinois buyers are searching PuffPrice right now. Submit a deal
          in under two minutes — free forever, no account required.
        </p>
        <p className="trust">
          <strong>How this works:</strong> we manually verify deals before
          publishing. We&apos;ll email you if there&apos;s anything we need
          to double-check. Nothing charges, nothing sells your info.
        </p>

        <SubmitForm listings={listings} />
      </main>
      <Footer />
    </>
  );
}
