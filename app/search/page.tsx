import Link from "next/link";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

export const dynamic = "force-dynamic";

type Listing = {
  id?: string;
  slug: string;
  name: string;
  city?: string;
  address1?: string;
  short_description?: string;
};

type Deal = {
  deal_id: string;
  listing_slug: string;
  deal_title: string;
  category: string;
  discount_value?: number;
  discount_unit?: string;
};

function orFilter(q: string) {
  const safe = q.replace(/[(),]/g, "").trim();
  const esc = safe.replace(/%/g, "\\%");
  return `or=(name.ilike.*${esc}*,city.ilike.*${esc}*,address1.ilike.*${esc}*)`;
}

async function searchListings(q: string): Promise<Listing[]> {
  if (!q) return [];
  try {
    const url = `${SUPABASE_URL}/rest/v1/master_listings?select=id,slug,name,city,address1,short_description&${orFilter(q)}&project_tag=eq.green&limit=30`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function dealsForSlugs(slugs: string[]): Promise<Record<string, Deal[]>> {
  if (slugs.length === 0) return {};
  try {
    const inList = slugs.map((s) => `"${s}"`).join(",");
    const url = `${SUPABASE_URL}/rest/v1/deals?select=id,listing_slug,title,category,discount_value,discount_unit&listing_slug=in.(${inList})&is_active=eq.true&project_tag=eq.green&limit=100`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return {};
    const data = await res.json();
    const grouped: Record<string, Deal[]> = {};
    for (const d of data || []) {
      const s = d.listing_slug;
      if (!s) continue;
      (grouped[s] ||= []).push({
        deal_id: d.id,
        listing_slug: s,
        deal_title: d.title,
        category: d.category,
        discount_value: d.discount_value,
        discount_unit: d.discount_unit,
      });
    }
    return grouped;
  } catch {
    return {};
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  return {
    title: query
      ? `Search results for "${query}" | CleanList`
      : "Search | CleanList",
    description: query
      ? `Illinois cannabis dispensaries matching "${query}".`
      : "Search Illinois cannabis dispensaries.",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const listings = query ? await searchListings(query) : [];
  const dealMap = await dealsForSlugs(listings.map((l) => l.slug));

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#0f1f3d;position:sticky;top:0;z-index:100}
        .logo{display:flex;align-items:center;gap:8px;color:#fff;text-decoration:none;font-weight:700}
        .logo span{color:#4ade80}
        .back{font-size:.82rem;color:rgba(255,255,255,.55);text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#fff}
        .wrap{max-width:800px;margin:0 auto;padding:40px 20px}
        h1{font-size:clamp(1.4rem,3vw,1.9rem);font-weight:700;letter-spacing:-.03em;margin-bottom:6px}
        .sub{font-size:.88rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:24px}
        form{display:flex;gap:8px;background:#fff;border:1px solid #e8e4da;border-radius:10px;padding:6px;margin-bottom:24px}
        input[type=search]{flex:1;border:none;outline:none;background:transparent;padding:10px 12px;font-family:system-ui,sans-serif;font-size:.95rem;color:#0f1f3d;min-width:0}
        input[type=search]::placeholder{color:#9ca3af}
        .sbtn{background:#0f1f3d;color:#fff;border:none;border-radius:7px;padding:0 18px;font-family:system-ui,sans-serif;font-weight:600;font-size:.9rem;cursor:pointer}
        .sbtn:hover{background:#1e3a5f}
        .cards{display:flex;flex-direction:column;gap:10px}
        .card{background:#fff;border:1px solid #e8e4da;border-radius:12px;padding:16px;text-decoration:none;color:inherit;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;transition:border-color .15s}
        .card:hover{border-color:#16a34a}
        .cname{font-size:1rem;font-weight:700;color:#0f1f3d}
        .ccity{font-size:.78rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-top:2px}
        .cdesc{font-size:.82rem;color:#6b7280;font-family:system-ui,sans-serif;margin-top:6px;line-height:1.5}
        .cdeals{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
        .cdeal{font-size:.72rem;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:100px;padding:2px 9px;font-family:system-ui,sans-serif}
        .empty{background:#fff;border:1px solid #e8e4da;border-radius:12px;padding:32px 20px;text-align:center}
        .empty-title{font-size:1rem;font-weight:700;margin-bottom:6px}
        .empty-sub{font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">clean<span>list</span></Link>
        <Link href="/" className="back">← Home</Link>
      </nav>

      <div className="wrap">
        <h1>
          {query ? <>Search results for &ldquo;{query}&rdquo;</> : "Search dispensaries"}
        </h1>
        <p className="sub">
          {query && listings.length > 0
            ? `${listings.length} dispensar${listings.length === 1 ? "y" : "ies"} found`
            : "Enter a city, zip code, or dispensary name below."}
        </p>

        <form action="/search" method="get" role="search">
          <input type="search" name="q" defaultValue={query} placeholder="Search city, zip code, or dispensary name…" autoComplete="off" />
          <button type="submit" className="sbtn">Search</button>
        </form>

        {query && listings.length === 0 && (
          <div className="empty">
            <div className="empty-title">No dispensaries found for &ldquo;{query}&rdquo;</div>
            <div className="empty-sub">Try a city name like &ldquo;Peoria&rdquo; or &ldquo;Chicago&rdquo;.</div>
          </div>
        )}

        {listings.length > 0 && (
          <div className="cards">
            {listings.map((l) => {
              const ds = dealMap[l.slug] || [];
              return (
                <Link key={l.id || l.slug} href={`/l/${l.slug}`} className="card">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cname">{l.name}</div>
                    <div className="ccity">{[l.city, "IL"].filter(Boolean).join(", ")}</div>
                    {l.short_description && <div className="cdesc">{l.short_description}</div>}
                    {ds.length > 0 && (
                      <div className="cdeals">
                        {ds.slice(0, 3).map((d) => (
                          <span key={d.deal_id} className="cdeal">{d.deal_title}</span>
                        ))}
                        {ds.length > 3 && <span className="cdeal">+{ds.length - 3} more</span>}
                      </div>
                    )}
                  </div>
                  <span style={{ color: "#9ca3af", fontFamily: "system-ui, sans-serif", fontSize: ".85rem" }}>→</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
