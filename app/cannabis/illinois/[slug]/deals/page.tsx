// app/cannabis/illinois/[slug]/deals/page.tsx
// City-level deals page — "Best dispensary deals in [City], IL today"
// Queries the active_deals_with_listings view and filters by city.

import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { getCityContent } from "@/lib/cityContent";
import { CitySeoSection } from "@/components/CitySeoSection";

// Generate static metadata per city for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cityName = slugToCity(slug);
  return {
    title: `Best dispensary deals in ${cityName}, IL | PuffPrice`,
    description: `Live cannabis deals at ${cityName} dispensaries. Compare discounts, prices, and savings — updated daily.`,
    alternates: { canonical: `https://www.puffprice.com/cannabis/illinois/${slug}/deals` },
  };
}

function slugToCity(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

type Deal = {
  deal_id: string;
  deal_title: string;
  deal_description: string | null;
  category: string;
  discount_type: string | null;
  discount_value: number | null;
  original_price: number | null;
  sale_price: number | null;
  unit: string | null;
  slug: string;
  name: string;
  city: string;
  google_rating: number;
  review_count: number;
  accepts_credit: boolean;
  drive_thru: boolean;
  delivery: boolean;
  plan: string;
  savings_amount: number;
  savings_percent: number | null;
  expires_at: string | null;
  is_recurring: boolean;
  recurring_days: string | null;
};

export default async function CityDealsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cityName = slugToCity(slug);

  // Instantiate at request time, not at module-evaluation. Throwing
  // inside the query body is caught below so a misconfigured env
  // renders the graceful empty state rather than a 500.
  let dealList: Deal[] = [];
  try {
    const supabase = getSupabase();
    const { data: deals, error } = await supabase
      .from("active_deals_with_listings")
      .select("*")
      .ilike("city", cityName)
      .order("plan", { ascending: false }) // featured first
      .order("savings_amount", { ascending: false });

    if (error) {
      console.error("[city-deals] query error:", error);
    } else if (Array.isArray(deals)) {
      dealList = deals as Deal[];
    }
  } catch (err) {
    console.error("[city-deals] supabase exception:", err);
  }
  const content = getCityContent(slug);

  // If we have neither deals nor city copy, render a graceful empty state
  // but don't 404 — city may simply have no deals today.
  if (!content && dealList.length === 0) {
    return (
      <EmptyState cityName={cityName} slug={slug} />
    );
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#f5f4f0", minHeight: "100vh", color: "#0f1f3d" }}>
      <nav style={{ padding: "14px 28px", background: "#0f1f3d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "1.15rem" }}>
          puff<span style={{ color: "#4ade80" }}>price</span>
        </Link>
        <Link href={`/cannabis/illinois/${slug}`} style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: ".85rem", fontFamily: "system-ui, sans-serif" }}>
          All {cityName} dispensaries
        </Link>
      </nav>

      <header style={{ background: "#0f1f3d", color: "#fff", padding: "48px 28px", textAlign: "center" }}>
        <p style={{ fontSize: ".7rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#4ade80", fontFamily: "system-ui, sans-serif", fontWeight: 700, marginBottom: 8 }}>
          Live deals · {cityName}, IL
        </p>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.03em", marginBottom: 10 }}>
          Best dispensary deals in <em style={{ color: "#4ade80", fontStyle: "normal" }}>{cityName}</em>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontFamily: "system-ui, sans-serif", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
          {dealList.length} active {dealList.length === 1 ? "deal" : "deals"} today.
          Updated continuously from dispensary sources.
        </p>
      </header>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "44px 28px" }}>
        {dealList.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {dealList.map((d) => (
              <DealCard key={d.deal_id} deal={d} slug={slug} />
            ))}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#6b7280", fontFamily: "system-ui, sans-serif", padding: "40px 0" }}>
            No deals posted in {cityName} today. Check back tomorrow or{" "}
            <Link href="/alerts" style={{ color: "#16a34a" }}>get text alerts</Link>.
          </p>
        )}
      </section>

      {content && <CitySeoSection content={content} />}

      <footer style={{ background: "#0f1f3d", padding: "20px 28px", textAlign: "center" }}>
        <span style={{ color: "#fff", fontSize: ".9rem" }}>
          puff<span style={{ color: "#4ade80" }}>price</span>
        </span>
      </footer>
    </div>
  );
}

function DealCard({ deal, slug }: { deal: Deal; slug: string }) {
  const featured = deal.plan === "featured";
  return (
    <article style={{
      background: featured ? "linear-gradient(135deg, #f0fdf4 0%, #fff 60%)" : "#fff",
      border: featured ? "2px solid #16a34a" : "1px solid #e8e4da",
      borderRadius: 14,
      padding: 18,
      position: "relative",
    }}>
      {featured && (
        <div style={{
          position: "absolute", top: -10, left: 16,
          background: "#16a34a", color: "#fff",
          fontSize: ".68rem", fontFamily: "system-ui, sans-serif",
          fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
          padding: "3px 10px", borderRadius: 100,
        }}>
          Featured
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <Link href={`/l/${deal.slug}`} style={{ textDecoration: "none", color: "#0f1f3d" }}>
            <div style={{ fontSize: ".95rem", fontWeight: 700 }}>{deal.name}</div>
          </Link>
          <div style={{ fontSize: ".75rem", color: "#9ca3af", fontFamily: "system-ui, sans-serif", marginTop: 2 }}>
            {deal.city}, IL
          </div>
        </div>
        {deal.google_rating > 0 && (
          <span style={{ fontSize: ".72rem", color: "#6b7280", fontFamily: "system-ui, sans-serif" }}>
            {deal.google_rating.toFixed(1)} ★
          </span>
        )}
      </div>

      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#16a34a", marginBottom: 6 }}>
        {deal.deal_title}
      </div>

      {deal.deal_description && (
        <p style={{ fontSize: ".82rem", color: "#6b7280", fontFamily: "system-ui, sans-serif", marginBottom: 12, lineHeight: 1.5 }}>
          {deal.deal_description}
        </p>
      )}

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={chip}>{deal.category}</span>
        {deal.is_recurring && <span style={chip}>Recurring</span>}
        {deal.drive_thru && <span style={chip}>Drive-thru</span>}
        {deal.accepts_credit && <span style={chip}>Cards OK</span>}
        {deal.delivery && <span style={chip}>Delivery</span>}
      </div>

      {deal.savings_amount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#f0fdf4", borderRadius: 8, padding: "8px 12px",
        }}>
          <span style={{ fontSize: ".75rem", color: "#166534", fontFamily: "system-ui, sans-serif" }}>
            You save
          </span>
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#16a34a" }}>
            ${deal.savings_amount.toFixed(2)}
          </span>
        </div>
      )}
    </article>
  );
}

const chip: React.CSSProperties = {
  fontSize: ".68rem",
  color: "#6b7280",
  background: "#f5f4f0",
  borderRadius: 100,
  padding: "2px 9px",
  fontFamily: "system-ui, sans-serif",
};

function EmptyState({ cityName, slug }: { cityName: string; slug: string }) {
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#f5f4f0", minHeight: "100vh", padding: "60px 28px", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 12 }}>No deals yet in {cityName}</h1>
      <p style={{ color: "#6b7280", fontFamily: "system-ui, sans-serif", marginBottom: 20 }}>
        We&apos;re still pulling dispensary deals for this city. Check back soon.
      </p>
      <Link href={`/cannabis/illinois/${slug}`} style={{ color: "#16a34a", fontWeight: 600 }}>
        See {cityName} dispensaries →
      </Link>
    </div>
  );
}
