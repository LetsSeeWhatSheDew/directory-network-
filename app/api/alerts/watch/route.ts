// POST /api/alerts/watch — "Email me new deals" for one store or one city,
// "email me when it drops" for one menu item at one store, or "email me the
// morning of" a sale day. Saves an inactive watch row (lib/dealWatch.ts) and
// sends a confirm email. Nothing is ever sent to the address until the
// confirm link is clicked.
//
// Body (JSON): { email, kind: "store"|"city"|"price"|"event"|"law", slug?, city?, categories?, min_discount?,
//                item? (price: eighth|cart_1g|gummies_100mg), max_price? (price, dollars), event? (event id),
//                website? (honeypot) }
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { brand } from "@/lib/brand";
import { rateLimited, clientKey } from "@/lib/rateLimit";
import { CENTRAL_IL_PUBLIC_CITIES } from "@/lib/constants/regions";
import { isInCentralIL } from "@/lib/visibility";
import { saveWatch, confirmUrl, WATCH_CATEGORIES } from "@/lib/dealWatch";
import { renderConfirmEmail, alertsFrom } from "@/lib/dealAlertEmail";
import { getCheapestBoard } from "@/lib/menuPrices";
import { isRefUnit, itemWords, parseCeiling, toCents, fromCents } from "@/lib/priceWatch";
import { eventById, daysUntil } from "@/lib/events";
import { CENTRAL_IL_CITIES } from "@/lib/constants/regions";

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
  // At most 3 watch sign-ups per address per 10 minutes (each can send a
  // confirm email), so this form can't be used to flood someone's inbox.
  if (rateLimited(`watch-email:${email}`, 3, 10 * 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many tries. Give it a few minutes." }, { status: 429 });
  }

  let what = "";
  let ask: string | undefined;
  let after: string | undefined;
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
  } else if (b.kind === "price") {
    const store = await findStore(String(b.slug || ""));
    if (!store) return NextResponse.json({ ok: false, error: "We couldn't find that store." }, { status: 400 });
    if (!isRefUnit(b.item)) return NextResponse.json({ ok: false, error: "Pick an eighth, a 1g cart or 100mg gummies." }, { status: 400 });
    const item = b.item;
    // The reference price is today's real menu price; no fresh price, no watch.
    const board = await getCheapestBoard();
    const now = board.byRef[item].find((i) => i.listingSlug === store.slug);
    if (!now) return NextResponse.json({ ok: false, error: "We don't have a fresh menu price for that at this store right now. Try again after the next menu read." }, { status: 400 });
    const maxCents = parseCeiling(b.max_price);
    const refCents = toCents(now.otd);
    what = `on the cheapest ${itemWords(item)} at ${store.name}`;
    ask = "email me when the price drops";
    after = `one short email when the cheapest ${itemWords(item)} at ${store.name} drops below ${fromCents(refCents)} out the door${maxCents != null ? ` and is ${fromCents(maxCents)} or less` : ""}. We read the store's own menu twice a day. No drop, no email.`;
    saved = await saveWatch({ kind: "price", email, slug: store.slug, city: store.city, item, refCents, maxCents });
  } else if (b.kind === "event") {
    const ev = eventById(typeof b.event === "string" ? b.event : "");
    if (!ev) return NextResponse.json({ ok: false, error: "Pick a sale day." }, { status: 400 });
    // The sale-day email goes out that morning, so sign-ups close the day before.
    if (daysUntil(ev) <= 0) return NextResponse.json({ ok: false, error: daysUntil(ev) === 0 ? `${ev.name} is today. Everything's on ${brand.url}${ev.path}.` : `${ev.name} has already passed.` }, { status: 400 });
    const cityIn = String(b.city || "").trim().toLowerCase().replace(/-/g, " ");
    const city = cityIn ? CENTRAL_IL_CITIES.find((c) => c.name.toLowerCase() === cityIn) || null : null;
    if (cityIn && !city) return NextResponse.json({ ok: false, error: "Pick a Central Illinois city." }, { status: 400 });
    what = `the morning of ${ev.name} (${ev.dateLabel})`;
    ask = "email me";
    after = `one email the morning of ${ev.name} with the best deals we find${city ? ` near ${city.name}` : " in Central Illinois"}. Just that one.`;
    saved = await saveWatch({ kind: "event", email, event: ev.id, city: city ? city.name : null });
  } else if (b.kind === "law") {
    const cityIn = String(b.city || "").trim().toLowerCase().replace(/-/g, " ");
    const city = cityIn ? CENTRAL_IL_CITIES.find((c) => c.name.toLowerCase() === cityIn) || null : null;
    if (cityIn && !city) return NextResponse.json({ ok: false, error: "Pick a Central Illinois city." }, { status: 400 });
    what = "in Illinois";
    ask = "email me when the law changes";
    after = "a short email when an Illinois or Central Illinois law changes what you can buy, where, or how: drive-thrus, hemp, possession limits, taxes, delivery. And a heads-up the day a change takes effect. A few times a year, not a newsletter.";
    saved = await saveWatch({ kind: "law", email, city: city ? city.name : null });
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
  const m = renderConfirmEmail({ what, ask, after, confirmUrl: confirmUrl(brand.url, saved.row.id) });
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
