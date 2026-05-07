// scripts/scrapers/detect-platforms.ts
//
// One-time setup helper. Pulls the top 10 Central IL dispensaries from
// Supabase, fetches their websites, and detects whether each is running
// Dutchie / Leafly / iHeartJane embedded menus. Writes the result to
// scripts/scrapers/dispensaries.json.
//
// CLI:
//   npm run scrape:detect

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fetchHtml } from "./http";
import { DispensaryConfig, Platform } from "./types";

const CITY_SCOPE = [
  "Peoria",
  "Peoria Heights",
  "Bloomington",
  "Normal",
  "Champaign",
  "Urbana",
  "Springfield",
  "Decatur",
  "Pekin",
  "Galesburg",
];

type ListingRow = {
  slug: string;
  name: string;
  city: string;
  website: string | null;
};

function detectFromHtml(
  html: string,
  baseHost: string
): { platform: Platform; menu_url: string | null } {
  const dutchieEmbedded = html.match(
    /https?:\/\/dutchie\.com\/(?:embedded-menu|dispensary)\/([\w-]+)/i
  );
  if (dutchieEmbedded) {
    const slug = dutchieEmbedded[1];
    return {
      platform: "dutchie",
      menu_url: `https://dutchie.com/embedded-menu/${slug}/specials`,
    };
  }
  const dutchieIframe = html.match(
    /<iframe[^>]+src=["']([^"']*dutchie\.com\/[^"']*)["']/i
  );
  if (dutchieIframe) {
    const u = dutchieIframe[1];
    return { platform: "dutchie", menu_url: u };
  }

  const leafly = html.match(
    /https?:\/\/(?:www\.)?leafly\.com\/dispensary-info\/([\w-]+)/i
  );
  if (leafly) {
    return {
      platform: "leafly",
      menu_url: `https://www.leafly.com/dispensary-info/${leafly[1]}/deals`,
    };
  }

  const jane = html.match(
    /https?:\/\/(?:www\.)?iheartjane\.com\/(?:embed|stores)\/([\w-]+)/i
  );
  if (jane) {
    return {
      platform: "iheartjane",
      menu_url: `https://www.iheartjane.com/stores/${jane[1]}/specials`,
    };
  }

  return { platform: "generic", menu_url: `https://${baseHost}/deals` };
}

async function detectOne(row: ListingRow): Promise<DispensaryConfig> {
  if (!row.website) {
    return {
      slug: row.slug,
      name: row.name,
      city: row.city,
      platform: "generic",
      menu_url: null,
      deals_url: null,
      selectors: null,
    };
  }
  let host = "";
  try {
    host = new URL(row.website).host;
  } catch {
    /* leave host blank */
  }
  try {
    const html = await fetchHtml(row.website);
    const { platform, menu_url } = detectFromHtml(html, host);
    return {
      slug: row.slug,
      name: row.name,
      city: row.city,
      platform,
      menu_url,
      deals_url: row.website,
      selectors: null,
    };
  } catch (err) {
    console.error(`[${row.slug}] detect failed: ${(err as Error).message}`);
    return {
      slug: row.slug,
      name: row.name,
      city: row.city,
      platform: "generic",
      menu_url: null,
      deals_url: row.website,
      selectors: null,
    };
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "detect-platforms: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    );
  }
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: listings, error } = await client
    .from("master_listings")
    .select("slug, name, city, website")
    .eq("project_tag", "green")
    .eq("is_active", true)
    .eq("type", "dispensary")
    .in("city", CITY_SCOPE)
    .not("website", "is", null);

  if (error) {
    throw new Error(`detect-platforms: query failed: ${error.message}`);
  }

  // Order by deal count desc so the top 10 are the ones with the most
  // existing deals (proxy for "most likely to have specials worth
  // scraping"). Fall back to alphabetic name.
  const slugs = (listings ?? []).map((l) => l.slug);
  const { data: dealCounts } = slugs.length
    ? await client
        .from("deals")
        .select("listing_slug")
        .in("listing_slug", slugs)
    : { data: [] as { listing_slug: string }[] };

  const countBySlug = new Map<string, number>();
  for (const d of dealCounts ?? []) {
    countBySlug.set(d.listing_slug, (countBySlug.get(d.listing_slug) ?? 0) + 1);
  }

  const ranked = (listings ?? [])
    .slice()
    .sort((a, b) => {
      const ca = countBySlug.get(a.slug) ?? 0;
      const cb = countBySlug.get(b.slug) ?? 0;
      if (cb !== ca) return cb - ca;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 10);

  console.log(`detected ${ranked.length} dispensaries; probing each...`);
  const out: DispensaryConfig[] = [];
  for (const row of ranked) {
    const cfg = await detectOne({
      slug: row.slug,
      name: row.name,
      city: row.city,
      website: row.website,
    });
    console.log(`[${cfg.slug}] platform=${cfg.platform} menu_url=${cfg.menu_url ?? "—"}`);
    out.push(cfg);
  }

  const dest = join(process.cwd(), "scripts/scrapers/dispensaries.json");
  writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf-8");
  console.log(`wrote ${out.length} entries to ${dest}`);
}

main().catch((err) => {
  console.error("detect-platforms crashed:", err);
  process.exit(1);
});
