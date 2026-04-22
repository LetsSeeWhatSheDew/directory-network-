import { Metadata } from "next";
import Link from "next/link";
import { SubmissionsTable, type Submission } from "./SubmissionsTable";

export const metadata: Metadata = {
  title: "Submissions | PuffPrice Admin",
  robots: "noindex, nofollow",
};

export const dynamic = "force-dynamic";

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}

async function fetchPending(): Promise<Submission[]> {
  const { url, key } = supabase();
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/deal_submissions_pending?select=*&order=submitted_at.desc`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      console.error("Failed to fetch submissions:", await res.text());
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error fetching submissions:", err);
    return [];
  }
}

export default async function SubmissionsPage() {
  const pending = await fetchPending();

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Deal submissions</h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "0.9rem" }}>
            {pending.length} pending review · Target SLA: p95 ≤ 24h
          </p>
        </div>
        <Link href="/admin" style={{ fontSize: "0.875rem", color: "#16a34a" }}>
          ← Back to admin
        </Link>
      </div>

      {pending.length === 0 ? (
        <div
          style={{
            border: "1px dashed #d1d5db",
            borderRadius: 12,
            padding: "48px 24px",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          No pending submissions — fresh slate.
        </div>
      ) : (
        <SubmissionsTable rows={pending} />
      )}
    </main>
  );
}
