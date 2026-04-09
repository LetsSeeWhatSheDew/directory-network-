import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin Dashboard | Project Green",
  robots: "noindex, nofollow",
};

type Lead = {
  id: string;
  created_at: string;
  listing_id: string;
  project_tag: string;
  listing_name: string;
  name: string;
  email: string;
  company: string | null;
  message: string | null;
  status?: string;
};

async function fetchLeads(): Promise<Lead[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials");
    return [];
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/leads?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch leads:", response.statusText);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusColor(status: string | undefined) {
  const normalizedStatus = (status || "new").toLowerCase();
  switch (normalizedStatus) {
    case "contacted":
      return "bg-yellow-500/20 text-yellow-400";
    case "converted":
      return "bg-blue-500/20 text-blue-400";
    default:
      return "bg-[#50c878]/20 text-[#50c878]";
  }
}

function extractCityFromSource(company: string | null): string | null {
  if (!company) return null;
  const match = company.match(/city-page-(.+)/);
  return match ? match[1] : null;
}

function getLeadCity(lead: Lead): string {
  const cityFromSource = extractCityFromSource(lead.company);
  if (cityFromSource) {
    return cityFromSource.charAt(0).toUpperCase() + cityFromSource.slice(1);
  }
  return "Unknown";
}

export default async function AdminDashboard() {
  const leads = await fetchLeads();

  const totalLeads = leads.length;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newThisWeek = leads.filter((lead) => {
    const leadDate = new Date(lead.created_at);
    return leadDate >= sevenDaysAgo;
  }).length;

  // Group leads by city
  const leadsByCity = leads.reduce(
    (acc, lead) => {
      const city = getLeadCity(lead);
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const sortedCities = Object.entries(leadsByCity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const maxCityCount = sortedCities.length > 0 ? sortedCities[0][1] : 1;

  return (
    <div className="min-h-screen bg-[#050f09] text-[#f0ede8]">
      {/* Header */}
      <header className="border-b border-[#50c878]/10 bg-[#050f09]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="mb-3 inline-block text-xs text-[#8a9490] hover:text-[#50c878] transition-colors uppercase tracking-widest"
              >
                &larr; Back to site
              </Link>
              <h1 className="text-2xl font-semibold tracking-tight text-[#f0ede8]">
                Operator Dashboard
              </h1>
              <p className="mt-1 text-sm text-[#8a9490]">Lead pipeline &amp; analytics</p>
            </div>
            <div className="flex items-baseline gap-1.5 text-sm">
              <span className="font-normal text-[#8a9490]">Project</span>
              <span className="font-semibold text-[#50c878]">Green</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Stats Row */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Total Leads */}
          <div className="rounded-2xl border border-[#50c878]/20 bg-[#0a1f14] p-6">
            <p className="text-sm font-medium text-[#8a9490]">Total Leads</p>
            <p className="mt-3 text-3xl font-bold text-[#50c878]">
              {totalLeads}
            </p>
          </div>

          {/* New This Week */}
          <div className="rounded-2xl border border-[#50c878]/20 bg-[#0a1f14] p-6">
            <p className="text-sm font-medium text-[#8a9490]">New This Week</p>
            <p className="mt-3 text-3xl font-bold text-[#50c878]">
              {newThisWeek}
            </p>
          </div>

          {/* Conversion Rate */}
          <div className="rounded-2xl border border-[#50c878]/20 bg-[#0a1f14] p-6">
            <p className="text-sm font-medium text-[#8a9490]">
              Conversion Rate
            </p>
            <p className="mt-3 text-3xl font-bold text-[#50c878]">—</p>
            <p className="mt-1 text-xs text-[#8a9490]">Coming soon</p>
          </div>
        </div>

        {/* Leads by City Chart */}
        {sortedCities.length > 0 && (
          <div className="mb-12 rounded-2xl border border-[#50c878]/10 bg-[#0a1f14] p-8">
            <h2 className="mb-8 text-xl font-bold text-[#f0ede8]">
              Leads by City (Top 10)
            </h2>
            <div className="space-y-6">
              {sortedCities.map(([city, count]) => {
                const percentage = (count / maxCityCount) * 100;
                return (
                  <div key={city}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-[#f0ede8]">
                        {city}
                      </span>
                      <span className="text-sm text-[#8a9490]">{count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#050f09]">
                      <div
                        className="h-full rounded-full bg-[#50c878] transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div className="rounded-2xl border border-[#50c878]/10 bg-[#0a1f14] overflow-hidden">
          <div className="overflow-x-auto">
            {leads.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#50c878]/10 bg-[#050f09]">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8a9490]">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8a9490]">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8a9490]">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8a9490]">
                      Business
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8a9490]">
                      City
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8a9490]">
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8a9490]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-[#50c878]/10 bg-[#0a1f14]/50 hover:bg-[#0a1f14] transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-[#f0ede8]">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#f0ede8] font-medium">
                        {lead.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#8a9490]">
                        <a
                          href={`mailto:${lead.email}`}
                          className="hover:text-[#50c878] transition-colors"
                        >
                          {lead.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#f0ede8]">
                        {lead.listing_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#f0ede8]">
                        {getLeadCity(lead)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#8a9490]">
                        {lead.company || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                            lead.status
                          )}`}
                        >
                          {(lead.status || "new").charAt(0).toUpperCase() +
                            (lead.status || "new").slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-[#8a9490]">No leads yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
