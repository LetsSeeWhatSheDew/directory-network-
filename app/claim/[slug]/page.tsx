import Link from "next/link";
import ClaimForm from "./ClaimForm";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

async function getListing(slug: string) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?select=slug,name,city&slug=eq.${encodeURIComponent(slug)}&limit=1`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data[0] ? data[0] : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  const name = listing?.name || slug;
  return {
    title: `Claim ${name} | PuffPrice`,
    description: `Dispensary owner? Claim your PuffPrice listing for ${name} and take control of your deals.`,
    robots: { index: false, follow: true },
  };
}

export default async function ClaimPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  const displayName = listing?.name || slug;
  const city = listing?.city || "Illinois";

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#0f1f3d;position:sticky;top:0;z-index:100}
        .logo{color:#fff;text-decoration:none;font-weight:700}
        .logo span{color:#4ade80}
        .back{font-size:.82rem;color:rgba(255,255,255,.55);text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#fff}
        .wrap{max-width:600px;margin:0 auto;padding:40px 20px}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:10px}
        h1{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:700;letter-spacing:-.03em;line-height:1.1;margin-bottom:6px}
        .city{font-size:.88rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:24px}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">puff<span>price</span></Link>
        <Link href={`/l/${slug}`} className="back">← Back to listing</Link>
      </nav>

      <div className="wrap">
        <div className="eyebrow">Claim listing</div>
        <h1>Claim {displayName}</h1>
        <div className="city">{city}, IL</div>
        <ClaimForm slug={slug} />
      </div>
    </>
  );
}
