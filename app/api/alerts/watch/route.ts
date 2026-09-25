// POST /api/alerts/watch — "Email me new deals" for one store or one city.
// Saves an inactive watch row (lib/dealWatch.ts) and sends a confirm email.
// Nothing is ever sent to the address until the confirm link is clicked.
//
// Body (JSON): { email, kind: "store"|"city", slug?, city?, categories?, min_discount?, website? (honeypot) }
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { brand } from "@/lib/brand";
import { rateLimited, clientKey } from "@/lib/rateLimit";
import { CENTRAL_IL_PUBLIC_CITIES } from "@/lib/constants/regions";
import { isInCentralIL } from "@/lib/visibility";
import { saveWatch, confirmUrl, WATCH_CATEGORIES } from "@/lib/dealWatch";
import { renderConfirmEmail, alertsFrom } from "@/lib/dealAlertEmail";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const CAT_LABEL: Record<string, string> = { flower: "flower", edibles: "edibles", vapes: "vapes", concentrate: "concentrates" };

async function findStore(slug: string): Promise<{ slug: string; name: string; city: string } | null> {
  if (!/^[a-z0-9-]{2,120}$/.test(slug)) return null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?select=slug,name,city&project_tag=eq.green&is_active=eq.true&slug=eq.${slug}&limit=1`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, cache: "no-store" }
    );
    if (!r.ok) return null;
    const row = ((await r.json()) as Array<{ slug: string; name: string | null; city: string | null }>)[0];
    if (!row || !isInCentralIL(row.city)) return null;
    return { slug: row.slug, name: row.name || row.slug, city: row.city || "" };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (b.website) return NextResponse.json({ ok: true, status: "pending" }); // honeypot
  if (rateLimited(`watch:${clientKey(req.headers)}`, 6, 10 * 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many tries. Give it a few minutes." }, { status: 429 });
  }
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) {
    return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
  }

  let what = "";
  let saved;
  if (b.kind === "store") {
    const store = await findStore(String(b.slug || ""));
    if (!store) return NextResponse.json({ ok: false, error: "We couldn't find that store." }, { status: 400 });
    what = `at ${store.name}`;
    saved = await saveWatch({ kind: "store", email, slug: store.slug, city: store.city });
  } else if (b.kind === "city") {
    const cityIn = String(b.city || "").trim().toLowerCase().replace(/-/g, " ");
    const city = CENTRAL_IL_PUBLIC_CITIES.find((c) => c.name.toLowerCase() === cityIn);
    if (!city) return NextResponse.json({ ok: false, error: "Pick a Central Illinois city." }, { status: 400 });
    const cats = (Array.isArray(b.categories) ? b.categories : [])
      .filter((c): c is string => typeof c === "string" && (WATCH_CATEGORIES as readonly string[]).includes(c));
    const md = Number(b.min_discount);
    const minDiscount = Number.isFinite(md) && md > 0 && md <= 90 ? Math.round(md) : null;
    const catWords = cats.length ? ` (${cats.map((c) => CAT_LABEL[c] || c).join(", ")})` : "";
    what = `in ${city.name}${catWords}${minDiscount ? `, ${minDiscount}% off or more` : ""}`;
    saved = await saveWatch({ kind: "city", email, city: city.name, categories: cats, minDiscount });
  } else {
    return NextResponse.json({ ok: false, error: "Pick a store or a city." }, { status: 400 });
  }

  if (!saved.ok) {
    console.error(`[alerts/watch] save failed: ${saved.reason}`);
    return NextResponse.json({ ok: false, error: "That didn't save. Try again in a minute." }, { status: 502 });
  }
  if (!saved.needsConfirm) return NextResponse.json({ ok: true, status: "active" });

  if (!process.env.RESEND_API_KEY) {
    console.error("[alerts/watch] RESEND_API_KEY not set; confirm email not sent");
    return NextResponse.json({ ok: false, error: "We couldn't send the confirm email just now. Try again later." }, { status: 503 });
  }
  const m = renderConfirmEmail({ what, confirmUrl: confirmUrl(brand.url, saved.row.id) });
  try {
    const r = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: alertsFrom(),
      to: email,
      replyTo: brand.supportEmail,
      subject: m.subject,
      html: m.html,
      text: m.text,
    });
    if ((r as { error?: unknown }).error) throw new Error(JSON.stringify((r as { error?: unknown }).error).slice(0, 200));
  } catch (e) {
    console.error("[alerts/watch] confirm send failed", String(e).slice(0, 200));
    return NextResponse.json({ ok: false, error: "We couldn't send the confirm email just now. Try again later." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, status: "pending" });
}
