import { Metadata } from "next";
import Link from "next/link";
import { CollapsibleSection, StatusPill } from "./components";

export const metadata: Metadata = {
  title: "Admin | Project Green",
  robots: "noindex, nofollow",
};

/* ─── Types ─── */

type Lead = {
  id: string;
  created_at: string;
  listing_id?: string;
  project_tag?: string;
  listing_name?: string;
  name: string;
  email: string;
  company?: string | null;
  message?: string | null;
  status?: string;
  source?: string;
};

type Listing = {
  id: string;
  created_at?: string;
  project_tag?: string;
  listing_name?: string;
  name?: string;
  listing_title?: string;
  city?: string | null;
  state?: string | null;
  short_description?: string | null;
  is_featured?: boolean;
  plan_tier?: string | null;
  claimed?: boolean;
  website?: string | null;
  phone?: string | null;
};

/* ─── Data fetching ─── */

function supabase() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY;
  return { url, key };
}

async function fetchTable<T>(table: string): Promise<T[]> {
  const { url, key } = supabase();
  if (!url || !key) return [];

  try {
    const res = await fetch(
      `${url}/rest/v1/${table}?select=*&order=created_at.desc`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        next: { revalidate: 30 },
      }
    );
    if (!res.ok) {
      console.error(`Failed to fetch ${table}:`, await res.text());
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`Error fetching ${table}:`, err);
    return [];
  }
}

/* ─── Helpers ─── */

