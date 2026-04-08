// project-green/app/l/[id]/page.tsx
import Link from "next/link";
import ClaimForm from "../../components/ClaimForm";

type Listing = {
  id: string;
  project_tag: string;
  listing_type: string | null;
  listing_title: string | null;
  slug: string | null;
  city: string | null;
  state: string | null;
  short_description: string | null;
  long_description: string | null;
  plan_tier: string | null;
  is_featured: boolean | null;
};

type ListingHour = {
  id?: number;
  project_tag: string;
  listing_id: string;
  day_of_week: number; // 0=Mon ... 6=Sun
  open_time: string | null; // "09:00:00"
  close_time: string | null; // "18:00:00"
  is_closed: boolean | null;
};

type ListingAttribute = {
  id?: number;
  project_tag: string;
  listing_id: string;
  attribute: string;
};

type ProductOrService = {
  id?: number;
  project_tag: string;
  listing_id: string;
  category: string | null;
  name: string;
  is_active: boolean | null;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTime(t: string | null) {
  if (!t) return "";
  const parts = t.split(":");
  const hh = Number(parts[0] ?? 0);
  const mm = parts[1] ?? "00";
  const ampm = hh >= 12 ? "PM" : "AM";
  const hour12 = ((hh + 11) % 12) + 1;
  return `${hour12}:${mm} ${ampm}`;
}

function badge(text: string, tone: "soft" | "mint" | "indigo" = "soft") {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border";
  const tones: Record<typeof tone, string> = {
    soft: "bg-white text-zinc-700 border-zinc-200",
    mint: "bg-emerald-50 text-emerald-800 border-emerald-200",
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
  };
  return <span className={`${base} ${tones[tone]}`}>{text}</span>;
}

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const SUPABASE_URL = mustEnv("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = mustEnv("SUPABASE_SERVICE_KEY");
const REST_BASE = `${SUPABASE_URL}/rest/v1`;

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${REST_BASE}${path}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Failed to fetch: ${text}`);
  return (text ? JSON.parse(text) : null) as T;
}

async function getListing(id: string): Promise<Listing | null> {
  const rows = await fetchJson<Listing[]>(
    `/master_listings?id=eq.${encodeURIComponent(id)}&select=*`
  );
  return rows?.[0] ?? null;
}

async function getHours(listingId: string): Promise<ListingHour[]> {
  return fetchJson<ListingHour[]>(
    `/listing_hours?listing_id=eq.${encodeURIComponent(
      listingId
    )}&select=*&order=day_of_week.asc`
  );
}

async function getAttributes(listingId: string): Promise<ListingAttribute[]> {
  return fetchJson<ListingAttribute[]>(
    `/listing_attributes?listing_id=eq.${encodeURIComponent(
      listingId
    )}&select=*&order=attribute.asc`
  );
}

async function getProducts(listingId: string): Promise<ProductOrService[]> {
  return fetchJson<ProductOrService[]>(
    `/products_or_services?listing_id=eq.${encodeURIComponent(
      listingId
    )}&select=*&order=category.asc,name.asc`
  );
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const listing = await getListing(id);
  if (!listing) {
    return (
      <div className="min-h-screen bg-[#faf7ef]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            ← Back to directories
          </Link>
          <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-zinc-500">Listing not found.</p>
            <p className="mt-2 text-zinc-800">
              We couldn’t find <span className="font-mono">{id}</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [hours, attrs, products] = await Promise.all([
    getHours(listing.id),
    getAttributes(listing.id),
    getProducts(listing.id),
  ]);

  const title = listing.listing_title ?? "Untitled listing";
  const location = [listing.city, listing.state].filter(Boolean).join(", ");
  const snapshot =
    listing.short_description ??
    "This listing doesn’t have a short description yet.";

  const plan = (listing.plan_tier ?? "free").toLowerCase();

  return (
    <div className="min-h-screen bg-[#faf7ef] text-zinc-900">
      <div className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-900 text-white text-sm font-semibold shadow-sm">
              DN
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Directory Network</div>
              <div className="text-xs text-zinc-500">{listing.project_tag}</div>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            ← Back to directories
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-semibold tracking-widest text-zinc-500">
                {listing.project_tag.toUpperCase()}
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                {title}
              </h1>
              <p className="mt-2 text-zinc-600">{location || "—"}</p>
              <p className="mt-4 max-w-2xl text-zinc-700 leading-relaxed">
                {snapshot}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {badge(`Plan: ${plan}`, plan === "featured" ? "mint" : "soft")}
              {badge(`Type: ${listing.listing_type ?? "listing"}`, "soft")}
              {listing.is_featured ? badge("Featured", "mint") : null}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold">Hours</h2>
            <div className="mt-4 space-y-2 text-sm">
              {DAY_LABELS.map((d, idx) => {
                const row = hours.find((h) => h.day_of_week === idx);
                const closed = row?.is_closed || !row;
                const label = closed
                  ? "Closed"
                  : `${formatTime(row?.open_time ?? null)} — ${formatTime(
                      row?.close_time ?? null
                    )}`;
                return (
                  <div key={d} className="flex items-center justify-between">
                    <span className="text-zinc-700">{d}</span>
                    <span className={closed ? "text-zinc-400" : "text-zinc-700"}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold">Attributes</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {attrs.length ? (
                attrs.map((a) => (
                  <span
                    key={`${a.listing_id}-${a.attribute}`}
                    className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700"
                  >
                    {a.attribute.replaceAll("_", " ")}
                  </span>
                ))
              ) : (
                <p className="text-sm text-zinc-500">
                  No attributes listed yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold">Products / Services</h2>
            <div className="mt-4 space-y-2 text-sm">
              {products.length ? (
                products.map((p) => (
                  <div
                    key={`${p.listing_id}-${p.category ?? "general"}-${p.name}`}
                    className="flex items-center justify-between"
                  >
                    <span className="text-zinc-700">
                      {(p.category ? `${p.category}: ` : "") + p.name}
                    </span>
                    {p.is_active ? (
                      <span className="text-xs text-emerald-700">Active</span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">
                  No products/services listed yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold">About</h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-700">
              {listing.long_description?.trim()
                ? listing.long_description
                : "This listing doesn't have a long description yet. Once the owner claims and upgrades their profile, we’ll add more detail here."}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold">Claim this listing / Get featured</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Tell us who you are and how you’re connected to{" "}
              <span className="font-medium text-zinc-900">{title}</span>. We’ll
              review and follow up with next steps.
            </p>

            <div className="mt-4">
              <ClaimForm
                listingId={listing.id}
                projectTag={listing.project_tag}
                listingTitle={title}
              />
            </div>
          </div>
        </div>

        <div className="mt-10">
          <Link href="/" className="text-sm text-indigo-900 hover:underline">
            ← Back to directories
          </Link>
        </div>
      </div>
    </div>
  );
}
