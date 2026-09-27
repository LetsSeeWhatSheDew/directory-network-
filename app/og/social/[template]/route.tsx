// GET /og/social/[template] — the daily social images, from live data.
//   template: saving | city | index | cheapest | law | drive-thru
//   ?size=feed (1080×1350, default) | story (1080×1920)
//   ?theme=day (default) | night
//   ?city=<slug>   (city roundup; default: the city with the most stores discounting)
//   ?fact=<id>     (law card; default: today's rotation, lib/social/laws.ts)
//   ?download=1    (sends it as a file attachment)
// Picked up and captioned on the private /social page. Same data as the
// public pages; if the data can't be read the image says so, never a number.
import { ImageResponse } from "next/og";
import { loadFonts } from "../../shared";
import { getTemplateData } from "../../../../lib/social/data";
import { SOCIAL_SIZES, SOCIAL_TEMPLATES, type SocialData, type SocialSize, type SocialTemplate } from "../../../../lib/social/types";
import { ctDay } from "../../../../lib/social/time";
import { CheapestCard, CityCard, DriveThruCard, IndexCard, LawCard, SavingCard } from "../templates";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ template: string }> }) {
  const { template } = await ctx.params;
  if (!SOCIAL_TEMPLATES.includes(template as SocialTemplate)) return new Response("Not found", { status: 404 });
  const t = template as SocialTemplate;
  const u = new URL(req.url);
  const size: SocialSize = u.searchParams.get("size") === "story" ? "story" : "feed";
  const night = u.searchParams.get("theme") === "night";
  const city = u.searchParams.get("city");
  const fact = u.searchParams.get("fact");
  const [W, H] = SOCIAL_SIZES[size];

  const [fonts, data] = await Promise.all([loadFonts(), getTemplateData(t, { city, fact })]);
  const p = { size, night };
  const el = (() => {
    switch (t) {
      case "saving": return <SavingCard d={data as SocialData["saving"]} {...p} />;
      case "city": return <CityCard d={data as SocialData["city"]} {...p} />;
      case "index": return <IndexCard d={data as SocialData["index"]} {...p} />;
      case "cheapest": return <CheapestCard d={data as SocialData["cheapest"]} {...p} />;
      case "law": return <LawCard d={data as SocialData["law"]} {...p} />;
      case "drive-thru": return <DriveThruCard d={data as SocialData["drive-thru"]} {...p} />;
    }
  })();

  const headers: Record<string, string> = {
    // Short cache so the image and the /social caption come from the same read.
    "Cache-Control": data.postable ? "public, max-age=0, s-maxage=900, stale-while-revalidate=300" : "public, max-age=0, s-maxage=60",
    "X-Robots-Tag": "noindex",
  };
  if (u.searchParams.get("download") === "1") {
    const extra = t === "city" && "citySlug" in data ? `-${data.citySlug}` : t === "law" && "fact" in data ? `-${data.fact.id}` : "";
    headers["Content-Disposition"] = `attachment; filename="puffprice-${t}${extra}-${ctDay()}-${size}-${night ? "night" : "day"}.png"`;
  }
  return new ImageResponse(el, { width: W, height: H, fonts, headers });
}