function listingName(l: Listing) {
  return l.listing_name || l.name || l.listing_title || "Unnamed";
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function daysAgo(dateStr: string) {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function cityFrom(lead: Lead): string {
  const src = lead.source || lead.company || "";
  const m = src.match(/city-page-(.+)/);
  if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1);
  return lead.company || "—";
}

/* ─── Constants ─── */

const PAGES_LIVE = 56; // counted from app directory
const LAST_DEPLOY = new Date().toISOString(); // approximation for "today's focus"

/* ─── Page ─── */

export default async function AdminDashboard() {
  const [leads, listings] = await Promise.all([
    fetchTable<Lead>("leads"),
    fetchTable<Listing>("master_listings"),
  ]);

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const newLeadsThisWeek = leads.filter(
    (l) => new Date(l.created_at) >= weekAgo
  );
  const unreadLeads = leads.filter(
    (l) => !l.status || l.status === "new"
  );
  const listingsMissingDesc = listings.filter(
    (l) => !l.short_description || l.short_description.trim() === ""
  );

  /* ─── "Today's Focus" items ─── */
  const focusItems: { label: string; detail: string; severity: "high" | "med" | "low" }[] = [];

  if (unreadLeads.length > 0) {
    focusItems.push({
      label: `${unreadLeads.length} unread lead${unreadLeads.length > 1 ? "s" : ""}`,
      detail: unreadLeads
        .slice(0, 3)
        .map((l) => l.name)
        .join(", ") + (unreadLeads.length > 3 ? ` + ${unreadLeads.length - 3} more` : ""),
      severity: "high",
    });
  }

  if (listingsMissingDesc.length > 0) {
    focusItems.push({
      label: `${listingsMissingDesc.length} listing${listingsMissingDesc.length > 1 ? "s" : ""} missing descriptions`,
      detail: listingsMissingDesc
        .slice(0, 3)
        .map((l) => listingName(l))
        .join(", "),
      severity: "med",
    });
  }

  const daysSinceDeploy = daysAgo(LAST_DEPLOY);
  if (daysSinceDeploy > 3) {
    focusItems.push({
      label: `${daysSinceDeploy} days since last deploy`,
      detail: "Consider pushing recent changes",
      severity: "low",
    });
  }

  const SEVERITY_DOT: Record<string, string> = {
    high: "bg-red-400",
    med: "bg-amber-400",
    low: "bg-[#8a9490]",
  };

  return (
    <div className="min-h-screen bg-[#050f09] text-[#f0ede8]">
      {/* ── Header ── */}
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <div>
            <Link
              href="/"
              className="text-[11px] uppercase tracking-widest text-[#8a9490] transition-colors hover:text-[#50c878]"
            >
              &larr; Site
            </Link>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">
              Operator Dashboard
            </h1>
          </div>
          <div className="flex items-baseline gap-1.5 text-sm">
            <span className="text-[#8a9490]">Project</span>
            <span className="font-semibold text-[#50c878]">Green</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-5 py-10 md:px-8">
        {/* ── 1. Stat cards ── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="New Leads This Week"
            value={newLeadsThisWeek.length}
            accent={newLeadsThisWeek.length > 0}
          />
          <StatCard label="Total Listings" value={listings.length} />
          <StatCard label="Pages Live" value={PAGES_LIVE} />
          <StatCard label="MRR" value="$0" sub="Pre-revenue" />
        </div>

        {/* ── 2. Today's Focus ── */}
        <div className="rounded-2xl border border-white/5 bg-[#0a1a12] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#8a9490]">
            Today&apos;s Focus
          </h2>

          {focusItems.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#50c878]">
              All clear — nothing needs your attention right now.
            </p>
          ) : (
            <div className="space-y-3">
              {focusItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl bg-white/[0.02] px-4 py-3"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${SEVERITY_DOT[item.severity]}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-[#f0ede8]">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-[#8a9490]">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 3. Collapsible sections ── */}
        <div className="space-y-4">
          {/* Analytics */}
          <CollapsibleSection title="Analytics">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[#8a9490]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <p className="text-sm text-[#8a9490]">
                Analytics integration coming soon.
              </p>
              <p className="mt-1 text-xs text-[#8a9490]/60">
                Vercel Analytics + Supabase event tracking
              </p>
            </div>
          </CollapsibleSection>

          {/* Listings Manager */}
          <CollapsibleSection
            title="Listings Manager"
            count={listings.length}
            defaultOpen={false}
          >
            {listings.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#8a9490]">
                No listings in the database yet.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[11px] uppercase tracking-widest text-[#8a9490]">
                      <th className="pb-3 pr-4 text-left font-medium">Name</th>
                      <th className="pb-3 pr-4 text-left font-medium">City</th>
                      <th className="pb-3 pr-4 text-left font-medium">Tier</th>
                      <th className="pb-3 pr-4 text-left font-medium">Status</th>
                      <th className="pb-3 pr-4 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((l) => {
                      const hasDesc =
                        l.short_description &&
                        l.short_description.trim() !== "";
                      const isClaimed =
                        l.claimed || (l.plan_tier && l.plan_tier !== "free");
                      return (
                        <tr
                          key={l.id}
                          className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="py-3 pr-4 font-medium">
                            {listingName(l)}
                            {l.is_featured && (
                              <span className="ml-2 text-[10px] text-[#50c878]">
                                ★
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-[#8a9490]">
                            {l.city
                              ? `${l.city}${l.state ? `, ${l.state}` : ""}`
                              : "—"}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-[#8a9490]">
                              {l.plan_tier || "free"}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isClaimed
                                  ? "bg-[#50c878]/15 text-[#50c878]"
                                  : "bg-white/5 text-[#8a9490]"
                              }`}
                            >
                              {isClaimed ? "Claimed" : "Unclaimed"}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {hasDesc ? (
                              <span className="text-xs text-[#8a9490]">
                                {l.short_description!.slice(0, 60)}
                                {l.short_description!.length > 60 ? "…" : ""}
                              </span>
                            ) : (
                              <span className="text-xs text-red-400/70">
                                Missing
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CollapsibleSection>

          {/* Leads Pipeline */}
          <CollapsibleSection
            title="Leads Pipeline"
            count={leads.length}
            defaultOpen={leads.length > 0}
          >
            {leads.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#8a9490]">
                No leads yet. They&apos;ll show up here when someone submits a
                form.
              </p>
            ) : (
              <div className="space-y-6">
                {/* Pipeline summary */}
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      ["new", leads.filter((l) => !l.status || l.status === "new").length],
                      ["contacted", leads.filter((l) => l.status === "contacted").length],
                      ["converted", leads.filter((l) => l.status === "converted").length],
                      ["closed", leads.filter((l) => l.status === "closed").length],
                    ] as const
                  ).map(([label, count]) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2"
                    >
                      <span className="text-xs capitalize text-[#8a9490]">
                        {label}
                      </span>
                      <span className="text-sm font-semibold text-[#f0ede8]">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Leads table */}
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-[11px] uppercase tracking-widest text-[#8a9490]">
                        <th className="pb-3 pr-4 text-left font-medium">
                          Date
                        </th>
                        <th className="pb-3 pr-4 text-left font-medium">
                          Name
                        </th>
                        <th className="pb-3 pr-4 text-left font-medium">
                          Email
                        </th>
                        <th className="pb-3 pr-4 text-left font-medium">
                          Business
                        </th>
                        <th className="pb-3 pr-4 text-left font-medium">
                          City
                        </th>
                        <th className="pb-3 pr-4 text-left font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="py-3 pr-4 text-[#8a9490] whitespace-nowrap">
                            {fmtShort(lead.created_at)}
                          </td>
                          <td className="py-3 pr-4 font-medium">
                            {lead.name}
                          </td>
                          <td className="py-3 pr-4">
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-[#8a9490] transition-colors hover:text-[#50c878]"
                            >
                              {lead.email}
                            </a>
                          </td>
                          <td className="py-3 pr-4 text-[#8a9490]">
                            {lead.listing_name || "—"}
                          </td>
                          <td className="py-3 pr-4 text-[#8a9490]">
                            {cityFrom(lead)}
                          </td>
                          <td className="py-3 pr-4">
                            <StatusPill
                              leadId={lead.id}
                              initialStatus={lead.status || "new"}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CollapsibleSection>
        </div>
      </main>
    </div>
  );
}

/* ─── Stat Card (server) ─── */

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a1a12] p-5">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[#8a9490]">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-bold ${accent ? "text-[#50c878]" : "text-[#f0ede8]"}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] text-[#8a9490]">{sub}</p>}
    </div>
  );
}
